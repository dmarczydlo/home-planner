import { test, expect } from "@playwright/test";

test.describe("E2E Test Infrastructure", () => {
  test("should verify test environment is working", async ({ page }) => {
    // Arrange
    await page.goto("/");

    // Act
    const title = await page.title();
    const body = page.locator("body");
    const pageContent = await page.content();

    // Assert
    expect(title).toMatch(/Home Planner|Calendar/i);
    await expect(body).toBeVisible();
    expect(pageContent.length).toBeGreaterThan(0);
  });

  test("should verify Playwright configuration", async ({ page, browserName }) => {
    // Arrange & Act
    await page.goto("/");
    const url = page.url();

    // Assert
    expect(browserName).toBe("chromium");
    expect(url).toContain("localhost:4321");
  });
});
