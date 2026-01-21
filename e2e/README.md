# E2E Tests

End-to-end tests for HomePlanner using Playwright.

## Setup

Install dependencies (already done if you've run `pnpm install`):

```bash
pnpm install
```

Install Playwright browsers:

```bash
pnpm exec playwright install
```

## Running Tests

### Run all E2E tests

```bash
pnpm test:e2e
```

### Run with UI mode (interactive)

```bash
pnpm test:e2e:ui
```

### Run in headed mode (see browser)

```bash
pnpm test:e2e:headed
```

### Debug tests

```bash
pnpm test:e2e:debug
```

### View test report

```bash
pnpm test:e2e:report
```

## Test Structure

```
e2e/
├── fixtures/
│   ├── auth.ts              # Authentication mocking and helpers
│   └── helpers.ts           # Test helper functions
└── smoke.spec.ts            # Basic infrastructure verification tests
```

## Current Tests

### Smoke Tests (`smoke.spec.ts`)

Basic infrastructure verification tests:
- Verifies test environment is working
- Checks Playwright configuration
- Validates page loading and basic interactions

## Writing New Tests

### Basic test structure

```typescript
import { test, expect } from "@playwright/test";

test("my new test", async ({ page }) => {
  await page.goto("/");
  // ... test code
});
```

### Using fixtures (for authenticated tests)

```typescript
import { test, expect } from "./fixtures/auth";

test("my authenticated test", async ({ authenticatedPage }) => {
  // authenticatedPage is already authenticated
  await authenticatedPage.goto("/dashboard");
  // ... test code
});
```

### Available helpers (from fixtures/helpers.ts)

- `completeWelcomeStep(page, familyName?)` - Complete onboarding step 1
- `completeSteps(page, upToStep)` - Complete multiple steps
- `addChild(page, name, dateOfBirth)` - Add a child
- `sendInvitation(page, email)` - Send an invitation
- `mockCalendarConnection(page, provider)` - Mock calendar OAuth
- `getOnboardingProgress(page)` - Get localStorage progress
- `setOnboardingProgress(page, progress)` - Set localStorage progress
- `clearOnboardingProgress(page)` - Clear localStorage
- `generateTestEmail()` - Generate unique test email
- `generateTestDate(yearsAgo)` - Generate test date

## Environment Variables

Tests use the same environment variables as the main app:

- `PUBLIC_SUPABASE_URL` or `SUPABASE_URL` - Supabase project URL (required)
- `PUBLIC_SUPABASE_ANON_KEY` or `SUPABASE_KEY` - Supabase anon key (required)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (required for authentication setup)
- `TEST_GOOGLE_EMAIL` - Test user email (optional, defaults to `e2e-test@example.com`)
- `FRONTEND_URL` - Frontend URL (defaults to http://localhost:4321)

### Authentication Setup

Before running tests, you need to set up authentication:

1. **Set environment variables**:
   ```bash
   export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   export PUBLIC_SUPABASE_URL=your-supabase-url
   export PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   export TEST_GOOGLE_EMAIL=e2e-test@yourdomain.com  # Optional
   ```

2. **Run authentication setup**:
   ```bash
   npx playwright test e2e/auth.setup.ts
   ```

   This will:
   - Create or get the test user using the service role key
   - Generate a session via magic link (no OAuth UI needed)
   - Save the authentication state to `.auth/user.json`

3. **Verify setup**:
   ```bash
   ls -la .auth/user.json
   ```

   The file should exist. **Do not commit this file** - it's in `.gitignore`.

4. **Run tests**:
   ```bash
   pnpm test:e2e
   ```

   All tests will automatically use the saved authentication state.

**Note**: Supabase sessions expire after ~1 hour. Regenerate `.auth/user.json` periodically or before CI runs.

## CI/CD Integration

Tests are configured to run in CI environments with:

- Automatic browser installation
- Headless mode
- Retry on failure
- HTML report generation
- Screenshot/video on failure

See `playwright.config.ts` for configuration details.

## Debugging Tips

### 1. Run in UI mode

```bash
pnpm test:e2e:ui
```

This opens an interactive UI where you can:
- See all tests
- Run individual tests
- Step through test execution
- Inspect DOM at each step

### 2. Run in headed mode

```bash
pnpm test:e2e:headed
```

See the actual browser window during test execution.

### 3. Use debug mode

```bash
pnpm test:e2e:debug
```

Opens Playwright Inspector for step-by-step debugging.

### 4. Add console logs

```typescript
test("debug test", async ({ authenticatedPage }) => {
  console.log("Current URL:", authenticatedPage.url());
  
  const storage = await getOnboardingProgress(authenticatedPage);
  console.log("Storage:", storage);
});
```

### 5. Take screenshots

```typescript
await authenticatedPage.screenshot({ path: "debug.png" });
```

### 6. Pause execution

```typescript
await authenticatedPage.pause(); // Opens Playwright Inspector
```

## Best Practices

1. **Use fixtures** - Use `authenticatedPage` from fixtures when authentication is needed
2. **Wait for elements** - Use `expect().toBeVisible()` instead of `waitForTimeout()`
3. **Unique identifiers** - Use `generateTestEmail()` and timestamps for unique data
4. **Clean state** - Tests should be independent and not rely on previous tests
5. **Meaningful assertions** - Test behavior, not implementation details
6. **Error messages** - Use descriptive error messages in assertions
7. **Page Object Model** - Consider using Page Object Model for complex flows
8. **Locators** - Use locators for resilient element selection

## Troubleshooting

### Tests failing locally

1. Make sure dev server is running: `pnpm dev`
2. Check if port 4321 is available
3. Clear browser cache: `pnpm exec playwright clean`
4. Reinstall browsers: `pnpm exec playwright install`

### Tests timing out

1. Increase timeout in test: `test.setTimeout(60000)`
2. Check network requests in headed mode
3. Look for missing mocks or API routes

### Flaky tests

1. Add proper waits: `await expect(element).toBeVisible()`
2. Avoid `waitForTimeout()` - use condition-based waits
3. Check for race conditions
4. Ensure unique test data

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Test Plan](.ai/e2e-test-plan-onboarding.md)
- [OAuth Testing Strategies](.ai/oauth-testing-strategies.md)
