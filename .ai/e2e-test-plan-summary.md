# E2E Test Plan - Quick Reference

## 📋 Overview

This document provides a quick reference for the E2E test strategy. For detailed information, see:
- **[Comprehensive Test Plan](./e2e-test-plan-comprehensive.md)** - Full test plan with architecture, use cases, and guidelines
- **[Test Generation Prompts](./e2e-test-generation-prompt.md)** - Ready-to-use prompts for generating tests

---

## 🎯 Critical Use Cases (Priority Order)

### Priority 1: Must Have E2E Tests 🔴

1. **Authentication Flow** - Sign in, OAuth callback, logout
2. **Onboarding Flow** - Complete 4-step wizard journey
3. **Calendar View Navigation** - Switch between Day/Week/Month/Agenda
4. **Event Creation (Elastic)** - Create flexible events
5. **Event Creation (Blocker)** - Create fixed events
6. **Event Editing** - Modify existing events
7. **Event Deletion** - Delete single/recurring events
8. **Member Filtering** - Filter calendar by family members

### Priority 2: Should Have E2E Tests 🟡

9. **Add Children** - Family management
10. **Invite Family Members** - Send/cancel invitations
11. **View Family Members** - List family members

### Priority 3: Nice to Have E2E Tests 🟢

12. **External Calendar Connection** - Connect/disconnect calendars
13. **Account Settings** - Update profile
14. **Preferences** - Configure app preferences

---

## 🏗️ Architecture

### Page Object Model Structure

```
e2e/
├── pages/          # Page Object classes
├── components/     # Component Object classes (modals, forms)
├── fixtures/       # Authentication and helpers
├── utils/          # Test utilities
└── specs/          # Test specifications
```

### Key Principles

1. **Page Object Model**: Each page has a corresponding Page Object class
2. **Component Objects**: Reusable components have their own objects
3. **Data-TestID**: All locators use `data-testid` attributes
4. **Test Independence**: Tests can run in parallel
5. **Storage State Auth**: Use Playwright storage state (`.auth/user.json`) for real Supabase authentication
6. **Auth Setup**: Run `e2e/auth.setup.ts` once to authenticate and save state

---

## 🏷️ Data-TestID Strategy

### Naming Convention
- Format: `{feature}-{element}-{purpose}`
- Examples: `calendar-event-card`, `event-modal-title-input`

### ⚠️ Critical Rule
**Add test IDs INSIDE components, not in parent components**

✅ **Good**:
```tsx
// Inside component
<button data-testid="login-google-signin-button">Sign in</button>
```

❌ **Bad**:
```tsx
// In parent component
<GoogleSignInButton data-testid="login-button" />
```

### Required Test IDs by Feature

| Feature | Key Test IDs |
|---------|-------------|
| **Authentication** | `login-google-signin-button`, `logout-button` |
| **Onboarding** | `onboarding-welcome-*`, `onboarding-connect-calendar-*`, `onboarding-add-children-*`, `onboarding-invite-members-*` |
| **Calendar** | `calendar-view-switcher-*`, `calendar-date-navigation-*`, `calendar-event-card`, `calendar-create-event-button` |
| **Event Modal** | `event-modal-*`, `event-modal-title-input`, `event-modal-save-button` |
| **Family** | `family-children-*`, `family-invitations-*`, `family-members-*` |
| **Settings** | `settings-calendars-*`, `settings-account-*` |

---

## 📝 Test Generation

### Quick Start

1. **Open**: [Test Generation Prompts](./e2e-test-generation-prompt.md)
2. **Copy**: Feature-specific prompt
3. **Customize**: Add your specific scenarios
4. **Generate**: Use with AI assistant
5. **Review**: Check generated tests
6. **Implement**: Add missing test IDs to components

### Example Prompt Usage

```
Generate E2E tests for: Onboarding Flow

Test Scenarios:
- Step 1: Enter family name
- Step 2: Connect calendar (or skip)
- Step 3: Add children
- Step 4: Invite members (or skip)
- Complete flow

Expected Test IDs:
- onboarding-welcome-family-name-input
- onboarding-connect-calendar-google-button
- etc.
```

---

## ✅ Implementation Checklist

### Phase 1: Foundation
- [ ] Add data-testid to all critical components
- [ ] Create BasePage class
- [ ] Create Page Object classes for main pages
- [ ] Create Component Object classes for modals/forms

### Phase 2: Critical Tests
- [ ] Authentication flow tests
- [ ] Onboarding flow tests
- [ ] Calendar view navigation tests
- [ ] Event creation tests (Elastic)
- [ ] Event creation tests (Blocker)
- [ ] Event editing tests
- [ ] Event deletion tests
- [ ] Member filtering tests

### Phase 3: Additional Tests
- [ ] Family management tests
- [ ] Settings tests
- [ ] Error handling tests
- [ ] Responsive design tests

### Phase 4: Maintenance
- [ ] CI/CD integration
- [ ] Test documentation
- [ ] Maintenance guidelines

---

## 🔧 Best Practices

### Test Structure
```typescript
import { test } from "@playwright/test";
// Tests are pre-authenticated via storage state in playwright.config.ts

test.describe("Feature Name", () => {
  test.describe("User Action", () => {
    test("should [expected behavior] when [condition]", async ({ page }) => {
      // Arrange
      const featurePage = new FeaturePage(page);
      
      // Act - No need to login, already authenticated
      await featurePage.goto();
      await featurePage.performAction();
      
      // Assert
      await featurePage.expectResult();
    });
  });
});
```

### Wait Strategies
- ✅ Use `expect().toBeVisible()`
- ❌ Avoid `waitForTimeout()`
- ✅ Wait for network requests when needed

### Locator Strategy
- ✅ **Primary**: `data-testid` attributes
- ✅ **Fallback**: Text content for user-facing elements
- ❌ **Avoid**: CSS selectors, XPath

### Test Independence
- ✅ Each test is independent
- ✅ Use fixtures for setup
- ✅ Clean up test data
- ✅ Tests can run in parallel

---

## 📚 Resources

- **Comprehensive Plan**: [e2e-test-plan-comprehensive.md](./e2e-test-plan-comprehensive.md)
- **Test Prompts**: [e2e-test-generation-prompt.md](./e2e-test-generation-prompt.md)
- **Playwright Docs**: https://playwright.dev
- **POM Pattern**: https://playwright.dev/docs/pom

---

## 🚀 Next Steps

1. **Set up authentication**:
   - Create test Google account: `e2e-test@yourdomain.com`
   - Set environment variable: `TEST_GOOGLE_EMAIL=e2e-test@yourdomain.com`
   - Run auth setup: `npx playwright test --headed e2e/auth.setup.ts`
   - Verify `.auth/user.json` is created

2. **Review** the comprehensive test plan
3. **Add data-testid** attributes to components
4. **Create Page Objects** for main pages
5. **Generate tests** using prompts
6. **Run tests** and iterate
7. **Integrate** into CI/CD pipeline (include auth setup step)

---

**Last Updated**: 2024
