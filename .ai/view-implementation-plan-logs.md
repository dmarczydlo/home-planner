# API Endpoint Implementation Plan: List Audit Logs

## 1. Endpoint Overview

The `/api/logs` endpoint retrieves audit logs for the authenticated user's families. This endpoint implements role-based access control where:

- **Admins** can view all logs for families they belong to
- **Regular members** can only view logs related to their own actions
- **System actions** are visible to all family members

The endpoint supports filtering by family, actor, action type, and date range, with pagination support for efficient data retrieval.

**Purpose**: Provide an audit trail of user and system actions for transparency and accountability within family groups.

## 2. Request Details

- **HTTP Method**: `GET`
- **URL Structure**: `/api/logs`
- **Authentication**: Required (JWT token in `Authorization` header)

### Query Parameters

All query parameters are optional:

- **`family_id`** (optional, string, UUID): Filter logs by specific family. User must be a member of this family.
- **`actor_id`** (optional, string, UUID): Filter logs by specific user who performed the action.
- **`action`** (optional, string): Filter by action type (e.g., `'event.create'`, `'family.update'`, `'member.invite'`).
- **`start_date`** (optional, string, ISO8601 date): Start of time range filter (inclusive). Format: `YYYY-MM-DD`.
- **`end_date`** (optional, string, ISO8601 date): End of time range filter (inclusive). Format: `YYYY-MM-DD`.
- **`limit`** (optional, number, integer): Maximum number of results per page. Default: `50`. Minimum: `1`. Maximum: `100`.
- **`offset`** (optional, number, integer): Pagination offset. Default: `0`. Minimum: `0`.

### Request Body

None (GET request)

### Query Parameter Validation Rules

1. **`family_id`**: Must be a valid UUID format if provided
2. **`actor_id`**: Must be a valid UUID format if provided
3. **`action`**: Must be a non-empty string if provided
4. **`start_date`**: Must be a valid ISO8601 date format (`YYYY-MM-DD`) if provided
5. **`end_date`**: Must be a valid ISO8601 date format (`YYYY-MM-DD`) if provided. If both `start_date` and `end_date` are provided, `end_date` must be greater than or equal to `start_date`
6. **`limit`**: Must be an integer between 1 and 100 if provided
7. **`offset`**: Must be a non-negative integer if provided

## 3. Used Types

### DTOs (from `src/types.ts`)

- **`LogDTO`**: Base log entity with fields:
  - `id`: number (integer, positive)
  - `family_id`: string (UUID) | null
  - `actor_id`: string (UUID) | null
  - `actor_type`: `'user'` | `'system'`
  - `action`: string
  - `details`: Record<string, unknown> | null
  - `created_at`: string (ISO8601 timestamp)

- **`ListLogsResponseDTO`**: Response structure:
  - `logs`: Array<`LogDTO`>
  - `pagination`: `PaginationDTO` with:
    - `total`: number (total count of matching logs)
    - `limit`: number (requested limit)
    - `offset`: number (requested offset)
    - `has_more`: boolean (indicates if more results exist)

- **`PaginationDTO`**: Pagination metadata (already defined in `src/types.ts`)

### Database Entity Types

- **`LogEntity`**: Database row type from `Tables<"logs">` (from `src/db/database.types.ts`)

### Query Parameter Schema (New)

Create a Zod schema for query parameter validation:

```typescript
// Add to src/types.ts

export const listLogsQuerySchema = z.object({
  family_id: uuidSchema.optional(),
  actor_id: uuidSchema.optional(),
  action: z.string().min(1).optional(),
  start_date: dateSchema.optional(),
  end_date: dateSchema.optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.end_date) >= new Date(data.start_date);
    }
    return true;
  },
  {
    message: "end_date must be greater than or equal to start_date",
    path: ["end_date"],
  }
);

export type ListLogsQuery = z.infer<typeof listLogsQuerySchema>;
```

### Repository Interface Types

- **`LogRepository`**: Interface to be created in `src/repositories/interfaces/LogRepository.ts`

```typescript
export interface LogQueryFilters {
  family_id?: string;
  actor_id?: string;
  action?: string;
  start_date?: Date;
  end_date?: Date;
  limit: number;
  offset: number;
}

export interface LogQueryResult {
  logs: Log[];
  total: number;
}

export interface Log {
  id: number;
  family_id: string | null;
  actor_id: string | null;
  actor_type: 'user' | 'system';
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface LogRepository {
  findByFilters(filters: LogQueryFilters, userId: string, isAdmin: boolean): Promise<LogQueryResult>;
}
```

## 4. Response Details

### Success Response (200 OK)

```json
{
  "logs": [
    {
      "id": 123,
      "family_id": "550e8400-e29b-41d4-a716-446655440000",
      "actor_id": "660e8400-e29b-41d4-a716-446655440001",
      "actor_type": "user",
      "action": "event.create",
      "details": {
        "event_id": "770e8400-e29b-41d4-a716-446655440002",
        "title": "Piano Lesson",
        "event_type": "blocker"
      },
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

### Error Responses

#### 401 Unauthorized

```json
{
  "error": "UNAUTHORIZED",
  "message": "Authentication required"
}
```

**When**: Missing or invalid JWT token in `Authorization` header.

#### 403 Forbidden

```json
{
  "error": "FORBIDDEN",
  "message": "You do not have access to view logs for this family"
}
```

**When**: User attempts to filter by a `family_id` for which they are not a member.

#### 400 Bad Request

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid query parameters",
  "fields": {
    "end_date": "end_date must be greater than or equal to start_date",
    "limit": "limit must be between 1 and 100"
  }
}
```

**When**: Invalid query parameter values (invalid UUIDs, invalid dates, invalid limit/offset ranges, date range validation fails).

#### 500 Internal Server Error

```json
{
  "error": "INTERNAL_ERROR",
  "message": "An unexpected error occurred"
}
```

**When**: Database errors or other unexpected server-side failures.

## 5. Data Flow

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │ GET /api/logs?family_id=...&limit=50
       │ Authorization: Bearer <jwt_token>
       ▼
┌─────────────────────┐
│  Astro Middleware   │
│  - Auth Check        │
│  - Repository DI     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   API Route          │
│  (GET handler)      │
│  - Parse query params│
│  - Validate input    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   LogService         │
│  - Authorization     │
│  - Business logic    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  FamilyRepository    │
│  - Check membership  │
│  - Check admin role  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   LogRepository      │
│  - Query database    │
│  - Apply filters     │
│  - Apply RLS         │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   Supabase/Postgres  │
│  - Execute query     │
│  - Return results    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   Response Mapper    │
│  - Map to DTO        │
│  - Format response   │
└──────┬──────────────┘
       │
       ▼
┌─────────────┐
│   Client     │
└─────────────┘
```

### Detailed Flow Steps

1. **Request Reception**: Astro middleware receives the GET request and validates JWT token
2. **Authentication**: Middleware extracts user ID from JWT and attaches to `locals.user`
3. **Repository Injection**: Middleware creates repositories and attaches to `locals.repositories`
4. **Query Parameter Parsing**: API route extracts and parses query parameters from URL
5. **Input Validation**: Query parameters are validated against Zod schema
6. **Authorization Check**: Service checks if user is member of requested family (if `family_id` provided)
7. **Role Determination**: Service checks if user is admin of the family (affects filtering logic)
8. **Log Retrieval**: Repository queries database with appropriate filters and RLS policies
9. **Result Mapping**: Service maps database entities to DTOs
10. **Response**: API route maps `Result` to HTTP response with appropriate status code

## 6. Security Considerations

### Authentication

- **JWT Token Validation**: All requests must include a valid JWT token in the `Authorization: Bearer <token>` header
- **Token Expiration**: Expired tokens are rejected with 401 Unauthorized
- **Token Verification**: Middleware uses Supabase Auth to verify token validity

### Authorization

#### Family Membership Check

- If `family_id` is provided, verify the authenticated user is a member of that family
- If user is not a member, return 403 Forbidden
- This prevents users from accessing logs of families they don't belong to

#### Role-Based Filtering

- **Admin Users**: Can view all logs for families they belong to (no actor filtering applied)
- **Regular Members**: Can only view logs where `actor_id` matches their user ID OR `actor_type` is `'system'`
- **System Actions**: Always visible to all family members regardless of role

#### Database-Level Security (RLS)

- Supabase Row-Level Security policies enforce that users can only query logs for families they belong to
- RLS policies use the `is_family_member()` helper function
- This provides defense-in-depth security at the database level

### Input Validation

- **UUID Validation**: `family_id` and `actor_id` must be valid UUIDs to prevent injection attacks
- **Date Validation**: Date parameters must be valid ISO8601 dates to prevent malformed queries
- **Range Validation**: `limit` and `offset` are bounded to prevent resource exhaustion
- **Date Range Validation**: `end_date` must be >= `start_date` to prevent invalid queries

### Data Exposure Prevention

- **Details Field**: The `details` field may contain sensitive information. Ensure it's only returned for authorized users
- **Actor Information**: Regular members cannot see logs of other users' actions (except system actions)
- **Family Isolation**: Logs are strictly isolated by family membership

### Potential Security Threats

1. **Unauthorized Family Access**: User attempts to access logs for a family they're not a member of
   - **Mitigation**: Verify family membership before querying logs
   - **Mitigation**: RLS policies prevent database-level access

2. **Information Disclosure**: Regular members viewing other users' actions
   - **Mitigation**: Apply actor filtering for non-admin users
   - **Mitigation**: Only return logs where `actor_id` matches user ID or `actor_type` is `'system'`

3. **Query Parameter Injection**: Malicious query parameters to extract unauthorized data
   - **Mitigation**: Strict validation of all query parameters
   - **Mitigation**: Use parameterized queries in repository implementation

4. **Resource Exhaustion**: Large limit values causing performance issues
   - **Mitigation**: Enforce maximum limit of 100
   - **Mitigation**: Database indexes on frequently queried fields

5. **Date Range Abuse**: Extremely large date ranges causing slow queries
   - **Mitigation**: Consider enforcing maximum date range (e.g., 1 year)
   - **Mitigation**: Database indexes on `created_at` field

## 7. Error Handling

### Error Scenarios and Handling

#### 1. Missing Authentication (401)

**Scenario**: Request missing `Authorization` header or token is invalid/expired

**Handling**:
- Middleware detects missing/invalid token
- Returns 401 Unauthorized immediately
- No service or repository calls made

**Implementation**:
```typescript
const userId = requireAuth(locals);
if (userId instanceof Response) return userId;
```

#### 2. Unauthorized Family Access (403)

**Scenario**: User provides `family_id` for a family they're not a member of

**Handling**:
- Service checks family membership using `FamilyRepository.isUserMember()`
- If not a member, return `err(new ForbiddenError("You do not have access to view logs for this family"))`
- Map to 403 Forbidden response

**Implementation**:
```typescript
if (filters.family_id) {
  const isMember = await this.familyRepo.isUserMember(filters.family_id, userId);
  if (!isMember) {
    return err(new ForbiddenError("You do not have access to view logs for this family"));
  }
}
```

#### 3. Invalid Query Parameters (400)

**Scenario**: Invalid UUID format, invalid date format, invalid limit/offset values, or date range validation fails

**Handling**:
- Validate query parameters using Zod schema
- If validation fails, return `err(new ValidationError(...))` with field-level error details
- Map to 400 Bad Request response

**Implementation**:
```typescript
const validationResult = validateSchema(listLogsQuerySchema, queryParams);
if (!validationResult.success) {
  return err(new ValidationError(
    "Invalid query parameters",
    formatZodErrors(validationResult.error)
  ));
}
```

#### 4. Database Errors (500)

**Scenario**: Database connection failures, query errors, or other infrastructure issues

**Handling**:
- Catch database errors in repository implementation
- Convert to `DomainError` with status code 500
- Log error for monitoring
- Return generic error message to client (don't expose internal details)

**Implementation**:
```typescript
try {
  const result = await this.logRepo.findByFilters(filters, userId, isAdmin);
  return ok(result);
} catch (error) {
  console.error("Database error in LogService:", error);
  return err(new DomainError(
    "Failed to retrieve logs",
    "DATABASE_ERROR",
    500
  ));
}
```

### Error Response Format

All errors follow the standard error response format:

```typescript
{
  error: string;      // Error code (e.g., "UNAUTHORIZED", "VALIDATION_ERROR")
  message: string;    // Human-readable error message
  details?: {         // Optional additional context
    [key: string]: unknown;
  }
}
```

For validation errors, the `details` field contains field-level errors:

```typescript
{
  error: "VALIDATION_ERROR",
  message: "Invalid query parameters",
  details: {
    end_date: "end_date must be greater than or equal to start_date",
    limit: "limit must be between 1 and 100"
  }
}
```

## 8. Performance Considerations

### Database Indexes

Ensure the following indexes exist on the `logs` table for optimal query performance:

1. **Composite Index on `(family_id, created_at)`**: For filtering by family and date range
   ```sql
   CREATE INDEX idx_logs_family_created ON public.logs(family_id, created_at DESC);
   ```

2. **Index on `actor_id`**: For filtering by actor
   ```sql
   CREATE INDEX idx_logs_actor ON public.logs(actor_id);
   ```

3. **Index on `action`**: For filtering by action type
   ```sql
   CREATE INDEX idx_logs_action ON public.logs(action);
   ```

4. **Index on `created_at`**: For date range queries
   ```sql
   CREATE INDEX idx_logs_created_at ON public.logs(created_at DESC);
   ```

### Query Optimization

1. **Limit Result Set**: Always apply `LIMIT` and `OFFSET` to prevent large result sets
2. **Date Range Filtering**: Use indexed `created_at` field for efficient date range queries
3. **Selective Columns**: Only select required columns from database (avoid `SELECT *`)
4. **RLS Performance**: RLS policies use indexed `family_members` table for membership checks

### Pagination Strategy

- **Default Limit**: 50 records per page (reasonable default)
- **Maximum Limit**: 100 records (prevents resource exhaustion)
- **Offset-Based Pagination**: Simple but can be slow for large offsets
- **Future Consideration**: Consider cursor-based pagination for better performance with large datasets

### Caching Considerations

- **No Caching**: Logs are audit data and should always reflect current state
- **Real-Time Requirement**: Users expect to see latest logs immediately
- **Cache Invalidation**: Not applicable (no caching)

### Potential Bottlenecks

1. **Large Date Ranges**: Queries spanning months/years may be slow
   - **Mitigation**: Consider enforcing maximum date range (e.g., 90 days)
   - **Mitigation**: Ensure `created_at` index exists

2. **High-Volume Families**: Families with many actions generate many log entries
   - **Mitigation**: Pagination limits result set size
   - **Mitigation**: Database indexes optimize queries

3. **Complex Filtering**: Multiple filters combined may slow queries
   - **Mitigation**: Database indexes on all filterable columns
   - **Mitigation**: Query planner should optimize based on indexes

## 9. Implementation Steps

### Step 1: Create Query Parameter Schema

**File**: `src/types.ts`

Add the `listLogsQuerySchema` and `ListLogsQuery` type as defined in section 3.

**Validation**:
- Ensure schema includes all query parameters with proper validation rules
- Add date range validation refinement
- Export the schema and type

### Step 2: Create LogRepository Interface

**File**: `src/repositories/interfaces/LogRepository.ts`

Create the repository interface with:
- `LogQueryFilters` interface
- `LogQueryResult` interface
- `Log` interface (or use `LogEntity` from database types)
- `LogRepository` interface with `findByFilters` method

**Export**: Add to `src/repositories/interfaces/index.ts`

### Step 3: Implement SQL LogRepository

**File**: `src/repositories/implementations/sql/SQLLogRepository.ts`

Implement the repository:
- Use Supabase client from constructor
- Implement `findByFilters` method with:
  - Build query with filters
  - Apply RLS (handled by Supabase)
  - Apply actor filtering for non-admin users
  - Apply pagination (limit/offset)
  - Get total count for pagination metadata
  - Map database rows to `Log` entities

**Key Implementation Notes**:
- For non-admin users, add filter: `(actor_id = userId OR actor_type = 'system')`
- Use `.select()` to specify columns
- Use `.order('created_at', { ascending: false })` for chronological order
- Use `.range(offset, offset + limit - 1)` for pagination
- Get total count separately using `.select('id', { count: 'exact', head: true })`

### Step 4: Implement In-Memory LogRepository

**File**: `src/repositories/implementations/in-memory/InMemoryLogRepository.ts`

Create in-memory implementation for testing:
- Store logs in memory array
- Implement same filtering logic as SQL version
- Useful for unit tests

### Step 5: Update Repository Factory

**File**: `src/repositories/factory.ts`

Add `LogRepository` to factory functions:
- Add to `createRepositories` function (SQL implementation)
- Add to `createInMemoryRepositories` function (in-memory implementation)
- Export `LogRepository` type

### Step 6: Extend FamilyRepository Interface (if needed)

**File**: `src/repositories/interfaces/FamilyRepository.ts`

Ensure `isUserAdmin` method exists:
- If not present, add method to check if user is admin of a family
- Implement in SQL and in-memory repositories

### Step 7: Create LogService

**File**: `src/services/LogService.ts`

Create service with business logic:
- Constructor accepts `LogRepository` and `FamilyRepository`
- Implement `listLogs` method:
  - Accept `ListLogsQuery` and `userId`
  - Validate query parameters (already validated in route, but double-check)
  - Check family membership if `family_id` provided
  - Determine if user is admin of the family
  - Call repository with appropriate filters
  - Map results to DTOs
  - Return `Result<ListLogsResponseDTO, DomainError>`

**Authorization Logic**:
```typescript
// Check family membership
if (query.family_id) {
  const isMember = await this.familyRepo.isUserMember(query.family_id, userId);
  if (!isMember) {
    return err(new ForbiddenError("You do not have access to view logs for this family"));
  }
  
  // Check admin role
  const isAdmin = await this.familyRepo.isUserAdmin(query.family_id, userId);
  // Pass isAdmin flag to repository for filtering
}
```

### Step 8: Create API Route

**File**: `src/pages/api/logs/index.ts`

Create GET handler:
- Extract query parameters from `url.searchParams`
- Parse and validate using `listLogsQuerySchema`
- Use `handleApiRequest()` with `querySchema` option
- Pass `listLogsQuerySchema` to validate query parameters
- Handler receives validated `query` data automatically
- Authentication is handled automatically by `handleApiRequest()`
- Instantiate `LogService` with repositories from `locals.repositories`
- Call `logService.listLogs(query, userId)`
- Map `Result` to HTTP response using `mapResultToResponse`
- Return response

**Implementation Pattern**:
```typescript
import type { APIContext } from "astro";
import { handleApiRequest } from "@/lib/http/apiHelpers";
import { mapResultToResponse } from "@/lib/http/responseMapper";
import { listLogsQuerySchema, type ListLogsQuery } from "@/types";

export const prerender = false;

export async function GET({ url, locals }: APIContext) {
  return handleApiRequest<unknown, ListLogsQuery>({
    handler: async ({ userId, query, locals }) => {
      const logService = new LogService(
        locals.repositories.log,
        locals.repositories.family
      );
      const result = await logService.listLogs(query, userId);
      return mapResultToResponse(result);
    },
    context: "GET /api/logs",
    querySchema: listLogsQuerySchema,
    url,
    locals,
  });
}
```

### Step 9: Create Domain Errors (if not exists)

**File**: `src/domain/errors.ts` (or ensure exists)

Ensure these error classes exist:
- `DomainError` (base class)
- `ValidationError`
- `UnauthorizedError`
- `ForbiddenError`

### Step 10: Create Result Type Helpers (if not exists)

**File**: `src/domain/result.ts` (or ensure exists)

Ensure Result type and helpers exist:
- `Result<T, E>` type
- `ok<T>(data: T)` function
- `err<E>(error: E)` function
- `isOk` and `isErr` type guards

### Step 11: Create Response Mapper (if not exists)

**File**: `src/lib/http/responseMapper.ts` (or ensure exists)

Ensure `mapResultToResponse` function exists for mapping `Result` to HTTP responses.

### Step 12: Create API Helpers (if not exists)

**File**: `src/lib/http/apiHelpers.ts` (or ensure exists)

Ensure `handleApiRequest` helper exists for authentication and validation (automatically handles `requireAuth`).

### Step 13: Add Database Indexes

**File**: `supabase/migrations/[timestamp]_add_logs_indexes.sql`

Create migration to add indexes:
```sql
-- Index for family_id and created_at (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_logs_family_created 
ON public.logs(family_id, created_at DESC);

-- Index for actor_id filtering
CREATE INDEX IF NOT EXISTS idx_logs_actor 
ON public.logs(actor_id);

-- Index for action filtering
CREATE INDEX IF NOT EXISTS idx_logs_action 
ON public.logs(action);

-- Index for created_at date range queries
CREATE INDEX IF NOT EXISTS idx_logs_created_at 
ON public.logs(created_at DESC);
```

### Step 14: Write Unit Tests

**File**: `src/services/__tests__/LogService.test.ts`

Test cases:
- Successfully retrieve logs for admin user
- Successfully retrieve logs for regular member (only own actions)
- Return error when user not member of family
- Return error when invalid query parameters
- Test pagination
- Test filtering by family_id, actor_id, action, date range
- Test system actions visible to all members

**File**: `src/repositories/implementations/__tests__/SQLLogRepository.test.ts`

Test cases:
- Query with various filter combinations
- Pagination works correctly
- Actor filtering for non-admin users
- Total count calculation

### Step 15: Write Integration Tests

**File**: `tests/api/logs.test.ts` (Playwright or similar)

Test cases:
- GET `/api/logs` with valid authentication
- GET `/api/logs` without authentication (401)
- GET `/api/logs?family_id=...` for non-member family (403)
- GET `/api/logs` with invalid query parameters (400)
- GET `/api/logs` with various filter combinations
- Verify admin vs member access differences

### Step 16: Update Middleware (if needed)

**File**: `src/middleware/index.ts`

Ensure middleware:
- Validates JWT token
- Creates `LogRepository` instance
- Attaches to `locals.repositories.log`

### Step 17: Documentation

Update API documentation if applicable, ensuring the endpoint is properly documented with examples.

### Step 18: Code Review Checklist

Before considering implementation complete:

- [ ] All query parameters validated with Zod schema
- [ ] Authentication required and validated
- [ ] Authorization checks implemented (family membership, admin role)
- [ ] Actor filtering applied for non-admin users
- [ ] System actions visible to all members
- [ ] Pagination implemented correctly
- [ ] Error handling follows Result pattern
- [ ] All error scenarios return appropriate status codes
- [ ] Database indexes created
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Code follows project coding standards
- [ ] No linter errors
- [ ] TypeScript types are correct
- [ ] Repository interface matches implementation
- [ ] Service uses Result pattern correctly

