import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";
import { ViewSwitcher } from "../components/ViewSwitcher";
import { DateNavigation } from "../components/DateNavigation";

/**
 * Page Object for Calendar pages
 * Handles interactions with calendar views (Day, Week, Month, Agenda)
 */
export class CalendarPage extends BasePage {
  public viewSwitcher: ViewSwitcher;
  public dateNavigation: DateNavigation;

  constructor(page: Page) {
    super(page);
    this.viewSwitcher = new ViewSwitcher(page);
    this.dateNavigation = new DateNavigation(page);
  }

  /**
   * Navigate to Day view
   */
  async gotoDay(): Promise<void> {
    await this.goto("/calendar/day");
    await this.waitForViewLoaded("day");
  }

  /**
   * Navigate to Week view
   */
  async gotoWeek(): Promise<void> {
    await this.goto("/calendar/week");
    await this.waitForViewLoaded("week");
  }

  /**
   * Navigate to Month view
   */
  async gotoMonth(): Promise<void> {
    await this.goto("/calendar/month");
    await this.waitForViewLoaded("month");
  }

  /**
   * Navigate to Agenda view
   */
  async gotoAgenda(): Promise<void> {
    await this.goto("/calendar/agenda");
    await this.waitForViewLoaded("agenda");
  }

  /**
   * Wait for specific view to load
   */
  async waitForViewLoaded(view: "day" | "week" | "month" | "agenda"): Promise<void> {
    const testId = `${view}-view`;
    await this.waitForVisible(testId, { timeout: 10000 });
  }

  /**
   * Verify Day view is displayed
   */
  async expectDayViewVisible(): Promise<void> {
    await this.expectVisible("day-view");
  }

  /**
   * Verify Week view is displayed
   */
  async expectWeekViewVisible(): Promise<void> {
    await this.expectVisible("week-view");
  }

  /**
   * Verify Month view is displayed
   */
  async expectMonthViewVisible(): Promise<void> {
    await this.expectVisible("month-view");
  }

  /**
   * Verify Agenda view is displayed
   */
  async expectAgendaViewVisible(): Promise<void> {
    await this.expectVisible("agenda-view");
  }

  /**
   * Verify empty state is shown
   */
  async expectEmptyStateVisible(): Promise<void> {
    await this.expectVisible("calendar-empty-state");
  }

  /**
   * Verify event card is visible
   */
  async expectEventCardVisible(): Promise<void> {
    await this.expectVisible("calendar-event-card");
  }

  /**
   * Get all event cards
   */
  getEventCards(): Locator {
    return this.page.locator('[data-testid="calendar-event-card"]');
  }

  /**
   * Verify URL matches expected calendar view
   */
  async expectUrlMatchesView(view: "day" | "week" | "month" | "agenda"): Promise<void> {
    const url = this.getUrl();
    expect(url).toContain(`/calendar/${view}`);
  }
}
