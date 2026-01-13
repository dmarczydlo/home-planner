# Implementation Plan: Event Management

## Mobile-First Design

## 1. Overview

**Purpose**: Create, edit, view, and delete calendar events with conflict detection

**Routes**:

- Event creation: Triggered from calendar view (FAB or date tap)
- Event editing: Modal/bottom sheet overlay (no dedicated route)
- Event details: Modal/bottom sheet overlay

**Key Features**:

- Create events (Elastic/Blocker)
- Edit events (single or recurring) - native events only
- Delete events - native events only
- Conflict detection for Blocker events (prevents saving)
- Recurrence support
- Participant selection
- Synced event handling (read-only, cannot edit/delete)

## 2. Mobile-First Design Specifications

### 2.1. Event Form Layout (Mobile)

**Bottom Sheet (Mobile):**

```
┌─────────────────────────────────┐
│ ═══                              │ ← Drag handle
│ Create Event                     │
├─────────────────────────────────┤
│                                 │
│ Title *                          │
│ [________________________]       │
│                                 │
│ Date                             │
│ [Today, Jan 15]                 │
│                                 │
│ Time                             │
│ [3:00 PM] - [4:00 PM]           │
│                                 │
│ All Day  [Toggle]                │
│                                 │
│ Participants                     │
│ ☑ Emma (Child)                  │
│ ☐ Sarah (You)                   │
│                                 │
│ Event Type                       │
│ ○ Elastic  ● Blocker            │
│                                 │
│ Recurrence                       │
│ ○ One-time  ● Weekly            │
│ End date: [Picker]              │
│                                 │
│ [Conflict Warning - if blocker] │
│                                 │
│ [Cancel]        [Save]           │
└─────────────────────────────────┘
```

**Modal (Desktop):**

- Centered modal
- Max width: 600px
- Same form structure

### 2.2. Responsive Breakpoints

**Mobile (320px - 767px):**

- Bottom sheet (full height or partial)
- Native date/time pickers
- Swipe down to dismiss
- Full-width inputs

**Tablet (768px - 1023px):**

- Bottom sheet or modal
- Larger touch targets
- More spacing

**Desktop (1024px+):**

- Modal dialog
- Keyboard shortcuts
- Hover states

## 3. Component Structure

### 3.1. Event Form Component

**File**: `src/components/calendar/EventForm.tsx`

**Structure:**

```typescript
<EventForm
  event={event} // Optional, for editing
  initialDate={date}
  onSave={handleSave}
  onCancel={handleCancel}
>
  <EventFormHeader />
  <EventFormFields>
    <TitleInput />
    <DatePicker />
    <TimePicker />
    <AllDayToggle />
    <ParticipantSelector />
    <EventTypeSelector />
    <RecurrenceEditor />
  </EventFormFields>
  <ConflictWarning />
  <EventFormActions />
</EventForm>
```

### 3.2. Sub-Components

**TitleInput**

- Text input
- Required validation
- Max 200 characters

**DatePicker**

- Native picker (mobile)
- Calendar picker (desktop)
- Date range validation

**TimePicker**

- Native picker (mobile)
- Time input (desktop)
- Start/end time validation

**ParticipantSelector**

- Multi-select component
- Users and children combined
- Searchable list
- Checkbox interface

**EventTypeSelector**

- Radio buttons or toggle
- Elastic vs Blocker
- Visual distinction

**RecurrenceEditor**

- Collapsible section
- Frequency selector
- Interval input
- End date picker
- Preview of occurrences

**ConflictWarning**

- Inline warning message (error style)
- List of conflicting events
- Clear message: "Cannot save: This blocker event conflicts with existing events"
- Save button automatically disabled
- User must adjust time to resolve conflict before saving

## 4. User Flow

### 4.1. Create Event Flow

```
1. User triggers creation
   ├─> Tap FAB
   ├─> Tap date/time slot
   └─> Long press date cell
       └─> Event form opens (bottom sheet)

2. Fill event form
   └─> Enter title, date, time, participants
       └─> Select event type
           ├─> If Elastic: No conflict check
           └─> If Blocker: Validate conflicts
               ├─> No conflicts: Enable save
               └─> Conflicts found: Show warning
                   └─> Save button disabled
                       └─> User must adjust time to resolve conflict

3. Save event
   └─> API: POST /api/events
       ├─> Success: Close form, show toast, refresh calendar
       └─> Error: Show error message
```

### 4.2. Edit Event Flow

```
1. User taps event card
   └─> Event details open (bottom sheet)

2. View event details
   ├─> If synced event (is_synced: true):
   │   └─> Show read-only message
   │       └─> "This event is synced from [Provider] and cannot be edited"
   │       └─> Edit button hidden/disabled
   │       └─> Delete button hidden/disabled
   │
   └─> If native event (is_synced: false):
       └─> Tap "Edit" button
           └─> Form opens in edit mode
               ├─> If recurring: Show scope selector
               │   ├─> "This event only" (maps to scope='this')
               │   ├─> "This and future" (maps to scope='future')
               │   └─> "All events" (maps to scope='all')
               └─> Fill form with existing data

3. Save changes
   └─> API: PATCH /api/events/:id?scope=...
       ├─> Success: Close form, refresh calendar
       └─> Error: Show error message
```

### 4.3. Delete Event Flow

```
1. User swipes event card (mobile)
   └─> If synced event (is_synced: true):
       └─> Delete action not available (swipe disabled)
           └─> Show message: "Synced events cannot be deleted"

   └─> If native event (is_synced: false):
       └─> Delete action revealed
           └─> Tap delete
               └─> Confirmation dialog
                   ├─> If recurring: Show scope selector
                   │   ├─> "This event only" (maps to scope='this')
                   │   ├─> "This and future" (maps to scope='future')
                   │   └─> "All events" (maps to scope='all')
                   └─> Confirm deletion
                       └─> API: DELETE /api/events/:id?scope=...
                           └─> Refresh calendar
```

### 4.4. Conflict Detection Flow

```
1. User creates Blocker event
   └─> Form validates on change
       └─> API: POST /api/events/validate
           ├─> No conflicts: Form ready to save (Save button enabled)
           └─> Conflicts found: Show warning
               └─> Display conflicting events
                   └─> Save button disabled
                       └─> User must adjust time to resolve conflict
                           └─> Re-validate after time change
                               └─> If no conflicts: Enable save
```

## 5. API Integration

### 5.1. Create Event

**Endpoint**: `POST /api/events`

**Request:**

```typescript
{
  family_id: string;
  title: string;
  start_time: string; // ISO8601
  end_time: string;   // ISO8601
  is_all_day?: boolean;
  event_type: 'elastic' | 'blocker';
  recurrence_pattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval?: number;
    end_date: string; // ISO8601 date
  };
  participants: Array<{
    id: string;
    type: 'user' | 'child';
  }>;
}
```

**Response:**

```typescript
{
  id: string;
  family_id: string;
  title: string;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  event_type: "elastic" | "blocker";
  recurrence_pattern: object | null;
  participants: Array<Participant>;
  created_at: string;
  updated_at: string;
}
```

### 5.2. Validate Event

**Endpoint**: `POST /api/events/validate`

**Request:**

```typescript
{
  family_id: string;
  title: string;
  start_time: string;
  end_time: string;
  event_type: 'elastic' | 'blocker';
  participants: Array<{ id: string; type: 'user' | 'child' }>;
  exclude_event_id?: string; // For updates
}
```

**Response:**

```typescript
{
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
  conflicts: Array<{
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    participants: Array<Participant>;
  }>;
}
```

### 5.3. Update Event

**Endpoint**: `PATCH /api/events/:eventId?scope=this|future|all&date=YYYY-MM-DD`

**Request:**

```typescript
{
  title?: string;
  start_time?: string;
  end_time?: string;
  is_all_day?: boolean;
  event_type?: 'elastic' | 'blocker';
  participants?: Array<{ id: string; type: 'user' | 'child' }>;
}
```

### 5.4. Delete Event

**Endpoint**: `DELETE /api/events/:eventId?scope=this|future|all&date=YYYY-MM-DD`

## 6. State Management

### 6.1. Form State

**Local State (useState):**

```typescript
interface EventFormState {
  title: string;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  participants: Array<{ id: string; type: "user" | "child" }>;
  eventType: "elastic" | "blocker";
  recurrence: {
    enabled: boolean;
    frequency: "daily" | "weekly" | "monthly";
    interval: number;
    endDate: Date | null;
  };
  conflicts: Conflict[];
  isValidating: boolean;
  errors: ValidationError[];
}
```

### 6.2. Validation Logic

**Real-time Validation:**

```typescript
function validateEvent(formState: EventFormState): ValidationResult {
  const errors: ValidationError[] = [];

  if (!formState.title.trim()) {
    errors.push({ field: "title", message: "Title is required" });
  }

  if (formState.endTime <= formState.startTime) {
    errors.push({ field: "endTime", message: "End time must be after start time" });
  }

  if (formState.recurrence.enabled && !formState.recurrence.endDate) {
    errors.push({ field: "recurrence.endDate", message: "End date is required for recurring events" });
  }

  return { valid: errors.length === 0, errors };
}
```

### 6.3. Conflict Detection

**Debounced Validation:**

```typescript
const debouncedValidate = useMemo(
  () =>
    debounce(async (formState: EventFormState) => {
      if (formState.eventType !== "blocker") return;

      setIsValidating(true);
      try {
        const result = await validateEvent(formState);
        setConflicts(result.conflicts);
      } finally {
        setIsValidating(false);
      }
    }, 500),
  []
);
```

## 7. Recurrence Editor

### 7.1. Component Structure

```typescript
<RecurrenceEditor
  value={recurrence}
  onChange={setRecurrence}
>
  <RecurrenceToggle />
  {recurrence.enabled && (
    <>
      <FrequencySelector />
      <IntervalInput />
      <EndDatePicker />
      <OccurrencePreview />
    </>
  )}
</RecurrenceEditor>
```

### 7.2. Recurrence Patterns

**Daily:**

- Every N days
- End date required

**Weekly:**

- Every N weeks
- Day of week (from start date)
- End date required

**Monthly:**

- Every N months
- Day of month (from start date)
- End date required

### 7.3. Occurrence Preview

**Display:**

- Next 3-5 occurrences
- Dates and times
- Helps user verify pattern

## 8. Conflict Warning Component

### 8.1. Display

```typescript
<ConflictWarning conflicts={conflicts}>
  <WarningIcon />
  <WarningMessage>
    This blocker event conflicts with {conflicts.length} existing event(s):
  </WarningMessage>
  <ConflictList>
    {conflicts.map(conflict => (
      <ConflictItem
        title={conflict.title}
        time={`${formatTime(conflict.start_time)} - ${formatTime(conflict.end_time)}`}
        participants={conflict.participants}
      />
    ))}
  </ConflictList>
  <ConflictMessage>
    Save button is disabled until conflict is resolved.
    Adjust the time to continue.
  </ConflictMessage>
</ConflictWarning>
```

### 8.2. Visual Design

- Red error color (not warning)
- Error icon indicator
- List of conflicts with details
- Save button disabled (grayed out)
- Clear message that saving is blocked until conflict resolved

## 9. Mobile-Specific Features

### 9.1. Bottom Sheet Behavior

**Swipe Down:**

- Partial: Dismiss sheet
- Full: Close and discard changes
- Confirmation if form has changes

**Swipe Up:**

- Expand to full screen (if needed)
- Better for long forms

### 10.2. Native Pickers

**Mobile:**

- Use native date/time pickers
- Better UX on mobile
- Platform-specific styling

**Desktop:**

- Custom calendar/time pickers
- More control
- Keyboard navigation

### 10.3. Form Optimization

**Progressive Disclosure:**

- Recurrence collapsed by default
- Expand when needed
- Reduces form length

**Smart Defaults:**

- Current date/time
- Current user as participant
- Elastic as default type

## 11. Accessibility

### 11.1. Form Accessibility

- **Labels**: All inputs have labels
- **Error Messages**: Associated with fields
- **Focus Management**: Focus on first error
- **Keyboard Navigation**: Tab through form

### 11.2. ARIA Labels

```tsx
<form aria-label="Create event">
  <label htmlFor="title">
    Title
    <input id="title" aria-required="true" aria-invalid={hasError} aria-describedby="title-error" />
    {error && (
      <span id="title-error" role="alert">
        {error}
      </span>
    )}
  </label>
</form>
```

## 12. Implementation Checklist

### Phase 1: Form Structure

- [ ] Create EventForm component
- [ ] Implement bottom sheet (mobile)
- [ ] Implement modal (desktop)
- [ ] Add form fields

### Phase 2: Basic Fields

- [ ] Title input
- [ ] Date picker
- [ ] Time picker
- [ ] All-day toggle
- [ ] Participant selector

### Phase 3: Event Type

- [ ] Event type selector
- [ ] Visual distinction
- [ ] Conflict detection trigger

### Phase 4: Recurrence

- [ ] Recurrence toggle
- [ ] Frequency selector
- [ ] Interval input
- [ ] End date picker
- [ ] Occurrence preview

### Phase 5: Validation

- [ ] Form validation
- [ ] Real-time validation
- [ ] Error display
- [ ] Field-level errors

### Phase 6: Conflict Detection

- [ ] Conflict validation API
- [ ] Conflict warning component
- [ ] Conflict list display
- [ ] Adjust time option

### Phase 7: API Integration

- [ ] Create event API
- [ ] Update event API
- [ ] Delete event API
- [ ] Validate event API

### Phase 8: Edit Mode

- [ ] Edit form mode
- [ ] Scope selector (recurring)
- [ ] Pre-fill form data
- [ ] Handle exceptions

### Phase 9: Mobile Optimization

- [ ] Bottom sheet gestures
- [ ] Native pickers
- [ ] Touch optimization
- [ ] Performance

### Phase 10: Polish

- [ ] Loading states
- [ ] Success feedback
- [ ] Error handling
- [ ] Accessibility

## 13. File Structure

```
src/
├── components/
│   └── calendar/
│       ├── EventForm.tsx
│       ├── EventFormFields.tsx
│       ├── TitleInput.tsx
│       ├── DatePicker.tsx
│       ├── TimePicker.tsx
│       ├── ParticipantSelector.tsx
│       ├── EventTypeSelector.tsx
│       ├── RecurrenceEditor.tsx
│       ├── ConflictWarning.tsx
│       ├── ConflictList.tsx
│       └── EventFormActions.tsx
├── hooks/
│   ├── useEventForm.ts
│   └── useEventValidation.ts
└── lib/
    └── events/
        ├── validation.ts
        └── recurrence.ts
```

## 14. Success Criteria

- [ ] User can create events
- [ ] User can edit events
- [ ] User can delete events
- [ ] Conflict detection works (prevents saving blocker events)
- [ ] Synced events are read-only (cannot edit/delete)
- [ ] Recurrence works correctly
- [ ] Mobile experience is smooth
- [ ] Form validation works
- [ ] Accessibility requirements met
