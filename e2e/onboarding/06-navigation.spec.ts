import { test, expect } from "../fixtures/auth";
import {
  completeSteps,
  addChild,
  sendInvitation,
  getOnboardingProgress,
  setOnboardingProgress,
  clearOnboardingProgress,
  generateTestDate,
  generateTestEmail,
} from "../fixtures/helpers";

test.describe("Onboarding - Navigation and State Management", () => {
  test("should navigate back through steps", async ({ authenticatedPage }) => {
    await completeSteps(authenticatedPage, 3);

    // Currently on step 4
    await expect(authenticatedPage.locator('h1:has-text("Invite Family Members")')).toBeVisible();

    // Go back to step 3
    await authenticatedPage.click('button:has-text("Back")');
    await expect(authenticatedPage.locator('h1:has-text("Add Your Children")')).toBeVisible();

    // Go back to step 2
    await authenticatedPage.click('button:has-text("Back")');
    await expect(authenticatedPage.locator('h1:has-text("Connect Your Calendar")')).toBeVisible();

    // Go back to step 1
    await authenticatedPage.click('button:has-text("Back")');
    await expect(authenticatedPage.locator('h1:has-text("Welcome")')).toBeVisible();

    // Back button should be disabled on step 1
    const backButton = authenticatedPage.locator('button:has-text("Back")');
    await expect(backButton).toBeDisabled();
  });

  test("should preserve data when navigating back and forward", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/onboarding/welcome");

    // Fill family name
    const familyName = "Navigation Test Family";
    await authenticatedPage.fill("#family-name", familyName);
    await authenticatedPage.click('button:has-text("Next")');
    await expect(authenticatedPage.locator('h1:has-text("Connect Your Calendar")')).toBeVisible();

    // Skip calendar
    await authenticatedPage.click('button:has-text("Skip")');
    await expect(authenticatedPage.locator('h1:has-text("Add Your Children")')).toBeVisible();

    // Add child
    const childName = "Emma";
    await addChild(authenticatedPage, childName, generateTestDate(8));

    // Go to next step
    await authenticatedPage.click('button:has-text("Next")');
    await expect(authenticatedPage.locator('h1:has-text("Invite Family Members")')).toBeVisible();

    // Send invitation
    const email = generateTestEmail();
    await sendInvitation(authenticatedPage, email);

    // Navigate back to step 3
    await authenticatedPage.click('button:has-text("Back")');
    await expect(authenticatedPage.locator('h1:has-text("Add Your Children")')).toBeVisible();

    // Child should still be there
    await expect(authenticatedPage.locator(`text=${childName}`)).toBeVisible();

    // Navigate back to step 2
    await authenticatedPage.click('button:has-text("Back")');
    await expect(authenticatedPage.locator('h1:has-text("Connect Your Calendar")')).toBeVisible();

    // Navigate back to step 1
    await authenticatedPage.click('button:has-text("Back")');
    await expect(authenticatedPage.locator('h1:has-text("Welcome")')).toBeVisible();

    // Family name should still be there
    await expect(authenticatedPage.locator("#family-name")).toHaveValue(familyName);

    // Navigate forward again
    await authenticatedPage.click('button:has-text("Next")');
    await authenticatedPage.click('button:has-text("Next")');
    await expect(authenticatedPage.locator('h1:has-text("Add Your Children")')).toBeVisible();

    // Child should still be there
    await expect(authenticatedPage.locator(`text=${childName}`)).toBeVisible();

    // Navigate to step 4
    await authenticatedPage.click('button:has-text("Next")');
    await expect(authenticatedPage.locator('h1:has-text("Invite Family Members")')).toBeVisible();

    // Invitation should still be there
    await expect(authenticatedPage.locator(`text=${email}`)).toBeVisible();
  });

  test("should resume onboarding from saved progress", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/onboarding/welcome");

    // Complete step 1
    await authenticatedPage.fill("#family-name", "Resume Test");
    await authenticatedPage.click('button:has-text("Next")');
    await expect(authenticatedPage.locator('h1:has-text("Connect Your Calendar")')).toBeVisible();

    // Skip to step 3
    await authenticatedPage.click('button:has-text("Skip")');
    await expect(authenticatedPage.locator('h1:has-text("Add Your Children")')).toBeVisible();

    // Add child
    await addChild(authenticatedPage, "Emma", generateTestDate(8));

    // Verify progress is saved
    let storage = await getOnboardingProgress(authenticatedPage);
    expect(storage.currentStep).toBe(3);
    expect(storage.children).toHaveLength(1);

    // Reload page
    await authenticatedPage.reload();

    // Should resume on step 3 with data preserved
    await expect(authenticatedPage.locator('h1:has-text("Add Your Children")')).toBeVisible();
    await expect(authenticatedPage.locator("text=Emma")).toBeVisible();

    // Verify storage is still intact
    storage = await getOnboardingProgress(authenticatedPage);
    expect(storage.currentStep).toBe(3);
    expect(storage.children).toHaveLength(1);
  });

  test("should handle browser back button", async ({ authenticatedPage }) => {
    await completeSteps(authenticatedPage, 2);

    // Currently on step 3
    await expect(authenticatedPage.locator('h1:has-text("Add Your Children")')).toBeVisible();

    // Use browser back button
    await authenticatedPage.goBack();

    // Should be on step 2
    await expect(authenticatedPage.locator('h1:has-text("Connect Your Calendar")')).toBeVisible();

    // Use browser forward button
    await authenticatedPage.goForward();

    // Should be back on step 3
    await expect(authenticatedPage.locator('h1:has-text("Add Your Children")')).toBeVisible();
  });

  test("should clear onboarding progress after completion", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/onboarding/welcome");

    // Complete minimal flow
    await authenticatedPage.fill("#family-name", "Clear Test");
    await authenticatedPage.click('button:has-text("Next")');
    await authenticatedPage.click('button:has-text("Skip")');
    await authenticatedPage.click('button:has-text("Next")');
    await authenticatedPage.click('button:has-text("Finish")');

    // Should redirect to calendar
    await expect(authenticatedPage).toHaveURL(/\/calendar\/week/, { timeout: 10000 });

    // Verify onboarding storage is cleared
    const storage = await authenticatedPage.evaluate(() => {
      return localStorage.getItem("onboarding_progress");
    });
    expect(storage).toBeNull();
  });

  test("should handle direct URL access to specific steps", async ({ authenticatedPage }) => {
    // Set progress to step 3 with valid data
    await authenticatedPage.goto("/onboarding/welcome");

    await setOnboardingProgress(authenticatedPage, {
      currentStep: 3,
      familyId: "test-family-123",
      familyName: "Test Family",
      children: [],
      invitations: [],
      connectedCalendars: [],
    });

    await authenticatedPage.reload();

    // Should show step 3
    await expect(authenticatedPage.locator('h1:has-text("Add Your Children")')).toBeVisible();
  });

  test("should handle invalid progress state", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/onboarding/welcome");

    // Set invalid progress (step 3 without family ID)
    await setOnboardingProgress(authenticatedPage, {
      currentStep: 3,
      familyId: null,
      familyName: "",
      children: [],
      invitations: [],
      connectedCalendars: [],
    });

    await authenticatedPage.reload();

    // Should show error or reset to step 1
    // The exact behavior depends on implementation
    const url = authenticatedPage.url();
    expect(url).toContain("/onboarding/welcome");
  });

  test("should persist progress across multiple page loads", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/onboarding/welcome");

    // Step 1
    await authenticatedPage.fill("#family-name", "Persistence Test");
    await authenticatedPage.click('button:has-text("Next")');

    // Reload
    await authenticatedPage.reload();
    await expect(authenticatedPage.locator('h1:has-text("Connect Your Calendar")')).toBeVisible();

    // Step 2
    await authenticatedPage.click('button:has-text("Skip")');

    // Reload
    await authenticatedPage.reload();
    await expect(authenticatedPage.locator('h1:has-text("Add Your Children")')).toBeVisible();

    // Add child
    await addChild(authenticatedPage, "Emma", generateTestDate(8));

    // Reload
    await authenticatedPage.reload();
    await expect(authenticatedPage.locator("text=Emma")).toBeVisible();

    // Step 3
    await authenticatedPage.click('button:has-text("Next")');

    // Reload
    await authenticatedPage.reload();
    await expect(authenticatedPage.locator('h1:has-text("Invite Family Members")')).toBeVisible();
  });

  test("should handle corrupted localStorage data", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/onboarding/welcome");

    // Set corrupted data
    await authenticatedPage.evaluate(() => {
      localStorage.setItem("onboarding_progress", "invalid json {{{");
    });

    // Reload
    await authenticatedPage.reload();

    // Should handle gracefully and start fresh
    await expect(authenticatedPage.locator('h1:has-text("Welcome")')).toBeVisible();

    // Should be able to proceed normally
    await authenticatedPage.fill("#family-name", "Recovery Test");
    await authenticatedPage.click('button:has-text("Next")');
    await expect(authenticatedPage.locator('h1:has-text("Connect Your Calendar")')).toBeVisible();
  });

  test("should maintain step consistency", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/onboarding/welcome");

    // Complete step 1
    await authenticatedPage.fill("#family-name", "Consistency Test");
    await authenticatedPage.click('button:has-text("Next")');

    // Verify we're on step 2
    let storage = await getOnboardingProgress(authenticatedPage);
    expect(storage.currentStep).toBe(2);
    await expect(authenticatedPage.locator('[aria-label*="Step 2"]')).toBeVisible();

    // Skip to step 3
    await authenticatedPage.click('button:has-text("Skip")');

    // Verify we're on step 3
    storage = await getOnboardingProgress(authenticatedPage);
    expect(storage.currentStep).toBe(3);
    await expect(authenticatedPage.locator('[aria-label*="Step 3"]')).toBeVisible();

    // Go back to step 2
    await authenticatedPage.click('button:has-text("Back")');

    // Verify we're back on step 2
    storage = await getOnboardingProgress(authenticatedPage);
    expect(storage.currentStep).toBe(2);
    await expect(authenticatedPage.locator('[aria-label*="Step 2"]')).toBeVisible();
  });

  test("should handle rapid navigation", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/onboarding/welcome");

    await authenticatedPage.fill("#family-name", "Rapid Test");
    await authenticatedPage.click('button:has-text("Next")');
    await expect(authenticatedPage.locator('h1:has-text("Connect Your Calendar")')).toBeVisible();

    // Rapidly click next/skip
    await authenticatedPage.click('button:has-text("Skip")');
    await authenticatedPage.click('button:has-text("Next")');

    // Should end up on step 4
    await expect(authenticatedPage.locator('h1:has-text("Invite Family Members")')).toBeVisible();

    // Rapidly click back
    await authenticatedPage.click('button:has-text("Back")');
    await authenticatedPage.click('button:has-text("Back")');

    // Should end up on step 2
    await expect(authenticatedPage.locator('h1:has-text("Connect Your Calendar")')).toBeVisible();
  });
});
