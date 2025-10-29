# Implementation Document - Home Planner

This document describes the technical implementation approach, architecture patterns, error handling, and stack decisions for the Home Planner application.

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Error Handling](#error-handling)
- [Response Mapping](#response-mapping)

## Architecture

This project follows **Hexagonal Architecture (Ports & Adapters)** for backend data access, enabling clean separation between domain logic and infrastructure concerns.

### Key Concepts

- **Domain Layer**: Contains business entities, DTOs, and repository interfaces (ports)
- **Infrastructure Layer**: Contains repository implementations (adapters) - SQL and in-memory
- **Application Layer**: Astro API routes that use repositories via dependency injection
- **Dependency Injection**: Repositories are created per-request in middleware and attached to `context.locals`

### Detailed Architecture Documentation

For comprehensive details on the hexagonal architecture implementation, see:

- [Hexagonal Architecture Proposal](./hexagonal-architecture-proposal.md)

### Quick Reference

**Repository Pattern**:

- Interfaces (Ports): `FamilyRepository`, `EventRepository`, `UserRepository`
- SQL Implementation: `SQLFamilyRepository`, `SQLEventRepository`, `SQLUserRepository`
- In-Memory Implementation: `InMemoryFamilyRepository`, `InMemoryEventRepository`, `InMemoryUserRepository`

**File Structure**:

```
src/
├── domain/
│   ├── entities/          # Domain entities
│   └── dtos/              # Data Transfer Objects
├── repositories/
│   ├── interfaces/        # Repository contracts
│   └── implementations/   # SQL and in-memory adapters
├── services/              # Domain services (use Result pattern)
├── middleware/            # Astro middleware (DI setup)
└── pages/api/             # Astro API routes (controllers)
```

## Tech Stack

### Frontend

- **Astro 5**: Static site generator with SSR capabilities, used for pages and API routes
- **React 19**: For interactive components requiring client-side state
- **TypeScript 5**: Type safety across the entire codebase
- **Tailwind 4**: Utility-first CSS framework for styling
- **Shadcn/ui**: Component library built on Radix UI and Tailwind

### Backend

- **Supabase**: Backend-as-a-Service providing:
  - PostgreSQL database
  - Authentication (Sign in with Google)
  - Row Level Security (RLS)
  - Real-time subscriptions (future use)
- **PostgreSQL**: Database (via Supabase)

### Testing

- **Playwright**: End-to-end testing
- **Vitest**: Unit and integration testing

### DevOps

- **GitHub Actions**: CI/CD pipelines

### Development Tools

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Static type checking

## Error Handling

This project uses a **Result Object Pattern** for error handling in the domain and service layers. This approach provides type-safe, explicit error handling without exceptions, following functional programming principles.

### Result Type Definition

```typescript
// src/domain/result.ts

type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

// Helper functions
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

// Type guard
export function isOk<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success;
}

export function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}
```

### Domain Error Types

```typescript
// src/domain/errors.ts

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
    super(id ? `${resource} with id ${id} not found` : `${resource} not found`, "NOT_FOUND", 404);
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

### Usage in Services

**Service Layer** (`src/services/`):

- Services return `Result<T, DomainError>` instead of throwing exceptions
- Business logic is explicit and type-safe
- Errors are part of the type system

```typescript
// src/services/familyService.ts
import { Result, ok, err } from "@/domain/result";
import { NotFoundError, ValidationError } from "@/domain/errors";
import type { FamilyRepository } from "@/repositories/interfaces/FamilyRepository";

export class FamilyService {
  constructor(private readonly familyRepo: FamilyRepository) {}

  async getFamilyById(id: string, userId: string): Promise<Result<Family, DomainError>> {
    // Validation
    if (!id) {
      return err(new ValidationError("Family ID is required"));
    }

    // Business logic
    const family = await this.familyRepo.findById(id);

    if (!family) {
      return err(new NotFoundError("Family", id));
    }

    // Check authorization (business rule)
    const isMember = await this.familyRepo.isUserMember(family.id, userId);
    if (!isMember) {
      return err(new ForbiddenError("You do not have access to this family"));
    }

    return ok(family);
  }

  async createFamily(data: CreateFamilyDTO, userId: string): Promise<Result<Family, DomainError>> {
    // Validation
    if (!data.name || data.name.trim().length === 0) {
      return err(new ValidationError("Family name is required", { name: "required" }));
    }

    if (data.name.length > 100) {
      return err(
        new ValidationError("Family name must be less than 100 characters", {
          name: "max_length",
        })
      );
    }

    // Business logic
    try {
      const family = await this.familyRepo.create({
        name: data.name.trim(),
        createdBy: userId,
      });
      return ok(family);
    } catch (error) {
      // Handle infrastructure errors
      if (error instanceof DatabaseError) {
        return err(new DomainError("Failed to create family", "DATABASE_ERROR", 500));
      }
      throw error; // Re-throw unexpected errors
    }
  }
}
```

### Usage in Domain Logic

**Domain Super Layer**:

- Domain entities and value objects can return `Result` for validation
- Keeps business rules explicit and testable

```typescript
// src/domain/entities/Event.ts
import { Result, ok, err } from "@/domain/result";
import { ValidationError } from "@/domain/errors";

export class Event {
  static create(title: string, startTime: Date, endTime: Date, familyId: string): Result<Event, ValidationError> {
    // Domain validation
    if (!title || title.trim().length === 0) {
      return err(new ValidationError("Event title is required"));
    }

    if (endTime <= startTime) {
      return err(new ValidationError("End time must be after start time"));
    }

    return ok(
      new Event({
        title: title.trim(),
        startTime,
        endTime,
        familyId,
      })
    );
  }
}
```

## Response Mapping

Astro API routes (controllers) map `Result` objects to HTTP responses. This keeps the controller layer thin and focused on HTTP concerns.

### Response Mapper Utility

```typescript
// src/lib/http/responseMapper.ts
import type { Result } from "@/domain/result";
import type { DomainError } from "@/domain/errors";

export function mapResultToResponse<T>(
  result: Result<T, DomainError>,
  options?: {
    successStatus?: number;
    transform?: (data: T) => unknown;
  }
): Response {
  if (result.success) {
    const data = options?.transform ? options.transform(result.data) : result.data;
    return new Response(JSON.stringify(data), {
      status: options?.successStatus ?? 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // Handle error response
  const error = result.error;
  return new Response(
    JSON.stringify({
      error: {
        code: error.code,
        message: error.message,
        ...(error instanceof ValidationError && { fields: error.fields }),
      },
    }),
    {
      status: error.statusCode,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
```

### Usage in Astro API Routes

**API Routes** (`src/pages/api/`):

- Routes act as controllers
- Extract input from request
- Call services (which return `Result`)
- Map `Result` to HTTP response
- Handle authentication/authorization concerns

```typescript
// src/pages/api/families/[id].ts
import type { APIContext } from "astro";
import { FamilyService } from "@/services/familyService";
import { mapResultToResponse } from "@/lib/http/responseMapper";
import { UnauthorizedError } from "@/domain/errors";

export const prerender = false;

export async function GET({ params, locals }: APIContext) {
  // Authentication check
  const userId = locals.user?.id;
  if (!userId) {
    return mapResultToResponse(err(new UnauthorizedError("Authentication required")));
  }

  // Get family ID from params
  const familyId = params.id;
  if (!familyId) {
    return mapResultToResponse(err(new ValidationError("Family ID is required")));
  }

  // Call service
  const familyService = new FamilyService(locals.repositories.family);
  const result = await familyService.getFamilyById(familyId, userId);

  // Map Result to HTTP Response
  return mapResultToResponse(result);
}

export async function POST({ request, locals }: APIContext) {
  // Authentication check
  const userId = locals.user?.id;
  if (!userId) {
    return mapResultToResponse(err(new UnauthorizedError("Authentication required")));
  }

  // Parse and validate input
  let body;
  try {
    body = await request.json();
  } catch {
    return mapResultToResponse(err(new ValidationError("Invalid JSON in request body")));
  }

  // Call service
  const familyService = new FamilyService(locals.repositories.family);
  const result = await familyService.createFamily(body, userId);

  // Map Result to HTTP Response (201 for creation)
  return mapResultToResponse(result, { successStatus: 201 });
}

export async function DELETE({ params, locals }: APIContext) {
  // Similar pattern...
}
```

### Helper for Common Patterns

```typescript
// src/lib/http/apiHelpers.ts
import type { APIContext } from "astro";
import { UnauthorizedError } from "@/domain/errors";
import { err } from "@/domain/result";
import { mapResultToResponse } from "./responseMapper";

export function requireAuth(locals: APIContext["locals"]): string | Response {
  const userId = locals.user?.id;
  if (!userId) {
    return mapResultToResponse(err(new UnauthorizedError("Authentication required")));
  }
  return userId;
}

export function parseJSON<T>(request: Request): Result<T, ValidationError> {
  try {
    return ok(await request.json());
  } catch {
    return err(new ValidationError("Invalid JSON in request body"));
  }
}
```

### Simplified Route Example

```typescript
// src/pages/api/families/index.ts
import type { APIContext } from "astro";
import { FamilyService } from "@/services/familyService";
import { mapResultToResponse } from "@/lib/http/responseMapper";
import { requireAuth, parseJSON } from "@/lib/http/apiHelpers";

export const prerender = false;

export async function POST({ request, locals }: APIContext) {
  // Auth check
  const userId = requireAuth(locals);
  if (userId instanceof Response) return userId;

  // Parse body
  const bodyResult = await parseJSON<CreateFamilyDTO>(request);
  if (!bodyResult.success) {
    return mapResultToResponse(bodyResult);
  }

  // Business logic
  const familyService = new FamilyService(locals.repositories.family);
  const result = await familyService.createFamily(bodyResult.data, userId);

  // Response
  return mapResultToResponse(result, { successStatus: 201 });
}
```

## Benefits of Result Pattern

1. **Type Safety**: Errors are part of the type system, cannot be ignored
2. **Explicit Error Handling**: Forces developers to handle both success and error cases
3. **No Hidden Exceptions**: All error paths are explicit in function signatures
4. **Composable**: Results can be chained with utility functions
5. **Testable**: Easy to test both success and error scenarios
6. **Domain Clarity**: Business errors are separate from infrastructure errors

## Error Handling Flow

```
┌─────────────┐
│ API Route   │  ← HTTP Request
│ (Controller)│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Service    │  ← Returns Result<T, DomainError>
│   Arrange   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Repository  │  ← May throw infrastructure errors
│  Interface  │     (caught and converted to Result)
└─────────────┘
       │
       ▼
┌─────────────┐
│ Repository  │  ← Returns Result or throws
│Implementation│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Database   │
│  (Supabase) │
└─────────────┘

Controller maps Result → HTTP Response
```

## Testing with Result Pattern

```typescript
// tests/unit/services/familyService.test.ts
import { describe, it, expect } from "vitest";
import { FamilyService } from "@/services/familyService";
import { NotFoundError, ValidationError } from "@/domain/errors";
import { createInMemoryRepositories } from "@/repositories/factory";

describe("FamilyService", () => {
  it("should return error when family not found", async () => {
    const repos = createInMemoryRepositories();
    const service = new FamilyService(repos.family);

    const result = await service.getFamilyById("non-existent", "user-123");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(NotFoundError);
      expect(result.error.statusCode).toBe(404);
    }
  });

  it("should return family when found and user is member", async () => {
    const repos = createInMemoryRepositories();
    const service = new FamilyService(repos.family);

    // Setup
    const family = await repos.family.create({
      name: "Test Family",
      createdBy: "user-123",
    });
    await repos.family.addMember(family.id, "user-123");

    // Test
    const result = await service.getFamilyById(family.id, "user-123");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(family.id);
    }
  });
});
```
