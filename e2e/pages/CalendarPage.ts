import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";
import { ViewSwitcher } from "../components/ViewSwitcher";
import { DateNavigation } from "../components/DateNavigation";

export class CalendarPage extends BasePage {
  public viewSwitcher: ViewSwitcher;
  public dateNavigation: DateNavigation;

  constructor(page: Page) {
    super(page);
    this.viewSwitcher = new ViewSwitcher(page);
    this.dateNavigation = new DateNavigation(page);
  }

  async gotoDay(): Promise<void> {
    await this.goto("/calendar/day");
    await this.waitForViewLoaded("day");
  }

  async gotoWeek(): Promise<void> {
    await this.goto("/calendar/week");
    await this.waitForViewLoaded("week");
  }

  async gotoMonth(): Promise<void> {
    await this.goto("/calendar/month");
    await this.waitForViewLoaded("month");
  }

  async gotoAgenda(): Promise<void> {
    await this.goto("/calendar/agenda");
    await this.waitForViewLoaded("agenda");
  }

  async waitForViewLoaded(view: "day" | "week" | "month" | "agenda"): Promise<void> {
    const testId = `${view}-view`;
    await this.waitForVisible(testId, { timeout: 10000 });
  }

  async expectDayViewVisible(): Promise<void> {
    await this.expectVisible("day-view");
  }

  async expectWeekViewVisible(): Promise<void> {
    await this.expectVisible("week-view");
  }

  async expectMonthViewVisible(): Promise<void> {
    await this.expectVisible("month-view");
  }

  async expectAgendaViewVisible(): Promise<void> {
    await this.expectVisible("agenda-view");
  }

  async expectEmptyStateVisible(): Promise<void> {
    await this.expectVisible("calendar-empty-state");
  }

  async expectEventCardVisible(): Promise<void> {
    await this.expectVisible("calendar-event-card");
  }

  getEventCards(): Locator {
    return this.page.locator('[data-testid="calendar-event-card"]');
  }

  async expectUrlMatchesView(view: "day" | "week" | "month" | "agenda"): Promise<void> {
    const url = this.getUrl();
    expect(url).toContain(`/calendar/${view}`);
  }
}
