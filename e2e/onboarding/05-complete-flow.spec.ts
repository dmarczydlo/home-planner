import { test, expect } from "../fixtures/auth";
import { addChild, sendInvitation, generateTestDate, generateTestEmail } from "../fixtures/helpers";

test.describe("Onboarding - Complete Flow", () => {
  test("should complete minimal onboarding flow", async ({ authenticatedPage }) => {
    // Only complete required step (family name)
    await authenticatedPage.goto("/onboarding/welcome");

    // Step 1: Create family
    await authenticatedPage.fill("#family-name", "Minimal Family");
    await authenticatedPage.click('button:has-text("Next")');

    // Wait for step 2
    await expect(authenticatedPage.locator('h1:has-text("Connect Your Calendar")')).toBeVisible();

    // Skip all optional steps
    await authenticatedPage.click('button:has-text("Skip")'); // Calendar
    await expect(authenticatedPage.locator('h1:has-text("Add Your Children")')).toBeVisible();

    await authenticatedPage.click('button:has-text("Next")'); // Children
    await expect(authenticatedPage.locator('h1:has-text("Invite Family Members")')).toBeVisible();

    await authenticatedPage.click('button:has-text("Finish")'); // Members

    // Should complete successfully
    await expect(authenticatedPage).toHaveURL(/\/calendar\/week/, { timeout: 10000 });

    // Verify onboarding storage is cleared
    const storage = await authenticatedPage.evaluate(() => {
      return localStorage.getItem("onboarding_progress");
    });
    expect(storage).toBeNull();
  });

  test("should complete full onboarding flow", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/onboarding/welcome");

    // Step 1: Welcome - Create family
    const familyName = `Complete Family ${Date.now()}`;
    await authenticatedPage.fill("#family-name", familyName);
    await authenticatedPage.click('button:has-text("Next")');

    // Wait for step 2
    await expect(authenticatedPage.locator('h1:has-text("Connect Your Calendar")')).toBeVisible();

    // Step 2: Skip calendar connection
    await authenticatedPage.click('button:has-text("Skip")');

    // Wait for step 3
    await expect(authenticatedPage.locator('h1:has-text("Add Your Children")')).toBeVisible();

    // Step 3: Add child
    await addChild(authenticatedPage, "Emma Smith", generateTestDate(8));
    await authenticatedPage.click('button:has-text("Next")');

    // Wait for step 4
    await expect(authenticatedPage.locator('h1:has-text("Invite Family Members")')).toBeVisible();

    // Step 4: Send invitation
    await sendInvitation(authenticatedPage, generateTestEmail());

    // Finish onboarding
    await authenticatedPage.click('button:has-text("Finish")');

    // Should redirect to calendar
    await expect(authenticatedPage).toHaveURL(/\/calendar\/week/, { timeout: 10000 });

    // Verify onboarding storage is cleared
    const storage = await authenticatedPage.evaluate(() => {
      return localStorage.getItem("onboarding_progress");
    });
    expect(storage).toBeNull();
  });

  test("should complete onboarding with multiple children and invitations", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/onboarding/welcome");

    // Step 1: Create family
    await authenticatedPage.fill("#family-name", "Large Family");
    await authenticatedPage.click('button:has-text("Next")');
    await expect(authenticatedPage.locator('h1:has-text("Connect Your Calendar")')).toBeVisible();

    // Step 2: Skip calendar
    await authenticatedPage.click('button:has-text("Skip")');
    await expect(authenticatedPage.locator('h1:has-text("Add Your Children")')).toBeVisible();

    // Step 3: Add multiple children
    await addChild(authenticatedPage, "Emma", generateTestDate(8));
    await addChild(authenticatedPage, "Jack", generateTestDate(5));
    await addChild(authenticatedPage, "Sophie", generateTestDate(3));

    await authenticatedPage.click('button:has-text("Next")');
    await expect(authenticatedPage.locator('h1:has-text("Invite Family Members")')).toBeVisible();

    // Step 4: Send multiple invitations
    await sendInvitation(authenticatedPage, generateTestEmail());
    await sendInvitation(authenticatedPage, generateTestEmail());

    await authenticatedPage.click('button:has-text("Finish")');

    // Should complete successfully
    await expect(authenticatedPage).toHaveURL(/\/calendar\/week/, { timeout: 10000 });
  });

  test("should handle errors during onboarding flow", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/onboarding/welcome");

    // Step 1: Try to create family with error
    await authenticatedPage.route("**/api/families", (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Server error" }),
        });
      } else {
        route.continue();
      }
    });

    await authenticatedPage.fill("#family-name", "Test Family");
    await authenticatedPage.click('button:has-text("Next")');

    // Should show error
    await expect(authenticatedPage.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });

    // Should remain on step 1
    await expect(authenticatedPage.locator('h1:has-text("Welcome")')).toBeVisible();

    // Fix the API and retry
    await authenticatedPage.unroute("**/api/families");

    await authenticatedPage.click('button:has-text("Next")');

    // Should proceed
    await expect(authenticatedPage.locator('h1:has-text("Connect Your Calendar")')).toBeVisible();
  });

  test("should preserve progress through page reloads", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/onboarding/welcome");

    // Complete step 1
    const familyName = `Reload Test ${Date.now()}`;
    await authenticatedPage.fill("#family-name", familyName);
    await authenticatedPage.click('button:has-text("Next")');
    await expect(authenticatedPage.locator('h1:has-text("Connect Your Calendar")')).toBeVisible();

    // Reload page
    await authenticatedPage.reload();

    // Should still be on step 2
    await expect(authenticatedPage.locator('h1:has-text("Connect Your Calendar")')).toBeVisible();

    // Progress to step 3
    await authenticatedPage.click('button:has-text("Skip")');
    await expect(authenticatedPage.locator('h1:has-text("Add Your Children")')).toBeVisible();

    // Add a child
    await addChild(authenticatedPage, "Emma", generateTestDate(8));

    // Reload again
    await authenticatedPage.reload();

    // Should still be on step 3 with child
    await expect(authenticatedPage.locator('h1:has-text("Add Your Children")')).toBeVisible();
    await expect(authenticatedPage.locator("text=Emma")).toBeVisible();

    // Complete onboarding
    await authenticatedPage.click('button:has-text("Next")');
    await expect(authenticatedPage.locator('h1:has-text("Invite Family Members")')).toBeVisible();

    await authenticatedPage.click('button:has-text("Finish")');
    await expect(authenticatedPage).toHaveURL(/\/calendar\/week/, { timeout: 10000 });
  });

  test("should navigate back and forth through all steps", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/onboarding/welcome");

    // Step 1
    await authenticatedPage.fill("#family-name", "Navigation Test");
    await authenticatedPage.click('button:has-text("Next")');
    await expect(authenticatedPage.locator('h1:has-text("Connect Your Calendar")')).toBeVisible();

    // Step 2
    await authenticatedPage.click('button:has-text("Skip")');
    await expect(authenticatedPage.locator('h1:has-text("Add Your Children")')).toBeVisible();

    // Step 3
    await authenticatedPage.click('button:has-text("Next")');
    await expect(authenticatedPage.locator('h1:has-text("Invite Family Members")')).toBeVisible();

    // Navigate back to step 3
    await authenticatedPage.click('button:has-text("Back")');
    await expect(authenticatedPage.locator('h1:has-text("Add Your Children")')).toBeVisible();

    // Navigate back to step 2
    await authenticatedPage.click('button:has-text("Back")');
    await expect(authenticatedPage.locator('h1:has-text("Connect Your Calendar")')).toBeVisible();

    // Navigate back to step 1
    await authenticatedPage.click('button:has-text("Back")');
    await expect(authenticatedPage.locator('h1:has-text("Welcome")')).toBeVisible();

    // Back button should be disabled on step 1
    const backButton = authenticatedPage.locator('button:has-text("Back")');
    await expect(backButton).toBeDisabled();

    // Navigate forward again
    await authenticatedPage.click('button:has-text("Next")');
    await expect(authenticatedPage.locator('h1:has-text("Connect Your Calendar")')).toBeVisible();

    await authenticatedPage.click('button:has-text("Next")');
    await expect(authenticatedPage.locator('h1:has-text("Add Your Children")')).toBeVisible();

    await authenticatedPage.click('button:has-text("Next")');
    await expect(authenticatedPage.locator('h1:has-text("Invite Family Members")')).toBeVisible();
  });

  test("should show smooth transitions between steps", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/onboarding/welcome");

    await authenticatedPage.fill("#family-name", "Transition Test");

    // Click next and verify transition
    await authenticatedPage.click('button:has-text("Next")');

    // Wait for transition to complete
    await expect(authenticatedPage.locator('h1:has-text("Connect Your Calendar")')).toBeVisible();

    // Verify opacity transition class exists
    const content = authenticatedPage.locator('[class*="transition-opacity"]');
    await expect(content).toBeVisible();
  });

  test("should handle completing onboarding twice (edge case)", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/onboarding/welcome");

    // Complete minimal flow
    await authenticatedPage.fill("#family-name", "Edge Case Family");
    await authenticatedPage.click('button:has-text("Next")');
    await authenticatedPage.click('button:has-text("Skip")');
    await authenticatedPage.click('button:has-text("Next")');
    await authenticatedPage.click('button:has-text("Finish")');

    // Should redirect to calendar
    await expect(authenticatedPage).toHaveURL(/\/calendar\/week/, { timeout: 10000 });

    // Try to go back to onboarding
    await authenticatedPage.goto("/onboarding/welcome");

    // Should either:
    // 1. Start fresh onboarding (if allowed)
    // 2. Redirect to calendar (if onboarding already completed)
    // For now, we'll accept either behavior
    const url = authenticatedPage.url();
    expect(url).toMatch(/\/(onboarding|calendar)/);
  });

  test("should complete onboarding with calendar connection", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/onboarding/welcome");

    // Step 1
    await authenticatedPage.fill("#family-name", "Calendar Test");
    await authenticatedPage.click('button:has-text("Next")');
    await expect(authenticatedPage.locator('h1:has-text("Connect Your Calendar")')).toBeVisible();

    // Step 2: Mock calendar connection
    const calendarId = "test-cal-123";
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

    // Simulate successful calendar connection
    await authenticatedPage.goto(`/onboarding/welcome?status=success&calendar_id=${calendarId}`);
    await expect(authenticatedPage.locator("text=Connected")).toBeVisible();

    // Continue with onboarding
    await authenticatedPage.click('button:has-text("Next")');
    await expect(authenticatedPage.locator('h1:has-text("Add Your Children")')).toBeVisible();

    await authenticatedPage.click('button:has-text("Next")');
    await expect(authenticatedPage.locator('h1:has-text("Invite Family Members")')).toBeVisible();

    await authenticatedPage.click('button:has-text("Finish")');
    await expect(authenticatedPage).toHaveURL(/\/calendar\/week/, { timeout: 10000 });
  });

  test("should show progress indicator correctly throughout flow", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/onboarding/welcome");

    // Step 1
    await expect(authenticatedPage.locator('[aria-label*="Step 1"]')).toBeVisible();

    await authenticatedPage.fill("#family-name", "Progress Test");
    await authenticatedPage.click('button:has-text("Next")');

    // Step 2
    await expect(authenticatedPage.locator('[aria-label*="Step 2"]')).toBeVisible();
    await authenticatedPage.click('button:has-text("Skip")');

    // Step 3
    await expect(authenticatedPage.locator('[aria-label*="Step 3"]')).toBeVisible();
    await authenticatedPage.click('button:has-text("Next")');

    // Step 4
    await expect(authenticatedPage.locator('[aria-label*="Step 4"]')).toBeVisible();
  });
});
