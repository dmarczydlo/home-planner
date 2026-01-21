# Comprehensive E2E Test Plan - Home Planner

## Table of Contents
1. [Overview](#overview)
2. [Test Architecture](#test-architecture)
3. [Critical Use Cases](#critical-use-cases)
4. [Page Object Model Structure](#page-object-model-structure)
5. [Data-TestID Strategy](#data-testid-strategy)
6. [Test Organization](#test-organization)
7. [Implementation Guidelines](#implementation-guidelines)
8. [Test Generation Prompt](#test-generation-prompt)

---

## Overview

### Application Summary
Home Planner is a family calendar coordination application that helps families manage their schedules, events, and activities. The application includes:

- **Authentication**: Google OAuth integration
- **Onboarding**: Multi-step wizard for new users
- **Calendar Views**: Day, Week, Month, and Agenda views
- **Event Management**: Create, edit, delete events (Elastic and Blocker types)
- **Family Management**: Manage family members, children, and invitations
- **External Calendar Sync**: Google Calendar and Microsoft 365 integration
- **Settings**: Account, preferences, and calendar management

### Test Strategy Goals
1. **Maintainability**: Use Page Object Model to reduce duplication and improve maintainability
2. **Reliability**: Stable tests that don't break with minor UI changes
3. **Coverage**: Test all critical user journeys
4. **Speed**: Fast execution with proper mocking and parallelization
5. **Clarity**: Clear test structure and naming conventions

---

## Test Architecture

### Current Setup
- **Framework**: Playwright
- **Browser**: Chromium (Desktop Chrome)
- **Base URL**: `http://localhost:4321`
- **Authentication**: Supabase Google OAuth with storage state
- **Fixtures**: Storage state-based authentication, API endpoint mocking (for external services)
- **Helpers**: Onboarding helpers, test data generators

### Architecture Principles
1. **Page Object Model (POM)**: Each page/component has a corresponding Page Object class
2. **Component Objects**: Reusable components (modals, forms) have their own objects
3. **Storage State Authentication**: Use Playwright storage state for real Supabase authentication
4. **API Mocking**: Mock only external services (OAuth providers), use real Supabase APIs
5. **Test Data Management**: Centralized test data generation
6. **Isolation**: Each test is independent and can run in parallel
7. **Auth Setup Project**: Separate project for authenticating once and saving state

---

## Critical Use Cases

### Priority 1: Core User Journeys (Must Have E2E Tests)

#### 1. Authentication Flow
**Priority**: 🔴 Critical
**User Story**: As a new user, I want to sign in with Google so I can access the application.

**Test Scenarios**:
- ✅ User can click "Sign in with Google" button
- ✅ User is redirected to Google OAuth
- ✅ OAuth callback successfully authenticates user
- ✅ New user is redirected to onboarding
- ✅ Returning user is redirected to calendar
- ✅ Authentication errors are handled gracefully
- ✅ User can logout successfully

**Files to Test**:
- `/auth/login`
- `/auth/callback`
- Logout functionality

---

#### 2. Onboarding Flow (Complete Journey)
**Priority**: 🔴 Critical
**User Story**: As a new user, I want to complete onboarding so I can set up my family and start using the calendar.

**Test Scenarios**:
- ✅ **Step 1 - Welcome**: User can enter family name and proceed
- ✅ **Step 2 - Connect Calendar**: User can connect Google Calendar (or skip)
- ✅ **Step 2 - Connect Calendar**: User can connect Microsoft 365 (or skip)
- ✅ **Step 3 - Add Children**: User can add multiple children
- ✅ **Step 3 - Add Children**: User can remove children
- ✅ **Step 4 - Invite Members**: User can send invitations
- ✅ **Step 4 - Invite Members**: User can skip invitations
- ✅ Progress indicator shows correct step
- ✅ User can navigate back to previous steps
- ✅ Onboarding completion redirects to calendar

**Files to Test**:
- `/onboarding/welcome`
- `/onboarding/connect-calendar`
- `/onboarding/add-children`
- `/onboarding/invite-members`

---

#### 3. Calendar View Navigation
**Priority**: 🔴 Critical
**User Story**: As a user, I want to view my calendar in different views (Day, Week, Month, Agenda) so I can see my schedule.

**Test Scenarios**:
- ✅ User can switch between Day, Week, Month, and Agenda views
- ✅ Date navigation (previous/next) works in all views
- ✅ Current date indicator is visible
- ✅ Events are displayed correctly in each view
- ✅ Empty state is shown when no events exist
- ✅ View preference persists across navigation

**Files to Test**:
- `/calendar/day`
- `/calendar/week`
- `/calendar/month`
- `/calendar/agenda`

---

#### 4. Event Creation (Elastic Event)
**Priority**: 🔴 Critical
**User Story**: As a user, I want to create flexible events so I can schedule activities that can be moved.

**Test Scenarios**:
- ✅ User can open event creation modal from calendar
- ✅ User can fill in event details (title, date, time, participants)
- ✅ User can select multiple participants (users and children)
- ✅ User can set event as "Elastic"
- ✅ User can save event successfully
- ✅ Event appears on calendar after creation
- ✅ Conflict warnings are shown when applicable
- ✅ Form validation works correctly

**Files to Test**:
- Event creation modal component
- Calendar views (all)

---

#### 5. Event Creation (Blocker Event)
**Priority**: 🔴 Critical
**User Story**: As a user, I want to create fixed events so I can mark commitments that cannot be moved.

**Test Scenarios**:
- ✅ User can create a "Blocker" event
- ✅ Blocker events show conflict warnings for overlapping events
- ✅ Blocker events cannot be overridden by Elastic events
- ✅ Event appears correctly on calendar

---

#### 6. Event Editing
**Priority**: 🟡 High
**User Story**: As a user, I want to edit events so I can update details when plans change.

**Test Scenarios**:
- ✅ User can open event edit modal by clicking event
- ✅ User can modify event details
- ✅ User can change event type (Elastic/Blocker)
- ✅ User can update participants
- ✅ User can save changes
- ✅ Changes are reflected on calendar
- ✅ Recurring event editing works correctly

---

#### 7. Event Deletion
**Priority**: 🟡 High
**User Story**: As a user, I want to delete events so I can remove cancelled activities.

**Test Scenarios**:
- ✅ User can delete a single event
- ✅ User can delete a recurring event (single occurrence or all)
- ✅ Confirmation dialog appears before deletion
- ✅ Event is removed from calendar after deletion

---

#### 8. Member Filtering
**Priority**: 🟡 High
**User Story**: As a user, I want to filter calendar by family members so I can see specific schedules.

**Test Scenarios**:
- ✅ User can select/deselect family members to filter
- ✅ Calendar updates to show only selected members' events
- ✅ Filter state persists across view changes
- ✅ "All members" option shows all events

---

### Priority 2: Family Management (Should Have E2E Tests)

#### 9. Add Children
**Priority**: 🟡 High
**User Story**: As a user, I want to add children to my family so I can include them in events.

**Test Scenarios**:
- ✅ User can navigate to family children page
- ✅ User can add a new child with name and date of birth
- ✅ User can edit child details
- ✅ User can delete a child
- ✅ Form validation works correctly

**Files to Test**:
- `/family/children`

---

#### 10. Invite Family Members
**Priority**: 🟡 High
**User Story**: As a family admin, I want to invite members so they can join my family.

**Test Scenarios**:
- ✅ User can send invitation with email
- ✅ Invitation appears in pending invitations list
- ✅ User can cancel pending invitation
- ✅ Email validation works correctly
- ✅ Duplicate invitation prevention

**Files to Test**:
- `/family/invitations`

---

#### 11. View Family Members
**Priority**: 🟢 Medium
**User Story**: As a user, I want to see all family members so I know who is in my family.

**Test Scenarios**:
- ✅ User can view list of family members
- ✅ Member roles (admin/member) are displayed
- ✅ Member avatars and names are shown

**Files to Test**:
- `/family/members`

---

### Priority 3: Settings & Configuration (Nice to Have E2E Tests)

#### 12. External Calendar Connection
**Priority**: 🟢 Medium
**User Story**: As a user, I want to connect external calendars so events sync automatically.

**Test Scenarios**:
- ✅ User can connect Google Calendar from settings
- ✅ User can connect Microsoft 365 from settings
- ✅ Connected calendars are displayed
- ✅ User can disconnect calendars
- ✅ Sync status is shown

**Files to Test**:
- `/settings/calendars`

---

#### 13. Account Settings
**Priority**: 🟢 Medium
**User Story**: As a user, I want to update my profile so my information is current.

**Test Scenarios**:
- ✅ User can view profile information
- ✅ User can update name
- ✅ User can update avatar
- ✅ Changes are saved successfully

**Files to Test**:
- `/settings/account`
- `/profile/me`

---

#### 14. Preferences
**Priority**: 🟢 Low
**User Story**: As a user, I want to configure preferences so the app works how I like.

**Test Scenarios**:
- ✅ User can update preferences
- ✅ Preferences are saved and persist

**Files to Test**:
- `/settings/preferences`

---

### Priority 4: Edge Cases & Error Handling

#### 15. Error Handling
**Priority**: 🟡 High
**Test Scenarios**:
- ✅ Network errors are handled gracefully
- ✅ API errors show user-friendly messages
- ✅ Invalid form inputs show validation errors
- ✅ Unauthorized access redirects to login
- ✅ 404 pages are handled

---

#### 16. Responsive Design
**Priority**: 🟢 Medium
**Test Scenarios**:
- ✅ Calendar views work on mobile viewport
- ✅ Modals are accessible on mobile
- ✅ Navigation works on mobile
- ✅ Touch interactions work correctly

---

## Page Object Model Structure

### Directory Structure
```
e2e/
├── fixtures/
│   ├── auth.ts              # Authentication fixtures (storage state based)
│   └── helpers.ts           # Test helpers (existing)
├── pages/                   # Page Object classes
│   ├── BasePage.ts          # Base class with common methods
│   ├── LoginPage.ts         # Login page object
│   ├── OnboardingPage.ts   # Onboarding wizard page object
│   ├── CalendarPage.ts     # Calendar views page object
│   ├── FamilyPage.ts       # Family management page object
│   └── SettingsPage.ts     # Settings page object
├── components/              # Component objects (reusable)
│   ├── EventModal.ts       # Event create/edit modal
│   ├── MemberFilter.ts     # Member filter component
│   ├── DateNavigation.ts   # Date navigation component
│   └── ViewSwitcher.ts     # View switcher component
├── utils/                  # Test utilities
│   ├── test-data.ts        # Test data generators
│   └── assertions.ts       # Custom assertions
├── specs/                  # Test specifications
│   ├── auth.spec.ts
│   ├── onboarding.spec.ts
│   ├── calendar.spec.ts
│   ├── events.spec.ts
│   ├── family.spec.ts
│   └── settings.spec.ts
└── auth.setup.ts           # Authentication setup test (runs once)
```

### Authentication Setup

**File**: `e2e/auth.setup.ts`

This file authenticates once with Supabase and saves the storage state for reuse in all tests.

```typescript
import { test as setup, expect } from "@playwright/test";

const AUTH_FILE = ".auth/user.json";
const TEST_GOOGLE_EMAIL = process.env.TEST_GOOGLE_EMAIL!;

setup("authenticate", async ({ page }) => {
  if (!TEST_GOOGLE_EMAIL) {
    throw new Error("TEST_GOOGLE_EMAIL environment variable is required");
  }

  // Navigate to login page
  await page.goto("/auth/login");

  // Click Google login button
  await page.click('[data-testid="login-google-signin-button"]');

  // Wait for Google OAuth page
  // Note: First run requires manual completion in headed mode
  // Subsequent runs will use saved storage state
  await page.waitForURL(/accounts\.google\.com/, { timeout: 10000 });

  // Complete Google OAuth (manual on first run, automated after)
  // For automated runs, you may need to handle 2FA or use a service account
  
  // Wait for redirect back to app
  await page.waitForURL(/\/auth\/callback|\/onboarding|\/calendar/, { timeout: 30000 });

  // Verify authentication succeeded by checking for authenticated state
  // This could be checking for user menu, or redirect to onboarding/calendar
  const isAuthenticated = 
    page.url().includes("/onboarding") || 
    page.url().includes("/calendar") ||
    (await page.locator('[data-testid="user-menu"]').isVisible().catch(() => false));

  if (!isAuthenticated) {
    throw new Error("Authentication failed - not redirected to authenticated page");
  }

  // Save authentication state
  await page.context().storageState({ path: AUTH_FILE });
});
```

**Usage**:
```bash
# First time: Run manually in headed mode to complete OAuth
npx playwright test --headed e2e/auth.setup.ts

# Subsequent runs: Will use saved state (can run headless)
npx playwright test e2e/auth.setup.ts
```

### Base Page Class

**File**: `e2e/pages/BasePage.ts`

```typescript
import { Page, Locator, expect } from "@playwright/test";

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Navigation
  async goto(path: string) {
    await this.page.goto(path);
    await this.waitForLoad();
  }

  async waitForLoad() {
    await this.page.waitForLoadState("networkidle");
  }

  // Common locators
  getByTestId(testId: string): Locator {
    return this.page.locator(`[data-testid="${testId}"]`);
  }

  // Common actions
  async clickByTestId(testId: string) {
    await this.getByTestId(testId).click();
  }

  async fillByTestId(testId: string, value: string) {
    await this.getByTestId(testId).fill(value);
  }

  // Assertions
  async expectVisible(testId: string) {
    await expect(this.getByTestId(testId)).toBeVisible();
  }

  async expectText(testId: string, text: string) {
    await expect(this.getByTestId(testId)).toContainText(text);
  }
}
```

### Example Page Object: LoginPage

**File**: `e2e/pages/LoginPage.ts`

```typescript
import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class LoginPage extends BasePage {
  // Locators
  get signInButton() {
    return this.getByTestId("login-google-signin-button");
  }

  get errorMessage() {
    return this.getByTestId("login-error-message");
  }

  // Actions
  async clickSignIn() {
    await this.signInButton.click();
  }

  async expectError(message: string) {
    await this.expectText("login-error-message", message);
  }

  // Navigation
  async signIn() {
    await this.clickSignIn();
    // Wait for OAuth redirect or callback
    await this.page.waitForURL("**/auth/callback**", { timeout: 10000 });
  }
}
```

### Example Page Object: CalendarPage

**File**: `e2e/pages/CalendarPage.ts`

```typescript
import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { EventModal } from "../components/EventModal";
import { ViewSwitcher } from "../components/ViewSwitcher";
import { MemberFilter } from "../components/MemberFilter";

export class CalendarPage extends BasePage {
  readonly eventModal: EventModal;
  readonly viewSwitcher: ViewSwitcher;
  readonly memberFilter: MemberFilter;

  constructor(page: Page) {
    super(page);
    this.eventModal = new EventModal(page);
    this.viewSwitcher = new ViewSwitcher(page);
    this.memberFilter = new MemberFilter(page);
  }

  // Locators
  get createEventButton() {
    return this.getByTestId("calendar-create-event-button");
  }

  get eventCard() {
    return this.getByTestId("calendar-event-card");
  }

  // Actions
  async openCreateEventModal() {
    await this.createEventButton.click();
    await this.eventModal.waitForOpen();
  }

  async switchToView(view: "day" | "week" | "month" | "agenda") {
    await this.viewSwitcher.selectView(view);
  }

  async filterByMember(memberId: string) {
    await this.memberFilter.selectMember(memberId);
  }

  // Assertions
  async expectEventVisible(eventTitle: string) {
    await expect(
      this.page.locator(`[data-testid="calendar-event-card"]:has-text("${eventTitle}")`)
    ).toBeVisible();
  }
}
```

### Example Component Object: EventModal

**File**: `e2e/components/EventModal.ts`

```typescript
import { Page, Locator } from "@playwright/test";
import { BasePage } from "../pages/BasePage";

export class EventModal extends BasePage {
  // Locators
  get titleInput() {
    return this.getByTestId("event-modal-title-input");
  }

  get dateInput() {
    return this.getByTestId("event-modal-date-input");
  }

  get elasticRadio() {
    return this.getByTestId("event-modal-type-elastic");
  }

  get blockerRadio() {
    return this.getByTestId("event-modal-type-blocker");
  }

  get saveButton() {
    return this.getByTestId("event-modal-save-button");
  }

  get cancelButton() {
    return this.getByTestId("event-modal-cancel-button");
  }

  // Actions
  async fillTitle(title: string) {
    await this.titleInput.fill(title);
  }

  async selectType(type: "elastic" | "blocker") {
    if (type === "elastic") {
      await this.elasticRadio.click();
    } else {
      await this.blockerRadio.click();
    }
  }

  async selectParticipant(participantId: string) {
    await this.getByTestId(`event-modal-participant-${participantId}`).click();
  }

  async save() {
    await this.saveButton.click();
    await this.waitForClose();
  }

  async cancel() {
    await this.cancelButton.click();
    await this.waitForClose();
  }

  // State checks
  async waitForOpen() {
    await this.expectVisible("event-modal");
  }

  async waitForClose() {
    await expect(this.getByTestId("event-modal")).not.toBeVisible();
  }
}
```

---

## Data-TestID Strategy

### Principles

1. **Add test IDs inside components, not in parent components**
   - ✅ **Good**: Add `data-testid` in the component's return statement
   - ❌ **Bad**: Add `data-testid` when using the component in a parent

2. **Use descriptive, hierarchical naming**
   - Format: `{feature}-{element}-{purpose}`
   - Examples: `calendar-event-card`, `event-modal-title-input`, `onboarding-welcome-next-button`

3. **Consistent naming conventions**
   - Pages: `{page}-{element}` (e.g., `login-google-signin-button`)
   - Modals: `{modal}-{element}` (e.g., `event-modal-save-button`)
   - Forms: `{form}-{field}` (e.g., `child-form-name-input`)
   - Lists: `{list}-{item}` (e.g., `children-list-item`)

4. **Test IDs for interactive elements**
   - Buttons, links, inputs, selects, checkboxes, radio buttons
   - Form fields and labels
   - Navigation elements
   - Modal/dialog containers

5. **Avoid test IDs for styling-only elements**
   - Don't add test IDs to divs used only for layout/styling
   - Focus on elements that users interact with or that contain important data

### Implementation Guidelines

#### ✅ Correct Pattern (Inside Component)

**File**: `src/components/auth/GoogleSignInButton.tsx`
```tsx
export function GoogleSignInButton() {
  return (
    <button
      data-testid="login-google-signin-button"
      onClick={handleSignIn}
      className="btn-primary"
    >
      Sign in with Google
    </button>
  );
}
```

**File**: `src/components/onboarding/WelcomeStep.tsx`
```tsx
export function WelcomeStep() {
  return (
    <div data-testid="onboarding-welcome-step">
      <input
        data-testid="onboarding-welcome-family-name-input"
        type="text"
        placeholder="Family name"
      />
      <button data-testid="onboarding-welcome-next-button">
        Next
      </button>
    </div>
  );
}
```

#### ❌ Incorrect Pattern (Outside Component)

**File**: `src/pages/auth/login.astro`
```tsx
<!-- ❌ BAD: Adding test ID when using component -->
<GoogleSignInButton data-testid="login-button" />
```

### Required Test IDs by Feature

#### Authentication
- `login-google-signin-button`
- `login-error-message`
- `logout-button`

#### Onboarding
- `onboarding-welcome-step`
- `onboarding-welcome-family-name-input`
- `onboarding-welcome-next-button`
- `onboarding-connect-calendar-step`
- `onboarding-connect-calendar-google-button`
- `onboarding-connect-calendar-microsoft-button`
- `onboarding-connect-calendar-skip-button`
- `onboarding-add-children-step`
- `onboarding-add-children-add-button`
- `onboarding-add-children-child-form`
- `onboarding-add-children-child-name-input`
- `onboarding-add-children-child-dob-input`
- `onboarding-invite-members-step`
- `onboarding-invite-members-email-input`
- `onboarding-invite-members-send-button`
- `onboarding-progress-indicator`

#### Calendar
- `calendar-view-container`
- `calendar-create-event-button`
- `calendar-event-card`
- `calendar-event-card-title`
- `calendar-empty-state`
- `calendar-view-switcher`
- `calendar-view-switcher-day`
- `calendar-view-switcher-week`
- `calendar-view-switcher-month`
- `calendar-view-switcher-agenda`
- `calendar-date-navigation`
- `calendar-date-navigation-prev`
- `calendar-date-navigation-next`
- `calendar-date-navigation-today`
- `calendar-member-filter`
- `calendar-member-filter-item`

#### Event Modal
- `event-modal`
- `event-modal-title-input`
- `event-modal-date-input`
- `event-modal-start-time-input`
- `event-modal-end-time-input`
- `event-modal-type-elastic`
- `event-modal-type-blocker`
- `event-modal-participant-selector`
- `event-modal-participant-{id}`
- `event-modal-recurrence-toggle`
- `event-modal-save-button`
- `event-modal-cancel-button`
- `event-modal-conflict-warning`

#### Family Management
- `family-children-page`
- `family-children-add-button`
- `family-children-list`
- `family-children-list-item`
- `family-children-list-item-edit-button`
- `family-children-list-item-delete-button`
- `family-invitations-page`
- `family-invitations-email-input`
- `family-invitations-send-button`
- `family-invitations-list`
- `family-invitations-list-item`
- `family-members-page`
- `family-members-list`
- `family-members-list-item`

#### Settings
- `settings-calendars-page`
- `settings-calendars-connect-google-button`
- `settings-calendars-connect-microsoft-button`
- `settings-calendars-list`
- `settings-calendars-list-item`
- `settings-account-page`
- `settings-account-name-input`
- `settings-account-save-button`

---

## Test Organization

### Test File Structure

```
e2e/specs/
├── auth.spec.ts              # Authentication tests
├── onboarding.spec.ts        # Onboarding flow tests
├── calendar.spec.ts          # Calendar view tests
├── events.spec.ts            # Event CRUD tests
├── family.spec.ts            # Family management tests
└── settings.spec.ts         # Settings tests
```

### Test Naming Convention

```typescript
test.describe("Feature Name", () => {
  test.describe("User Action", () => {
    test("should [expected behavior] when [condition]", async ({ page }) => {
      // Test implementation
    });
  });
});
```

### Example Test Structure

**File**: `e2e/specs/onboarding.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { OnboardingPage } from "../pages/OnboardingPage";

// Tests are pre-authenticated via storage state in playwright.config.ts
// No need to login - authentication is handled by auth.setup.ts

test.describe("Onboarding Flow", () => {
  test.describe("Step 1: Welcome", () => {
    test("should allow user to enter family name and proceed", async ({ page }) => {
      const onboardingPage = new OnboardingPage(page);
      
      await onboardingPage.gotoWelcomeStep();
      await onboardingPage.welcomeStep.fillFamilyName("Smith Family");
      await onboardingPage.welcomeStep.clickNext();
      
      await onboardingPage.expectStep(2);
    });

    test("should show validation error for empty family name", async ({ page }) => {
      const onboardingPage = new OnboardingPage(page);
      
      await onboardingPage.gotoWelcomeStep();
      await onboardingPage.welcomeStep.clickNext();
      
      await onboardingPage.welcomeStep.expectValidationError("Family name is required");
    });
  });

  test.describe("Complete Onboarding Journey", () => {
    test("should complete full onboarding flow", async ({ page }) => {
      const onboardingPage = new OnboardingPage(page);
      
      // Step 1: Welcome
      await onboardingPage.gotoWelcomeStep();
      await onboardingPage.welcomeStep.fillFamilyName("Test Family");
      await onboardingPage.welcomeStep.clickNext();
      
      // Step 2: Connect Calendar (skip)
      await onboardingPage.connectCalendarStep.clickSkip();
      
      // Step 3: Add Children
      await onboardingPage.addChildrenStep.addChild("Alice", "2015-05-10");
      await onboardingPage.addChildrenStep.clickNext();
      
      // Step 4: Invite Members (skip)
      await onboardingPage.inviteMembersStep.clickSkip();
      
      // Should redirect to calendar
      await expect(page).toHaveURL(/\/calendar\/week/);
    });
  });
});
```

**Note**: Tests use `page` directly instead of `authenticatedPage` because authentication is handled via storage state in `playwright.config.ts`. All tests in the `chromium` project are pre-authenticated.

---

## Implementation Guidelines

### 1. Authentication Setup

#### Initial Setup
1. **Create dedicated test Google account**: `e2e-test@yourdomain.com`
2. **Enable in Supabase**: Add the test account to your Supabase project
3. **Set environment variable**: `TEST_GOOGLE_EMAIL=e2e-test@yourdomain.com`
4. **Run auth setup once**: `npx playwright test --headed e2e/auth.setup.ts`
5. **Verify storage state**: Check that `.auth/user.json` is created

#### Using Storage State in Tests
```typescript
import { test } from "@playwright/test";

// Use storage state for authenticated tests
test.use({ storageState: ".auth/user.json" });

test("my authenticated test", async ({ page }) => {
  // Already authenticated - no need to login
  await page.goto("/calendar/week");
  // Test logic...
});
```

#### Storage State Refresh
- **Sessions expire**: Supabase sessions expire after ~1 hour
- **Refresh strategy**: 
  - Option 1: Regenerate `.auth/user.json` weekly or before CI runs
  - Option 2: Use `supabase.auth.refreshSession()` in setup if needed
  - Option 3: Use service account tokens if available

#### CI/CD Integration
```yaml
# .github/workflows/e2e.yml
- name: Setup auth (or restore from artifact)
  run: |
    if [ -f .auth/user.json ]; then
      echo "Using existing auth state"
    else
      npx playwright test e2e/auth.setup.ts
    fi

- name: Run E2E tests
  run: npx playwright test
```

### 2. Test Independence
- Each test should be independent and can run in isolation
- Use storage state for authentication (shared across tests)
- Clean up test data after each test if needed
- Use unique test data (timestamps, UUIDs) to avoid conflicts

### 3. Wait Strategies
- Always use `expect().toBeVisible()` instead of `waitForTimeout()`
- Wait for network requests to complete when necessary
- Use `waitForLoadState("networkidle")` for page loads
- For OAuth flows, wait for URL changes: `await page.waitForURL(/pattern/)`

### 4. Locator Strategy
- **Primary**: Use `data-testid` attributes
- **Fallback**: Use text content for user-facing elements
- **Avoid**: CSS selectors, XPath (unless absolutely necessary)

### 5. Assertions
- Test behavior, not implementation
- Use descriptive assertion messages
- Verify both positive and negative cases

### 6. Test Data
- Use unique test data (timestamps, UUIDs)
- Centralize test data generation in `e2e/utils/test-data.ts`
- Use factories for creating test entities
- Consider using test database or cleanup scripts for data isolation

### 7. Error Handling
- Test error scenarios (network errors, validation errors)
- Verify error messages are user-friendly
- Test edge cases (empty states, boundary conditions)
- Test authentication errors (expired sessions, invalid tokens)

### 8. Parallel Execution
- Tests should be able to run in parallel
- Use isolated browser contexts
- Avoid shared state between tests
- Storage state is read-only and safe for parallel execution

### 9. Debugging
- Use `test.step()` to organize test steps
- Add meaningful step descriptions
- Use `page.pause()` for debugging (remove before commit)
- For auth issues, run auth.setup.ts in headed mode to debug

### 10. Authentication Best Practices
- **Never commit `.auth/user.json`**: Add to `.gitignore`
- **Use environment variables**: Store test credentials securely
- **Handle session expiration**: Refresh or regenerate storage state
- **Test logout flows**: Ensure logout works correctly
- **Test unauthorized access**: Verify redirects for unauthenticated users

---

## Test Generation Prompt

Use the following prompt template to generate E2E tests:

```
You are a senior QA engineer with extensive experience in E2E testing with Playwright and Page Object Model patterns.

## Context
I'm working on a Home Planner application built with:
- Astro 5, React 19, TypeScript 5
- Playwright for E2E testing
- Page Object Model architecture

## Current Test Structure
- Base Page Object: `e2e/pages/BasePage.ts` with common methods
- Page Objects: `e2e/pages/*.ts` for each major page
- Component Objects: `e2e/components/*.ts` for reusable components
- Test Specs: `e2e/specs/*.spec.ts` for test files
- Fixtures: `e2e/fixtures/auth.ts` for authenticated tests

## Data-TestID Convention
- Format: `{feature}-{element}-{purpose}`
- Examples: `calendar-event-card`, `event-modal-title-input`
- Test IDs are added INSIDE components, not in parent components
- Use descriptive, hierarchical naming

## Task
Generate comprehensive E2E tests for: [SPECIFY FEATURE]

## Requirements
1. **Use Page Object Model**: Create/use appropriate Page Objects and Component Objects
2. **Use data-testid**: All locators should use `data-testid` attributes
3. **Test Structure**: Follow AAA pattern (Arrange-Act-Assert)
4. **Test Independence**: Each test should be independent and parallelizable
5. **Error Handling**: Include tests for error scenarios
6. **Edge Cases**: Test boundary conditions and empty states
7. **Wait Strategies**: Use `expect().toBeVisible()` instead of timeouts
8. **Descriptive Names**: Use clear, descriptive test names

## Test Scenarios to Cover
[LIST SPECIFIC SCENARIOS]

## Expected Test IDs
[LIST EXPECTED DATA-TESTID VALUES]

## Output Format
1. Create/update Page Object classes if needed
2. Create/update Component Object classes if needed
3. Create comprehensive test spec file with:
   - Test descriptions organized by feature/action
   - All scenarios covered
   - Proper setup and teardown
   - Meaningful assertions

## Code Style
- TypeScript with strict typing
- Use async/await
- Follow existing code patterns
- Add comments for complex logic
- Use descriptive variable names

Please generate the complete test implementation following these guidelines.
```

### Example Usage

**For Onboarding Tests**:
```
Generate E2E tests for the Onboarding Flow feature.

Test Scenarios:
1. Step 1 - Welcome: Enter family name and proceed
2. Step 1 - Welcome: Validation error for empty name
3. Step 2 - Connect Calendar: Connect Google Calendar
4. Step 2 - Connect Calendar: Skip calendar connection
5. Step 3 - Add Children: Add single child
6. Step 3 - Add Children: Add multiple children
7. Step 3 - Add Children: Remove child
8. Step 4 - Invite Members: Send invitation
9. Step 4 - Invite Members: Skip invitations
10. Complete flow: Full onboarding journey

Expected Test IDs:
- onboarding-welcome-step
- onboarding-welcome-family-name-input
- onboarding-welcome-next-button
- onboarding-connect-calendar-google-button
- onboarding-add-children-add-button
- etc.
```

**For Calendar Tests**:
```
Generate E2E tests for the Calendar Views feature.

Test Scenarios:
1. View switching: Switch between Day, Week, Month, Agenda
2. Date navigation: Previous/Next/Today buttons
3. Event display: Events appear correctly in each view
4. Empty state: Empty state shown when no events
5. Member filtering: Filter by family members
6. Create event: Open create event modal from calendar

Expected Test IDs:
- calendar-view-switcher
- calendar-date-navigation
- calendar-event-card
- calendar-create-event-button
- etc.
```

---

## Next Steps

1. **Set Up Authentication**:
   - Create test Google account: `e2e-test@yourdomain.com`
   - Set environment variable: `TEST_GOOGLE_EMAIL=e2e-test@yourdomain.com`
   - Run auth setup: `npx playwright test --headed e2e/auth.setup.ts`
   - Verify `.auth/user.json` is created
   - See [Authentication Setup Guide](./e2e-authentication-setup.md) for details

2. **Add Data-TestIDs to Components**: Update all components with required test IDs
3. **Create Page Objects**: Implement Page Object classes for each major page
4. **Create Component Objects**: Implement Component Object classes for reusable components
5. **Generate Tests**: Use the prompt template to generate tests for each feature
6. **Run Tests**: Execute tests and fix any issues
7. **CI/CD Integration**: Ensure tests run in CI pipeline (include auth setup step)
8. **Maintain**: Keep tests updated as features evolve

---

## Maintenance Guidelines

### When Adding New Features
1. Add `data-testid` attributes to new components
2. Create/update Page Objects for new pages
3. Create/update Component Objects for new reusable components
4. Add E2E tests for critical user journeys
5. Update this document if needed

### When Updating Existing Features
1. Update Page Objects if UI changes
2. Update tests if behavior changes
3. Keep test IDs consistent
4. Refactor tests if patterns improve

### Test Review Checklist
- [ ] Tests use Page Object Model
- [ ] All locators use `data-testid`
- [ ] Tests are independent and parallelizable
- [ ] Error scenarios are tested
- [ ] Edge cases are covered
- [ ] Test names are descriptive
- [ ] Assertions are meaningful
- [ ] No hardcoded timeouts
- [ ] Test data is unique and isolated

---

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Test Organization](https://playwright.dev/docs/test-organization)

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Maintained By**: QA Team
