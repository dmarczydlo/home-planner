# API Endpoint Implementation Plan: GET /api/users/me

## 1. Endpoint Overview

The GET /api/users/me endpoint retrieves the authenticated user's complete profile information, including their full name, avatar URL, last update timestamp, and all family memberships with associated roles. This endpoint serves as the foundation for user authentication state management and is typically called on application initialization to establish the user's context.

**Key Characteristics:**
- Read-only operation (GET method)
- Requires authentication (JWT token)
- Returns enriched user data with family relationships
- No side effects on the database

## 2. Request Details

### HTTP Method
`GET`

### URL Structure
```
/api/users/me
```

### Headers
- **Required:**
  - `Authorization: Bearer <jwt_token>` - Supabase JWT token obtained from authentication

### Parameters
- **Required:** None
- **Optional:** None
- **Query Parameters:** None
- **Request Body:** None

### Example Request
```http
GET /api/users/me HTTP/1.1
Host: api.homeplanner.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Used Types

### Response DTOs (from src/types.ts)

**Primary Response Type:**
```typescript
type UserProfileDTO = {
  id: string;                    // UUID
  full_name: string | null;      // Max 100 characters
  avatar_url: string | null;     // Valid URL format
  updated_at: string | null;     // ISO8601 timestamp
  families: UserFamilyMembershipDTO[];
}
```

**Nested Type:**
```typescript
type UserFamilyMembershipDTO = {
  family_id: string;    // UUID
  family_name: string;  // Family name
  role: "admin" | "member";
  joined_at: string;    // ISO8601 timestamp
}
```

### Database Entity Types
```typescript
type UserEntity = Tables<"users">;
type FamilyMemberEntity = Tables<"family_members">;
```

### Validation Schemas
```typescript
import { userProfileSchema } from "@/types";
```

### Domain Errors
```typescript
import { UnauthorizedError, NotFoundError, DomainError } from "@/domain/errors";
```

### Result Type
```typescript
import type { Result } from "@/domain/result";
```

## 4. Response Details

### Success Response (200 OK)

**Status Code:** `200 OK`

**Response Body:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "full_name": "John Smith",
  "avatar_url": "https://example.com/avatar.jpg",
  "updated_at": "2025-01-15T10:30:00.000Z",
  "families": [
    {
      "family_id": "660e8400-e29b-41d4-a716-446655440001",
      "family_name": "The Smiths",
      "role": "admin",
      "joined_at": "2025-01-01T08:00:00.000Z"
    },
    {
      "family_id": "770e8400-e29b-41d4-a716-446655440002",
      "family_name": "Extended Family",
      "role": "member",
      "joined_at": "2025-01-10T12:00:00.000Z"
    }
  ]
}
```

### Error Responses

#### 401 Unauthorized - Missing Token
```json
{
  "error": "unauthorized",
  "message": "Missing or invalid JWT token"
}
```

#### 401 Unauthorized - Invalid Token
```json
{
  "error": "unauthorized",
  "message": "Invalid authentication token"
}
```

#### 404 Not Found - User Profile Missing
```json
{
  "error": "not_found",
  "message": "User profile not found"
}
```

#### 500 Internal Server Error
```json
{
  "error": "internal_error",
  "message": "An unexpected error occurred"
}
```

## 5. Data Flow

### High-Level Flow
```
1. Client Request (with JWT)
   ↓
2. Middleware: Authentication
   - Extract JWT from Authorization header
   - Validate JWT with Supabase Auth
   - Extract user_id from JWT
   - Attach user info to context.locals
   ↓
3. API Route Handler
   - Call requireAuth() helper
   - Delegate to UserService
   ↓
4. UserService.getUserProfile(userId)
   - Call UserRepository.findById(userId)
   - Call UserRepository.getFamilyMemberships(userId)
   - Combine data into UserProfileDTO
   - Return Result<UserProfileDTO, DomainError>
   ↓
5. API Route Handler
   - Map Result to HTTP Response
   - Return JSON response
```

### Detailed Data Flow

#### Step 1: Authentication Middleware
```typescript
// Executed before route handler
// File: src/middleware/index.ts

1. Extract Authorization header
2. Parse Bearer token
3. Call supabase.auth.getUser(token)
4. If valid:
   - Store user in context.locals.user
   - Continue to route handler
5. If invalid:
   - Return 401 immediately
```

#### Step 2: Route Handler Entry
```typescript
// File: src/pages/api/users/me.ts

1. Call requireAuth(locals) helper
2. Extract userId from locals.user
3. Instantiate UserService with repositories
4. Call service.getUserProfile(userId)
```

#### Step 3: Service Layer
```typescript
// File: src/services/UserService.ts

getUserProfile(userId: string):
  1. Validate userId (non-empty UUID)
  2. Call userRepository.findById(userId)
  3. If user not found:
     - return err(NotFoundError)
  4. Call userRepository.getFamilyMemberships(userId)
  5. Combine user + families into UserProfileDTO
  6. Validate response with userProfileSchema
  7. Return ok(userProfile)
```

#### Step 4: Repository Layer
```typescript
// File: src/repositories/implementations/sql/SQLUserRepository.ts

findById(userId):
  1. Query: SELECT * FROM public.users WHERE id = userId
  2. Return UserEntity or null

getFamilyMemberships(userId):
  1. Query:
     SELECT 
       fm.family_id,
       f.name as family_name,
       fm.role,
       fm.joined_at
     FROM public.family_members fm
     JOIN public.families f ON f.id = fm.family_id
     WHERE fm.user_id = userId
     ORDER BY fm.joined_at ASC
  2. Return array of UserFamilyMembershipDTO
```

### Database Queries

**Query 1: Fetch User Profile**
```sql
SELECT 
  id,
  full_name,
  avatar_url,
  updated_at
FROM public.users
WHERE id = $1;
```

**Query 2: Fetch Family Memberships**
```sql
SELECT 
  fm.family_id,
  f.name as family_name,
  fm.role,
  fm.joined_at
FROM public.family_members fm
INNER JOIN public.families f ON f.id = fm.family_id
WHERE fm.user_id = $1
ORDER BY fm.joined_at ASC;
```

### RLS Policy Impact
- **Users table:** RLS allows users to read their own profile (id = auth.uid())
- **Family_members table:** RLS allows users to see their own memberships
- **Families table:** RLS allows users to see families they belong to

## 6. Security Considerations

### Authentication
- **JWT Validation:** Performed in middleware using `supabase.auth.getUser()`
- **Token Source:** Must be in Authorization header with Bearer scheme
- **Token Expiration:** Handled by Supabase Auth (default 1 hour)
- **Token Refresh:** Client responsible for refreshing expired tokens

### Authorization
- **Self-Access Only:** Users can only access their own profile (userId from JWT)
- **No Parameter Injection:** userId comes from validated JWT, not user input
- **RLS Enforcement:** Database-level policies ensure data isolation

### Data Protection
- **PII Handling:** Email not exposed (only id, name, avatar)
- **HTTPS Required:** All API calls must use HTTPS in production
- **CORS Policy:** Configure allowed origins in Astro config
- **No Sensitive Data:** Access tokens not returned in response

### Input Validation
- **JWT Format:** Validated by Supabase Auth library
- **No User Input:** Endpoint accepts no parameters, reducing attack surface
- **Output Validation:** Response validated with Zod schema before sending

### Threat Mitigation

| Threat | Mitigation Strategy |
|--------|---------------------|
| Token theft | HTTPS, short expiration, secure storage |
| Token replay | Token expiration, Supabase signature validation |
| User impersonation | JWT signature verification with Supabase secret |
| CSRF | Not applicable (no state-changing operation) |
| SQL injection | Parameterized queries, Supabase client |
| XSS | JSON response (no HTML rendering) |

## 7. Error Handling

### Error Scenarios

#### 1. Missing Authorization Header
**Trigger:** Request without Authorization header
**Handler:** Authentication middleware
**Response:**
```typescript
return new Response(
  JSON.stringify({
    error: "unauthorized",
    message: "Missing or invalid JWT token"
  }),
  { status: 401, headers: { "Content-Type": "application/json" } }
);
```

#### 2. Invalid JWT Token
**Trigger:** Malformed or expired JWT
**Handler:** Authentication middleware (supabase.auth.getUser fails)
**Response:**
```typescript
return new Response(
  JSON.stringify({
    error: "unauthorized",
    message: "Invalid authentication token"
  }),
  { status: 401, headers: { "Content-Type": "application/json" } }
);
```

#### 3. User Profile Not Found
**Trigger:** Valid JWT but user record missing in public.users
**Handler:** UserService
**Error:** `NotFoundError("User", userId)`
**Response:**
```typescript
{
  status: 404,
  body: {
    error: "not_found",
    message: "User profile not found"
  }
}
```
**Note:** This is an edge case that shouldn't occur in normal operation. Log as critical error.

#### 4. Database Connection Failure
**Trigger:** Supabase unavailable or network issue
**Handler:** Repository layer (catch block)
**Error:** Infrastructure error
**Response:**
```typescript
{
  status: 500,
  body: {
    error: "internal_error",
    message: "An unexpected error occurred"
  }
}
```
**Action:** Log to monitoring system, trigger alert

#### 5. Invalid Family Membership Data
**Trigger:** Database inconsistency (family_members references non-existent family)
**Handler:** Service layer (validation fails)
**Error:** ValidationError
**Response:**
```typescript
{
  status: 500,
  body: {
    error: "internal_error",
    message: "Data integrity error"
  }
}
```
**Action:** Log data integrity issue, investigate database

### Error Handling Pattern

```typescript
// In API Route Handler
export async function GET({ locals }: APIContext) {
  try {
    // 1. Auth check
    const userId = requireAuth(locals);
    if (userId instanceof Response) return userId;

    // 2. Call service
    const userService = new UserService(locals.repositories.user);
    const result = await userService.getUserProfile(userId);

    // 3. Map Result to Response
    return mapResultToResponse(result);

  } catch (error) {
    // Unexpected errors
    console.error("Unexpected error in GET /api/users/me:", error);
    
    // Log to audit trail
    await logError(locals, error, { endpoint: "/api/users/me" });
    
    return new Response(
      JSON.stringify({
        error: "internal_error",
        message: "An unexpected error occurred"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

### Audit Logging

Log the following events to `public.logs`:

**Success Event:**
```typescript
{
  family_id: null,
  actor_id: userId,
  actor_type: "user",
  action: "user.profile.view",
  details: {
    endpoint: "/api/users/me",
    family_count: profile.families.length
  }
}
```

**Error Event:**
```typescript
{
  family_id: null,
  actor_id: userId || null,
  actor_type: "user",
  action: "user.profile.view.error",
  details: {
    endpoint: "/api/users/me",
    error_type: error.constructor.name,
    message: error.message
  }
}
```

## 8. Performance Considerations

### Database Performance

**Query Optimization:**
- **Index Usage:** Queries use primary key (id) and indexed foreign keys
- **Query Count:** 2 queries per request (user + family_memberships)
- **No N+1 Problem:** Family memberships fetched in single query with JOIN

**Expected Query Times:**
- User lookup by id: < 1ms (primary key lookup)
- Family memberships: < 5ms (indexed foreign key + join)
- **Total DB time: < 10ms**

### Caching Strategy

**Not Recommended for This Endpoint:**
- User profile data can change frequently
- Family memberships can change (user joins/leaves families)
- Low computational cost (2 simple queries)
- Caching adds complexity without significant benefit

**If Caching Needed:**
- Use short TTL (30-60 seconds)
- Cache at API route level with user_id as key
- Invalidate on profile updates or family membership changes

### Network Optimization

**Response Size:**
- Typical response: ~500 bytes (1 user + 2 families)
- Maximum response: ~2KB (user + 10 families)
- **Recommendation:** No compression needed for small responses

**Connection Reuse:**
- Supabase client reuses HTTP connections
- No additional configuration needed

### Bottlenecks and Mitigation

| Bottleneck | Impact | Mitigation |
|------------|--------|------------|
| Database connection pool | High load scenarios | Supabase handles connection pooling automatically |
| JWT validation | Every request | Handled by Supabase (fast in-memory validation) |
| Multiple queries | Minor latency | Consider database view if performance issues arise |
| Large family count | Rare (most users have 1-3 families) | Set reasonable limit (e.g., max 20 families) |

### Expected Performance Metrics

**Target Metrics:**
- **p50 (median):** < 50ms
- **p95:** < 100ms
- **p99:** < 200ms

**Breakdown:**
- JWT validation: 5-10ms
- Database queries: 5-10ms
- JSON serialization: 1-2ms
- Network latency: 20-50ms (varies by client location)

## 9. Implementation Steps

### Phase 1: Foundation (Prerequisites)

#### Step 1.1: Verify Database Schema
```bash
# Ensure tables exist with correct structure
✓ public.users table
✓ public.families table
✓ public.family_members table
✓ RLS policies enabled and configured
```

#### Step 1.2: Verify Type Definitions
```bash
# Ensure database types are generated
✓ src/db/database.types.ts exists
✓ Contains Tables, TablesInsert, TablesUpdate types
```

#### Step 1.3: Verify Shared Types
```bash
# Ensure DTOs are defined
✓ src/types.ts contains:
  - UserProfileDTO
  - UserFamilyMembershipDTO
  - userProfileSchema
  - userFamilyMembershipSchema
```

### Phase 2: Domain Layer

#### Step 2.1: Create Domain Error Classes
**File:** `src/domain/errors.ts`

```typescript
export class DomainError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string = "Unauthorized") {
    super(401, message);
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super(404, `${resource} with id ${id} not found`);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string = "Forbidden") {
    super(403, message);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, public readonly fields?: Record<string, string>) {
    super(400, message);
  }
}
```

#### Step 2.2: Create Result Type
**File:** `src/domain/result.ts`

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
```

### Phase 3: Repository Layer

#### Step 3.1: Create UserRepository Interface
**File:** `src/repositories/interfaces/UserRepository.ts`

```typescript
import type { UserEntity } from "@/types";
import type { UserFamilyMembershipDTO } from "@/types";

export interface UserRepository {
  /**
   * Find user by ID
   * @returns UserEntity if found, null if not found
   */
  findById(userId: string): Promise<UserEntity | null>;

  /**
   * Get all family memberships for a user
   * @returns Array of family memberships (empty array if none)
   */
  getFamilyMemberships(userId: string): Promise<UserFamilyMembershipDTO[]>;
}
```

#### Step 3.2: Implement SQL Repository
**File:** `src/repositories/implementations/sql/SQLUserRepository.ts`

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { UserRepository } from "@/repositories/interfaces/UserRepository";
import type { UserEntity, UserFamilyMembershipDTO } from "@/types";

export class SQLUserRepository implements UserRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findById(userId: string): Promise<UserEntity | null> {
    const { data, error } = await this.client
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found
        return null;
      }
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    return data;
  }

  async getFamilyMemberships(userId: string): Promise<UserFamilyMembershipDTO[]> {
    const { data, error } = await this.client
      .from("family_members")
      .select(`
        family_id,
        role,
        joined_at,
        families:family_id (
          name
        )
      `)
      .eq("user_id", userId)
      .order("joined_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch family memberships: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    // Transform to DTO format
    return data.map((row) => ({
      family_id: row.family_id,
      family_name: (row.families as { name: string }).name,
      role: row.role as "admin" | "member",
      joined_at: row.joined_at,
    }));
  }
}
```

#### Step 3.3: Implement In-Memory Repository (for testing)
**File:** `src/repositories/implementations/in-memory/InMemoryUserRepository.ts`

```typescript
import type { UserRepository } from "@/repositories/interfaces/UserRepository";
import type { UserEntity, UserFamilyMembershipDTO } from "@/types";

export class InMemoryUserRepository implements UserRepository {
  private users: Map<string, UserEntity> = new Map();
  private memberships: Map<string, UserFamilyMembershipDTO[]> = new Map();

  async findById(userId: string): Promise<UserEntity | null> {
    return this.users.get(userId) || null;
  }

  async getFamilyMemberships(userId: string): Promise<UserFamilyMembershipDTO[]> {
    return this.memberships.get(userId) || [];
  }

  // Test helpers
  seed(user: UserEntity, memberships: UserFamilyMembershipDTO[] = []): void {
    this.users.set(user.id, user);
    this.memberships.set(user.id, memberships);
  }

  clear(): void {
    this.users.clear();
    this.memberships.clear();
  }
}
```

#### Step 3.4: Create Repository Factory
**File:** `src/repositories/factory.ts`

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import { SQLUserRepository } from "./implementations/sql/SQLUserRepository";
// Import other repositories as they're created

export interface Repositories {
  user: UserRepository;
  // Add other repositories here
}

export function createRepositories(client: SupabaseClient<Database>): Repositories {
  return {
    user: new SQLUserRepository(client),
    // Add other repositories here
  };
}
```

### Phase 4: Service Layer

#### Step 4.1: Create UserService
**File:** `src/services/UserService.ts`

```typescript
import type { UserRepository } from "@/repositories/interfaces/UserRepository";
import type { UserProfileDTO } from "@/types";
import { userProfileSchema } from "@/types";
import type { Result } from "@/domain/result";
import { ok, err } from "@/domain/result";
import { NotFoundError, ValidationError, DomainError } from "@/domain/errors";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getUserProfile(userId: string): Promise<Result<UserProfileDTO, DomainError>> {
    // Validate input
    if (!userId || typeof userId !== "string") {
      return err(new ValidationError("User ID is required"));
    }

    try {
      // Fetch user entity
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        return err(new NotFoundError("User", userId));
      }

      // Fetch family memberships
      const families = await this.userRepository.getFamilyMemberships(userId);

      // Construct DTO
      const profile: UserProfileDTO = {
        id: user.id,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        updated_at: user.updated_at,
        families: families,
      };

      // Validate output structure
      const validation = userProfileSchema.safeParse(profile);
      if (!validation.success) {
        console.error("Profile validation failed:", validation.error);
        return err(new ValidationError("Invalid profile data structure"));
      }

      return ok(validation.data);

    } catch (error) {
      console.error("Error in UserService.getUserProfile:", error);
      // Re-throw to be handled by route error handler
      throw error;
    }
  }
}
```

### Phase 5: HTTP Layer

#### Step 5.1: Create HTTP Response Mapper
**File:** `src/lib/http/responseMapper.ts`

```typescript
import type { Result } from "@/domain/result";
import type { DomainError } from "@/domain/errors";

export function mapResultToResponse<T>(result: Result<T, DomainError>): Response {
  if (result.success) {
    return new Response(JSON.stringify(result.data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const error = result.error;
  const statusCode = error.statusCode || 500;
  
  const errorBody = {
    error: error.name.replace("Error", "").toLowerCase(),
    message: error.message,
    ...(error instanceof ValidationError && error.fields
      ? { details: error.fields }
      : {}),
  };

  return new Response(JSON.stringify(errorBody), {
    status: statusCode,
    headers: { "Content-Type": "application/json" },
  });
}
```

#### Step 5.2: Create Auth Helper
**File:** `src/lib/http/apiHelpers.ts`

```typescript
import type { APIContext } from "astro";
import { UnauthorizedError } from "@/domain/errors";

/**
 * Extract and validate authenticated user from request context
 * @returns User ID if authenticated, or 401 Response if not
 */
export function requireAuth(locals: APIContext["locals"]): string | Response {
  const user = locals.user;

  if (!user || !user.id) {
    return new Response(
      JSON.stringify({
        error: "unauthorized",
        message: "Missing or invalid JWT token",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return user.id;
}
```

#### Step 5.3: Update Middleware for Authentication
**File:** `src/middleware/index.ts`

```typescript
import { defineMiddleware } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client";
import { createRepositories } from "../repositories/factory";

export const onRequest = defineMiddleware(async (context, next) => {
  // Attach Supabase client
  context.locals.supabase = supabaseClient;

  // Extract and validate JWT token
  const authHeader = context.request.headers.get("Authorization");
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    
    try {
      const { data, error } = await supabaseClient.auth.getUser(token);
      
      if (!error && data.user) {
        context.locals.user = {
          id: data.user.id,
          email: data.user.email,
        };
      }
    } catch (error) {
      console.error("Auth middleware error:", error);
      // Continue without setting user (route will handle 401)
    }
  }

  // Create and attach repositories
  context.locals.repositories = createRepositories(supabaseClient);

  return next();
});
```

#### Step 5.4: Update TypeScript Definitions
**File:** `src/env.d.ts`

```typescript
/// <reference types="astro/client" />

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types";
import type { Repositories } from "./repositories/factory";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      repositories: Repositories;
      user?: {
        id: string;
        email: string | undefined;
      };
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### Phase 6: API Route Implementation

#### Step 6.1: Create API Route Handler
**File:** `src/pages/api/users/me.ts`

```typescript
import type { APIContext } from "astro";
import { UserService } from "@/services/UserService";
import { requireAuth } from "@/lib/http/apiHelpers";
import { mapResultToResponse } from "@/lib/http/responseMapper";

/**
 * GET /api/users/me
 * Retrieves the authenticated user's profile with family memberships
 */
export async function GET({ locals }: APIContext): Promise<Response> {
  try {
    // 1. Verify authentication
    const userId = requireAuth(locals);
    if (userId instanceof Response) {
      return userId; // Return 401 response
    }

    // 2. Instantiate service with repository
    const userService = new UserService(locals.repositories.user);

    // 3. Execute business logic
    const result = await userService.getUserProfile(userId);

    // 4. Map Result to HTTP Response
    return mapResultToResponse(result);

  } catch (error) {
    // Handle unexpected errors
    console.error("Unexpected error in GET /api/users/me:", error);

    return new Response(
      JSON.stringify({
        error: "internal_error",
        message: "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
```

### Phase 7: Testing

#### Step 7.1: Create Unit Tests for Service
**File:** `src/services/UserService.test.ts`

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { UserService } from "./UserService";
import { InMemoryUserRepository } from "@/repositories/implementations/in-memory/InMemoryUserRepository";
import type { UserEntity, UserFamilyMembershipDTO } from "@/types";

describe("UserService", () => {
  let userRepository: InMemoryUserRepository;
  let userService: UserService;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    userService = new UserService(userRepository);
  });

  describe("getUserProfile", () => {
    it("should return user profile with family memberships", async () => {
      // Arrange
      const mockUser: UserEntity = {
        id: "user-123",
        full_name: "John Doe",
        avatar_url: "https://example.com/avatar.jpg",
        updated_at: "2025-01-15T10:00:00Z",
      };

      const mockMemberships: UserFamilyMembershipDTO[] = [
        {
          family_id: "family-1",
          family_name: "The Doe Family",
          role: "admin",
          joined_at: "2025-01-01T00:00:00Z",
        },
      ];

      userRepository.seed(mockUser, mockMemberships);

      // Act
      const result = await userService.getUserProfile("user-123");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("user-123");
        expect(result.data.full_name).toBe("John Doe");
        expect(result.data.families).toHaveLength(1);
        expect(result.data.families[0].family_name).toBe("The Doe Family");
      }
    });

    it("should return NotFoundError when user does not exist", async () => {
      // Act
      const result = await userService.getUserProfile("non-existent");

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.statusCode).toBe(404);
        expect(result.error.message).toContain("User");
      }
    });

    it("should return empty families array when user has no memberships", async () => {
      // Arrange
      const mockUser: UserEntity = {
        id: "user-123",
        full_name: "Jane Doe",
        avatar_url: null,
        updated_at: null,
      };

      userRepository.seed(mockUser, []);

      // Act
      const result = await userService.getUserProfile("user-123");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.families).toEqual([]);
      }
    });

    it("should return ValidationError for invalid userId", async () => {
      // Act
      const result = await userService.getUserProfile("");

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.statusCode).toBe(400);
      }
    });
  });
});
```

#### Step 7.2: Create Integration Tests
**File:** `src/pages/api/users/me.test.ts`

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "./me";
import type { APIContext } from "astro";
import { InMemoryUserRepository } from "@/repositories/implementations/in-memory/InMemoryUserRepository";

describe("GET /api/users/me", () => {
  let mockContext: APIContext;
  let userRepository: InMemoryUserRepository;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    
    mockContext = {
      locals: {
        repositories: {
          user: userRepository,
        },
        user: {
          id: "user-123",
          email: "test@example.com",
        },
      },
    } as unknown as APIContext;
  });

  it("should return 200 with user profile", async () => {
    // Arrange
    userRepository.seed(
      {
        id: "user-123",
        full_name: "Test User",
        avatar_url: "https://example.com/avatar.jpg",
        updated_at: "2025-01-15T10:00:00Z",
      },
      [
        {
          family_id: "family-1",
          family_name: "Test Family",
          role: "admin",
          joined_at: "2025-01-01T00:00:00Z",
        },
      ]
    );

    // Act
    const response = await GET(mockContext);

    // Assert
    expect(response.status).toBe(200);
    
    const body = await response.json();
    expect(body.id).toBe("user-123");
    expect(body.full_name).toBe("Test User");
    expect(body.families).toHaveLength(1);
  });

  it("should return 401 when user is not authenticated", async () => {
    // Arrange
    mockContext.locals.user = undefined;

    // Act
    const response = await GET(mockContext);

    // Assert
    expect(response.status).toBe(401);
    
    const body = await response.json();
    expect(body.error).toBe("unauthorized");
  });

  it("should return 404 when user profile does not exist", async () => {
    // Act (no user seeded in repository)
    const response = await GET(mockContext);

    // Assert
    expect(response.status).toBe(404);
    
    const body = await response.json();
    expect(body.error).toBe("not_found");
  });
});
```

#### Step 7.3: Create E2E Tests with Playwright
**File:** `tests/e2e/api/users-me.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("GET /api/users/me", () => {
  let authToken: string;

  test.beforeEach(async ({ request }) => {
    // Authenticate and get token
    const loginResponse = await request.post("/auth/login", {
      data: {
        email: "test@example.com",
        password: "testpassword",
      },
    });
    
    const loginData = await loginResponse.json();
    authToken = loginData.access_token;
  });

  test("should return user profile with valid token", async ({ request }) => {
    const response = await request.get("/api/users/me", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("full_name");
    expect(data).toHaveProperty("families");
    expect(Array.isArray(data.families)).toBeTruthy();
  });

  test("should return 401 without token", async ({ request }) => {
    const response = await request.get("/api/users/me");

    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data.error).toBe("unauthorized");
  });

  test("should return 401 with invalid token", async ({ request }) => {
    const response = await request.get("/api/users/me", {
      headers: {
        Authorization: "Bearer invalid-token",
      },
    });

    expect(response.status()).toBe(401);
  });
});
```

### Phase 8: Documentation and Deployment

#### Step 8.1: Add API Documentation Comments
Ensure all public methods have JSDoc comments explaining parameters, return types, and behavior.

#### Step 8.2: Update API Documentation
Add this endpoint to any API documentation (e.g., OpenAPI/Swagger spec).

#### Step 8.3: Configure Environment Variables
Ensure `.env` file contains:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```

#### Step 8.4: Run Tests and Lint
```bash
# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Run linter
pnpm lint
```

#### Step 8.5: Create Pull Request
- Title: "feat: implement GET /api/users/me endpoint"
- Description: Reference this implementation plan
- Include test results and screenshots

#### Step 8.6: Deploy to Staging
- Deploy to staging environment
- Verify endpoint works with real Supabase instance
- Test with real authentication flow

### Phase 9: Monitoring and Observability

#### Step 9.1: Add Logging
Ensure appropriate logging is in place for:
- Successful requests (info level)
- Authentication failures (warn level)
- Errors (error level)

#### Step 9.2: Add Metrics
Track:
- Request count
- Response times (p50, p95, p99)
- Error rates
- 401 response count

#### Step 9.3: Set Up Alerts
Create alerts for:
- High error rate (> 5%)
- Slow response times (p95 > 200ms)
- High 401 rate (potential security issue)

## 10. Checklist

### Development Checklist
- [ ] Domain errors created
- [ ] Result type implemented
- [ ] UserRepository interface defined
- [ ] SQLUserRepository implemented
- [ ] InMemoryUserRepository implemented
- [ ] Repository factory created
- [ ] UserService implemented
- [ ] Response mapper created
- [ ] Auth helper created
- [ ] Middleware updated for auth
- [ ] TypeScript definitions updated
- [ ] API route handler created

### Testing Checklist
- [ ] Unit tests for UserService
- [ ] Integration tests for API route
- [ ] E2E tests with Playwright
- [ ] All tests passing
- [ ] Code coverage > 80%

### Quality Checklist
- [ ] Linter passing (no errors)
- [ ] TypeScript strict mode enabled
- [ ] All functions have JSDoc comments
- [ ] Error handling complete
- [ ] Input validation implemented
- [ ] Output validation implemented

### Security Checklist
- [ ] JWT validation working
- [ ] RLS policies configured
- [ ] No SQL injection vulnerabilities
- [ ] No sensitive data in responses
- [ ] HTTPS enforced in production
- [ ] CORS properly configured

### Documentation Checklist
- [ ] API documentation updated
- [ ] Code comments complete
- [ ] README updated (if needed)
- [ ] Implementation plan reviewed

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Staging deployment successful
- [ ] Production deployment successful
- [ ] Monitoring configured
- [ ] Alerts configured
- [ ] Load testing completed (if high traffic expected)

---

## Appendix: Quick Reference

### Key Files Created
```
src/
├── domain/
│   ├── errors.ts
│   └── result.ts
├── repositories/
│   ├── interfaces/
│   │   └── UserRepository.ts
│   ├── implementations/
│   │   ├── sql/
│   │   │   └── SQLUserRepository.ts
│   │   └── in-memory/
│   │       └── InMemoryUserRepository.ts
│   └── factory.ts
├── services/
│   └── UserService.ts
├── lib/
│   └── http/
│       ├── responseMapper.ts
│       └── apiHelpers.ts
├── middleware/
│   └── index.ts (updated)
├── pages/
│   └── api/
│       └── users/
│           └── me.ts
└── env.d.ts (updated)
```

### Key Commands
```bash
# Development
pnpm dev

# Testing
pnpm test                 # Unit tests
pnpm test:e2e            # E2E tests
pnpm test:coverage       # Coverage report

# Linting
pnpm lint
pnpm lint:fix

# Type checking
pnpm typecheck

# Build
pnpm build
```

### Useful SQL Queries for Debugging
```sql
-- Check if user exists
SELECT * FROM public.users WHERE id = 'user-id';

-- Check user's family memberships
SELECT fm.*, f.name 
FROM public.family_members fm
JOIN public.families f ON f.id = fm.family_id
WHERE fm.user_id = 'user-id';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'users';
```

---

**End of Implementation Plan**

