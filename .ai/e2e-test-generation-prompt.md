# E2E Test Generation Prompt Template

This document provides ready-to-use prompts for generating E2E tests using AI. Copy and customize the prompts below based on the feature you want to test.

---

## Base Prompt Template

```
You are a senior QA engineer with extensive experience in E2E testing with Playwright and Page Object Model patterns.

## Context
I'm working on a Home Planner application built with:
- Astro 5, React 19, TypeScript 5
- Playwright for E2E testing
- Page Object Model architecture
- Base URL: http://localhost:4321

## Current Test Structure
- Base Page Object: `e2e/pages/BasePage.ts` with common methods (getByTestId, clickByTestId, fillByTestId, expectVisible, expectText)
- Page Objects: `e2e/pages/*.ts` for each major page
- Component Objects: `e2e/components/*.ts` for reusable components (modals, forms, filters)
- Test Specs: `e2e/specs/*.spec.ts` for test files
- Auth Setup: `e2e/auth.setup.ts` authenticates once and saves storage state to `.auth/user.json`
- Fixtures: `e2e/fixtures/auth.ts` provides optional `authenticatedPage` fixture (for additional verification)
- Helpers: `e2e/fixtures/helpers.ts` provides helper functions

## Authentication
- **Storage State Based**: Tests use Playwright storage state (`.auth/user.json`) for authentication
- **Setup Required**: Run `e2e/auth.setup.ts` once to authenticate and save state
- **Environment Variable**: `TEST_GOOGLE_EMAIL` must be set to test Google account email
- **Session Expiration**: Supabase sessions expire after ~1 hour. Regenerate `.auth/user.json` periodically
- **In Tests**: Tests are pre-authenticated via `playwright.config.ts` which sets `storageState: ".auth/user.json"` by default
- **Recommended Approach**: Use `page` directly (already authenticated). Alternative: use `authenticatedPage` fixture from `fixtures/auth.ts` if you need additional verification

## Data-TestID Convention
- Format: `{feature}-{element}-{purpose}` (e.g., `calendar-event-card`, `event-modal-title-input`)
- Test IDs are added INSIDE components, not in parent components
- Use descriptive, hierarchical naming
- All interactive elements (buttons, inputs, forms) should have test IDs

## Task
Generate comprehensive E2E tests for: [FEATURE_NAME]

## Requirements
1. **Use Page Object Model**: Create/use appropriate Page Objects and Component Objects
2. **Use data-testid**: All locators should use `data-testid` attributes (never CSS selectors or XPath)
3. **Test Structure**: Follow AAA pattern (Arrange-Act-Assert)
4. **Test Independence**: Each test should be independent and parallelizable
5. **Authentication**: Use storage state - tests are already authenticated via `.auth/user.json` (no need to login in tests)
6. **Error Handling**: Include tests for error scenarios and validation
7. **Edge Cases**: Test boundary conditions, empty states, and edge cases
8. **Wait Strategies**: Use `expect().toBeVisible()` instead of `waitForTimeout()`
9. **Descriptive Names**: Use clear, descriptive test names following pattern: "should [expected behavior] when [condition]"
10. **TypeScript**: Use strict typing, async/await, proper imports
11. **Real APIs**: Use real Supabase API endpoints (don't mock your own APIs, only mock external services)

## Test Scenarios to Cover
[LIST SPECIFIC SCENARIOS]

## Expected Test IDs
[LIST EXPECTED DATA-TESTID VALUES]

## Output Format
1. Create/update Page Object classes if needed (extend BasePage)
2. Create/update Component Object classes if needed
3. Create comprehensive test spec file with:
   - Import from `@playwright/test` (not from fixtures/auth)
   - Use `page` directly in tests (already authenticated via storage state)
   - Test descriptions organized by feature/action using `test.describe()`
   - All scenarios covered
   - Meaningful assertions
   - Error scenario tests
   - Note: No need to login in tests - authentication is handled by auth.setup.ts and playwright.config.ts

## Example Test Structure
```typescript
import { test, expect } from "@playwright/test";
// Tests are pre-authenticated via storage state in playwright.config.ts

test.describe("Feature Name", () => {
  test("should do something", async ({ page }) => {
    // Already authenticated - no login needed
    await page.goto("/some-page");
    // Test logic...
  });
});
```

## Code Style
- TypeScript with strict typing
- Use async/await (no callbacks)
- Follow existing code patterns from the codebase
- Add comments for complex logic only
- Use descriptive variable names
- Export classes and functions properly

Please generate the complete test implementation following these guidelines.
```

---

## Feature-Specific Prompts

### 1. Authentication Flow

```
[Base Prompt]

## Task
Generate comprehensive E2E tests for: Authentication Flow

## Important Notes for Authentication Tests
- **For login/OAuth tests**: Use `test.use({ storageState: undefined })` to test unauthenticated state
- **For logout tests**: Use authenticated `page` (default) to test logout from authenticated state
- **For protected route tests**: Use `test.use({ storageState: undefined })` to verify redirects

## Test Scenarios to Cover
1. User can click "Sign in with Google" button on login page (unauthenticated)
2. User is redirected to Google OAuth after clicking sign in (unauthenticated)
3. OAuth callback successfully authenticates new user and redirects to onboarding (unauthenticated → authenticated)
4. OAuth callback successfully authenticates returning user and redirects to calendar (unauthenticated → authenticated)
5. Authentication errors are handled gracefully (show error message) (unauthenticated)
6. User can logout successfully from authenticated state (authenticated → unauthenticated)
7. Unauthenticated user accessing protected route is redirected to login (unauthenticated)

## Expected Test IDs
- login-google-signin-button
- login-error-message
- logout-button

## Files to Test
- /auth/login
- /auth/callback
- Logout functionality in navbar
```

---

### 2. Onboarding Flow

```
[Base Prompt]

## Task
Generate comprehensive E2E tests for: Onboarding Flow (Complete Journey)

## Test Scenarios to Cover

### Step 1: Welcome
1. User can enter family name and proceed to next step
2. Validation error shown when submitting empty family name
3. Validation error shown when family name is too short
4. Progress indicator shows step 1 of 4

### Step 2: Connect Calendar
5. User can connect Google Calendar (OAuth flow)
6. User can connect Microsoft 365 Calendar (OAuth flow)
7. User can skip calendar connection
8. Connected calendar is displayed after connection
9. Progress indicator shows step 2 of 4

### Step 3: Add Children
10. User can add a child with name and date of birth
11. User can add multiple children
12. User can remove a child
13. Validation error shown for invalid date of birth
14. Validation error shown for empty name
15. Progress indicator shows step 3 of 4

### Step 4: Invite Members
16. User can send invitation with valid email
17. User can send multiple invitations
18. User can skip invitations
19. Validation error shown for invalid email
20. Validation error shown for duplicate email
21. Progress indicator shows step 4 of 4

### Complete Flow
22. User can complete full onboarding journey (all steps)
23. User can navigate back to previous steps
24. Onboarding completion redirects to calendar view
25. Onboarding progress is saved and can be resumed

## Expected Test IDs
- onboarding-welcome-step
- onboarding-welcome-family-name-input
- onboarding-welcome-next-button
- onboarding-connect-calendar-step
- onboarding-connect-calendar-google-button
- onboarding-connect-calendar-microsoft-button
- onboarding-connect-calendar-skip-button
- onboarding-add-children-step
- onboarding-add-children-add-button
- onboarding-add-children-child-form
- onboarding-add-children-child-name-input
- onboarding-add-children-child-dob-input
- onboarding-add-children-child-remove-button
- onboarding-invite-members-step
- onboarding-invite-members-email-input
- onboarding-invite-members-send-button
- onboarding-invite-members-skip-button
- onboarding-progress-indicator

## Files to Test
- /onboarding/welcome
- /onboarding/connect-calendar
- /onboarding/add-children
- /onboarding/invite-members
```

---

### 3. Calendar Views

```
[Base Prompt]

## Task
Generate comprehensive E2E tests for: Calendar Views Navigation

## Test Scenarios to Cover
1. User can switch from Week view to Day view
2. User can switch from Week view to Month view
3. User can switch from Week view to Agenda view
4. User can switch back to Week view
5. User can navigate to previous date range
6. User can navigate to next date range
7. User can navigate to today's date
8. Current date indicator is visible in all views
9. Events are displayed correctly in Day view
10. Events are displayed correctly in Week view
11. Events are displayed correctly in Month view
12. Events are displayed correctly in Agenda view
13. Empty state is shown when no events exist
14. View preference persists when navigating between pages
15. Date navigation works correctly in all views

## Expected Test IDs
- calendar-view-container
- calendar-view-switcher
- calendar-view-switcher-day
- calendar-view-switcher-week
- calendar-view-switcher-month
- calendar-view-switcher-agenda
- calendar-date-navigation
- calendar-date-navigation-prev
- calendar-date-navigation-next
- calendar-date-navigation-today
- calendar-event-card
- calendar-empty-state

## Files to Test
- /calendar/day
- /calendar/week
- /calendar/month
- /calendar/agenda
```

---

### 4. Event Creation (Elastic)

```
[Base Prompt]

## Task
Generate comprehensive E2E tests for: Event Creation (Elastic Events)

## Test Scenarios to Cover
1. User can open event creation modal from calendar
2. User can fill in event title
3. User can select event date
4. User can set start time
5. User can set end time
6. User can select event type as "Elastic"
7. User can select single participant (user)
8. User can select single participant (child)
9. User can select multiple participants
10. User can deselect participant
11. User can save event successfully
12. Event appears on calendar after creation
13. Event details are correct on calendar
14. Form validation: title is required
15. Form validation: date is required
16. Form validation: start time must be before end time
17. Conflict warning is shown when event overlaps with blocker event
18. User can cancel event creation
19. Modal closes after successful creation
20. Modal closes after cancellation

## Expected Test IDs
- calendar-create-event-button
- event-modal
- event-modal-title-input
- event-modal-date-input
- event-modal-start-time-input
- event-modal-end-time-input
- event-modal-type-elastic
- event-modal-type-blocker
- event-modal-participant-selector
- event-modal-participant-{id}
- event-modal-save-button
- event-modal-cancel-button
- event-modal-conflict-warning
- event-modal-validation-error

## Files to Test
- Event creation modal component
- All calendar views
```

---

### 5. Event Creation (Blocker)

```
[Base Prompt]

## Task
Generate comprehensive E2E tests for: Event Creation (Blocker Events)

## Test Scenarios to Cover
1. User can create a Blocker event
2. Blocker event appears on calendar
3. Blocker event shows conflict warning when overlapping with another blocker
4. Blocker event prevents creation of overlapping elastic event
5. Blocker event type is saved correctly
6. Blocker events are visually distinct on calendar

## Expected Test IDs
- event-modal-type-blocker
- event-modal-conflict-warning
- calendar-event-card-blocker (for styling/visual distinction)

## Files to Test
- Event creation modal component
- Calendar views
```

---

### 6. Event Editing

```
[Base Prompt]

## Task
Generate comprehensive E2E tests for: Event Editing

## Test Scenarios to Cover
1. User can open event edit modal by clicking event card
2. User can modify event title
3. User can change event date
4. User can update start/end time
5. User can change event type (Elastic to Blocker, vice versa)
6. User can add participants
7. User can remove participants
8. User can save changes
9. Changes are reflected on calendar immediately
10. User can cancel editing (no changes saved)
11. Recurring event: User can edit single occurrence
12. Recurring event: User can edit all occurrences
13. Validation errors are shown for invalid inputs
14. Conflict warnings update when event type changes

## Expected Test IDs
- calendar-event-card (clickable)
- event-modal (edit mode)
- event-modal-title-input
- event-modal-save-button
- event-modal-cancel-button
- event-modal-recurrence-edit-single
- event-modal-recurrence-edit-all

## Files to Test
- Event edit modal component
- Calendar views
```

---

### 7. Event Deletion

```
[Base Prompt]

## Task
Generate comprehensive E2E tests for: Event Deletion

## Test Scenarios to Cover
1. User can delete a single event
2. Confirmation dialog appears before deletion
3. User can confirm deletion
4. User can cancel deletion
5. Event is removed from calendar after deletion
6. Recurring event: User can delete single occurrence
7. Recurring event: User can delete all occurrences
8. Deletion confirmation shows correct message for single event
9. Deletion confirmation shows correct message for recurring event

## Expected Test IDs
- calendar-event-card-delete-button
- event-delete-confirmation-dialog
- event-delete-confirmation-confirm-button
- event-delete-confirmation-cancel-button
- event-delete-recurrence-single
- event-delete-recurrence-all

## Files to Test
- Event deletion functionality
- Calendar views
```

---

### 8. Member Filtering

```
[Base Prompt]

## Task
Generate comprehensive E2E tests for: Calendar Member Filtering

## Test Scenarios to Cover
1. User can open member filter
2. User can select single member to filter
3. User can select multiple members to filter
4. User can deselect member
5. Calendar updates to show only selected members' events
6. "All members" option shows all events
7. Filter state persists when switching views
8. Filter state persists when navigating dates
9. Filter is cleared when "All members" is selected
10. Empty state shown when no events match filter

## Expected Test IDs
- calendar-member-filter
- calendar-member-filter-toggle
- calendar-member-filter-item
- calendar-member-filter-item-{memberId}
- calendar-member-filter-all

## Files to Test
- Member filter component
- All calendar views
```

---

### 9. Family Management - Add Children

```
[Base Prompt]

## Task
Generate comprehensive E2E tests for: Family Management - Add Children

## Test Scenarios to Cover
1. User can navigate to family children page
2. User can open "Add Child" form
3. User can add child with name and date of birth
4. User can add multiple children
5. User can edit child details
6. User can delete a child
7. Child appears in children list after creation
8. Form validation: name is required
9. Form validation: date of birth is required
10. Form validation: date of birth cannot be in future
11. Form validation: date of birth cannot be too old (e.g., > 18 years)
12. User can cancel adding child
13. Children list shows all children
14. Empty state shown when no children

## Expected Test IDs
- family-children-page
- family-children-add-button
- family-children-list
- family-children-list-item
- family-children-list-item-edit-button
- family-children-list-item-delete-button
- child-form
- child-form-name-input
- child-form-dob-input
- child-form-save-button
- child-form-cancel-button
- family-children-empty-state

## Files to Test
- /family/children
```

---

### 10. Family Management - Invitations

```
[Base Prompt]

## Task
Generate comprehensive E2E tests for: Family Management - Invitations

## Test Scenarios to Cover
1. User can navigate to family invitations page
2. User can send invitation with valid email
3. User can send multiple invitations
4. Invitation appears in pending invitations list
5. User can cancel pending invitation
6. Email validation: invalid email format shows error
7. Email validation: duplicate email shows error
8. Email validation: empty email shows error
9. Invitations list shows status (pending, accepted, expired)
10. Empty state shown when no invitations
11. User cannot cancel accepted invitation
12. User cannot cancel expired invitation

## Expected Test IDs
- family-invitations-page
- family-invitations-email-input
- family-invitations-send-button
- family-invitations-list
- family-invitations-list-item
- family-invitations-list-item-email
- family-invitations-list-item-status
- family-invitations-list-item-cancel-button
- family-invitations-empty-state
- family-invitations-validation-error

## Files to Test
- /family/invitations
```

---

### 11. External Calendar Connection

```
[Base Prompt]

## Task
Generate comprehensive E2E tests for: External Calendar Connection (Settings)

## Test Scenarios to Cover
1. User can navigate to settings calendars page
2. User can connect Google Calendar from settings
3. User can connect Microsoft 365 from settings
4. Connected calendars are displayed in list
5. User can see calendar sync status
6. User can disconnect calendar
7. Confirmation dialog appears before disconnection
8. Calendar is removed from list after disconnection
9. Empty state shown when no calendars connected
10. OAuth flow works correctly from settings page

## Expected Test IDs
- settings-calendars-page
- settings-calendars-connect-google-button
- settings-calendars-connect-microsoft-button
- settings-calendars-list
- settings-calendars-list-item
- settings-calendars-list-item-email
- settings-calendars-list-item-status
- settings-calendars-list-item-disconnect-button
- settings-calendars-empty-state
- calendar-disconnect-confirmation-dialog

## Files to Test
- /settings/calendars
```

---

### 12. Account Settings

```
[Base Prompt]

## Task
Generate comprehensive E2E tests for: Account Settings

## Test Scenarios to Cover
1. User can navigate to account settings page
2. User can view current profile information
3. User can update name
4. User can update avatar
5. User can save changes
6. Changes are reflected after save
7. User can cancel changes (no save)
8. Form validation: name is required
9. Success message shown after save
10. Error message shown if save fails

## Expected Test IDs
- settings-account-page
- settings-account-name-input
- settings-account-avatar-input
- settings-account-save-button
- settings-account-cancel-button
- settings-account-success-message
- settings-account-error-message

## Files to Test
- /settings/account
- /profile/me
```

---

## Usage Instructions

1. **Copy the base prompt template**
2. **Select the feature-specific prompt** you need
3. **Customize the scenarios** if needed for your specific requirements
4. **Add any additional context** about the feature
5. **Paste into your AI assistant** (Claude, ChatGPT, etc.)
6. **Review and refine** the generated tests
7. **Add data-testid attributes** to components if missing
8. **Run tests** and fix any issues

## Tips for Best Results

1. **Be Specific**: Include exact test IDs and component names
2. **Provide Context**: Mention any special requirements or edge cases
3. **Review Generated Code**: Always review and adjust generated tests
4. **Test Incrementally**: Generate tests for one feature at a time
5. **Update Prompt**: Refine prompts based on what works best

---

**Last Updated**: 2024
