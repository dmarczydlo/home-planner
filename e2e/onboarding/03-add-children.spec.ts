import { test, expect } from "../fixtures/auth";
import { completeSteps, addChild, getOnboardingProgress, generateTestDate } from "../fixtures/helpers";

test.describe("Onboarding - Add Children Step", () => {
  test("should display add children step", async ({ authenticatedPage }) => {
    await completeSteps(authenticatedPage, 2);

    // Verify heading
    await expect(authenticatedPage.locator('h1:has-text("Add Your Children")')).toBeVisible();

    // Verify description
    await expect(authenticatedPage.locator("text=Add children to your family calendar")).toBeVisible();

    // Verify Add Child button
    await expect(authenticatedPage.locator('button:has-text("+ Add Child")')).toBeVisible();

    // Verify progress indicator
    await expect(authenticatedPage.locator('[aria-label*="Step 3"]')).toBeVisible();
  });

  test("should add a child successfully", async ({ authenticatedPage }) => {
    await completeSteps(authenticatedPage, 2);

    const childName = "Emma Smith";
    const dateOfBirth = generateTestDate(8);

    await addChild(authenticatedPage, childName, dateOfBirth);

    // Should display child card
    await expect(authenticatedPage.locator(`text=${childName}`)).toBeVisible();

    // Verify child is stored
    const storage = await getOnboardingProgress(authenticatedPage);
    expect(storage.children).toHaveLength(1);
    expect(storage.children[0].name).toBe(childName);
  });

  test("should open and close child form dialog", async ({ authenticatedPage }) => {
    await completeSteps(authenticatedPage, 2);

    // Click Add Child button
    await authenticatedPage.click('button:has-text("+ Add Child")');

    // Should open dialog
    await expect(authenticatedPage.locator('[role="dialog"]')).toBeVisible();

    // Close dialog (click outside or close button)
    await authenticatedPage.keyboard.press("Escape");

    // Should close dialog
    await expect(authenticatedPage.locator('[role="dialog"]')).not.toBeVisible();
  });

  test("should validate child form - empty fields", async ({ authenticatedPage }) => {
    await completeSteps(authenticatedPage, 2);

    await authenticatedPage.click('button:has-text("+ Add Child")');
    await expect(authenticatedPage.locator('[role="dialog"]')).toBeVisible();

    // Try to submit empty form
    await authenticatedPage.click('button[type="submit"]:has-text("Add Child")');

    // Should show validation errors (HTML5 validation)
    const nameInput = authenticatedPage.locator('input[name="name"]');
    const nameValidation = await nameInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(nameValidation).toBeTruthy();
  });

  test("should validate child form - future date", async ({ authenticatedPage }) => {
    await completeSteps(authenticatedPage, 2);

    await authenticatedPage.click('button:has-text("+ Add Child")');
    await expect(authenticatedPage.locator('[role="dialog"]')).toBeVisible();

    // Enter future date
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDateStr = futureDate.toISOString().split("T")[0];

    await authenticatedPage.fill('input[name="name"]', "Future Baby");
    await authenticatedPage.fill('input[name="date_of_birth"]', futureDateStr);

    await authenticatedPage.click('button[type="submit"]:has-text("Add Child")');

    // Should show validation error
    await expect(authenticatedPage.locator("text=/cannot be in the future/i")).toBeVisible();
  });

  test("should add multiple children", async ({ authenticatedPage }) => {
    await completeSteps(authenticatedPage, 2);

    // Add first child
    await addChild(authenticatedPage, "Emma Smith", generateTestDate(8));

    // Add second child
    await addChild(authenticatedPage, "Jack Smith", generateTestDate(5));

    // Should display both children
    await expect(authenticatedPage.locator("text=Emma Smith")).toBeVisible();
    await expect(authenticatedPage.locator("text=Jack Smith")).toBeVisible();

    // Verify both stored
    const storage = await getOnboardingProgress(authenticatedPage);
    expect(storage.children).toHaveLength(2);
  });

  test("should remove a child", async ({ authenticatedPage }) => {
    await completeSteps(authenticatedPage, 2);

    const childName = "Emma Smith";
    await addChild(authenticatedPage, childName, generateTestDate(8));

    // Find and click remove button
    const removeButton = authenticatedPage.locator(`button[aria-label*="Remove ${childName}"]`);
    await removeButton.click();

    // Should show confirmation dialog
    await expect(authenticatedPage.locator("text=/are you sure/i")).toBeVisible();

    // Confirm removal
    await authenticatedPage.click('button:has-text("Remove")');

    // Child should be removed
    await expect(authenticatedPage.locator(`text=${childName}`)).not.toBeVisible();

    // Verify removed from storage
    const storage = await getOnboardingProgress(authenticatedPage);
    expect(storage.children).toHaveLength(0);
  });

  test("should cancel child removal", async ({ authenticatedPage }) => {
    await completeSteps(authenticatedPage, 2);

    const childName = "Emma Smith";
    await addChild(authenticatedPage, childName, generateTestDate(8));

    // Click remove button
    const removeButton = authenticatedPage.locator(`button[aria-label*="Remove ${childName}"]`);
    await removeButton.click();

    // Should show confirmation dialog
    await expect(authenticatedPage.locator("text=/are you sure/i")).toBeVisible();

    // Cancel removal
    await authenticatedPage.click('button:has-text("Cancel")');

    // Child should still be there
    await expect(authenticatedPage.locator(`text=${childName}`)).toBeVisible();

    // Verify still in storage
    const storage = await getOnboardingProgress(authenticatedPage);
    expect(storage.children).toHaveLength(1);
  });

  test("should skip adding children", async ({ authenticatedPage }) => {
    await completeSteps(authenticatedPage, 2);

    // Click Next without adding children
    await authenticatedPage.click('button:has-text("Next")');

    // Should proceed to step 4
    await expect(authenticatedPage.locator('h1:has-text("Invite Family Members")')).toBeVisible();

    // Verify no children in storage
    const storage = await getOnboardingProgress(authenticatedPage);
    expect(storage.children).toHaveLength(0);
  });

  test("should proceed to next step after adding children", async ({ authenticatedPage }) => {
    await completeSteps(authenticatedPage, 2);

    await addChild(authenticatedPage, "Emma Smith", generateTestDate(8));

    // Click Next
    await authenticatedPage.click('button:has-text("Next")');

    // Should proceed to step 4
    await expect(authenticatedPage.locator('h1:has-text("Invite Family Members")')).toBeVisible();

    // Verify progress
    const storage = await getOnboardingProgress(authenticatedPage);
    expect(storage.currentStep).toBe(4);
    expect(storage.children).toHaveLength(1);
  });

  test("should handle API errors when adding child", async ({ authenticatedPage }) => {
    await completeSteps(authenticatedPage, 2);

    // Mock API error
    await authenticatedPage.route("**/api/families/*/children", (route) => {
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

    await authenticatedPage.click('button:has-text("+ Add Child")');
    await expect(authenticatedPage.locator('[role="dialog"]')).toBeVisible();

    await authenticatedPage.fill('input[name="name"]', "Emma Smith");
    await authenticatedPage.fill('input[name="date_of_birth"]', generateTestDate(8));

    await authenticatedPage.click('button[type="submit"]:has-text("Add Child")');

    // Should show error message
    await expect(authenticatedPage.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });

    // Dialog should remain open
    await expect(authenticatedPage.locator('[role="dialog"]')).toBeVisible();
  });

  test("should display age correctly", async ({ authenticatedPage }) => {
    await completeSteps(authenticatedPage, 2);

    const eightYearsAgo = generateTestDate(8);
    await addChild(authenticatedPage, "Emma Smith", eightYearsAgo);

    // Should show age (approximately 8 years old)
    await expect(authenticatedPage.locator("text=/8 years old/i")).toBeVisible();
  });

  test("should preserve children when navigating back", async ({ authenticatedPage }) => {
    await completeSteps(authenticatedPage, 2);

    await addChild(authenticatedPage, "Emma Smith", generateTestDate(8));

    // Go to next step
    await authenticatedPage.click('button:has-text("Next")');
    await expect(authenticatedPage.locator('h1:has-text("Invite Family Members")')).toBeVisible();

    // Go back
    await authenticatedPage.click('button:has-text("Back")');
    await expect(authenticatedPage.locator('h1:has-text("Add Your Children")')).toBeVisible();

    // Child should still be there
    await expect(authenticatedPage.locator("text=Emma Smith")).toBeVisible();
  });
});
