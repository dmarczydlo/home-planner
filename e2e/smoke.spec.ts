import { test, expect } from "@playwright/test";

test.describe("E2E Test Infrastructure", () => {
  test("should verify test environment is working", async ({ page }) => {
    // Navigate to the app
    await page.goto("/");

    // Verify page loads
    await expect(page).toHaveTitle(/Home Planner/i);

    // Verify basic page structure exists
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Test that we can interact with the page
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(0);
  });

  test("should verify Playwright configuration", async ({ page, browserName }) => {
    // Verify we're using Chromium as configured
    expect(browserName).toBe("chromium");

    // Verify base URL is accessible
    await page.goto("/");
    const url = page.url();
    expect(url).toContain("localhost:4321");
  });
});
