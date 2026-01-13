import { test as base, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

export interface AuthenticatedUser {
  id: string;
  email: string;
  full_name: string;
}

export async function mockGoogleAuth(
  page: Page,
  userData: AuthenticatedUser = {
    id: "test-user-123",
    email: "test@example.com",
    full_name: "Test User",
  }
) {
  // Intercept Supabase OAuth initiation
  await page.route("**/auth/v1/authorize**", async (route) => {
    const callbackUrl = new URL("http://localhost:4321/auth/callback");
    callbackUrl.searchParams.set("code", "mock-auth-code");
    callbackUrl.searchParams.set("state", "mock-state");

    await route.fulfill({
      status: 302,
      headers: {
        Location: callbackUrl.toString(),
      },
    });
  });

  // Mock token exchange
  await page.route("**/auth/v1/token**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "mock-access-token",
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "mock-refresh-token",
        user: userData,
      }),
    });
  });

  // Mock session endpoint
  await page.route("**/auth/v1/user**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(userData),
    });
  });

  // Mock session check
  await page.route("**/auth/v1/session**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "mock-access-token",
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "mock-refresh-token",
        user: userData,
      }),
    });
  });
}

export async function mockApiEndpoints(page: Page, familyId = "test-family-123") {
  // Mock family creation
  await page.route("**/api/families", async (route) => {
    if (route.request().method() === "POST") {
      const body = await route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: familyId,
          name: body.name,
          created_by: "test-user-123",
          created_at: new Date().toISOString(),
        }),
      });
    } else if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: familyId,
            name: "Test Family",
            created_by: "test-user-123",
            created_at: new Date().toISOString(),
          },
        ]),
      });
    }
  });

  // Mock external calendars
  await page.route("**/api/external-calendars", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    }
  });

  // Mock children API
  await page.route("**/api/families/*/children", async (route) => {
    if (route.request().method() === "POST") {
      const body = await route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: `child-${Date.now()}`,
          family_id: familyId,
          name: body.name,
          date_of_birth: body.date_of_birth,
          created_at: new Date().toISOString(),
        }),
      });
    }
  });

  // Mock invitations API
  await page.route("**/api/families/*/invitations", async (route) => {
    if (route.request().method() === "POST") {
      const body = await route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: `inv-${Date.now()}`,
          family_id: familyId,
          invited_by: "test-user-123",
          invitee_email: body.invitee_email,
          status: "pending",
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
        }),
      });
    }
  });
}

// Create authenticated context fixture
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await mockGoogleAuth(page);
    await mockApiEndpoints(page);
    
    await page.goto("/");
    await page.click('button:has-text("Sign in with Google")');
    
    // Wait for redirect to onboarding
    await page.waitForURL("**/onboarding/welcome", { timeout: 10000 });
    
    await use(page);
  },
});

export { expect };
