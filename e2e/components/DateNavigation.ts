import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../pages/BasePage";

/**
 * Component Object for DateNavigation
 * Handles interactions with calendar date navigation (Previous, Next, Today)
 */
export class DateNavigation extends BasePage {
  private dateNavigationContainer: Locator;
  private previousButton: Locator;
  private nextButton: Locator;
  private todayButton: Locator;
  private dateDisplay: Locator;

  constructor(page: Page) {
    super(page);
    this.dateNavigationContainer = page.locator('div:has(button[aria-label="Previous"])').first();
    this.previousButton = page.getByRole("button", { name: /previous/i });
    this.nextButton = page.getByRole("button", { name: /next/i });
    this.todayButton = page.getByRole("button", { name: /today/i });
    // Date display is an h2 element in the date navigation container
    this.dateDisplay = this.dateNavigationContainer.locator("h2").first();
  }

  /**
   * Click Previous button
   */
  async clickPrevious(): Promise<void> {
    await expect(this.previousButton).toBeVisible();
    await this.previousButton.click();
    // Wait for React to update - use a simple wait
    await this.page.waitForTimeout(300);
  }

  /**
   * Click Next button
   */
  async clickNext(): Promise<void> {
    await expect(this.nextButton).toBeVisible();
    await this.nextButton.click();
    // Wait for React to update - use a simple wait
    await this.page.waitForTimeout(300);
  }

  /**
   * Click Today button
   */
  async clickToday(): Promise<void> {
    await this.todayButton.click();
  }

  /**
   * Verify Previous button is visible
   */
  async expectPreviousVisible(): Promise<void> {
    await expect(this.previousButton).toBeVisible();
  }

  /**
   * Verify Next button is visible
   */
  async expectNextVisible(): Promise<void> {
    await expect(this.nextButton).toBeVisible();
  }

  /**
   * Verify Today button is visible (only when not on today's date)
   */
  async expectTodayVisible(): Promise<void> {
    await expect(this.todayButton).toBeVisible();
  }

  /**
   * Verify Today button is not visible (when already on today's date)
   */
  async expectTodayNotVisible(): Promise<void> {
    await expect(this.todayButton).not.toBeVisible();
  }

  /**
   * Get current date display text
   */
  async getDateDisplayText(): Promise<string> {
    return (await this.dateDisplay.textContent()) || "";
  }

  /**
   * Verify date display contains expected text
   */
  async expectDateDisplayContains(text: string | RegExp): Promise<void> {
    await expect(this.dateDisplay).toContainText(text);
  }
}
