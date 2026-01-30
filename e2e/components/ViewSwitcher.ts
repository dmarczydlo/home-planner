import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../pages/BasePage";

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

  async switchToDay(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
    await expect(this.dayButton).toBeVisible();
    await this.dayButton.scrollIntoViewIfNeeded();
    const wasActive = (await this.dayButton.getAttribute("aria-selected")) === "true";
    if (!wasActive) {
      await this.dayButton.click();
      await this.page.waitForTimeout(100);
      await this.expectDayActive();
    }
  }

  async switchToWeek(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
    await expect(this.weekButton).toBeVisible();
    await this.weekButton.scrollIntoViewIfNeeded();
    const wasActive = (await this.weekButton.getAttribute("aria-selected")) === "true";
    if (!wasActive) {
      await this.weekButton.click({ force: false });
      await this.expectWeekActive();
    }
  }

  async switchToMonth(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
    await expect(this.monthButton).toBeVisible();
    await this.monthButton.scrollIntoViewIfNeeded();
    const wasActive = (await this.monthButton.getAttribute("aria-selected")) === "true";
    if (!wasActive) {
      await this.monthButton.click({ force: false });
      await this.expectMonthActive();
    }
  }

  async switchToAgenda(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
    await expect(this.agendaButton).toBeVisible();
    await this.agendaButton.scrollIntoViewIfNeeded();
    const wasActive = (await this.agendaButton.getAttribute("aria-selected")) === "true";
    if (!wasActive) {
      await this.agendaButton.click({ force: false });
      await this.expectAgendaActive();
    }
  }

  async expectDayActive(): Promise<void> {
    let attempts = 0;
    while (attempts < 50) {
      const selected = await this.dayButton.getAttribute("aria-selected");
      if (selected === "true") {
        return;
      }
      await this.page.waitForTimeout(100);
      attempts++;
    }
    await expect(this.dayButton).toHaveAttribute("aria-selected", "true");
  }

  async expectWeekActive(): Promise<void> {
    let attempts = 0;
    while (attempts < 50) {
      const selected = await this.weekButton.getAttribute("aria-selected");
      if (selected === "true") {
        return;
      }
      await this.page.waitForTimeout(100);
      attempts++;
    }
    await expect(this.weekButton).toHaveAttribute("aria-selected", "true");
  }

  async expectMonthActive(): Promise<void> {
    let attempts = 0;
    while (attempts < 50) {
      const selected = await this.monthButton.getAttribute("aria-selected");
      if (selected === "true") {
        return;
      }
      await this.page.waitForTimeout(100);
      attempts++;
    }
    await expect(this.monthButton).toHaveAttribute("aria-selected", "true");
  }

  async expectAgendaActive(): Promise<void> {
    let attempts = 0;
    while (attempts < 50) {
      const selected = await this.agendaButton.getAttribute("aria-selected");
      if (selected === "true") {
        return;
      }
      await this.page.waitForTimeout(100);
      attempts++;
    }
    await expect(this.agendaButton).toHaveAttribute("aria-selected", "true");
  }

  async expectAllViewsVisible(): Promise<void> {
    await expect(this.dayButton).toBeVisible();
    await expect(this.weekButton).toBeVisible();
    await expect(this.monthButton).toBeVisible();
    await expect(this.agendaButton).toBeVisible();
  }

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
