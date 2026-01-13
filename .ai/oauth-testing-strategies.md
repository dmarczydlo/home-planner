# OAuth Testing Strategies for Playwright

## The Challenge

Testing OAuth flows (like Google Sign-In) in E2E tests is challenging because:

1. **External Dependency**: Real OAuth requires interaction with Google's servers
2. **Security**: Can't use real user credentials in automated tests
3. **Consistency**: OAuth tokens expire and require manual intervention
4. **CI/CD**: Automated tests need to run without human interaction

## Recommended Strategies

### Strategy 1: Mock OAuth Flow (Best for CI/CD) ⭐

**When to use**: Automated CI/CD pipelines, fast test execution

**Pros**:
- No external dependencies
- Fast and reliable
- Works in any environment
- No rate limiting concerns

**Cons**:
- Doesn't test actual OAuth integration
- Requires maintaining mocks

**Implementation**:

```typescript
// e2e/fixtures/auth.ts
import { test as base, Page } from '@playwright/test';

export async function mockGoogleAuth(page: Page) {
  // Intercept Supabase OAuth initiation
  await page.route('**/auth/v1/authorize**', async (route) => {
    const callbackUrl = new URL('http://localhost:4321/auth/callback');
    callbackUrl.searchParams.set('code', 'mock-auth-code');
    
    await route.fulfill({
      status: 302,
      headers: { 'Location': callbackUrl.toString() }
    });
  });

  // Mock token exchange
  await page.route('**/auth/v1/token**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: {
          id: 'test-user-123',
          email: 'test@example.com',
          user_metadata: {
            full_name: 'Test User'
          }
        }
      })
    });
  });

  // Mock user session endpoint
  await page.route('**/auth/v1/user**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'test-user-123',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User'
        }
      })
    });
  });
}

// Usage in tests
test('user can sign in', async ({ page }) => {
  await mockGoogleAuth(page);
  await page.goto('/');
  await page.click('button:has-text("Sign in with Google")');
  await page.waitForURL('/onboarding/welcome');
});
```

### Strategy 2: Supabase Test User (Best for Local Development) ⭐

**When to use**: Local development, integration testing

**Pros**:
- Tests real Supabase integration
- More realistic than mocking
- Stable and repeatable

**Cons**:
- Requires Supabase access
- Need to manage test users
- Slower than mocking

**Implementation**:

```typescript
// e2e/fixtures/supabase-auth.ts
import { createClient } from '@supabase/supabase-js';
import type { Page } from '@playwright/test';

const TEST_USER_EMAIL = 'e2e-test@example.com';
const TEST_USER_PASSWORD = 'test-password-123!';

export async function setupTestUser() {
  const supabase = createClient(
    process.env.PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role for admin operations
  );

  // Try to create test user (idempotent)
  const { data, error } = await supabase.auth.admin.createUser({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: 'E2E Test User'
    }
  });

  if (error && !error.message.includes('already registered')) {
    throw error;
  }

  return data?.user?.id;
}

export async function authenticateTestUser(page: Page) {
  const supabase = createClient(
    process.env.PUBLIC_SUPABASE_URL!,
    process.env.PUBLIC_SUPABASE_ANON_KEY!
  );

  // Sign in programmatically
  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD
  });

  if (error) throw error;

  // Inject session into browser
  await page.goto('/');
  await page.evaluate((session) => {
    localStorage.setItem(
      `sb-${location.hostname.split('.')[0]}-auth-token`,
      JSON.stringify(session)
    );
  }, data.session);

  await page.reload();
  return data.user.id;
}

export async function cleanupTestUser(userId: string) {
  const supabase = createClient(
    process.env.PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Delete user's data
  await supabase.from('families').delete().eq('created_by', userId);
  await supabase.from('external_calendars').delete().eq('user_id', userId);
  
  // Optionally delete user (or keep for reuse)
  // await supabase.auth.admin.deleteUser(userId);
}

// Usage in tests
test.beforeEach(async ({ page }) => {
  await setupTestUser();
  await authenticateTestUser(page);
});

test.afterEach(async ({ page }) => {
  const userId = await page.evaluate(() => {
    const session = localStorage.getItem('sb-...-auth-token');
    return session ? JSON.parse(session).user.id : null;
  });
  
  if (userId) {
    await cleanupTestUser(userId);
  }
});
```

### Strategy 3: Persistent Auth State (Best for Manual Testing)

**When to use**: Manual test runs, debugging

**Pros**:
- Tests real OAuth flow
- One-time setup
- Good for debugging

**Cons**:
- Requires manual intervention
- Not suitable for CI/CD
- Auth tokens expire

**Implementation**:

```typescript
// e2e/global-setup.ts
import { chromium, FullConfig } from '@playwright/test';
import path from 'path';

async function globalSetup(config: FullConfig) {
  const authFile = path.join(__dirname, '.auth/user.json');
  
  // Check if auth file exists and is recent
  try {
    const stats = require('fs').statSync(authFile);
    const ageInHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
    
    if (ageInHours < 24) {
      console.log('Using existing auth state');
      return;
    }
  } catch (e) {
    // File doesn't exist, continue with setup
  }

  console.log('Setting up authentication...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:4321');
  
  // Click sign in button
  await page.click('button:has-text("Sign in with Google")');
  
  console.log('Please complete Google sign-in in the browser...');
  
  // Wait for user to complete OAuth (60 second timeout)
  await page.waitForURL('**/onboarding/**', { timeout: 60000 });
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
  
  console.log('Authentication state saved!');
  await browser.close();
}

export default globalSetup;

// playwright.config.ts
export default defineConfig({
  globalSetup: require.resolve('./e2e/global-setup'),
  use: {
    storageState: 'e2e/.auth/user.json',
  },
});
```

### Strategy 4: Hybrid Approach (Best Overall) ⭐⭐⭐

**Recommendation**: Combine strategies based on environment

```typescript
// e2e/fixtures/auth-factory.ts
import { Page } from '@playwright/test';
import { mockGoogleAuth } from './mock-auth';
import { authenticateTestUser } from './supabase-auth';

export async function authenticate(page: Page) {
  const env = process.env.TEST_ENV || 'mock';
  
  switch (env) {
    case 'mock':
      // Fast mocked auth for CI/CD
      await mockGoogleAuth(page);
      await page.goto('/');
      await page.click('button:has-text("Sign in with Google")');
      break;
      
    case 'supabase':
      // Real Supabase auth for integration tests
      await authenticateTestUser(page);
      break;
      
    case 'real':
      // Use persistent auth state for manual testing
      // Auth state loaded from storageState config
      await page.goto('/');
      break;
      
    default:
      throw new Error(`Unknown TEST_ENV: ${env}`);
  }
}

// Usage
test('onboarding flow', async ({ page }) => {
  await authenticate(page);
  await page.goto('/onboarding/welcome');
  // ... rest of test
});
```

## Testing Calendar OAuth (Google Calendar, Microsoft 365)

For testing the calendar connection step in onboarding:

```typescript
test('connect Google Calendar', async ({ page }) => {
  await completeWelcomeStep(page);
  
  // Mock the calendar OAuth initiation
  await page.route('**/api/external-calendars/initiate**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        authorization_url: 'https://accounts.google.com/o/oauth2/v2/auth?...',
        state: 'mock-state-token'
      })
    });
  });
  
  // Mock the OAuth callback
  await page.route('**/api/external-calendars/callback**', async (route) => {
    await route.fulfill({
      status: 302,
      headers: {
        'Location': '/onboarding/welcome?status=success&calendar_id=cal-123'
      }
    });
  });
  
  // Mock calendar list API
  await page.route('**/api/external-calendars', async (route) => {
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
  
  // Click Google Calendar button
  await page.click('button:has-text("Google Calendar")');
  
  // Verify connection
  await expect(page.locator('text=Connected')).toBeVisible();
});
```

## Configuration by Environment

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

const isCI = !!process.env.CI;
const testEnv = process.env.TEST_ENV || (isCI ? 'mock' : 'supabase');

export default defineConfig({
  use: {
    baseURL: 'http://localhost:4321',
    
    // Use persistent auth only for 'real' mode
    ...(testEnv === 'real' && {
      storageState: 'e2e/.auth/user.json'
    }),
  },
  
  // Different workers for different modes
  workers: testEnv === 'mock' ? 4 : 1,
  
  // Faster retries for mocked tests
  retries: testEnv === 'mock' ? 1 : 2,
});
```

## Running Tests

```bash
# Fast mocked tests (CI/CD)
TEST_ENV=mock pnpm test:e2e

# Integration tests with real Supabase
TEST_ENV=supabase pnpm test:e2e

# Manual testing with real OAuth
TEST_ENV=real pnpm test:e2e

# Run only onboarding tests
pnpm test:e2e e2e/onboarding
```

## Summary

| Strategy | Speed | Reliability | Realism | CI/CD | Local Dev |
|----------|-------|-------------|---------|-------|-----------|
| Mock OAuth | ⚡⚡⚡ | ⭐⭐⭐ | ⭐ | ✅ | ✅ |
| Supabase Test User | ⚡⚡ | ⭐⭐⭐ | ⭐⭐⭐ | ✅ | ✅ |
| Persistent Auth | ⚡⚡⚡ | ⭐⭐ | ⭐⭐⭐ | ❌ | ✅ |
| Hybrid | ⚡⚡⚡ | ⭐⭐⭐ | ⭐⭐⭐ | ✅ | ✅ |

**Recommendation**: Use the **Hybrid Approach** with:
- **Mock OAuth** for CI/CD and fast feedback
- **Supabase Test User** for local integration testing
- **Persistent Auth** for manual debugging when needed
