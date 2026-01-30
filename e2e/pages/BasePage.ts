import { Page, Locator, expect } from "@playwright/test";

export class BasePage {
  constructor(protected page: Page) {}

  getByTestId(testId: string): Locator {
    return this.page.locator(`[data-testid="${testId}"]`);
  }

  async clickByTestId(testId: string): Promise<void> {
    await this.getByTestId(testId).click();
  }

  async fillByTestId(testId: string, value: string): Promise<void> {
    await this.getByTestId(testId).fill(value);
  }

  async expectVisible(testId: string): Promise<void> {
    await expect(this.getByTestId(testId)).toBeVisible();
  }

  async expectText(testId: string, text: string | RegExp): Promise<void> {
    await expect(this.getByTestId(testId)).toHaveText(text);
  }

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  getUrl(): string {
    return this.page.url();
  }

  async waitForUrl(pattern: string | RegExp, options?: { timeout?: number }): Promise<void> {
    await this.page.waitForURL(pattern, options);
  }

  async waitForVisible(testId: string, options?: { timeout?: number }): Promise<void> {
    await this.getByTestId(testId).waitFor({ state: "visible", timeout: options?.timeout });
  }
}
