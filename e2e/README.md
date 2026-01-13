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

### Run only onboarding tests

```bash
pnpm test:e2e:onboarding
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
└── onboarding/
    ├── 01-welcome.spec.ts           # Welcome step tests
    ├── 02-connect-calendar.spec.ts  # Calendar connection tests
    ├── 03-add-children.spec.ts      # Add children tests
    ├── 04-invite-members.spec.ts    # Invite members tests
    ├── 05-complete-flow.spec.ts     # Full flow integration tests
    └── 06-navigation.spec.ts        # Navigation and state tests
```

## Authentication Strategy

Tests use **mocked OAuth** by default for fast, reliable execution without external dependencies.

The mock authentication:
- Intercepts Supabase OAuth requests
- Returns fake tokens and user data
- Works entirely offline
- Perfect for CI/CD pipelines

See `.ai/oauth-testing-strategies.md` for alternative authentication strategies.

## Test Coverage

### Onboarding Flow (6 test suites, 50+ tests)

1. **Welcome Step** (8 tests)
   - Display and content validation
   - Form validation (empty, too long)
   - Family creation
   - Error handling
   - Loading states

2. **Connect Calendar Step** (10 tests)
   - Provider options display
   - Skip functionality
   - OAuth callback handling (success/error)
   - Multiple calendars
   - State persistence

3. **Add Children Step** (12 tests)
   - Form display and validation
   - Adding/removing children
   - Multiple children
   - Date validation
   - Error handling

4. **Invite Members Step** (11 tests)
   - Email validation
   - Sending invitations
   - Multiple invitations
   - Duplicate handling
   - Error handling

5. **Complete Flow** (10 tests)
   - Minimal onboarding
   - Full onboarding
   - Multiple children and invitations
   - Error recovery
   - Progress persistence
   - Calendar connection flow

6. **Navigation and State** (11 tests)
   - Back/forward navigation
   - Data preservation
   - Progress resumption
   - Browser navigation
   - LocalStorage management
   - Corrupted data handling

## Writing New Tests

### Use the test fixtures

```typescript
import { test, expect } from "../fixtures/auth";
import { completeSteps, addChild } from "../fixtures/helpers";

test("my new test", async ({ authenticatedPage }) => {
  // authenticatedPage is already authenticated
  await authenticatedPage.goto("/onboarding/welcome");
  // ... test code
});
```

### Available helpers

- `completeWelcomeStep(page, familyName?)` - Complete step 1
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

- `PUBLIC_SUPABASE_URL` - Supabase project URL
- `PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `FRONTEND_URL` - Frontend URL (defaults to http://localhost:4321)

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

1. **Use fixtures** - Always use `authenticatedPage` from fixtures
2. **Wait for elements** - Use `expect().toBeVisible()` instead of `waitForTimeout()`
3. **Unique identifiers** - Use `generateTestEmail()` and timestamps for unique data
4. **Clean state** - Tests should be independent and not rely on previous tests
5. **Meaningful assertions** - Test behavior, not implementation details
6. **Error messages** - Use descriptive error messages in assertions

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
