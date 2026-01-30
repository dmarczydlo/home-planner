import { test as base, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

export interface AuthenticatedUser {
  id: string;
  email: string;
  full_name: string;
}

export async function mockGoogleAuth(_page: Page, _userData?: AuthenticatedUser) {
  console.warn("mockGoogleAuth is deprecated. Use storage state authentication instead (see auth.setup.ts)");
}

export async function mockApiEndpoints(_page: Page, _familyId?: string) {
  console.warn("mockApiEndpoints is deprecated. Use real Supabase API endpoints in tests.");
}

export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto("/");

    const isAuthenticated = await Promise.race([
      page.waitForURL(/\/onboarding|\/calendar/, { timeout: 5000 }).then(() => true),
      page
        .locator('[data-testid="user-menu"], [data-testid="logout-button"]')
        .isVisible()
        .then(() => true)
        .catch(() => false),
    ]).catch(() => false);

    if (!isAuthenticated && !page.url().includes("/auth/login")) {
      console.warn("Page may not be authenticated. Check storage state file.");
    }

    await use(page);
  },
});

export { expect };
