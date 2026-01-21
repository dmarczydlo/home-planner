# E2E Test Plan: Authentication Comparison

This document compares the original test plan (with mocked auth) to the updated plan (with real Supabase authentication).

---

## Key Changes

### ✅ Before (Mocked Authentication)

**Approach**: Mock Supabase OAuth endpoints and API responses

**Files**:
- `e2e/fixtures/auth.ts` - Contains `mockGoogleAuth()` and `mockApiEndpoints()`
- Tests use `authenticatedPage` fixture that mocks everything

**Pros**:
- Fast (no real API calls)
- No external dependencies
- Works offline

**Cons**:
- ❌ Doesn't test real authentication flow
- ❌ May miss real OAuth issues
- ❌ Doesn't test actual Supabase integration
- ❌ Mocked data may not match real API responses

---

### ✅ After (Real Supabase Authentication)

**Approach**: Use real Supabase Google OAuth with Playwright storage state

**Files**:
- `e2e/auth.setup.ts` - Authenticates once and saves storage state
- `playwright.config.ts` - Configured to use storage state
- `e2e/fixtures/auth.ts` - Updated to use storage state (mocks deprecated)

**Pros**:
- ✅ Tests real authentication flow
- ✅ Catches real OAuth issues
- ✅ Tests actual Supabase integration
- ✅ Faster than authenticating for each test (authenticate once, reuse)
- ✅ More reliable (tests what users actually experience)

**Cons**:
- Requires test Google account
- Sessions expire (~1 hour)
- Need to regenerate storage state periodically

---

## Architecture Comparison

### Before: Mock-Based

```
Test → Mocked Auth Fixture → Mocked APIs → Test
```

### After: Storage State-Based

```
Auth Setup → Real Supabase OAuth → Save Storage State → Tests (reuse state)
```

---

## File Changes

### New Files

1. **`e2e/auth.setup.ts`**
   - Authenticates with real Supabase Google OAuth
   - Saves storage state to `.auth/user.json`
   - Run once manually, then reuse state

2. **`.ai/e2e-authentication-setup.md`**
   - Complete setup guide
   - Troubleshooting
   - CI/CD integration examples

### Updated Files

1. **`playwright.config.ts`**
   - Added `setup` project for auth setup
   - `chromium` project uses `storageState: ".auth/user.json"`
   - Added `chromium-unauthenticated` project for login tests

2. **`e2e/fixtures/auth.ts`**
   - Deprecated mock functions (kept for reference)
   - Updated `authenticatedPage` fixture to use storage state
   - Added warnings about deprecated mocks

3. **`.gitignore`**
   - Added `.auth/` to ignore storage state files

4. **Test Plan Documents**
   - Updated to reflect storage state approach
   - Added authentication setup instructions
   - Updated test examples

---

## Test Writing Changes

### Before (Mocked)

```typescript
import { test } from "./fixtures/auth";

test("my test", async ({ authenticatedPage }) => {
  // authenticatedPage has mocked auth
  await authenticatedPage.goto("/calendar/week");
  // ...
});
```

### After (Storage State)

```typescript
import { test } from "@playwright/test";

test("my test", async ({ page }) => {
  // page is pre-authenticated via storage state
  await page.goto("/calendar/week");
  // ...
});
```

**Key Difference**: 
- No need to import from fixtures/auth
- Use `page` directly (already authenticated)
- Simpler, cleaner code

---

## Setup Process Comparison

### Before

```bash
# No setup needed - mocks work immediately
npx playwright test
```

### After

```bash
# Step 1: Set environment variable
export TEST_GOOGLE_EMAIL=e2e-test@yourdomain.com

# Step 2: Run auth setup (first time, in headed mode)
npx playwright test --headed e2e/auth.setup.ts

# Step 3: Run tests (uses saved state)
npx playwright test
```

---

## CI/CD Changes

### Before

```yaml
- run: npx playwright test
```

### After

```yaml
- name: Setup authentication
  env:
    TEST_GOOGLE_EMAIL: ${{ secrets.TEST_GOOGLE_EMAIL }}
  run: |
    if [ -f .auth/user.json ]; then
      echo "Using cached auth state"
    else
      npx playwright test e2e/auth.setup.ts
    fi

- name: Run E2E tests
  run: npx playwright test
```

---

## Migration Checklist

If you're migrating from mocked auth to real auth:

- [ ] Create test Google account (`e2e-test@yourdomain.com`)
- [ ] Enable test account in Supabase dashboard
- [ ] Set `TEST_GOOGLE_EMAIL` environment variable
- [ ] Run `npx playwright test --headed e2e/auth.setup.ts`
- [ ] Verify `.auth/user.json` is created
- [ ] Update tests to use `page` instead of `authenticatedPage`
- [ ] Remove any `mockGoogleAuth()` calls from tests
- [ ] Update CI/CD to include auth setup step
- [ ] Test that all tests still pass
- [ ] Document the new process for team

---

## Benefits of New Approach

1. **Real Integration Testing**: Tests actual Supabase OAuth flow
2. **Better Coverage**: Catches real authentication issues
3. **Production-Like**: Tests what users actually experience
4. **Maintainable**: Less mocking code to maintain
5. **Reliable**: Storage state is stable and reusable

---

## When to Use Each Approach

### Use Real Auth (Current Approach) When:
- ✅ Testing production-like flows
- ✅ Want to catch real OAuth issues
- ✅ Testing Supabase integration
- ✅ Need reliable, maintainable tests

### Use Mocked Auth When:
- ⚠️ Testing in environments without Supabase
- ⚠️ Need to test specific error scenarios
- ⚠️ Testing offline
- ⚠️ Need very fast test execution (though storage state is also fast)

**Recommendation**: Use real auth for E2E tests (current approach). Use mocked auth only for unit/integration tests.

---

## Summary

The updated test plan now uses **real Supabase authentication** with Playwright storage state, which:

- ✅ Tests actual authentication flows
- ✅ Is more reliable and maintainable
- ✅ Catches real integration issues
- ✅ Still fast (authenticate once, reuse state)

The main trade-off is requiring a test Google account and periodic regeneration of storage state, but this is a small price for the benefits of testing real authentication.

---

**Last Updated**: 2024
