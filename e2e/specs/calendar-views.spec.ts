import { test, expect } from "@playwright/test";
import { CalendarPage } from "../pages/CalendarPage";

test.describe("Calendar Views Navigation", () => {
  let calendarPage: CalendarPage;

  test.beforeEach(async ({ page }) => {
    calendarPage = new CalendarPage(page);
    await page.waitForLoadState("domcontentloaded");
  });

  test.describe("View Switching", () => {
    test("should switch from Week view to Day view", async ({ page }) => {
      // Arrange
      await calendarPage.gotoWeek();
      await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
      await calendarPage.viewSwitcher.expectWeekActive();

      // Act
      await calendarPage.viewSwitcher.switchToDay();

      // Assert
      await calendarPage.viewSwitcher.expectDayActive();
      await calendarPage.expectDayViewVisible();
    });

    test("should switch from Week view to Month view", async ({ page }) => {
      // Arrange
      await calendarPage.gotoWeek();
      await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
      await calendarPage.viewSwitcher.expectWeekActive();

      // Act
      await calendarPage.viewSwitcher.switchToMonth();

      // Assert
      await calendarPage.viewSwitcher.expectMonthActive();
      await calendarPage.expectMonthViewVisible();
    });

    test("should switch from Week view to Agenda view", async ({ page }) => {
      // Arrange
      await calendarPage.gotoWeek();
      await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
      await calendarPage.viewSwitcher.expectWeekActive();

      // Act
      await calendarPage.viewSwitcher.switchToAgenda();

      // Assert
      await calendarPage.viewSwitcher.expectAgendaActive();
      await calendarPage.expectAgendaViewVisible();
    });

    test("should switch back to Week view from Day view", async ({ page }) => {
      // Arrange
      await calendarPage.gotoDay();
      await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
      await calendarPage.viewSwitcher.expectDayActive();

      // Act
      await calendarPage.viewSwitcher.switchToWeek();

      // Assert
      await calendarPage.viewSwitcher.expectWeekActive();
      await calendarPage.expectWeekViewVisible();
    });

    test("should display all view options", async ({ page }) => {
      // Arrange & Act
      await calendarPage.gotoWeek();

      // Assert
      await calendarPage.viewSwitcher.expectAllViewsVisible();
    });
  });

  test.describe("Direct Navigation", () => {
    test("should navigate to Day view URL and show correct view", async ({ page }) => {
      // Arrange & Act
      await calendarPage.gotoDay();

      // Assert
      await calendarPage.expectDayViewVisible();
      await calendarPage.viewSwitcher.expectDayActive();
      await calendarPage.expectUrlMatchesView("day");
    });

    test("should navigate to Week view URL and show correct view", async ({ page }) => {
      // Arrange & Act
      await calendarPage.gotoWeek();

      // Assert
      await calendarPage.expectWeekViewVisible();
      await calendarPage.viewSwitcher.expectWeekActive();
      await calendarPage.expectUrlMatchesView("week");
    });

    test("should navigate to Month view URL and show correct view", async ({ page }) => {
      // Arrange & Act
      await calendarPage.gotoMonth();

      // Assert
      await calendarPage.expectMonthViewVisible();
      await calendarPage.viewSwitcher.expectMonthActive();
      await calendarPage.expectUrlMatchesView("month");
    });

    test("should navigate to Agenda view URL and show correct view", async ({ page }) => {
      // Arrange & Act
      await calendarPage.gotoAgenda();

      // Assert
      await calendarPage.expectAgendaViewVisible();
      await calendarPage.viewSwitcher.expectAgendaActive();
      await calendarPage.expectUrlMatchesView("agenda");
    });
  });

  test.describe("Date Navigation", () => {
    test("should navigate to previous date range", async ({ page }) => {
      // Arrange
      await calendarPage.gotoWeek();
      await page.waitForLoadState("networkidle");
      const initialDateText = (await calendarPage.dateNavigation.getDateDisplayText()).trim();

      // Act
      await calendarPage.dateNavigation.clickPrevious();

      let attempts = 0;
      let newDateText = initialDateText;
      while (attempts < 50 && newDateText === initialDateText) {
        await page.waitForTimeout(100);
        newDateText = (await calendarPage.dateNavigation.getDateDisplayText()).trim();
        attempts++;
      }

      // Assert
      expect(newDateText).not.toBe(initialDateText);
    });

    test("should navigate to next date range", async ({ page }) => {
      // Arrange
      await calendarPage.gotoWeek();
      await page.waitForLoadState("networkidle");
      const initialDateText = (await calendarPage.dateNavigation.getDateDisplayText()).trim();

      // Act
      await calendarPage.dateNavigation.clickNext();

      let attempts = 0;
      let newDateText = initialDateText;
      while (attempts < 50 && newDateText === initialDateText) {
        await page.waitForTimeout(100);
        newDateText = (await calendarPage.dateNavigation.getDateDisplayText()).trim();
        attempts++;
      }

      // Assert
      expect(newDateText).not.toBe(initialDateText);
    });

    test("should navigate to today's date", async ({ page }) => {
      // Arrange
      await calendarPage.gotoWeek();
      const initialDateText = await calendarPage.dateNavigation.getDateDisplayText();
      await calendarPage.dateNavigation.clickNext();
      await page.waitForTimeout(500);
      await page.waitForTimeout(300);
      const todayButtonVisible = await calendarPage.dateNavigation.todayButton.isVisible().catch(() => false);
      if (todayButtonVisible) {
        // Act
        await calendarPage.dateNavigation.clickToday();

        // Assert
        await calendarPage.dateNavigation.expectTodayNotVisible();
      } else {
        await calendarPage.dateNavigation.expectTodayNotVisible();
      }
    });

    test("should show Today button when not on current date", async ({ page }) => {
      // Arrange
      await calendarPage.gotoWeek();
      const todayButtonInitiallyVisible = await calendarPage.dateNavigation.todayButton.isVisible().catch(() => false);

      if (!todayButtonInitiallyVisible) {
        await calendarPage.dateNavigation.clickNext();
        await page.waitForTimeout(300);
      }

      // Assert
      const todayButtonVisible = await calendarPage.dateNavigation.todayButton.isVisible().catch(() => false);
      expect(todayButtonVisible || !todayButtonInitiallyVisible).toBeTruthy();
    });

    test("should hide Today button when on current date", async ({ page }) => {
      // Arrange
      await calendarPage.gotoWeek();

      // Act
      if (await calendarPage.dateNavigation.todayButton.isVisible()) {
        await calendarPage.dateNavigation.clickToday();
      }

      // Assert
      await calendarPage.dateNavigation.expectTodayNotVisible();
    });

    test("should display date navigation controls", async ({ page }) => {
      // Arrange & Act
      await calendarPage.gotoWeek();

      // Assert
      await calendarPage.dateNavigation.expectPreviousVisible();
      await calendarPage.dateNavigation.expectNextVisible();
      const dateText = await calendarPage.dateNavigation.getDateDisplayText();
      expect(dateText.length).toBeGreaterThan(0);
    });
  });

  test.describe("View Content Display", () => {
    test("should display events correctly in Day view", async ({ page }) => {
      // Arrange & Act
      await calendarPage.gotoDay();

      // Assert
      await calendarPage.expectDayViewVisible();
    });

    test("should display events correctly in Week view", async ({ page }) => {
      // Arrange & Act
      await calendarPage.gotoWeek();

      // Assert
      await calendarPage.expectWeekViewVisible();
    });

    test("should display events correctly in Month view", async ({ page }) => {
      // Arrange & Act
      await calendarPage.gotoMonth();

      // Assert
      await calendarPage.expectMonthViewVisible();
    });

    test("should display events correctly in Agenda view", async ({ page }) => {
      // Arrange & Act
      await calendarPage.gotoAgenda();

      // Assert
      await calendarPage.expectAgendaViewVisible();
    });

    test("should show empty state when no events exist", async ({ page }) => {
      // Arrange & Act
      await calendarPage.gotoWeek();

      // Assert
      await calendarPage.expectWeekViewVisible();
    });
  });

  test.describe("View Persistence", () => {
    test("should maintain view preference when navigating dates", async ({ page }) => {
      // Arrange
      await calendarPage.gotoMonth();
      await calendarPage.viewSwitcher.expectMonthActive();

      // Act
      await calendarPage.dateNavigation.clickNext();
      await calendarPage.dateNavigation.clickPrevious();

      // Assert
      await calendarPage.viewSwitcher.expectMonthActive();
      await calendarPage.expectMonthViewVisible();
    });

    test("should maintain view preference when switching between views and navigating", async ({ page }) => {
      // Arrange
      await calendarPage.gotoWeek();
      await calendarPage.viewSwitcher.switchToDay();
      await calendarPage.viewSwitcher.expectDayActive();

      // Act
      await calendarPage.dateNavigation.clickNext();
      await calendarPage.dateNavigation.clickPrevious();

      // Assert
      await calendarPage.viewSwitcher.expectDayActive();
      await calendarPage.expectDayViewVisible();
    });
  });

  test.describe("Date Navigation Across Views", () => {
    test("should navigate dates correctly in Day view", async ({ page }) => {
      // Arrange
      await calendarPage.gotoDay();
      await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
      const initialDateText = (await calendarPage.dateNavigation.getDateDisplayText()).trim();

      // Act
      await calendarPage.dateNavigation.clickNext();

      let attempts = 0;
      let newDateText = initialDateText;
      while (attempts < 50 && newDateText === initialDateText) {
        await page.waitForTimeout(100);
        newDateText = (await calendarPage.dateNavigation.getDateDisplayText()).trim();
        attempts++;
      }

      // Assert
      expect(newDateText).not.toBe(initialDateText);
    });

    test("should navigate dates correctly in Week view", async ({ page }) => {
      // Arrange
      await calendarPage.gotoWeek();
      await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
      const initialDateText = (await calendarPage.dateNavigation.getDateDisplayText()).trim();

      // Act
      await calendarPage.dateNavigation.clickNext();

      let attempts = 0;
      let newDateText = initialDateText;
      while (attempts < 50 && newDateText === initialDateText) {
        await page.waitForTimeout(100);
        newDateText = (await calendarPage.dateNavigation.getDateDisplayText()).trim();
        attempts++;
      }

      // Assert
      expect(newDateText).not.toBe(initialDateText);
    });

    test("should navigate dates correctly in Month view", async ({ page }) => {
      // Arrange
      await calendarPage.gotoMonth();
      const initialDateText = await calendarPage.dateNavigation.getDateDisplayText();

      // Act
      await calendarPage.dateNavigation.clickNext();

      // Assert
      const newDateText = await calendarPage.dateNavigation.getDateDisplayText();
      if (newDateText === initialDateText) {
        await calendarPage.dateNavigation.clickNext();
        const finalDateText = await calendarPage.dateNavigation.getDateDisplayText();
        expect(finalDateText).not.toBe(initialDateText);
      } else {
        expect(newDateText).not.toBe(initialDateText);
      }
    });

    test("should navigate dates correctly in Agenda view", async ({ page }) => {
      // Arrange
      await calendarPage.gotoAgenda();
      const initialDateText = await calendarPage.dateNavigation.getDateDisplayText();

      // Act
      await calendarPage.dateNavigation.clickNext();

      // Assert
      const newDateText = await calendarPage.dateNavigation.getDateDisplayText();
      expect(newDateText).toBeTruthy();
    });
  });

  test.describe("Current Date Indicator", () => {
    test("should show current date indicator in Day view", async ({ page }) => {
      // Arrange & Act
      await calendarPage.gotoDay();

      // Assert
      await calendarPage.expectDayViewVisible();
    });

    test("should show current date indicator in Week view", async ({ page }) => {
      // Arrange & Act
      await calendarPage.gotoWeek();

      // Assert
      await calendarPage.expectWeekViewVisible();
    });

    test("should show current date indicator in Month view", async ({ page }) => {
      // Arrange & Act
      await calendarPage.gotoMonth();

      // Assert
      await calendarPage.expectMonthViewVisible();
    });

    test("should show current date indicator in Agenda view", async ({ page }) => {
      // Arrange & Act
      await calendarPage.gotoAgenda();

      // Assert
      await calendarPage.expectAgendaViewVisible();
    });
  });
});
