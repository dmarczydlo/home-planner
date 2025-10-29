# Hexagonal Architecture with Dependency Injection Proposal for Astro

## Overview

This proposal outlines how to implement Hexagonal Architecture (Ports & Adapters) in an Astro application, enabling swappable repository implementations for testing (in-memory) and production (Supabase).

## Core Concept

### Hexagonal Architecture Layers

```
┌─────────────────────────────────────────┐
│         Application Layer               │
│  (Astro Routes, API Endpoints)          │
└─────────────────────────────────────────┘
              ↓ uses
┌─────────────────────────────────────────┐
│           Domain Layer                  │
│  (Repository Interfaces / Ports)        │
│  - FamilyRepository                     │
│  - EventRepository                      │
│  - UserRepository                       │
└─────────────────────────────────────────┘
              ↓ syndrome ← (DIP)
┌─────────────────────────────────────────┐
│        Infrastructure Layer             │
│  (Repository Implementations)           │
│  - SQLFamilyRepository                  │
│  - InMemoryFamilyRepository             │
└─────────────────────────────────────────┘
```

## Architecture Components

### 1. Repository Interfaces (Ports)

**Location**: `src/repositories/interfaces/`

- **Purpose**: Define contracts that domain logic depends on
- **Pattern**: TypeScript interfaces that describe operations (Create, Read, Update, Delete)
- **Benefits**:
  - Domain logic doesn't depend on infrastructure
  - Easy to mock for testing
  - Can swap implementations without changing business logic

**Example Structure**:

```typescript
interface FamilyRepository {
  findById(id: string): Promise<Family | null>;
  create(data: CreateFamilyDTO): Promise<Family>;
  update(id: string, data: UpdateFamilyDTO): Promise<Family>;
  delete(id: string): Promise<void>;
  findByUserId(userId: string): Promise<Family[]>;
}

interface EventRepository {
  findById(id: string): Promise<Event | null>;
  findByFamilyId(familyId: string, startDate?: Date, endDate?: Date): Promise<Event[]>;
  create(data: CreateEventDTO): Promise<Event>;
  update(id: string, data: UpdateEventDTO): Promise<Event>;
  delete(id: string): Promise<void>;
}
```

### 2. Repository Implementations (Adapters)

**Location**:

- Production: `src/repositories/implementations/sql/`
- Test: `src/repositories/implementations/in-memory/`

#### SQL Implementations

- Use Supabase client from `context.locals.supabase`
- Map Supabase types to domain entities
- Handle SQL-specific query patterns

#### In-Memory Implementations

- Store data in arrays or Map structures
- Same interface as SQL implementations
- Fast, perfect for unit/integration tests
- Can simulate edge cases easily

### 3. Repository Factory/Registry

**Location**: `src/repositories/factory.ts`

**Purpose**:

- Centralized place to decide which repository implementation to use
- Returns interface instances based on environment or configuration
- Singleton pattern to ensure same instances are reused

**Strategy Options**:

#### Option A: Environment-Based Factory

```typescript
// Returns SQL repos in production, InMemory in test mode
function createRepositories(context: AstroContext) {
  if (import.meta.env.MODE === "test") {
    return createInMemoryRepositories();
  }
  return createSQLRepositories(context.locals.supabase);
}
```

#### Option B: Explicit Configuration

```typescript
// Allows explicit control via config
const repositoryConfig = {
  useInMemory: import.meta.env.VITE_USE_IN_MEMORY_DB === "true",
};
```

#### Option C: Dependency Injection Container (Advanced)

- Use a lightweight DI container library
- More flexible but adds complexity

### 4. Astro Context Extension

**Location**: `src/middleware/index.ts` and `src/env.d.ts`

**Approach**:
Since Astro doesn't have native DI containers, we leverage:

- **Middleware** to create repositories and attach to `context.locals`
- **TypeScript augmentation** to type the repositories

**Flow**:

1. Middleware runs on every request
2. Factory creates repository instances
3. Repositories attached to `context.locals.repositories`
4. Routes access via `context.locals.repositories.family`, etc.

### 5. Domain Entities vs DTOs

**Domain Entities** (`src/domain/entities/`):

- Pure TypeScript classes/interfaces
- Business logic and validation
- No infrastructure dependencies

**DTOs** (`src/domain/dtos/`):

- Data Transfer Objects for API boundaries
- Validation via Zod schemas
- Convert between API requests and domain entities

**Mapping** (`src/repositories/mappers/`):

- Convert between SQL/database types and domain entities
- Handle type transformations

## File Structure

```
src/
├── domain/
│   ├── entities/
│   │   ├── Family.ts
│   │   ├── Event.ts
│   │   ├── User.ts
│   │   └── index.ts
│   └── dtos/
│       ├── CreateFamilyDTO.ts
│       ├── UpdateEventDTO.ts
│       └── index.ts
├── repositories/
│   ├── interfaces/
│   │   ├── FamilyRepository.ts
│   │   ├── EventRepository.ts
│   │   └── index.ts
│   ├── implementations/
│   │   ├── sql/
│   │   │   ├── SQLFamilyRepository.ts
│   │   │   ├── SQLEventRepository.ts
│   │   │   └── index.ts
│   │   └── in-memory/
│   │       ├── InMemoryFamilyRepository.ts
│   │       ├── InMemoryEventRepository.ts
│   │       └── index.ts
│   ├── mappers/
│   │   ├── familyMapper.ts
│   │   ├── eventMapper.ts
│   │   └── index.ts
│   ├── factory.ts
│   └── types.ts
├── middleware/
│   └── index.ts (injects repositories)
└── pages/
    └── api/
        └── families/
            └── index.ts (uses repositories)
```

## Usage Examples

### In Astro API Routes

```typescript
// src/pages/api/families/index.ts
export async function GET(context: APIContext) {
  // Access repository from context
  const familyRepo = context.locals.repositories.family;

  // Use interface - doesn't know about SQL or in-memory
  const families = await familyRepo.findByUserId(context.locals.userId);

  return new Response(JSON.stringify(families));
}
```

### In Tests

```typescript
// tests/unit/api/families.test.ts
import { createInMemoryRepositories } from '@/repositories/factory';

test('GET /api/families returns user families', async () => {
  const repos = createInMemoryRepositories();
  // Seed test data
  await repos.family.create({ name: 'Test Family', ... });

  // Test with in-memory repos
  const result = await repos.family.findByUserId('user-123');
  expect(result).toHaveLength(加法);
});
```

## Benefits

1. **Testability**: Easy to swap SQL repositories with in-memory for fast, isolated tests
2. **Flexibility**: Can switch database backends without changing domain logic
3. **Separation of Concerns**: Clear boundaries between domain and infrastructure
4. **Type Safety**: TypeScript ensures contracts are followed
5. **Maintainability**: Changes to infrastructure don't affect business logic

## Challenges & Solutions

### Challenge 1: Astro's Limited DI

**Solution**: Use middleware + context.locals pattern (similar to Express)

### Challenge 2: Type Safety Across Boundaries

**Solution**:

- Strict TypeScript interfaces
- Runtime validation with Zod for DTOs
- Mappers ensure type safety between layers

### Challenge 3: Testing Astro Routes

**Solution**:

- Create test utilities that mock Astro context
- Or use Vitest with Astro testing utilities
- Inject in-memory repositories in test contexts

### Challenge 4: Async Repository Creation

**Solution**:

- Repositories are created synchronously in middleware
- Lazy initialization if needed
- Cache instances per request

## Migration Strategy

1. **Phase 1**: Create interfaces and SQL implementations
2. **Phase 2**: Refactor existing code to use repositories
3. **Phase 3**: Add in-memory implementations
4. **Phase 4**: Write tests using in-memory repos
5. **Phase 5**: Gradually move business logic to domain layer

## Alternative Approaches Considered

### 1. Service Locator Pattern

- Simpler but less explicit dependencies
- Harder to test (hidden dependencies)

### 2. Full DI Container (InversifyJS, TSyringe)

- More powerful but heavier
- Overkill for Astro's use case

### 3. Context Prop Drilling

- Simple but verbose
- Doesn't scale well

## Recommendations

1. **Start Simple**: Begin with factory pattern, not full DI container
2. **Gradual Migration**: Don't refactor everything at once
3. **Focus on High-Value Areas**: Events and Families are core, start there
4. **Test-Driven**: Write tests using in-memory repos as you build
5. **Document Patterns**: Create examples for team consistency

## Testing Strategy

### Unit Tests

- Test domain entities and business logic
- Use in-memory repositories
- Fast, no external dependencies

### Integration Tests

- Test repository implementations
- SQL repository integration tests with test database
- In-memory repository contract tests

### E2E Tests

- Test API routes with test context
- Can use either repository implementation
- Verify full request/response flow

## Performance Considerations

1. **Repository Creation**: Middleware creates repos once per request (minimal overhead)
2. **Connection Pooling**: Supabase client handles pooling (no change)
3. **Memory Usage**: In-memory repos cleared after tests
4. **Caching**: Can add caching layer in repository implementations if needed

## Security Considerations

1. **RLS**: Supabase Row Level Security still applies (repository layer doesn't bypass)
2. **Input Validation**: DTOs validate all inputs via Zod
3. **Type Safety**: Prevents common injection vulnerabilities
