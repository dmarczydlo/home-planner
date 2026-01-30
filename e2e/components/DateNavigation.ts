import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../pages/BasePage";

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
    this.dateDisplay = this.dateNavigationContainer.locator("h2").first();
  }

  async clickPrevious(): Promise<void> {
    await expect(this.previousButton).toBeVisible();
    await this.previousButton.click();
    await this.page.waitForTimeout(300);
  }

  async clickNext(): Promise<void> {
    await expect(this.nextButton).toBeVisible();
    await this.nextButton.click();
    await this.page.waitForTimeout(300);
  }

  async clickToday(): Promise<void> {
    await this.todayButton.click();
  }

  async expectPreviousVisible(): Promise<void> {
    await expect(this.previousButton).toBeVisible();
  }

  async expectNextVisible(): Promise<void> {
    await expect(this.nextButton).toBeVisible();
  }

  async expectTodayVisible(): Promise<void> {
    await expect(this.todayButton).toBeVisible();
  }

  async expectTodayNotVisible(): Promise<void> {
    await expect(this.todayButton).not.toBeVisible();
  }

  async getDateDisplayText(): Promise<string> {
    return (await this.dateDisplay.textContent()) || "";
  }

  async expectDateDisplayContains(text: string | RegExp): Promise<void> {
    await expect(this.dateDisplay).toContainText(text);
  }
}
