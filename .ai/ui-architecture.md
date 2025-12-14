# UI Architecture - Home Planner MVP

## Mobile-First Design

## 1. Design Principles

### 1.1. Mobile-First Approach

- **Primary Target**: Mobile devices (320px - 768px)
- **Breakpoints**:
  - Mobile: 320px - 767px (default)
  - Tablet: 768px - 1023px
  - Desktop: 1024px+
- **Touch Targets**: Minimum 44x44px for all interactive elements
- **Performance**: Optimize for 3G networks, lazy load components, minimize initial bundle size

### 1.2. Design System

- **Component Library**: Shadcn/ui (mobile-optimized variants)
- **Styling**: Tailwind 4 with mobile-first utilities
- **Icons**: Lucide React (lightweight, consistent)
- **Typography**: System fonts for performance, responsive sizing
- **Color Scheme**: Accessible contrast ratios (WCAG AA minimum)

## 2. Navigation Structure

### 2.1. Mobile Navigation (Primary)

**Bottom Navigation Bar** - Always visible, fixed at bottom

```
┌─────────────────────────────────┐
│         [Calendar View]          │
│                                  │
│    [Calendar Content Area]       │
│                                  │
│                                  │
├─────────────────────────────────┤
│ [📅] [👥] [⚙️] [👤]              │
│Calendar Family Settings Profile  │
└─────────────────────────────────┘
```

**Navigation Items:**

1. **Calendar** (📅) - Default view, shows current calendar view
2. **Family** (👥) - Family management, members, children
3. **Settings** (⚙️) - External calendars, app settings
4. **Profile** (👤) - User profile, logout

### 2.2. Desktop Navigation (Secondary)

**Sidebar Navigation** - Collapsible, left side

```
┌─────┬───────────────────────────┐
│ 📅  │    [Calendar View]         │
│ 👥  │                            │
│ ⚙️  │  [Calendar Content Area]   │
│ 👤  │                            │
└─────┴───────────────────────────┘
```

### 2.3. View Hierarchy

```
App Shell
├── Authentication Flow
│   ├── Login Page (Google Sign-in)
│   └── Onboarding Wizard
│       ├── Step 1: Welcome & Family Name
│       ├── Step 2: Connect Calendar
│       ├── Step 3: Add Children
│       └── Step 4: Invite Members
│
├── Calendar View (Default Landing)
│   ├── View Switcher (Day/Week/Month/Agenda)
│   ├── Date Navigation
│   ├── Filter Toggle (Family Members)
│   ├── Calendar Grid/List
│   └── Event Cards/Items
│
├── Family Management
│   ├── Family Overview
│   ├── Members List
│   ├── Children List
│   ├── Invitations List
│   └── Invite Member Form
│
├── Settings
│   ├── External Calendars List
│   ├── Connect Calendar Flow
│   ├── Calendar Sync Status
│   └── App Preferences
│
└── Profile
    ├── User Info
    ├── Family Memberships
    └── Logout
```

## 3. Component Architecture

### 3.1. Core UI Components (Shadcn/ui Extensions)

#### Mobile-Optimized Components

**BottomSheet** (Mobile Event Form)

- Replaces modal on mobile
- Swipes up from bottom
- Full height on mobile, partial on tablet
- Backdrop with tap-to-close

**SwipeableCard** (Event Items)

- Swipe left: Edit
- Swipe right: Delete
- Haptic feedback on mobile

**PullToRefresh** (Calendar Sync)

- Native mobile pattern
- Triggers sync on pull down
- Visual feedback during sync

**FloatingActionButton** (Create Event)

- Fixed position, bottom-right
- Only on calendar views
- Hidden when bottom sheet open

**CollapsibleFilter** (Member Filters)

- Accordion-style on mobile
- Always visible on desktop
- Checkbox list for members

### 3.2. Calendar Components

**CalendarViewSwitcher**

- Mobile: Segmented control (Day/Week/Month/Agenda)
- Desktop: Tabs
- Current view highlighted

**DayView**

- Mobile: Vertical timeline (6am - 11pm)
- Hour slots with events
- All-day section at top
- Multi-day banner above timeline

**WeekView**

- Mobile: Horizontal scrollable days
- Swipe between weeks
- Day columns with events
- Current day highlighted

**MonthView**

- Mobile: Grid layout (7 columns)
- Date cells with event dots/indicators
- Tap cell to view day detail
- Current date highlighted

**AgendaView**

- Mobile: List of upcoming events
- Grouped by date
- Event cards with time, title, participants
- Infinite scroll with pagination

**EventCard**

- Mobile: Full-width card
- Shows: Title, time, participants, type indicator
- Visual distinction: Elastic (dashed border), Blocker (solid border)
- Synced events: Different color/shadow
- Tap to view details/edit

### 3.3. Form Components

**EventForm** (BottomSheet on mobile, Modal on desktop)

- Title input
- Date/Time pickers (native on mobile)
- Participant multi-select (searchable)
- Event type toggle (Elastic/Blocker)
- Recurrence options (collapsible)
- All-day checkbox
- Conflict warning (inline, if blocker)
- Save/Cancel buttons

**RecurrenceEditor**

- Frequency selector (Daily/Weekly/Monthly)
- Interval input
- End date picker
- Preview of next occurrences

**MemberSelector**

- Searchable list
- Users and children combined
- Avatar + name display
- Multi-select with checkboxes

### 3.4. Family Management Components

**MemberList**

- Mobile: Cards with avatar, name, role
- Admin actions: Remove, change role (context menu)
- Member actions: View only

**ChildrenList**

- Mobile: Cards with name, created date
- Actions: Edit, Delete (swipe on mobile)
- Add child button (floating or inline)

**InvitationList**

- Mobile: Cards with email, status, expiry
- Status badges: Pending, Accepted, Expired
- Actions: Cancel (pending only)
- Empty state: "No invitations"

**InviteMemberForm**

- Email input with validation
- Send invitation button
- Success/error toast

### 3.5. External Calendar Components

**CalendarConnectionCard**

- Provider icon (Google/Microsoft)
- Account email
- Sync status badge
- Last synced time
- Actions: Sync, Disconnect
- Error message (if sync failed)

**ConnectCalendarFlow**

- Provider selection (Google/Microsoft)
- OAuth redirect handling
- Success/error states
- Loading state during connection

**SyncStatusIndicator**

- Global sync button (header)
- Sync progress indicator
- Rate limit warning
- Last sync timestamp

## 4. User Flows

### 4.1. First-Time User Flow (Onboarding)

```
1. Landing Page
   └─> "Sign in with Google" button
       └─> Google OAuth
           └─> Onboarding Wizard

2. Onboarding Step 1: Welcome
   └─> Family name input
       └─> "Next" button
           └─> Step 2

3. Onboarding Step 2: Connect Calendar
   └─> "Connect Google Calendar" or "Connect Microsoft 365"
       └─> OAuth flow
           └─> Calendar connected
               └─> "Next" or "Skip"
                   └─> Step 3

4. Onboarding Step 3: Add Children
   └─> "Add Child" button
       └─> Name input
           └─> "Add" button
               └─> Repeat or "Next"
                   └─> Step 4

5. Onboarding Step 4: Invite Members
   └─> Email input
       └─> "Send Invitation" button
           └─> Repeat or "Skip"
               └─> "Complete Setup"
                   └─> Calendar View
```

### 4.2. Returning User Flow

```
1. Landing Page
   └─> "Sign in with Google"
       └─> Google OAuth
           └─> Check onboarding status
               ├─> Not complete: Resume onboarding
               └─> Complete: Calendar View
```

### 4.3. Create Event Flow

```
1. Calendar View
   └─> Tap date/time slot OR Floating Action Button
       └─> Event Form (BottomSheet on mobile)
           ├─> Fill form
           │   ├─> If Blocker: Validate conflicts
           │   │   └─> Show conflicts if any
           │   └─> If Elastic: No conflict check
           └─> "Save" button
               ├─> Success: Close form, refresh calendar
               └─> Error: Show error message
```

### 4.4. Edit Event Flow

```
1. Calendar View
   └─> Tap event card
       └─> Event Details (BottomSheet)
           ├─> View mode: Show all details
           └─> "Edit" button
               └─> Edit mode
                   ├─> If recurring: Scope selector
                   │   ├─> "This event only"
                   │   ├─> "This and future"
                   │   └─> "All events"
                   └─> Save changes
                       └─> Refresh calendar
```

### 4.5. Sync External Calendar Flow

```
1. Settings > External Calendars
   └─> "Connect Calendar" button
       └─> Provider selection
           └─> OAuth flow
               └─> Redirect back
                   ├─> Success: Show connected calendar
                   └─> Error: Show error message

2. Manual Sync
   └─> Tap "Sync" on calendar card
       └─> Loading state
           ├─> Success: Update last synced time
           └─> Error: Show error message
```

### 4.6. Invite Family Member Flow

```
1. Family > Members
   └─> "Invite Member" button
       └─> Email input form
           └─> "Send Invitation" button
               ├─> Success: Show in invitations list
               └─> Error: Show validation/conflict error
```

## 5. State Management Strategy

### 5.1. Global State (React Context)

**AuthContext**

- `user: User | null`
- `isAuthenticated: boolean`
- `isLoading: boolean`
- `login(): Promise<void>`
- `logout(): void`
- `refreshToken(): Promise<void>`

**FamilyContext**

- `currentFamily: Family | null`
- `members: Member[]`
- `children: Child[]`
- `invitations: Invitation[]`
- `loadFamily(familyId: string): Promise<void>`
- `refreshMembers(): Promise<void>`
- `refreshChildren(): Promise<void>`

**CalendarContext**

- `events: Event[]`
- `dateRange: { start: Date, end: Date }`
- `filters: { participantIds: string[], eventType?: 'elastic' | 'blocker' }`
- `view: 'day' | 'week' | 'month' | 'agenda'`
- `loadEvents(params): Promise<void>`
- `createEvent(data): Promise<void>`
- `updateEvent(id, data): Promise<void>`
- `deleteEvent(id): Promise<void>`

**ExternalCalendarContext**

- `calendars: ExternalCalendar[]`
- `syncStatus: Record<string, 'idle' | 'syncing' | 'success' | 'error'>`
- `loadCalendars(): Promise<void>`
- `syncCalendar(id): Promise<void>`
- `syncAll(): Promise<void>`

### 5.2. Server State (React Query / SWR)

**Query Keys:**

- `['user', userId]` - User profile
- `['family', familyId]` - Family details
- `['family-members', familyId]` - Family members
- `['children', familyId]` - Children
- `['events', familyId, dateRange, filters]` - Events
- `['external-calendars', userId]` - External calendars
- `['invitations', familyId]` - Invitations

**Mutation Keys:**

- `['create-event']` - Create event
- `['update-event', eventId]` - Update event
- `['delete-event', eventId]` - Delete event
- `['sync-calendar', calendarId]` - Sync calendar
- `['invite-member', familyId]` - Invite member

**Cache Strategy:**

- Events: Cache for current view ± 7 days buffer
- Family data: Cache until mutation
- External calendars: Cache with 5-minute stale time
- Auto-refetch on window focus
- Optimistic updates for event mutations

## 6. API Integration Patterns

### 6.1. API Client Setup

```typescript
// src/lib/api/client.ts
const apiClient = {
  get: async (endpoint: string, options?: RequestInit) => {
    const token = await getAuthToken();
    return fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
  },
  // post, patch, delete methods
};
```

### 6.2. Error Handling Pattern

```typescript
// src/lib/api/errorHandler.ts
export function handleApiError(response: Response) {
  switch (response.status) {
    case 401:
      // Clear auth, redirect to login
      break;
    case 403:
      // Show "Access Denied"
      break;
    case 409:
      // Show conflict details
      break;
    case 429:
      // Show rate limit message with retry timer
      break;
    default:
    // Show generic error
  }
}
```

### 6.3. Optimistic Updates

```typescript
// Example: Create event with optimistic update
const mutation = useMutation({
  mutationFn: createEvent,
  onMutate: async (newEvent) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(["events"]);

    // Snapshot previous value
    const previousEvents = queryClient.getQueryData(["events"]);

    // Optimistically update
    queryClient.setQueryData(["events"], (old) => [...old, newEvent]);

    return { previousEvents };
  },
  onError: (err, newEvent, context) => {
    // Rollback on error
    queryClient.setQueryData(["events"], context.previousEvents);
  },
  onSettled: () => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries(["events"]);
  },
});
```

## 7. Responsive Design Specifications

### 7.1. Mobile (320px - 767px)

**Layout:**

- Single column
- Full-width components
- Bottom navigation (fixed)
- Floating action button (create event)
- Bottom sheets for modals
- Swipe gestures enabled

**Typography:**

- Base: 16px (body)
- Headings: 20px (h1), 18px (h2), 16px (h3)
- Small: 14px (captions)

**Spacing:**

- Container padding: 16px
- Component gaps: 12px
- Section gaps: 24px

**Touch Targets:**

- Minimum: 44x44px
- Button height: 48px
- Input height: 48px

### 7.2. Tablet (768px - 1023px)

**Layout:**

- Two-column where appropriate
- Sidebar navigation (collapsible)
- Modals instead of bottom sheets
- Larger touch targets maintained

**Typography:**

- Base: 16px
- Headings: 24px (h1), 20px (h2), 18px (h3)

**Spacing:**

- Container padding: 24px
- Component gaps: 16px
- Section gaps: 32px

### 7.3. Desktop (1024px+)

**Layout:**

- Multi-column layouts
- Sidebar navigation (always visible)
- Modals and side panels
- Hover states
- Keyboard shortcuts

**Typography:**

- Base: 16px
- Headings: 28px (h1), 24px (h2), 20px (h3)

**Spacing:**

- Container padding: 32px
- Component gaps: 20px
- Section gaps: 40px

## 8. Accessibility Requirements

### 8.1. WCAG AA Compliance

**Color Contrast:**

- Text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum

**Keyboard Navigation:**

- All interactive elements keyboard accessible
- Focus indicators visible
- Tab order logical
- Skip links for main content

**Screen Readers:**

- Semantic HTML
- ARIA labels where needed
- Alt text for icons/images
- Live regions for dynamic content

**Touch Accessibility:**

- Minimum 44x44px touch targets
- Adequate spacing between targets
- Haptic feedback on mobile

### 8.2. Mobile-Specific Accessibility

- VoiceOver (iOS) support
- TalkBack (Android) support
- Reduced motion preferences
- Font scaling support (up to 200%)
- High contrast mode support

## 9. Performance Optimization

### 9.1. Mobile Performance Targets

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1

### 9.2. Optimization Strategies

**Code Splitting:**

- Route-based splitting (Astro)
- Component lazy loading
- Calendar views loaded on demand

**Asset Optimization:**

- Image optimization (WebP, lazy loading)
- Icon sprites or inline SVGs
- Font subsetting

**Caching:**

- Service worker for offline support
- API response caching (React Query)
- Static asset caching

**Bundle Size:**

- Tree shaking
- Dynamic imports for heavy components
- Minimal dependencies

## 10. Error States & Loading States

### 10.1. Loading States

**Skeleton Screens:**

- Calendar view: Skeleton grid
- Event list: Skeleton cards
- Member list: Skeleton avatars

**Loading Indicators:**

- Spinner for async operations
- Progress bar for sync operations
- Skeleton for initial loads

### 10.2. Error States

**Empty States:**

- No events: "No events scheduled"
- No members: "No family members yet"
- No calendars: "No calendars connected"

**Error Messages:**

- Network error: "Connection failed. Please try again."
- Validation error: Field-level messages
- Conflict error: Show conflicting events
- Rate limit: "Too many requests. Please wait X seconds."

**Error Recovery:**

- Retry buttons
- Offline indicator
- Sync status indicator

## 11. Implementation Phases

### Phase 1: Core Infrastructure

- [ ] Authentication flow
- [ ] Navigation structure
- [ ] State management setup
- [ ] API client
- [ ] Error handling

### Phase 2: Calendar Views

- [ ] Day view
- [ ] Week view
- [ ] Month view
- [ ] Agenda view
- [ ] View switcher

### Phase 3: Event Management

- [ ] Create event form
- [ ] Edit event form
- [ ] Delete event
- [ ] Conflict detection UI
- [ ] Recurrence editor

### Phase 4: Family Management

- [ ] Family overview
- [ ] Members list
- [ ] Children management
- [ ] Invitation system

### Phase 5: External Calendars

- [ ] Calendar connection flow
- [ ] Calendar list
- [ ] Sync functionality
- [ ] Sync status indicators

### Phase 6: Onboarding

- [ ] Onboarding wizard
- [ ] Step components
- [ ] Progress tracking
- [ ] Skip functionality

### Phase 7: Polish & Optimization

- [ ] Responsive refinements
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Error state handling
- [ ] Loading state improvements

## 12. Component File Structure

```
src/
├── components/
│   ├── ui/                    # Shadcn/ui components
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── sheet.tsx          # Bottom sheet for mobile
│   │   ├── toast.tsx
│   │   ├── select.tsx
│   │   ├── checkbox.tsx
│   │   └── ...
│   │
│   ├── calendar/              # Calendar components
│   │   ├── CalendarView.tsx
│   │   ├── DayView.tsx
│   │   ├── WeekView.tsx
│   │   ├── MonthView.tsx
│   │   ├── AgendaView.tsx
│   │   ├── EventCard.tsx
│   │   ├── EventForm.tsx
│   │   ├── ViewSwitcher.tsx
│   │   └── MemberFilter.tsx
│   │
│   ├── family/                # Family management
│   │   ├── FamilyOverview.tsx
│   │   ├── MemberList.tsx
│   │   ├── MemberCard.tsx
│   │   ├── ChildrenList.tsx
│   │   ├── ChildCard.tsx
│   │   ├── InvitationList.tsx
│   │   └── InviteMemberForm.tsx
│   │
│   ├── external-calendars/    # External calendar components
│   │   ├── CalendarList.tsx
│   │   ├── CalendarCard.tsx
│   │   ├── ConnectCalendarFlow.tsx
│   │   └── SyncStatus.tsx
│   │
│   ├── onboarding/           # Onboarding components
│   │   ├── OnboardingWizard.tsx
│   │   ├── WelcomeStep.tsx
│   │   ├── ConnectCalendarStep.tsx
│   │   ├── AddChildrenStep.tsx
│   │   └── InviteMembersStep.tsx
│   │
│   ├── navigation/            # Navigation components
│   │   ├── BottomNav.tsx      # Mobile bottom nav
│   │   ├── SidebarNav.tsx     # Desktop sidebar
│   │   └── NavItem.tsx
│   │
│   ├── layout/                 # Layout components
│   │   ├── AppShell.tsx
│   │   ├── Header.tsx
│   │   └── Container.tsx
│   │
│   └── shared/                # Shared components
│       ├── LoadingSpinner.tsx
│       ├── ErrorMessage.tsx
│       ├── EmptyState.tsx
│       └── FloatingActionButton.tsx
│
├── contexts/                  # React contexts
│   ├── AuthContext.tsx
│   ├── FamilyContext.tsx
│   ├── CalendarContext.tsx
│   └── ExternalCalendarContext.tsx
│
├── hooks/                     # Custom hooks
│   ├── useAuth.ts
│   ├── useFamily.ts
│   ├── useCalendar.ts
│   ├── useEvents.ts
│   └── useExternalCalendars.ts
│
└── lib/
    ├── api/                   # API utilities
    │   ├── client.ts
    │   ├── endpoints.ts
    │   └── errorHandler.ts
    └── utils/
        ├── dateUtils.ts
        ├── validation.ts
        └── format.ts
```

## 13. Key Design Decisions

### 13.1. Mobile-First Rationale

- Primary use case is mobile (family scheduling on-the-go)
- Mobile constraints force simplicity
- Desktop can enhance mobile patterns, not replace them

### 13.2. Bottom Navigation

- Always accessible (no hamburger menu to discover)
- Thumb-friendly zone
- Clear visual hierarchy

### 13.3. Bottom Sheets for Forms

- Native mobile pattern
- Contextual (doesn't block entire screen)
- Easy to dismiss
- Better than modals on small screens

### 13.4. Swipe Gestures

- Natural mobile interaction
- Quick actions (edit/delete)
- Reduces UI clutter

### 13.5. Optimistic Updates

- Immediate feedback
- Better perceived performance
- Rollback on error maintains data integrity

### 13.6. Shadcn/ui Choice

- Accessible by default
- Customizable
- Lightweight
- Mobile-friendly components

## 14. Testing Strategy

### 14.1. Component Testing

- Unit tests for utility functions
- Component tests for UI components
- Snapshot tests for complex components

### 14.2. Integration Testing

- API integration tests
- User flow tests
- State management tests

### 14.3. E2E Testing (Playwright)

- Critical user flows
- Cross-browser testing
- Mobile device testing
- Responsive design testing

### 14.4. Accessibility Testing

- Automated a11y tests
- Screen reader testing
- Keyboard navigation testing
- Color contrast validation

## 15. Future Enhancements (Post-MVP)

- Push notifications for event reminders
- Real-time calendar updates (Supabase Realtime)
- Advanced recurrence patterns
- Calendar sharing (public links)
- Dark mode
- Offline mode with sync
- Widget support (iOS/Android)
- Calendar export (iCal format)
