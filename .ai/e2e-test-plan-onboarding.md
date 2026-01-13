# E2E Test Plan: Onboarding Flow

## Overview

This document outlines the end-to-end testing strategy for the HomePlanner onboarding flow using Playwright. The onboarding consists of 4 steps that guide new users through setting up their family calendar.

## Test Environment Setup

### Prerequisites

1. **Install Playwright**
```bash
pnpm add -D @playwright/test
pnpm exec playwright install
```

2. **Configuration File** (`playwright.config.ts`)
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Onboarding tests should run sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
  },
});
```

3. **Test Database Setup**
- Use Supabase local development or a dedicated test instance
- Ensure test data can be seeded and cleaned up between tests

## Authentication Strategy

### Google OAuth Testing Approach

Since Google OAuth involves external authentication, we have several strategies:

#### Strategy 1: Mock OAuth Flow (Recommended for CI/CD)

**Approach**: Intercept OAuth requests and mock the authentication response.

```typescript
// e2e/fixtures/auth.ts
import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export async function mockGoogleAuth(page: Page, userData = {
  id: 'test-user-123',
  email: 'test@example.com',
  full_name: 'Test User'
}) {
  // Intercept the OAuth initiation
  await page.route('**/auth/v1/authorize**', async (route) => {
    // Redirect directly to callback with mock session
    const callbackUrl = new URL('http://localhost:4321/auth/callback');
    callbackUrl.searchParams.set('code', 'mock-auth-code');
    await route.fulfill({
      status: 302,
      headers: {
        'Location': callbackUrl.toString()
      }
    });
  });

  // Mock the token exchange
  await page.route('**/auth/v1/token**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: userData
      })
    });
  });

  // Mock session endpoint
  await page.route('**/auth/v1/user**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(userData)
    });
  });
}

// Create authenticated context fixture
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await mockGoogleAuth(page);
    await page.goto('/');
    await page.click('button:has-text("Sign in with Google")');
    await page.waitForURL('/onboarding/welcome');
    await use(page);
  },
});
```

#### Strategy 2: Use Supabase Test User (For Local Testing)

**Approach**: Create a test user directly in Supabase and set session cookies.

```typescript
// e2e/fixtures/supabase-auth.ts
import { createClient } from '@supabase/supabase-js';
import type { Page } from '@playwright/test';

export async function authenticateWithSupabase(page: Page) {
  const supabase = createClient(
    process.env.PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role for testing
  );

  // Create or get test user
  const { data: authData, error } = await supabase.auth.admin.createUser({
    email: 'e2e-test@example.com',
    password: 'test-password-123',
    email_confirm: true,
    user_metadata: {
      full_name: 'E2E Test User'
    }
  });

  if (error && error.message !== 'User already registered') {
    throw error;
  }

  // Sign in as test user
  const { data: session } = await supabase.auth.signInWithPassword({
    email: 'e2e-test@example.com',
    password: 'test-password-123'
  });

  // Set session in browser
  await page.goto('/');
  await page.evaluate((sessionData) => {
    localStorage.setItem('supabase.auth.token', JSON.stringify(sessionData));
  }, session);

  await page.reload();
}
```

#### Strategy 3: Record and Replay (For Manual Testing)

**Approach**: Use Playwright's authentication state persistence.

```typescript
// e2e/global-setup.ts
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Manually sign in once
  await page.goto('http://localhost:4321');
  await page.click('button:has-text("Sign in with Google")');
  
  // Wait for manual authentication
  await page.waitForURL('**/onboarding/**', { timeout: 60000 });
  
  // Save authentication state
  await page.context().storageState({ path: 'e2e/.auth/user.json' });
  await browser.close();
}

export default globalSetup;

// Then in tests:
test.use({ storageState: 'e2e/.auth/user.json' });
```

**Recommendation**: Use Strategy 1 (Mock OAuth) for CI/CD and Strategy 2 (Supabase Test User) for local development.

## Test Structure

```
e2e/
├── fixtures/
│   ├── auth.ts              # Authentication helpers
│   ├── database.ts          # Database setup/teardown
│   └── test-data.ts         # Test data generators
├── onboarding/
│   ├── 01-welcome.spec.ts
│   ├── 02-connect-calendar.spec.ts
│   ├── 03-add-children.spec.ts
│   ├── 04-invite-members.spec.ts
│   ├── 05-complete-flow.spec.ts
│   └── 06-navigation.spec.ts
└── global-setup.ts
```

## Test Scenarios

### Test Suite 1: Welcome Step (Step 1)

**File**: `e2e/onboarding/01-welcome.spec.ts`

#### Test 1.1: Display Welcome Step
```typescript
test('should display welcome step with correct content', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/onboarding/welcome');
  
  // Verify heading
  await expect(authenticatedPage.locator('h1')).toContainText('Welcome to Home Planner!');
  
  // Verify description
  await expect(authenticatedPage.locator('text=Let\'s set up your family calendar')).toBeVisible();
  
  // Verify progress indicator shows step 1 of 4
  await expect(authenticatedPage.locator('[aria-label="Step 1 of 4"]')).toBeVisible();
  
  // Verify family name input exists
  await expect(authenticatedPage.locator('#family-name')).toBeVisible();
  
  // Verify Next button exists
  await expect(authenticatedPage.locator('button:has-text("Next")')).toBeVisible();
});
```

#### Test 1.2: Validate Family Name Input
```typescript
test('should validate family name input', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/onboarding/welcome');
  
  // Try to submit empty form
  await authenticatedPage.click('button:has-text("Next")');
  
  // Should show validation error
  await expect(authenticatedPage.locator('text=required')).toBeVisible();
  
  // Enter too long name (>100 chars)
  const longName = 'a'.repeat(101);
  await authenticatedPage.fill('#family-name', longName);
  
  // Should show character count warning
  await expect(authenticatedPage.locator('text=101/100')).toBeVisible();
  
  // Should not allow submission
  await authenticatedPage.click('button:has-text("Next")');
  await expect(authenticatedPage.locator('[role="alert"]')).toBeVisible();
});
```

#### Test 1.3: Create Family Successfully
```typescript
test('should create family and proceed to next step', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/onboarding/welcome');
  
  // Fill in family name
  const familyName = `Test Family ${Date.now()}`;
  await authenticatedPage.fill('#family-name', familyName);
  
  // Submit form
  await authenticatedPage.click('button:has-text("Next")');
  
  // Should show loading state
  await expect(authenticatedPage.locator('button:has-text("Next")[disabled]')).toBeVisible();
  
  // Should proceed to step 2
  await authenticatedPage.waitForURL('**/onboarding/welcome**');
  await expect(authenticatedPage.locator('h1:has-text("Connect Your Calendar")')).toBeVisible();
  
  // Verify progress indicator shows step 2
  await expect(authenticatedPage.locator('[aria-label="Step 2 of 4"]')).toBeVisible();
  
  // Verify family name is stored in localStorage
  const storage = await authenticatedPage.evaluate(() => {
    return JSON.parse(localStorage.getItem('onboarding_progress') || '{}');
  });
  expect(storage.familyName).toBe(familyName);
  expect(storage.familyId).toBeTruthy();
});
```

#### Test 1.4: Handle API Errors
```typescript
test('should handle family creation errors gracefully', async ({ authenticatedPage }) => {
  // Mock API error
  await authenticatedPage.route('**/api/families', (route) => {
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal server error' })
    });
  });
  
  await authenticatedPage.goto('/onboarding/welcome');
  await authenticatedPage.fill('#family-name', 'Test Family');
  await authenticatedPage.click('button:has-text("Next")');
  
  // Should show error message
  await expect(authenticatedPage.locator('[role="alert"]')).toContainText('Failed to create family');
  
  // Should remain on same step
  await expect(authenticatedPage.locator('h1:has-text("Welcome")')).toBeVisible();
});
```

### Test Suite 2: Connect Calendar Step (Step 2)

**File**: `e2e/onboarding/02-connect-calendar.spec.ts`

#### Test 2.1: Display Calendar Providers
```typescript
test('should display calendar provider options', async ({ authenticatedPage }) => {
  // Setup: Complete step 1 first
  await completeWelcomeStep(authenticatedPage);
  
  // Verify heading
  await expect(authenticatedPage.locator('h1:has-text("Connect Your Calendar")')).toBeVisible();
  
  // Verify Google Calendar option
  await expect(authenticatedPage.locator('text=Google Calendar')).toBeVisible();
  await expect(authenticatedPage.locator('text=Sync events from your Google Calendar')).toBeVisible();
  
  // Verify Microsoft 365 option
  await expect(authenticatedPage.locator('text=Microsoft 365')).toBeVisible();
  await expect(authenticatedPage.locator('text=Sync events from your Outlook calendar')).toBeVisible();
  
  // Verify skip message
  await expect(authenticatedPage.locator('text=You can skip this step')).toBeVisible();
});
```

#### Test 2.2: Connect Google Calendar
```typescript
test('should initiate Google Calendar OAuth flow', async ({ authenticatedPage }) => {
  await completeWelcomeStep(authenticatedPage);
  
  // Mock OAuth initiation
  let oauthInitiated = false;
  await authenticatedPage.route('**/api/external-calendars/initiate**', async (route) => {
    oauthInitiated = true;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        authorization_url: 'https://accounts.google.com/o/oauth2/v2/auth?...',
        state: 'mock-state-token'
      })
    });
  });
  
  // Mock the OAuth redirect
  await authenticatedPage.route('https://accounts.google.com/o/oauth2/**', async (route) => {
    // Simulate successful OAuth and redirect back
    await route.fulfill({
      status: 302,
      headers: {
        'Location': 'http://localhost:4321/api/external-calendars/callback?code=mock-code&state=mock-state&provider=google'
      }
    });
  });
  
  // Click Google Calendar
  await authenticatedPage.click('button:has-text("Google Calendar")');
  
  // Verify OAuth was initiated
  expect(oauthInitiated).toBe(true);
  
  // Verify cookie was set for return path
  const cookies = await authenticatedPage.context().cookies();
  const returnPathCookie = cookies.find(c => c.name === 'oauth_return_path');
  expect(returnPathCookie).toBeTruthy();
  expect(decodeURIComponent(returnPathCookie!.value)).toBe('/onboarding/welcome');
});
```

#### Test 2.3: Handle OAuth Callback Success
```typescript
test('should handle successful calendar connection', async ({ authenticatedPage }) => {
  await completeWelcomeStep(authenticatedPage);
  
  // Mock calendar list API
  await authenticatedPage.route('**/api/external-calendars**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'cal-123',
            provider: 'google',
            email: 'test@gmail.com',
            is_primary: true
          }
        ])
      });
    }
  });
  
  // Simulate OAuth callback
  await authenticatedPage.goto('/onboarding/welcome?status=success&calendar_id=cal-123');
  
  // Should show connected state
  await expect(authenticatedPage.locator('text=Connected')).toBeVisible();
  
  // Google Calendar button should be disabled
  await expect(authenticatedPage.locator('button:has-text("Google Calendar")[disabled]')).toBeVisible();
  
  // Verify calendar is stored in context
  const storage = await authenticatedPage.evaluate(() => {
    return JSON.parse(localStorage.getItem('onboarding_progress') || '{}');
  });
  expect(storage.connectedCalendars).toHaveLength(1);
  expect(storage.connectedCalendars[0].provider).toBe('google');
});
```

#### Test 2.4: Handle OAuth Callback Errors
```typescript
test('should display error when calendar connection fails', async ({ authenticatedPage }) => {
  await completeWelcomeStep(authenticatedPage);
  
  // Simulate OAuth error callback
  await authenticatedPage.goto('/onboarding/welcome?status=error&error=unauthorized');
  
  // Should show error message
  await expect(authenticatedPage.locator('[role="alert"]')).toContainText('Authentication failed');
  
  // Should allow retry
  await expect(authenticatedPage.locator('button:has-text("Google Calendar")')).toBeEnabled();
});
```

#### Test 2.5: Skip Calendar Connection
```typescript
test('should allow skipping calendar connection', async ({ authenticatedPage }) => {
  await completeWelcomeStep(authenticatedPage);
  
  // Click Skip button
  await authenticatedPage.click('button:has-text("Skip")');
  
  // Should proceed to step 3
  await expect(authenticatedPage.locator('h1:has-text("Add Your Children")')).toBeVisible();
  
  // Verify no calendars in storage
  const storage = await authenticatedPage.evaluate(() => {
    return JSON.parse(localStorage.getItem('onboarding_progress') || '{}');
  });
  expect(storage.connectedCalendars).toHaveLength(0);
});
```

### Test Suite 3: Add Children Step (Step 3)

**File**: `e2e/onboarding/03-add-children.spec.ts`

#### Test 3.1: Display Add Children Step
```typescript
test('should display add children step', async ({ authenticatedPage }) => {
  await completeSteps(authenticatedPage, 2);
  
  // Verify heading
  await expect(authenticatedPage.locator('h1:has-text("Add Your Children")')).toBeVisible();
  
  // Verify description
  await expect(authenticatedPage.locator('text=Add children to your family calendar')).toBeVisible();
  
  // Verify Add Child button
  await expect(authenticatedPage.locator('button:has-text("+ Add Child")')).toBeVisible();
  
  // Verify progress indicator
  await expect(authenticatedPage.locator('[aria-label="Step 3 of 4"]')).toBeVisible();
});
```

#### Test 3.2: Add Child Successfully
```typescript
test('should add a child', async ({ authenticatedPage }) => {
  await completeSteps(authenticatedPage, 2);
  
  // Click Add Child button
  await authenticatedPage.click('button:has-text("+ Add Child")');
  
  // Should open dialog
  await expect(authenticatedPage.locator('[role="dialog"]')).toBeVisible();
  
  // Fill in child details
  await authenticatedPage.fill('input[name="name"]', 'Emma Smith');
  await authenticatedPage.fill('input[name="date_of_birth"]', '2015-06-15');
  
  // Submit form
  await authenticatedPage.click('button[type="submit"]:has-text("Add Child")');
  
  // Should close dialog
  await expect(authenticatedPage.locator('[role="dialog"]')).not.toBeVisible();
  
  // Should display child card
  await expect(authenticatedPage.locator('text=Emma Smith')).toBeVisible();
  await expect(authenticatedPage.locator('text=8 years old')).toBeVisible();
  
  // Verify child is stored
  const storage = await authenticatedPage.evaluate(() => {
    return JSON.parse(localStorage.getItem('onboarding_progress') || '{}');
  });
  expect(storage.children).toHaveLength(1);
  expect(storage.children[0].name).toBe('Emma Smith');
});
```

#### Test 3.3: Add Multiple Children
```typescript
test('should add multiple children', async ({ authenticatedPage }) => {
  await completeSteps(authenticatedPage, 2);
  
  // Add first child
  await addChild(authenticatedPage, 'Emma Smith', '2015-06-15');
  
  // Add second child
  await addChild(authenticatedPage, 'Jack Smith', '2018-03-20');
  
  // Should display both children
  await expect(authenticatedPage.locator('text=Emma Smith')).toBeVisible();
  await expect(authenticatedPage.locator('text=Jack Smith')).toBeVisible();
  
  // Verify both stored
  const storage = await authenticatedPage.evaluate(() => {
    return JSON.parse(localStorage.getItem('onboarding_progress') || '{}');
  });
  expect(storage.children).toHaveLength(2);
});
```

#### Test 3.4: Remove Child
```typescript
test('should remove a child', async ({ authenticatedPage }) => {
  await completeSteps(authenticatedPage, 2);
  await addChild(authenticatedPage, 'Emma Smith', '2015-06-15');
  
  // Click remove button
  await authenticatedPage.click('button[aria-label="Remove Emma Smith"]');
  
  // Should show confirmation dialog
  await expect(authenticatedPage.locator('text=Are you sure')).toBeVisible();
  
  // Confirm removal
  await authenticatedPage.click('button:has-text("Remove")');
  
  // Child should be removed
  await expect(authenticatedPage.locator('text=Emma Smith')).not.toBeVisible();
  
  // Verify removed from storage
  const storage = await authenticatedPage.evaluate(() => {
    return JSON.parse(localStorage.getItem('onboarding_progress') || '{}');
  });
  expect(storage.children).toHaveLength(0);
});
```

#### Test 3.5: Validate Child Form
```typescript
test('should validate child form inputs', async ({ authenticatedPage }) => {
  await completeSteps(authenticatedPage, 2);
  await authenticatedPage.click('button:has-text("+ Add Child")');
  
  // Try to submit empty form
  await authenticatedPage.click('button[type="submit"]:has-text("Add Child")');
  
  // Should show validation errors
  await expect(authenticatedPage.locator('text=Name is required')).toBeVisible();
  await expect(authenticatedPage.locator('text=Date of birth is required')).toBeVisible();
  
  // Enter future date
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);
  await authenticatedPage.fill('input[name="date_of_birth"]', futureDate.toISOString().split('T')[0]);
  
  // Should show validation error
  await expect(authenticatedPage.locator('text=Date cannot be in the future')).toBeVisible();
});
```

#### Test 3.6: Skip Adding Children
```typescript
test('should allow skipping child addition', async ({ authenticatedPage }) => {
  await completeSteps(authenticatedPage, 2);
  
  // Click Skip
  await authenticatedPage.click('button:has-text("Skip")');
  
  // Should proceed to step 4
  await expect(authenticatedPage.locator('h1:has-text("Invite Family Members")')).toBeVisible();
});
```

### Test Suite 4: Invite Members Step (Step 4)

**File**: `e2e/onboarding/04-invite-members.spec.ts`

#### Test 4.1: Display Invite Members Step
```typescript
test('should display invite members step', async ({ authenticatedPage }) => {
  await completeSteps(authenticatedPage, 3);
  
  // Verify heading
  await expect(authenticatedPage.locator('h1:has-text("Invite Family Members")')).toBeVisible();
  
  // Verify email input
  await expect(authenticatedPage.locator('#invite-email')).toBeVisible();
  
  // Verify send button
  await expect(authenticatedPage.locator('button:has-text("Send Invitation")')).toBeVisible();
  
  // Verify Finish button
  await expect(authenticatedPage.locator('button:has-text("Finish")')).toBeVisible();
});
```

#### Test 4.2: Send Invitation Successfully
```typescript
test('should send invitation', async ({ authenticatedPage }) => {
  await completeSteps(authenticatedPage, 3);
  
  // Mock invitation API
  await authenticatedPage.route('**/api/families/*/invitations', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'inv-123',
        family_id: 'fam-123',
        invited_by: 'user-123',
        invitee_email: 'partner@example.com',
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      })
    });
  });
  
  // Fill in email
  await authenticatedPage.fill('#invite-email', 'partner@example.com');
  
  // Send invitation
  await authenticatedPage.click('button:has-text("Send Invitation")');
  
  // Should show invitation card
  await expect(authenticatedPage.locator('text=partner@example.com')).toBeVisible();
  await expect(authenticatedPage.locator('text=Pending')).toBeVisible();
  
  // Email input should be cleared
  await expect(authenticatedPage.locator('#invite-email')).toHaveValue('');
  
  // Verify stored
  const storage = await authenticatedPage.evaluate(() => {
    return JSON.parse(localStorage.getItem('onboarding_progress') || '{}');
  });
  expect(storage.invitations).toHaveLength(1);
});
```

#### Test 4.3: Send Multiple Invitations
```typescript
test('should send multiple invitations', async ({ authenticatedPage }) => {
  await completeSteps(authenticatedPage, 3);
  
  // Send first invitation
  await sendInvitation(authenticatedPage, 'partner@example.com');
  
  // Send second invitation
  await sendInvitation(authenticatedPage, 'grandma@example.com');
  
  // Should display both
  await expect(authenticatedPage.locator('text=partner@example.com')).toBeVisible();
  await expect(authenticatedPage.locator('text=grandma@example.com')).toBeVisible();
});
```

#### Test 4.4: Validate Email Input
```typescript
test('should validate email format', async ({ authenticatedPage }) => {
  await completeSteps(authenticatedPage, 3);
  
  // Enter invalid email
  await authenticatedPage.fill('#invite-email', 'invalid-email');
  await authenticatedPage.click('button:has-text("Send Invitation")');
  
  // Should show validation error
  await expect(authenticatedPage.locator('text=Invalid email')).toBeVisible();
  
  // Enter empty email
  await authenticatedPage.fill('#invite-email', '');
  await authenticatedPage.click('button:has-text("Send Invitation")');
  
  // Should show required error
  await expect(authenticatedPage.locator('text=required')).toBeVisible();
});
```

#### Test 4.5: Handle Duplicate Invitation
```typescript
test('should handle duplicate invitation error', async ({ authenticatedPage }) => {
  await completeSteps(authenticatedPage, 3);
  
  // Send first invitation
  await sendInvitation(authenticatedPage, 'partner@example.com');
  
  // Mock duplicate error
  await authenticatedPage.route('**/api/families/*/invitations', async (route) => {
    await route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'Invitation already exists for this email'
      })
    });
  });
  
  // Try to send same email again
  await authenticatedPage.fill('#invite-email', 'partner@example.com');
  await authenticatedPage.click('button:has-text("Send Invitation")');
  
  // Should show error
  await expect(authenticatedPage.locator('[role="alert"]')).toContainText('already exists');
});
```

### Test Suite 5: Complete Onboarding Flow

**File**: `e2e/onboarding/05-complete-flow.spec.ts`

#### Test 5.1: Complete Full Onboarding
```typescript
test('should complete full onboarding flow', async ({ authenticatedPage }) => {
  // Step 1: Welcome
  await authenticatedPage.goto('/onboarding/welcome');
  await authenticatedPage.fill('#family-name', 'Smith Family');
  await authenticatedPage.click('button:has-text("Next")');
  
  // Wait for step 2
  await expect(authenticatedPage.locator('h1:has-text("Connect Your Calendar")')).toBeVisible();
  
  // Step 2: Skip calendar
  await authenticatedPage.click('button:has-text("Skip")');
  
  // Wait for step 3
  await expect(authenticatedPage.locator('h1:has-text("Add Your Children")')).toBeVisible();
  
  // Step 3: Add child
  await addChild(authenticatedPage, 'Emma Smith', '2015-06-15');
  await authenticatedPage.click('button:has-text("Next")');
  
  // Wait for step 4
  await expect(authenticatedPage.locator('h1:has-text("Invite Family Members")')).toBeVisible();
  
  // Step 4: Send invitation
  await sendInvitation(authenticatedPage, 'partner@example.com');
  
  // Finish onboarding
  await authenticatedPage.click('button:has-text("Finish")');
  
  // Should redirect to calendar
  await authenticatedPage.waitForURL('**/calendar/week');
  
  // Verify onboarding storage is cleared
  const storage = await authenticatedPage.evaluate(() => {
    return localStorage.getItem('onboarding_progress');
  });
  expect(storage).toBeNull();
});
```

#### Test 5.2: Complete Minimal Onboarding
```typescript
test('should complete onboarding with minimal steps', async ({ authenticatedPage }) => {
  // Only complete required step (family name)
  await authenticatedPage.goto('/onboarding/welcome');
  await authenticatedPage.fill('#family-name', 'Minimal Family');
  await authenticatedPage.click('button:has-text("Next")');
  
  // Skip all optional steps
  await authenticatedPage.click('button:has-text("Skip")'); // Calendar
  await authenticatedPage.click('button:has-text("Skip")'); // Children
  await authenticatedPage.click('button:has-text("Finish")'); // Members
  
  // Should complete successfully
  await authenticatedPage.waitForURL('**/calendar/week');
});
```

#### Test 5.3: Complete Onboarding with All Features
```typescript
test('should complete onboarding with all features', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/onboarding/welcome');
  
  // Step 1: Create family
  await authenticatedPage.fill('#family-name', 'Complete Family');
  await authenticatedPage.click('button:has-text("Next")');
  
  // Step 2: Connect calendar
  await connectGoogleCalendar(authenticatedPage);
  await authenticatedPage.click('button:has-text("Next")');
  
  // Step 3: Add multiple children
  await addChild(authenticatedPage, 'Emma', '2015-06-15');
  await addChild(authenticatedPage, 'Jack', '2018-03-20');
  await authenticatedPage.click('button:has-text("Next")');
  
  // Step 4: Send multiple invitations
  await sendInvitation(authenticatedPage, 'partner@example.com');
  await sendInvitation(authenticatedPage, 'grandma@example.com');
  await authenticatedPage.click('button:has-text("Finish")');
  
  // Verify completion
  await authenticatedPage.waitForURL('**/calendar/week');
  
  // Verify all data was created in database
  // (Would need API calls to verify)
});
```

### Test Suite 6: Navigation and State Management

**File**: `e2e/onboarding/06-navigation.spec.ts`

#### Test 6.1: Navigate Back Through Steps
```typescript
test('should navigate back through steps', async ({ authenticatedPage }) => {
  await completeSteps(authenticatedPage, 3);
  
  // Go back to step 2
  await authenticatedPage.click('button:has-text("Back")');
  await expect(authenticatedPage.locator('h1:has-text("Connect Your Calendar")')).toBeVisible();
  
  // Go back to step 1
  await authenticatedPage.click('button:has-text("Back")');
  await expect(authenticatedPage.locator('h1:has-text("Welcome")')).toBeVisible();
  
  // Back button should be disabled on step 1
  await expect(authenticatedPage.locator('button:has-text("Back")[disabled]')).toBeVisible();
});
```

#### Test 6.2: Preserve State When Navigating Back
```typescript
test('should preserve data when navigating back', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/onboarding/welcome');
  
  // Fill family name
  await authenticatedPage.fill('#family-name', 'Test Family');
  await authenticatedPage.click('button:has-text("Next")');
  
  // Skip calendar
  await authenticatedPage.click('button:has-text("Skip")');
  
  // Add child
  await addChild(authenticatedPage, 'Emma', '2015-06-15');
  
  // Go back to step 2
  await authenticatedPage.click('button:has-text("Back")');
  
  // Go back to step 1
  await authenticatedPage.click('button:has-text("Back")');
  
  // Family name should still be there
  await expect(authenticatedPage.locator('#family-name')).toHaveValue('Test Family');
  
  // Go forward again
  await authenticatedPage.click('button:has-text("Next")');
  await authenticatedPage.click('button:has-text("Next")');
  
  // Child should still be there
  await expect(authenticatedPage.locator('text=Emma')).toBeVisible();
});
```

#### Test 6.3: Resume Onboarding After Page Reload
```typescript
test('should resume onboarding from saved progress', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/onboarding/welcome');
  
  // Complete step 1
  await authenticatedPage.fill('#family-name', 'Test Family');
  await authenticatedPage.click('button:has-text("Next")');
  
  // Skip to step 3
  await authenticatedPage.click('button:has-text("Skip")');
  
  // Add child
  await addChild(authenticatedPage, 'Emma', '2015-06-15');
  
  // Reload page
  await authenticatedPage.reload();
  
  // Should be on step 3 with data preserved
  await expect(authenticatedPage.locator('h1:has-text("Add Your Children")')).toBeVisible();
  await expect(authenticatedPage.locator('text=Emma')).toBeVisible();
  await expect(authenticatedPage.locator('[aria-label="Step 3 of 4"]')).toBeVisible();
});
```

#### Test 6.4: Handle Direct URL Access
```typescript
test('should handle direct access to later steps', async ({ authenticatedPage }) => {
  // Try to access step 3 directly without completing step 1
  await authenticatedPage.goto('/onboarding/welcome');
  
  // Manually set step in localStorage
  await authenticatedPage.evaluate(() => {
    localStorage.setItem('onboarding_progress', JSON.stringify({
      currentStep: 3,
      familyId: null, // No family created
      familyName: '',
      children: [],
      invitations: [],
      connectedCalendars: []
    }));
  });
  
  await authenticatedPage.reload();
  
  // Should show error message
  await expect(authenticatedPage.locator('text=Please complete the previous step first')).toBeVisible();
});
```

#### Test 6.5: Handle Browser Back Button
```typescript
test('should handle browser back button', async ({ authenticatedPage }) => {
  await completeSteps(authenticatedPage, 2);
  
  // Use browser back button
  await authenticatedPage.goBack();
  
  // Should be on step 1
  await expect(authenticatedPage.locator('h1:has-text("Welcome")')).toBeVisible();
  
  // Use browser forward button
  await authenticatedPage.goForward();
  
  // Should be back on step 2
  await expect(authenticatedPage.locator('h1:has-text("Connect Your Calendar")')).toBeVisible();
});
```

#### Test 6.6: Test Step Transitions
```typescript
test('should show smooth transitions between steps', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/onboarding/welcome');
  await authenticatedPage.fill('#family-name', 'Test Family');
  
  // Click next and verify transition
  await authenticatedPage.click('button:has-text("Next")');
  
  // Should show opacity transition
  const content = authenticatedPage.locator('[class*="transition-opacity"]');
  await expect(content).toHaveClass(/opacity-0/);
  
  // Wait for transition to complete
  await authenticatedPage.waitForTimeout(300);
  await expect(content).toHaveClass(/opacity-100/);
});
```

## Helper Functions

Create a file `e2e/fixtures/helpers.ts`:

```typescript
import { Page, expect } from '@playwright/test';

export async function completeWelcomeStep(page: Page) {
  await page.goto('/onboarding/welcome');
  await page.fill('#family-name', `Test Family ${Date.now()}`);
  await page.click('button:has-text("Next")');
  await expect(page.locator('h1:has-text("Connect Your Calendar")')).toBeVisible();
}

export async function completeSteps(page: Page, upToStep: number) {
  if (upToStep >= 1) {
    await completeWelcomeStep(page);
  }
  
  if (upToStep >= 2) {
    await page.click('button:has-text("Skip")');
    await expect(page.locator('h1:has-text("Add Your Children")')).toBeVisible();
  }
  
  if (upToStep >= 3) {
    await page.click('button:has-text("Skip")');
    await expect(page.locator('h1:has-text("Invite Family Members")')).toBeVisible();
  }
}

export async function addChild(page: Page, name: string, dateOfBirth: string) {
  await page.click('button:has-text("+ Add Child")');
  await page.fill('input[name="name"]', name);
  await page.fill('input[name="date_of_birth"]', dateOfBirth);
  await page.click('button[type="submit"]:has-text("Add Child")');
  await expect(page.locator(`text=${name}`)).toBeVisible();
}

export async function sendInvitation(page: Page, email: string) {
  await page.fill('#invite-email', email);
  await page.click('button:has-text("Send Invitation")');
  await expect(page.locator(`text=${email}`)).toBeVisible();
}

export async function connectGoogleCalendar(page: Page) {
  // Mock the OAuth flow
  await page.route('**/api/external-calendars/initiate**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        authorization_url: 'mock-url',
        state: 'mock-state'
      })
    });
  });
  
  // Simulate successful connection
  await page.goto('/onboarding/welcome?status=success&calendar_id=cal-123');
  await expect(page.locator('text=Connected')).toBeVisible();
}
```

## Database Setup and Teardown

Create `e2e/fixtures/database.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function setupTestDatabase() {
  // Create test user if needed
  // Seed any required data
}

export async function cleanupTestData(userId: string) {
  // Delete test families
  await supabase
    .from('families')
    .delete()
    .eq('created_by', userId);
  
  // Delete test children
  await supabase
    .from('children')
    .delete()
    .in('family_id', [/* test family ids */]);
  
  // Delete test invitations
  await supabase
    .from('invitations')
    .delete()
    .eq('invited_by', userId);
  
  // Delete test calendars
  await supabase
    .from('external_calendars')
    .delete()
    .eq('user_id', userId);
}

export async function resetOnboardingProgress() {
  // Clear localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('onboarding_progress');
  }
}
```

## Running Tests

Add scripts to `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:onboarding": "playwright test e2e/onboarding"
  }
}
```

## CI/CD Integration

Create `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Install Playwright
        run: pnpm exec playwright install --with-deps
        
      - name: Run E2E tests
        run: pnpm test:e2e
        env:
          PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Test Coverage Goals

- **Step 1 (Welcome)**: 100% - Critical path
- **Step 2 (Calendar)**: 90% - OAuth complexity
- **Step 3 (Children)**: 95% - Data management
- **Step 4 (Invitations)**: 95% - Email validation
- **Navigation**: 100% - State management critical
- **Error Handling**: 90% - User experience

## Accessibility Testing

Include accessibility checks in tests:

```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test('should be accessible', async ({ page }) => {
  await page.goto('/onboarding/welcome');
  await injectAxe(page);
  await checkA11y(page);
});
```

## Performance Testing

Monitor page load and interaction times:

```typescript
test('should load quickly', async ({ page }) => {
  const start = Date.now();
  await page.goto('/onboarding/welcome');
  const loadTime = Date.now() - start;
  
  expect(loadTime).toBeLessThan(2000); // 2 seconds
});
```

## Summary

This comprehensive E2E test plan covers:

1. ✅ All 4 onboarding steps
2. ✅ Google OAuth authentication (with multiple strategies)
3. ✅ Form validation and error handling
4. ✅ Navigation and state management
5. ✅ Data persistence (localStorage)
6. ✅ API integration and mocking
7. ✅ Complete user flows
8. ✅ Edge cases and error scenarios
9. ✅ Accessibility testing
10. ✅ CI/CD integration

The tests are organized by feature, use helper functions for reusability, and include both happy paths and error scenarios. The OAuth testing strategy provides flexibility for different environments (CI/CD vs local development).
