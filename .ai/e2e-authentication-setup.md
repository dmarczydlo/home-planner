# E2E Authentication Setup Guide

This guide explains how to set up Supabase authentication for E2E tests using Playwright storage state.

---

## Overview

Instead of mocking authentication, we use **real Supabase Google OAuth** with Playwright's storage state feature. This approach:

- ✅ Tests real authentication flows
- ✅ Faster test execution (authenticate once, reuse state)
- ✅ More reliable (tests actual OAuth integration)
- ✅ Better coverage (catches real auth issues)

---

## Prerequisites

1. **Test Google Account**: Create a dedicated Google account for E2E tests
   - Email: `e2e-test@yourdomain.com` (or similar)
   - Enable in Supabase dashboard
   - Consider disabling 2FA for automated tests (or use app passwords)

2. **Environment Variables**: Set in your `.env` file or CI environment
   ```bash
   TEST_GOOGLE_EMAIL=e2e-test@yourdomain.com
   # Optional: For automated OAuth (if not using manual flow)
   TEST_GOOGLE_PASSWORD=your-app-password
   ```

---

## Initial Setup

### Step 1: Run Auth Setup (First Time)

Run the auth setup test in **headed mode** to complete OAuth manually:

```bash
# Set environment variable
export TEST_GOOGLE_EMAIL=e2e-test@yourdomain.com

# Run in headed mode (you'll see the browser)
npx playwright test --headed e2e/auth.setup.ts
```

**What happens:**

1. Browser opens and navigates to login page
2. Clicks "Sign in with Google"
3. You manually complete Google OAuth (enter credentials, approve)
4. After successful auth, storage state is saved to `.auth/user.json`
5. Browser closes

### Step 2: Verify Setup

Check that the storage state file was created:

```bash
ls -la .auth/user.json
```

You should see the file exists. **Do not commit this file** - it's in `.gitignore`.

### Step 3: Run Tests

Now all tests will use the saved authentication state:

```bash
# Run all tests (already authenticated)
npx playwright test

# Run specific test
npx playwright test e2e/specs/onboarding.spec.ts
```

---

## How It Works

### Playwright Configuration

The `playwright.config.ts` has two projects:

1. **`setup` project**: Runs `auth.setup.ts` to authenticate once
2. **`chromium` project**: Uses saved storage state (`.auth/user.json`) for all tests

```typescript
projects: [
  {
    name: "setup",
    testMatch: /.*\.setup\.ts/,
  },
  {
    name: "chromium",
    use: {
      storageState: ".auth/user.json", // Pre-authenticated
    },
    dependencies: ["setup"], // Runs setup first
  },
];
```

### Storage State

The `.auth/user.json` file contains:

- Cookies (including Supabase session cookies)
- Local storage (Supabase auth tokens)
- Session storage

This state is loaded automatically for each test, so tests start already authenticated.

---

## Using in Tests

### Standard Tests (Pre-authenticated)

Most tests don't need to do anything special - they're already authenticated:

```typescript
import { test, expect } from "@playwright/test";

test("should view calendar", async ({ page }) => {
  // Already authenticated - no login needed
  await page.goto("/calendar/week");

  // Test logic...
  await expect(page.locator('[data-testid="calendar-view-container"]')).toBeVisible();
});
```

### Unauthenticated Tests

For tests that need to verify login flow or unauthenticated behavior:

```typescript
import { test, expect } from "@playwright/test";

// Use unauthenticated project
test.use({ storageState: undefined });

test("should redirect to login when not authenticated", async ({ page }) => {
  await page.goto("/calendar/week");
  await expect(page).toHaveURL(/\/auth\/login/);
});
```

Or use the dedicated project in `playwright.config.ts`:

```typescript
test("unauthenticated test", async ({ page }) => {
  // This test uses chromium-unauthenticated project
});
```

---

## Session Expiration

### Problem

Supabase sessions expire after ~1 hour. When this happens:

- Tests may fail with authentication errors
- Storage state becomes invalid

### Solutions

#### Option 1: Regenerate Before CI Runs

```bash
# Before running tests
npx playwright test e2e/auth.setup.ts
npx playwright test
```

#### Option 2: Automated Refresh (Advanced)

Modify `auth.setup.ts` to refresh session if expired:

```typescript
// Check if session is expired and refresh if needed
const storageState = JSON.parse(fs.readFileSync(AUTH_FILE, "utf-8"));
// Check expiration and refresh...
```

#### Option 3: Weekly Regeneration

Set up a scheduled job to regenerate `.auth/user.json` weekly.

#### Option 4: Service Account (Recommended for CI)

Use a service account or test account without 2FA for fully automated runs.

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright
        run: npx playwright install chromium

      - name: Setup authentication
        env:
          TEST_GOOGLE_EMAIL: ${{ secrets.TEST_GOOGLE_EMAIL }}
        run: |
          # Option 1: Restore from artifact (if available)
          if [ -f .auth/user.json ]; then
            echo "Using cached auth state"
          else
            # Option 2: Regenerate (requires manual OAuth or service account)
            npx playwright test e2e/auth.setup.ts
          fi

      - name: Run E2E tests
        run: npx playwright test

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

### Storing Auth State as Artifact

For faster CI runs, you can store `.auth/user.json` as a GitHub Actions artifact:

```yaml
- name: Cache auth state
  uses: actions/cache@v4
  with:
    path: .auth/user.json
    key: auth-state-${{ github.run_id }}
    restore-keys: auth-state-
```

**Note**: Be careful with security - auth state contains session tokens.

---

## Troubleshooting

### "Authentication failed" Error

**Problem**: Auth setup fails or storage state is invalid.

**Solutions**:

1. Check `TEST_GOOGLE_EMAIL` is set correctly
2. Verify test account is enabled in Supabase
3. Run auth setup again in headed mode
4. Check if session expired (regenerate)

### "Storage state file not found"

**Problem**: `.auth/user.json` doesn't exist.

**Solution**: Run `npx playwright test e2e/auth.setup.ts` first.

### Tests fail with "Unauthorized"

**Problem**: Storage state expired or invalid.

**Solutions**:

1. Regenerate storage state: `npx playwright test e2e/auth.setup.ts`
2. Check session expiration time
3. Verify Supabase configuration

### OAuth Flow Stuck

**Problem**: Auth setup hangs on Google OAuth page.

**Solutions**:

1. Run in headed mode to see what's happening
2. Check if 2FA is enabled (may need app password)
3. Verify Google account permissions
4. Check network connectivity

---

## Best Practices

1. **Never commit `.auth/user.json`**: Already in `.gitignore`
2. **Use dedicated test account**: Don't use personal accounts
3. **Regenerate regularly**: Before important test runs
4. **Monitor expiration**: Set up alerts or scheduled regeneration
5. **Secure credentials**: Store `TEST_GOOGLE_EMAIL` in secrets/environment variables
6. **Document process**: Keep this guide updated

---

## Migration from Mocked Auth

If you're migrating from mocked authentication:

1. **Update tests**: Remove any `mockGoogleAuth()` calls
2. **Remove mocks**: Delete mock implementations from `fixtures/auth.ts`
3. **Run auth setup**: Generate storage state
4. **Update CI/CD**: Add auth setup step
5. **Test**: Verify all tests still pass

---

## Additional Resources

- [Playwright Storage State Docs](https://playwright.dev/docs/auth)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [E2E Test Plan](./e2e-test-plan-comprehensive.md)
- [Test Generation Prompts](./e2e-test-generation-prompt.md)

---

**Last Updated**: 2024
