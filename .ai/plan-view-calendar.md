# Implementation Plan: Calendar Views
## Mobile-First Design

## 1. Overview

**Purpose**: Display family calendar events in multiple views (Day, Week, Month, Agenda)

**Routes**: 
- `/calendar/day` - Day view
- `/calendar/week` - Week view (default)
- `/calendar/month` - Month view
- `/calendar/agenda` - Agenda view

**Entry Point**: Default landing page after authentication

**Key Features**:
- Multiple view types
- Event filtering by participants
- Event creation/editing
- External calendar sync display
- Conflict visualization

## 2. Mobile-First Design Specifications

### 2.1. Layout (Mobile 320px - 767px)

**Calendar Container:**
```
┌─────────────────────────────────┐
│ [☰] Week View  [🔍] [🔄] [⚙️]   │ ← Header
├─────────────────────────────────┤
│ [Day][Week●][Month][Agenda]     │ ← View Switcher
├─────────────────────────────────┤
│ [← Jan 15]        [Jan 21 →]    │ ← Date Navigation
├─────────────────────────────────┤
│                                 │
│    [Calendar Content Area]       │
│                                 │
│                                 │
├─────────────────────────────────┤
│ [📅] [👥] [⚙️] [👤]              │ ← Bottom Nav
└─────────────────────────────────┘
```

**Floating Action Button:**
- Fixed position: bottom-right
- Only visible on calendar views
- Hidden when bottom sheet open

### 2.2. Responsive Breakpoints

**Mobile (320px - 767px):**
- Single column layout
- Horizontal scroll for week view
- Vertical timeline for day view
- Grid layout for month view
- List layout for agenda view

**Tablet (768px - 1023px):**
- Wider columns
- More visible events
- Side panel for event details

**Desktop (1024px+):**
- Multi-column layouts
- Sidebar navigation
- Hover interactions
- Keyboard shortcuts

## 3. Component Structure

### 3.1. Main Calendar Component

**File**: `src/components/calendar/CalendarView.tsx`

**Structure:**
```typescript
<CalendarView>
  <CalendarHeader />
  <ViewSwitcher />
  <DateNavigation />
  <MemberFilter />
  <CalendarContent>
    {renderCurrentView()}
  </CalendarContent>
  <FloatingActionButton />
</CalendarView>
```

### 3.2. View Components

**DayView** (`/calendar/day`)
- Vertical timeline (6am - 11pm)
- Hour slots with events
- All-day section at top
- Multi-day banner

**WeekView** (`/calendar/week`)
- Horizontal scrollable days
- Day columns with events
- Current day highlighted
- Swipe between weeks

**MonthView** (`/calendar/month`)
- Grid layout (7 columns)
- Date cells with event indicators
- Tap cell to view day
- Current date highlighted

**AgendaView** (`/calendar/agenda`)
- List of upcoming events
- Grouped by date
- Event cards with details
- Infinite scroll

### 3.3. Shared Components

**EventCard**
- Event title, time, participants
- Type indicator (Elastic/Blocker)
- Synced event indicator
- Swipe actions (mobile)

**ViewSwitcher**
- Segmented control (mobile)
- Tabs (desktop)
- Current view highlighted

**DateNavigation**
- Previous/Next buttons
- Current date display
- Date picker (optional)

**MemberFilter**
- Collapsible accordion (mobile)
- Checkbox list
- Always visible (desktop)

## 4. User Flow

### 4.1. View Calendar

```
1. Calendar View Loads
   └─> Fetch events for date range
       └─> Display events in current view
           └─> User can:
               ├─> Switch views
               ├─> Navigate dates
               ├─> Filter by members
               ├─> Tap event to view details
               └─> Tap FAB to create event
```

### 4.2. Switch Views

```
Current View
└─> Tap view switcher
    └─> Loading state
        └─> Fetch events for new view
            └─> Display new view
```

### 4.3. Filter Events

```
Calendar View
└─> Tap filter toggle
    └─> Member filter opens
        └─> Select/deselect members
            └─> Events update instantly
```

### 4.4. Navigate Dates

```
Calendar View
└─> Tap previous/next
    └─> Fetch events for new date range
        └─> Update calendar display
```

## 5. API Integration

### 5.1. Fetch Events

**Endpoint**: `GET /api/events`

**Query Parameters:**
```typescript
{
  family_id: string;
  start_date: string; // ISO8601 date
  end_date: string;   // ISO8601 date
  participant_ids?: string[]; // Optional filter
  event_type?: 'elastic' | 'blocker';
  include_synced?: boolean; // Default: true
  view?: 'day' | 'week' | 'month' | 'agenda';
  limit?: number; // Default: 100
  offset?: number; // Default: 0
}
```

**Implementation:**
```typescript
async function fetchEvents(params: EventQueryParams) {
  const queryString = new URLSearchParams({
    family_id: params.familyId,
    start_date: params.startDate,
    end_date: params.endDate,
    ...(params.participantIds && {
      participant_ids: params.participantIds.join(',')
    }),
    ...(params.eventType && { event_type: params.eventType }),
    include_synced: params.includeSynced ? 'true' : 'false',
    view: params.view || 'week',
  });

  const response = await apiClient.get(`/api/events?${queryString}`);
  return response.data;
}
```

### 5.2. Date Range Calculation

**By View:**
```typescript
function getDateRange(view: string, currentDate: Date) {
  switch (view) {
    case 'day':
      return {
        start: startOfDay(currentDate),
        end: endOfDay(currentDate),
      };
    case 'week':
      return {
        start: startOfWeek(currentDate),
        end: endOfWeek(currentDate),
      };
    case 'month':
      return {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
      };
    case 'agenda':
      return {
        start: startOfDay(currentDate),
        end: addDays(currentDate, 30), // Next 30 days
      };
  }
}
```

## 6. State Management

### 6.1. Calendar Context

**File**: `src/contexts/CalendarContext.tsx`

```typescript
interface CalendarState {
  events: Event[];
  view: 'day' | 'week' | 'month' | 'agenda';
  currentDate: Date;
  dateRange: { start: Date; end: Date };
  filters: {
    participantIds: string[];
    eventType?: 'elastic' | 'blocker';
  };
  isLoading: boolean;
  error: Error | null;
}

interface CalendarContextType {
  state: CalendarState;
  setView: (view: CalendarState['view']) => void;
  setCurrentDate: (date: Date) => void;
  setFilters: (filters: Partial<CalendarState['filters']>) => void;
  loadEvents: () => Promise<void>;
  refreshEvents: () => Promise<void>;
  createEvent: (event: CreateEventData) => Promise<void>;
  updateEvent: (id: string, event: UpdateEventData) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}
```

### 6.2. React Query Integration

**File**: `src/hooks/useCalendarEvents.ts`

```typescript
export function useCalendarEvents(
  familyId: string,
  dateRange: { start: Date; end: Date },
  filters: EventFilters
) {
  return useQuery({
    queryKey: ['events', familyId, dateRange, filters],
    queryFn: () => fetchEvents({ familyId, dateRange, filters }),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}
```

## 7. View-Specific Implementation

### 7.1. Day View

**Layout:**
```
┌─────────────────────────────────┐
│ All-Day Events                 │
│ [Event 1] [Event 2]            │
├─────────────────────────────────┤
│ 6:00 AM                        │
│ ┌─────────────────────────────┐ │
│ │ Event Title                 │ │
│ │ 6:00 AM - 7:00 AM          │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ 7:00 AM                        │
│                                 │
├─────────────────────────────────┤
│ 8:00 AM                        │
│ ┌─────────────────────────────┐ │
│ │ Event Title                 │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Features:**
- Vertical timeline (6am - 11pm)
- Hour slots (30min or 1hr intervals)
- Event cards positioned by time
- All-day events at top
- Current time indicator

**Mobile Optimizations:**
- Scrollable timeline
- Tap event to view details
- Swipe to previous/next day

### 7.2. Week View

**Layout:**
```
┌─────────────────────────────────┐
│     Mon  Tue  Wed  Thu  Fri    │
├─────────────────────────────────┤
│ 6AM │    │    │    │    │      │
│     │    │    │    │    │      │
│ 7AM │[E] │    │    │    │      │
│     │    │    │    │    │      │
│ 8AM │    │[E] │    │    │      │
│     │    │    │    │    │      │
└─────────────────────────────────┘
```

**Features:**
- Horizontal scrollable days
- Day columns with time slots
- Events positioned by time
- Current day highlighted
- Swipe between weeks

**Mobile Optimizations:**
- Horizontal scroll
- Tap day header to jump to day view
- Swipe left/right for navigation

### 7.3. Month View

**Layout:**
```
┌─────────────────────────────────┐
│  S  M  T  W  T  F  S          │
├─────────────────────────────────┤
│     1  2  3  4  5  6          │
│  7  8  9 10 11 12 13          │
│ 14 15●16 17 18 19 20          │
│ 21 22 23 24 25 26 27          │
│ 28 29 30 31                    │
└─────────────────────────────────┘
```

**Features:**
- 7-column grid
- Date cells with event indicators
- Dots for multiple events
- Current date highlighted
- Tap cell to view day

**Mobile Optimizations:**
- Full-width grid
- Large touch targets
- Swipe to previous/next month

### 7.4. Agenda View

**Layout:**
```
┌─────────────────────────────────┐
│ Today, Jan 15                  │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 3:00 PM                     │ │
│ │ Piano Lesson                │ │
│ │ Emma                        │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 5:00 PM                     │ │
│ │ Doctor Appointment          │ │
│ │ Sarah                       │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ Tomorrow, Jan 16               │
├─────────────────────────────────┤
│ [More events...]               │
└─────────────────────────────────┘
```

**Features:**
- Chronological list
- Grouped by date
- Event cards with details
- Infinite scroll
- Upcoming events only

**Mobile Optimizations:**
- Full-width cards
- Pull to refresh
- Infinite scroll loading

## 8. Event Card Component

### 8.1. Mobile Event Card

**Structure:**
```typescript
<EventCard
  event={event}
  onTap={handleEventTap}
  onSwipeLeft={handleEdit}
  onSwipeRight={handleDelete}
>
  <EventHeader>
    <EventTime />
    <EventTypeIndicator />
  </EventHeader>
  <EventTitle />
  <EventParticipants />
  <SyncedIndicator /> {/* If synced */}
</EventCard>
```

**Visual Design:**
- **Blocker Events**: Solid border, filled background
- **Elastic Events**: Dashed border, light background
- **Synced Events**: Different color/shadow
- **Conflicts**: Red border/warning

### 8.2. Swipe Actions (Mobile)

**Swipe Left**: Edit event
- Reveals edit button
- Haptic feedback

**Swipe Right**: Delete event
- Reveals delete button
- Confirmation required

## 9. Mobile-Specific Features

### 9.1. Touch Interactions

**Long Press:**
- Event card: Quick actions menu
- Date cell: Create event for that date

**Double Tap:**
- Event card: View full details
- Date cell: Switch to day view

**Swipe:**
- Left/Right: Navigate dates (week/month view)
- Pull down: Refresh events

### 9.2. Performance

**Optimizations:**
- Virtual scrolling for long lists
- Lazy load events outside viewport
- Debounce filter changes
- Cache date ranges

## 10. Accessibility

### 10.1. WCAG AA Compliance

- **Keyboard Navigation**: Arrow keys to navigate dates
- **Screen Reader**: Announce events, dates
- **Focus Management**: Focus on current date
- **Color Contrast**: Event indicators meet 4.5:1

### 10.2. ARIA Labels

```tsx
<div role="application" aria-label="Calendar view">
  <div role="tablist" aria-label="Calendar view switcher">
    <button role="tab" aria-selected={view === 'week'}>
      Week
    </button>
  </div>
  <div role="grid" aria-label="Calendar events">
    {events.map(event => (
      <div role="gridcell" aria-label={event.title}>
        {event.title}
      </div>
    ))}
  </div>
</div>
```

## 11. Implementation Checklist

### Phase 1: Calendar Structure
- [ ] Create CalendarView component
- [ ] Implement view switcher
- [ ] Add date navigation
- [ ] Create header component

### Phase 2: Day View
- [ ] Create DayView component
- [ ] Implement timeline layout
- [ ] Add event positioning
- [ ] Handle all-day events

### Phase 3: Week View
- [ ] Create WeekView component
- [ ] Implement day columns
- [ ] Add horizontal scroll
- [ ] Handle event overlaps

### Phase 4: Month View
- [ ] Create MonthView component
- [ ] Implement grid layout
- [ ] Add event indicators
- [ ] Handle date navigation

### Phase 5: Agenda View
- [ ] Create AgendaView component
- [ ] Implement list layout
- [ ] Add date grouping
- [ ] Implement infinite scroll

### Phase 6: Event Cards
- [ ] Create EventCard component
- [ ] Add swipe actions (mobile)
- [ ] Implement type indicators
- [ ] Add synced event styling

### Phase 7: Filtering
- [ ] Create MemberFilter component
- [ ] Implement filter logic
- [ ] Add filter persistence
- [ ] Update events on filter change

### Phase 8: State Management
- [ ] Create CalendarContext
- [ ] Integrate React Query
- [ ] Implement optimistic updates
- [ ] Add error handling

### Phase 9: Mobile Optimization
- [ ] Optimize touch targets
- [ ] Add swipe gestures
- [ ] Implement pull to refresh
- [ ] Test on devices

### Phase 10: Polish
- [ ] Add loading states
- [ ] Improve animations
- [ ] Add accessibility features
- [ ] Performance optimization

## 12. File Structure

```
src/
├── pages/
│   └── calendar/
│       ├── day.astro
│       ├── week.astro
│       ├── month.astro
│       └── agenda.astro
├── components/
│   └── calendar/
│       ├── CalendarView.tsx
│       ├── CalendarHeader.tsx
│       ├── ViewSwitcher.tsx
│       ├── DateNavigation.tsx
│       ├── MemberFilter.tsx
│       ├── DayView.tsx
│       ├── WeekView.tsx
│       ├── MonthView.tsx
│       ├── AgendaView.tsx
│       ├── EventCard.tsx
│       ├── EventTime.tsx
│       ├── EventParticipants.tsx
│       └── FloatingActionButton.tsx
├── contexts/
│   └── CalendarContext.tsx
├── hooks/
│   ├── useCalendarEvents.ts
│   └── useCalendarView.ts
└── lib/
    └── calendar/
        ├── dateUtils.ts
        └── eventUtils.ts
```

## 13. Dependencies

```json
{
  "@tanstack/react-query": "^5.0.0",
  "date-fns": "^2.30.0",
  "react": "^19.1.1",
  "lucide-react": "^0.487.0"
}
```

## 14. Success Criteria

- [ ] All four views work correctly
- [ ] Events display accurately
- [ ] Filtering works
- [ ] Date navigation works
- [ ] Mobile experience is smooth
- [ ] Performance is acceptable (< 2s load)
- [ ] Accessibility requirements met
- [ ] Swipe gestures work (mobile)

