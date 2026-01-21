import { Page, expect } from "@playwright/test";

export async function completeWelcomeStep(page: Page, familyName?: string) {
  const name = familyName || `Test Family ${Date.now()}`;

  await page.goto("/onboarding/welcome");
  await page.fill("#family-name", name);
  await page.click('button:has-text("Next")');

  // Wait for step 2
  await expect(page.locator('h1:has-text("Connect Your Calendar")')).toBeVisible({ timeout: 10000 });

  return name;
}

export async function completeSteps(page: Page, upToStep: number) {
  if (upToStep >= 1) {
    await completeWelcomeStep(page);
  }

  if (upToStep >= 2) {
    await page.click('button:has-text("Skip")');
    await expect(page.locator('h1:has-text("Add Your Children")')).toBeVisible({ timeout: 10000 });
  }

  if (upToStep >= 3) {
    await page.click('button:has-text("Next")');
    await expect(page.locator('h1:has-text("Invite Family Members")')).toBeVisible({ timeout: 10000 });
  }
}

export async function addChild(page: Page, name: string, dateOfBirth: string) {
  await page.click('button:has-text("+ Add Child")');

  // Wait for dialog to open
  await expect(page.locator('[role="dialog"]')).toBeVisible();

  await page.fill('input[name="name"]', name);
  await page.fill('input[name="date_of_birth"]', dateOfBirth);

  await page.click('button[type="submit"]:has-text("Add Child")');

  // Wait for dialog to close
  await expect(page.locator('[role="dialog"]')).not.toBeVisible();

  // Verify child appears
  await expect(page.locator(`text=${name}`)).toBeVisible();
}

export async function sendInvitation(page: Page, email: string) {
  await page.fill("#invite-email", email);
  await page.click('button:has-text("Send Invitation")');

  // Verify invitation appears
  await expect(page.locator(`text=${email}`)).toBeVisible();
}

export async function mockCalendarConnection(page: Page, provider: "google" | "microsoft" = "google") {
  const calendarId = `cal-${Date.now()}`;

  // Mock OAuth initiation
  await page.route("**/api/external-calendars/initiate**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        authorization_url: `http://localhost:4321/mock-oauth-redirect?provider=${provider}&calendar_id=${calendarId}`,
        state: "mock-state-token",
      }),
    });
  });

  // Mock OAuth redirect
  await page.route(`**/mock-oauth-redirect**`, async (route) => {
    const returnUrl = `/onboarding/welcome?status=success&calendar_id=${calendarId}`;

    await route.fulfill({
      status: 302,
      headers: {
        Location: returnUrl,
      },
    });
  });

  // Mock calendar list after connection
  await page.route("**/api/external-calendars", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: calendarId,
            provider: provider,
            email: `test@${provider === "google" ? "gmail" : "outlook"}.com`,
            is_primary: true,
          },
        ]),
      });
    } else {
      await route.continue();
    }
  });

  return calendarId;
}

export async function clearOnboardingProgress(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem("onboarding_progress");
  });
}

export async function getOnboardingProgress(page: Page) {
  return await page.evaluate(() => {
    const progress = localStorage.getItem("onboarding_progress");
    return progress ? JSON.parse(progress) : null;
  });
}

export async function setOnboardingProgress(page: Page, progress: unknown) {
  await page.evaluate((data) => {
    localStorage.setItem("onboarding_progress", JSON.stringify(data));
  }, progress);
}

export function generateTestEmail() {
  return `test-${Date.now()}@example.com`;
}

export function generateTestDate(yearsAgo: number) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - yearsAgo);
  return date.toISOString().split("T")[0];
}
