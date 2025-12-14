# User Journey Maps - Home Planner MVP

## Mobile-First User Experience

## 1. First-Time User Journey

### Journey: New User Onboarding

**User**: Sarah, a parent who wants to organize her family's schedule

**Goal**: Sign up and set up family calendar

**Touchpoints & Interactions:**

```
┌─────────────────────────────────────────┐
│ 1. Landing Page                        │
│    - "Sign in with Google" button      │
│    - Clean, simple design              │
│    - Mobile-optimized button (48px)    │
└──────────────┬──────────────────────────┘
               │ Tap "Sign in with Google"
               ▼
┌─────────────────────────────────────────┐
│ 2. Google OAuth                         │
│    - Redirect to Google                │
│    - User authenticates                │
│    - Redirects back to app             │
└──────────────┬──────────────────────────┘
               │ OAuth callback
               ▼
┌─────────────────────────────────────────┐
│ 3. Onboarding Wizard - Step 1          │
│    - Welcome message                   │
│    - "Create your family" heading      │
│    - Family name input (48px height)   │
│    - "Next" button (primary)           │
│    - "Skip for now" link (secondary)   │
└──────────────┬──────────────────────────┘
               │ Enter family name, tap "Next"
               ▼
┌─────────────────────────────────────────┐
│ 4. Onboarding Wizard - Step 2           │
│    - "Connect your calendar" heading    │
│    - Google Calendar card (tap to connect)│
│    - Microsoft 365 card (tap to connect)│
│    - "Skip for now" link                │
│    - Progress indicator (2/4)          │
└──────────────┬──────────────────────────┘
               │ Tap "Google Calendar"
               ▼
┌─────────────────────────────────────────┐
│ 5. OAuth Flow (Google Calendar)         │
│    - Redirect to Google                │
│    - Grant permissions                 │
│    - Redirect back                     │
│    - Success message                    │
└──────────────┬──────────────────────────┘
               │ Calendar connected
               ▼
┌─────────────────────────────────────────┐
│ 6. Onboarding Wizard - Step 3           │
│    - "Add your children" heading        │
│    - Empty state: "No children added"   │
│    - "Add Child" button                 │
│    - Child name input (appears on tap)  │
│    - "Add" button                       │
│    - Children list (cards)              │
│    - "Next" button                      │
│    - Progress indicator (3/4)           │
└──────────────┬──────────────────────────┘
               │ Add children, tap "Next"
               ▼
┌─────────────────────────────────────────┐
│ 7. Onboarding Wizard - Step 4           │
│    - "Invite family members" heading   │
│    - Email input                        │
│    - "Send Invitation" button           │
│    - Invitations list                   │
│    - "Complete Setup" button            │
│    - Progress indicator (4/4)           │
└──────────────┬──────────────────────────┘
               │ Send invitations, tap "Complete"
               ▼
┌─────────────────────────────────────────┐
│ 8. Calendar View (Default Landing)      │
│    - Week view (default)                │
│    - Events from Google Calendar        │
│    - Bottom navigation visible          │
│    - Floating action button (+ icon)   │
│    - Success toast: "Welcome!"          │
└─────────────────────────────────────────┘
```

**Emotional Journey:**

- **Curiosity** → Landing page
- **Trust** → Google OAuth (familiar)
- **Guidance** → Onboarding steps
- **Progress** → Each step completion
- **Confidence** → Calendar view with events

**Pain Points & Solutions:**

- **Pain**: Too many steps
  - **Solution**: Skip options, progress indicator
- **Pain**: Unclear what to do next
  - **Solution**: Clear headings, button labels
- **Pain**: OAuth confusion
  - **Solution**: Clear messaging, loading states

## 2. Daily Usage Journey

### Journey: Create a New Event

**User**: Sarah, wants to add piano lesson for her child

**Goal**: Quickly add a blocker event to the calendar

**Touchpoints & Interactions:**

```
┌─────────────────────────────────────────┐
│ 1. Calendar View (Week View)            │
│    - Current week displayed            │
│    - Existing events visible           │
│    - Floating action button (+ icon)   │
│    - Bottom nav: Calendar active       │
└──────────────┬──────────────────────────┘
               │ Tap floating action button
               ▼
┌─────────────────────────────────────────┐
│ 2. Event Form (Bottom Sheet)            │
│    ┌─────────────────────────────────┐ │
│    │ [Title Input]                   │ │
│    │ "Piano Lesson"                   │ │
│    ├─────────────────────────────────┤ │
│    │ [Date Picker]                   │ │
│    │ Today, Jan 15                   │ │
│    ├─────────────────────────────────┤ │
│    │ [Time Picker]                   │ │
│    │ 3:00 PM - 4:00 PM               │ │
│    ├─────────────────────────────────┤ │
│    │ [Participants]                  │ │
│    │ ☑ Emma (Child)                 │ │
│    │ ☐ Sarah (You)                  │ │
│    ├─────────────────────────────────┤ │
│    │ [Event Type]                    │ │
│    │ ○ Elastic  ● Blocker            │ │
│    ├─────────────────────────────────┤ │
│    │ [Recurrence]                    │ │
│    │ ○ One-time  ● Weekly            │ │
│    │ End date: [Picker]              │ │
│    ├─────────────────────────────────┤ │
│    │ [Cancel] [Save]                 │ │
│    └─────────────────────────────────┘ │
└──────────────┬──────────────────────────┘
               │ Fill form, tap "Save"
               ▼
┌─────────────────────────────────────────┐
│ 3. Validation (If Blocker)              │
│    - Loading spinner                   │
│    - API: POST /api/events/validate    │
│    - Check for conflicts               │
└──────────────┬──────────────────────────┘
               │ No conflicts found
               ▼
┌─────────────────────────────────────────┐
│ 4. Event Created                        │
│    - Bottom sheet closes                │
│    - Optimistic update (event appears) │
│    - Success toast: "Event created"     │
│    - Calendar refreshes                │
│    - Event visible on calendar          │
└─────────────────────────────────────────┘
```

**Alternative Path: Conflict Detected**

```
┌─────────────────────────────────────────┐
│ 3b. Conflict Warning (Inline)           │
│    ┌─────────────────────────────────┐ │
│    │ ⚠️ Conflict detected            │ │
│    │ This event conflicts with:     │ │
│    │ • "Doctor Appointment"         │ │
│    │   3:00 PM - 3:30 PM           │ │
│    │                                │ │
│    │ [Adjust Time] [Save Anyway]   │ │
│    └─────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Emotional Journey:**

- **Efficiency** → Quick access via FAB
- **Clarity** → Simple form
- **Confidence** → Conflict detection
- **Satisfaction** → Event appears immediately

**Pain Points & Solutions:**

- **Pain**: Form too long
  - **Solution**: Collapsible sections, smart defaults
- **Pain**: Conflict confusion
  - **Solution**: Clear conflict message, adjust option
- **Pain**: Slow save
  - **Solution**: Optimistic updates

## 3. Calendar Sync Journey

### Journey: Sync External Calendar

**User**: Sarah, wants to refresh her Google Calendar

**Goal**: Get latest events from Google Calendar

**Touchpoints & Interactions:**

```
┌─────────────────────────────────────────┐
│ 1. Settings > External Calendars        │
│    - List of connected calendars        │
│    - Google Calendar card               │
│    │ Last synced: 15 min ago          │
│    │ Status: Active                    │
│    │ [Sync] [Disconnect]               │
└──────────────┬──────────────────────────┘
               │ Tap "Sync" button
               ▼
┌─────────────────────────────────────────┐
│ 2. Sync in Progress                     │
│    - Button shows spinner               │
│    - "Syncing..." text                  │
│    - Disabled state                     │
│    - API: POST /api/external-calendars/ │
│      {calendarId}/sync                  │
└──────────────┬──────────────────────────┘
               │ Sync completes
               ▼
┌─────────────────────────────────────────┐
│ 3. Sync Complete                        │
│    - Button returns to normal           │
│    - "Last synced: Just now"            │
│    - Success toast:                     │
│      "3 new events added"               │
│    - Calendar view updates              │
└─────────────────────────────────────────┘
```

**Alternative Path: Sync Error**

```
┌─────────────────────────────────────────┐
│ 3b. Sync Error                          │
│    - Button returns to normal           │
│    - Status: Error                      │
│    - Error message:                     │
│      "Sync failed. Please try again."   │
│    - "Retry" button                    │
└─────────────────────────────────────────┘
```

**Emotional Journey:**

- **Control** → Manual sync option
- **Feedback** → Clear status
- **Relief** → Events updated

## 4. Family Management Journey

### Journey: Invite Family Member

**User**: Sarah, wants to invite her partner

**Goal**: Add partner to family calendar

**Touchpoints & Interactions:**

```
┌─────────────────────────────────────────┐
│ 1. Family > Members                     │
│    - Current members list              │
│    - "Invite Member" button (primary)   │
│    - Bottom nav: Family active         │
└──────────────┬──────────────────────────┘
               │ Tap "Invite Member"
               ▼
┌─────────────────────────────────────────┐
│ 2. Invite Form (Bottom Sheet)           │
│    ┌─────────────────────────────────┐ │
│    │ Invite Family Member            │ │
│    ├─────────────────────────────────┤ │
│    │ Email address                   │ │
│    │ [Input field]                   │ │
│    │ "partner@example.com"           │ │
│    ├─────────────────────────────────┤ │
│    │ They will receive an email       │
│    │ invitation to join.             │
│    ├─────────────────────────────────┤ │
│    │ [Cancel] [Send Invitation]      │ │
│    └─────────────────────────────────┘ │
└──────────────┬──────────────────────────┘
               │ Enter email, tap "Send"
               ▼
┌─────────────────────────────────────────┐
│ 3. Validation & Sending                 │
│    - Email format validation            │
│    - Loading state                      │
│    - API: POST /api/families/{id}/     │
│      invitations                        │
└──────────────┬──────────────────────────┘
               │ Invitation sent
               ▼
┌─────────────────────────────────────────┐
│ 4. Invitation Sent                      │
│    - Bottom sheet closes                │
│    - Success toast:                    │
│      "Invitation sent to partner@..."  │
│    - Invitation appears in list         │
│    - Status: Pending                    │
│    - Expires: 7 days                    │
└─────────────────────────────────────────┘
```

**Emotional Journey:**

- **Intention** → Want to collaborate
- **Simplicity** → Easy invite process
- **Confirmation** → Clear success message

## 5. Event Conflict Resolution Journey

### Journey: Resolve Blocker Event Conflict

**User**: Sarah, tries to create conflicting blocker event

**Goal**: Understand and resolve conflict

**Touchpoints & Interactions:**

```
┌─────────────────────────────────────────┐
│ 1. Create Event (Blocker)              │
│    - Fill event form                   │
│    - Set as "Blocker"                  │
│    - Time: 3:00 PM - 4:00 PM           │
│    - Participant: Emma                 │
│    - Tap "Save"                         │
└──────────────┬──────────────────────────┘
               │ Validation check
               ▼
┌─────────────────────────────────────────┐
│ 2. Conflict Detected                    │
│    ┌─────────────────────────────────┐ │
│    │ ⚠️ Conflict Detected            │ │
│    ├─────────────────────────────────┤ │
│    │ This blocker event conflicts    │ │
│    │ with an existing blocker event: │ │
│    │                                  │ │
│    │ 📅 Doctor Appointment            │ │
│    │   3:00 PM - 3:30 PM             │ │
│    │   Participants: Emma            │ │
│    │                                  │ │
│    │ [Adjust Time] [Cancel]          │ │
│    └─────────────────────────────────┘ │
└──────────────┬──────────────────────────┘
               │ Tap "Adjust Time"
               ▼
┌─────────────────────────────────────────┐
│ 3. Adjust Time                          │
│    - Time picker opens                  │
│    - Change to 4:00 PM - 5:00 PM       │
│    - Tap "Save"                         │
└──────────────┬──────────────────────────┘
               │ No conflict
               ▼
┌─────────────────────────────────────────┐
│ 4. Event Created                        │
│    - Success toast                      │
│    - Event appears on calendar          │
│    - No overlap with other events       │
└─────────────────────────────────────────┘
```

**Emotional Journey:**

- **Frustration** → Conflict detected
- **Clarity** → Clear conflict message
- **Control** → Easy resolution
- **Satisfaction** → Event saved

## 6. Calendar View Switching Journey

### Journey: Switch Between Calendar Views

**User**: Sarah, wants to see monthly overview

**Goal**: Change from week to month view

**Touchpoints & Interactions:**

```
┌─────────────────────────────────────────┐
│ 1. Week View (Current)                  │
│    - View switcher at top              │
│    │ [Day] [Week●] [Month] [Agenda] │ │
│    - Week grid visible                  │
└──────────────┬──────────────────────────┘
               │ Tap "Month"
               ▼
┌─────────────────────────────────────────┐
│ 2. Loading State                        │
│    - Skeleton grid appears              │
│    - API: GET /api/events              │
│      ?view=month&start_date=...        │
└──────────────┬──────────────────────────┘
               │ Data loaded
               ▼
┌─────────────────────────────────────────┐
│ 3. Month View                           │
│    - Month grid displayed               │
│    - Events as dots/indicators          │
│    - Current date highlighted           │
│    - View switcher: Month active        │
└─────────────────────────────────────────┘
```

**Mobile-Specific: Swipe Gesture**

```
┌─────────────────────────────────────────┐
│ Alternative: Swipe Left/Right          │
│    - Swipe left: Next month            │
│    - Swipe right: Previous month        │
│    - Haptic feedback                    │
└─────────────────────────────────────────┘
```

**Emotional Journey:**

- **Desire** → Want different perspective
- **Smoothness** → Quick transition
- **Satisfaction** → View changed

## 7. Error Recovery Journey

### Journey: Handle Network Error

**User**: Sarah, loses connection while creating event

**Goal**: Recover from error and save event

**Touchpoints & Interactions:**

```
┌─────────────────────────────────────────┐
│ 1. Create Event                         │
│    - Fill event form                   │
│    - Tap "Save"                         │
└──────────────┬──────────────────────────┘
               │ Network request fails
               ▼
┌─────────────────────────────────────────┐
│ 2. Error Detected                       │
│    - Optimistic update rolled back      │
│    - Error toast appears:                │
│      "Connection failed. Please try      │
│       again."                           │
│    - [Retry] button in toast            │
└──────────────┬──────────────────────────┘
               │ Connection restored
               │ Tap "Retry"
               ▼
┌─────────────────────────────────────────┐
│ 3. Retry Save                           │
│    - Loading state                      │
│    - API request retried                │
└──────────────┬──────────────────────────┘
               │ Success
               ▼
┌─────────────────────────────────────────┐
│ 4. Event Saved                          │
│    - Success toast                      │
│    - Event appears on calendar          │
└─────────────────────────────────────────┘
```

**Emotional Journey:**

- **Frustration** → Error occurred
- **Hope** → Retry option available
- **Relief** → Success on retry

## 8. Mobile-Specific Interactions

### Swipe Gestures

**Event Card Swipe:**

- **Swipe Left**: Edit event
- **Swipe Right**: Delete event
- **Haptic Feedback**: On swipe start

**Calendar Navigation:**

- **Swipe Left**: Next period (day/week/month)
- **Swipe Right**: Previous period
- **Pull Down**: Refresh/trigger sync

### Touch Interactions

**Long Press:**

- **Event Card**: Quick actions menu
- **Date Cell**: Create event for that date

**Double Tap:**

- **Event Card**: View full details
- **Date Cell**: Switch to day view

### Bottom Sheet Behavior

**Swipe Down:**

- **Partial**: Dismiss bottom sheet
- **Full**: Close and discard changes

**Swipe Up:**

- **Expand**: Full screen form (if needed)

## 9. Accessibility Journey

### Journey: Screen Reader User

**User**: Alex, uses VoiceOver on iPhone

**Goal**: Create an event using screen reader

**Touchpoints & Interactions:**

```
┌─────────────────────────────────────────┐
│ 1. Calendar View                        │
│    - VoiceOver announces:               │
│      "Calendar view, week of January"   │
│    - Navigate with swipe gestures       │
└──────────────┬──────────────────────────┘
               │ Double tap FAB
               ▼
┌─────────────────────────────────────────┐
│ 2. Event Form Opens                     │
│    - VoiceOver: "Create event form"     │
│    - Focus on title input               │
│    - VoiceOver: "Title, text field"    │
└──────────────┬──────────────────────────┘
               │ Type title, navigate next
               ▼
┌─────────────────────────────────────────┐
│ 3. Form Navigation                      │
│    - Swipe to next field                │
│    - VoiceOver announces each field     │
│    - Clear labels for all inputs        │
│    - Error messages announced           │
└──────────────┬──────────────────────────┘
               │ Complete form, save
               ▼
┌─────────────────────────────────────────┐
│ 4. Success Feedback                      │
│    - VoiceOver: "Event created"         │
│    - Focus returns to calendar          │
│    - Event announced in list            │
└─────────────────────────────────────────┘
```

**Key Accessibility Features:**

- Semantic HTML
- ARIA labels
- Focus management
- Screen reader announcements
- Keyboard navigation support

## 10. Performance Journey

### Journey: Fast Calendar Load

**User**: Sarah, opens app on slow 3G

**Goal**: See calendar quickly despite slow network

**Touchpoints & Interactions:**

```
┌─────────────────────────────────────────┐
│ 1. App Launch                           │
│    - Authentication check (cached)      │
│    - Show skeleton screen immediately   │
│    - No blank screen                    │
└──────────────┬──────────────────────────┘
               │ API request in background
               ▼
┌─────────────────────────────────────────┐
│ 2. Progressive Loading                  │
│    - Skeleton calendar grid visible     │
│    - Events load incrementally          │
│    - Cached data shown first            │
│    - Fresh data updates when ready      │
└──────────────┬──────────────────────────┘
               │ All data loaded
               ▼
┌─────────────────────────────────────────┐
│ 3. Full Calendar View                   │
│    - All events displayed               │
│    - Smooth transition                  │
│    - No layout shift                    │
└─────────────────────────────────────────┘
```

**Performance Optimizations:**

- Skeleton screens
- Cached authentication
- Optimistic updates
- Incremental loading
- Service worker caching

## 11. Journey Summary Metrics

### Success Metrics per Journey

**Onboarding Journey:**

- Completion rate: > 80%
- Time to complete: < 5 minutes
- Skip rate: < 30%

**Event Creation:**

- Success rate: > 95%
- Time to create: < 30 seconds
- Conflict resolution: < 10 seconds

**Calendar Sync:**

- Sync success rate: > 99%
- Sync time: < 5 seconds
- User satisfaction: High

**Family Management:**

- Invitation acceptance: > 70%
- Time to invite: < 1 minute

### Mobile-Specific Metrics

- Touch target accuracy: > 95%
- Swipe gesture recognition: > 90%
- Bottom sheet usability: High satisfaction
- Performance on 3G: < 3s load time
