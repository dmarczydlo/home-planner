import { test, expect } from "../fixtures/auth";
import { completeSteps, sendInvitation, getOnboardingProgress, generateTestEmail } from "../fixtures/helpers";

test.describe("Onboarding - Invite Members Step", () => {
  test("should display invite members step", async ({ authenticatedPage }) => {
    await completeSteps(authenticatedPage, 3);

    // Verify heading
    await expect(authenticatedPage.locator('h1:has-text("Invite Family Members")')).toBeVisible();

    // Verify description
    await expect(authenticatedPage.locator("text=Invite family members to join your calendar")).toBeVisible();

    // Verify email input
    await expect(authenticatedPage.locator("#invite-email")).toBeVisible();

    // Verify send button
    await expect(authenticatedPage.locator('button:has-text("Send Invitation")')).toBeVisible();

    // Verify Finish button
    await expect(authenticatedPage.locator('button:has-text("Finish")')).toBeVisible();

    // Verify progress indicator
    await expect(authenticatedPage.locator('[aria-label*="Step 4"]')).toBeVisible();
  });

  test("should send invitation successfully", async ({ authenticatedPage }) => {
    await completeSteps(authenticatedPage, 3);

    const email = generateTestEmail();
    await sendInvitation(authenticatedPage, email);

    // Should display invitation card
    await expect(authenticatedPage.locator(`text=${email}`)).toBeVisible();
    await expect(authenticatedPage.locator("text=Pending")).toBeVisible();

    // Email input should be cleared
    await expect(authenticatedPage.locator("#invite-email")).toHaveValue("");

    // Verify stored
    const storage = await getOnboardingProgress(authenticatedPage);
    expect(storage.invitations).toHaveLength(1);
    expect(storage.invitations[0].invitee_email).toBe(email);
  });

  test("should send multiple invitations", async ({ authenticatedPage }) => {
    await completeSteps(authenticatedPage, 3);

    const email1 = generateTestEmail();
    const email2 = generateTestEmail();

    await sendInvitation(authenticatedPage, email1);
    await sendInvitation(authenticatedPage, email2);

    // Should display both
    await expect(authenticatedPage.locator(`text=${email1}`)).toBeVisible();
    await expect(authenticatedPage.locator(`text=${email2}`)).toBeVisible();

    // Verify both stored
    const storage = await getOnboardingProgress(authenticatedPage);
    expect(storage.invitations).toHaveLength(2);
  });

  test("should validate email format", async ({ authenticatedPage }) => {
    await completeSteps(authenticatedPage, 3);

    // Enter invalid email
    await authenticatedPage.fill("#invite-email", "invalid-email");
    await authenticatedPage.click('button:has-text("Send Invitation")');

    // HTML5 validation should prevent submission
    const emailInput = authenticatedPage.locator("#invite-email");
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });

  test("should validate required email", async ({ authenticatedPage }) => {
    await completeSteps(authenticatedPage, 3);

    // Try to submit without email
    await authenticatedPage.click('button:has-text("Send Invitation")');

    // HTML5 validation should prevent submission
    const emailInput = authenticatedPage.locator("#invite-email");
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });

  test("should handle duplicate invitation error", async ({ authenticatedPage }) => {
    await completeSteps(authenticatedPage, 3);

    const email = generateTestEmail();

    // Send first invitation
    await sendInvitation(authenticatedPage, email);

    // Mock duplicate error for second attempt
    await authenticatedPage.route("**/api/families/*/invitations", (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 409,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Invitation already exists for this email",
          }),
        });
      } else {
        route.continue();
      }
    });

    // Try to send same email again
    await authenticatedPage.fill("#invite-email", email);
    await authenticatedPage.click('button:has-text("Send Invitation")');

    // Should show error
    await expect(authenticatedPage.locator('[role="alert"]')).toContainText("already exists", { timeout: 5000 });
  });

  test("should handle API errors when sending invitation", async ({ authenticatedPage }) => {
    await completeSteps(authenticatedPage, 3);

    // Mock API error
    await authenticatedPage.route("**/api/families/*/invitations", (route) => {
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

    await authenticatedPage.fill("#invite-email", generateTestEmail());
    await authenticatedPage.click('button:has-text("Send Invitation")');

    // Should show error message
    await expect(authenticatedPage.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });
  });

  test("should clear error when typing new email", async ({ authenticatedPage }) => {
    await completeSteps(authenticatedPage, 3);

    // Mock API error
    await authenticatedPage.route("**/api/families/*/invitations", (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ error: "Invalid email" }),
        });
      } else {
        route.continue();
      }
    });

    await authenticatedPage.fill("#invite-email", "test@example.com");
    await authenticatedPage.click('button:has-text("Send Invitation")');

    // Wait for error
    await expect(authenticatedPage.locator('[role="alert"]')).toBeVisible();

    // Start typing again
    await authenticatedPage.fill("#invite-email", "new@example.com");

    // Error should be cleared
    await expect(authenticatedPage.locator('[role="alert"]')).not.toBeVisible();
  });

  test("should finish onboarding without invitations", async ({ authenticatedPage }) => {
    await completeSteps(authenticatedPage, 3);

    // Click Finish without sending invitations
    await authenticatedPage.click('button:has-text("Finish")');

    // Should redirect to calendar
    await expect(authenticatedPage).toHaveURL(/\/calendar\/week/, { timeout: 10000 });

    // Verify onboarding storage is cleared
    const storage = await authenticatedPage.evaluate(() => {
      return localStorage.getItem("onboarding_progress");
    });
    expect(storage).toBeNull();
  });

  test("should finish onboarding with invitations", async ({ authenticatedPage }) => {
    await completeSteps(authenticatedPage, 3);

    // Send invitation
    await sendInvitation(authenticatedPage, generateTestEmail());

    // Click Finish
    await authenticatedPage.click('button:has-text("Finish")');

    // Should redirect to calendar
    await expect(authenticatedPage).toHaveURL(/\/calendar\/week/, { timeout: 10000 });
  });

  test("should show loading state when sending invitation", async ({ authenticatedPage }) => {
    await completeSteps(authenticatedPage, 3);

    await authenticatedPage.fill("#invite-email", generateTestEmail());

    // Click send
    const sendButton = authenticatedPage.locator('button:has-text("Send Invitation")');
    await sendButton.click();

    // Button should show loading state
    await expect(sendButton).toContainText("Sending...");
    await expect(sendButton).toBeDisabled();

    // Wait for completion
    await expect(authenticatedPage.locator("text=Pending")).toBeVisible({ timeout: 5000 });
  });

  test("should preserve invitations when navigating back", async ({ authenticatedPage }) => {
    await completeSteps(authenticatedPage, 3);

    const email = generateTestEmail();
    await sendInvitation(authenticatedPage, email);

    // Go back
    await authenticatedPage.click('button:has-text("Back")');
    await expect(authenticatedPage.locator('h1:has-text("Add Your Children")')).toBeVisible();

    // Go forward
    await authenticatedPage.click('button:has-text("Next")');
    await expect(authenticatedPage.locator('h1:has-text("Invite Family Members")')).toBeVisible();

    // Invitation should still be there
    await expect(authenticatedPage.locator(`text=${email}`)).toBeVisible();
  });

  test("should display invitation status", async ({ authenticatedPage }) => {
    await completeSteps(authenticatedPage, 3);

    await sendInvitation(authenticatedPage, generateTestEmail());

    // Should show pending status
    await expect(authenticatedPage.locator("text=Pending")).toBeVisible();
  });

  test("should handle very long email addresses", async ({ authenticatedPage }) => {
    await completeSteps(authenticatedPage, 3);

    const longEmail = `very.long.email.address.that.is.still.valid@example.com`;
    await sendInvitation(authenticatedPage, longEmail);

    // Should display the email (possibly truncated in UI)
    await expect(authenticatedPage.locator(`text=${longEmail}`)).toBeVisible();
  });
});
