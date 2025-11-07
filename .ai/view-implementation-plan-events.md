# API Endpoint Implementation Plan: Events API (`/api/events`)

## 1. Endpoint Overview

The Events API provides comprehensive event management functionality for the Home Planner application. It supports creating, reading, updating, and deleting calendar events with advanced features including:

- **Event Types**: Elastic events (flexible scheduling) and Blocker events (fixed scheduling with conflict detection)
- **Recurring Events**: Support for daily, weekly, and monthly recurring patterns with exception handling
- **Participants**: Events can include both users and children as participants
- **External Calendar Integration**: Support for synced events from external calendars (read-only)
- **Conflict Detection**: Automatic detection of overlapping blocker events for the same participants
- **Scope-based Updates**: For recurring events, updates can apply to single occurrence, future occurrences, or all occurrences

The API consists of six endpoints:

1. `GET /api/events` - List events with filtering and pagination
2. `GET /api/events/{eventId}` - Get detailed event information
3. `POST /api/events` - Create a new event
4. `PATCH /api/events/{eventId}` - Update an existing event
5. `DELETE /api/events/{eventId}` - Delete an event
6. `POST /api/events/validate` - Validate event without saving

All endpoints require authentication and enforce family membership authorization.

## 2. Request Details

### 2.1. List Events

**HTTP Method**: `GET`

**URL Structure**: `/api/events`

**Query Parameters**:

- `family_id` (required): UUID of the family
- `start_date` (required): ISO8601 date - start of range
- `end_date` (required): ISO8601 date - end of range
- `participant_ids` (optional): Comma-separated list of user/child UUIDs to filter by
- `event_type` (optional): Filter by 'elastic' or 'blocker'
- `include_synced` (optional, default: true): Include external calendar events
- `view` (optional): 'day', 'week', 'month', 'agenda' (affects formatting)
- `limit` (optional, default: 100): Maximum number of results
- `offset` (optional, default: 0): Pagination offset

**Request Body**: None

### 2.2. Get Single Event

**HTTP Method**: `GET`

**URL Structure**: `/api/events/{eventId}`

**Path Parameters**:

- `eventId` (required): UUID of the event

**Query Parameters**:

- `date` (optional): For recurring events, get details for specific occurrence (ISO8601 date)

**Request Body**: None

### 2.3. Create Event

**HTTP Method**: `POST`

**URL Structure**: `/api/events`

**Query Parameters**: None

**Request Body**:

```json
{
  "family_id": "uuid (required)",
  "title": "string (required)",
  "start_time": "ISO8601 timestamp (required)",
  "end_time": "ISO8601 timestamp (required)",
  "is_all_day": "boolean (optional, default: false)",
  "event_type": "elastic|blocker (optional, default: elastic)",
  "recurrence_pattern": {
    "frequency": "daily|weekly|monthly (required if recurring)",
    "interval": "integer (optional, default: 1)",
    "end_date": "ISO8601 date (required if recurring)"
  },
  "participants": [
    {
      "id": "uuid (required)",
      "type": "user|child (required)"
    }
  ]
}
```

### 2.4. Update Event

**HTTP Method**: `PATCH`

**URL Structure**: `/api/events/{eventId}`

**Path Parameters**:

- `eventId` (required): UUID of the event

**Query Parameters**:

- `scope` (optional, default: 'this'): 'this' | 'future' | 'all'
  - 'this': Update only the specified occurrence (requires `date` parameter for recurring events)
  - 'future': Update this and all future occurrences from specified date
  - 'all': Update all occurrences
- `date` (optional): Required when scope='this' for recurring events - ISO8601 date of occurrence to modify

**Request Body**:

```json
{
  "title": "string (optional)",
  "start_time": "ISO8601 timestamp (optional)",
  "end_time": "ISO8601 timestamp (optional)",
  "is_all_day": "boolean (optional)",
  "event_type": "elastic|blocker (optional)",
  "recurrence_pattern": "object (optional)",
  "participants": [
    {
      "id": "uuid",
      "type": "user|child"
    }
  ]
}
```

### 2.5. Delete Event

**HTTP Method**: `DELETE`

**URL Structure**: `/api/events/{eventId}`

**Path Parameters**:

- `eventId` (required): UUID of the event

**Query Parameters**:

- `scope` (optional, default: 'this'): 'this' | 'future' | 'all'
- `date` (optional): Required when scope='this' for recurring events

**Request Body**: None

### 2.6. Validate Event

**HTTP Method**: `POST`

**URL Structure**: `/api/events/validate`

**Query Parameters**: None

**Request Body**:

```json
{
  "family_id": "uuid (required)",
  "title": "string (required)",
  "start_time": "ISO8601 timestamp (required)",
  "end_time": "ISO8601 timestamp (required)",
  "is_all_day": "boolean (optional)",
  "event_type": "elastic|blocker (required)",
  "participants": [
    {
      "id": "uuid",
      "type": "user|child"
    }
  ],
  "exclude_event_id": "uuid (optional, for updates)"
}
```

## 3. Used Types

### 3.1. DTOs (Data Transfer Objects)

From `src/types.ts`:

- **`CreateEventCommand`**: Input for creating events (validated via `createEventCommandSchema`)
- **`UpdateEventCommand`**: Input for updating events (validated via `updateEventCommandSchema`)
- **`ValidateEventCommand`**: Input for validating events (validated via `validateEventCommandSchema`)
- **`EventDTO`**: Base event data structure
- **`EventWithParticipantsDTO`**: Event with participant information
- **`EventDetailsDTO`**: Detailed event with participants and exceptions
- **`EventParticipantDTO`**: Participant information in responses
- **`ParticipantReferenceDTO`**: Participant reference in create/update commands
- **`RecurrencePatternDTO`**: Recurrence pattern structure
- **`EventExceptionDTO`**: Exception details for recurring events
- **`ListEventsResponseDTO`**: Response for list endpoint with pagination
- **`CreateEventResponseDTO`**: Response for create endpoint
- **`UpdateEventResponseDTO`**: Response for update endpoint
- **`ValidationResultDTO`**: Response for validate endpoint
- **`ConflictingEventDTO`**: Conflicting event information
- **`EventConflictErrorDTO`**: Error response for conflicts
- **`PaginationDTO`**: Pagination metadata

### 3.2. Database Entity Types

From `src/db/database.types.ts`:

- **`EventEntity`**: Database row type for events table
- **`EventInsert`**: Database insert type for events
- **`EventUpdate`**: Database update type for events
- **`EventParticipantEntity`**: Database row type for event_participants table
- **`EventExceptionEntity`**: Database row type for event_exceptions table
- **`EventType`**: Enum type ('elastic' | 'blocker')

### 3.3. Domain Types

- **`Result<T, E>`**: Result pattern type for error handling
- **`DomainError`**: Base error class with status codes
- **`ValidationError`**: Validation error with field details
- **`NotFoundError`**: Resource not found error (404)
- **`ForbiddenError`**: Authorization error (403)
- **`UnauthorizedError`**: Authentication error (401)
- **`ConflictError`**: Conflict error (409)

## 4. Response Details

### 4.1. List Events Response (200 OK)

```json
{
  "events": [
    {
      "id": "uuid",
      "family_id": "uuid",
      "title": "string",
      "start_time": "ISO8601 timestamp",
      "end_time": "ISO8601 timestamp",
      "is_all_day": "boolean",
      "event_type": "elastic|blocker",
      "recurrence_pattern": "object|null",
      "is_synced": "boolean",
      "external_calendar_id": "uuid|null",
      "created_at": "ISO8601 timestamp",
      "updated_at": "ISO8601 timestamp",
      "participants": [
        {
          "id": "uuid",
          "name": "string",
          "type": "user|child",
          "avatar_url": "string|null"
        }
      ],
      "has_conflict": "boolean"
    }
  ],
  "pagination": {
    "total": "integer",
    "limit": "integer",
    "offset": "integer",
    "has_more": "boolean"
  }
}
```

### 4.2. Get Single Event Response (200 OK)

```json
{
  "id": "uuid",
  "family_id": "uuid",
  "title": "string",
  "start_time": "ISO8601 timestamp",
  "end_time": "ISO8601 timestamp",
  "is_all_day": "boolean",
  "event_type": "elastic|blocker",
  "recurrence_pattern": {
    "frequency": "daily|weekly|monthly",
    "interval": "integer",
    "end_date": "ISO8601 date"
  },
  "is_synced": "boolean",
  "external_calendar_id": "uuid|null",
  "created_at": "ISO8601 timestamp",
  "updated_at": "ISO8601 timestamp",
  "participants": [
    {
      "id": "uuid",
      "name": "string",
      "type": "user|child",
      "avatar_url": "string|null"
    }
  ],
  "exceptions": [
    {
      "id": "uuid",
      "original_date": "ISO8601 timestamp",
      "new_start_time": "ISO8601 timestamp|null",
      "new_end_time": "ISO8601 timestamp|null",
      "is_cancelled": "boolean"
    }
  ]
}
```

### 4.3. Create Event Response (201 Created)

```json
{
  "id": "uuid",
  "family_id": "uuid",
  "title": "string",
  "start_time": "ISO8601 timestamp",
  "end_time": "ISO8601 timestamp",
  "is_all_day": "boolean",
  "event_type": "elastic|blocker",
  "recurrence_pattern": "object|null",
  "is_synced": false,
  "created_at": "ISO8601 timestamp",
  "updated_at": "ISO8601 timestamp",
  "participants": [...]
}
```

### 4.4. Update Event Response (200 OK)

```json
{
  "id": "uuid",
  "family_id": "uuid",
  "title": "string",
  "start_time": "ISO8601 timestamp",
  "end_time": "ISO8601 timestamp",
  "is_all_day": "boolean",
  "event_type": "elastic|blocker",
  "recurrence_pattern": "object|null",
  "is_synced": false,
  "created_at": "ISO8601 timestamp",
  "updated_at": "ISO8601 timestamp",
  "participants": [...],
  "exception_created": "boolean (true if scope='this' created an exception)"
}
```

### 4.5. Delete Event Response (204 No Content)

No response body.

### 4.6. Validate Event Response (200 OK)

```json
{
  "valid": "boolean",
  "errors": [
    {
      "field": "string",
      "message": "string"
    }
  ],
  "conflicts": [
    {
      "id": "uuid",
      "title": "string",
      "start_time": "ISO8601 timestamp",
      "end_time": "ISO8601 timestamp",
      "participants": [...]
    }
  ]
}
```

### 4.7. Error Responses

**400 Bad Request**:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "details": {
    "field": "additional context"
  }
}
```

**401 Unauthorized**:

```json
{
  "error": "UNAUTHORIZED",
  "message": "Authentication required"
}
```

**403 Forbidden**:

```json
{
  "error": "FORBIDDEN",
  "message": "You do not have access to this family"
}
```

**404 Not Found**:

```json
{
  "error": "NOT_FOUND",
  "message": "Event with id {id} not found"
}
```

**409 Conflict** (for blocker event conflicts):

```json
{
  "error": "conflict",
  "message": "This blocker event conflicts with an existing blocker event",
  "conflicting_events": [
    {
      "id": "uuid",
      "title": "string",
      "start_time": "ISO8601 timestamp",
      "end_time": "ISO8601 timestamp"
    }
  ]
}
```

## 5. Data Flow

### 5.1. List Events Flow

```
1. Client Request → GET /api/events?family_id=...&start_date=...&end_date=...
2. Middleware → Authentication check (JWT validation)
3. Middleware → Repository injection (EventRepository, FamilyRepository)
4. API Route → Extract and validate query parameters
5. API Route → Call EventService.listEvents()
6. EventService → Validate family membership via FamilyRepository
7. EventService → Call EventRepository.findByDateRange() with filters
8. EventRepository → Query database with date range and filters
9. EventRepository → Expand recurring events within date range
10. EventRepository → Apply event exceptions to recurring events
11. EventRepository → Load participants for each event
12. EventRepository → Check conflicts for blocker events
13. EventService → Format response with pagination metadata
14. API Route → Map Result to HTTP Response (200 OK)
15. Client ← JSON response with events array and pagination
```

### 5.2. Create Event Flow

```
1. Client Request → POST /api/events with event data
2. Middleware → Authentication check
3. Middleware → Repository injection
4. API Route → Parse and validate request body (Zod schema)
5. API Route → Call EventService.createEvent()
6. EventService → Validate family membership
7. EventService → Validate event data (title, times, participants)
8. EventService → If blocker event, check for conflicts via EventRepository.checkConflicts()
9. EventService → If conflicts found, return ConflictError (409)
10. EventService → Call EventRepository.create() to insert event
11. EventRepository → Insert event record into events table
12. EventRepository → Insert participant records into event_participants table
13. EventService → Load created event with participants
14. EventService → Create audit log entry (event.create)
15. API Route → Map Result to HTTP Response (201 Created)
16. Client ← JSON response with created event
```

### 5.3. Update Event Flow (with scope handling)

```
1. Client Request → PATCH /api/events/{id}?scope=this&date=...
2. Middleware → Authentication check
3. Middleware → Repository injection
4. API Route → Parse path params, query params, and request body
5. API Route → Call EventService.updateEvent()
6. EventService → Load existing event via EventRepository.findById()
7. EventService → Validate event exists (return 404 if not)
8. EventService → Validate family membership
9. EventService → Check if event is synced (return 403 if synced)
10. EventService → Determine scope (this/future/all)
11. EventService → If scope='this' and recurring:
    - Create event_exception record
    - Return updated event with exception_created=true
12. EventService → If scope='future' and recurring:
    - Adjust base event recurrence_pattern.end_date
    - Create new event for future occurrences
    - Return updated event
13. EventService → If scope='all':
    - Update base event
    - Delete existing exceptions
    - Return updated event
14. EventService → If blocker event, check for conflicts
15. EventService → Create audit log entry (event.update)
16. API Route → Map Result to HTTP Response (200 OK)
17. Client ← JSON response with updated event
```

### 5.4. Delete Event Flow

```
1. Client Request → DELETE /api/events/{id}?scope=this&date=...
2. Middleware → Authentication check
3. Middleware → Repository injection
4. API Route → Parse path and query parameters
5. API Route → Call EventService.deleteEvent()
6. EventService → Load existing event
7. EventService → Validate event exists and user has access
8. EventService → Check if event is synced (return 403 if synced)
9. EventService → Determine scope (this/future/all)
10. EventService → If scope='this' and recurring:
    - Create event_exception with is_cancelled=true
11. EventService → If scope='future' and recurring:
    - Adjust recurrence_pattern.end_date
12. EventService → If scope='all':
    - Delete event record (cascades to participants and exceptions)
13. EventService → Create audit log entry (event.delete)
14. API Route → Map Result to HTTP Response (204 No Content)
15. Client ← No response body
```

### 5.5. Validate Event Flow

```
1. Client Request → POST /api/events/validate with event data
2. Middleware → Authentication check
3. Middleware → Repository injection
4. API Route → Parse and validate request body
5. API Route → Call EventService.validateEvent()
6. EventService → Validate family membership
7. EventService → Validate event data (Zod schema)
8. EventService → If blocker event, check for conflicts
9. EventService → Return validation result with errors and conflicts
10. API Route → Map Result to HTTP Response (200 OK)
11. Client ← JSON response with validation result
```

## 6. Security Considerations

### 6.1. Authentication

- **JWT Token Validation**: All endpoints require a valid JWT token in the `Authorization: Bearer <token>` header
- **Token Verification**: Middleware validates token using `supabase.auth.getUser()`
- **Token Expiration**: Expired tokens result in 401 Unauthorized response
- **Missing Token**: Requests without Authorization header return 401

### 6.2. Authorization

- **Family Membership Check**: All endpoints verify that the authenticated user is a member of the family associated with the event
- **Family ID Validation**: For create/update operations, validate that `family_id` matches a family the user belongs to
- **Event Ownership**: Users can only access events from families they are members of
- **Synced Event Protection**: Synced events (`is_synced: true`) cannot be modified or deleted (403 Forbidden)

### 6.3. Input Validation

- **Zod Schema Validation**: All request bodies are validated using Zod schemas from `src/types.ts`
- **UUID Validation**: All UUID parameters are validated for correct format
- **Date/Time Validation**: ISO8601 timestamps validated, end_time must be after start_time
- **String Length Limits**: Title max 200 chars, other strings validated per schema
- **Enum Validation**: Event types, participant types, scopes validated against allowed values
- **Participant Validation**: Participants must reference existing users or children in the family

### 6.4. SQL Injection Prevention

- **Parameterized Queries**: All database queries use Supabase client with parameterized queries
- **Type Safety**: TypeScript types prevent invalid data structures
- **RLS Policies**: Row-Level Security policies enforce data isolation at database level

### 6.5. Data Exposure Prevention

- **Family Isolation**: Events are filtered by family_id, users cannot access events from other families
- **Participant Privacy**: Only participants from the same family are included in responses
- **Error Messages**: Error messages do not expose sensitive information (e.g., database structure)

### 6.6. Rate Limiting

- **Request Limits**: Consider implementing rate limiting (100 requests/minute per user as per API plan)
- **Conflict Check Limits**: Conflict detection queries are optimized to prevent DoS

### 6.7. Audit Logging

- **Action Logging**: All create/update/delete operations are logged to `logs` table
- **Actor Tracking**: Log entries include actor_id (user) and actor_type
- **Action Details**: Log details include event_id, title, event_type for traceability

## 7. Error Handling

### 7.1. Error Types and Status Codes

| Error Scenario                          | Status Code | Error Type        | Message                                                        |
| --------------------------------------- | ----------- | ----------------- | -------------------------------------------------------------- |
| Missing/invalid JWT token               | 401         | UnauthorizedError | "Authentication required"                                      |
| User not member of family               | 403         | ForbiddenError    | "You do not have access to this family"                        |
| Event not found                         | 404         | NotFoundError     | "Event with id {id} not found"                                 |
| Invalid request body format             | 400         | ValidationError   | "Invalid JSON in request body"                                 |
| Missing required field                  | 400         | ValidationError   | "{field} is required"                                          |
| Invalid field value                     | 400         | ValidationError   | "{field}: {message}"                                           |
| End time before start time              | 400         | ValidationError   | "End time must be after start time"                            |
| Invalid recurrence pattern              | 400         | ValidationError   | "Recurrence end date must be after start time"                 |
| Blocker event conflict                  | 409         | ConflictError     | "This blocker event conflicts with an existing blocker event"  |
| Attempt to modify synced event          | 403         | ForbiddenError    | "Synced events cannot be modified"                             |
| Invalid scope for non-recurring event   | 400         | ValidationError   | "Scope can only be 'all' for non-recurring events"             |
| Missing date parameter for scope='this' | 400         | ValidationError   | "Date parameter required for scope='this' on recurring events" |
| Participant not found                   | 400         | ValidationError   | "Participant {id} not found in family"                         |
| Database error                          | 500         | DomainError       | "Internal server error"                                        |

### 7.2. Error Response Format

All errors follow the standard format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "field": "additional context"
  }
}
```

For validation errors with multiple fields:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": {
    "title": "Title is required",
    "end_time": "End time must be after start time"
  }
}
```

For conflict errors:

```json
{
  "error": "conflict",
  "message": "This blocker event conflicts with an existing blocker event",
  "conflicting_events": [...]
}
```

### 7.3. Error Handling Flow

1. **Input Validation**: Validate request parameters and body using Zod schemas
2. **Business Logic Validation**: Validate business rules (e.g., end_time > start_time)
3. **Authorization Check**: Verify user has access to the resource
4. **Conflict Detection**: For blocker events, check for time overlaps
5. **Database Operations**: Handle database errors and convert to domain errors
6. **Result Mapping**: Map `Result<T, DomainError>` to HTTP response with appropriate status code

### 7.4. Logging Errors

- **Validation Errors**: Logged at INFO level (expected user errors)
- **Authorization Errors**: Logged at WARN level (potential security concern)
- **Conflict Errors**: Logged at INFO level (expected business logic)
- **Database Errors**: Logged at ERROR level with stack trace
- **Unexpected Errors**: Logged at ERROR level, return generic 500 to client

## 8. Performance Considerations

### 8.1. Database Query Optimization

- **Indexes**: Ensure indexes exist on:
  - `events(family_id, start_time, end_time)` - Composite index for date range queries
  - `events(external_calendar_id)` - For sync operations
  - `event_participants(event_id)` - For loading participants
  - `event_participants(user_id, child_id)` - For participant filtering
  - `event_exceptions(event_id, original_date)` - For exception lookups

- **Query Strategies**:
  - Use date range filters to limit event queries
  - Limit recurring event expansion to requested time window
  - Batch participant loading using JOINs or batch queries
  - Use database views for complex event queries with participants

### 8.2. Recurring Event Expansion

- **On-the-fly Generation**: Generate recurring event occurrences at query time, not storage time
- **Date Range Limiting**: Only expand occurrences within the requested date range
- **Exception Application**: Efficiently apply exceptions using indexed lookups
- **Caching Consideration**: Consider caching expanded occurrences for frequently accessed date ranges (future optimization)

### 8.3. Conflict Detection Performance

- **Indexed Queries**: Use indexed queries on event_type, start_time, end_time
- **Participant Filtering**: Filter by participant_ids early in the query
- **Time Overlap Calculation**: Use efficient SQL overlap conditions:
  ```sql
  WHERE start_time < new_end_time AND end_time > new_start_time
  ```
- **Batch Conflict Checks**: For multiple participants, batch conflict checks in a single query

### 8.4. Pagination

- **Limit Enforcement**: Enforce maximum limit (100) to prevent excessive queries
- **Offset Performance**: For large offsets (>10,000), consider cursor-based pagination (future optimization)
- **Total Count**: Calculate total count efficiently using COUNT(\*) with same filters

### 8.5. Response Size

- **Participant Data**: Include only necessary participant fields (id, name, type, avatar_url)
- **Exception Data**: Include exceptions only in detailed event view, not list view
- **Recurrence Pattern**: Include full pattern only when needed

### 8.6. Caching Opportunities

- **Family Membership**: Cache family membership checks per request
- **Participant Lists**: Cache family member/child lists per request
- **Event Lists**: Consider caching event lists for short time windows (future optimization)

### 8.7. Background Processing

- **Conflict Detection**: For large participant lists, consider async conflict detection (future optimization)
- **Recurring Event Updates**: For scope='all' on large recurring series, consider background processing

## 9. Implementation Steps

### Step 1: Create Domain Layer Foundation

1. **Create Result Type** (`src/domain/result.ts`):
   - Define `Result<T, E>` type
   - Implement `ok()`, `err()`, `isOk()`, `isErr()` helper functions

2. **Create Domain Errors** (`src/domain/errors.ts`):
   - `DomainError` base class with `code` and `statusCode`
   - `ValidationError` with field details
   - `NotFoundError` (404)
   - `UnauthorizedError` (401)
   - `ForbiddenError` (403)
   - `ConflictError` (409) with conflicting events array

### Step 2: Extend EventRepository Interface

1. **Update EventRepository** (`src/repositories/interfaces/EventRepository.ts`):
   - Add methods for conflict detection: `checkConflicts()`
   - Add methods for recurring events: `findRecurringOccurrences()`, `createException()`
   - Add methods for participant management: `addParticipants()`, `removeParticipants()`, `getParticipants()`
   - Add query methods: `findByDateRange()`, `findByParticipantIds()`, `findByEventType()`
   - Update return types to include participants and exceptions

### Step 3: Implement SQL EventRepository

1. **Implement SQL EventRepository** (`src/repositories/implementations/sql/SQLEventRepository.ts`):
   - Implement all interface methods using Supabase client
   - Handle recurring event expansion logic
   - Implement conflict detection queries
   - Handle event exceptions (create, read, apply)
   - Implement participant CRUD operations
   - Add proper error handling and type conversions

### Step 4: Create EventService

1. **Create EventService** (`src/services/EventService.ts`):
   - Implement `listEvents()`: Handle filtering, pagination, recurring expansion
   - Implement `getEventById()`: Load event with participants and exceptions
   - Implement `createEvent()`: Validation, conflict detection, creation
   - Implement `updateEvent()`: Scope handling, exception creation, conflict detection
   - Implement `deleteEvent()`: Scope handling, exception creation
   - Implement `validateEvent()`: Validation and conflict checking without saving
   - All methods return `Result<T, DomainError>`

### Step 5: Create HTTP Utilities

1. **Create Response Mapper** (`src/lib/http/responseMapper.ts`):
   - Implement `mapResultToResponse()` function
   - Handle success responses with configurable status codes (including 204 No Content)
   - Handle error responses with proper status codes and error format
   - Support `ConflictError` with `conflictingEvents` in response body
   - Support `ValidationError` with `details` field for field-level errors

2. **Create API Helpers** (`src/lib/http/apiHelpers.ts`):
   - Implement `requireAuth()`: Extract and validate user from locals, returns Response on failure
   - Implement `parseJSON()`: Parse request body with error handling, returns Result
   - Implement `validatePathParams()`: Validate path parameters against Zod schema
   - Implement `validateQueryParams()`: Validate query parameters against Zod schema
   - Implement `validateBody()`: Validate request body against Zod schema
   - Implement `handleApiRequest()`: Wrapper for error handling with context logging

### Step 6: Create API Routes

1. **Create List Events Route** (`src/pages/api/events/index.ts`):
   - Implement `GET` handler wrapped in `handleApiRequest()`
   - Use `requireAuth()` for authentication
   - Use `validateQueryParams()` with `listEventsQuerySchema`
   - Call `EventService.listEvents()` with parsed query parameters
   - Map Result to HTTP response
   - Implement `POST` handler for creating events
   - Use `validateBody()` with `createEventCommandSchema`
   - Call `EventService.createEvent()`
   - Return 201 Created status

2. **Create Single Event Route** (`src/pages/api/events/[id].ts`):
   - Implement `GET` handler: Load event with details
   - Use `validatePathParams()` with `eventIdPathSchema`
   - Use `validateQueryParams()` with `getEventQuerySchema` for optional date parameter
   - Implement `PATCH` handler: Update event with scope handling
   - Use `validateQueryParams()` with `updateEventQuerySchema` for scope and date
   - Use `validateBody()` with `updateEventCommandSchema`
   - Implement `DELETE` handler: Delete event with scope handling
   - All handlers wrapped in `handleApiRequest()` with context string
   - Map Results to HTTP responses with appropriate status codes

3. **Create Validate Route** (`src/pages/api/events/validate.ts`):
   - Implement `POST` handler wrapped in `handleApiRequest()`
   - Use `requireAuth()` for authentication
   - Use `validateBody()` with `validateEventCommandSchema`
   - Call `EventService.validateEvent()`
   - Map Result to HTTP response

### Step 7: Implement Conflict Detection Logic

1. **Conflict Detection Algorithm** (in `EventService`):
   - For each participant in the event
   - Query existing blocker events with overlapping time ranges
   - Account for recurring events and exceptions
   - Return list of conflicting events
   - Handle `exclude_event_id` for update operations

2. **Recurring Event Overlap**:
   - Generate all occurrences within relevant time range
   - Apply exceptions (cancelled or rescheduled)
   - Check each occurrence for overlaps

### Step 8: Implement Recurring Event Logic

1. **Recurrence Pattern Storage**:
   - Store as JSON in `recurrence_pattern` column
   - Validate frequency, interval, end_date

2. **Occurrence Generation**:
   - Generate occurrences on-the-fly during queries
   - Limit to requested date range
   - Apply exceptions (cancellations, reschedules)

3. **Exception Handling**:
   - Create `event_exceptions` records for single occurrence modifications
   - Handle cancellations (`is_cancelled: true`)
   - Handle reschedules (new_start_time, new_end_time)

4. **Scope-based Updates**:
   - `scope='this'`: Create exception for specific date
   - `scope='future'`: Adjust end_date, create new event
   - `scope='all'`: Update base event, delete exceptions

### Step 9: Implement Participant Management

1. **Participant Loading**:
   - Load participants with event queries
   - Join with `users` and `children` tables
   - Format as `EventParticipantDTO` with name and avatar_url

2. **Participant Validation**:
   - Verify participants exist in the family
   - Validate participant types (user vs child)
   - Handle participant updates during event updates

### Step 10: Add Audit Logging

1. **Log Creation** (in `EventService`):
   - Log `event.create` on creation
   - Log `event.update` on updates (with scope details)
   - Log `event.delete` on deletions
   - Include event_id, title, event_type in log details

2. **Log Repository**:
   - Use existing `LogRepository` interface
   - Create log entries with actor_id, family_id, action, details

### Step 11: Add Input Validation

1. **Request Body Validation**:
   - Use Zod schemas from `src/types.ts`
   - Validate `CreateEventCommand`, `UpdateEventCommand`, `ValidateEventCommand`
   - Return `ValidationError` with field-level details

2. **Query Parameter Validation**:
   - Validate UUIDs, dates, enums
   - Validate date ranges (start_date < end_date)
   - Validate pagination parameters (limit, offset)

### Step 12: Add Authorization Checks

1. **Family Membership Validation**:
   - Check user is member of event's family
   - Use `FamilyRepository.isUserMember()`
   - Return `ForbiddenError` if not member

2. **Synced Event Protection**:
   - Check `is_synced` flag before updates/deletes
   - Return `ForbiddenError` if attempting to modify synced event

### Step 13: Error Handling and Testing

1. **Error Handling**:
   - Ensure all service methods return `Result<T, DomainError>`
   - Map all errors to appropriate HTTP status codes
   - Format error responses consistently

2. **Unit Tests** (using Vitest):
   - Test `EventService` methods with in-memory repositories
   - Test conflict detection logic
   - Test recurring event expansion
   - Test scope-based updates
   - Test error scenarios

3. **Integration Tests**:
   - Test API routes with test database
   - Test authentication and authorization
   - Test conflict detection end-to-end
   - Test recurring event operations

### Step 14: Documentation and Code Review

1. **Code Documentation**:
   - Add JSDoc comments to all public methods
   - Document complex algorithms (conflict detection, recurrence expansion)
   - Document error scenarios

2. **API Documentation**:
   - Ensure API responses match specification
   - Document all query parameters and their effects
   - Document scope behavior for recurring events

3. **Code Review Checklist**:
   - [ ] All methods return `Result<T, DomainError>`
   - [ ] All errors mapped to correct HTTP status codes
   - [ ] Input validation using Zod schemas
   - [ ] Authorization checks in place
   - [ ] Conflict detection implemented correctly
   - [ ] Recurring event logic handles all scopes
   - [ ] Audit logging for all mutations
   - [ ] Error responses follow standard format
   - [ ] Database queries use indexes
   - [ ] No SQL injection vulnerabilities

### Step 15: Performance Optimization

1. **Query Optimization**:
   - Review and optimize database queries
   - Ensure proper use of indexes
   - Optimize conflict detection queries
   - Optimize recurring event expansion

2. **Response Optimization**:
   - Minimize response payload size
   - Optimize participant loading
   - Consider pagination improvements

3. **Caching** (future):
   - Consider caching family membership
   - Consider caching event lists for short windows
   - Consider caching participant lists

## 10. Testing Strategy

### 10.1. Unit Tests

- **EventService Tests**:
  - Test each service method with various inputs
  - Test error scenarios (not found, forbidden, validation)
  - Test conflict detection logic
  - Test recurring event expansion
  - Test scope-based updates/deletes

- **Repository Tests**:
  - Test SQL repository with test database
  - Test in-memory repository for fast unit tests
  - Test conflict detection queries
  - Test participant management

### 10.2. Integration Tests

- **API Route Tests**:
  - Test all endpoints with authenticated requests
  - Test authorization (family membership)
  - Test input validation
  - Test error responses
  - Test conflict detection end-to-end

### 10.3. E2E Tests (Playwright)

- **Event Creation Flow**:
  - Create event with participants
  - Verify event appears in list
  - Verify conflict detection works

- **Recurring Event Flow**:
  - Create recurring event
  - Update single occurrence
  - Update future occurrences
  - Delete single occurrence
  - Verify exceptions are applied

- **Authorization Flow**:
  - Attempt to access event from different family
  - Verify 403 response

## 11. Dependencies

### 11.1. Required Services

- **FamilyService**: For family membership validation
- **UserService**: For user profile loading (participants)
- **ChildService**: For child profile loading (participants)

### 11.2. Required Repositories

- **EventRepository**: Event CRUD operations
- **FamilyRepository**: Family membership checks
- **UserRepository**: User profile loading
- **ChildRepository**: Child profile loading
- **LogRepository**: Audit logging

### 11.3. External Dependencies

- **Supabase Client**: Database access
- **Zod**: Runtime validation
- **TypeScript**: Type safety

## 12. Future Enhancements

1. **Real-time Updates**: Use Supabase real-time subscriptions for live event updates
2. **Advanced Filtering**: Add more filter options (tags, categories)
3. **Event Templates**: Support for event templates
4. **Bulk Operations**: Support for bulk event creation/updates
5. **Event Search**: Full-text search on event titles and descriptions
6. **Event Attachments**: Support for file attachments
7. **Event Reminders**: Notification system for upcoming events
8. **Event Analytics**: Usage analytics and reporting
