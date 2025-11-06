# API Endpoint Implementation Plan: GET /api/families/{familyId}/members

## 1. Endpoint Overview

This endpoint retrieves all members of a specific family. It returns a list of family members with their user profile information (full name, avatar URL), role within the family, and join date. This endpoint is useful when you only need member information without the full family details or children list.

**Purpose**: Provide a focused endpoint to retrieve family members for a given family.

**Use Cases**:
- Displaying a member list in the UI
- Checking family membership before performing operations
- Building member selection dropdowns
- Member management interfaces

## 2. Request Details

- **HTTP Method**: `GET`
- **URL Structure**: `/api/families/{familyId}/members`
- **Path Parameters**:
  - `familyId` (required): UUID of the family
- **Query Parameters**: None
- **Request Body**: None
- **Authentication**: Required (JWT token in Authorization header)

## 3. Used Types

### DTOs (Data Transfer Objects)

- **`FamilyMemberDTO`**: Represents a family member with user details
  - Defined in `src/types.ts` via `familyMemberSchema`
  - Structure:
    ```typescript
    {
      user_id: string;           // UUID
      full_name: string | null;   // Max 100 chars
      avatar_url: string | null;  // Valid URL or null
      role: "admin" | "member";    // Family role enum
      joined_at: string;          // ISO8601 timestamp
    }
    ```

### Response Schema

- **Response Type**: `ListFamilyMembersResponseDTO`
  - Needs to be added to `src/types.ts`:
    ```typescript
    export const listFamilyMembersResponseSchema = z.object({
      members: z.array(familyMemberSchema),
    });
    
    export type ListFamilyMembersResponseDTO = z.infer<typeof listFamilyMembersResponseSchema>;
    ```

### Database Entity Types

- **`FamilyMemberEntity`**: From `src/db/database.types.ts`
  - Represents the `family_members` table row
- **`UserEntity`**: From `src/db/database.types.ts`
  - Represents the `users` table row

### Domain Error Types

- **`UnauthorizedError`**: 401 - Missing or invalid JWT token
- **`ForbiddenError`**: 403 - User not a member of the family
- **`NotFoundError`**: 404 - Family does not exist
- **`ValidationError`**: 400 - Invalid familyId format

## 4. Response Details

### Success Response (200 OK)

```json
{
  "members": [
    {
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "full_name": "John Doe",
      "avatar_url": "https://example.com/avatar.jpg",
      "role": "admin",
      "joined_at": "2024-01-15T10:30:00Z"
    },
    {
      "user_id": "660e8400-e29b-41d4-a716-446655440001",
      "full_name": "Jane Doe",
      "avatar_url": null,
      "role": "member",
      "joined_at": "2024-01-20T14:15:00Z"
    }
  ]
}
```

**Response Schema Validation**:
- Response must match `listFamilyMembersResponseSchema`
- Each member must match `familyMemberSchema`
- Members should be ordered by `joined_at` (ascending - oldest members first)

### Error Responses

| Status Code | Error Type | Description |
|------------|------------|-------------|
| 400 | `ValidationError` | Invalid `familyId` format (not a valid UUID) |
| 401 | `UnauthorizedError` | Missing or invalid JWT token |
| 403 | `ForbiddenError` | Authenticated user is not a member of the specified family |
| 404 | `NotFoundError` | Family with the given `familyId` does not exist |
| 500 | `DomainError` | Internal server error (database connection, unexpected errors) |

**Error Response Format**:
```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "field": "additional context"
  }
}
```

## 5. Data Flow

### High-Level Flow

```
1. HTTP Request
   ↓
2. Authentication Middleware
   - Validate JWT token
   - Extract user from token
   ↓
3. API Route Handler
   - Extract familyId from path params
   - Validate familyId format
   - Call FamilyService.getFamilyMembers()
   ↓
4. Service Layer (FamilyService)
   - Validate familyId
   - Check family exists
   - Check user is member of family
   - Call repository to fetch members
   - Map entities to DTOs
   ↓
5. Repository Layer (FamilyRepository)
   - Query database for family members
   - Join with users table for profile data
   - Return array of member entities
   ↓
6. Service Layer (cont.)
   - Transform entities to DTOs
   - Validate response with schema
   - Return Result<FamilyMemberDTO[], DomainError>
   ↓
7. API Route Handler (cont.)
   - Map Result to HTTP Response
   - Return JSON response
```

### Detailed Data Flow

#### Step 1: Authentication Middleware
```typescript
// Executed before route handler
// File: src/middleware/index.ts

1. Extract Authorization header from request
2. Parse Bearer token
3. Call supabase.auth.getUser(token)
4. If valid:
   - Store user in context.locals.user
   - Continue to route handler
5. If invalid:
   - Return 401 Unauthorized immediately
```

#### Step 2: Route Handler Entry
```typescript
// File: src/pages/api/families/[familyId]/members.ts

1. Call requireAuth(locals) helper
2. Extract userId from locals.user
3. Extract familyId from params.familyId
4. Validate familyId is a valid UUID
5. Instantiate FamilyService with repositories from locals.repositories
6. Call service.getFamilyMembers(familyId, userId)
```

#### Step 3: Service Layer
```typescript
// File: src/services/FamilyService.ts

getFamilyMembers(familyId: string, userId: string):
  1. Validate familyId (non-empty, valid UUID format)
     - If invalid: return err(ValidationError)
  
  2. Verify family exists
     - Call familyRepository.findById(familyId)
     - If not found: return err(NotFoundError("Family", familyId))
  
  3. Check authorization - user must be a member
     - Call familyRepository.isUserMember(familyId, userId)
     - If not member: return err(ForbiddenError("You do not have access to this family"))
  
  4. Fetch family members with user details
     - Call familyRepository.getMembers(familyId)
     - Returns array of member entities with joined user data
  
  5. Transform entities to DTOs
     - Map each member entity to FamilyMemberDTO
     - Ensure all fields are properly formatted (timestamps as ISO8601)
  
  6. Sort members by joined_at (ascending)
  
  7. Validate response with listFamilyMembersResponseSchema
     - If validation fails: return err(ValidationError)
  
  8. Return ok(members)
```

#### Step 4: Repository Layer
```typescript
// File: src/repositories/implementations/sql/SQLFamilyRepository.ts

getMembers(familyId: string):
  1. Query database:
     SELECT 
       fm.user_id,
       u.full_name,
       u.avatar_url,
       fm.role,
       fm.joined_at
     FROM public.family_members fm
     INNER JOIN public.users u ON u.id = fm.user_id
     WHERE fm.family_id = $1
     ORDER BY fm.joined_at ASC
  
  2. Map database rows to domain entities
     - Handle null values for full_name and avatar_url
  
  3. Return array of member entities
```

### Database Query

**Primary Query**:
```sql
SELECT 
  fm.user_id,
  u.full_name,
  u.avatar_url,
  fm.role,
  fm.joined_at
FROM public.family_members fm
INNER JOIN public.users u ON u.id = fm.user_id
WHERE fm.family_id = $1
ORDER BY fm.joined_at ASC;
```

**Query Notes**:
- Uses INNER JOIN to ensure only members with valid user records are returned
- Orders by `joined_at` ascending (oldest members first)
- Handles nullable fields (`full_name`, `avatar_url`)

**Performance Considerations**:
- Index on `family_members(family_id)` should exist (likely via primary key)
- Index on `users(id)` exists (primary key)
- Query should be efficient for typical family sizes (< 50 members)

## 6. Security Considerations

### Authentication

- **Required**: All requests must include a valid JWT token in the `Authorization` header
- **Token Validation**: Middleware validates token via `supabase.auth.getUser()`
- **Token Format**: `Authorization: Bearer <jwt_token>`

### Authorization

- **Family Membership Check**: User must be a member of the requested family
- **Implementation**: Use `familyRepository.isUserMember(familyId, userId)`
- **Error**: Return `403 Forbidden` if user is not a member
- **Rationale**: Users should only see members of families they belong to

### Input Validation

- **Path Parameter Validation**:
  - `familyId` must be a valid UUID format
  - Validate using `uuidSchema` from `src/types.ts`
  - Return `400 Bad Request` if invalid format

### Data Privacy

- **Row-Level Security (RLS)**: Supabase RLS policies enforce data access at database level
- **User Profile Data**: Only returns public profile fields (`full_name`, `avatar_url`)
- **No Sensitive Data**: Does not expose email addresses or other sensitive information
- **Family Isolation**: Database queries are scoped to the specified family

### Potential Security Threats

1. **Unauthorized Access**:
   - **Threat**: User attempts to access members of a family they don't belong to
   - **Mitigation**: Authorization check in service layer + RLS policies

2. **UUID Enumeration**:
   - **Threat**: Attacker tries random UUIDs to discover families
   - **Mitigation**: Authorization check prevents access to non-member families (returns 403, not 404 to avoid information disclosure)

3. **SQL Injection**:
   - **Threat**: Malicious input in path parameters
   - **Mitigation**: Parameterized queries via Supabase client + UUID validation

4. **Token Replay**:
   - **Threat**: Stolen JWT token used to access data
   - **Mitigation**: JWT expiration + refresh token rotation handled by Supabase Auth

5. **Information Disclosure**:
   - **Threat**: Error messages reveal sensitive information
   - **Mitigation**: Generic error messages for 404 (don't distinguish between non-existent and unauthorized)

### Security Best Practices

- **Error Messages**: Don't reveal whether a family exists if user is not a member (return 403, not 404)
- **Rate Limiting**: Consider rate limiting to prevent abuse (handled by middleware)
- **Audit Logging**: Log access to family member lists (handled by logging middleware)
- **CORS**: Ensure CORS policies are properly configured (handled by Astro/Supabase)

## 7. Error Handling

### Error Scenarios and Handling

#### 1. Missing Authentication (401)

**Scenario**: Request missing `Authorization` header or invalid token

**Handling**:
```typescript
// In middleware or route handler
if (!userId) {
  return mapResultToResponse(
    err(new UnauthorizedError("Authentication required"))
  );
}
```

**Response**:
```json
{
  "error": "UNAUTHORIZED",
  "message": "Authentication required"
}
```

#### 2. Invalid Family ID Format (400)

**Scenario**: `familyId` is not a valid UUID format

**Handling**:
```typescript
// In route handler or service
const uuidValidation = uuidSchema.safeParse(familyId);
if (!uuidValidation.success) {
  return err(new ValidationError("Invalid family ID format"));
}
```

**Response**:
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid family ID format",
  "details": {
    "familyId": "must be a valid UUID"
  }
}
```

#### 3. Family Not Found (404)

**Scenario**: Family with given `familyId` does not exist

**Handling**:
```typescript
// In service layer
const family = await this.familyRepo.findById(familyId);
if (!family) {
  return err(new NotFoundError("Family", familyId));
}
```

**Response**:
```json
{
  "error": "NOT_FOUND",
  "message": "Family with id {familyId} not found"
}
```

**Note**: Only return 404 if user is authenticated and family doesn't exist. If user is not a member, return 403 instead.

#### 4. User Not a Member (403)

**Scenario**: Authenticated user is not a member of the specified family

**Handling**:
```typescript
// In service layer
const isMember = await this.familyRepo.isUserMember(familyId, userId);
if (!isMember) {
  return err(new ForbiddenError("You do not have access to this family"));
}
```

**Response**:
```json
{
  "error": "FORBIDDEN",
  "message": "You do not have access to this family"
}
```

#### 5. Database Error (500)

**Scenario**: Database connection failure or unexpected database error

**Handling**:
```typescript
// In repository layer - catch and convert to domain error
try {
  const { data, error } = await this.supabase...
  if (error) {
    throw new Error(error.message);
  }
} catch (error) {
  return err(new DomainError("Failed to retrieve family members", "DATABASE_ERROR", 500));
}
```

**Response**:
```json
{
  "error": "DATABASE_ERROR",
  "message": "Failed to retrieve family members"
}
```

#### 6. Empty Members List

**Scenario**: Family exists but has no members (edge case)

**Handling**: This is a valid scenario - return empty array
```json
{
  "members": []
}
```

### Error Handling Flow

```
Route Handler
  ↓
Service Layer (returns Result)
  ↓
If error:
  - Map DomainError to HTTP status code
  - Format error response JSON
  - Return appropriate status code
If success:
  - Validate response data
  - Return 200 with JSON body
```

### Logging

- **Success**: Log successful member list retrieval (action: `family.members.list`)
- **Errors**: Log all errors with context (familyId, userId, error type)
- **Audit Trail**: Create log entry in `public.logs` table:
  ```typescript
  {
    action: "family.members.list",
    family_id: familyId,
    actor_id: userId,
    actor_type: "user",
    details: { member_count: members.length }
  }
  ```

## 8. Performance Considerations

### Potential Bottlenecks

1. **Database Query Performance**:
   - **Issue**: JOIN operation on `family_members` and `users` tables
   - **Mitigation**: Ensure indexes exist on:
     - `family_members(family_id)` - primary key covers this
     - `users(id)` - primary key covers this
   - **Expected Performance**: < 50ms for typical family sizes (< 50 members)

2. **Large Family Sizes**:
   - **Issue**: Families with hundreds of members could slow query
   - **Mitigation**: 
     - Current implementation is acceptable (no pagination needed for typical use case)
     - If needed in future, add pagination with `limit` and `offset` query parameters
   - **Monitoring**: Track query performance and add pagination if families exceed 100 members

3. **Concurrent Requests**:
   - **Issue**: Multiple users querying same family simultaneously
   - **Mitigation**: Database connection pooling via Supabase handles this efficiently
   - **Expected Performance**: No degradation for typical load

### Optimization Strategies

1. **Caching** (Future Enhancement):
   - Consider caching member lists with short TTL (30-60 seconds)
   - Invalidate cache on member changes (add/remove/role update)
   - Use Redis or in-memory cache for high-traffic scenarios

2. **Query Optimization**:
   - Use `SELECT` with specific columns (already implemented)
   - Ensure proper indexes (verify in migration)
   - Consider materialized view if query becomes complex

3. **Response Size**:
   - Current response is lightweight (only essential fields)
   - No pagination needed for typical family sizes
   - Monitor response sizes and add pagination if needed

### Performance Metrics to Monitor

- **Response Time**: Target < 200ms for p95
- **Database Query Time**: Target < 50ms
- **Error Rate**: Target < 0.1%
- **Concurrent Requests**: Monitor for degradation

## 9. Implementation Steps

### Step 1: Add Response Schema to Types

**File**: `src/types.ts`

Add the response schema after the `familyMemberSchema` definition:

```typescript
/**
 * Response: List family members
 */
export const listFamilyMembersResponseSchema = z.object({
  members: z.array(familyMemberSchema),
});

export type ListFamilyMembersResponseDTO = z.infer<typeof listFamilyMembersResponseSchema>;
```

### Step 2: Extend FamilyRepository Interface

**File**: `src/repositories/interfaces/FamilyRepository.ts`

Add method to retrieve family members:

```typescript
export interface FamilyRepository {
  // ... existing methods ...
  
  /**
   * Get all members of a family with their user profile details
   * @param familyId - UUID of the family
   * @returns Array of family members with user details, ordered by joined_at
   */
  getMembers(familyId: string): Promise<FamilyMemberEntity[]>;
}
```

**Note**: Define `FamilyMemberEntity` type if not already defined:
```typescript
export interface FamilyMemberEntity {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "admin" | "member";
  joined_at: string;
}
```

### Step 3: Implement Repository Method (SQL)

**File**: `src/repositories/implementations/sql/SQLFamilyRepository.ts`

Implement the `getMembers` method:

```typescript
async getMembers(familyId: string): Promise<FamilyMemberEntity[]> {
  const { data, error } = await this.supabase
    .from("family_members")
    .select(
      `
      user_id,
      role,
      joined_at,
      users!inner(
        full_name,
        avatar_url
      )
      `
    )
    .eq("family_id", familyId)
    .order("joined_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch family members: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  return data.map((row) => ({
    user_id: row.user_id,
    full_name: row.users?.full_name ?? null,
    avatar_url: row.users?.avatar_url ?? null,
    role: row.role as "admin" | "member",
    joined_at: row.joined_at,
  }));
}
```

### Step 4: Implement Repository Method (In-Memory)

**File**: `src/repositories/implementations/in-memory/InMemoryFamilyRepository.ts`

Implement the `getMembers` method for testing:

```typescript
async getMembers(familyId: string): Promise<FamilyMemberEntity[]> {
  // Implementation for in-memory testing
  // Return mock data matching the SQL implementation structure
}
```

### Step 5: Add Service Method

**File**: `src/services/FamilyService.ts`

Add method to get family members:

```typescript
async getFamilyMembers(
  familyId: string,
  userId: string
): Promise<Result<FamilyMemberDTO[], DomainError>> {
  // 1. Validate familyId
  const uuidValidation = uuidSchema.safeParse(familyId);
  if (!uuidValidation.success) {
    return err(new ValidationError("Invalid family ID format"));
  }

  // 2. Verify family exists
  const family = await this.familyRepo.findById(familyId);
  if (!family) {
    return err(new NotFoundError("Family", familyId));
  }

  // 3. Check authorization
  const isMember = await this.familyRepo.isUserMember(familyId, userId);
  if (!isMember) {
    return err(new ForbiddenError("You do not have access to this family"));
  }

  // 4. Fetch members
  try {
    const memberEntities = await this.familyRepo.getMembers(familyId);

    // 5. Transform to DTOs
    const members: FamilyMemberDTO[] = memberEntities.map((entity) => ({
      user_id: entity.user_id,
      full_name: entity.full_name,
      avatar_url: entity.avatar_url,
      role: entity.role,
      joined_at: entity.joined_at,
    }));

    // 6. Validate response
    const validation = listFamilyMembersResponseSchema.safeParse({ members });
    if (!validation.success) {
      return err(
        new ValidationError("Invalid response data", {
          response: "Failed validation",
        })
      );
    }

    return ok(members);
  } catch (error) {
    return err(
      new DomainError("Failed to retrieve family members", "DATABASE_ERROR", 500)
    );
  }
}
```

### Step 6: Create API Route

**File**: `src/pages/api/families/[familyId]/members.ts`

Create the route handler:

```typescript
import type { APIContext } from "astro";
import { FamilyService } from "@/services/FamilyService";
import { mapResultToResponse } from "@/lib/http/responseMapper";
import { requireAuth } from "@/lib/http/apiHelpers";
import { ValidationError } from "@/domain/errors";
import { err } from "@/domain/result";
import { uuidSchema } from "@/types";

export const prerender = false;

export async function GET({ params, locals }: APIContext) {
  // 1. Authentication check
  const userId = requireAuth(locals);
  if (userId instanceof Response) return userId;

  // 2. Extract and validate familyId
  const familyId = params.familyId;
  if (!familyId) {
    return mapResultToResponse(
      err(new ValidationError("Family ID is required"))
    );
  }

  // 3. Validate UUID format
  const uuidValidation = uuidSchema.safeParse(familyId);
  if (!uuidValidation.success) {
    return mapResultToResponse(
      err(new ValidationError("Invalid family ID format"))
    );
  }

  // 4. Call service
  const familyService = new FamilyService(locals.repositories.family);
  const result = await familyService.getFamilyMembers(familyId, userId);

  // 5. Map Result to HTTP Response
  return mapResultToResponse(result);
}
```

### Step 7: Add Audit Logging

**File**: `src/middleware/index.ts` or `src/services/FamilyService.ts`

Add logging for successful member list retrieval:

```typescript
// After successful retrieval in service
await logRepository.create({
  action: "family.members.list",
  family_id: familyId,
  actor_id: userId,
  actor_type: "user",
  details: { member_count: members.length },
});
```

### Step 8: Write Unit Tests

**File**: `tests/unit/services/familyService.test.ts`

Add test cases:

```typescript
describe("FamilyService.getFamilyMembers", () => {
  it("should return members when user is a member", async () => {
    // Test implementation
  });

  it("should return 403 when user is not a member", async () => {
    // Test implementation
  });

  it("should return 404 when family does not exist", async () => {
    // Test implementation
  });

  it("should return 400 when familyId is invalid", async () => {
    // Test implementation
  });

  it("should return empty array when family has no members", async () => {
    // Test implementation
  });
});
```

### Step 9: Write Integration Tests

**File**: `tests/integration/api/families/[familyId]/members.test.ts`

Add E2E test cases using Playwright or similar:

```typescript
describe("GET /api/families/{familyId}/members", () => {
  it("should return 200 with members list for authenticated member", async () => {
    // Test implementation
  });

  it("should return 401 when not authenticated", async () => {
    // Test implementation
  });

  it("should return 403 when user is not a member", async () => {
    // Test implementation
  });
});
```

### Step 10: Update API Documentation

**File**: `.ai/api-plan.md`

Add endpoint documentation to the API plan (if not already present):

```markdown
#### List Family Members

**GET** `/api/families/{familyId}/members`

Retrieves all members of a specific family.

[Documentation details...]
```

## 10. Testing Checklist

- [ ] Unit tests for service layer (all error cases)
- [ ] Unit tests for repository layer (SQL and in-memory)
- [ ] Integration tests for API route (success and error cases)
- [ ] Test with empty members list
- [ ] Test with large number of members (performance)
- [ ] Test authorization (member vs non-member)
- [ ] Test authentication (missing token, invalid token)
- [ ] Test invalid UUID format
- [ ] Test non-existent family
- [ ] Verify response schema validation
- [ ] Verify audit logging
- [ ] Test concurrent requests

## 11. Dependencies

### Required Files to Create/Modify

1. **New Files**:
   - `src/pages/api/families/[familyId]/members.ts` (API route)

2. **Files to Modify**:
   - `src/types.ts` (add response schema)
   - `src/repositories/interfaces/FamilyRepository.ts` (add method)
   - `src/repositories/implementations/sql/SQLFamilyRepository.ts` (implement method)
   - `src/repositories/implementations/in-memory/InMemoryFamilyRepository.ts` (implement method)
   - `src/services/FamilyService.ts` (add service method)

### Required Dependencies

All dependencies should already be available:
- `zod` for schema validation
- `@supabase/supabase-js` for database access
- Domain error types and Result pattern utilities

## 12. Future Enhancements

1. **Pagination**: Add `limit` and `offset` query parameters for large families
2. **Filtering**: Add query parameters to filter by role (`?role=admin`)
3. **Sorting**: Add query parameter for custom sort order (`?sort=name` or `?sort=joined_at`)
4. **Caching**: Implement response caching for frequently accessed families
5. **Real-time Updates**: Use Supabase real-time subscriptions to push member list updates

