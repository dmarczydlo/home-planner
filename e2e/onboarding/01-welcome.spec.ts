import { test, expect } from "../fixtures/auth";
import { completeWelcomeStep, getOnboardingProgress } from "../fixtures/helpers";

test.describe("Onboarding - Welcome Step", () => {
  test("should display welcome step with correct content", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/onboarding/welcome");

    // Verify heading
    await expect(authenticatedPage.locator("h1")).toContainText("Welcome to Home Planner!");

    // Verify description
    await expect(authenticatedPage.locator("text=Let's set up your family calendar")).toBeVisible();

    // Verify progress indicator shows step 1 of 4
    await expect(authenticatedPage.locator('[aria-label*="Step 1"]')).toBeVisible();

    // Verify family name input exists
    await expect(authenticatedPage.locator("#family-name")).toBeVisible();

    // Verify Next button exists
    await expect(authenticatedPage.locator('button:has-text("Next")')).toBeVisible();
  });

  test("should validate family name input - empty", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/onboarding/welcome");

    // Try to submit empty form
    await authenticatedPage.click('button:has-text("Next")');

    // HTML5 validation should prevent submission
    const input = authenticatedPage.locator("#family-name");
    const validationMessage = await input.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });

  test("should validate family name input - too long", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/onboarding/welcome");

    // Enter too long name (>100 chars)
    const longName = "a".repeat(101);
    await authenticatedPage.fill("#family-name", longName);

    // Should show character count
    await expect(authenticatedPage.locator("text=/101\\/100/")).toBeVisible();

    // Input should be truncated to 100 chars
    const inputValue = await authenticatedPage.locator("#family-name").inputValue();
    expect(inputValue.length).toBeLessThanOrEqual(100);
  });

  test("should create family and proceed to next step", async ({ authenticatedPage }) => {
    const familyName = `Test Family ${Date.now()}`;
    await authenticatedPage.goto("/onboarding/welcome");

    // Fill in family name
    await authenticatedPage.fill("#family-name", familyName);

    // Submit form
    await authenticatedPage.click('button:has-text("Next")');

    // Should proceed to step 2
    await expect(authenticatedPage.locator('h1:has-text("Connect Your Calendar")')).toBeVisible({
      timeout: 10000,
    });

    // Verify progress indicator shows step 2
    await expect(authenticatedPage.locator('[aria-label*="Step 2"]')).toBeVisible();

    // Verify family name is stored in localStorage
    const storage = await getOnboardingProgress(authenticatedPage);
    expect(storage.familyName).toBe(familyName);
    expect(storage.familyId).toBeTruthy();
    expect(storage.currentStep).toBe(2);
  });

  test("should handle family creation errors gracefully", async ({ authenticatedPage }) => {
    // Mock API error
    await authenticatedPage.route("**/api/families", (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal server error" }),
        });
      } else {
        route.continue();
      }
    });

    await authenticatedPage.goto("/onboarding/welcome");
    await authenticatedPage.fill("#family-name", "Test Family");
    await authenticatedPage.click('button:has-text("Next")');

    // Should show error message
    await expect(authenticatedPage.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });

    // Should remain on same step
    await expect(authenticatedPage.locator('h1:has-text("Welcome")')).toBeVisible();
  });

  test("should preserve family name when typing", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/onboarding/welcome");

    const familyName = "Smith Family";
    await authenticatedPage.fill("#family-name", familyName);

    // Verify input value
    const inputValue = await authenticatedPage.locator("#family-name").inputValue();
    expect(inputValue).toBe(familyName);

    // Verify character count
    await expect(authenticatedPage.locator(`text=${familyName.length}/100`)).toBeVisible();
  });

  test("should clear error when user starts typing", async ({ authenticatedPage }) => {
    // Mock API error
    await authenticatedPage.route("**/api/families", (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ error: "Invalid family name" }),
        });
      } else {
        route.continue();
      }
    });

    await authenticatedPage.goto("/onboarding/welcome");
    await authenticatedPage.fill("#family-name", "Test");
    await authenticatedPage.click('button:has-text("Next")');

    // Wait for error
    await expect(authenticatedPage.locator('[role="alert"]')).toBeVisible();

    // Start typing again
    await authenticatedPage.fill("#family-name", "Test Family");

    // Error should be cleared
    await expect(authenticatedPage.locator('[role="alert"]')).not.toBeVisible();
  });

  test("should show loading state during submission", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/onboarding/welcome");
    await authenticatedPage.fill("#family-name", "Test Family");

    // Click Next
    const nextButton = authenticatedPage.locator('button:has-text("Next")');
    await nextButton.click();

    // Button should be disabled during submission
    await expect(nextButton).toBeDisabled();

    // Wait for completion
    await expect(authenticatedPage.locator('h1:has-text("Connect Your Calendar")')).toBeVisible({
      timeout: 10000,
    });
  });
});
