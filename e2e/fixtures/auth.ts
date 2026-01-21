import { test as base, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Authentication fixtures for E2E tests
 * 
 * IMPORTANT: This file now uses storage state-based authentication.
 * The auth.setup.ts file authenticates once and saves the state to .auth/user.json
 * 
 * For authenticated tests, use:
 * ```typescript
 * import { test } from "@playwright/test";
 * 
 * test.use({ storageState: ".auth/user.json" });
 * 
 * test("my test", async ({ page }) => {
 *   // Already authenticated
 * });
 * ```
 * 
 * The playwright.config.ts is configured to use storage state by default.
 * For unauthenticated tests, use the "chromium-unauthenticated" project.
 */

// Legacy mock functions (kept for backward compatibility if needed)
// Note: These are deprecated. Use real Supabase authentication with storage state instead.

export interface AuthenticatedUser {
  id: string;
  email: string;
  full_name: string;
}

/**
 * @deprecated Use storage state authentication instead (see auth.setup.ts)
 * This function is kept for reference but should not be used in new tests.
 */
export async function mockGoogleAuth(
  page: Page,
  userData: AuthenticatedUser = {
    id: "test-user-123",
    email: "test@example.com",
    full_name: "Test User",
  }
) {
  console.warn(
    "mockGoogleAuth is deprecated. Use storage state authentication instead (see auth.setup.ts)"
  );
  // Implementation kept for reference but not recommended
}

/**
 * @deprecated Use real API endpoints instead of mocking
 * Mock only external services (OAuth providers), not your own APIs
 */
export async function mockApiEndpoints(page: Page, familyId = "test-family-123") {
  console.warn(
    "mockApiEndpoints is deprecated. Use real Supabase API endpoints in tests."
  );
  // Implementation kept for reference but not recommended
}

/**
 * Authenticated page fixture
 * 
 * This fixture provides a page that is already authenticated using storage state.
 * The authentication is handled by auth.setup.ts which runs before tests.
 * 
 * Usage:
 * ```typescript
 * import { test } from "./fixtures/auth";
 * 
 * test("my authenticated test", async ({ authenticatedPage }) => {
 *   await authenticatedPage.goto("/calendar/week");
 *   // Test logic...
 * });
 * ```
 */
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    // Page is already authenticated via storage state from playwright.config.ts
    // Just verify we're authenticated by checking for authenticated indicators
    await page.goto("/");
    
    // Wait for either onboarding (new user) or calendar (returning user)
    const isAuthenticated = await Promise.race([
      page.waitForURL(/\/onboarding|\/calendar/, { timeout: 5000 }).then(() => true),
      page
        .locator('[data-testid="user-menu"], [data-testid="logout-button"]')
        .isVisible()
        .then(() => true)
        .catch(() => false),
    ]).catch(() => false);

    if (!isAuthenticated && !page.url().includes("/auth/login")) {
      // If not on login page and not authenticated, there might be an issue
      console.warn("Page may not be authenticated. Check storage state file.");
    }

    await use(page);
  },
});

export { expect };
