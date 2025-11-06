# API Endpoint Implementation Plan: `/api/families/{familyId}/children`

## 1. Endpoint Overview

This implementation plan covers four REST API endpoints for managing child profiles within a family:

- **GET** `/api/families/{familyId}/children` - List all children for a family
- **POST** `/api/families/{familyId}/children` - Create a new child profile
- **PATCH** `/api/families/{familyId}/children/{childId}` - Update an existing child profile
- **DELETE** `/api/families/{familyId}/children/{childId}` - Delete a child profile

All endpoints require authentication and verify that the authenticated user is a member of the specified family. Child profiles represent family members who do not have user accounts (e.g., young children).

## 2. Request Details

### GET `/api/families/{familyId}/children`

**HTTP Method:** GET

**URL Structure:** `/api/families/{familyId}/children`

**Path Parameters:**
- `familyId` (required): UUID of the family

**Query Parameters:** None

**Request Body:** None

**Authentication:** Required (JWT token in Authorization header)

### POST `/api/families/{familyId}/children`

**HTTP Method:** POST

**URL Structure:** `/api/families/{familyId}/children`

**Path Parameters:**
- `familyId` (required): UUID of the family

**Query Parameters:** None

**Request Body:**
```json
{
  "name": "string (required, min: 1, max: 100)"
}
```

**Authentication:** Required (JWT token in Authorization header)

### PATCH `/api/families/{familyId}/children/{childId}`

**HTTP Method:** PATCH

**URL Structure:** `/api/families/{familyId}/children/{childId}`

**Path Parameters:**
- `familyId` (required): UUID of the family
- `childId` (required): UUID of the child

**Query Parameters:** None

**Request Body:**
```json
{
  "name": "string (optional, min: 1, max: 100)"
}
```

**Authentication:** Required (JWT token in Authorization header)

### DELETE `/api/families/{familyId}/children/{childId}`

**HTTP Method:** DELETE

**URL Structure:** `/api/families/{familyId}/children/{childId}`

**Path Parameters:**
- `familyId` (required): UUID of the family
- `childId` (required): UUID of the child

**Query Parameters:** None

**Request Body:** None

**Authentication:** Required (JWT token in Authorization header)

## 3. Used Types

### DTOs and Command Models

All types are defined in `src/types.ts`:

**Request Types:**
- `CreateChildCommand` - Zod schema: `createChildCommandSchema`
  - `name`: string (required, min: 1, max: 100)
- `UpdateChildCommand` - Zod schema: `updateChildCommandSchema`
  - `name`: string (optional, min: 1, max: 100)

**Response Types:**
- `ChildDTO` - Base child data transfer object
  - `id`: UUID
  - `family_id`: UUID
  - `name`: string
  - `created_at`: ISO8601 timestamp
- `ListChildrenResponseDTO` - Zod schema: `listChildrenResponseSchema`
  - `children`: Array of `ChildDTO`
- `UpdateChildResponseDTO` - Zod schema: `updateChildResponseSchema`
  - Extends `ChildDTO` with `updated_at`: ISO8601 timestamp

**Entity Types:**
- `ChildEntity` - Database row type from `Tables<"children">`
- `ChildInsert` - Database insert type from `TablesInsert<"children">`
- `ChildUpdate` - Database update type from `TablesUpdate<"children">`

### Repository Interface Types

**ChildRepository Interface** (to be created in `src/repositories/interfaces/ChildRepository.ts`):

```typescript
export interface Child {
  id: string;
  family_id: string;
  name: string;
  created_at: string;
}

export interface CreateChildDTO {
  family_id: string;
  name: string;
}

export interface UpdateChildDTO {
  name?: string;
}

export interface ChildRepository {
  findByFamilyId(familyId: string): Promise<Child[]>;
  findById(id: string): Promise<Child | null>;
  create(data: CreateChildDTO): Promise<Child>;
  update(id: string, data: UpdateChildDTO): Promise<Child>;
  delete(id: string): Promise<void>;
  belongsToFamily(childId: string, familyId: string): Promise<boolean>;
}
```

## 4. Response Details

### GET `/api/families/{familyId}/children`

**Success Response (200 OK):**
```json
{
  "children": [
    {
      "id": "uuid",
      "family_id": "uuid",
      "name": "string",
      "created_at": "ISO8601 timestamp"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User is not a member of this family
- `404 Not Found`: Family does not exist

### POST `/api/families/{familyId}/children`

**Success Response (201 Created):**
```json
{
  "id": "uuid",
  "family_id": "uuid",
  "name": "string",
  "created_at": "ISO8601 timestamp"
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User is not a member of this family
- `404 Not Found`: Family does not exist
- `400 Bad Request`: Missing required field 'name' or validation error

### PATCH `/api/families/{familyId}/children/{childId}`

**Success Response (200 OK):**
```json
{
  "id": "uuid",
  "family_id": "uuid",
  "name": "string",
  "created_at": "ISO8601 timestamp",
  "updated_at": "ISO8601 timestamp"
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User is not a member of this family
- `404 Not Found`: Family or child does not exist
- `400 Bad Request`: Invalid payload or validation error

### DELETE `/api/families/{familyId}/children/{childId}`

**Success Response (204 No Content):** Empty response body

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User is not a member of this family
- `404 Not Found`: Family or child does not exist

## 5. Data Flow

### High-Level Flow

```
1. HTTP Request
   ↓
2. Astro Middleware
   - Extract JWT token
   - Validate authentication
   - Create Supabase client
   - Inject repositories into context.locals
   ↓
3. API Route Handler
   - Extract path parameters
   - Parse request body (if applicable)
   - Validate input with Zod schemas
   - Call ChildService
   ↓
4. ChildService (Business Logic)
   - Validate family membership
   - Validate input data
   - Call ChildRepository
   - Handle errors and return Result
   ↓
5. ChildRepository (Data Access)
   - Execute database queries via Supabase
   - Return entities or null
   ↓
6. Service maps entities to DTOs
   ↓
7. API Route maps Result to HTTP Response
   ↓
8. HTTP Response
```

### Detailed Data Flow

#### GET `/api/families/{familyId}/children`

1. **Middleware** (`src/middleware/index.ts`):
   - Extracts JWT from Authorization header
   - Validates token via `supabase.auth.getUser()`
   - Creates repositories and attaches to `context.locals`
   - Sets `context.locals.user` with authenticated user

2. **Route Handler** (`src/pages/api/families/[familyId]/children/index.ts`):
   - Extracts `familyId` from `params.familyId`
   - Validates `familyId` is a valid UUID
   - Calls `requireAuth(locals)` helper
   - Instantiates `ChildService` with `locals.repositories.child` and `locals.repositories.family`
   - Calls `childService.listChildren(familyId, userId)`

3. **ChildService** (`src/services/ChildService.ts`):
   - Validates `familyId` is non-empty UUID
   - Calls `familyRepository.findById(familyId)` to verify family exists
   - If family not found, returns `err(new NotFoundError("Family", familyId))`
   - Calls `familyRepository.isUserMember(familyId, userId)` to check authorization
   - If not a member, returns `err(new ForbiddenError("You do not have access to this family"))`
   - Calls `childRepository.findByFamilyId(familyId)` to fetch children
   - Maps `ChildEntity[]` to `ChildDTO[]`
   - Returns `ok({ children: childDTOs })`

4. **ChildRepository** (`src/repositories/implementations/sql/SQLChildRepository.ts`):
   - Executes query:
     ```sql
     SELECT id, family_id, name, created_at
     FROM public.children
     WHERE family_id = $1
     ORDER BY created_at ASC
     ```
   - Returns array of `ChildEntity`

5. **Response Mapping**:
   - Service returns `Result<ListChildrenResponseDTO, DomainError>`
   - Route handler calls `mapResultToResponse(result)`
   - Maps to HTTP 200 with JSON body or appropriate error response

#### POST `/api/families/{familyId}/children`

1. **Route Handler**:
   - Extracts `familyId` from path params
   - Parses request body with `await request.json()`
   - Validates body with `createChildCommandSchema.safeParse(body)`
   - If validation fails, returns `err(new ValidationError(...))`
   - Calls `childService.createChild(familyId, command, userId)`

2. **ChildService**:
   - Validates `familyId` and verifies family exists
   - Checks family membership authorization
   - Validates command data (name required, max 100 chars)
   - Calls `childRepository.create({ family_id: familyId, name: command.name.trim() })`
   - Maps created `ChildEntity` to `ChildDTO`
   - Logs action: `logRepository.create({ action: "child.create", ... })`
   - Returns `ok(childDTO)`

3. **ChildRepository**:
   - Executes insert:
     ```sql
     INSERT INTO public.children (family_id, name, created_at)
     VALUES ($1, $2, NOW())
     RETURNING id, family_id, name, created_at
     ```
   - Returns created `ChildEntity`

4. **Response Mapping**:
   - Maps to HTTP 201 Created with child DTO

#### PATCH `/api/families/{familyId}/children/{childId}`

1. **Route Handler**:
   - Extracts `familyId` and `childId` from path params
   - Parses request body
   - Validates body with `updateChildCommandSchema.safeParse(body)`
   - Calls `childService.updateChild(familyId, childId, command, userId)`

2. **ChildService**:
   - Validates family exists and user is member
   - Validates child exists via `childRepository.findById(childId)`
   - If child not found, returns `err(new NotFoundError("Child", childId))`
   - Verifies child belongs to family via `childRepository.belongsToFamily(childId, familyId)`
   - If not, returns `err(new NotFoundError("Child", childId))` (security: don't reveal existence)
   - Validates update data (if name provided, must be 1-100 chars)
   - Calls `childRepository.update(childId, { name: command.name?.trim() })`
   - Maps updated `ChildEntity` to `UpdateChildResponseDTO` (includes `updated_at`)
   - Logs action: `logRepository.create({ action: "child.update", ... })`
   - Returns `ok(updateResponseDTO)`

3. **ChildRepository**:
   - Executes update:
     ```sql
     UPDATE public.children
     SET name = COALESCE($2, name), updated_at = NOW()
     WHERE id = $1
     RETURNING id, family_id, name, created_at, updated_at
     ```
   - Returns updated `ChildEntity`

4. **Response Mapping**:
   - Maps to HTTP 200 OK with updated child DTO

#### DELETE `/api/families/{familyId}/children/{childId}`

1. **Route Handler**:
   - Extracts `familyId` and `childId` from path params
   - Calls `childService.deleteChild(familyId, childId, userId)`

2. **ChildService**:
   - Validates family exists and user is member
   - Validates child exists and belongs to family
   - Checks for dependent records (e.g., event_participants referencing this child)
   - If dependencies exist, may need to handle cascading or return error
   - Calls `childRepository.delete(childId)`
   - Logs action: `logRepository.create({ action: "child.delete", ... })`
   - Returns `ok(undefined)`

3. **ChildRepository**:
   - Executes delete:
     ```sql
     DELETE FROM public.children
     WHERE id = $1
     ```
   - Note: Database foreign key constraints will handle cascading if configured

4. **Response Mapping**:
   - Maps to HTTP 204 No Content

### Database Queries

**Query 1: List Children by Family**
```sql
SELECT 
  id,
  family_id,
  name,
  created_at
FROM public.children
WHERE family_id = $1
ORDER BY created_at ASC;
```

**Query 2: Find Child by ID**
```sql
SELECT 
  id,
  family_id,
  name,
  created_at
FROM public.children
WHERE id = $1;
```

**Query 3: Create Child**
```sql
INSERT INTO public.children (family_id, name, created_at)
VALUES ($1, $2, NOW())
RETURNING id, family_id, name, created_at;
```

**Query 4: Update Child**
```sql
UPDATE public.children
SET 
  name = COALESCE($2, name),
  updated_at = NOW()
WHERE id = $1
RETURNING id, family_id, name, created_at, updated_at;
```

**Query 5: Delete Child**
```sql
DELETE FROM public.children
WHERE id = $1;
```

**Query 6: Verify Child Belongs to Family**
```sql
SELECT EXISTS(
  SELECT 1 FROM public.children
  WHERE id = $1 AND family_id = $2
);
```

**Query 7: Check Family Membership**
```sql
SELECT EXISTS(
  SELECT 1 FROM public.family_members
  WHERE family_id = $1 AND user_id = $2
);
```

## 6. Security Considerations

### Authentication

- **JWT Token Validation**: All endpoints require a valid JWT token in the `Authorization: Bearer <token>` header
- **Token Extraction**: Middleware extracts token and validates via `supabase.auth.getUser()`
- **Unauthenticated Requests**: Return 401 Unauthorized immediately

### Authorization

- **Family Membership Check**: All endpoints verify the authenticated user is a member of the specified family
- **Implementation**: Use `familyRepository.isUserMember(familyId, userId)` before any child operations
- **Unauthorized Access**: Return 403 Forbidden if user is not a family member
- **Resource Existence**: When child not found or doesn't belong to family, return 404 (don't reveal existence to unauthorized users)

### Input Validation

- **Zod Schema Validation**: All request bodies validated with Zod schemas (`createChildCommandSchema`, `updateChildCommandSchema`)
- **Path Parameter Validation**: Validate UUIDs are valid format before database queries
- **Name Validation**:
  - Required for creation (non-empty string)
  - Optional for updates
  - Maximum length: 100 characters
  - Trim whitespace before storage
- **SQL Injection Prevention**: Use parameterized queries via Supabase client (all queries use `$1`, `$2` placeholders)

### Row-Level Security (RLS)

- **Database-Level Enforcement**: Supabase RLS policies enforce that users can only access children belonging to their families
- **Policy Example**:
  ```sql
  CREATE POLICY "Users can view children in their families"
  ON public.children FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_id = children.family_id
      AND user_id = auth.uid()
    )
  );
  ```
- **Defense in Depth**: Application-level authorization checks provide additional security layer

### Data Privacy

- **Family Isolation**: Children are scoped to families; users can only access children in families they belong to
- **No Cross-Family Access**: Even if a child ID is known, users cannot access children from other families
- **Audit Logging**: All create, update, and delete operations are logged with actor information

### Rate Limiting

- **Per-User Limits**: Consider rate limiting to prevent abuse (e.g., 100 requests per minute per user)
- **Implementation**: Can be added in middleware or via Supabase Edge Functions

## 7. Error Handling

### Error Response Format

All errors follow the standard format:
```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "details": {
    "field": "additional context (optional)"
  }
}
```

### Error Scenarios and Status Codes

#### 401 Unauthorized

**Trigger:** Missing or invalid JWT token

**Response:**
```json
{
  "error": "unauthorized",
  "message": "Missing or invalid JWT token"
}
```

**Implementation:**
- Handled by `requireAuth()` helper in route handlers
- Returns immediately if `locals.user` is null or undefined

#### 403 Forbidden

**Trigger:** User is not a member of the specified family

**Response:**
```json
{
  "error": "forbidden",
  "message": "You do not have access to this family"
}
```

**Implementation:**
- Checked in `ChildService` after verifying family exists
- Uses `familyRepository.isUserMember(familyId, userId)`

#### 404 Not Found

**Trigger:** Family or child does not exist, or child does not belong to family

**Response:**
```json
{
  "error": "not_found",
  "message": "Family with id {familyId} not found"
}
```

or

```json
{
  "error": "not_found",
  "message": "Child with id {childId} not found"
}
```

**Implementation:**
- Family not found: Checked in service before authorization
- Child not found: Checked in service before update/delete
- Security: Don't reveal existence of children in other families (return 404 even if child exists but belongs to different family)

#### 400 Bad Request

**Trigger:** Invalid request payload or validation errors

**Response:**
```json
{
  "error": "validation_error",
  "message": "Validation failed",
  "details": {
    "name": "Child name is required"
  }
}
```

**Common Validation Errors:**
- Missing required field `name` (POST only)
- `name` is empty string or whitespace only
- `name` exceeds 100 characters
- Invalid UUID format for `familyId` or `childId`
- Invalid JSON in request body

**Implementation:**
- Zod schema validation in route handler
- Additional business rule validation in service layer
- Returns `ValidationError` with field-level details

#### 500 Internal Server Error

**Trigger:** Unexpected server errors (database failures, infrastructure errors)

**Response:**
```json
{
  "error": "internal_error",
  "message": "An unexpected error occurred"
}
```

**Implementation:**
- Caught by error handling middleware
- Logged for monitoring
- Generic message returned to client (don't expose internal details)

### Error Handling Flow

```
Route Handler
  ↓
try {
  Validate input (Zod)
  ↓
  Call Service
    ↓
    Service validates and checks authorization
    ↓
    Service calls Repository
      ↓
      Repository executes query
      ↓
      Return Result<T, DomainError>
  ↓
  Map Result to HTTP Response
} catch (unexpected error) {
  Log error
  Return 500 response
}
```

### Logging Errors

- **Audit Logging**: Successful operations logged to `public.logs` table
  - Action: `child.create`, `child.update`, `child.delete`
  - Actor: Authenticated user ID
  - Family ID: Associated family
  - Details: Child ID and name
- **Error Logging**: Unexpected errors logged to application logs (console/file) with stack traces
- **No Sensitive Data**: Logs don't contain sensitive information, only IDs and action types

## 8. Performance Considerations

### Database Indexes

**Existing Indexes** (from database schema):
- Primary key on `children.id` (automatic)
- Foreign key index on `children.family_id` (automatic)

**Recommended Additional Indexes:**
```sql
-- Optimize family-based queries (most common)
CREATE INDEX IF NOT EXISTS idx_children_family_id 
ON public.children(family_id);

-- Composite index for family + created_at (for ordered lists)
CREATE INDEX IF NOT EXISTS idx_children_family_created 
ON public.children(family_id, created_at);
```

### Query Optimization

- **List Children**: Uses indexed `family_id` lookup, ordered by `created_at`
- **Single Child Lookup**: Uses primary key index on `id`
- **Family Membership Check**: Uses indexed lookup on `family_members(family_id, user_id)`

### Caching Strategy

- **No Caching**: Children data is relatively small and changes infrequently, but caching adds complexity
- **Future Consideration**: If families have many children (>100), consider caching family children list with TTL

### Pagination

- **Not Required**: Children list endpoint doesn't require pagination (families typically have <20 children)
- **Future Enhancement**: If needed, add `limit` and `offset` query parameters

### N+1 Query Prevention

- **Not Applicable**: Child operations are simple and don't involve joins or nested queries
- **Event Participants**: When children are used in events, ensure event queries batch-load participant data

### Response Size

- **Minimal Payload**: Child DTOs are small (~100 bytes each)
- **Typical Response**: List of 10 children ≈ 1KB JSON
- **No Concerns**: Response size is not a performance concern

## 9. Implementation Steps

### Step 1: Create ChildRepository Interface

**File:** `src/repositories/interfaces/ChildRepository.ts`

1. Define `Child`, `CreateChildDTO`, `UpdateChildDTO` types
2. Define `ChildRepository` interface with methods:
   - `findByFamilyId(familyId: string): Promise<Child[]>`
   - `findById(id: string): Promise<Child | null>`
   - `create(data: CreateChildDTO): Promise<Child>`
   - `update(id: string, data: UpdateChildDTO): Promise<Child>`
   - `delete(id: string): Promise<void>`
   - `belongsToFamily(childId: string, familyId: string): Promise<boolean>`
3. Export types and interface

### Step 2: Create SQL ChildRepository Implementation

**File:** `src/repositories/implementations/sql/SQLChildRepository.ts`

1. Import `ChildRepository` interface and types
2. Import Supabase client type
3. Implement `SQLChildRepository` class:
   - Constructor accepts `SupabaseClient<Database>`
   - Implement `findByFamilyId`: Query children by family_id, order by created_at
   - Implement `findById`: Query child by id
   - Implement `create`: Insert new child, return created entity
   - Implement `update`: Update child name and updated_at, return updated entity
   - Implement `delete`: Delete child by id
   - Implement `belongsToFamily`: Check if child belongs to family
4. Handle Supabase errors and convert to appropriate exceptions
5. Map database rows to `Child` entities

### Step 3: Create In-Memory ChildRepository Implementation

**File:** `src/repositories/implementations/in-memory/InMemoryChildRepository.ts`

1. Import `ChildRepository` interface and types
2. Implement `InMemoryChildRepository` class:
   - Store children in Map<string, Child> (keyed by id)
   - Implement all interface methods using in-memory storage
   - Generate UUIDs for new children
   - Set `created_at` timestamps
3. Use for testing and development

### Step 4: Update Repository Factory

**File:** `src/repositories/factory.ts`

1. Import `ChildRepository` interface
2. Import `SQLChildRepository` and `InMemoryChildRepository`
3. Add `child: ChildRepository` to `Repositories` type
4. Add child repository to `createSQLRepositories()` function
5. Add child repository to `createInMemoryRepositories()` function

### Step 5: Update Repository Interfaces Index

**File:** `src/repositories/interfaces/index.ts`

1. Export `ChildRepository` and related types:
   ```typescript
   export type {
     Child,
     CreateChildDTO,
     UpdateChildDTO,
     ChildRepository,
   } from "./ChildRepository.ts";
   ```

### Step 6: Create Domain Error Types (if not exists)

**File:** `src/domain/errors.ts`

1. Ensure `DomainError`, `NotFoundError`, `ValidationError`, `ForbiddenError`, `UnauthorizedError` exist
2. These are used by `ChildService`

### Step 7: Create Result Type Utilities (if not exists)

**File:** `src/domain/result.ts`

1. Define `Result<T, E>` type
2. Implement `ok()`, `err()`, `isOk()`, `isErr()` helper functions
3. These are used throughout the service layer

### Step 8: Create ChildService

**File:** `src/services/ChildService.ts`

1. Import dependencies:
   - `Result`, `ok`, `err` from `@/domain/result`
   - Domain errors from `@/domain/errors`
   - `ChildRepository` and `FamilyRepository` interfaces
   - DTOs from `@/types`
2. Create `ChildService` class:
   - Constructor accepts `childRepository` and `familyRepository`
   - Implement `listChildren(familyId: string, userId: string): Promise<Result<ChildDTO[], DomainError>>`
   - Implement `createChild(familyId: string, command: CreateChildCommand, userId: string): Promise<Result<ChildDTO, DomainError>>`
   - Implement `updateChild(familyId: string, childId: string, command: UpdateChildCommand, userId: string): Promise<Result<UpdateChildResponseDTO, DomainError>>`
   - Implement `deleteChild(familyId: string, childId: string, userId: string): Promise<Result<void, DomainError>>`
3. In each method:
   - Validate family exists
   - Check family membership authorization
   - Validate input data
   - Call repository methods
   - Map entities to DTOs
   - Return `Result`

### Step 9: Create Response Mapper Utility (if not exists)

**File:** `src/lib/http/responseMapper.ts`

1. Implement `mapResultToResponse<T>(result: Result<T, DomainError>, options?: { successStatus?: number }): Response`
2. Map success results to HTTP 200 (or custom status)
3. Map error results to appropriate HTTP status codes based on `error.statusCode`
4. Format error responses according to API specification

### Step 10: Create API Helper Utilities (if not exists)

**File:** `src/lib/http/apiHelpers.ts`

1. Implement `requireAuth(locals: APIContext["locals"]): string | Response`
   - Extract user ID from `locals.user`
   - Return user ID or 401 Response
2. Implement `parseJSON<T>(request: Request): Promise<Result<T, ValidationError>>`
   - Parse request body as JSON
   - Return Result with parsed data or validation error

### Step 11: Create GET Endpoint Route

**File:** `src/pages/api/families/[familyId]/children/index.ts`

1. Import dependencies:
   - `APIContext` from Astro
   - `ChildService` from services
   - `mapResultToResponse` from response mapper
   - `requireAuth` from api helpers
   - Zod schemas for validation
2. Export `prerender = false`
3. Implement `GET` function:
   - Extract `familyId` from `params.familyId`
   - Validate `familyId` is valid UUID
   - Call `requireAuth(locals)`
   - Instantiate `ChildService`
   - Call `childService.listChildren(familyId, userId)`
   - Return `mapResultToResponse(result)`

### Step 12: Create POST Endpoint Route

**File:** `src/pages/api/families/[familyId]/children/index.ts` (same file as GET)

1. Implement `POST` function:
   - Extract `familyId` from path params
   - Call `requireAuth(locals)`
   - Parse request body with `await request.json()`
   - Validate body with `createChildCommandSchema.safeParse(body)`
   - If validation fails, return validation error
   - Instantiate `ChildService`
   - Call `childService.createChild(familyId, command, userId)`
   - Return `mapResultToResponse(result, { successStatus: 201 })`

### Step 13: Create PATCH Endpoint Route

**File:** `src/pages/api/families/[familyId]/children/[childId].ts`

1. Import dependencies (same as GET/POST)
2. Export `prerender = false`
3. Implement `PATCH` function:
   - Extract `familyId` and `childId` from path params
   - Validate both are valid UUIDs
   - Call `requireAuth(locals)`
   - Parse and validate request body with `updateChildCommandSchema`
   - Instantiate `ChildService`
   - Call `childService.updateChild(familyId, childId, command, userId)`
   - Return `mapResultToResponse(result)`

### Step 14: Create DELETE Endpoint Route

**File:** `src/pages/api/families/[familyId]/children/[childId].ts` (same file as PATCH)

1. Implement `DELETE` function:
   - Extract `familyId` and `childId` from path params
   - Validate both are valid UUIDs
   - Call `requireAuth(locals)`
   - Instantiate `ChildService`
   - Call `childService.deleteChild(familyId, childId, userId)`
   - Return `mapResultToResponse(result, { successStatus: 204 })`

### Step 15: Update Middleware (if needed)

**File:** `src/middleware/index.ts`

1. Ensure middleware:
   - Extracts JWT token from Authorization header
   - Validates token via `supabase.auth.getUser()`
   - Creates repositories including child repository
   - Attaches repositories to `context.locals.repositories`
   - Sets `context.locals.user` with authenticated user

### Step 16: Add Database Indexes (Migration)

**File:** `supabase/migrations/YYYYMMDDHHMMSS_add_children_indexes.sql`

1. Create migration file
2. Add indexes:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_children_family_id 
   ON public.children(family_id);

   CREATE INDEX IF NOT EXISTS idx_children_family_created 
   ON public.children(family_id, created_at);
   ```

### Step 17: Verify RLS Policies

**File:** Verify in Supabase dashboard or migration

1. Ensure RLS is enabled on `public.children` table
2. Verify policy exists:
   ```sql
   CREATE POLICY "Users can view children in their families"
   ON public.children FOR SELECT
   USING (
     EXISTS (
       SELECT 1 FROM public.family_members
       WHERE family_id = children.family_id
       AND user_id = auth.uid()
     )
   );
   ```
3. Add similar policies for INSERT, UPDATE, DELETE operations

### Step 18: Write Unit Tests

**Files:** `src/services/__tests__/ChildService.test.ts`

1. Test `listChildren`:
   - Returns children when user is family member
   - Returns 403 when user is not family member
   - Returns 404 when family doesn't exist
2. Test `createChild`:
   - Creates child successfully
   - Validates name is required
   - Validates name max length
   - Returns 403 when user is not family member
3. Test `updateChild`:
   - Updates child successfully
   - Returns 404 when child doesn't exist
   - Returns 404 when child belongs to different family
4. Test `deleteChild`:
   - Deletes child successfully
   - Returns 404 when child doesn't exist

### Step 19: Write Integration Tests

**Files:** `src/pages/api/families/[familyId]/children/__tests__/index.test.ts`

1. Test GET endpoint:
   - Returns 200 with children list
   - Returns 401 without authentication
   - Returns 403 for non-member
   - Returns 404 for non-existent family
2. Test POST endpoint:
   - Creates child and returns 201
   - Returns 400 for invalid input
   - Returns 401 without authentication
3. Test PATCH endpoint:
   - Updates child and returns 200
   - Returns 404 for non-existent child
4. Test DELETE endpoint:
   - Deletes child and returns 204
   - Returns 404 for non-existent child

### Step 20: Documentation and Code Review

1. Add JSDoc comments to service methods
2. Document repository interface methods
3. Review code for:
   - Type safety
   - Error handling completeness
   - Security best practices
   - Performance considerations
4. Update API documentation if needed

## 10. Testing Strategy

### Unit Tests

- **ChildService**: Test business logic, validation, and authorization
- **ChildRepository (SQL)**: Mock Supabase client, test query construction
- **ChildRepository (In-Memory)**: Test CRUD operations with in-memory storage

### Integration Tests

- **API Routes**: Test full request/response cycle with test database
- **Authentication**: Test with valid and invalid JWT tokens
- **Authorization**: Test family membership checks
- **Error Scenarios**: Test all error paths return correct status codes

### E2E Tests (Playwright)

- **User Flow**: Create family → Add child → Update child → Delete child
- **Authorization**: Attempt to access child from different family (should fail)
- **Validation**: Submit invalid data and verify error messages

## 11. Future Enhancements

- **Soft Delete**: Instead of hard delete, add `deleted_at` timestamp
- **Child Photos**: Add `avatar_url` field for child profile pictures
- **Child Metadata**: Add fields like `birth_date`, `gender`, `notes`
- **Bulk Operations**: Add endpoint to create/update multiple children at once
- **Child Events**: When deleting child, handle existing event participants (cascade or prevent deletion)

