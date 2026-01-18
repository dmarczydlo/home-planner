# Unit Test Plan - Backend Logic

## Executive Summary

This document outlines the comprehensive unit test plan for backend business logic in the Home Planner application. The plan focuses on service layer testing using the hexagonal architecture pattern with in-memory repositories.

**Current Status:**
- ✅ **Tested Services**: ChildService, FamilyService, InvitationService, LogService
- ❌ **Missing Tests**: EventService, UserService, ExternalCalendarService, Event Domain Entity

**Target Coverage**: 80%+ (as per vitest.config.ts thresholds)

---

## 1. Test Coverage Analysis

### 1.1 Currently Tested Services

#### ✅ ChildService (`src/services/ChildService.test.ts`)
- **Coverage**: Comprehensive
- **Test Cases**: 20+ test cases covering:
  - `listChildren()` - Success, empty, validation, authorization
  - `createChild()` - Success, validation, authorization, logging
  - `updateChild()` - Success, validation, authorization, logging
  - `deleteChild()` - Success, validation, authorization, logging
- **Status**: ✅ Complete

#### ✅ FamilyService (`src/services/FamilyService.test.ts`)
- **Coverage**: Comprehensive
- **Test Cases**: 15+ test cases covering:
  - `createFamily()` - Success, logging
  - `getFamilyDetails()` - Success, validation, authorization, includes children
  - `updateFamily()` - Success, validation, authorization (admin only), logging
  - `deleteFamily()` - Success, validation, authorization (admin only), logging
  - `getFamilyMembers()` - Success, filtering, ordering, logging
- **Status**: ✅ Complete

#### ✅ InvitationService (`src/services/InvitationService.test.ts`)
- **Coverage**: Good
- **Test Cases**: 10+ test cases covering:
  - `listInvitations()` - Success, filtering by status, validation, authorization
  - `createInvitation()` - Success, validation, duplicate prevention, logging
- **Status**: ✅ Complete (Note: Missing `acceptInvitation()` if it exists)

#### ✅ LogService (`src/services/LogService.test.ts`)
- **Coverage**: Comprehensive
- **Test Cases**: 15+ test cases covering:
  - `listLogs()` - Success, filtering, pagination, authorization (admin vs member), ordering
- **Status**: ✅ Complete

### 1.2 Missing Test Coverage

#### ❌ EventService (`src/services/EventService.ts`) - **P0 CRITICAL**
- **Lines of Code**: ~468 lines
- **Complexity**: Very High
- **Priority**: P0 (Core feature)
- **Risk**: High - Event management is core functionality
- **Methods to Test**:
  1. `listEvents()` - List with filters, pagination, authorization
  2. `getEventById()` - Get with occurrence date, authorization
  3. `createEvent()` - Create elastic/blocker, recurring, conflict detection, participant validation
  4. `updateEvent()` - Update single/future/all occurrences, exception handling, conflict detection
  5. `deleteEvent()` - Delete single/future/all occurrences, exception handling
  6. `validateEvent()` - Conflict detection, participant validation

#### ❌ Event Domain Entity (`src/domain/entities/Event.ts`) - **P0 CRITICAL**
- **Lines of Code**: ~95 lines
- **Complexity**: High (Business logic)
- **Priority**: P0 (Conflict detection logic)
- **Risk**: High - Core business rules
- **Static Methods to Test**:
  1. `validateParticipants()` - User/child validation, invalid participants
  2. `validateScope()` - Recurring event scope validation
  3. `checkConflicts()` - Blocker vs blocker conflicts, elastic allowed
  4. `canModify()` - Member check, synced event prevention

#### ❌ UserService (`src/services/UserService.ts`) - **P1**
- **Lines of Code**: ~42 lines
- **Complexity**: Low
- **Priority**: P1
- **Risk**: Medium
- **Methods to Test**:
  1. `getUserProfile()` - Success, not found, validation

#### ❌ ExternalCalendarService (`src/services/ExternalCalendarService.ts`) - **P0 CRITICAL**
- **Lines of Code**: ~516 lines
- **Complexity**: Very High (OAuth, encryption, sync logic)
- **Priority**: P0 (External integration)
- **Risk**: High - External API integration
- **Methods to Test**:
  1. `listCalendars()` - Success, validation
  2. `initiateOAuth()` - Success, validation, provider validation
  3. `handleCallback()` - Success, state validation, token encryption, existing calendar update
  4. `disconnectCalendar()` - Success, authorization, token revocation, event cleanup
  5. `syncCalendar()` - Success, rate limiting, token refresh, event reconciliation
  6. `syncAllCalendars()` - Success, multiple calendars, error handling
  7. Private methods: `reconcileEvents()`, `computeSyncStatus()`, `getEventMatchKey()`

---

## 2. Detailed Test Specifications

### 2.1 EventService Tests (`src/services/EventService.test.ts`)

#### Test Suite Structure
```typescript
describe("EventService", () => {
  // Setup: repositories, service instance, test data
  
  describe("listEvents", () => {
    // Test cases
  });
  
  describe("getEventById", () => {
    // Test cases
  });
  
  describe("createEvent", () => {
    // Test cases
  });
  
  describe("updateEvent", () => {
    // Test cases
  });
  
  describe("deleteEvent", () => {
    // Test cases
  });
  
  describe("validateEvent", () => {
    // Test cases
  });
});
```

#### Test Cases for `listEvents()`

**TC-EVT-SVC-001**: List events successfully with default filters
- **Preconditions**: User is family member, events exist
- **Steps**: Call `listEvents()` with familyId, date range
- **Expected**: Returns events with pagination, includes participants

**TC-EVT-SVC-002**: List events filtered by participant
- **Preconditions**: Multiple events with different participants
- **Steps**: Call `listEvents()` with `participantIds` filter
- **Expected**: Returns only events for specified participants

**TC-EVT-SVC-003**: List events filtered by event type
- **Preconditions**: Mix of elastic and blocker events
- **Steps**: Call `listEvents()` with `eventType: "blocker"`
- **Expected**: Returns only blocker events

**TC-EVT-SVC-004**: List events with pagination
- **Preconditions**: 50+ events exist
- **Steps**: Call `listEvents()` with `limit: 10, offset: 0`
- **Expected**: Returns 10 events, `has_more: true`, correct total

**TC-EVT-SVC-005**: List events excludes synced events when `includeSynced: false`
- **Preconditions**: Mix of synced and non-synced events
- **Steps**: Call `listEvents()` with `includeSynced: false`
- **Expected**: Returns only non-synced events

**TC-EVT-SVC-006**: List events returns error when user is not family member
- **Preconditions**: User not in family
- **Steps**: Call `listEvents()` with non-member userId
- **Expected**: Returns `ForbiddenError`

**TC-EVT-SVC-007**: List events handles repository errors gracefully
- **Preconditions**: Repository throws error
- **Steps**: Mock repository to throw, call `listEvents()`
- **Expected**: Returns `InternalError`

#### Test Cases for `getEventById()`

**TC-EVT-SVC-008**: Get event by ID successfully
- **Preconditions**: Event exists
- **Steps**: Call `getEventById()` with valid eventId
- **Expected**: Returns event with participants and exceptions

**TC-EVT-SVC-009**: Get event by ID with occurrence date (recurring event)
- **Preconditions**: Recurring event with exception
- **Steps**: Call `getEventById()` with `occurrenceDate`
- **Expected**: Returns event with exception applied

**TC-EVT-SVC-010**: Get event by ID returns error when event not found
- **Preconditions**: Event doesn't exist
- **Steps**: Call `getEventById()` with invalid eventId
- **Expected**: Returns `NotFoundError`

**TC-EVT-SVC-011**: Get event by ID returns error when user not family member
- **Preconditions**: Event exists, user not in family
- **Steps**: Call `getEventById()` with non-member userId
- **Expected**: Returns `ForbiddenError`

#### Test Cases for `createEvent()`

**TC-EVT-SVC-012**: Create elastic event successfully
- **Preconditions**: User is family member
- **Steps**: Call `createEvent()` with elastic event data
- **Expected**: Event created, participants added, log entry created

**TC-EVT-SVC-013**: Create blocker event successfully
- **Preconditions**: User is family member, no conflicts
- **Steps**: Call `createEvent()` with blocker event data
- **Expected**: Event created, conflict check performed

**TC-EVT-SVC-014**: Create event with participants (users and children)
- **Preconditions**: Family has members and children
- **Steps**: Call `createEvent()` with mixed participants
- **Expected**: Event created with all participants

**TC-EVT-SVC-015**: Create recurring daily event
- **Preconditions**: User is family member
- **Steps**: Call `createEvent()` with `recurrence_pattern: { frequency: "daily", end_date }`
- **Expected**: Event created with recurrence pattern

**TC-EVT-SVC-016**: Create recurring weekly event
- **Preconditions**: User is family member
- **Steps**: Call `createEvent()` with `recurrence_pattern: { frequency: "weekly", interval, end_date }`
- **Expected**: Event created with weekly recurrence

**TC-EVT-SVC-017**: Create recurring monthly event
- **Preconditions**: User is family member
- **Steps**: Call `createEvent()` with `recurrence_pattern: { frequency: "monthly", end_date }`
- **Expected**: Event created with monthly recurrence

**TC-EVT-SVC-018**: Create blocker event with conflict detection - prevents creation
- **Preconditions**: Overlapping blocker event exists for participant
- **Steps**: Call `createEvent()` with conflicting blocker event
- **Expected**: Returns `ConflictError` with conflicting events

**TC-EVT-SVC-019**: Create elastic event with conflict - allows creation
- **Preconditions**: Overlapping blocker event exists
- **Steps**: Call `createEvent()` with elastic event overlapping blocker
- **Expected**: Event created (elastic can overlap)

**TC-EVT-SVC-020**: Create event validates participants - invalid user
- **Preconditions**: User not in family
- **Steps**: Call `createEvent()` with invalid user participant
- **Expected**: Returns `ValidationError`

**TC-EVT-SVC-021**: Create event validates participants - invalid child
- **Preconditions**: Child not in family
- **Steps**: Call `createEvent()` with invalid child participant
- **Expected**: Returns `ValidationError`

**TC-EVT-SVC-022**: Create event returns error when user not family member
- **Preconditions**: User not in family
- **Steps**: Call `createEvent()` with non-member userId
- **Expected**: Returns `ForbiddenError`

**TC-EVT-SVC-023**: Create event logs action
- **Preconditions**: User is family member
- **Steps**: Call `createEvent()` successfully
- **Expected**: Log entry created with `action: "event.create"`

#### Test Cases for `updateEvent()`

**TC-EVT-SVC-024**: Update single occurrence of recurring event
- **Preconditions**: Recurring event exists
- **Steps**: Call `updateEvent()` with `scope: "this"`, `occurrenceDate`
- **Expected**: Exception created, only selected occurrence modified

**TC-EVT-SVC-025**: Update future occurrences of recurring event
- **Preconditions**: Recurring event with past and future occurrences
- **Steps**: Call `updateEvent()` with `scope: "future"`, `occurrenceDate`
- **Expected**: Recurrence pattern end_date updated, future occurrences modified

**TC-EVT-SVC-026**: Update all occurrences of recurring event
- **Preconditions**: Recurring event exists
- **Steps**: Call `updateEvent()` with `scope: "all"`
- **Expected**: Base event updated, exceptions deleted

**TC-EVT-SVC-027**: Update non-recurring event
- **Preconditions**: Single event exists
- **Steps**: Call `updateEvent()` with `scope: "all"`
- **Expected**: Event updated directly

**TC-EVT-SVC-028**: Update event with conflict detection - prevents update
- **Preconditions**: Blocker event exists, overlapping blocker created
- **Steps**: Call `updateEvent()` to create conflict
- **Expected**: Returns `ConflictError`

**TC-EVT-SVC-029**: Update event validates participants
- **Preconditions**: Event exists
- **Steps**: Call `updateEvent()` with invalid participants
- **Expected**: Returns `ValidationError`

**TC-EVT-SVC-030**: Update event validates scope for recurring events
- **Preconditions**: Recurring event exists
- **Steps**: Call `updateEvent()` with `scope: "this"` without `occurrenceDate`
- **Expected**: Returns `ValidationError`

**TC-EVT-SVC-031**: Update event prevents modification of synced events
- **Preconditions**: Synced event exists
- **Steps**: Call `updateEvent()` on synced event
- **Expected**: Returns `ForbiddenError` (via `canModify()`)

**TC-EVT-SVC-032**: Update event returns error when event not found
- **Preconditions**: Event doesn't exist
- **Steps**: Call `updateEvent()` with invalid eventId
- **Expected**: Returns `NotFoundError`

**TC-EVT-SVC-033**: Update event logs action
- **Preconditions**: Event exists
- **Steps**: Call `updateEvent()` successfully
- **Expected**: Log entry created with `action: "event.update"`

#### Test Cases for `deleteEvent()`

**TC-EVT-SVC-034**: Delete single occurrence of recurring event
- **Preconditions**: Recurring event exists
- **Steps**: Call `deleteEvent()` with `scope: "this"`, `occurrenceDate`
- **Expected**: Exception created marking occurrence as cancelled

**TC-EVT-SVC-035**: Delete future occurrences of recurring event
- **Preconditions**: Recurring event with past and future occurrences
- **Steps**: Call `deleteEvent()` with `scope: "future"`, `occurrenceDate`
- **Expected**: Recurrence pattern end_date updated

**TC-EVT-SVC-036**: Delete all occurrences (delete entire event)
- **Preconditions**: Event exists
- **Steps**: Call `deleteEvent()` with `scope: "all"`
- **Expected**: Event deleted from repository

**TC-EVT-SVC-037**: Delete event prevents deletion of synced events
- **Preconditions**: Synced event exists
- **Steps**: Call `deleteEvent()` on synced event
- **Expected**: Returns `ForbiddenError` (via `canModify()`)

**TC-EVT-SVC-038**: Delete event returns error when event not found
- **Preconditions**: Event doesn't exist
- **Steps**: Call `deleteEvent()` with invalid eventId
- **Expected**: Returns `NotFoundError`

**TC-EVT-SVC-039**: Delete event logs action
- **Preconditions**: Event exists
- **Steps**: Call `deleteEvent()` successfully
- **Expected**: Log entry created with `action: "event.delete"`

#### Test Cases for `validateEvent()`

**TC-EVT-SVC-040**: Validate event successfully - no conflicts
- **Preconditions**: No conflicting events
- **Steps**: Call `validateEvent()` with blocker event
- **Expected**: Returns `valid: true`, empty conflicts

**TC-EVT-SVC-041**: Validate event detects conflicts
- **Preconditions**: Overlapping blocker event exists
- **Steps**: Call `validateEvent()` with conflicting blocker event
- **Expected**: Returns `valid: false`, conflicts array populated

**TC-EVT-SVC-042**: Validate event validates participants
- **Preconditions**: Invalid participant IDs
- **Steps**: Call `validateEvent()` with invalid participants
- **Expected**: Returns `ValidationError`

**TC-EVT-SVC-043**: Validate event excludes current event from conflicts
- **Preconditions**: Event exists
- **Steps**: Call `validateEvent()` with `exclude_event_id`
- **Expected**: Current event not in conflicts

**TC-EVT-SVC-044**: Validate event returns error when user not family member
- **Preconditions**: User not in family
- **Steps**: Call `validateEvent()` with non-member userId
- **Expected**: Returns `ForbiddenError`

### 2.2 Event Domain Entity Tests (`src/domain/entities/Event.test.ts`)

#### Test Suite Structure
```typescript
describe("Event Domain Entity", () => {
  describe("validateParticipants", () => {
    // Test cases
  });
  
  describe("validateScope", () => {
    // Test cases
  });
  
  describe("checkConflicts", () => {
    // Test cases
  });
  
  describe("canModify", () => {
    // Test cases
  });
});
```

#### Test Cases for `validateParticipants()`

**TC-EVT-DOM-001**: Validate participants successfully - all valid
- **Preconditions**: Valid user and child participants
- **Steps**: Call `validateParticipants()` with valid participants
- **Expected**: Returns `ok(undefined)`

**TC-EVT-DOM-002**: Validate participants fails - invalid user
- **Preconditions**: User not in family members
- **Steps**: Call `validateParticipants()` with invalid user ID
- **Expected**: Returns `err(ValidationError)` with message

**TC-EVT-DOM-003**: Validate participants fails - invalid child
- **Preconditions**: Child not in family children
- **Steps**: Call `validateParticipants()` with invalid child ID
- **Expected**: Returns `err(ValidationError)` with message

**TC-EVT-DOM-004**: Validate participants handles empty participants array
- **Preconditions**: Empty participants array
- **Steps**: Call `validateParticipants()` with empty array
- **Expected**: Returns `ok(undefined)`

**TC-EVT-DOM-005**: Validate participants handles mixed valid/invalid
- **Preconditions**: Mix of valid and invalid participants
- **Steps**: Call `validateParticipants()` with mixed array
- **Expected**: Returns `err(ValidationError)` on first invalid

#### Test Cases for `validateScope()`

**TC-EVT-DOM-006**: Validate scope successfully - "all" for non-recurring
- **Preconditions**: Non-recurring event
- **Steps**: Call `validateScope("all", null, undefined)`
- **Expected**: Returns `ok(undefined)`

**TC-EVT-DOM-007**: Validate scope successfully - "this" for recurring with date
- **Preconditions**: Recurring event
- **Steps**: Call `validateScope("this", { frequency: "daily" }, "2024-01-01")`
- **Expected**: Returns `ok(undefined)`

**TC-EVT-DOM-008**: Validate scope fails - "this" without recurrence pattern
- **Preconditions**: Non-recurring event
- **Steps**: Call `validateScope("this", null, "2024-01-01")`
- **Expected**: Returns `err(ValidationError)`

**TC-EVT-DOM-009**: Validate scope fails - "this" without occurrence date
- **Preconditions**: Recurring event
- **Steps**: Call `validateScope("this", { frequency: "daily" }, undefined)`
- **Expected**: Returns `err(ValidationError)`

**TC-EVT-DOM-010**: Validate scope successfully - "future" for recurring
- **Preconditions**: Recurring event
- **Steps**: Call `validateScope("future", { frequency: "daily" }, "2024-01-01")`
- **Expected**: Returns `ok(undefined)`

#### Test Cases for `checkConflicts()`

**TC-EVT-DOM-011**: Check conflicts - blocker with conflicts returns error
- **Preconditions**: Conflicting blocker events exist
- **Steps**: Call `checkConflicts("blocker", [conflictingEvent])`
- **Expected**: Returns `err(ConflictError)` with conflicting events

**TC-EVT-DOM-012**: Check conflicts - blocker without conflicts succeeds
- **Preconditions**: No conflicting events
- **Steps**: Call `checkConflicts("blocker", [])`
- **Expected**: Returns `ok(undefined)`

**TC-EVT-DOM-013**: Check conflicts - elastic with conflicts succeeds
- **Preconditions**: Conflicting events exist
- **Steps**: Call `checkConflicts("elastic", [conflictingEvent])`
- **Expected**: Returns `ok(undefined)` (elastic can overlap)

**TC-EVT-DOM-014**: Check conflicts - formats conflicting events correctly
- **Preconditions**: Conflicting events with participants
- **Steps**: Call `checkConflicts("blocker", [conflictingEvent])`
- **Expected**: Returns `ConflictError` with properly formatted `ConflictingEventDTO[]`

#### Test Cases for `canModify()`

**TC-EVT-DOM-015**: Can modify - member with non-synced event succeeds
- **Preconditions**: User is member, event not synced
- **Steps**: Call `canModify({ is_synced: false, family_id: "x" }, true)`
- **Expected**: Returns `ok(undefined)`

**TC-EVT-DOM-016**: Can modify - non-member fails
- **Preconditions**: User not member
- **Steps**: Call `canModify({ is_synced: false, family_id: "x" }, false)`
- **Expected**: Returns `err(ForbiddenError)`

**TC-EVT-DOM-017**: Can modify - synced event fails
- **Preconditions**: Event is synced
- **Steps**: Call `canModify({ is_synced: true, family_id: "x" }, true)`
- **Expected**: Returns `err(ForbiddenError)` with "Synced events cannot be modified"

**TC-EVT-DOM-018**: Can modify - handles null is_synced
- **Preconditions**: Event with `is_synced: null`
- **Steps**: Call `canModify({ is_synced: null, family_id: "x" }, true)`
- **Expected**: Returns `ok(undefined)`

### 2.3 UserService Tests (`src/services/UserService.test.ts`)

#### Test Suite Structure
```typescript
describe("UserService", () => {
  // Setup: repository, service instance
  
  describe("getUserProfile", () => {
    // Test cases
  });
});
```

#### Test Cases for `getUserProfile()`

**TC-USER-SVC-001**: Get user profile successfully
- **Preconditions**: User exists with families
- **Steps**: Call `getUserProfile()` with valid userId
- **Expected**: Returns user profile with families array

**TC-USER-SVC-002**: Get user profile returns error when user not found
- **Preconditions**: User doesn't exist
- **Steps**: Call `getUserProfile()` with invalid userId
- **Expected**: Returns `NotFoundError`

**TC-USER-SVC-003**: Get user profile includes family memberships
- **Preconditions**: User belongs to multiple families
- **Steps**: Call `getUserProfile()` with userId
- **Expected**: Returns profile with all family memberships

**TC-USER-SVC-004**: Get user profile validates profile structure
- **Preconditions**: User exists but profile data invalid
- **Steps**: Mock repository to return invalid data, call `getUserProfile()`
- **Expected**: Returns `ValidationError`

**TC-USER-SVC-005**: Get user profile handles null avatar_url
- **Preconditions**: User exists with null avatar_url
- **Steps**: Call `getUserProfile()` with userId
- **Expected**: Returns profile with `avatar_url: null`

**TC-USER-SVC-006**: Get user profile handles repository errors
- **Preconditions**: Repository throws error
- **Steps**: Mock repository to throw, call `getUserProfile()`
- **Expected**: Error propagated (not caught)

### 2.4 ExternalCalendarService Tests (`src/services/ExternalCalendarService.test.ts`)

#### Test Suite Structure
```typescript
describe("ExternalCalendarService", () => {
  // Setup: repositories, service instance, mocks for OAuth/encryption
  
  describe("listCalendars", () => {
    // Test cases
  });
  
  describe("initiateOAuth", () => {
    // Test cases
  });
  
  describe("handleCallback", () => {
    // Test cases
  });
  
  describe("disconnectCalendar", () => {
    // Test cases
  });
  
  describe("syncCalendar", () => {
    // Test cases
  });
  
  describe("syncAllCalendars", () => {
    // Test cases
  });
});
```

#### Test Cases for `listCalendars()`

**TC-EXT-SVC-001**: List calendars successfully
- **Preconditions**: User has connected calendars
- **Steps**: Call `listCalendars()` with userId
- **Expected**: Returns calendar summaries with sync status

**TC-EXT-SVC-002**: List calendars returns empty array when none connected
- **Preconditions**: User has no calendars
- **Steps**: Call `listCalendars()` with userId
- **Expected**: Returns empty calendars array

**TC-EXT-SVC-003**: List calendars computes sync status correctly - active
- **Preconditions**: Calendar synced within 7 days
- **Steps**: Call `listCalendars()` with userId
- **Expected**: Returns calendar with `sync_status: "active"`

**TC-EXT-SVC-004**: List calendars computes sync status correctly - error
- **Preconditions**: Calendar synced more than 7 days ago or never synced
- **Steps**: Call `listCalendars()` with userId
- **Expected**: Returns calendar with `sync_status: "error"`

**TC-EXT-SVC-005**: List calendars returns error when userId invalid
- **Preconditions**: Invalid userId
- **Steps**: Call `listCalendars()` with empty/null userId
- **Expected**: Returns `ValidationError`

**TC-EXT-SVC-006**: List calendars handles repository errors
- **Preconditions**: Repository throws error
- **Steps**: Mock repository to throw, call `listCalendars()`
- **Expected**: Returns `InternalError`

#### Test Cases for `initiateOAuth()`

**TC-EXT-SVC-007**: Initiate OAuth successfully - Google
- **Preconditions**: Valid userId, provider "google"
- **Steps**: Call `initiateOAuth()` with userId, "google"
- **Expected**: Returns authorization URL and state token

**TC-EXT-SVC-008**: Initiate OAuth successfully - Microsoft 365
- **Preconditions**: Valid userId, provider "microsoft365"
- **Steps**: Call `initiateOAuth()` with userId, "microsoft365"
- **Expected**: Returns authorization URL and state token

**TC-EXT-SVC-009**: Initiate OAuth includes returnPath in state
- **Preconditions**: Valid userId, returnPath provided
- **Steps**: Call `initiateOAuth()` with userId, "google", "/settings"
- **Expected**: State token includes returnPath

**TC-EXT-SVC-010**: Initiate OAuth returns error when userId invalid
- **Preconditions**: Invalid userId
- **Steps**: Call `initiateOAuth()` with empty userId
- **Expected**: Returns `ValidationError`

**TC-EXT-SVC-011**: Initiate OAuth returns error when provider invalid
- **Preconditions**: Invalid provider
- **Steps**: Call `initiateOAuth()` with invalid provider
- **Expected**: Returns `ValidationError`

**TC-EXT-SVC-012**: Initiate OAuth handles OAuth provider errors
- **Preconditions**: OAuth provider throws error
- **Steps**: Mock OAuth provider to throw, call `initiateOAuth()`
- **Expected**: Returns `InternalError`

#### Test Cases for `handleCallback()`

**TC-EXT-SVC-013**: Handle callback successfully - new calendar
- **Preconditions**: Valid code, state, provider
- **Steps**: Call `handleCallback()` with valid parameters
- **Expected**: Calendar created, tokens encrypted, log entry created

**TC-EXT-SVC-014**: Handle callback successfully - existing calendar updated
- **Preconditions**: Calendar exists for user/provider/email
- **Steps**: Call `handleCallback()` with existing calendar
- **Expected**: Calendar updated with new tokens

**TC-EXT-SVC-015**: Handle callback encrypts tokens
- **Preconditions**: Valid callback parameters
- **Steps**: Call `handleCallback()` and verify encryption called
- **Expected**: `encryptToken()` called for access and refresh tokens

**TC-EXT-SVC-016**: Handle callback validates state token
- **Preconditions**: Invalid or expired state token
- **Steps**: Call `handleCallback()` with invalid state
- **Expected**: Returns `ValidationError`

**TC-EXT-SVC-017**: Handle callback validates provider
- **Preconditions**: Invalid provider
- **Steps**: Call `handleCallback()` with invalid provider
- **Expected**: Returns `ValidationError`

**TC-EXT-SVC-018**: Handle callback returns returnPath from state
- **Preconditions**: State token includes returnPath
- **Steps**: Call `handleCallback()` with state containing returnPath
- **Expected**: Returns `returnPath` in result

**TC-EXT-SVC-019**: Handle callback handles OAuth token exchange errors
- **Preconditions**: OAuth provider throws on token exchange
- **Steps**: Mock OAuth provider to throw, call `handleCallback()`
- **Expected**: Returns `InternalError`

**TC-EXT-SVC-020**: Handle callback logs connection
- **Preconditions**: Valid callback parameters
- **Steps**: Call `handleCallback()` successfully
- **Expected**: Log entry created with `action: "external_calendar.connect"`

#### Test Cases for `disconnectCalendar()`

**TC-EXT-SVC-021**: Disconnect calendar successfully
- **Preconditions**: Calendar exists, user owns calendar
- **Steps**: Call `disconnectCalendar()` with userId, calendarId
- **Expected**: Calendar deleted, events deleted, token revoked

**TC-EXT-SVC-022**: Disconnect calendar revokes OAuth token
- **Preconditions**: Calendar exists
- **Steps**: Call `disconnectCalendar()` and verify revocation
- **Expected**: `revokeToken()` called (non-blocking if fails)

**TC-EXT-SVC-023**: Disconnect calendar deletes synced events
- **Preconditions**: Calendar has synced events
- **Steps**: Call `disconnectCalendar()` and verify events deleted
- **Expected**: `deleteEventsByCalendarId()` called

**TC-EXT-SVC-024**: Disconnect calendar returns error when calendar not found
- **Preconditions**: Calendar doesn't exist
- **Steps**: Call `disconnectCalendar()` with invalid calendarId
- **Expected**: Returns `NotFoundError`

**TC-EXT-SVC-025**: Disconnect calendar returns error when user doesn't own calendar
- **Preconditions**: Calendar exists but owned by different user
- **Steps**: Call `disconnectCalendar()` with wrong userId
- **Expected**: Returns `ForbiddenError`

**TC-EXT-SVC-026**: Disconnect calendar handles token revocation failure gracefully
- **Preconditions**: Calendar exists, revocation fails
- **Steps**: Mock revocation to throw, call `disconnectCalendar()`
- **Expected**: Calendar still deleted (error logged, not blocking)

**TC-EXT-SVC-027**: Disconnect calendar logs disconnection
- **Preconditions**: Calendar exists
- **Steps**: Call `disconnectCalendar()` successfully
- **Expected**: Log entry created with `action: "external_calendar.disconnect"`

#### Test Cases for `syncCalendar()`

**TC-EXT-SVC-028**: Sync calendar successfully - new events added
- **Preconditions**: Calendar connected, external events exist
- **Steps**: Call `syncCalendar()` with userId, calendarId
- **Expected**: Events added, sync status updated, log created

**TC-EXT-SVC-029**: Sync calendar updates existing events
- **Preconditions**: Calendar connected, events changed externally
- **Steps**: Call `syncCalendar()` with modified events
- **Expected**: Events updated, `events_updated` count correct

**TC-EXT-SVC-030**: Sync calendar removes deleted events
- **Preconditions**: Calendar connected, events deleted externally
- **Steps**: Call `syncCalendar()` with fewer external events
- **Expected**: Events removed, `events_removed` count correct

**TC-EXT-SVC-031**: Sync calendar refreshes expired token
- **Preconditions**: Calendar token expired
- **Steps**: Call `syncCalendar()` with expired token
- **Expected**: Token refreshed, new tokens encrypted and saved

**TC-EXT-SVC-032**: Sync calendar enforces rate limiting
- **Preconditions**: Rate limit exceeded
- **Steps**: Mock rate limiter to return error, call `syncCalendar()`
- **Expected**: Returns `RateLimitError`

**TC-EXT-SVC-033**: Sync calendar returns error when user has no families
- **Preconditions**: User not in any family
- **Steps**: Call `syncCalendar()` with userId not in families
- **Expected**: Returns `ValidationError`

**TC-EXT-SVC-034**: Sync calendar uses first family for sync
- **Preconditions**: User in multiple families
- **Steps**: Call `syncCalendar()` and verify family used
- **Expected**: Events synced to first family

**TC-EXT-SVC-035**: Sync calendar reconciles events correctly
- **Preconditions**: Mix of new, updated, deleted events
- **Steps**: Call `syncCalendar()` with mixed event set
- **Expected**: Correct counts for added/updated/removed

**TC-EXT-SVC-036**: Sync calendar returns error when calendar not found
- **Preconditions**: Calendar doesn't exist
- **Steps**: Call `syncCalendar()` with invalid calendarId
- **Expected**: Returns `NotFoundError`

**TC-EXT-SVC-037**: Sync calendar returns error when user doesn't own calendar
- **Preconditions**: Calendar owned by different user
- **Steps**: Call `syncCalendar()` with wrong userId
- **Expected**: Returns `ForbiddenError`

**TC-EXT-SVC-038**: Sync calendar handles OAuth fetch errors
- **Preconditions**: OAuth provider throws on fetch
- **Steps**: Mock OAuth provider to throw, call `syncCalendar()`
- **Expected**: Returns `InternalError`

**TC-EXT-SVC-039**: Sync calendar logs sync with correct status
- **Preconditions**: Calendar connected
- **Steps**: Call `syncCalendar()` successfully
- **Expected**: Log entry created with sync details and status

#### Test Cases for `syncAllCalendars()`

**TC-EXT-SVC-040**: Sync all calendars successfully
- **Preconditions**: User has multiple calendars
- **Steps**: Call `syncAllCalendars()` with userId
- **Expected**: Returns results for all calendars

**TC-EXT-SVC-041**: Sync all calendars handles partial failures
- **Preconditions**: Some calendars sync successfully, others fail
- **Steps**: Call `syncAllCalendars()` with mixed results
- **Expected**: Returns results with success/error status per calendar

**TC-EXT-SVC-042**: Sync all calendars handles rate limit errors
- **Preconditions**: One calendar hits rate limit
- **Steps**: Call `syncAllCalendars()` with rate limit error
- **Expected**: Returns error status for that calendar, continues with others

**TC-EXT-SVC-043**: Sync all calendars returns empty results when no calendars
- **Preconditions**: User has no calendars
- **Steps**: Call `syncAllCalendars()` with userId
- **Expected**: Returns empty results array

**TC-EXT-SVC-044**: Sync all calendars handles repository errors
- **Preconditions**: Repository throws error
- **Steps**: Mock repository to throw, call `syncAllCalendars()`
- **Expected**: Returns `InternalError`

---

## 3. Test Implementation Strategy

### 3.1 Test Structure and Organization

#### File Naming Convention
- Service tests: `{ServiceName}.test.ts` in same directory as service
- Domain entity tests: `{EntityName}.test.ts` in `src/domain/entities/`
- Repository tests: `{RepositoryName}.test.ts` in `src/repositories/implementations/in-memory/`

#### Test Organization Pattern
```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { ServiceName } from "./ServiceName";
import { InMemoryXRepository } from "@/repositories/implementations/in-memory/InMemoryXRepository";
// ... other imports

describe("ServiceName", () => {
  let service: ServiceName;
  let repo1: InMemoryXRepository;
  let repo2: InMemoryYRepository;
  let userId: string;
  let familyId: string;

  beforeEach(() => {
    // Arrange: Setup repositories and service
    repo1 = new InMemoryXRepository();
    repo2 = new InMemoryYRepository();
    service = new ServiceName(repo1, repo2);
    
    // Setup test data
    userId = "user-123";
    familyId = "family-123";
  });

  describe("methodName", () => {
    it("should do something successfully", async () => {
      // Arrange: Setup test data
      // Act: Call method
      // Assert: Verify result
    });
  });
});
```

### 3.2 Mocking Strategy

#### In-Memory Repositories
- Use in-memory repository implementations for all tests
- Seed test data directly in repositories
- No need to mock repositories themselves

#### External Dependencies
- **OAuth Providers**: Mock `createOAuthProvider()` and provider methods
- **Encryption**: Mock `encryptToken()` and `decryptToken()` (or use real implementation if fast)
- **Rate Limiter**: Mock `RateLimiter` class methods
- **Environment Variables**: Mock `import.meta.env` values

#### Example Mock Setup
```typescript
vi.mock("@/lib/oauth/providers", () => ({
  createOAuthProvider: vi.fn(),
}));

vi.mock("@/lib/encryption/tokenEncryption", () => ({
  encryptToken: vi.fn((token) => Promise.resolve(`encrypted-${token}`)),
  decryptToken: vi.fn((encrypted) => Promise.resolve(encrypted.replace("encrypted-", ""))),
}));
```

### 3.3 Test Data Management

#### Test Fixtures
Create reusable test data builders:
```typescript
function createTestFamily(repo: InMemoryFamilyRepository, name = "Test Family") {
  return repo.create({ name });
}

function createTestUser(repo: InMemoryUserRepository, id = "user-123") {
  return repo.create({ id });
}

function createTestEvent(repo: InMemoryEventRepository, data: Partial<CreateEventDTO>) {
  return repo.create({
    title: "Test Event",
    start_time: "2024-01-01T10:00:00Z",
    end_time: "2024-01-01T11:00:00Z",
    family_id: "family-123",
    event_type: "elastic",
    ...data,
  });
}
```

### 3.4 Error Testing Patterns

#### Test Error Scenarios
```typescript
it("should return error when validation fails", async () => {
  const result = await service.method("", invalidData);
  
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error).toBeInstanceOf(ValidationError);
    expect(result.error.message).toContain("required");
  }
});
```

#### Test Authorization
```typescript
it("should return error when user not authorized", async () => {
  const otherUserId = "other-user-123";
  const result = await service.method(familyId, data, otherUserId);
  
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error).toBeInstanceOf(ForbiddenError);
  }
});
```

### 3.5 Testing Async Operations

#### Test Async Methods
```typescript
it("should handle async operations", async () => {
  const promise = service.asyncMethod();
  await expect(promise).resolves.toBeDefined();
  
  const result = await promise;
  expect(result.success).toBe(true);
});
```

#### Test Logging (Non-Blocking)
```typescript
it("should log action", async () => {
  const result = await service.method(data);
  
  expect(result.success).toBe(true);
  // Logging is non-blocking, so check after a short delay
  await new Promise(resolve => setTimeout(resolve, 10));
  
  const logs = logRepo.getLogs();
  expect(logs.length).toBeGreaterThan(0);
  expect(logs[0].action).toBe("expected.action");
});
```

---

## 4. Implementation Priority

### Phase 1: Critical Business Logic (Week 1)
**Priority: P0**

1. **Event Domain Entity Tests** (`src/domain/entities/Event.test.ts`)
   - Estimated: 18 test cases
   - Effort: 1 day
   - Risk: High if not tested (core conflict detection)

2. **EventService Tests - Core Methods** (`src/services/EventService.test.ts`)
   - `createEvent()` - 12 test cases
   - `checkConflicts()` integration
   - Estimated: 2 days
   - Risk: Critical - core feature

### Phase 2: Event Service Completion (Week 1-2)
**Priority: P0**

3. **EventService Tests - Remaining Methods**
   - `listEvents()` - 7 test cases
   - `getEventById()` - 4 test cases
   - `updateEvent()` - 10 test cases
   - `deleteEvent()` - 6 test cases
   - `validateEvent()` - 5 test cases
   - Estimated: 3 days

### Phase 3: External Integration (Week 2)
**Priority: P0**

4. **ExternalCalendarService Tests** (`src/services/ExternalCalendarService.test.ts`)
   - `listCalendars()` - 6 test cases
   - `initiateOAuth()` - 6 test cases
   - `handleCallback()` - 8 test cases
   - `disconnectCalendar()` - 7 test cases
   - `syncCalendar()` - 12 test cases
   - `syncAllCalendars()` - 5 test cases
   - Estimated: 4 days
   - Risk: High - external API integration

### Phase 4: User Service (Week 2)
**Priority: P1**

5. **UserService Tests** (`src/services/UserService.test.ts`)
   - `getUserProfile()` - 6 test cases
   - Estimated: 0.5 days
   - Risk: Low

---

## 5. Test Execution and Coverage Goals

### 5.1 Coverage Targets

| Component | Current | Target | Priority |
|-----------|---------|--------|----------|
| EventService | 0% | 85%+ | P0 |
| Event Domain Entity | 0% | 100% | P0 |
| ExternalCalendarService | 0% | 80%+ | P0 |
| UserService | 0% | 80%+ | P1 |
| **Overall Backend** | ~60% | **80%+** | - |

### 5.2 Test Execution

#### Run Tests
```bash
# Run all unit tests
pnpm test

# Run specific test file
pnpm test EventService.test.ts

# Run with coverage
pnpm test:coverage

# Run in watch mode
pnpm test:watch
```

#### Coverage Reports
- HTML report: `coverage/index.html`
- Text report: Console output
- JSON report: `coverage/coverage-final.json`

---

## 6. Test Quality Checklist

### 6.1 Test Requirements

- ✅ **AAA Pattern**: Arrange-Act-Assert structure
- ✅ **Descriptive Names**: Test names describe what is being tested
- ✅ **Isolation**: Each test is independent
- ✅ **Fast Execution**: Use in-memory repositories
- ✅ **No Flakiness**: Deterministic test data
- ✅ **Error Scenarios**: Test both success and failure paths
- ✅ **Edge Cases**: Test boundary conditions
- ✅ **Type Safety**: TypeScript types preserved in tests

### 6.2 Code Review Checklist

- [ ] Tests follow AAA pattern
- [ ] Test names are descriptive
- [ ] All error paths tested
- [ ] Mocks are properly set up and cleaned up
- [ ] Test data is realistic
- [ ] No hardcoded values (use constants)
- [ ] Assertions are specific and meaningful
- [ ] No test interdependencies
- [ ] Coverage meets thresholds

---

## 7. Risk Mitigation

### 7.1 High-Risk Areas

1. **Event Conflict Detection**
   - **Risk**: Incorrect conflict logic leads to double-booking
   - **Mitigation**: Comprehensive domain entity tests + integration tests in EventService

2. **External Calendar Sync**
   - **Risk**: Data loss or corruption during sync
   - **Mitigation**: Test reconciliation logic thoroughly, test error handling

3. **OAuth Token Management**
   - **Risk**: Token leaks or incorrect encryption
   - **Mitigation**: Test encryption/decryption, test token refresh flow

### 7.2 Test Maintenance

- **Update tests when**: Business logic changes, new features added, bugs fixed
- **Review tests**: During code reviews, ensure tests cover new code paths
- **Refactor tests**: Keep tests DRY, extract common setup to helpers

---

## 8. Success Criteria

### 8.1 Completion Criteria

- ✅ All P0 test cases implemented and passing
- ✅ Code coverage ≥ 80% for all services
- ✅ All critical business logic paths tested
- ✅ No flaky tests
- ✅ Tests run in < 30 seconds

### 8.2 Quality Criteria

- ✅ All tests follow AAA pattern
- ✅ Test names are descriptive
- ✅ Error scenarios covered
- ✅ Edge cases tested
- ✅ Mocks properly configured

---

## Appendix A: Test Case Summary

| Service | Test Cases | Status | Priority |
|---------|-----------|--------|----------|
| ChildService | 20+ | ✅ Complete | P0 |
| FamilyService | 15+ | ✅ Complete | P0 |
| InvitationService | 10+ | ✅ Complete | P0 |
| LogService | 15+ | ✅ Complete | P1 |
| **EventService** | **44** | ❌ **Missing** | **P0** |
| **Event Domain Entity** | **18** | ❌ **Missing** | **P0** |
| **ExternalCalendarService** | **44** | ❌ **Missing** | **P0** |
| **UserService** | **6** | ❌ **Missing** | **P1** |
| **TOTAL** | **172+** | **60% Complete** | - |

---

## Appendix B: Test Implementation Template

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { ServiceName } from "./ServiceName";
import { InMemoryXRepository } from "@/repositories/implementations/in-memory/InMemoryXRepository";
import { InMemoryYRepository } from "@/repositories/implementations/in-memory/InMemoryYRepository";
import { ValidationError, NotFoundError, ForbiddenError } from "@/domain/errors";

describe("ServiceName", () => {
  let service: ServiceName;
  let xRepo: InMemoryXRepository;
  let yRepo: InMemoryYRepository;
  let userId: string;
  let familyId: string;

  beforeEach(() => {
    xRepo = new InMemoryXRepository();
    yRepo = new InMemoryYRepository();
    service = new ServiceName(xRepo, yRepo);
    
    userId = "user-123";
    familyId = "family-123";
  });

  describe("methodName", () => {
    it("should do something successfully", async () => {
      // Arrange
      const testData = { /* ... */ };
      
      // Act
      const result = await service.methodName(testData, userId);
      
      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject({ /* expected */ });
      }
    });

    it("should return error when validation fails", async () => {
      // Arrange
      const invalidData = { /* invalid */ };
      
      // Act
      const result = await service.methodName(invalidData, userId);
      
      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
      }
    });
  });
});
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-XX  
**Author**: QA Team  
**Status**: Draft - Ready for Implementation
