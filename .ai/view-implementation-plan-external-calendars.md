# API Endpoint Implementation Plan: External Calendars

## 1. Endpoint Overview

The External Calendars API provides endpoints for managing connections to external calendar providers (Google Calendar, Microsoft Outlook) and synchronizing their events with the Home Planner application. This API enables users to:

- List all connected external calendars
- Connect new external calendars via OAuth 2.0 flow
- Handle OAuth callbacks from providers
- Disconnect external calendars
- Manually trigger synchronization for calendars
- Sync all connected calendars at once

The implementation follows Hexagonal Architecture principles with a service layer handling business logic, repository interfaces for data access, and thin API route controllers. All operations use the Result pattern for type-safe error handling.

**Endpoints:**
- `GET /api/external-calendars` - List all external calendars for authenticated user
- `POST /api/external-calendars` - Initiate OAuth flow to connect calendar
- `GET /api/external-calendars/callback` - Handle OAuth callback (public endpoint)
- `DELETE /api/external-calendars/{calendarId}` - Disconnect external calendar
- `POST /api/external-calendars/{calendarId}/sync` - Sync specific calendar
- `POST /api/external-calendars/sync` - Sync all user's calendars

## 2. Request Details

### 2.1. List External Calendars

**HTTP Method:** `GET`

**URL Structure:** `/api/external-calendars`

**Parameters:**
- None

**Request Body:** None

**Authentication:** Required (JWT token in Authorization header)

### 2.2. Connect External Calendar

**HTTP Method:** `POST`

**URL Structure:** `/api/external-calendars`

**Parameters:**
- None

**Request Body:**
```json
{
  "provider": "google" | "microsoft"
}
```

**Authentication:** Required (JWT token in Authorization header)

### 2.3. Handle OAuth Callback

**HTTP Method:** `GET`

**URL Structure:** `/api/external-calendars/callback`

**Query Parameters:**
- `code` (required): Authorization code from OAuth provider
- `state` (required): State parameter for CSRF protection
- `provider` (required): `"google"` or `"microsoft"`

**Request Body:** None

**Authentication:** Not required (public endpoint, validates state token)

### 2.4. Disconnect External Calendar

**HTTP Method:** `DELETE`

**URL Structure:** `/api/external-calendars/{calendarId}`

**Path Parameters:**
- `calendarId` (required): UUID of the external calendar to disconnect

**Request Body:** None

**Authentication:** Required (JWT token in Authorization header)

### 2.5. Sync External Calendar

**HTTP Method:** `POST`

**URL Structure:** `/api/external-calendars/{calendarId}/sync`

**Path Parameters:**
- `calendarId` (required): UUID of the external calendar to sync

**Request Body:** None

**Authentication:** Required (JWT token in Authorization header)

**Rate Limiting:** 1 sync per calendar per 5 minutes

### 2.6. Sync All External Calendars

**HTTP Method:** `POST`

**URL Structure:** `/api/external-calendars/sync`

**Parameters:**
- None

**Request Body:** None

**Authentication:** Required (JWT token in Authorization header)

**Rate Limiting:** Same as individual sync (per calendar)

## 3. Used Types

### 3.1. DTOs (from `src/types.ts`)

**Request DTOs:**
- `ConnectCalendarCommand` - For POST `/api/external-calendars`
  - Validated with `connectCalendarCommandSchema`

**Response DTOs:**
- `ListExternalCalendarsResponseDTO` - For GET `/api/external-calendars`
  - Contains array of `ExternalCalendarSummaryDTO`
- `CalendarAuthResponseDTO` - For POST `/api/external-calendars`
  - Contains `authorization_url` and `state`
- `CalendarSyncResultDTO` - For POST `/api/external-calendars/{calendarId}/sync`
  - Contains sync statistics and status
- `SyncAllCalendarsResponseDTO` - For POST `/api/external-calendars/sync`
  - Contains array of sync results with `calendar_id`

### 3.2. Database Entity Types

**From `src/db/database.types.ts`:**
- `ExternalCalendarEntity` - Database row type
- `ExternalCalendarInsert` - For creating records
- `ExternalCalendarUpdate` - For updating records

### 3.3. Domain Types

**Enums:**
- `CalendarProvider` - `"google" | "microsoft"`
- `CalendarSyncStatus` - `"active" | "error"`
- `SyncStatus` - `"success" | "partial" | "error"`

### 3.4. Repository Interface

**New Interface:** `ExternalCalendarRepository`

```typescript
export interface ExternalCalendarRepository {
  findByUserId(userId: string): Promise<ExternalCalendarEntity[]>;
  findById(id: string): Promise<ExternalCalendarEntity | null>;
  findByUserIdAndProvider(userId: string, provider: string): Promise<ExternalCalendarEntity | null>;
  create(data: ExternalCalendarInsert): Promise<ExternalCalendarEntity>;
  update(id: string, data: ExternalCalendarUpdate): Promise<ExternalCalendarEntity>;
  delete(id: string): Promise<void>;
  updateLastSyncedAt(id: string, syncedAt: string): Promise<void>;
  deleteEventsByCalendarId(calendarId: string): Promise<void>;
}
```

## 4. Response Details

### 4.1. List External Calendars

**Status Code:** `200 OK`

**Response Body:**
```json
{
  "calendars": [
    {
      "id": "uuid",
      "provider": "google",
      "account_email": "user@example.com",
      "last_synced_at": "2024-01-15T10:30:00Z",
      "created_at": "2024-01-01T08:00:00Z",
      "sync_status": "active",
      "error_message": null
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token

### 4.2. Connect External Calendar

**Status Code:** `200 OK`

**Response Body:**
```json
{
  "authorization_url": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "state": "csrf-token-string"
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `400 Bad Request`: Invalid provider value

### 4.3. Handle OAuth Callback

**Status Code:** `302 Found`

**Response:** Redirect to frontend with query parameters:
- Success: `?status=success&calendar_id={uuid}`
- Error: `?status=error&error={error_code}`

**Error Responses:**
- `400 Bad Request`: Invalid or missing query parameters
- `410 Gone`: State token expired or invalid
- `500 Internal Server Error`: OAuth token exchange failed

### 4.4. Disconnect External Calendar

**Status Code:** `204 No Content`

**Response Body:** None

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Calendar does not belong to user
- `404 Not Found`: Calendar does not exist

### 4.5. Sync External Calendar

**Status Code:** `200 OK`

**Response Body:**
```json
{
  "synced_at": "2024-01-15T10:30:00Z",
  "events_added": 5,
  "events_updated": 2,
  "events_removed": 1,
  "status": "success",
  "error_message": null
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Calendar does not belong to user
- `404 Not Found`: Calendar does not exist
- `429 Too Many Requests`: Rate limit exceeded (1 sync per 5 minutes)

### 4.6. Sync All External Calendars

**Status Code:** `200 OK`

**Response Body:**
```json
{
  "results": [
    {
      "calendar_id": "uuid",
      "synced_at": "2024-01-15T10:30:00Z",
      "events_added": 5,
      "events_updated": 2,
      "events_removed": 1,
      "status": "success",
      "error_message": null
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `429 Too Many Requests`: Rate limit exceeded

## 5. Data Flow

### 5.1. List External Calendars Flow

```
Client Request (GET /api/external-calendars)
  ↓
Middleware: Authentication Check
  ↓
API Route: Extract userId from locals.user
  ↓
Service: ExternalCalendarService.listCalendars(userId)
  ↓
Repository: ExternalCalendarRepository.findByUserId(userId)
  ↓
Database: Query external_calendars WHERE user_id = userId
  ↓
Repository: Map entities to DTOs
  ↓
Service: Return Result<ListExternalCalendarsResponseDTO>
  ↓
API Route: mapResultToResponse(result)
  ↓
Client Response (200 OK with calendars array)
```

### 5.2. Connect External Calendar Flow

```
Client Request (POST /api/external-calendars)
  ↓
Middleware: Authentication Check
  ↓
API Route: Parse and validate request body (connectCalendarCommandSchema)
  ↓
Service: ExternalCalendarService.initiateOAuth(userId, provider)
  ↓
Service: Generate CSRF state token (include userId, timestamp, random)
  ↓
Service: Build OAuth authorization URL with:
  - Client ID (from env)
  - Redirect URI (callback URL)
  - Scopes (calendar.readonly for Google, Calendars.Read for Microsoft)
  - State token
  ↓
Service: Store state token temporarily (in-memory cache or database)
  ↓
Service: Return Result<CalendarAuthResponseDTO>
  ↓
API Route: mapResultToResponse(result)
  ↓
Client Response (200 OK with authorization_url)
  ↓
Client: Redirects user to authorization_url
```

### 5.3. OAuth Callback Flow

```
Provider Redirect (GET /api/external-calendars/callback?code=...&state=...&provider=...)
  ↓
API Route: Extract query parameters
  ↓
Service: ExternalCalendarService.handleCallback(code, state, provider)
  ↓
Service: Validate state token (check expiration, extract userId)
  ↓
Service: Exchange authorization code for tokens:
  - Call provider OAuth token endpoint
  - Receive access_token and refresh_token
  ↓
Service: Decrypt and store tokens securely:
  - Encrypt tokens using AES-256
  - Store in external_calendars table
  ↓
Service: Get user email from provider API (using access_token)
  ↓
Service: Check for existing calendar with same user_id + provider + account_email
  ↓
Service: Create or update external_calendars record:
  - user_id, provider, account_email
  - access_token (encrypted), refresh_token (encrypted)
  - expires_at (if provided by provider)
  - sync_status = "active"
  ↓
Service: Trigger initial sync (async, non-blocking)
  ↓
Service: Return Result<{ success: true, calendarId }>
  ↓
API Route: Redirect to frontend with success status
  ↓
Frontend: Display success message, refresh calendar list
```

### 5.4. Disconnect External Calendar Flow

```
Client Request (DELETE /api/external-calendars/{calendarId})
  ↓
Middleware: Authentication Check
  ↓
API Route: Extract calendarId from params
  ↓
Service: ExternalCalendarService.disconnectCalendar(userId, calendarId)
  ↓
Service: Verify calendar ownership (calendar.user_id === userId)
  ↓
Service: Revoke OAuth tokens with provider (best effort, non-blocking)
  ↓
Service: Delete all events with external_calendar_id = calendarId
  ↓
Service: Delete external_calendars record
  ↓
Service: Log action: external_calendar.disconnect
  ↓
Service: Return Result<void>
  ↓
API Route: mapResultToResponse(result, { successStatus: 204 })
  ↓
Client Response (204 No Content)
```

### 5.5. Sync External Calendar Flow

```
Client Request (POST /api/external-calendars/{calendarId}/sync)
  ↓
Middleware: Authentication Check
  ↓
API Route: Extract calendarId from params
  ↓
Service: ExternalCalendarService.syncCalendar(userId, calendarId)
  ↓
Service: Check rate limit (1 sync per 5 minutes per calendar)
  ↓
Service: Verify calendar ownership
  ↓
Service: Load calendar from database
  ↓
Service: Refresh access token if expired:
  - Check expires_at vs current time
  - If expired, call provider refresh token endpoint
  - Update access_token and expires_at in database
  ↓
Service: Fetch events from provider API:
  - Google Calendar API: GET /calendars/primary/events
  - Microsoft Graph API: GET /me/calendar/events
  - Time range: 90 days past, 365 days future
  ↓
Service: Reconcile events:
  - For each external event:
    - Check if synced event exists (by external_id or matching criteria)
    - If exists: Update event (title, times, etc.)
    - If not exists: Create new event with is_synced = true
  - Find synced events not in external list: Mark for deletion
  ↓
Service: Batch update database:
  - Insert new events
  - Update existing events
  - Delete removed events
  ↓
Service: Update calendar.last_synced_at
  ↓
Service: Update calendar.sync_status:
  - "success" if all operations succeeded
  - "partial" if some operations failed
  - "error" if critical failure occurred
  ↓
Service: Log action: external_calendar.sync
  ↓
Service: Return Result<CalendarSyncResultDTO>
  ↓
API Route: mapResultToResponse(result)
  ↓
Client Response (200 OK with sync statistics)
```

### 5.6. Sync All External Calendars Flow

```
Client Request (POST /api/external-calendars/sync)
  ↓
Middleware: Authentication Check
  ↓
API Route: Extract userId from locals.user
  ↓
Service: ExternalCalendarService.syncAllCalendars(userId)
  ↓
Service: Load all user's calendars
  ↓
Service: For each calendar:
  - Check rate limit per calendar
  - Call syncCalendar() for each (parallel or sequential)
  - Collect results
  ↓
Service: Return Result<SyncAllCalendarsResponseDTO>
  ↓
API Route: mapResultToResponse(result)
  ↓
Client Response (200 OK with array of sync results)
```

## 6. Security Considerations

### 6.1. Authentication

**All endpoints except callback require authentication:**
- JWT token validated via Supabase Auth in middleware
- Token extracted from `Authorization: Bearer <token>` header
- Invalid or missing tokens return `401 Unauthorized`

**Callback endpoint:**
- Public endpoint (no JWT required)
- Protected by CSRF state token validation
- State token must be valid and not expired

### 6.2. Authorization

**Calendar Ownership:**
- Users can only access their own calendars
- Ownership verified by `external_calendars.user_id === authenticated_user_id`
- Attempts to access other users' calendars return `403 Forbidden`

**OAuth State Token:**
- State token includes userId, timestamp, and random nonce
- Validated on callback to prevent CSRF attacks
- Tokens expire after 10 minutes
- Tokens are single-use (deleted after successful callback)

### 6.3. Data Protection

**Token Encryption:**
- Access tokens and refresh tokens encrypted before storage
- Use AES-256 encryption with key from environment variables
- Tokens decrypted only when needed for API calls
- Never log or expose tokens in error messages

**Token Storage:**
- Stored in `external_calendars` table
- Encrypted at rest
- Database RLS policies prevent unauthorized access

### 6.4. Input Validation

**Provider Validation:**
- Must be exactly `"google"` or `"microsoft"`
- Validated using Zod schema (`calendarProviderSchema`)
- Invalid values return `400 Bad Request`

**UUID Validation:**
- Calendar IDs validated as UUID format
- Invalid UUIDs return `404 Not Found` (treated as non-existent)

**Query Parameter Validation:**
- OAuth callback parameters validated for presence and format
- Missing required parameters return `400 Bad Request`

### 6.5. Rate Limiting

**Sync Rate Limits:**
- 1 sync per calendar per 5 minutes
- Tracked per calendar (not per user)
- Rate limit violations return `429 Too Many Requests`
- Include `Retry-After` header with seconds until next allowed sync

**Implementation:**
- Store last sync timestamp in database or cache
- Check before initiating sync
- Consider using Redis or in-memory cache for rate limit tracking

### 6.6. OAuth Security

**Authorization URL:**
- Use HTTPS only
- Include appropriate scopes (read-only calendar access)
- State parameter includes CSRF protection
- Redirect URI must match registered callback URL exactly

**Token Exchange:**
- Validate authorization code immediately
- Exchange code for tokens server-side (never expose to client)
- Handle token refresh securely
- Revoke tokens on disconnect (best effort)

### 6.7. Error Information Disclosure

**Avoid exposing:**
- Internal error details
- Database structure
- OAuth token values
- Provider API keys or secrets

**Error Messages:**
- Generic messages for client-facing errors
- Detailed messages logged server-side only
- Use error codes for client error handling

## 7. Error Handling

### 7.1. Domain Errors

**UnauthorizedError (401):**
- Missing or invalid JWT token
- Expired JWT token
- Used in: All authenticated endpoints

**ForbiddenError (403):**
- User attempts to access calendar they don't own
- Used in: DELETE, POST sync endpoints

**NotFoundError (404):**
- Calendar ID doesn't exist
- Used in: DELETE, POST sync endpoints

**ValidationError (400):**
- Invalid provider value (not "google" or "microsoft")
- Missing required query parameters in callback
- Invalid UUID format for calendarId
- Used in: POST connect, GET callback

**RateLimitError (429):**
- Sync rate limit exceeded (1 per 5 minutes)
- Custom error class extending DomainError
- Include `retryAfter` property (seconds)
- Used in: POST sync endpoints

**ConflictError (409):**
- Calendar with same provider + account_email already exists
- Used in: POST callback (if duplicate connection attempted)

**DomainError (500):**
- OAuth token exchange failed
- Provider API errors
- Database errors
- Used in: All endpoints for unexpected failures

### 7.2. Error Response Format

All errors follow standard format:

```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "details": {
    "field": "additional context"
  }
}
```

**Rate Limit Error Example:**
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Sync rate limit exceeded. Please wait before syncing again.",
  "details": {
    "retry_after": 300
  }
}
```

**Validation Error Example:**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid provider value",
  "details": {
    "provider": "must be 'google' or 'microsoft'"
  }
}
```

### 7.3. Error Logging

**Audit Logging:**
- Log all calendar operations to `logs` table:
  - `external_calendar.connect` - On successful OAuth callback
  - `external_calendar.disconnect` - On calendar deletion
  - `external_calendar.sync` - On sync completion (success or failure)

**Error Logging:**
- Log unexpected errors with full context
- Include error stack traces (server-side only)
- Log OAuth failures with error codes (not tokens)
- Log provider API errors with status codes

**Log Entry Structure:**
```json
{
  "family_id": null,
  "actor_id": "user-uuid",
  "actor_type": "user",
  "action": "external_calendar.sync",
  "details": {
    "calendar_id": "uuid",
    "provider": "google",
    "status": "error",
    "error_message": "Token refresh failed"
  }
}
```

### 7.4. Error Scenarios by Endpoint

**GET /api/external-calendars:**
- 401: No authentication token
- 500: Database query failure

**POST /api/external-calendars:**
- 401: No authentication token
- 400: Invalid provider value
- 500: OAuth URL generation failure

**GET /api/external-calendars/callback:**
- 400: Missing code, state, or provider parameters
- 400: Invalid provider value
- 410: State token expired or invalid
- 409: Calendar already connected (same provider + email)
- 500: OAuth token exchange failure
- 500: Provider API error

**DELETE /api/external-calendars/{calendarId}:**
- 401: No authentication token
- 403: Calendar doesn't belong to user
- 404: Calendar not found
- 500: Database deletion failure
- 500: Token revocation failure (non-blocking)

**POST /api/external-calendars/{calendarId}/sync:**
- 401: No authentication token
- 403: Calendar doesn't belong to user
- 404: Calendar not found
- 429: Rate limit exceeded
- 500: Token refresh failure
- 500: Provider API error
- 500: Database sync failure

**POST /api/external-calendars/sync:**
- 401: No authentication token
- 429: Rate limit exceeded (any calendar)
- 500: Partial or complete sync failure

## 8. Performance Considerations

### 8.1. Database Queries

**Optimization Strategies:**
- Index on `external_calendars(user_id)` for fast user calendar lookups
- Index on `external_calendars(user_id, provider)` for duplicate checks
- Index on `events(external_calendar_id)` for sync operations
- Use batch operations for event reconciliation

**Query Patterns:**
```sql
-- List calendars (indexed)
SELECT * FROM external_calendars WHERE user_id = $1;

-- Find calendar (indexed)
SELECT * FROM external_calendars WHERE id = $1 AND user_id = $2;

-- Find duplicate (indexed)
SELECT * FROM external_calendars 
WHERE user_id = $1 AND provider = $2 AND account_email = $3;

-- Delete events (indexed)
DELETE FROM events WHERE external_calendar_id = $1;
```

### 8.2. OAuth Token Management

**Token Refresh:**
- Check token expiration before each sync
- Refresh proactively (before expiration) to avoid sync failures
- Cache refreshed tokens to avoid multiple refresh calls
- Handle refresh failures gracefully (mark calendar as error state)

**Token Storage:**
- Encrypt tokens efficiently (use fast encryption algorithm)
- Consider caching decrypted tokens in memory (short-lived, per-request)
- Never store tokens in logs or error messages

### 8.3. Sync Performance

**Sync Window:**
- Default: 90 days past, 365 days future
- Consider making window configurable
- Limit initial sync to smaller window (e.g., 30 days)
- Incremental syncs can use smaller windows

**Batch Operations:**
- Batch event inserts/updates/deletes
- Use database transactions for consistency
- Process events in chunks (e.g., 100 at a time)
- Consider async processing for large syncs

**Provider API Rate Limits:**
- Google Calendar: 1,000,000 queries per day per user
- Microsoft Graph: 10,000 requests per 10 minutes per app
- Implement exponential backoff for rate limit errors
- Queue syncs if rate limit exceeded

### 8.4. Caching Strategy

**Current:** No caching implemented

**Future Considerations:**
- Cache calendar list per user (5 minutes TTL)
- Cache OAuth state tokens (10 minutes TTL, single-use)
- Cache provider API responses (short-lived, 1-2 minutes)
- Invalidate cache on calendar connect/disconnect

### 8.5. Potential Bottlenecks

| Operation | Bottleneck | Mitigation |
|-----------|-----------|------------|
| List calendars | Large result set | Pagination (future if needed) |
| OAuth callback | Token exchange latency | Async processing, show loading state |
| Sync operation | Large event sets | Batch processing, pagination |
| Sync all calendars | Sequential syncs | Parallel processing (with rate limit awareness) |
| Token refresh | Provider API latency | Proactive refresh, caching |
| Event reconciliation | Database queries | Batch operations, efficient queries |

### 8.6. Response Size Optimization

**List Calendars:**
- Only return necessary fields
- Don't include encrypted tokens
- Current size: ~200 bytes per calendar
- Acceptable for typical user (1-5 calendars)

**Sync Results:**
- Include only summary statistics
- Don't include full event details
- Current size: ~150 bytes per result
- Acceptable for sync operations

## 9. Implementation Steps

### Phase 1: Domain Layer Setup

#### Step 1.1: Create Domain Error Classes
**File:** `src/domain/errors.ts` (add if missing)

Add `RateLimitError` class:

```typescript
export class RateLimitError extends DomainError {
  constructor(
    message: string,
    public readonly retryAfter: number // seconds
  ) {
    super(message, "RATE_LIMIT_EXCEEDED", 429);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
  }
}
```

#### Step 1.2: Verify Result Type
**File:** `src/domain/result.ts` (create if missing)

```typescript
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success;
}

export function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}
```

#### Step 1.3: Verify Shared Types
**File:** `src/types.ts`

Ensure DTOs are defined:
- `ExternalCalendarSummaryDTO`
- `CalendarAuthResponseDTO`
- `CalendarSyncResultDTO`
- `SyncAllCalendarsResponseDTO`
- `ConnectCalendarCommand`
- All related Zod schemas

### Phase 2: Repository Layer

#### Step 2.1: Create ExternalCalendarRepository Interface
**File:** `src/repositories/interfaces/ExternalCalendarRepository.ts`

```typescript
import type { ExternalCalendarEntity, ExternalCalendarInsert, ExternalCalendarUpdate } from "@/types";

export interface ExternalCalendarRepository {
  /**
   * Find all calendars for a user
   */
  findByUserId(userId: string): Promise<ExternalCalendarEntity[]>;

  /**
   * Find calendar by ID
   */
  findById(id: string): Promise<ExternalCalendarEntity | null>;

  /**
   * Find calendar by user ID, provider, and account email
   */
  findByUserIdAndProvider(
    userId: string,
    provider: string,
    accountEmail: string
  ): Promise<ExternalCalendarEntity | null>;

  /**
   * Create new external calendar record
   */
  create(data: ExternalCalendarInsert): Promise<ExternalCalendarEntity>;

  /**
   * Update external calendar record
   */
  update(id: string, data: ExternalCalendarUpdate): Promise<ExternalCalendarEntity>;

  /**
   * Delete external calendar record
   */
  delete(id: string): Promise<void>;

  /**
   * Update last synced timestamp
   */
  updateLastSyncedAt(id: string, syncedAt: string): Promise<void>;

  /**
   * Delete all events associated with calendar
   */
  deleteEventsByCalendarId(calendarId: string): Promise<void>;
}
```

#### Step 2.2: Update Repository Index
**File:** `src/repositories/interfaces/index.ts`

```typescript
export type { ExternalCalendarRepository } from "./ExternalCalendarRepository.ts";
```

#### Step 2.3: Create SQL Implementation
**File:** `src/repositories/implementations/sql/SQLExternalCalendarRepository.ts`

Implement all interface methods using Supabase client:
- Use parameterized queries
- Handle database errors
- Map database rows to entity types
- Implement encryption/decryption for tokens (use lib function)

#### Step 2.4: Create In-Memory Implementation
**File:** `src/repositories/implementations/in-memory/InMemoryExternalCalendarRepository.ts`

Implement for testing:
- Store data in memory Map
- Simulate database operations
- Useful for unit testing services

#### Step 2.5: Update Repository Factory
**File:** `src/repositories/factory.ts`

Add external calendar repository to factory:

```typescript
export function createRepositories(client: SupabaseClient) {
  return {
    // ... existing repositories
    externalCalendar: new SQLExternalCalendarRepository(client),
  };
}

export function createInMemoryRepositories() {
  return {
    // ... existing repositories
    externalCalendar: new InMemoryExternalCalendarRepository(),
  };
}
```

### Phase 3: Service Layer

#### Step 3.1: Create OAuth Provider Abstraction
**File:** `src/lib/oauth/providers.ts`

Create provider interfaces and implementations:
- `GoogleOAuthProvider`
- `MicrosoftOAuthProvider`
- Common interface: `OAuthProvider`

Methods:
- `generateAuthorizationUrl(state: string): string`
- `exchangeCodeForTokens(code: string): Promise<TokenResponse>`
- `refreshToken(refreshToken: string): Promise<TokenResponse>`
- `revokeToken(token: string): Promise<void>`
- `getUserEmail(accessToken: string): Promise<string>`
- `fetchEvents(accessToken: string, timeMin: Date, timeMax: Date): Promise<ExternalEvent[]>`

#### Step 3.2: Create Token Encryption Utility
**File:** `src/lib/encryption/tokenEncryption.ts`

```typescript
export function encryptToken(token: string): string {
  // Use AES-256 encryption
  // Key from environment variable
}

export function decryptToken(encryptedToken: string): string {
  // Decrypt token
}
```

#### Step 3.3: Create State Token Manager
**File:** `src/lib/oauth/stateToken.ts`

```typescript
export function generateStateToken(userId: string): string {
  // Include userId, timestamp, random nonce
  // Sign with secret key
  // Return base64 encoded
}

export function validateStateToken(state: string): { userId: string; valid: boolean } {
  // Decode and validate
  // Check expiration (10 minutes)
  // Return userId if valid
}
```

#### Step 3.4: Create Rate Limit Service
**File:** `src/lib/rateLimit/rateLimiter.ts`

```typescript
export class RateLimiter {
  async checkSyncRateLimit(calendarId: string): Promise<Result<void, RateLimitError>> {
    // Check last sync timestamp
    // Return error if within 5 minutes
    // Update timestamp if allowed
  }
}
```

#### Step 3.5: Create External Calendar Service
**File:** `src/services/ExternalCalendarService.ts`

Implement service methods:
- `listCalendars(userId: string): Promise<Result<ListExternalCalendarsResponseDTO, DomainError>>`
- `initiateOAuth(userId: string, provider: string): Promise<Result<CalendarAuthResponseDTO, DomainError>>`
- `handleCallback(code: string, state: string, provider: string): Promise<Result<{ calendarId: string }, DomainError>>`
- `disconnectCalendar(userId: string, calendarId: string): Promise<Result<void, DomainError>>`
- `syncCalendar(userId: string, calendarId: string): Promise<Result<CalendarSyncResultDTO, DomainError>>`
- `syncAllCalendars(userId: string): Promise<Result<SyncAllCalendarsResponseDTO, DomainError>>`

**Service Responsibilities:**
- Input validation
- Authorization checks (ownership)
- Rate limit checking
- OAuth flow orchestration
- Token management
- Event synchronization logic
- Error handling and conversion

### Phase 4: API Routes

#### Step 4.1: Create List Calendars Route
**File:** `src/pages/api/external-calendars/index.ts`

```typescript
import type { APIContext } from "astro";
import { handleApiRequest } from "@/lib/http/apiHelpers";
import { mapResultToResponse } from "@/lib/http/responseMapper";

export async function GET({ locals }: APIContext) {
  return handleApiRequest({
    handler: async ({ userId, locals }) => {
      const service = new ExternalCalendarService(locals.repositories.externalCalendar);
      const result = await service.listCalendars(userId);
      return mapResultToResponse(result);
    },
    context: "GET /api/external-calendars",
    locals,
  });
}
```

#### Step 4.2: Create Connect Calendar Route
**File:** `src/pages/api/external-calendars/index.ts` (add POST handler)

```typescript
import { connectCalendarCommandSchema, type ConnectCalendarCommand } from "@/types";

export async function POST({ request, locals }: APIContext) {
  return handleApiRequest<unknown, unknown, ConnectCalendarCommand>({
    handler: async ({ userId, body, locals }) => {
      const service = new ExternalCalendarService(locals.repositories.externalCalendar);
      const result = await service.initiateOAuth(userId, body.provider);
      return mapResultToResponse(result);
    },
    context: "POST /api/external-calendars",
    bodySchema: connectCalendarCommandSchema,
    request,
    locals,
  });
}
```

#### Step 4.3: Create OAuth Callback Route
**File:** `src/pages/api/external-calendars/callback.ts`

```typescript
export async function GET({ url, locals }: APIContext) {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const provider = url.searchParams.get("provider");

  // Validate parameters
  if (!code || !state || !provider) {
    return redirect("/?status=error&error=missing_parameters");
  }

  const service = new ExternalCalendarService(locals.repositories.externalCalendar);
  const result = await service.handleCallback(code, state, provider);

  if (!result.success) {
    return redirect(`/?status=error&error=${result.error.code}`);
  }

  return redirect(`/?status=success&calendar_id=${result.data.calendarId}`);
}
```

#### Step 4.4: Create Disconnect Calendar Route
**File:** `src/pages/api/external-calendars/[calendarId].ts`

```typescript
import type { APIContext } from "astro";
import { handleApiRequest } from "@/lib/http/apiHelpers";
import { mapResultToResponse } from "@/lib/http/responseMapper";
import { z } from "zod";
import { uuidSchema } from "@/types";

const calendarIdPathSchema = z.object({ calendarId: uuidSchema });
type CalendarIdPath = z.infer<typeof calendarIdPathSchema>;

export async function DELETE({ params, locals }: APIContext) {
  return handleApiRequest<CalendarIdPath>({
    handler: async ({ userId, path, locals }) => {
      const service = new ExternalCalendarService(locals.repositories.externalCalendar);
      const result = await service.disconnectCalendar(userId, path.calendarId);
      return mapResultToResponse(result, { successStatus: 204 });
    },
    context: "DELETE /api/external-calendars/[calendarId]",
    pathSchema: calendarIdPathSchema,
    params,
    locals,
  });
}
```

#### Step 4.5: Create Sync Calendar Route
**File:** `src/pages/api/external-calendars/[calendarId]/sync.ts`

```typescript
import type { APIContext } from "astro";
import { handleApiRequest } from "@/lib/http/apiHelpers";
import { mapResultToResponse } from "@/lib/http/responseMapper";
import { calendarIdPathSchema, type CalendarIdPath } from "@/types";

export async function POST({ params, locals }: APIContext) {
  return handleApiRequest<CalendarIdPath>({
    handler: async ({ userId, path, locals }) => {
      const service = new ExternalCalendarService(locals.repositories.externalCalendar);
      const result = await service.syncCalendar(userId, path.calendarId);
      return mapResultToResponse(result);
    },
    context: "POST /api/external-calendars/[calendarId]/sync",
    pathSchema: calendarIdPathSchema,
    params,
    locals,
  });
}
```

#### Step 4.6: Create Sync All Calendars Route
**File:** `src/pages/api/external-calendars/sync.ts`

```typescript
import type { APIContext } from "astro";
import { handleApiRequest } from "@/lib/http/apiHelpers";
import { mapResultToResponse } from "@/lib/http/responseMapper";

export async function POST({ locals }: APIContext) {
  return handleApiRequest({
    handler: async ({ userId, locals }) => {
      const service = new ExternalCalendarService(locals.repositories.externalCalendar);
      const result = await service.syncAllCalendars(userId);
      return mapResultToResponse(result);
    },
    context: "POST /api/external-calendars/sync",
    locals,
  });
}
```

### Phase 5: Environment Configuration

#### Step 5.1: Add Environment Variables
**File:** `.env.example`

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/external-calendars/callback

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_REDIRECT_URI=https://your-domain.com/api/external-calendars/callback

# Token Encryption
TOKEN_ENCRYPTION_KEY=your-32-byte-key

# OAuth State Token Secret
OAUTH_STATE_SECRET=your-secret-key
```

### Phase 6: Testing

#### Step 6.1: Unit Tests for Service
**File:** `src/services/__tests__/ExternalCalendarService.test.ts`

Test all service methods with in-memory repositories:
- List calendars
- OAuth initiation
- Callback handling
- Disconnect
- Sync operations
- Error scenarios

#### Step 6.2: Integration Tests for Routes
**File:** `src/pages/api/external-calendars/__tests__/index.test.ts`

Test API routes:
- Authentication checks
- Request validation
- Response formatting
- Error handling

#### Step 6.3: E2E Tests
**File:** `tests/e2e/external-calendars.spec.ts`

Test full flows:
- Connect Google calendar
- Connect Microsoft calendar
- List calendars
- Sync calendar
- Disconnect calendar

### Phase 7: Documentation and Logging

#### Step 7.1: Add Audit Logging
Update service methods to log actions:
- `external_calendar.connect`
- `external_calendar.disconnect`
- `external_calendar.sync`

#### Step 7.2: Add Error Logging
Log errors with context:
- OAuth failures
- Provider API errors
- Sync failures

#### Step 7.3: Update API Documentation
Ensure API plan document reflects implementation details.

### Phase 8: Deployment Considerations

#### Step 8.1: OAuth Provider Setup
- Register OAuth applications with Google and Microsoft
- Configure redirect URIs
- Obtain client IDs and secrets
- Set up scopes (calendar.readonly)

#### Step 8.2: Database Migrations
Ensure `external_calendars` table exists with:
- Proper indexes
- RLS policies
- Encryption support for tokens

#### Step 8.3: Monitoring
- Monitor sync success rates
- Track OAuth callback success rates
- Alert on high error rates
- Monitor rate limit violations

## 10. Additional Considerations

### 10.1. Background Jobs

**Future Enhancement:**
- Implement background job for automatic sync (every 15 minutes)
- Use Supabase Edge Functions or external job queue
- Process syncs asynchronously
- Handle failures and retries

### 10.2. Event Reconciliation Logic

**Complexity:**
- Matching external events to synced events
- Handle event updates vs. duplicates
- Manage event deletions
- Consider using external event IDs if available

### 10.3. Provider-Specific Considerations

**Google Calendar:**
- Use Google Calendar API v3
- Handle pagination for large result sets
- Support multiple calendars (future)
- Handle timezone conversions

**Microsoft Outlook:**
- Use Microsoft Graph API
- Handle different calendar types
- Support delegated access (future)
- Handle Microsoft-specific event formats

### 10.4. Error Recovery

**Token Refresh Failures:**
- Mark calendar as error state
- Allow manual reconnection
- Notify user of sync failures

**Sync Failures:**
- Partial sync results (some events synced, some failed)
- Retry failed operations
- Log detailed error information

### 10.5. Future Enhancements

- Support for multiple calendars per provider
- Webhook-based sync (real-time updates)
- Two-way sync (create events in external calendars)
- Calendar selection (choose which calendars to sync)
- Sync frequency configuration
- Event conflict resolution UI

