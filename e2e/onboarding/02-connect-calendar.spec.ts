import { test, expect } from "../fixtures/auth";
import { completeWelcomeStep, mockCalendarConnection, getOnboardingProgress } from "../fixtures/helpers";

test.describe("Onboarding - Connect Calendar Step", () => {
  test("should display calendar provider options", async ({ authenticatedPage }) => {
    await completeWelcomeStep(authenticatedPage);

    // Verify heading
    await expect(authenticatedPage.locator('h1:has-text("Connect Your Calendar")')).toBeVisible();

    // Verify description
    await expect(
      authenticatedPage.locator("text=Sync your external calendars to see all your events in one place")
    ).toBeVisible();

    // Verify Google Calendar option
    await expect(authenticatedPage.locator("text=Google Calendar")).toBeVisible();
    await expect(authenticatedPage.locator("text=Sync events from your Google Calendar")).toBeVisible();

    // Verify Microsoft 365 option
    await expect(authenticatedPage.locator("text=Microsoft 365")).toBeVisible();
    await expect(authenticatedPage.locator("text=Sync events from your Outlook calendar")).toBeVisible();

    // Verify skip message
    await expect(authenticatedPage.locator("text=You can skip this step")).toBeVisible();

    // Verify progress indicator
    await expect(authenticatedPage.locator('[aria-label*="Step 2"]')).toBeVisible();
  });

  test("should skip calendar connection", async ({ authenticatedPage }) => {
    await completeWelcomeStep(authenticatedPage);

    // Click Skip button
    await authenticatedPage.click('button:has-text("Skip")');

    // Should proceed to step 3
    await expect(authenticatedPage.locator('h1:has-text("Add Your Children")')).toBeVisible();

    // Verify no calendars in storage
    const storage = await getOnboardingProgress(authenticatedPage);
    expect(storage.connectedCalendars).toHaveLength(0);
    expect(storage.currentStep).toBe(3);
  });

  test("should handle OAuth callback success", async ({ authenticatedPage }) => {
    await completeWelcomeStep(authenticatedPage);

    const calendarId = "test-cal-123";

    // Mock calendar list API to return connected calendar
    await authenticatedPage.route("**/api/external-calendars", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: calendarId,
              provider: "google",
              email: "test@gmail.com",
              is_primary: true,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    // Simulate OAuth callback by navigating with success params
    await authenticatedPage.goto(`/onboarding/welcome?status=success&calendar_id=${calendarId}`);

    // Should show connected state
    await expect(authenticatedPage.locator("text=Connected")).toBeVisible({ timeout: 5000 });

    // Google Calendar button should be disabled
    const googleButton = authenticatedPage.locator('button:has-text("Google Calendar")');
    await expect(googleButton).toBeDisabled();

    // Verify calendar is stored in context
    const storage = await getOnboardingProgress(authenticatedPage);
    expect(storage.connectedCalendars).toHaveLength(1);
    expect(storage.connectedCalendars[0].provider).toBe("google");
  });

  test("should handle OAuth callback error", async ({ authenticatedPage }) => {
    await completeWelcomeStep(authenticatedPage);

    // Simulate OAuth error callback
    await authenticatedPage.goto("/onboarding/welcome?status=error&error=unauthorized");

    // Should show error message
    await expect(authenticatedPage.locator('[role="alert"]')).toContainText("Authentication failed");

    // Should allow retry
    await expect(authenticatedPage.locator('button:has-text("Google Calendar")')).toBeEnabled();
  });

  test("should display different error messages", async ({ authenticatedPage }) => {
    await completeWelcomeStep(authenticatedPage);

    const errorCases = [
      { error: "missing_parameters", message: "Missing required parameters" },
      { error: "validation", message: "Invalid request" },
      { error: "conflict", message: "already connected" },
    ];

    for (const { error, message } of errorCases) {
      await authenticatedPage.goto(`/onboarding/welcome?status=error&error=${error}`);
      await expect(authenticatedPage.locator('[role="alert"]')).toContainText(message, { timeout: 2000 });
    }
  });

  test("should clear URL parameters after processing", async ({ authenticatedPage }) => {
    await completeWelcomeStep(authenticatedPage);

    // Navigate with error params
    await authenticatedPage.goto("/onboarding/welcome?status=error&error=unauthorized");

    // Wait for error to be displayed
    await expect(authenticatedPage.locator('[role="alert"]')).toBeVisible();

    // URL should be cleaned
    await expect(authenticatedPage).toHaveURL("/onboarding/welcome");
  });

  test("should proceed to next step after connecting calendar", async ({ authenticatedPage }) => {
    await completeWelcomeStep(authenticatedPage);

    const calendarId = "test-cal-123";

    // Mock connected calendar
    await authenticatedPage.route("**/api/external-calendars", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: calendarId,
              provider: "google",
              email: "test@gmail.com",
              is_primary: true,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    // Simulate successful connection
    await authenticatedPage.goto(`/onboarding/welcome?status=success&calendar_id=${calendarId}`);

    // Wait for connected state
    await expect(authenticatedPage.locator("text=Connected")).toBeVisible();

    // Click Next
    await authenticatedPage.click('button:has-text("Next")');

    // Should proceed to step 3
    await expect(authenticatedPage.locator('h1:has-text("Add Your Children")')).toBeVisible();
  });

  test("should not duplicate calendar on reload", async ({ authenticatedPage }) => {
    await completeWelcomeStep(authenticatedPage);

    const calendarId = "test-cal-123";

    // Mock calendar list
    await authenticatedPage.route("**/api/external-calendars", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: calendarId,
              provider: "google",
              email: "test@gmail.com",
              is_primary: true,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    // First connection
    await authenticatedPage.goto(`/onboarding/welcome?status=success&calendar_id=${calendarId}`);
    await expect(authenticatedPage.locator("text=Connected")).toBeVisible();

    let storage = await getOnboardingProgress(authenticatedPage);
    expect(storage.connectedCalendars).toHaveLength(1);

    // Reload page
    await authenticatedPage.reload();

    // Should still have only one calendar
    storage = await getOnboardingProgress(authenticatedPage);
    expect(storage.connectedCalendars).toHaveLength(1);
  });

  test("should handle both Google and Microsoft calendars", async ({ authenticatedPage }) => {
    await completeWelcomeStep(authenticatedPage);

    // Mock both calendars connected
    await authenticatedPage.route("**/api/external-calendars", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "google-cal-123",
              provider: "google",
              email: "test@gmail.com",
              is_primary: true,
            },
            {
              id: "microsoft-cal-456",
              provider: "microsoft",
              email: "test@outlook.com",
              is_primary: true,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    // Simulate both connections
    await authenticatedPage.goto("/onboarding/welcome?status=success&calendar_id=google-cal-123");
    await expect(authenticatedPage.locator("text=Connected").first()).toBeVisible();

    // Both buttons should be disabled
    await expect(authenticatedPage.locator('button:has-text("Google Calendar")')).toBeDisabled();
    await expect(authenticatedPage.locator('button:has-text("Microsoft 365")')).toBeDisabled();
  });
});
