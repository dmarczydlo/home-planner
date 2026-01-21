import { Page, Locator, expect } from "@playwright/test";

/**
 * Base Page Object class with common methods
 * All page objects should extend this class
 */
export class BasePage {
  constructor(protected page: Page) {}

  /**
   * Get element by data-testid attribute
   */
  getByTestId(testId: string): Locator {
    return this.page.locator(`[data-testid="${testId}"]`);
  }

  /**
   * Click element by data-testid
   */
  async clickByTestId(testId: string): Promise<void> {
    await this.getByTestId(testId).click();
  }

  /**
   * Fill input by data-testid
   */
  async fillByTestId(testId: string, value: string): Promise<void> {
    await this.getByTestId(testId).fill(value);
  }

  /**
   * Check if element is visible
   */
  async expectVisible(testId: string): Promise<void> {
    await expect(this.getByTestId(testId)).toBeVisible();
  }

  /**
   * Check if element has specific text
   */
  async expectText(testId: string, text: string | RegExp): Promise<void> {
    await expect(this.getByTestId(testId)).toHaveText(text);
  }

  /**
   * Navigate to a URL
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Get current URL
   */
  getUrl(): string {
    return this.page.url();
  }

  /**
   * Wait for URL to match pattern
   */
  async waitForUrl(pattern: string | RegExp, options?: { timeout?: number }): Promise<void> {
    await this.page.waitForURL(pattern, options);
  }

  /**
   * Wait for element to be visible
   */
  async waitForVisible(testId: string, options?: { timeout?: number }): Promise<void> {
    await this.getByTestId(testId).waitFor({ state: "visible", timeout: options?.timeout });
  }
}
