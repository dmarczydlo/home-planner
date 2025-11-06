# API Endpoint Implementation Plan: `/api/families/{familyId}/invitations`

## 1. Endpoint Overview

This endpoint handles two operations for managing family invitations:

- **GET**: Retrieves all invitations for a specific family, with optional filtering by status
- **POST**: Creates a new invitation to join the family

Both operations require authentication and verify that the user is a member of the specified family. The POST operation includes business logic for generating secure tokens, validating email addresses, checking for duplicate invitations, and ensuring the invitee is not already a family member.

**Business Context:**
- Invitations allow family members to invite new users to join their family
- Each invitation has a unique token used for acceptance
- Invitations expire after 7 days
- Only one pending invitation per email per family is allowed
- Invitation creation triggers an email notification (to be implemented)

## 2. Request Details

### 2.1. GET `/api/families/{familyId}/invitations`

**HTTP Method:** GET

**URL Structure:** `/api/families/{familyId}/invitations`

**Path Parameters:**
- `familyId` (required): UUID of the family - must be valid UUID format

**Query Parameters:**
- `status` (optional): Filter invitations by status - must be one of: `'pending'`, `'accepted'`, `'expired'`
  - If not provided, returns all invitations regardless of status
  - Validated against `invitationStatusSchema` enum

**Request Body:** None

**Authentication:** Required (JWT token in Authorization header)

**Authorization:** User must be a member of the specified family

### 2.2. POST `/api/families/{familyId}/invitations`

**HTTP Method:** POST

**URL Structure:** `/api/families/{familyId}/invitations`

**Path Parameters:**
- `familyId` (required): UUID of the family - must be valid UUID format

**Query Parameters:** None

**Request Body:**
```json
{
  "invitee_email": "string (required, valid email)"
}
```

**Request Body Validation:**
- Validated using `createInvitationCommandSchema` from `src/types.ts`
- `invitee_email`: Required, must be valid email format (Zod email validation)
- Body must not contain additional properties (strict mode)

**Authentication:** Required (JWT token in Authorization header)

**Authorization:** User must be a member of the specified family

## 3. Used Types

### 3.1. DTOs and Command Models

**From `src/types.ts`:**

- `CreateInvitationCommand`: Request body for POST operation
  - Schema: `createInvitationCommandSchema`
  - Fields: `invitee_email` (string, email)

- `ListInvitationsResponseDTO`: Response for GET operation
  - Schema: `listInvitationsResponseSchema`
  - Fields: `invitations` (array of `InvitationWithInviterDTO`)

- `CreateInvitationResponseDTO`: Response for POST operation
  - Schema: `createInvitationResponseSchema`
  - Fields: All fields from `invitationSchema` plus `invitation_url` (string, URL)

- `InvitationWithInviterDTO`: Individual invitation in list response
  - Schema: `invitationWithInviterSchema`
  - Fields: `id`, `family_id`, `invited_by` (object with `id`, `full_name`), `invitee_email`, `status`, `expires_at`, `created_at`

- `InvitationStatus`: Enum type - `'pending' | 'accepted' | 'expired'`
  - Schema: `invitationStatusSchema`

### 3.2. Database Entity Types

**From `src/db/database.types.ts`:**

- `InvitationEntity`: Database row type from `Tables<"invitations">`
- `InvitationInsert`: Database insert type from `TablesInsert<"invitations">`
- `InvitationUpdate`: Database update type from `TablesUpdate<"invitations">`

### 3.3. Domain Error Types

**From `src/domain/errors.ts` (to be created):**

- `ValidationError`: Invalid input data (400)
- `UnauthorizedError`: Missing or invalid authentication (401)
- `ForbiddenError`: User lacks required permissions (403)
- `NotFoundError`: Resource not found (404)
- `ConflictError`: Resource conflict (409)

### 3.4. Result Type

**From `src/domain/result.ts` (to be created):**

- `Result<T, E>`: Generic result type for error handling
- Helper functions: `ok()`, `err()`, `isOk()`, `isErr()`

## 4. Response Details

### 4.1. GET Response

**Success Response (200 OK):**
```json
{
  "invitations": [
    {
      "id": "uuid",
      "family_id": "uuid",
      "invited_by": {
        "id": "uuid",
        "full_name": "string | null"
      },
      "invitee_email": "string",
      "status": "pending | accepted | expired",
      "expires_at": "ISO8601 timestamp",
      "created_at": "ISO8601 timestamp"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User not a member of this family
- `404 Not Found`: Family does not exist
- `400 Bad Request`: Invalid query parameter (status)

### 4.2. POST Response

**Success Response (201 Created):**
```json
{
  "id": "uuid",
  "family_id": "uuid",
  "invited_by": "uuid",
  "invitee_email": "string",
  "token": "string",
  "status": "pending",
  "expires_at": "ISO8601 timestamp",
  "created_at": "ISO8601 timestamp",
  "invitation_url": "string"
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User not a member of this family
- `404 Not Found`: Family does not exist
- `400 Bad Request`: Invalid email format or user already a member
- `409 Conflict`: Pending invitation already exists for this email

## 5. Data Flow

### 5.1. GET Request Flow

```
1. Request arrives at API route
   ↓
2. Middleware validates JWT token → sets locals.user
   ↓
3. API route extracts familyId from params
   ↓
4. API route calls requireAuth(locals) → returns userId or Response
   ↓
5. API route creates InvitationService with repositories from locals.repositories
   ↓
6. Service.listInvitations(familyId, userId, status?):
   a. Validates familyId is valid UUID
   b. Validates status parameter (if provided)
   c. Calls FamilyRepository.findById(familyId) → Result<Family, NotFoundError>
   d. Calls FamilyRepository.isUserMember(familyId, userId) → boolean
   e. If not member → returns err(ForbiddenError)
   f. Calls InvitationRepository.findByFamilyId(familyId, status?) → InvitationEntity[]
   g. For each invitation, fetches inviter details from UserRepository
   h. Maps entities to InvitationWithInviterDTO[]
   i. Returns ok({ invitations: [...] })
   ↓
7. API route maps Result to HTTP Response using mapResultToResponse()
   ↓
8. Response returned to client
```

### 5.2. POST Request Flow

```
1. Request arrives at API route
   ↓
2. Middleware validates JWT token → sets locals.user
   ↓
3. API route extracts familyId from params
   ↓
4. API route calls requireAuth(locals) → returns userId or Response
   ↓
5. API route parses request body using parseJSON<CreateInvitationCommand>()
   ↓
6. API route validates body using createInvitationCommandSchema
   ↓
7. API route creates InvitationService with repositories from locals.repositories
   ↓
8. Service.createInvitation(familyId, command, userId):
   a. Validates familyId is valid UUID
   b. Validates command.invitee_email format (Zod)
   c. Calls FamilyRepository.findById(familyId) → Result<Family, NotFoundError>
   d. Calls FamilyRepository.isUserMember(familyId, userId) → boolean
   e. If not member → returns err(ForbiddenError)
   f. Calls UserRepository.findByEmail(command.invitee_email) → User | null
   g. If user exists:
      - Calls FamilyRepository.isUserMember(familyId, user.id) → boolean
      - If already member → returns err(ValidationError("User already a member"))
   h. Calls InvitationRepository.findPendingByEmailAndFamily(command.invitee_email, familyId) → InvitationEntity | null
   i. If pending invitation exists → returns err(ConflictError("Pending invitation exists"))
   j. Generates secure token (crypto.randomBytes(32).toString('hex'))
   k. Calculates expires_at (7 days from now)
   l. Creates invitation entity:
      {
        family_id: familyId,
        invited_by: userId,
        invitee_email: command.invitee_email,
        token: generatedToken,
        status: 'pending',
        expires_at: expiresAt,
        created_at: now()
      }
   m. Calls InvitationRepository.create(invitation) → InvitationEntity
   n. Constructs invitation_url (frontend URL + token)
   o. Maps entity to CreateInvitationResponseDTO
   p. Calls LogRepository.create() for audit trail
   q. Returns ok(invitationResponse)
   ↓
9. API route maps Result to HTTP Response using mapResultToResponse() with successStatus: 201
   ↓
10. Response returned to client
```

### 5.3. Repository Interactions

**InvitationRepository Interface** (to be created):
```typescript
interface InvitationRepository {
  findById(id: string): Promise<InvitationEntity | null>;
  findByFamilyId(familyId: string, status?: InvitationStatus): Promise<InvitationEntity[]>;
  findPendingByEmailAndFamily(email: string, familyId: string): Promise<InvitationEntity | null>;
  findByToken(token: string): Promise<InvitationEntity | null>;
  create(data: InvitationInsert): Promise<InvitationEntity>;
  update(id: string, data: InvitationUpdate): Promise<InvitationEntity>;
  delete(id: string): Promise<void>;
}
```

**Dependencies:**
- `FamilyRepository`: Check family existence and membership
- `UserRepository`: Find user by email, get inviter details
- `LogRepository`: Create audit log entries

## 6. Security Considerations

### 6.1. Authentication

- **JWT Token Validation**: All requests require valid JWT token in `Authorization: Bearer <token>` header
- **Token Verification**: Middleware calls `supabase.auth.getUser()` to verify token
- **Token Expiration**: Expired tokens result in 401 Unauthorized response

### 6.2. Authorization

- **Family Membership Check**: User must be a member of the specified family
- **GET Operation**: Any family member can view invitations
- **POST Operation**: Any family member can create invitations (no admin-only restriction per API spec)
- **Family Existence**: Family must exist before any operation (404 if not found)

### 6.3. Input Validation

- **UUID Validation**: `familyId` must be valid UUID format
- **Email Validation**: `invitee_email` validated using Zod email schema
- **Status Filter Validation**: Query parameter `status` validated against enum values
- **Strict Body Validation**: Request body validated with `.strict()` to prevent extra fields
- **SQL Injection Prevention**: All queries use parameterized queries via Supabase client

### 6.4. Token Security

- **Token Generation**: Uses cryptographically secure random bytes (32 bytes = 256 bits)
- **Token Uniqueness**: Database constraint ensures token uniqueness
- **Token Expiration**: Tokens expire after 7 days (enforced at database level)
- **Token Storage**: Tokens stored in database, never exposed in error messages

### 6.5. Data Exposure Prevention

- **Family Isolation**: Invitations filtered by family_id, users cannot access invitations from other families
- **Email Privacy**: Email addresses only visible to family members
- **Error Messages**: Error messages do not expose sensitive information (e.g., whether email exists in system)

### 6.6. Rate Limiting

- **Invitation Creation**: API plan specifies 10 invitations per family per hour
- **Implementation**: Consider implementing rate limiting middleware (future enhancement)
- **Prevention**: Prevents invitation spam and abuse

### 6.7. Audit Logging

- **Action Logging**: All invitation creation operations logged to `logs` table
- **Actor Tracking**: Log entries include `actor_id` (user) and `actor_type` ("user")
- **Action Details**: Log details include `invitation_id`, `invitee_email`, `family_id` for traceability
- **Action Code**: Use `"invitation.create"` as action code

## 7. Error Handling

### 7.1. Error Types and Status Codes

| Error Scenario                          | Status Code | Error Type        | Message                                                        |
| --------------------------------------- | ----------- | ----------------- | -------------------------------------------------------------- |
| Missing/invalid JWT token              | 401         | UnauthorizedError | "Authentication required"                                      |
| User not a member of family            | 403         | ForbiddenError    | "You do not have access to this family"                        |
| Family not found                       | 404         | NotFoundError     | "Family with id {familyId} not found"                          |
| Invalid UUID format (familyId)         | 400         | ValidationError   | "Invalid family ID format"                                    |
| Invalid email format                   | 400         | ValidationError   | "Invalid email format"                                         |
| Invalid status filter                  | 400         | ValidationError   | "Invalid status value. Must be one of: pending, accepted, expired" |
| User already a family member           | 400         | ValidationError   | "User with this email is already a member of this family"      |
| Pending invitation already exists      | 409         | ConflictError     | "A pending invitation already exists for this email"          |
| Database connection error              | 500         | DomainError       | "Internal server error"                                        |
| Unexpected error                        | 500         | DomainError       | "An unexpected error occurred"                                 |

### 7.2. Error Response Format

All error responses follow consistent format:
```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "details": {
    "field": "additional context (optional)"
  }
}
```

**ValidationError** includes field-level details:
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid input",
  "details": {
    "invitee_email": "Invalid email format"
  }
}
```

### 7.3. Error Handling Pattern

**Service Layer:**
```typescript
// Returns Result<T, DomainError>
async createInvitation(...): Promise<Result<CreateInvitationResponseDTO, DomainError>> {
  // Early validation returns ValidationError
  if (!familyId || !isValidUUID(familyId)) {
    return err(new ValidationError("Invalid family ID format"));
  }
  
  // Business rule violations return appropriate errors
  if (isAlreadyMember) {
    return err(new ValidationError("User already a member", { invitee_email: "already_member" }));
  }
  
  if (pendingInvitationExists) {
    return err(new ConflictError("Pending invitation already exists"));
  }
  
  // Success returns ok(data)
  return ok(invitationResponse);
}
```

**API Route:**
```typescript
export async function POST({ params, request, locals }: APIContext) {
  // Auth check
  const userId = requireAuth(locals);
  if (userId instanceof Response) return userId;
  
  // Parse and validate body
  const bodyResult = await parseJSON<CreateInvitationCommand>(request);
  if (!bodyResult.success) {
    return mapResultToResponse(bodyResult);
  }
  
  // Validate with Zod schema
  const validationResult = validateSchema(createInvitationCommandSchema, bodyResult.data);
  if (!validationResult.success) {
    return mapResultToResponse(err(new ValidationError("Invalid input", formatZodErrors(validationResult.error))));
  }
  
  // Call service
  const invitationService = new InvitationService(
    locals.repositories.invitation,
    locals.repositories.family,
    locals.repositories.user,
    locals.repositories.log
  );
  
  const result = await invitationService.createInvitation(
    params.familyId!,
    validationResult.data,
    userId
  );
  
  // Map Result to HTTP Response
  return mapResultToResponse(result, { successStatus: 201 });
}
```

## 8. Performance Considerations

### 8.1. Database Performance

**Query Optimization:**
- **Index Usage**: Queries use primary key (`id`) and indexed foreign keys (`family_id`, `invited_by`)
- **Query Count**: 
  - GET: 3 queries (family lookup, membership check, invitations + inviter details via JOIN)
  - POST: 4-5 queries (family lookup, membership check, user lookup, pending invitation check, create)
- **JOIN Optimization**: Use JOIN to fetch inviter details in single query for GET operation

**Expected Query Times:**
- Family lookup by id: < 1ms (primary key lookup)
- Membership check: < 2ms (indexed foreign key)
- Invitations by family_id: < 5ms (indexed foreign key + optional status filter)
- User lookup by email: < 3ms (if indexed)
- **Total DB time: < 15ms per request**

### 8.2. Caching Strategy

**Not Recommended:**
- Invitation data changes frequently (status updates, new invitations)
- Family membership can change
- Real-time accuracy is important

**Future Consideration:**
- Cache family membership checks per request (already in middleware)
- Consider caching family existence checks within request lifecycle

### 8.3. Pagination

**Not Required:**
- API specification does not require pagination for invitation list
- Expected number of invitations per family is low (< 100)
- If pagination becomes necessary, add `limit` and `offset` query parameters

### 8.4. Token Generation Performance

- **Crypto Operations**: `crypto.randomBytes()` is fast (< 1ms)
- **Uniqueness Check**: Database unique constraint handles token collision prevention
- **No Performance Impact**: Token generation does not affect response time

## 9. Implementation Steps

### Step 1: Create Domain Error Types

**File:** `src/domain/errors.ts`

Create domain error classes:
- `DomainError` (base class)
- `ValidationError`
- `UnauthorizedError`
- `ForbiddenError`
- `NotFoundError`
- `ConflictError`

Each error should have:
- `message`: Human-readable error message
- `code`: Error code string (e.g., "VALIDATION_ERROR")
- `statusCode`: HTTP status code

### Step 2: Create Result Type and Helpers

**File:** `src/domain/result.ts`

Create:
- `Result<T, E>` type definition
- `ok<T>(data: T)` helper function
- `err<E>(error: E)` helper function
- `isOk<T, E>(result: Result<T, E>)` type guard
- `isErr<T, E>(result: Result<T, E>)` type guard

### Step 3: Create InvitationRepository Interface

**File:** `src/repositories/interfaces/InvitationRepository.ts`

Define interface with methods:
- `findById(id: string): Promise<InvitationEntity | null>`
- `findByFamilyId(familyId: string, status?: InvitationStatus): Promise<InvitationEntity[]>`
- `findPendingByEmailAndFamily(email: string, familyId: string): Promise<InvitationEntity | null>`
- `findByToken(token: string): Promise<InvitationEntity | null>`
- `create(data: InvitationInsert): Promise<InvitationEntity>`
- `update(id: string, data: InvitationUpdate): Promise<InvitationEntity>`
- `delete(id: string): Promise<void>`

Export types:
- `Invitation` (domain entity)
- `CreateInvitationDTO`
- `UpdateInvitationDTO`

### Step 4: Create SQL InvitationRepository Implementation

**File:** `src/repositories/implementations/sql/SQLInvitationRepository.ts`

Implement `InvitationRepository` interface using Supabase client:
- Use parameterized queries for all operations
- Handle database errors and convert to domain errors
- For `findByFamilyId`, use JOIN to fetch inviter details in single query
- Ensure proper error handling for database connection issues

### Step 5: Create In-Memory InvitationRepository Implementation

**File:** `src/repositories/implementations/in-memory/InMemoryInvitationRepository.ts`

Implement `InvitationRepository` interface using in-memory storage:
- Use Map or array for storage
- Implement all interface methods
- Useful for testing and development

### Step 6: Update Repository Factory

**File:** `src/repositories/factory.ts`

Add `invitation` repository to factory functions:
- `createRepositories()`: Add `invitation: new SQLInvitationRepository(client)`
- `createInMemoryRepositories()`: Add `invitation: new InMemoryInvitationRepository()`

Update repository type definitions to include `invitation`.

### Step 7: Update Repository Interfaces Index

**File:** `src/repositories/interfaces/index.ts`

Export `InvitationRepository` and related types.

### Step 8: Create InvitationService

**File:** `src/services/InvitationService.ts`

Create service class with:
- Constructor accepting repositories (invitation, family, user, log)
- `listInvitations(familyId: string, userId: string, status?: InvitationStatus): Promise<Result<ListInvitationsResponseDTO, DomainError>>`
- `createInvitation(familyId: string, command: CreateInvitationCommand, userId: string): Promise<Result<CreateInvitationResponseDTO, DomainError>>`

**Business Logic:**
- Validate inputs (UUID format, email format)
- Check family existence
- Check user membership
- Check for duplicate pending invitations
- Check if user already a member
- Generate secure token
- Calculate expiration date (7 days)
- Create invitation entity
- Create audit log entry
- Return Result with success or error

### Step 9: Create Response Mapper Utility

**File:** `src/lib/http/responseMapper.ts`

Create `mapResultToResponse()` function:
- Maps `Result<T, DomainError>` to HTTP Response
- Handles success responses with configurable status code
- Handles error responses with appropriate status codes
- Formats error responses according to error type

### Step 10: Create API Helpers

**File:** `src/lib/http/apiHelpers.ts`

Create helper functions:
- `requireAuth(locals): string | Response`
- `parseJSON<T>(request: Request): Promise<Result<T, ValidationError>>`
- `validateSchema<T>(schema: ZodSchema<T>, data: unknown): Result<T, ZodError>`

### Step 11: Create API Route File

**File:** `src/pages/api/families/[familyId]/invitations/index.ts`

Implement both GET and POST handlers:

**GET Handler:**
1. Extract `familyId` from params
2. Extract `status` from query params (optional)
3. Call `requireAuth(locals)`
4. Create `InvitationService` with repositories
5. Call `service.listInvitations(familyId, userId, status)`
6. Map Result to Response using `mapResultToResponse()`

**POST Handler:**
1. Extract `familyId` from params
2. Call `requireAuth(locals)`
3. Parse request body using `parseJSON<CreateInvitationCommand>()`
4. Validate body using `createInvitationCommandSchema`
5. Create `InvitationService` with repositories
6. Call `service.createInvitation(familyId, command, userId)`
7. Map Result to Response using `mapResultToResponse()` with `successStatus: 201`

### Step 12: Update Middleware

**File:** `src/middleware/index.ts`

Ensure middleware:
- Validates JWT tokens
- Injects repositories including `invitation` repository
- Handles errors appropriately

### Step 13: Create LogRepository Interface and Implementation

**File:** `src/repositories/interfaces/LogRepository.ts`
**File:** `src/repositories/implementations/sql/SQLLogRepository.ts`

Create repository for audit logging:
- `create(data: LogInsert): Promise<LogEntity>`

### Step 14: Add Token Generation Utility

**File:** `src/lib/utils/token.ts`

Create utility function:
- `generateSecureToken(): string` - Uses `crypto.randomBytes(32).toString('hex')`

### Step 15: Add Invitation URL Builder

**File:** `src/lib/utils/invitation.ts`

Create utility function:
- `buildInvitationUrl(token: string): string` - Constructs frontend URL with token

### Step 16: Testing

**Unit Tests:**
- Test `InvitationService` with in-memory repositories
- Test validation logic
- Test error scenarios
- Test business rules (duplicate prevention, membership checks)

**Integration Tests:**
- Test API routes with test database
- Test authentication and authorization
- Test error responses

**E2E Tests:**
- Test full invitation flow (create → accept)
- Test error scenarios

### Step 17: Documentation

- Update API documentation with endpoint details
- Document error codes and responses
- Document business rules and validation

### Step 18: Future Enhancements

- Implement email sending for invitation notifications
- Implement rate limiting (10 invitations per family per hour)
- Add pagination if needed
- Add invitation expiration cleanup job

