import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../pages/BasePage";

/**
 * Component Object for ViewSwitcher
 * Handles interactions with calendar view switcher (Day, Week, Month, Agenda)
 */
export class ViewSwitcher extends BasePage {
  private viewSwitcherContainer: Locator;
  private dayButton: Locator;
  private weekButton: Locator;
  private monthButton: Locator;
  private agendaButton: Locator;

  constructor(page: Page) {
    super(page);
    this.viewSwitcherContainer = page.locator('div:has(button[role="tab"])').first();
    this.dayButton = page.getByRole("tab", { name: /day/i });
    this.weekButton = page.getByRole("tab", { name: /week/i });
    this.monthButton = page.getByRole("tab", { name: /month/i });
    this.agendaButton = page.getByRole("tab", { name: /agenda/i });
  }

  /**
   * Click Day view button and wait for it to be active
   */
  async switchToDay(): Promise<void> {
    // Wait for page to be ready
    await this.page.waitForLoadState("domcontentloaded");
    // Ensure button is visible and enabled before clicking
    await expect(this.dayButton).toBeVisible();
    await this.dayButton.scrollIntoViewIfNeeded();
    // Get current state to verify it changes
    const wasActive = (await this.dayButton.getAttribute("aria-selected")) === "true";
    if (!wasActive) {
      // Use locator.click() which waits for actionability
      await this.dayButton.click();
      // Small wait for React to process
      await this.page.waitForTimeout(100);
      // Wait for aria-selected to become true
      await this.expectDayActive();
    }
  }

  /**
   * Click Week view button and wait for it to be active
   */
  async switchToWeek(): Promise<void> {
    // Wait for page to be ready
    await this.page.waitForLoadState("domcontentloaded");
    // Ensure button is visible and enabled before clicking
    await expect(this.weekButton).toBeVisible();
    await this.weekButton.scrollIntoViewIfNeeded();
    // Get current state to verify it changes
    const wasActive = (await this.weekButton.getAttribute("aria-selected")) === "true";
    if (!wasActive) {
      await this.weekButton.click({ force: false });
      // Wait for aria-selected to become true
      await this.expectWeekActive();
    }
  }

  /**
   * Click Month view button and wait for it to be active
   */
  async switchToMonth(): Promise<void> {
    // Wait for page to be ready
    await this.page.waitForLoadState("domcontentloaded");
    // Ensure button is visible and enabled before clicking
    await expect(this.monthButton).toBeVisible();
    await this.monthButton.scrollIntoViewIfNeeded();
    // Get current state to verify it changes
    const wasActive = (await this.monthButton.getAttribute("aria-selected")) === "true";
    if (!wasActive) {
      await this.monthButton.click({ force: false });
      // Wait for aria-selected to become true
      await this.expectMonthActive();
    }
  }

  /**
   * Click Agenda view button and wait for it to be active
   */
  async switchToAgenda(): Promise<void> {
    // Wait for page to be ready
    await this.page.waitForLoadState("domcontentloaded");
    // Ensure button is visible and enabled before clicking
    await expect(this.agendaButton).toBeVisible();
    await this.agendaButton.scrollIntoViewIfNeeded();
    // Get current state to verify it changes
    const wasActive = (await this.agendaButton.getAttribute("aria-selected")) === "true";
    if (!wasActive) {
      await this.agendaButton.click({ force: false });
      // Wait for aria-selected to become true
      await this.expectAgendaActive();
    }
  }

  /**
   * Verify Day view is active (with retries)
   */
  async expectDayActive(): Promise<void> {
    // Wait for the button to become active with polling (more reliable for parallel execution)
    let attempts = 0;
    while (attempts < 50) {
      const selected = await this.dayButton.getAttribute("aria-selected");
      if (selected === "true") {
        return;
      }
      await this.page.waitForTimeout(100);
      attempts++;
    }
    // Final check with expect for better error message
    await expect(this.dayButton).toHaveAttribute("aria-selected", "true");
  }

  /**
   * Verify Week view is active (with retries)
   */
  async expectWeekActive(): Promise<void> {
    // Wait for the button to become active with polling (more reliable for parallel execution)
    let attempts = 0;
    while (attempts < 50) {
      const selected = await this.weekButton.getAttribute("aria-selected");
      if (selected === "true") {
        return;
      }
      await this.page.waitForTimeout(100);
      attempts++;
    }
    // Final check with expect for better error message
    await expect(this.weekButton).toHaveAttribute("aria-selected", "true");
  }

  /**
   * Verify Month view is active (with retries)
   */
  async expectMonthActive(): Promise<void> {
    // Wait for the button to become active with polling (more reliable for parallel execution)
    let attempts = 0;
    while (attempts < 50) {
      const selected = await this.monthButton.getAttribute("aria-selected");
      if (selected === "true") {
        return;
      }
      await this.page.waitForTimeout(100);
      attempts++;
    }
    // Final check with expect for better error message
    await expect(this.monthButton).toHaveAttribute("aria-selected", "true");
  }

  /**
   * Verify Agenda view is active (with retries)
   */
  async expectAgendaActive(): Promise<void> {
    // Wait for the button to become active with polling (more reliable for parallel execution)
    let attempts = 0;
    while (attempts < 50) {
      const selected = await this.agendaButton.getAttribute("aria-selected");
      if (selected === "true") {
        return;
      }
      await this.page.waitForTimeout(100);
      attempts++;
    }
    // Final check with expect for better error message
    await expect(this.agendaButton).toHaveAttribute("aria-selected", "true");
  }

  /**
   * Verify all view buttons are visible
   */
  async expectAllViewsVisible(): Promise<void> {
    await expect(this.dayButton).toBeVisible();
    await expect(this.weekButton).toBeVisible();
    await expect(this.monthButton).toBeVisible();
    await expect(this.agendaButton).toBeVisible();
  }

  /**
   * Get active view name
   */
  async getActiveView(): Promise<string> {
    const daySelected = await this.dayButton.getAttribute("aria-selected");
    if (daySelected === "true") return "day";

    const weekSelected = await this.weekButton.getAttribute("aria-selected");
    if (weekSelected === "true") return "week";

    const monthSelected = await this.monthButton.getAttribute("aria-selected");
    if (monthSelected === "true") return "month";

    const agendaSelected = await this.agendaButton.getAttribute("aria-selected");
    if (agendaSelected === "true") return "agenda";

    throw new Error("No active view found");
  }
}
