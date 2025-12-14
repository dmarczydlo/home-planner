# Implementation Plan: Onboarding Wizard
## Mobile-First Design

## 1. Overview

**Purpose**: Guide new users through initial setup (family creation, calendar connection, children, invitations)

**Route**: `/onboarding/*` (multi-step wizard)

**Entry Point**: After first-time Google authentication

**Exit Point**: Calendar view (`/calendar/week`)

**Steps**:
1. Welcome & Family Name (`/onboarding/welcome`)
2. Connect Calendar (`/onboarding/connect-calendar`)
3. Add Children (`/onboarding/add-children`)
4. Invite Members (`/onboarding/invite-members`)

## 2. Mobile-First Design Specifications

### 2.1. Layout (Mobile 320px - 767px)

**Step Container:**
```
┌─────────────────────────────────┐
│ [Progress: 2/4]                │
├─────────────────────────────────┤
│                                 │
│    [Step Content Area]          │
│                                 │
│    [Form/Interactive Elements]  │
│                                 │
│                                 │
├─────────────────────────────────┤
│ [← Back]        [Next →]        │
│              [Skip for now]     │
└─────────────────────────────────┘
```

**Key Elements:**
- Progress indicator at top
- Full-width content area
- Bottom action buttons (fixed or sticky)
- Skip option on each step

### 2.2. Responsive Breakpoints

**Mobile (320px - 767px):**
- Full-screen steps
- Bottom action bar
- Swipe gestures (optional)

**Tablet (768px - 1023px):**
- Constrained width (max 600px)
- Centered container
- Side-by-side buttons

**Desktop (1024px+):**
- Constrained width (max 700px)
- Centered container
- Horizontal button layout

## 3. Component Structure

### 3.1. Main Wizard Component

**File**: `src/components/onboarding/OnboardingWizard.tsx`

**Structure:**
```typescript
<OnboardingWizard>
  <ProgressIndicator currentStep={step} totalSteps={4} />
  <StepContainer>
    {renderCurrentStep()}
  </StepContainer>
  <StepActions>
    <BackButton />
    <NextButton />
    <SkipButton />
  </StepActions>
</OnboardingWizard>
```

### 3.2. Step Components

**WelcomeStep** (`/onboarding/welcome`)
- Welcome message
- Family name input
- Next button

**ConnectCalendarStep** (`/onboarding/connect-calendar`)
- Provider selection (Google/Microsoft)
- OAuth flow
- Success state

**AddChildrenStep** (`/onboarding/add-children`)
- Children list
- Add child form
- Child cards

**InviteMembersStep** (`/onboarding/invite-members`)
- Invitation form
- Invitations list
- Complete button

### 3.3. Shared Components

**ProgressIndicator**
- Step dots or progress bar
- Current step highlighted
- Step labels (optional)

**StepActions**
- Back button (hidden on first step)
- Next/Skip buttons
- Complete button (last step)

## 4. User Flow

### 4.1. Complete Onboarding Flow

```
1. Welcome Step
   └─> Enter family name
       └─> Tap "Next"
           └─> Step 2

2. Connect Calendar Step
   └─> Select provider (Google/Microsoft)
       └─> OAuth flow
           └─> Calendar connected
               └─> Tap "Next" or "Skip"
                   └─> Step 3

3. Add Children Step
   └─> Tap "Add Child"
       └─> Enter child name
           └─> Tap "Add"
               └─> Repeat or "Next"
                   └─> Step 4

4. Invite Members Step
   └─> Enter email
       └─> Tap "Send Invitation"
           └─> Repeat or "Complete Setup"
               └─> Calendar View
```

### 4.2. Skip Flow

```
Any Step
└─> Tap "Skip for now"
    └─> Save progress
        └─> Next step (or complete if last)
            └─> User can complete later from Settings
```

### 4.3. Back Navigation

```
Step 2-4
└─> Tap "Back"
    └─> Previous step
        └─> Preserve entered data
```

## 5. API Integration

### 5.1. Step 1: Create Family

**Endpoint**: `POST /api/families`

```typescript
async function createFamily(name: string) {
  const response = await apiClient.post('/api/families', { name });
  return response.data;
}
```

### 5.2. Step 2: Connect Calendar

**Endpoint**: `POST /api/external-calendars`

```typescript
async function connectCalendar(provider: 'google' | 'microsoft') {
  const response = await apiClient.post('/api/external-calendars', { provider });
  // Returns authorization_url for OAuth
  return response.data;
}
```

### 5.3. Step 3: Add Children

**Endpoint**: `POST /api/families/{familyId}/children`

```typescript
async function addChild(familyId: string, name: string) {
  const response = await apiClient.post(
    `/api/families/${familyId}/children`,
    { name }
  );
  return response.data;
}
```

### 5.4. Step 4: Invite Members

**Endpoint**: `POST /api/families/{familyId}/invitations`

```typescript
async function inviteMember(familyId: string, email: string) {
  const response = await apiClient.post(
    `/api/families/${familyId}/invitations`,
    { invitee_email: email }
  );
  return response.data;
}
```

## 6. State Management

### 6.1. Onboarding State

**File**: `src/contexts/OnboardingContext.tsx`

```typescript
interface OnboardingState {
  currentStep: number;
  familyName: string;
  connectedCalendars: ExternalCalendar[];
  children: Child[];
  invitations: Invitation[];
  isComplete: boolean;
}

interface OnboardingContextType {
  state: OnboardingState;
  setFamilyName: (name: string) => void;
  addChild: (child: Child) => void;
  addInvitation: (invitation: Invitation) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipStep: () => void;
  complete: () => Promise<void>;
}
```

### 6.2. Progress Persistence

**Local Storage:**
```typescript
// Save progress
localStorage.setItem('onboarding_progress', JSON.stringify({
  step: currentStep,
  data: { familyName, children, ... }
}));

// Restore on return
const saved = localStorage.getItem('onboarding_progress');
```

## 7. Mobile-Specific Features

### 7.1. Touch Optimization

- **Input Fields**: Minimum 48px height
- **Buttons**: Minimum 44x44px touch targets
- **Spacing**: Adequate padding between elements

### 7.2. Form Interactions

**Mobile Input:**
- Native date/time pickers
- Autocomplete for emails
- Keyboard-optimized layouts

**Swipe Gestures (Optional):**
- Swipe left: Next step
- Swipe right: Previous step

### 7.3. Loading States

**During API Calls:**
- Show loading spinner
- Disable buttons
- Display progress message

**OAuth Flow:**
- Show "Redirecting..." message
- Handle callback return

## 8. Step-by-Step Implementation

### 8.1. Step 1: Welcome & Family Name

**Components:**
- `WelcomeStep.tsx`
- `FamilyNameInput.tsx`

**Validation:**
- Family name required
- Max 100 characters
- Non-empty string

**UI:**
```
┌─────────────────────────────────┐
│ [Progress: 1/4]                │
├─────────────────────────────────┤
│                                 │
│  Welcome to Home Planner!      │
│                                 │
│  Let's set up your family      │
│  calendar.                      │
│                                 │
│  Family Name                    │
│  [________________________]     │
│                                 │
│                                 │
├─────────────────────────────────┤
│              [Next →]           │
└─────────────────────────────────┘
```

### 8.2. Step 2: Connect Calendar

**Components:**
- `ConnectCalendarStep.tsx`
- `ProviderCard.tsx`
- `OAuthHandler.tsx`

**UI:**
```
┌─────────────────────────────────┐
│ [Progress: 2/4]                │
├─────────────────────────────────┤
│                                 │
│  Connect Your Calendar         │
│                                 │
│  [Google Calendar Card]         │
│  [Microsoft 365 Card]          │
│                                 │
│  You can skip this and add     │
│  calendars later.               │
│                                 │
├─────────────────────────────────┤
│ [← Back]    [Skip] [Next →]    │
└─────────────────────────────────┘
```

### 8.3. Step 3: Add Children

**Components:**
- `AddChildrenStep.tsx`
- `ChildForm.tsx`
- `ChildCard.tsx`
- `ChildrenList.tsx`

**UI:**
```
┌─────────────────────────────────┐
│ [Progress: 3/4]                │
├─────────────────────────────────┤
│                                 │
│  Add Your Children             │
│                                 │
│  [Child Card]                   │
│  [Child Card]                   │
│                                 │
│  [+ Add Child]                  │
│                                 │
├─────────────────────────────────┤
│ [← Back]    [Skip] [Next →]    │
└─────────────────────────────────┘
```

**Add Child Form (Bottom Sheet):**
```
┌─────────────────────────────────┐
│ Add Child                      │
├─────────────────────────────────┤
│                                 │
│  Name                           │
│  [________________________]     │
│                                 │
│  [Cancel]        [Add]          │
└─────────────────────────────────┘
```

### 8.4. Step 4: Invite Members

**Components:**
- `InviteMembersStep.tsx`
- `InviteForm.tsx`
- `InvitationCard.tsx`

**UI:**
```
┌─────────────────────────────────┐
│ [Progress: 4/4]                │
├─────────────────────────────────┤
│                                 │
│  Invite Family Members         │
│                                 │
│  [Invitation Card]              │
│                                 │
│  Email                          │
│  [________________________]     │
│  [Send Invitation]              │
│                                 │
├─────────────────────────────────┤
│ [← Back]  [Complete Setup →]   │
└─────────────────────────────────┘
```

## 9. Accessibility

### 9.1. WCAG AA Compliance

- **Focus Management**: Focus moves to step content on step change
- **ARIA Labels**: Step indicators labeled
- **Keyboard Navigation**: Tab through form, Enter to submit
- **Screen Reader**: Announce step changes

### 9.2. ARIA Implementation

```tsx
<div role="region" aria-label="Onboarding wizard">
  <div aria-label={`Step ${currentStep} of ${totalSteps}`}>
    <ProgressIndicator aria-hidden="true" />
    <div role="group" aria-labelledby="step-title">
      <h2 id="step-title">{stepTitle}</h2>
      {stepContent}
    </div>
  </div>
</div>
```

## 10. Performance Optimization

### 10.1. Code Splitting

- Lazy load step components
- Load OAuth SDK only when needed
- Split wizard from main app bundle

### 10.2. Data Prefetching

- Prefetch family data after step 1
- Preload calendar providers
- Cache form data locally

## 11. Implementation Checklist

### Phase 1: Wizard Structure
- [ ] Create OnboardingWizard component
- [ ] Implement step navigation
- [ ] Add progress indicator
- [ ] Create step container

### Phase 2: Step 1 - Welcome
- [ ] Create WelcomeStep component
- [ ] Add family name input
- [ ] Implement validation
- [ ] Connect to API

### Phase 3: Step 2 - Connect Calendar
- [ ] Create ConnectCalendarStep component
- [ ] Add provider selection
- [ ] Implement OAuth flow
- [ ] Handle callback

### Phase 4: Step 3 - Add Children
- [ ] Create AddChildrenStep component
- [ ] Add child form (bottom sheet)
- [ ] Implement children list
- [ ] Connect to API

### Phase 5: Step 4 - Invite Members
- [ ] Create InviteMembersStep component
- [ ] Add invitation form
- [ ] Implement invitations list
- [ ] Connect to API

### Phase 6: State Management
- [ ] Create OnboardingContext
- [ ] Implement progress persistence
- [ ] Add skip functionality
- [ ] Handle completion

### Phase 7: Mobile Optimization
- [ ] Optimize touch targets
- [ ] Add loading states
- [ ] Implement bottom sheets
- [ ] Test on devices

### Phase 8: Polish
- [ ] Add animations
- [ ] Improve error handling
- [ ] Add accessibility features
- [ ] Final testing

## 12. File Structure

```
src/
├── pages/
│   └── onboarding/
│       ├── welcome.astro
│       ├── connect-calendar.astro
│       ├── add-children.astro
│       └── invite-members.astro
├── components/
│   └── onboarding/
│       ├── OnboardingWizard.tsx
│       ├── ProgressIndicator.tsx
│       ├── StepActions.tsx
│       ├── WelcomeStep.tsx
│       ├── ConnectCalendarStep.tsx
│       ├── AddChildrenStep.tsx
│       ├── InviteMembersStep.tsx
│       ├── ProviderCard.tsx
│       ├── ChildForm.tsx
│       ├── ChildCard.tsx
│       ├── InviteForm.tsx
│       └── InvitationCard.tsx
├── contexts/
│   └── OnboardingContext.tsx
└── hooks/
    └── useOnboarding.ts
```

## 13. Testing Strategy

### 13.1. Unit Tests
- Step navigation works
- Form validation
- State updates

### 13.2. Integration Tests
- API calls succeed
- OAuth flow completes
- Data persists

### 13.3. E2E Tests
- Complete onboarding flow
- Skip functionality
- Error scenarios

## 14. Success Criteria

- [ ] User can complete all steps
- [ ] Skip functionality works
- [ ] Progress persists
- [ ] OAuth flow completes
- [ ] Data saves correctly
- [ ] Mobile experience is smooth
- [ ] Accessibility requirements met
- [ ] Completion time < 5 minutes

