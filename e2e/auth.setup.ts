import { config } from "dotenv";
import { test as setup, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Session, User } from "@supabase/supabase-js";

// Load environment variables from .env file
config();

const AUTH_FILE = ".auth/user.json";
const TEST_GOOGLE_EMAIL = process.env.TEST_GOOGLE_EMAIL || "e2e-test@example.com";
const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Get Supabase storage key format
 * Format: sb-{project-ref}-auth-token
 */
function getSupabaseStorageKey(supabaseUrl: string): string {
  const urlWithoutProtocol = supabaseUrl.split("//")[1];
  const projectRef = urlWithoutProtocol.split(".")[0];
  return `sb-${projectRef}-auth-token`;
}

/**
 * Create or get test user using service role key
 */
async function createOrGetTestUser(supabaseAdmin: SupabaseClient, email: string): Promise<User> {
  // Try to get existing user first by listing users and filtering by email
  const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

  if (!listError && usersData?.users) {
    const existingUser = usersData.users.find((user: User) => user.email === email);
    if (existingUser) {
      console.log(`✅ Found existing user: ${email}`);
      return existingUser;
    }
  }

  // Create new user if doesn't exist
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: "E2E Test User",
      provider: "google",
    },
  });

  if (createError || !newUser?.user) {
    // If user already exists (error during creation), try to find it again
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

/**
 * Generate session for user via magic link
 */
async function generateSessionForUser(
  supabaseAdmin: SupabaseClient,
  supabaseAnon: SupabaseClient,
  email: string
): Promise<Session> {
  // Generate magic link
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email: email,
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    throw new Error(`Failed to generate magic link: ${linkError?.message || "Unknown error"}`);
  }

  // Verify magic link to get session
  const { data: sessionData, error: verifyError } = await supabaseAnon.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "magiclink",
  });

  if (verifyError || !sessionData?.session) {
    throw new Error(`Failed to verify magic link: ${verifyError?.message || "Unknown error"}`);
  }

  return sessionData.session;
}

/**
 * Inject session into browser localStorage
 */
async function injectSessionIntoBrowser(page: Page, session: Session, storageKey: string): Promise<void> {
  // Navigate to app root
  await page.goto("/");

  // Inject session into localStorage
  await page.evaluate(
    (args: { session: Session; storageKey: string }) => {
      localStorage.setItem(args.storageKey, JSON.stringify(args.session));
    },
    { session, storageKey }
  );

  // Reload page to apply session
  await page.reload();
  await page.waitForLoadState("networkidle");
}

/**
 * Authentication setup test
 *
 * This test authenticates using Supabase service role key and saves the storage state.
 * The saved state is then reused in all other tests, avoiding the need to authenticate
 * for each test run.
 *
 * Usage:
 * 1. Set required environment variables:
 *    - SUPABASE_SERVICE_ROLE_KEY (required)
 *    - PUBLIC_SUPABASE_URL or SUPABASE_URL (required)
 *    - PUBLIC_SUPABASE_ANON_KEY or SUPABASE_KEY (required)
 *    - TEST_GOOGLE_EMAIL (optional, defaults to e2e-test@example.com)
 *
 * 2. Run the setup:
 *    npx playwright test e2e/auth.setup.ts
 *
 * 3. In regular tests: Use storageState: ".auth/user.json" in playwright.config.ts
 *
 * Note: Supabase sessions expire after ~1 hour. Regenerate this file periodically
 * or before CI runs.
 */
setup("authenticate", async ({ page }) => {
  // Validate required environment variables

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

  // Create admin client with service role key
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Create anon client for session verification
  const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Step 1: Create or get test user
    const user = await createOrGetTestUser(supabaseAdmin, TEST_GOOGLE_EMAIL);

    console.log(`✅ User ready: ${user.email} (${user.id})`);

    // Step 2: Generate session via magic link
    const session = await generateSessionForUser(supabaseAdmin, supabaseAnon, TEST_GOOGLE_EMAIL);
    const expiresAt = session.expires_at ? new Date(session.expires_at * 1000).toISOString() : "unknown";
    console.log(`✅ Session generated (expires at: ${expiresAt})`);

    // Step 3: Get storage key format
    const storageKey = getSupabaseStorageKey(SUPABASE_URL);

    console.log(`✅ Using storage key: xxxxxx`);

    // Step 4: Inject session into browser
    await injectSessionIntoBrowser(page, session, storageKey);

    // Step 5: Verify authentication succeeded
    // Check if we can access authenticated pages
    await page.goto("/calendar/week");
    await page.waitForLoadState("networkidle");

    // Verify we're authenticated by checking for user menu or authenticated content
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

    // Step 6: Save authentication state to file
    await page.context().storageState({ path: AUTH_FILE });

    console.log(`✅ Authentication successful. Storage state saved to ${AUTH_FILE}`);
  } catch (error) {
    console.error("❌ Authentication failed:", error);
    throw error;
  }
});
