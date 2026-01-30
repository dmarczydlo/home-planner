import { config } from "dotenv";
import { test as setup, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Session, User } from "@supabase/supabase-js";

config();

const AUTH_FILE = ".auth/user.json";
const TEST_GOOGLE_EMAIL = process.env.TEST_GOOGLE_EMAIL || "e2e-test@example.com";
const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseStorageKey(supabaseUrl: string): string {
  const urlWithoutProtocol = supabaseUrl.split("
  const projectRef = urlWithoutProtocol.split(".")[0];
  return `sb-${projectRef}-auth-token`;
}

async function createOrGetTestUser(supabaseAdmin: SupabaseClient, email: string): Promise<User> {
  const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

  if (!listError && usersData?.users) {
    const existingUser = usersData.users.find((user: User) => user.email === email);
    if (existingUser) {
      console.log(`✅ Found existing user: ${email}`);
      return existingUser;
    }
  }

  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: "E2E Test User",
      provider: "google",
    },
  });

  if (createError || !newUser?.user) {
    if (createError?.message?.includes("already registered") || createError?.message?.includes("already exists")) {
      const { data: retryUsersData } = await supabaseAdmin.auth.admin.listUsers();
      if (retryUsersData?.users) {
        const foundUser = retryUsersData.users.find((user: User) => user.email === email);
        if (foundUser) {
          console.log(`✅ Found existing user (retry): ${email}`);
          return foundUser;
        }
      }
    }
    throw new Error(`Failed to create or get test user: ${createError?.message || "Unknown error"}`);
  }

  console.log(`✅ Created new test user: ${email}`);
  return newUser.user;
}

async function generateSessionForUser(
  supabaseAdmin: SupabaseClient,
  supabaseAnon: SupabaseClient,
  email: string
): Promise<Session> {
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email: email,
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    throw new Error(`Failed to generate magic link: ${linkError?.message || "Unknown error"}`);
  }

  const { data: sessionData, error: verifyError } = await supabaseAnon.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "magiclink",
  });

  if (verifyError || !sessionData?.session) {
    throw new Error(`Failed to verify magic link: ${verifyError?.message || "Unknown error"}`);
  }

  return sessionData.session;
}

async function injectSessionIntoBrowser(page: Page, session: Session, storageKey: string): Promise<void> {
  await page.goto("/");

  await page.evaluate(
    (args: { session: Session; storageKey: string }) => {
      localStorage.setItem(args.storageKey, JSON.stringify(args.session));
    },
    { session, storageKey }
  );

  await page.reload();
  await page.waitForLoadState("networkidle");
}

setup("authenticate", async ({ page }) => {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY environment variable is required. " +
        "Set it to your Supabase service role key (found in Supabase dashboard > Settings > API)"
    );
  }

  if (!SUPABASE_URL) {
    throw new Error(
      "PUBLIC_SUPABASE_URL or SUPABASE_URL environment variable is required. " + "Set it to your Supabase project URL"
    );
  }

  if (!SUPABASE_ANON_KEY) {
    throw new Error(
      "PUBLIC_SUPABASE_ANON_KEY or SUPABASE_KEY environment variable is required. " + "Set it to your Supabase anon key"
    );
  }

  console.log(`🔐 Starting API-based authentication for: ${TEST_GOOGLE_EMAIL}`);

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    const user = await createOrGetTestUser(supabaseAdmin, TEST_GOOGLE_EMAIL);

    console.log(`✅ User ready: ${user.email} (${user.id})`);

    const session = await generateSessionForUser(supabaseAdmin, supabaseAnon, TEST_GOOGLE_EMAIL);
    const expiresAt = session.expires_at ? new Date(session.expires_at * 1000).toISOString() : "unknown";
    console.log(`✅ Session generated (expires at: ${expiresAt})`);

    const storageKey = getSupabaseStorageKey(SUPABASE_URL);

    console.log(`✅ Using storage key: xxxxxx`);

    await injectSessionIntoBrowser(page, session, storageKey);

    await page.goto("/calendar/week");
    await page.waitForLoadState("networkidle");

    const isAuthenticated =
      (await page
        .locator('[data-testid="user-menu"], [data-testid="logout-button"], [data-testid="calendar-view"]')
        .first()
        .isVisible()
        .catch(() => false)) || !page.url().includes("/auth/login");

    if (!isAuthenticated) {
      throw new Error(`Authentication verification failed. Current URL: ${page.url()}`);
    }

    console.log(`✅ Authentication verified on: ${page.url()}`);

    await page.context().storageState({ path: AUTH_FILE });

    console.log(`✅ Authentication successful. Storage state saved to ${AUTH_FILE}`);
  } catch (error) {
    console.error("❌ Authentication failed:", error);
    throw error;
  }
});
