# UI Unit Test Plan - Home Planner Application

## 1. Introduction and Testing Objectives

### 1.1 Purpose
This test plan outlines the comprehensive UI unit testing strategy for the Home Planner application's frontend components. The plan focuses on testing React components, hooks, user interactions, accessibility, and user experience patterns in isolation.

### 1.2 Scope
This test plan covers:
- All React components (presentation and container components)
- Custom React hooks
- Form validation and user input handling
- Component interactions and state management
- Accessibility compliance (WCAG 2.1 AA)
- User experience patterns
- Error handling and edge cases in UI
- Responsive design behavior
- Theme and styling consistency

### 1.3 Testing Objectives
1. **Component Correctness**: Verify components render correctly and handle props/state properly
2. **User Interactions**: Validate all user interactions (clicks, inputs, navigation) work as expected
3. **Accessibility**: Ensure components meet WCAG 2.1 AA standards
4. **Form Validation**: Verify client-side validation works correctly
5. **Error Handling**: Test error states and user feedback
6. **Responsive Design**: Validate components adapt to different screen sizes
7. **Performance**: Ensure components render efficiently
8. **Maintainability**: Create reusable, maintainable test patterns

### 1.4 Document Control
- **Version**: 1.0
- **Date**: 2025-01-XX
- **Author**: QA Team
- **Review Status**: Draft

## 2. Test Scope

### 2.1 In-Scope Testing

#### **Component Testing**
- All React components in `src/components/`
- Shadcn/ui base components (`src/components/ui/`)
- Custom business components (auth, calendar, family, onboarding, profile, settings)
- Layout components (Navbar, Layout wrappers)
- Marketing components

#### **Hook Testing**
- Custom hooks in `src/hooks/`
- Context providers and consumers
- State management hooks
- API integration hooks

#### **Form Testing**
- Form validation logic
- Form submission handling
- Error message display
- Field-level validation
- Multi-step form navigation

#### **Accessibility Testing**
- ARIA attributes
- Keyboard navigation
- Screen reader compatibility
- Focus management
- Color contrast
- Semantic HTML

#### **User Experience Testing**
- Loading states
- Error states
- Empty states
- Success feedback
- Transition animations
- Modal/dialog interactions

### 2.2 Out-of-Scope Testing
- E2E user flows (covered by Playwright tests)
- API integration (covered by integration tests)
- Backend logic (covered by service unit tests)
- Visual regression testing (separate tooling)
- Cross-browser rendering (covered by E2E tests)
- Performance profiling (separate performance tests)

### 2.3 Test Environment Requirements
- **Test Runner**: Vitest with jsdom environment
- **Testing Library**: React Testing Library
- **Mocking**: Vitest mocks for hooks and context
- **Accessibility**: @testing-library/jest-dom matchers
- **Coverage**: @vitest/coverage-v8

## 3. Testing Strategy

### 3.1 Component Testing Approach

#### **Testing Philosophy**
- **Test behavior, not implementation**: Focus on what users see and interact with
- **Test in isolation**: Mock dependencies and context providers
- **Test accessibility**: Ensure components are usable by all users
- **Test edge cases**: Empty states, error states, loading states
- **Maintain test maintainability**: Use reusable test utilities and patterns

#### **Component Categories**

**1. Presentational Components** (`src/components/ui/`)
- **Focus**: Rendering, props, accessibility
- **Testing**: Visual output, ARIA attributes, className application
- **Examples**: Button, Card, Input, Alert, Dialog

**2. Business Components** (`src/components/{auth,calendar,family,onboarding,profile,settings}/`)
- **Focus**: User interactions, form handling, state management
- **Testing**: User events, form validation, API calls (mocked)
- **Examples**: EventCreateModal, AddChildForm, OnboardingWizard

**3. Container Components** (Wrappers with data fetching)
- **Focus**: Data loading, error handling, context integration
- **Testing**: Loading states, error states, data rendering
- **Examples**: CalendarView, ProfileViewWrapper, FamilyOverviewWrapper

**4. Layout Components** (`src/components/layout/`)
- **Focus**: Navigation, responsive behavior, conditional rendering
- **Testing**: Navigation links, mobile menu, user state display
- **Examples**: Navbar

### 3.2 Hook Testing Approach

#### **Custom Hooks Categories**

**1. API Hooks** (`use*Api.ts`)
- **Focus**: API calls, error handling, loading states
- **Testing**: Mock API calls, test success/error paths, loading states
- **Examples**: useFamilyApi, useCalendarApi, useChildApi

**2. Data Hooks** (`use*Data.ts`)
- **Focus**: Data transformation, caching, state management
- **Testing**: Data transformations, cache behavior, state updates
- **Examples**: useFamilyData, useCalendarEvents

**3. Context Hooks** (`use*Context.ts`)
- **Focus**: Context consumption, state updates
- **Testing**: Context value access, state mutations
- **Examples**: useAuth, useOnboarding

**4. Form Hooks** (`use*Form.ts`)
- **Focus**: Form state, validation, submission
- **Testing**: Form state management, validation rules, submission handling
- **Examples**: useUpdateProfile

### 3.3 Test Organization Patterns

#### **File Structure**
```
src/
  components/
    auth/
      GoogleSignInButton.tsx
      GoogleSignInButton.test.tsx  # Co-located tests
    calendar/
      EventCreateModal.tsx
      EventCreateModal.test.tsx
  hooks/
    useFamilyApi.ts
    useFamilyApi.test.ts
  test/
    utils/
      render.tsx              # Custom render with providers
      test-utils.tsx          # Component test utilities
      mock-data.ts            # Mock data factories
      accessibility.ts        # Accessibility test helpers
```

#### **Test File Naming**
- Component tests: `ComponentName.test.tsx`
- Hook tests: `useHookName.test.ts`
- Utility tests: `utilityName.test.ts`

## 4. Component Test Scenarios

### 4.1 Authentication Components

#### **TC-UI-AUTH-001: GoogleSignInButton**
- **Component**: `GoogleSignInButton.tsx`
- **Test Cases**:
  - ✅ Renders button with correct text
  - ✅ Calls signIn function on click
  - ✅ Shows loading state during authentication
  - ✅ Displays error message on failure
  - ✅ Has proper ARIA labels
  - ✅ Keyboard accessible (Enter/Space)
  - ✅ Focus visible on keyboard navigation
- **Priority**: P0
- **Dependencies**: Mock `useAuth` hook

#### **TC-UI-AUTH-002: LoginView**
- **Component**: `LoginView.tsx`
- **Test Cases**:
  - ✅ Renders login form
  - ✅ Displays branding
  - ✅ Shows legal links
  - ✅ Handles authentication success
  - ✅ Handles authentication error
  - ✅ Accessible form structure
  - ✅ Mobile responsive layout
- **Priority**: P0
- **Dependencies**: Mock `AuthContext`

#### **TC-UI-AUTH-003: AuthErrorDisplay**
- **Component**: `AuthErrorDisplay.tsx`
- **Test Cases**:
  - ✅ Renders error message when error exists
  - ✅ Does not render when no error
  - ✅ Displays error message correctly
  - ✅ Has proper ARIA role="alert"
  - ✅ Error message is accessible
- **Priority**: P0

#### **TC-UI-AUTH-004: LogoutButton**
- **Component**: `LogoutButton.tsx`
- **Test Cases**:
  - ✅ Renders logout button
  - ✅ Calls logout function on click
  - ✅ Shows confirmation dialog (if implemented)
  - ✅ Keyboard accessible
  - ✅ Proper ARIA labels
- **Priority**: P0

### 4.2 Calendar Components

#### **TC-UI-CAL-001: CalendarView**
- **Component**: `CalendarView.tsx`
- **Test Cases**:
  - ✅ Renders default view (day/week/month/agenda)
  - ✅ Switches between views
  - ✅ Displays events correctly
  - ✅ Handles empty state (no events)
  - ✅ Handles loading state
  - ✅ Handles error state
  - ✅ Renders CalendarHeader
  - ✅ Renders ViewSwitcher
  - ✅ Renders FloatingActionButton
  - ✅ Mobile responsive
- **Priority**: P0
- **Dependencies**: Mock `useCalendarEvents`, `useFamilyData`

#### **TC-UI-CAL-002: EventCreateModal**
- **Component**: `EventCreateModal.tsx`
- **Test Cases**:
  - ✅ Opens/closes modal correctly
  - ✅ Renders form fields (title, date, time, participants, type)
  - ✅ Validates required fields
  - ✅ Validates date/time format
  - ✅ Validates end time after start time
  - ✅ Handles form submission
  - ✅ Shows loading state during submission
  - ✅ Displays error messages
  - ✅ Displays success message
  - ✅ Closes modal on success
  - ✅ Resets form on close
  - ✅ Keyboard accessible (ESC to close, Tab navigation)
  - ✅ Focus trap in modal
  - ✅ ARIA labels and roles
- **Priority**: P0
- **Dependencies**: Mock `useCalendarApi`, `useFamilyData`

#### **TC-UI-CAL-003: EventEditModal**
- **Component**: `EventEditModal.tsx`
- **Test Cases**:
  - ✅ Pre-fills form with event data
  - ✅ Updates event on submission
  - ✅ Handles recurring event options (this/future/all)
  - ✅ Validates form inputs
  - ✅ Shows conflict warnings
  - ✅ Handles delete action
  - ✅ Confirms delete action
  - ✅ All EventCreateModal test cases
- **Priority**: P0

#### **TC-UI-CAL-004: RecurrenceEditor**
- **Component**: `RecurrenceEditor.tsx`
- **Test Cases**:
  - ✅ Renders recurrence options (daily/weekly/monthly)
  - ✅ Updates recurrence pattern
  - ✅ Sets end date
  - ✅ Validates end date after start date
  - ✅ Shows/hides based on "recurring" toggle
  - ✅ Form validation
  - ✅ Accessible form controls
- **Priority**: P0

#### **TC-UI-CAL-005: ConflictWarning**
- **Component**: `ConflictWarning.tsx`
- **Test Cases**:
  - ✅ Renders when conflicts exist
  - ✅ Does not render when no conflicts
  - ✅ Displays conflict details
  - ✅ Lists conflicting events
  - ✅ Shows participant names
  - ✅ ARIA role="alert"
  - ✅ Accessible warning message
- **Priority**: P0

#### **TC-UI-CAL-006: ParticipantSelector**
- **Component**: `ParticipantSelector.tsx`
- **Test Cases**:
  - ✅ Renders available participants (users and children)
  - ✅ Allows multi-select
  - ✅ Shows selected participants
  - ✅ Removes selected participants
  - ✅ Filters/search participants
  - ✅ Handles empty state
  - ✅ Keyboard navigation
  - ✅ ARIA multi-select pattern
- **Priority**: P0
- **Dependencies**: Mock `useFamilyData`

#### **TC-UI-CAL-007: MemberFilter**
- **Component**: `MemberFilter.tsx`
- **Test Cases**:
  - ✅ Renders filter options
  - ✅ Filters events by participant
  - ✅ Shows "All" option
  - ✅ Updates calendar view on filter change
  - ✅ Maintains filter state
  - ✅ Keyboard accessible
- **Priority**: P0

#### **TC-UI-CAL-008: ViewSwitcher**
- **Component**: `ViewSwitcher.tsx`
- **Test Cases**:
  - ✅ Renders all view options (day/week/month/agenda)
  - ✅ Highlights active view
  - ✅ Switches view on click
  - ✅ Keyboard navigation
  - ✅ ARIA tabs pattern
  - ✅ Mobile responsive (dropdown vs buttons)
- **Priority**: P0

#### **TC-UI-CAL-009: DateNavigation**
- **Component**: `DateNavigation.tsx`
- **Test Cases**:
  - ✅ Displays current date range
  - ✅ Navigates to previous period
  - ✅ Navigates to next period
  - ✅ Jumps to today
  - ✅ Updates date display correctly
  - ✅ Keyboard shortcuts (if implemented)
  - ✅ Accessible buttons
- **Priority**: P0

#### **TC-UI-CAL-010: DayView**
- **Component**: `DayView.tsx`
- **Test Cases**:
  - ✅ Renders day timeline
  - ✅ Displays events at correct times
  - ✅ Handles overlapping events
  - ✅ Handles all-day events
  - ✅ Click event to open details
  - ✅ Empty state
  - ✅ Loading state
  - ✅ Responsive layout
- **Priority**: P0

#### **TC-UI-CAL-011: WeekView**
- **Component**: `WeekView.tsx`
- **Test Cases**:
  - ✅ Renders week grid
  - ✅ Displays events in correct days
  - ✅ Handles multi-day events
  - ✅ Click event to open details
  - ✅ Empty state
  - ✅ Loading state
  - ✅ Responsive layout
- **Priority**: P0

#### **TC-UI-CAL-012: MonthView**
- **Component**: `MonthView.tsx`
- **Test Cases**:
  - ✅ Renders month grid
  - ✅ Displays event indicators
  - ✅ Shows event count per day
  - ✅ Click day to navigate
  - ✅ Click event to open details
  - ✅ Empty state
  - ✅ Loading state
  - ✅ Responsive layout
- **Priority**: P0

#### **TC-UI-CAL-013: AgendaView**
- **Component**: `AgendaView.tsx`
- **Test Cases**:
  - ✅ Renders chronological list
  - ✅ Groups events by date
  - ✅ Displays event details
  - ✅ Click event to open details
  - ✅ Empty state
  - ✅ Loading state
  - ✅ Responsive layout
- **Priority**: P0

#### **TC-UI-CAL-014: EventCard**
- **Component**: `EventCard.tsx`
- **Test Cases**:
  - ✅ Displays event title
  - ✅ Displays event time
  - ✅ Displays participants
  - ✅ Shows event type indicator (elastic/blocker)
  - ✅ Shows conflict indicator
  - ✅ Click to open edit modal
  - ✅ Keyboard accessible
  - ✅ Responsive layout
- **Priority**: P1

#### **TC-UI-CAL-015: FloatingActionButton**
- **Component**: `FloatingActionButton.tsx`
- **Test Cases**:
  - ✅ Renders floating button
  - ✅ Opens create modal on click
  - ✅ Positioned correctly
  - ✅ Keyboard accessible
  - ✅ ARIA label
  - ✅ Mobile responsive
- **Priority**: P0

### 4.3 Family Components

#### **TC-UI-FAM-001: FamilyOverview**
- **Component**: `FamilyOverview.tsx`
- **Test Cases**:
  - ✅ Displays family name
  - ✅ Shows member count
  - ✅ Shows children count
  - ✅ Shows event count
  - ✅ Handles loading state
  - ✅ Handles error state
  - ✅ Empty state (new family)
  - ✅ Responsive layout
- **Priority**: P0
- **Dependencies**: Mock `useFamilyData`

#### **TC-UI-FAM-002: AddChildForm**
- **Component**: `AddChildForm.tsx`
- **Test Cases**:
  - ✅ Opens/closes modal correctly
  - ✅ Renders form fields
  - ✅ Validates required fields (name)
  - ✅ Validates name length
  - ✅ Handles form submission
  - ✅ Shows loading state
  - ✅ Displays error messages
  - ✅ Displays success message
  - ✅ Closes modal on success
  - ✅ Resets form on close
  - ✅ Pre-fills form when editing
  - ✅ Updates child on edit
  - ✅ Keyboard accessible
  - ✅ Focus trap in modal
- **Priority**: P0
- **Dependencies**: Mock `useChildApi`

#### **TC-UI-FAM-003: ChildrenList**
- **Component**: `ChildrenList.tsx`
- **Test Cases**:
  - ✅ Renders list of children
  - ✅ Displays child names
  - ✅ Handles empty state
  - ✅ Handles loading state
  - ✅ Handles error state
  - ✅ Opens edit modal on child click
  - ✅ Keyboard navigation
  - ✅ Responsive layout
- **Priority**: P0

#### **TC-UI-FAM-004: ChildCard**
- **Component**: `ChildCard.tsx`
- **Test Cases**:
  - ✅ Displays child name
  - ✅ Shows edit button
  - ✅ Opens edit modal
  - ✅ Keyboard accessible
  - ✅ Responsive layout
- **Priority**: P1

#### **TC-UI-FAM-005: InviteMemberForm**
- **Component**: `InviteMemberForm.tsx`
- **Test Cases**:
  - ✅ Opens/closes modal correctly
  - ✅ Renders email input
  - ✅ Validates email format
  - ✅ Validates required field
  - ✅ Handles form submission
  - ✅ Shows loading state
  - ✅ Displays error messages
  - ✅ Displays success message
  - ✅ Closes modal on success
  - ✅ Resets form on close
  - ✅ Keyboard accessible
  - ✅ Focus trap in modal
- **Priority**: P0
- **Dependencies**: Mock `useInvitationApi`

#### **TC-UI-FAM-006: InvitationsList**
- **Component**: `InvitationsList.tsx`
- **Test Cases**:
  - ✅ Renders list of invitations
  - ✅ Displays invitation details (email, status, date)
  - ✅ Handles empty state
  - ✅ Handles loading state
  - ✅ Handles error state
  - ✅ Shows pending invitations
  - ✅ Shows accepted/rejected invitations
  - ✅ Keyboard navigation
  - ✅ Responsive layout
- **Priority**: P0

#### **TC-UI-FAM-007: InvitationCard**
- **Component**: `InvitationCard.tsx`
- **Test Cases**:
  - ✅ Displays invitation email
  - ✅ Displays invitation status
  - ✅ Displays invitation date
  - ✅ Shows cancel button for pending
  - ✅ Handles cancel action
  - ✅ Keyboard accessible
  - ✅ Responsive layout
- **Priority**: P1

#### **TC-UI-FAM-008: MembersList**
- **Component**: `MembersList.tsx`
- **Test Cases**:
  - ✅ Renders list of members
  - ✅ Displays member names and roles
  - ✅ Shows admin badge
  - ✅ Handles empty state
  - ✅ Handles loading state
  - ✅ Handles error state
  - ✅ Keyboard navigation
  - ✅ Responsive layout
- **Priority**: P0

#### **TC-UI-FAM-009: MemberCard**
- **Component**: `MemberCard.tsx`
- **Test Cases**:
  - ✅ Displays member name
  - ✅ Displays member role
  - ✅ Shows role change option (admin only)
  - ✅ Handles role change
  - ✅ Keyboard accessible
  - ✅ Responsive layout
- **Priority**: P1

### 4.4 Onboarding Components

#### **TC-UI-ONB-001: OnboardingWizard**
- **Component**: `OnboardingWizard.tsx`
- **Test Cases**:
  - ✅ Renders wizard container
  - ✅ Displays step indicator
  - ✅ Shows current step
  - ✅ Handles next button click
  - ✅ Handles previous button click
  - ✅ Handles skip button click
  - ✅ Disables next button when appropriate
  - ✅ Shows loading state on next
  - ✅ Handles completion
  - ✅ Keyboard navigation
  - ✅ ARIA wizard pattern
  - ✅ Mobile responsive
- **Priority**: P0
- **Dependencies**: Mock `useOnboarding` context

#### **TC-UI-ONB-002: WelcomeStep**
- **Component**: `WelcomeStep.tsx`
- **Test Cases**:
  - ✅ Renders welcome form
  - ✅ Renders family name input
  - ✅ Validates required field
  - ✅ Validates name length
  - ✅ Handles form submission
  - ✅ Shows loading state
  - ✅ Displays error messages
  - ✅ Creates family on submit
  - ✅ Advances to next step on success
  - ✅ Keyboard accessible
  - ✅ Responsive layout
- **Priority**: P0
- **Dependencies**: Mock `useOnboarding`, `useFamilyApi`

#### **TC-UI-ONB-003: ConnectCalendarStep**
- **Component**: `ConnectCalendarStep.tsx`
- **Test Cases**:
  - ✅ Renders calendar connection options
  - ✅ Shows Google Calendar option
  - ✅ Shows Microsoft 365 option
  - ✅ Handles skip action
  - ✅ Initiates OAuth flow
  - ✅ Shows connection status
  - ✅ Keyboard accessible
  - ✅ Responsive layout
- **Priority**: P0
- **Dependencies**: Mock `useExternalCalendars`

#### **TC-UI-ONB-004: AddChildrenStep**
- **Component**: `AddChildrenStep.tsx`
- **Test Cases**:
  - ✅ Renders children form
  - ✅ Allows adding multiple children
  - ✅ Shows list of added children
  - ✅ Allows removing children
  - ✅ Validates child names
  - ✅ Handles skip action
  - ✅ Keyboard accessible
  - ✅ Responsive layout
- **Priority**: P0
- **Dependencies**: Mock `useOnboarding`, `useChildApi`

#### **TC-UI-ONB-005: InviteMembersStep**
- **Component**: `InviteMembersStep.tsx`
- **Test Cases**:
  - ✅ Renders invitation form
  - ✅ Allows adding multiple invitations
  - ✅ Shows list of invitations
  - ✅ Validates email addresses
  - ✅ Handles skip action
  - ✅ Keyboard accessible
  - ✅ Responsive layout
- **Priority**: P0
- **Dependencies**: Mock `useOnboarding`, `useInvitationApi`

#### **TC-UI-ONB-006: ChildForm**
- **Component**: `ChildForm.tsx`
- **Test Cases**:
  - ✅ Renders child name input
  - ✅ Validates required field
  - ✅ Handles form submission
  - ✅ Shows loading state
  - ✅ Displays error messages
  - ✅ Adds child on submit
  - ✅ Closes modal on success
  - ✅ Keyboard accessible
- **Priority**: P0

### 4.5 Profile Components

#### **TC-UI-PROF-001: ProfileView**
- **Component**: `ProfileView.tsx`
- **Test Cases**:
  - ✅ Displays user information
  - ✅ Shows profile avatar
  - ✅ Shows user name and email
  - ✅ Shows family memberships
  - ✅ Handles loading state
  - ✅ Handles error state
  - ✅ Responsive layout
- **Priority**: P0
- **Dependencies**: Mock `useUserProfile`

#### **TC-UI-PROF-002: EditProfileForm**
- **Component**: `EditProfileForm.tsx`
- **Test Cases**:
  - ✅ Opens/closes modal correctly
  - ✅ Pre-fills form with user data
  - ✅ Renders form fields
  - ✅ Validates form inputs
  - ✅ Handles form submission
  - ✅ Shows loading state
  - ✅ Displays error messages
  - ✅ Displays success message
  - ✅ Updates profile on submit
  - ✅ Closes modal on success
  - ✅ Keyboard accessible
  - ✅ Focus trap in modal
- **Priority**: P0
- **Dependencies**: Mock `useUpdateProfile`

#### **TC-UI-PROF-003: ProfileAvatar**
- **Component**: `ProfileAvatar.tsx`
- **Test Cases**:
  - ✅ Displays user avatar
  - ✅ Shows fallback initials
  - ✅ Handles image load error
  - ✅ Accessible (alt text)
  - ✅ Responsive sizing
- **Priority**: P1

#### **TC-UI-PROF-004: FamilyMemberships**
- **Component**: `FamilyMemberships.tsx`
- **Test Cases**:
  - ✅ Renders list of families
  - ✅ Displays family names
  - ✅ Shows role badges
  - ✅ Handles empty state
  - ✅ Handles loading state
  - ✅ Keyboard navigation
  - ✅ Responsive layout
- **Priority**: P0

### 4.6 Settings Components

#### **TC-UI-SET-001: ExternalCalendarSettings**
- **Component**: `ExternalCalendarSettings.tsx`
- **Test Cases**:
  - ✅ Renders connected calendars list
  - ✅ Shows calendar connection status
  - ✅ Shows sync status
  - ✅ Handles connect action
  - ✅ Handles disconnect action
  - ✅ Handles manual sync
  - ✅ Shows sync errors
  - ✅ Handles empty state
  - ✅ Keyboard accessible
  - ✅ Responsive layout
- **Priority**: P0
- **Dependencies**: Mock `useExternalCalendars`

### 4.7 Layout Components

#### **TC-UI-LAY-001: Navbar**
- **Component**: `Navbar.tsx`
- **Test Cases**:
  - ✅ Renders navigation links
  - ✅ Highlights active route
  - ✅ Shows user menu
  - ✅ Opens/closes mobile menu
  - ✅ Handles logout
  - ✅ Keyboard navigation
  - ✅ ARIA navigation pattern
  - ✅ Mobile responsive
  - ✅ Focus management
- **Priority**: P0
- **Dependencies**: Mock `useAuth`, router

### 4.8 UI Base Components (Shadcn/ui)

#### **TC-UI-BASE-001: Button**
- **Component**: `src/components/ui/button.tsx`
- **Test Cases**:
  - ✅ Renders with correct variant
  - ✅ Handles click events
  - ✅ Disables correctly
  - ✅ Shows loading state
  - ✅ Keyboard accessible
  - ✅ ARIA attributes
  - ✅ Focus visible
- **Priority**: P1

#### **TC-UI-BASE-002: Input**
- **Component**: `src/components/ui/input.tsx`
- **Test Cases**:
  - ✅ Renders input field
  - ✅ Handles value changes
  - ✅ Shows placeholder
  - ✅ Handles disabled state
  - ✅ Shows error state
  - ✅ Keyboard accessible
  - ✅ ARIA attributes
  - ✅ Focus visible
- **Priority**: P1

#### **TC-UI-BASE-003: Dialog/Modal**
- **Component**: `src/components/ui/dialog.tsx`
- **Test Cases**:
  - ✅ Opens/closes correctly
  - ✅ Focus trap when open
  - ✅ Returns focus on close
  - ✅ ESC key closes modal
  - ✅ Backdrop click closes (if configured)
  - ✅ ARIA modal pattern
  - ✅ Prevents body scroll
- **Priority**: P0

#### **TC-UI-BASE-004: Form Components**
- **Components**: `form.tsx`, `label.tsx`, `select.tsx`, `textarea.tsx`
- **Test Cases**:
  - ✅ Form field rendering
  - ✅ Label association
  - ✅ Error message display
  - ✅ Validation feedback
  - ✅ Keyboard navigation
  - ✅ ARIA attributes
- **Priority**: P1

#### **TC-UI-BASE-005: Alert**
- **Component**: `src/components/ui/alert.tsx`
- **Test Cases**:
  - ✅ Renders alert message
  - ✅ Shows correct variant (error/warning/success/info)
  - ✅ ARIA role="alert"
  - ✅ Accessible to screen readers
  - ✅ Dismissible (if configured)
- **Priority**: P1

## 5. Hook Test Scenarios

### 5.1 API Hooks

#### **TC-UI-HOOK-001: useFamilyApi**
- **Hook**: `useFamilyApi.ts`
- **Test Cases**:
  - ✅ Returns createFamily function
  - ✅ Returns updateFamily function
  - ✅ Returns deleteFamily function
  - ✅ Manages loading state
  - ✅ Manages error state
  - ✅ Handles successful API calls
  - ✅ Handles API errors
  - ✅ Clears errors appropriately
- **Priority**: P0
- **Dependencies**: Mock API calls

#### **TC-UI-HOOK-002: useCalendarApi**
- **Hook**: `useCalendarApi.ts`
- **Test Cases**:
  - ✅ Returns createEvent function
  - ✅ Returns updateEvent function
  - ✅ Returns deleteEvent function
  - ✅ Manages loading state
  - ✅ Manages error state
  - ✅ Handles successful API calls
  - ✅ Handles API errors
  - ✅ Handles conflict detection
- **Priority**: P0

#### **TC-UI-HOOK-003: useChildApi**
- **Hook**: `useChildApi.ts`
- **Test Cases**:
  - ✅ Returns createChild function
  - ✅ Returns updateChild function
  - ✅ Returns deleteChild function
  - ✅ Manages loading state
  - ✅ Manages error state
  - ✅ Handles successful API calls
  - ✅ Handles API errors
- **Priority**: P0

#### **TC-UI-HOOK-004: useInvitationApi**
- **Hook**: `useInvitationApi.ts`
- **Test Cases**:
  - ✅ Returns createInvitation function
  - ✅ Returns acceptInvitation function
  - ✅ Returns rejectInvitation function
  - ✅ Returns cancelInvitation function
  - ✅ Manages loading state
  - ✅ Manages error state
  - ✅ Handles successful API calls
  - ✅ Handles API errors
- **Priority**: P0

#### **TC-UI-HOOK-005: useExternalCalendars**
- **Hook**: `useExternalCalendars.ts`
- **Test Cases**:
  - ✅ Returns connectCalendar function
  - ✅ Returns disconnectCalendar function
  - ✅ Returns syncCalendar function
  - ✅ Manages loading state
  - ✅ Manages error state
  - ✅ Handles OAuth flow
  - ✅ Handles sync status
- **Priority**: P0

### 5.2 Data Hooks

#### **TC-UI-HOOK-006: useFamilyData**
- **Hook**: `useFamilyData.ts`
- **Test Cases**:
  - ✅ Fetches family data
  - ✅ Returns family object
  - ✅ Returns loading state
  - ✅ Returns error state
  - ✅ Refetches on familyId change
  - ✅ Caches data appropriately
- **Priority**: P0

#### **TC-UI-HOOK-007: useCalendarEvents**
- **Hook**: `useCalendarEvents.ts`
- **Test Cases**:
  - ✅ Fetches events for date range
  - ✅ Returns events array
  - ✅ Returns loading state
  - ✅ Returns error state
  - ✅ Filters events by participant
  - ✅ Refetches on date range change
  - ✅ Refetches on filter change
- **Priority**: P0

### 5.3 Context Hooks

#### **TC-UI-HOOK-008: useAuth**
- **Hook**: `useAuth.ts`
- **Test Cases**:
  - ✅ Returns user object when authenticated
  - ✅ Returns null when not authenticated
  - ✅ Returns loading state
  - ✅ Returns signIn function
  - ✅ Returns signOut function
  - ✅ Updates on auth state change
- **Priority**: P0
- **Dependencies**: Mock `AuthContext`

#### **TC-UI-HOOK-009: useOnboarding**
- **Hook**: `useOnboarding.ts`
- **Test Cases**:
  - ✅ Returns current step
  - ✅ Returns onboarding state
  - ✅ Returns nextStep function
  - ✅ Returns previousStep function
  - ✅ Returns skipStep function
  - ✅ Returns complete function
  - ✅ Updates step correctly
  - ✅ Persists state
- **Priority**: P0
- **Dependencies**: Mock `OnboardingContext`

## 6. Accessibility Test Scenarios

### 6.1 Keyboard Navigation

#### **TC-UI-A11Y-001: Keyboard Navigation - Forms**
- **Test Cases**:
  - ✅ Tab moves focus forward
  - ✅ Shift+Tab moves focus backward
  - ✅ Enter submits form
  - ✅ ESC closes modal
  - ✅ Arrow keys navigate options (selects, radio groups)
  - ✅ Space activates buttons
  - ✅ Focus visible on all interactive elements
- **Priority**: P0

#### **TC-UI-A11Y-002: Keyboard Navigation - Modals**
- **Test Cases**:
  - ✅ Tab cycles through modal elements
  - ✅ Focus trapped within modal
  - ✅ Focus returns to trigger on close
  - ✅ ESC closes modal
  - ✅ First element receives focus on open
- **Priority**: P0

#### **TC-UI-A11Y-003: Keyboard Navigation - Menus**
- **Test Cases**:
  - ✅ Arrow keys navigate menu items
  - ✅ Enter activates menu item
  - ✅ ESC closes menu
  - ✅ Focus management
- **Priority**: P0

### 6.2 ARIA Attributes

#### **TC-UI-A11Y-004: ARIA Labels**
- **Test Cases**:
  - ✅ All interactive elements have labels
  - ✅ Form fields have associated labels
  - ✅ Buttons have accessible names
  - ✅ Icons have text alternatives
  - ✅ Images have alt text
- **Priority**: P0

#### **TC-UI-A11Y-005: ARIA Roles**
- **Test Cases**:
  - ✅ Modals have role="dialog"
  - ✅ Alerts have role="alert"
  - ✅ Navigation has role="navigation"
  - ✅ Forms have proper structure
  - ✅ Lists have proper list structure
- **Priority**: P0

#### **TC-UI-A11Y-006: ARIA States**
- **Test Cases**:
  - ✅ Disabled state announced
  - ✅ Loading state announced
  - ✅ Error state announced
  - ✅ Expanded/collapsed state announced
  - ✅ Selected state announced
- **Priority**: P0

### 6.3 Screen Reader Compatibility

#### **TC-UI-A11Y-007: Screen Reader - Forms**
- **Test Cases**:
  - ✅ Form labels announced
  - ✅ Error messages announced
  - ✅ Required fields indicated
  - ✅ Help text announced
  - ✅ Validation feedback announced
- **Priority**: P0

#### **TC-UI-A11Y-008: Screen Reader - Dynamic Content**
- **Test Cases**:
  - ✅ Loading states announced
  - ✅ Error messages announced
  - ✅ Success messages announced
  - ✅ Content updates announced (live regions)
- **Priority**: P0

### 6.4 Color and Contrast

#### **TC-UI-A11Y-009: Color Contrast**
- **Test Cases**:
  - ✅ Text meets WCAG AA contrast (4.5:1)
  - ✅ Large text meets WCAG AA contrast (3:1)
  - ✅ Interactive elements meet contrast requirements
  - ✅ Error states visible without color alone
- **Priority**: P0

## 7. Responsive Design Test Scenarios

### 7.1 Mobile Responsiveness (320px - 768px)

#### **TC-UI-RESP-001: Mobile Layout - Navigation**
- **Test Cases**:
  - ✅ Hamburger menu appears
  - ✅ Mobile menu opens/closes
  - ✅ Navigation links accessible
  - ✅ Touch targets ≥ 44x44px
  - ✅ Layout adapts correctly
- **Priority**: P0

#### **TC-UI-RESP-002: Mobile Layout - Forms**
- **Test Cases**:
  - ✅ Form fields full width
  - ✅ Buttons full width or appropriately sized
  - ✅ Touch targets adequate
  - ✅ Keyboard appears correctly
  - ✅ Form validation visible
- **Priority**: P0

#### **TC-UI-RESP-003: Mobile Layout - Modals**
- **Test Cases**:
  - ✅ Modal full screen or appropriately sized
  - ✅ Close button accessible
  - ✅ Content scrollable
  - ✅ Touch interactions work
- **Priority**: P0

#### **TC-UI-RESP-004: Mobile Layout - Calendar Views**
- **Test Cases**:
  - ✅ Day view scrollable
  - ✅ Week view scrollable
  - ✅ Month view readable
  - ✅ Agenda view scrollable
  - ✅ Event cards readable
- **Priority**: P0

### 7.2 Tablet Responsiveness (768px - 1024px)

#### **TC-UI-RESP-005: Tablet Layout**
- **Test Cases**:
  - ✅ Layout adapts appropriately
  - ✅ Navigation accessible
  - ✅ Forms usable
  - ✅ Calendar views functional
- **Priority**: P1

## 8. Error Handling Test Scenarios

### 8.1 Form Validation Errors

#### **TC-UI-ERR-001: Required Field Validation**
- **Test Cases**:
  - ✅ Shows error when required field empty
  - ✅ Error message clear and actionable
  - ✅ Error cleared on input
  - ✅ Form cannot submit with errors
  - ✅ Error accessible to screen readers
- **Priority**: P0

#### **TC-UI-ERR-002: Format Validation**
- **Test Cases**:
  - ✅ Email format validation
  - ✅ Date format validation
  - ✅ Time format validation
  - ✅ Name length validation
  - ✅ Error messages clear
- **Priority**: P0

#### **TC-UI-ERR-003: Business Rule Validation**
- **Test Cases**:
  - ✅ End time after start time
  - ✅ End date after start date
  - ✅ Conflict detection warnings
  - ✅ Error messages clear
- **Priority**: P0

### 8.2 API Error Handling

#### **TC-UI-ERR-004: Network Errors**
- **Test Cases**:
  - ✅ Displays network error message
  - ✅ Allows retry
  - ✅ Error message clear
  - ✅ Error accessible
- **Priority**: P0

#### **TC-UI-ERR-005: Server Errors**
- **Test Cases**:
  - ✅ Displays server error message
  - ✅ Handles 400/401/403/404/500 errors appropriately
  - ✅ Error message clear
  - ✅ Error accessible
- **Priority**: P0

### 8.3 Empty States

#### **TC-UI-ERR-006: Empty States**
- **Test Cases**:
  - ✅ Renders empty state when no data
  - ✅ Empty state message clear
  - ✅ Empty state actionable (if applicable)
  - ✅ Empty state accessible
- **Priority**: P1

## 9. Test Implementation Patterns

### 9.1 Test Utilities and Helpers

#### **Custom Render Function**
```typescript
// src/test/utils/render.tsx
import { render, RenderOptions } from '@testing-library/react';
import { AuthProvider } from '@/contexts/AuthContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';

function AllTheProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <OnboardingProvider>
        {children}
      </OnboardingProvider>
    </AuthProvider>
  );
}

function customRender(ui: React.ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

export * from '@testing-library/react';
export { customRender as render };
```

#### **Mock Data Factories**
```typescript
// src/test/utils/mock-data.ts
export function createMockUser(overrides?: Partial<User>) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    full_name: 'Test User',
    ...overrides,
  };
}

export function createMockEvent(overrides?: Partial<Event>) {
  return {
    id: 'event-123',
    title: 'Test Event',
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 3600000).toISOString(),
    ...overrides,
  };
}
```

#### **Accessibility Helpers**
```typescript
// src/test/utils/accessibility.ts
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

export async function checkAccessibility(container: HTMLElement) {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}
```

### 9.2 Test Structure Pattern

#### **Component Test Template**
```typescript
// ComponentName.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/render';
import { userEvent } from '@testing-library/user-event';
import { ComponentName } from './ComponentName';

// Mock dependencies
vi.mock('@/hooks/useSomeHook', () => ({
  useSomeHook: vi.fn(),
}));

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders correctly', () => {
      render(<ComponentName />);
      expect(screen.getByRole('...')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('handles click event', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<ComponentName onClick={handleClick} />);
      
      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<ComponentName />);
      expect(screen.getByRole('...')).toHaveAttribute('aria-label', '...');
    });
  });
});
```

### 9.3 Mocking Patterns

#### **Mock Context Providers**
```typescript
const mockAuthContext = {
  user: createMockUser(),
  isLoading: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));
```

#### **Mock API Hooks**
```typescript
const mockUseFamilyApi = {
  createFamily: vi.fn(),
  updateFamily: vi.fn(),
  deleteFamily: vi.fn(),
  isLoading: false,
  error: null,
};

vi.mock('@/hooks/useFamilyApi', () => ({
  useFamilyApi: () => mockUseFamilyApi,
}));
```

### 9.4 Test Organization

#### **Test File Structure**
- **Arrange**: Set up test data and mocks
- **Act**: Perform user interactions or trigger events
- **Assert**: Verify expected outcomes

#### **Test Grouping**
- Group related tests in `describe` blocks
- Use descriptive test names
- Follow AAA pattern (Arrange-Act-Assert)

## 10. Coverage Targets

### 10.1 Component Coverage

#### **Priority Levels**
- **P0 (Critical)**: 100% coverage
  - Authentication components
  - Event creation/editing modals
  - Form components
  - Navigation components
  
- **P1 (High)**: 90% coverage
  - Calendar view components
  - Family management components
  - Onboarding components
  - Profile components
  
- **P2 (Medium)**: 80% coverage
  - Display components
  - Card components
  - UI base components

### 10.2 Hook Coverage

#### **Coverage Targets**
- **API Hooks**: 100% coverage (all success/error paths)
- **Data Hooks**: 90% coverage
- **Context Hooks**: 90% coverage
- **Form Hooks**: 100% coverage

### 10.3 Overall Coverage Goals
- **Components**: ≥ 85% coverage
- **Hooks**: ≥ 90% coverage
- **Critical Paths**: 100% coverage
- **Accessibility**: 100% of interactive components

## 11. Testing Tools and Setup

### 11.1 Required Dependencies

```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0",
    "@testing-library/dom": "^9.3.0",
    "jest-axe": "^8.0.0",
    "vitest": "^4.0.7",
    "@vitest/ui": "^4.0.7",
    "@vitest/coverage-v8": "^4.0.15",
    "jsdom": "^25.0.1"
  }
}
```

### 11.2 Vitest Configuration

```typescript
// vitest.config.ts (additions for UI tests)
export default defineConfig({
  test: {
    environment: 'jsdom', // For component tests
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
});
```

### 11.3 Test Setup File

```typescript
// src/test/setup.ts (additions)
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

## 12. Test Execution Strategy

### 12.1 Test Execution Modes

#### **Development Mode**
- Watch mode: `pnpm test:watch`
- UI mode: `pnpm test:ui`
- Single file: `pnpm test ComponentName.test.tsx`

#### **CI/CD Mode**
- Full suite: `pnpm test:run`
- Coverage report: `pnpm test:coverage`
- Parallel execution

### 12.2 Test Prioritization

#### **Pre-Commit Hooks**
- Run tests for changed files
- Run accessibility checks
- Run type checking

#### **Pull Request Checks**
- Run full test suite
- Generate coverage report
- Check coverage thresholds

### 12.3 Test Maintenance

#### **Regular Maintenance Tasks**
- Update tests when components change
- Refactor duplicate test code
- Update mock data factories
- Review and update coverage targets

## 13. Maintainability Guidelines

### 13.1 Test Code Quality

#### **Principles**
- **DRY (Don't Repeat Yourself)**: Use test utilities and factories
- **KISS (Keep It Simple, Stupid)**: Simple, readable tests
- **Single Responsibility**: Each test verifies one behavior
- **Descriptive Names**: Test names describe what is being tested

#### **Best Practices**
- Use test utilities for common patterns
- Create reusable mock factories
- Keep tests independent
- Avoid testing implementation details
- Focus on user-facing behavior

### 13.2 Test Organization

#### **File Organization**
- Co-locate test files with components
- Group related tests in describe blocks
- Use consistent naming conventions
- Keep test files focused

#### **Code Organization**
- Setup at the top
- Test cases grouped by feature
- Cleanup in afterEach
- Mocks defined clearly

### 13.3 Refactoring Guidelines

#### **When to Refactor**
- Duplicate test code appears
- Tests become hard to read
- Mock setup is complex
- Test utilities would help

#### **Refactoring Patterns**
- Extract common setup to utilities
- Create reusable test factories
- Use custom render functions
- Create helper functions for common assertions

## 14. Test Schedule

### 14.1 Testing Phases

#### **Phase 1: Foundation (Week 1)**
- Set up testing infrastructure
- Create test utilities and helpers
- Write tests for UI base components
- Establish testing patterns

#### **Phase 2: Core Components (Week 2-3)**
- Test authentication components
- Test calendar components
- Test form components
- Test modal components

#### **Phase 3: Feature Components (Week 4-5)**
- Test family management components
- Test onboarding components
- Test profile components
- Test settings components

#### **Phase 4: Hooks and Integration (Week 6)**
- Test all custom hooks
- Test context providers
- Integration tests for component + hook combinations

#### **Phase 5: Accessibility and Polish (Week 7)**
- Accessibility testing
- Responsive design testing
- Error handling testing
- Coverage review and improvement

### 14.2 Ongoing Maintenance

#### **Daily**
- Write tests for new components
- Update tests when components change
- Fix failing tests

#### **Weekly**
- Review test coverage
- Refactor duplicate code
- Update test utilities

#### **Monthly**
- Review test patterns
- Update testing guidelines
- Performance optimization

## 15. Success Criteria

### 15.1 Coverage Metrics
- ✅ Component coverage ≥ 85%
- ✅ Hook coverage ≥ 90%
- ✅ Critical paths 100% covered
- ✅ Accessibility tests for all interactive components

### 15.2 Quality Metrics
- ✅ All P0 tests passing
- ✅ All accessibility tests passing
- ✅ No flaky tests
- ✅ Tests run in < 30 seconds
- ✅ Test code maintainable

### 15.3 User Experience Metrics
- ✅ All user interactions tested
- ✅ All error states tested
- ✅ All loading states tested
- ✅ All empty states tested
- ✅ Responsive behavior verified

## 16. Risk Mitigation

### 16.1 Common Risks

#### **Risk: Flaky Tests**
- **Mitigation**: Use proper async handling, avoid timers, use stable selectors

#### **Risk: Slow Test Execution**
- **Mitigation**: Run tests in parallel, mock heavy dependencies, optimize test setup

#### **Risk: Test Maintenance Burden**
- **Mitigation**: Use test utilities, create reusable patterns, document conventions

#### **Risk: Incomplete Coverage**
- **Mitigation**: Set coverage thresholds, review coverage reports, prioritize critical paths

### 16.2 Testing Challenges

#### **Challenge: Complex Component Dependencies**
- **Solution**: Mock dependencies, use custom render functions, test in isolation

#### **Challenge: Async Behavior**
- **Solution**: Use `waitFor`, `findBy` queries, proper async/await patterns

#### **Challenge: Context Providers**
- **Solution**: Create test wrappers, mock context values, use custom render

## 17. Appendix

### 17.1 Test Case Template

```markdown
#### **TC-UI-XXX-XXX: ComponentName**
- **Component**: `ComponentName.tsx`
- **Test Cases**:
  - ✅ Test case 1
  - ✅ Test case 2
- **Priority**: P0/P1/P2
- **Dependencies**: Mock dependencies list
```

### 17.2 Testing Checklist

#### **Component Testing Checklist**
- [ ] Component renders correctly
- [ ] Props handled correctly
- [ ] User interactions work
- [ ] Loading states work
- [ ] Error states work
- [ ] Empty states work
- [ ] Accessibility verified
- [ ] Responsive design verified
- [ ] Keyboard navigation works
- [ ] Screen reader compatible

#### **Hook Testing Checklist**
- [ ] Hook returns expected values
- [ ] Loading state managed
- [ ] Error state managed
- [ ] Success paths work
- [ ] Error paths work
- [ ] State updates correctly
- [ ] Side effects handled

### 17.3 Resources

- [React Testing Library Documentation](https://testing-library.com/react)
- [Vitest Documentation](https://vitest.dev/)
- [Accessibility Testing Guide](https://www.w3.org/WAI/test-evaluate/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Document End**
