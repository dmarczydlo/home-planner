# API Endpoint Implementation Plan: `/api/families`

## 1. Endpoint Overview

The `/api/families` endpoint provides CRUD operations for family resources. A family is the central organizational unit in the Home Planner application, grouping users and children together. All operations require authentication, and certain operations (update, delete) require admin role within the family.

**Endpoints:**
- `POST /api/families` - Create a new family with authenticated user as admin
- `GET /api/families/{familyId}` - Retrieve family details including members and children
- `PATCH /api/families/{familyId}` - Update family details (admin only)
- `DELETE /api/families/{familyId}` - Delete a family and all associated data (admin only)

**Key Business Rules:**
- Creating a family automatically adds the creator as an admin member
- Only family admins can update or delete a family
- All family members can view family details
- Family deletion cascades to all related data (members, children, events, etc.)

## 2. Request Details

### 2.1. POST `/api/families` - Create Family

**HTTP Method:** `POST`

**URL Structure:** `/api/families`

**Authentication:** Required (JWT token in `Authorization` header)

**Request Body:**
```json
{
  "name": "string (required, min: 1, max: 100)"
}
```

**Required Parameters:**
- `name` (string): Family name, must be non-empty and max 100 characters

**Optional Parameters:** None

**Validation Rules:**
- `name` must be present in request body
- `name` must be a non-empty string after trimming
- `name` must not exceed 100 characters
- Request body must be valid JSON
- Request body must not contain unknown fields (strict validation)

### 2.2. GET `/api/families/{familyId}` - Get Family Details

**HTTP Method:** `GET`

**URL Structure:** `/api/families/{familyId}`

**Authentication:** Required (JWT token in `Authorization` header)

**Path Parameters:**
- `familyId` (required): UUID of the family to retrieve

**Query Parameters:** None

**Request Body:** None

**Validation Rules:**
- `familyId` must be a valid UUID format
- `familyId` must be present in URL path

### 2.3. PATCH `/api/families/{familyId}` - Update Family

**HTTP Method:** `PATCH`

**URL Structure:** `/api/families/{familyId}`

**Authentication:** Required (JWT token in `Authorization` header)

**Path Parameters:**
- `familyId` (required): UUID of the family to update

**Query Parameters:** None

**Request Body:**
```json
{
  "name": "string (optional, min: 1, max: 100)"
}
```

**Required Parameters:** None (at least one field must be provided)

**Optional Parameters:**
- `name` (string): New family name, must be non-empty and max 100 characters if provided

**Validation Rules:**
- `familyId` must be a valid UUID format
- If `name` is provided, it must be a non-empty string after trimming
- If `name` is provided, it must not exceed 100 characters
- Request body must be valid JSON
- Request body must not contain unknown fields (strict validation)
- At least one field must be provided in the request body

### 2.4. DELETE `/api/families/{familyId}` - Delete Family

**HTTP Method:** `DELETE`

**URL Structure:** `/api/families/{familyId}`

**Authentication:** Required (JWT token in `Authorization` header)

**Path Parameters:**
- `familyId` (required): UUID of the family to delete

**Query Parameters:** None

**Request Body:** None

**Validation Rules:**
- `familyId` must be a valid UUID format
- `familyId` must be present in URL path

## 3. Used Types

### 3.1. Command Models (Request DTOs)

**CreateFamilyCommand** (`src/types.ts`):
```typescript
{
  name: string; // min: 1, max: 100
}
```

**UpdateFamilyCommand** (`src/types.ts`):
```typescript
{
  name?: string; // min: 1, max: 100 (optional)
}
```

### 3.2. Response DTOs

**CreateFamilyResponseDTO** (`src/types.ts`):
```typescript
{
  id: string;
  name: string;
  created_at: string;
  role: "admin";
}
```

**FamilyDetailsDTO** (`src/types.ts`):
```typescript
{
  id: string;
  name: string;
  created_at: string;
  members: Array<{
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
    role: "admin" | "member";
    joined_at: string;
  }>;
  children: Array<{
    id: string;
    family_id: string;
    name: string;
    created_at: string;
  }>;
}
```

**UpdateFamilyResponseDTO** (`src/types.ts`):
```typescript
{
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}
```

### 3.3. Domain Entities

**FamilyEntity** (`src/db/database.types.ts`):
```typescript
{
  id: string;
  name: string;
  created_at: string;
}
```

**FamilyMemberEntity** (`src/db/database.types.ts`):
```typescript
{
  family_id: string;
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
}
```

**ChildEntity** (`src/db/database.types.ts`):
```typescript
{
  id: string;
  family_id: string;
  name: string;
  created_at: string;
}
```

### 3.4. Zod Schemas

**createFamilyCommandSchema** (`src/types.ts`):
- Validates `name` is required, non-empty, max 100 characters
- Uses `.strict()` to reject unknown fields

**updateFamilyCommandSchema** (`src/types.ts`):
- Validates `name` is optional, but if provided must be non-empty, max 100 characters
- Uses `.strict()` to reject unknown fields

**familyDetailsSchema** (`src/types.ts`):
- Validates complete family details response structure

### 3.5. Repository Interfaces

**FamilyRepository** (`src/repositories/interfaces/FamilyRepository.ts`):
- `findById(id: string): Promise<Family | null>`
- `create(data: CreateFamilyDTO): Promise<Family>`
- `update(id: string, data: UpdateFamilyDTO): Promise<Family>`
- `delete(id: string): Promise<void>`
- `isUserMember(familyId: string, userId: string): Promise<boolean>`

**Additional Methods Needed:**
- `isUserAdmin(familyId: string, userId: string): Promise<boolean>` - Check if user is admin
- `getFamilyMembers(familyId: string): Promise<FamilyMemberWithUser[]>` - Get members with user details
- `addMember(familyId: string, userId: string, role: "admin" | "member"): Promise<void>` - Add member to family

**UserRepository** (`src/repositories/interfaces/UserRepository.ts`):
- `findById(id: string): Promise<User | null>` - Get user details for member list

**ChildRepository** (to be created):
- `findByFamilyId(familyId: string): Promise<Child[]>` - Get all children for a family

## 4. Response Details

### 4.1. POST `/api/families` - Create Family

**Success Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "The Smiths",
  "created_at": "2024-01-15T10:30:00Z",
  "role": "admin"
}
```

**Error Responses:**

| Status Code | Error Code | Message | Details |
|------------|-----------|---------|---------|
| 401 | `unauthorized` | Missing or invalid JWT token | - |
| 400 | `validation_error` | Family name is required | `{ "fields": { "name": "required" } }` |
| 400 | `validation_error` | Family name must be less than 100 characters | `{ "fields": { "name": "max_length" } }` |
| 500 | `internal_error` | Failed to create family | - |

### 4.2. GET `/api/families/{familyId}` - Get Family Details

**Success Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "The Smiths",
  "created_at": "2024-01-15T10:30:00Z",
  "members": [
    {
      "user_id": "660e8400-e29b-41d4-a716-446655440001",
      "full_name": "John Smith",
      "avatar_url": "https://example.com/avatar.jpg",
      "role": "admin",
      "joined_at": "2024-01-15T10:30:00Z"
    },
    {
      "user_id": "770e8400-e29b-41d4-a716-446655440002",
      "full_name": "Jane Smith",
      "avatar_url": null,
      "role": "member",
      "joined_at": "2024-01-16T14:20:00Z"
    }
  ],
  "children": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "family_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Alice Smith",
      "created_at": "2024-01-17T09:00:00Z"
    }
  ]
}
```

**Error Responses:**

| Status Code | Error Code | Message | Details |
|------------|-----------|---------|---------|
| 401 | `unauthorized` | Missing or invalid JWT token | - |
| 400 | `validation_error` | Invalid family ID format | `{ "fields": { "familyId": "invalid_uuid" } }` |
| 403 | `forbidden` | You do not have access to this family | - |
| 404 | `not_found` | Family with id {id} not found | - |
| 500 | `internal_error` | Failed to retrieve family | - |

### 4.3. PATCH `/api/families/{familyId}` - Update Family

**Success Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "The Smith Family",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T15:45:00Z"
}
```

**Error Responses:**

| Status Code | Error Code | Message | Details |
|------------|-----------|---------|---------|
| 401 | `unauthorized` | Missing or invalid JWT token | - |
| 400 | `validation_error` | Invalid family ID format | `{ "fields": { "familyId": "invalid_uuid" } }` |
| 400 | `validation_error` | At least one field must be provided | - |
| 400 | `validation_error` | Family name must be less than 100 characters | `{ "fields": { "name": "max_length" } }` |
| 403 | `forbidden` | You are not an admin of this family | - |
| 404 | `not_found` | Family with id {id} not found | - |
| 500 | `internal_error` | Failed to update family | - |

### 4.4. DELETE `/api/families/{familyId}` - Delete Family

**Success Response (204 No Content):**
- Empty response body
- Status: 204

**Error Responses:**

| Status Code | Error Code | Message | Details |
|------------|-----------|---------|---------|
| 401 | `unauthorized` | Missing or invalid JWT token | - |
| 400 | `validation_error` | Invalid family ID format | `{ "fields": { "familyId": "invalid_uuid" } }` |
| 403 | `forbidden` | You are not an admin of this family | - |
| 404 | `not_found` | Family with id {id} not found | - |
| 500 | `internal_error` | Failed to delete family | - |

## 5. Data Flow

### 5.1. POST `/api/families` - Create Family

```
1. HTTP Request → Astro Middleware
   ↓
2. Authentication Middleware
   - Extract JWT token from Authorization header
   - Validate token with Supabase Auth
   - Set context.locals.user
   ↓
3. Repository Injection Middleware
   - Create Supabase client
   - Create repositories via factory
   - Attach to context.locals.repositories
   ↓
4. API Route Handler (POST /api/families)
   - Call requireAuth(locals) → get userId
   - Parse and validate request body with createFamilyCommandSchema
   - Instantiate FamilyService with repositories
   - Call service.createFamily(command, userId)
   ↓
5. FamilyService.createFamily()
   - Validate input (name required, length constraints)
   - Call familyRepository.create() → returns Family
   - Call familyRepository.addMember(familyId, userId, "admin")
   - Return Result<CreateFamilyResponseDTO>
   ↓
6. Repository Layer
   - familyRepository.create(): INSERT INTO families
   - familyRepository.addMember(): INSERT INTO family_members
   ↓
7. Response Mapping
   - Map Result to HTTP Response
   - 201 Created with family data + role: "admin"
   ↓
8. Audit Logging (Middleware)
   - Log action: "family.create"
   - Store in logs table
```

### 5.2. GET `/api/families/{familyId}` - Get Family Details

```
1. HTTP Request → Astro Middleware
   ↓
2. Authentication Middleware
   ↓
3. Repository Injection Middleware
   ↓
4. API Route Handler (GET /api/families/{familyId})
   - Call requireAuth(locals) → get userId
   - Extract familyId from params
   - Validate familyId is valid UUID
   - Instantiate FamilyService
   - Call service.getFamilyDetails(familyId, userId)
   ↓
5. FamilyService.getFamilyDetails()
   - Validate familyId format
   - Call familyRepository.findById(familyId)
   - If not found → return NotFoundError
   - Call familyRepository.isUserMember(familyId, userId)
   - If not member → return ForbiddenError
   - Call familyRepository.getFamilyMembers(familyId)
   - Call childRepository.findByFamilyId(familyId)
   - Combine into FamilyDetailsDTO
   - Return Result<FamilyDetailsDTO>
   ↓
6. Repository Layer
   - familyRepository.findById(): SELECT FROM families
   - familyRepository.isUserMember(): SELECT FROM family_members
   - familyRepository.getFamilyMembers(): JOIN family_members + users
   - childRepository.findByFamilyId(): SELECT FROM children
   ↓
7. Response Mapping
   - Map Result to HTTP Response
   - 200 OK with family details
```

### 5.3. PATCH `/api/families/{familyId}` - Update Family

```
1. HTTP Request → Astro Middleware
   ↓
2. Authentication Middleware
   ↓
3. Repository Injection Middleware
   ↓
4. API Route Handler (PATCH /api/families/{familyId})
   - Call requireAuth(locals) → get userId
   - Extract familyId from params
   - Parse and validate request body with updateFamilyCommandSchema
   - Instantiate FamilyService
   - Call service.updateFamily(familyId, command, userId)
   ↓
5. FamilyService.updateFamily()
   - Validate familyId format
   - Validate at least one field provided
   - Call familyRepository.findById(familyId)
   - If not found → return NotFoundError
   - Call familyRepository.isUserAdmin(familyId, userId)
   - If not admin → return ForbiddenError
   - Call familyRepository.update(familyId, command)
   - Return Result<UpdateFamilyResponseDTO>
   ↓
6. Repository Layer
   - familyRepository.update(): UPDATE families SET ...
   ↓
7. Response Mapping
   - Map Result to HTTP Response
   - 200 OK with updated family data
   ↓
8. Audit Logging
   - Log action: "family.update"
```

### 5.4. DELETE `/api/families/{familyId}` - Delete Family

```
1. HTTP Request → Astro Middleware
   ↓
2. Authentication Middleware
   ↓
3. Repository Injection Middleware
   ↓
4. API Route Handler (DELETE /api/families/{familyId})
   - Call requireAuth(locals) → get userId
   - Extract familyId from params
   - Validate familyId is valid UUID
   - Instantiate FamilyService
   - Call service.deleteFamily(familyId, userId)
   ↓
5. FamilyService.deleteFamily()
   - Validate familyId format
   - Call familyRepository.findById(familyId)
   - If not found → return NotFoundError
   - Call familyRepository.isUserAdmin(familyId, userId)
   - If not admin → return ForbiddenError
   - Call familyRepository.delete(familyId)
   - Database cascade deletes: members, children, events, etc.
   - Return Result<void>
   ↓
6. Repository Layer
   - familyRepository.delete(): DELETE FROM families WHERE id = ...
   - Database CASCADE handles related records
   ↓
7. Response Mapping
   - Map Result to HTTP Response
   - 204 No Content
   ↓
8. Audit Logging
   - Log action: "family.delete"
```

### 5.5. Database Queries

**Create Family:**
```sql
-- Insert family
INSERT INTO public.families (name)
VALUES ($1)
RETURNING *;

-- Add creator as admin member
INSERT INTO public.family_members (family_id, user_id, role)
VALUES ($1, $2, 'admin');
```

**Get Family Details:**
```sql
-- Get family
SELECT * FROM public.families WHERE id = $1;

-- Check membership
SELECT 1 FROM public.family_members 
WHERE family_id = $1 AND user_id = $2;

-- Get members with user details
SELECT 
  fm.user_id,
  fm.role,
  fm.joined_at,
  u.full_name,
  u.avatar_url
FROM public.family_members fm
INNER JOIN public.users u ON u.id = fm.user_id
WHERE fm.family_id = $1
ORDER BY fm.joined_at ASC;

-- Get children
SELECT * FROM public.children
WHERE family_id = $1
ORDER BY created_at ASC;
```

**Update Family:**
```sql
-- Check admin role
SELECT role FROM public.family_members
WHERE family_id = $1 AND user_id = $2;

-- Update family
UPDATE public.families
SET name = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;
```

**Delete Family:**
```sql
-- Check admin role
SELECT role FROM public.family_members
WHERE family_id = $1 AND user_id = $2;

-- Delete family (CASCADE handles related records)
DELETE FROM public.families WHERE id = $1;
```

## 6. Security Considerations

### 6.1. Authentication

**Mechanism:**
- All endpoints require valid JWT token in `Authorization: Bearer <token>` header
- Token validation performed by Supabase Auth in middleware
- Invalid or missing tokens result in 401 Unauthorized response

**Implementation:**
- Middleware extracts token from request headers
- Calls `supabase.auth.getUser()` to verify token
- Sets `context.locals.user` with authenticated user info
- Routes use `requireAuth()` helper to extract userId

### 6.2. Authorization

**Family Membership Check:**
- GET endpoint requires user to be a member of the family
- Service layer calls `familyRepository.isUserMember()` before returning data
- Non-members receive 403 Forbidden response

**Admin Role Check:**
- PATCH and DELETE endpoints require user to be an admin of the family
- Service layer calls `familyRepository.isUserAdmin()` before allowing operation
- Non-admins receive 403 Forbidden response

**Database-Level Security (RLS):**
- Supabase Row-Level Security policies enforce data isolation
- Users can only access families they belong to
- RLS policies use `is_family_member()` helper function
- Policies prevent unauthorized data access even if application logic fails

### 6.3. Input Validation

**Request Body Validation:**
- All request bodies validated with Zod schemas
- Strict validation rejects unknown fields
- Field-level validation errors returned in response
- Prevents injection attacks and malformed data

**Path Parameter Validation:**
- UUID format validation for `familyId`
- Prevents SQL injection and invalid queries
- Returns 400 Bad Request for invalid formats

**Business Rule Validation:**
- Name length constraints enforced (max 100 characters)
- Empty string validation after trimming
- At least one field required for PATCH requests

### 6.4. Data Sanitization

**Input Sanitization:**
- All string inputs trimmed before processing
- Prevents leading/trailing whitespace issues
- Name fields validated for non-empty after trim

**Output Encoding:**
- All responses use JSON.stringify()
- Prevents XSS attacks in API responses
- Content-Type header set to application/json

### 6.5. Potential Security Threats and Mitigations

| Threat | Mitigation |
|--------|-----------|
| Unauthorized access to family data | JWT authentication + RLS policies |
| Privilege escalation (member → admin) | Admin role check in service layer |
| SQL injection | Parameterized queries via Supabase client |
| XSS attacks | JSON encoding, Content-Type headers |
| CSRF attacks | JWT tokens, SameSite cookies (handled by Supabase) |
| Rate limiting abuse | Implement rate limiting middleware (future) |
| Data enumeration | Return 404 for non-existent families (don't reveal existence) |
| Mass assignment | Strict Zod validation, reject unknown fields |

## 7. Error Handling

### 7.1. Error Types and Status Codes

**Domain Errors (from `src/domain/errors.ts`):**

| Error Class | Status Code | Use Case |
|------------|-------------|----------|
| `UnauthorizedError` | 401 | Missing or invalid JWT token |
| `ValidationError` | 400 | Invalid input data (name too long, missing field, etc.) |
| `ForbiddenError` | 403 | User lacks required permissions (not member/admin) |
| `NotFoundError` | 404 | Family does not exist |
| `DomainError` | 500 | Unexpected infrastructure errors |

### 7.2. Error Response Format

All errors follow consistent format:
```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "details": {
    "field": "additional context"
  }
}
```

**Example Validation Error:**
```json
{
  "error": "validation_error",
  "message": "Family name is required",
  "details": {
    "name": "required"
  }
}
```

**Example Forbidden Error:**
```json
{
  "error": "forbidden",
  "message": "You are not an admin of this family"
}
```

### 7.3. Error Scenarios by Endpoint

#### POST `/api/families`

| Scenario | Error | Status | Handling |
|----------|-------|--------|----------|
| Missing JWT token | UnauthorizedError | 401 | Middleware rejects before route |
| Invalid JWT token | UnauthorizedError | 401 | Middleware rejects before route |
| Missing name field | ValidationError | 400 | Zod schema validation |
| Name too long (>100 chars) | ValidationError | 400 | Zod schema validation |
| Empty name after trim | ValidationError | 400 | Service layer validation |
| Database error | DomainError | 500 | Catch in service, log, return generic error |

#### GET `/api/families/{familyId}`

| Scenario | Error | Status | Handling |
|----------|-------|--------|----------|
| Missing JWT token | UnauthorizedError | 401 | Middleware rejects |
| Invalid familyId format | ValidationError | 400 | UUID validation in service |
| Family not found | NotFoundError | 404 | Repository returns null |
| User not a member | ForbiddenError | 403 | Service checks membership |
| Database error | DomainError | 500 | Catch and log |

#### PATCH `/api/families/{familyId}`

| Scenario | Error | Status | Handling |
|----------|-------|--------|----------|
| Missing JWT token | UnauthorizedError | 401 | Middleware rejects |
| Invalid familyId format | ValidationError | 400 | UUID validation |
| No fields provided | ValidationError | 400 | Service checks at least one field |
| Name too long | ValidationError | 400 | Zod schema validation |
| Family not found | NotFoundError | 404 | Repository returns null |
| User not admin | ForbiddenError | 403 | Service checks admin role |
| Database error | DomainError | 500 | Catch and log |

#### DELETE `/api/families/{familyId}`

| Scenario | Error | Status | Handling |
|----------|-------|--------|----------|
| Missing JWT token | UnauthorizedError | 401 | Middleware rejects |
| Invalid familyId format | ValidationError | 400 | UUID validation |
| Family not found | NotFoundError | 404 | Repository returns null |
| User not admin | ForbiddenError | 403 | Service checks admin role |
| Database error | DomainError | 500 | Catch and log |

### 7.4. Error Logging

**Audit Logging:**
- All state-changing operations logged to `logs` table
- Log entries include: `family_id`, `actor_id`, `action`, `details`
- Actions logged: `family.create`, `family.update`, `family.delete`

**Error Logging:**
- Infrastructure errors logged to application logs
- Include stack traces for debugging
- Do not expose internal errors to clients (return generic 500)

**Log Entry Example:**
```json
{
  "family_id": "550e8400-e29b-41d4-a716-446655440000",
  "actor_id": "660e8400-e29b-41d4-a716-446655440001",
  "actor_type": "user",
  "action": "family.create",
  "details": {
    "name": "The Smiths"
  },
  "created_at": "2024-01-15T10:30:00Z"
}
```

## 8. Performance Considerations

### 8.1. Database Indexes

**Existing Indexes (from schema):**
- `families(id)` - Primary key index (automatic)
- `family_members(family_id, user_id)` - Composite primary key (automatic)

**Recommended Additional Indexes:**
- `family_members(family_id)` - For membership checks (if not covered by PK)
- `family_members(user_id)` - For finding user's families
- `children(family_id)` - For fetching family children

### 8.2. Query Optimization

**GET Family Details:**
- Use JOINs to fetch members and children in single queries
- Avoid N+1 queries by batching data retrieval
- Consider database views for complex member queries

**Optimized Query:**
```sql
-- Single query for members with user details
SELECT 
  fm.user_id,
  fm.role,
  fm.joined_at,
  u.full_name,
  u.avatar_url
FROM public.family_members fm
INNER JOIN public.users u ON u.id = fm.user_id
WHERE fm.family_id = $1
ORDER BY fm.joined_at ASC;
```

### 8.3. Caching Strategy

**Current:** No caching implemented

**Future Considerations:**
- Cache family details for short duration (5 minutes)
- Invalidate cache on family updates/deletes
- Cache family membership checks per request

### 8.4. Potential Bottlenecks

| Operation | Bottleneck | Mitigation |
|-----------|-----------|------------|
| GET with many members | Large result set | Pagination (future enhancement) |
| DELETE with many relations | Cascade delete time | Consider async deletion (future) |
| Concurrent updates | Race conditions | Database transactions |
| Membership checks | Multiple queries | Batch checks, cache per request |

### 8.5. Response Size Optimization

**GET Family Details:**
- Only return necessary fields
- Consider pagination for large member lists (future)
- Use field selection if Supabase supports it

**Current Response Size:**
- Small families: ~1-2 KB
- Large families (50+ members): ~10-20 KB
- Acceptable for current scale

## 9. Implementation Steps

### Step 1: Create Domain Error Types

**File:** `src/domain/errors.ts` (if not exists)

```typescript
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with id ${id} not found` : `${resource} not found`,
      "NOT_FOUND",
      404
    );
  }
}

export class ValidationError extends DomainError {
  constructor(
    message: string,
    public readonly fields?: Record<string, string>
  ) {
    super(message, "VALIDATION_ERROR", 400);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string = "Forbidden") {
    super(message, "FORBIDDEN", 403);
  }
}
```

### Step 2: Create Result Type and Helpers

**File:** `src/domain/result.ts` (if not exists)

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

### Step 3: Extend FamilyRepository Interface

**File:** `src/repositories/interfaces/FamilyRepository.ts`

Add methods:
```typescript
export interface FamilyMemberWithUser {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "admin" | "member";
  joined_at: string;
}

export interface FamilyRepository {
  // ... existing methods ...
  isUserAdmin(familyId: string, userId: string): Promise<boolean>;
  getFamilyMembers(familyId: string): Promise<FamilyMemberWithUser[]>;
  addMember(familyId: string, userId: string, role: "admin" | "member"): Promise<void>;
}
```

### Step 4: Implement Repository Methods

**File:** `src/repositories/implementations/sql/SQLFamilyRepository.ts`

Implement new methods:
```typescript
async isUserAdmin(familyId: string, userId: string): Promise<boolean> {
  const { data } = await this.supabase
    .from("family_members")
    .select("role")
    .eq("family_id", familyId)
    .eq("user_id", userId)
    .single();
  
  return data?.role === "admin";
}

async getFamilyMembers(familyId: string): Promise<FamilyMemberWithUser[]> {
  const { data } = await this.supabase
    .from("family_members")
    .select(`
      user_id,
      role,
      joined_at,
      users!inner(full_name, avatar_url)
    `)
    .eq("family_id", familyId)
    .order("joined_at", { ascending: true });
  
  // Map to FamilyMemberWithUser format
  return data?.map(m => ({
    user_id: m.user_id,
    full_name: m.users.full_name,
    avatar_url: m.users.avatar_url,
    role: m.role,
    joined_at: m.joined_at,
  })) || [];
}

async addMember(familyId: string, userId: string, role: "admin" | "member"): Promise<void> {
  const { error } = await this.supabase
    .from("family_members")
    .insert({
      family_id: familyId,
      user_id: userId,
      role,
    });
  
  if (error) {
    throw new Error(`Failed to add member: ${error.message}`);
  }
}
```

### Step 5: Create ChildRepository Interface

**File:** `src/repositories/interfaces/ChildRepository.ts` (new file)

```typescript
export interface Child {
  id: string;
  family_id: string;
  name: string;
  created_at: string;
}

export interface ChildRepository {
  findByFamilyId(familyId: string): Promise<Child[]>;
}
```

### Step 6: Create FamilyService

**File:** `src/services/FamilyService.ts` (new file)

```typescript
import { Result, ok, err } from "@/domain/result";
import { 
  NotFoundError, 
  ValidationError, 
  ForbiddenError 
} from "@/domain/errors";
import type { FamilyRepository } from "@/repositories/interfaces/FamilyRepository";
import type { ChildRepository } from "@/repositories/interfaces/ChildRepository";
import type { 
  CreateFamilyCommand, 
  UpdateFamilyCommand,
  CreateFamilyResponseDTO,
  FamilyDetailsDTO,
  UpdateFamilyResponseDTO
} from "@/types";

export class FamilyService {
  constructor(
    private readonly familyRepo: FamilyRepository,
    private readonly childRepo: ChildRepository
  ) {}

  async createFamily(
    command: CreateFamilyCommand,
    userId: string
  ): Promise<Result<CreateFamilyResponseDTO, DomainError>> {
    // Validation
    const name = command.name?.trim();
    if (!name || name.length === 0) {
      return err(new ValidationError("Family name is required", { name: "required" }));
    }
    if (name.length > 100) {
      return err(
        new ValidationError("Family name must be less than 100 characters", {
          name: "max_length",
        })
      );
    }

    // Business logic
    try {
      const family = await this.familyRepo.create({ name });
      await this.familyRepo.addMember(family.id, userId, "admin");
      
      return ok({
        id: family.id,
        name: family.name,
        created_at: family.created_at,
        role: "admin",
      });
    } catch (error) {
      return err(new DomainError("Failed to create family", "DATABASE_ERROR", 500));
    }
  }

  async getFamilyDetails(
    familyId: string,
    userId: string
  ): Promise<Result<FamilyDetailsDTO, DomainError>> {
    // Validation
    if (!familyId || !this.isValidUUID(familyId)) {
      return err(new ValidationError("Invalid family ID format", { familyId: "invalid_uuid" }));
    }

    // Business logic
    const family = await this.familyRepo.findById(familyId);
    if (!family) {
      return err(new NotFoundError("Family", familyId));
    }

    // Authorization
    const isMember = await this.familyRepo.isUserMember(familyId, userId);
    if (!isMember) {
      return err(new ForbiddenError("You do not have access to this family"));
    }

    // Fetch related data
    const members = await this.familyRepo.getFamilyMembers(familyId);
    const children = await this.childRepo.findByFamilyId(familyId);

    return ok({
      id: family.id,
      name: family.name,
      created_at: family.created_at,
      members,
      children,
    });
  }

  async updateFamily(
    familyId: string,
    command: UpdateFamilyCommand,
    userId: string
  ): Promise<Result<UpdateFamilyResponseDTO, DomainError>> {
    // Validation
    if (!familyId || !this.isValidUUID(familyId)) {
      return err(new ValidationError("Invalid family ID format", { familyId: "invalid_uuid" }));
    }

    if (!command.name && Object.keys(command).length === 0) {
      return err(new ValidationError("At least one field must be provided"));
    }

    if (command.name !== undefined) {
      const name = command.name.trim();
      if (name.length === 0) {
        return err(new ValidationError("Family name cannot be empty", { name: "required" }));
      }
      if (name.length > 100) {
        return err(
          new ValidationError("Family name must be less than 100 characters", {
            name: "max_length",
          })
        );
      }
    }

    // Business logic
    const family = await this.familyRepo.findById(familyId);
    if (!family) {
      return err(new NotFoundError("Family", familyId));
    }

    // Authorization
    const isAdmin = await this.familyRepo.isUserAdmin(familyId, userId);
    if (!isAdmin) {
      return err(new ForbiddenError("You are not an admin of this family"));
    }

    // Update
    try {
      const updated = await this.familyRepo.update(familyId, command);
      return ok({
        id: updated.id,
        name: updated.name,
        created_at: updated.created_at,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      return err(new DomainError("Failed to update family", "DATABASE_ERROR", 500));
    }
  }

  async deleteFamily(
    familyId: string,
    userId: string
  ): Promise<Result<void, DomainError>> {
    // Validation
    if (!familyId || !this.isValidUUID(familyId)) {
      return err(new ValidationError("Invalid family ID format", { familyId: "invalid_uuid" }));
    }

    // Business logic
    const family = await this.familyRepo.findById(familyId);
    if (!family) {
      return err(new NotFoundError("Family", familyId));
    }

    // Authorization
    const isAdmin = await this.familyRepo.isUserAdmin(familyId, userId);
    if (!isAdmin) {
      return err(new ForbiddenError("You are not an admin of this family"));
    }

    // Delete
    try {
      await this.familyRepo.delete(familyId);
      return ok(undefined);
    } catch (error) {
      return err(new DomainError("Failed to delete family", "DATABASE_ERROR", 500));
    }
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}
```

### Step 7: Create Response Mapper Utility

**File:** `src/lib/http/responseMapper.ts` (if not exists)

```typescript
import type { Result } from "@/domain/result";
import type { DomainError, ValidationError } from "@/domain/errors";

export function mapResultToResponse<T>(
  result: Result<T, DomainError>,
  options?: {
    successStatus?: number;
  }
): Response {
  if (result.success) {
    const status = options?.successStatus ?? 200;
    const body = status === 204 ? undefined : JSON.stringify(result.data);
    
    return new Response(body, {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const error = result.error;
  const errorBody = {
    error: error.code.toLowerCase(),
    message: error.message,
    ...(error instanceof ValidationError && error.fields
      ? { details: error.fields }
      : {}),
  };

  return new Response(JSON.stringify(errorBody), {
    status: error.statusCode,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
```

### Step 8: Create API Helpers

**File:** `src/lib/http/apiHelpers.ts` (if not exists)

```typescript
import type { APIContext } from "astro";
import { UnauthorizedError } from "@/domain/errors";
import { err } from "@/domain/result";
import { mapResultToResponse } from "./responseMapper";

export function requireAuth(locals: APIContext["locals"]): string | Response {
  const user = locals.user;
  if (!user || !user.id) {
    return mapResultToResponse(err(new UnauthorizedError("Missing or invalid JWT token")));
  }
  return user.id;
}

export async function parseJSON<T>(request: Request): Promise<Result<T, ValidationError>> {
  try {
    const data = await request.json();
    return ok(data);
  } catch {
    return err(new ValidationError("Invalid JSON in request body"));
  }
}
```

### Step 9: Create API Routes

**File:** `src/pages/api/families/index.ts` (new file)

```typescript
import type { APIContext } from "astro";
import { FamilyService } from "@/services/FamilyService";
import { mapResultToResponse } from "@/lib/http/responseMapper";
import { requireAuth, parseJSON } from "@/lib/http/apiHelpers";
import { createFamilyCommandSchema } from "@/types";
import { ValidationError } from "@/domain/errors";
import { err } from "@/domain/result";

export const prerender = false;

export async function POST({ request, locals }: APIContext) {
  // Authentication
  const userId = requireAuth(locals);
  if (userId instanceof Response) return userId;

  // Parse and validate body
  const bodyResult = await parseJSON(request);
  if (!bodyResult.success) {
    return mapResultToResponse(bodyResult);
  }

  const validationResult = createFamilyCommandSchema.safeParse(bodyResult.data);
  if (!validationResult.success) {
    return mapResultToResponse(
      err(
        new ValidationError("Invalid request body", {
          ...validationResult.error.flatten().fieldErrors,
        })
      )
    );
  }

  // Business logic
  const familyService = new FamilyService(
    locals.repositories.family,
    locals.repositories.child
  );
  const result = await familyService.createFamily(validationResult.data, userId);

  // Response
  return mapResultToResponse(result, { successStatus: 201 });
}
```

**File:** `src/pages/api/families/[id].ts` (new file)

```typescript
import type { APIContext } from "astro";
import { FamilyService } from "@/services/FamilyService";
import { mapResultToResponse } from "@/lib/http/responseMapper";
import { requireAuth, parseJSON } from "@/lib/http/apiHelpers";
import { updateFamilyCommandSchema } from "@/types";
import { ValidationError } from "@/domain/errors";
import { err } from "@/domain/result";

export const prerender = false;

export async function GET({ params, locals }: APIContext) {
  // Authentication
  const userId = requireAuth(locals);
  if (userId instanceof Response) return userId;

  // Extract and validate familyId
  const familyId = params.id;
  if (!familyId) {
    return mapResultToResponse(
      err(new ValidationError("Family ID is required", { familyId: "required" }))
    );
  }

  // Business logic
  const familyService = new FamilyService(
    locals.repositories.family,
    locals.repositories.child
  );
  const result = await familyService.getFamilyDetails(familyId, userId);

  // Response
  return mapResultToResponse(result);
}

export async function PATCH({ params, request, locals }: APIContext) {
  // Authentication
  const userId = requireAuth(locals);
  if (userId instanceof Response) return userId;

  // Extract and validate familyId
  const familyId = params.id;
  if (!familyId) {
    return mapResultToResponse(
      err(new ValidationError("Family ID is required", { familyId: "required" }))
    );
  }

  // Parse and validate body
  const bodyResult = await parseJSON(request);
  if (!bodyResult.success) {
    return mapResultToResponse(bodyResult);
  }

  const validationResult = updateFamilyCommandSchema.safeParse(bodyResult.data);
  if (!validationResult.success) {
    return mapResultToResponse(
      err(
        new ValidationError("Invalid request body", {
          ...validationResult.error.flatten().fieldErrors,
        })
      )
    );
  }

  // Business logic
  const familyService = new FamilyService(
    locals.repositories.family,
    locals.repositories.child
  );
  const result = await familyService.updateFamily(familyId, validationResult.data, userId);

  // Response
  return mapResultToResponse(result);
}

export async function DELETE({ params, locals }: APIContext) {
  // Authentication
  const userId = requireAuth(locals);
  if (userId instanceof Response) return userId;

  // Extract and validate familyId
  const familyId = params.id;
  if (!familyId) {
    return mapResultToResponse(
      err(new ValidationError("Family ID is required", { familyId: "required" }))
    );
  }

  // Business logic
  const familyService = new FamilyService(
    locals.repositories.family,
    locals.repositories.child
  );
  const result = await familyService.deleteFamily(familyId, userId);

  // Response
  return mapResultToResponse(result, { successStatus: 204 });
}
```

### Step 10: Update Repository Factory

**File:** `src/repositories/factory.ts`

Add child repository to factory:
```typescript
// ... existing code ...
import { SQLChildRepository } from "./implementations/sql/SQLChildRepository";
import { InMemoryChildRepository } from "./implementations/in-memory/InMemoryChildRepository";

export function createRepositories(client: SupabaseClient) {
  return {
    // ... existing repositories ...
    child: new SQLChildRepository(client),
  };
}

export function createInMemoryRepositories() {
  return {
    // ... existing repositories ...
    child: new InMemoryChildRepository(),
  };
}
```

### Step 11: Update TypeScript Types

**File:** `src/env.d.ts` (update)

Add repositories to Astro locals:
```typescript
import type { FamilyRepository } from "./repositories/interfaces/FamilyRepository";
import type { ChildRepository } from "./repositories/interfaces/ChildRepository";
// ... other repository types ...

declare namespace App {
  interface Locals {
    user: import("@supabase/supabase-js").User | null;
    repositories: {
      family: FamilyRepository;
      child: ChildRepository;
      // ... other repositories ...
    };
  }
}
```

### Step 12: Add Audit Logging (Optional)

**File:** `src/middleware/index.ts` (update)

Add logging middleware for state-changing operations:
```typescript
// After repository injection
if (context.request.method !== "GET") {
  // Log state-changing operations
  // Implementation depends on LogRepository availability
}
```

### Step 13: Testing

Create test files:
- `tests/unit/services/FamilyService.test.ts`
- `tests/integration/api/families.test.ts`

Use in-memory repositories for unit tests.

## 10. Additional Notes

### 10.1. Database Constraints

- Family name is NOT NULL
- Family name should have reasonable length limit (100 chars)
- CASCADE deletes handle related records automatically

### 10.2. Future Enhancements

- Pagination for family members list
- Soft delete instead of hard delete
- Family settings/configuration
- Family activity feed
- Rate limiting per user/endpoint

### 10.3. Dependencies

- Supabase client for database operations
- Zod for validation
- TypeScript for type safety
- Astro for API routing

### 10.4. Testing Strategy

- Unit tests for service layer with in-memory repositories
- Integration tests for API routes with test database
- E2E tests with Playwright for full flow
- Test all error scenarios and edge cases

