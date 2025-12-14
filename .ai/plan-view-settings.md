# Implementation Plan: Settings View
## Mobile-First Design

## 1. Overview

**Purpose**: Manage external calendar connections, app preferences, and account settings

**Routes**: 
- `/settings/calendars` - External calendars (default)
- `/settings/preferences` - App preferences
- `/settings/account` - Account settings

**Key Features**:
- Connect external calendars (Google, Microsoft 365)
- View sync status
- Manual sync
- Disconnect calendars
- App preferences
- Account management

## 2. Mobile-First Design Specifications

### 2.1. Settings Layout (Mobile)

```
┌─────────────────────────────────┐
│ [←] Settings                    │ ← Header
├─────────────────────────────────┤
│                                 │
│  External Calendars             │
│  ┌───────────────────────────┐ │
│  │ Google Calendar           │ │
│  │ user@gmail.com            │ │
│  │ Last synced: 15 min ago   │ │
│  │ Status: Active            │ │
│  │ [Sync] [Disconnect]        │ │
│  └───────────────────────────┘ │
│                                 │
│  [+ Connect Calendar]           │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  App Preferences                │
│  ─────────────────────────────  │
│                                 │
│  Account                        │
│  ─────────────────────────────  │
│                                 │
├─────────────────────────────────┤
│ [📅] [👥] [⚙️] [👤]              │ ← Bottom Nav
└─────────────────────────────────┘
```

### 2.2. Responsive Breakpoints

**Mobile (320px - 767px):**
- Single column
- Card-based sections
- Full-width buttons
- Bottom sheets for forms

**Tablet (768px - 1023px):**
- Two-column (optional)
- Larger cards
- Modals for forms

**Desktop (1024px+):**
- Multi-column layout
- Sidebar navigation
- Table view (optional)

## 3. Component Structure

### 3.1. Settings Container

**File**: `src/components/settings/SettingsView.tsx`

**Structure:**
```typescript
<SettingsView>
  <SettingsHeader />
  <SettingsTabs />
  <SettingsContent>
    {renderCurrentTab()}
  </SettingsContent>
</SettingsView>
```

### 3.2. Tab Components

**ExternalCalendarsTab** (`/settings/calendars`)
- Calendar list
- Connect button
- Sync status
- Disconnect action

**PreferencesTab** (`/settings/preferences`)
- View preferences
- Notification settings
- Language settings

**AccountTab** (`/settings/account`) - Admin Only
- Admin account management
- Family management (if admin of multiple families)
- Logout

## 4. User Flow

### 4.1. Connect Calendar Flow

```
1. Navigate to Settings > Calendars
   └─> Tap "Connect Calendar"
       └─> Provider selection (bottom sheet)
           └─> Select Google or Microsoft
               └─> OAuth flow initiated
                   └─> Redirect to provider
                       └─> User authorizes
                           └─> Redirect back
                               └─> Calendar connected
                                   └─> Show in list
```

### 4.2. Sync Calendar Flow

```
1. View calendar in list
   └─> Tap "Sync" button
       └─> Loading state
           └─> API: POST /api/external-calendars/{id}/sync
               ├─> Success: Update last synced time
               └─> Error: Show error message
```

### 4.3. Disconnect Calendar Flow

```
1. View calendar in list
   └─> Tap "Disconnect" button
       └─> Confirmation dialog
           └─> Confirm disconnect
               └─> API: DELETE /api/external-calendars/{id}
                   └─> Remove from list
```

## 5. API Integration

### 5.1. List External Calendars

**Endpoint**: `GET /api/external-calendars`

**Response:**
```typescript
{
  calendars: Array<{
    id: string;
    provider: 'google' | 'microsoft';
    account_email: string;
    last_synced_at: string | null;
    sync_status: 'active' | 'error';
    error_message: string | null;
    created_at: string;
  }>;
}
```

### 5.2. Connect Calendar

**Endpoint**: `POST /api/external-calendars`

**Request:**
```typescript
{
  provider: 'google' | 'microsoft';
}
```

**Response:**
```typescript
{
  authorization_url: string;
  state: string;
}
```

### 5.3. Sync Calendar

**Endpoint**: `POST /api/external-calendars/{calendarId}/sync`

**Response:**
```typescript
{
  synced_at: string;
  events_added: number;
  events_updated: number;
  events_removed: number;
  status: 'success' | 'partial' | 'error';
  error_message: string | null;
}
```

### 5.4. Disconnect Calendar

**Endpoint**: `DELETE /api/external-calendars/{calendarId}`

## 6. Component Details

### 6.1. Calendar Card

**Structure:**
```typescript
<CalendarCard calendar={calendar} onSync={handleSync} onDisconnect={handleDisconnect}>
  <ProviderIcon />
  <CalendarInfo>
    <AccountEmail />
    <LastSynced />
    <SyncStatus />
  </CalendarInfo>
  <CalendarActions>
    <SyncButton />
    <DisconnectButton />
  </CalendarActions>
</CalendarCard>
```

**States:**
- **Active**: Green status, sync button enabled
- **Error**: Red status, error message, retry option
- **Syncing**: Loading spinner, disabled buttons

### 6.2. Connect Calendar Flow

**Provider Selection (Bottom Sheet):**
```
┌─────────────────────────────────┐
│ Connect Calendar                │
├─────────────────────────────────┤
│                                 │
│  Select a provider:             │
│                                 │
│  ┌───────────────────────────┐ │
│  │ [Google Icon]              │ │
│  │ Google Calendar            │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ [Microsoft Icon]          │ │
│  │ Microsoft 365             │ │
│  └───────────────────────────┘ │
│                                 │
│  [Cancel]                       │
└─────────────────────────────────┘
```

### 6.3. Sync Status Indicator

**Global Sync Button (Header):**
- Sync all calendars
- Shows sync progress
- Rate limit indicator

**Per-Calendar Status:**
- Last synced timestamp
- Sync status badge
- Error message (if any)

### 6.4. Preferences Section

**View Preferences:**
- Default calendar view
- Date format
- Time format
- Timezone

**Notification Preferences:**
- Event reminders
- Conflict alerts
- Invitation notifications

### 6.5. Account Section (Admin Only)

**Note**: This section is only visible to family admins. Regular members should use the Profile view for personal account management.

**Admin Account Management:**
- Full name
- Email
- Avatar
- Edit profile link

**Family Management:**
- List of families where user is admin
- Switch between admin families (if multiple)
- Family settings (future)

**Logout:**
- Logout button
- Confirmation dialog

## 7. State Management

### 7.1. External Calendar Context

**File**: `src/contexts/ExternalCalendarContext.tsx`

```typescript
interface ExternalCalendarState {
  calendars: ExternalCalendar[];
  syncStatus: Record<string, 'idle' | 'syncing' | 'success' | 'error'>;
  isLoading: boolean;
  error: Error | null;
}

interface ExternalCalendarContextType {
  state: ExternalCalendarState;
  loadCalendars: () => Promise<void>;
  connectCalendar: (provider: 'google' | 'microsoft') => Promise<void>;
  syncCalendar: (calendarId: string) => Promise<void>;
  syncAll: () => Promise<void>;
  disconnectCalendar: (calendarId: string) => Promise<void>;
}
```

### 7.2. React Query Integration

```typescript
export function useExternalCalendars() {
  return useQuery({
    queryKey: ['external-calendars'],
    queryFn: fetchExternalCalendars,
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}
```

## 8. Mobile-Specific Features

### 8.1. Bottom Sheets

**Forms:**
- Provider selection
- OAuth handling
- Error messages

**Behavior:**
- Swipe down to dismiss
- Full height for forms

### 8.2. Sync Feedback

**Visual Indicators:**
- Loading spinner during sync
- Progress bar (if available)
- Success/error toasts

**Haptic Feedback:**
- Sync start
- Sync complete
- Sync error

### 8.3. Pull to Refresh

**Calendar List:**
- Pull down to refresh
- Triggers sync for all calendars
- Visual feedback

## 9. Error Handling

### 9.1. Sync Errors

**Display:**
- Error message in calendar card
- Retry button
- Error details (expandable)

**Common Errors:**
- Token expired: Auto-refresh attempt
- Rate limit: Show retry timer
- Network error: Retry option
- Provider error: Show provider message

### 9.2. Connection Errors

**OAuth Errors:**
- User cancelled: Silent failure
- Network error: Retry option
- Invalid state: Restart flow

## 10. Accessibility

### 10.1. WCAG AA Compliance

- **Keyboard Navigation**: All actions accessible
- **Screen Reader**: Announce sync status
- **Focus Management**: Focus on new items
- **ARIA Labels**: Status announcements

### 10.2. ARIA Implementation

```tsx
<div role="status" aria-live="polite" aria-atomic="true">
  {syncStatus === 'syncing' && 'Syncing calendar...'}
  {syncStatus === 'success' && 'Calendar synced successfully'}
  {syncStatus === 'error' && 'Sync failed'}
</div>
```

## 11. Implementation Checklist

### Phase 1: Settings Structure
- [ ] Create SettingsView component
- [ ] Add settings tabs
- [ ] Implement tab navigation
- [ ] Add settings header

### Phase 2: External Calendars List
- [ ] Create ExternalCalendarsTab component
- [ ] Create CalendarCard component
- [ ] Display calendar list
- [ ] Show sync status

### Phase 3: Connect Calendar
- [ ] Create ConnectCalendarFlow component
- [ ] Add provider selection
- [ ] Implement OAuth flow
- [ ] Handle callback

### Phase 4: Sync Functionality
- [ ] Add sync button
- [ ] Implement sync API call
- [ ] Show sync progress
- [ ] Update sync status

### Phase 5: Disconnect Calendar
- [ ] Add disconnect button
- [ ] Implement confirmation dialog
- [ ] Connect to API
- [ ] Update list

### Phase 6: Preferences
- [ ] Create PreferencesTab component
- [ ] Add view preferences
- [ ] Add notification preferences
- [ ] Persist preferences

### Phase 7: Account (Admin Only)
- [ ] Create AccountTab component
- [ ] Add admin-only check (hide for non-admins)
- [ ] Display admin account management
- [ ] Show admin family memberships
- [ ] Add logout

### Phase 8: State Management
- [ ] Create ExternalCalendarContext
- [ ] Integrate React Query
- [ ] Implement optimistic updates
- [ ] Add error handling

### Phase 9: Mobile Optimization
- [ ] Optimize touch targets
- [ ] Add bottom sheets
- [ ] Implement pull to refresh
- [ ] Test on devices

### Phase 10: Polish
- [ ] Add loading states
- [ ] Improve error handling
- [ ] Add accessibility features
- [ ] Final testing

## 12. File Structure

```
src/
├── pages/
│   └── settings/
│       ├── calendars.astro
│       ├── preferences.astro
│       └── account.astro
├── components/
│   └── settings/
│       ├── SettingsView.tsx
│       ├── SettingsTabs.tsx
│       ├── ExternalCalendarsTab.tsx
│       ├── CalendarCard.tsx
│       ├── ConnectCalendarFlow.tsx
│       ├── SyncStatus.tsx
│       ├── PreferencesTab.tsx
│       └── AccountTab.tsx
├── contexts/
│   └── ExternalCalendarContext.tsx
└── hooks/
    ├── useExternalCalendars.ts
    └── useCalendarSync.ts
```

## 13. Success Criteria

- [ ] User can connect calendars
- [ ] User can sync calendars
- [ ] User can disconnect calendars
- [ ] Sync status displays correctly
- [ ] Errors are handled gracefully
- [ ] Mobile experience is smooth
- [ ] OAuth flow works
- [ ] Accessibility requirements met

