# Supabase Astro Setup Validation

This document validates the proposed Supabase initialization recipe against the project's hexagonal architecture and implementation patterns.

## Prerequisites Status

✅ **INSTALLED**: `@supabase/supabase-js` package is installed in `package.json` (v2.78.0)

✅ **EXISTS**: `supabase/config.toml` exists

✅ **EXISTS**: `src/db/database.types.ts` exists with proper type definitions

✅ **CONFIGURED**: TypeScript path aliases configured (`@/*` maps to `./src/*`)

## Architecture Alignment Analysis

### ❌ Critical Issue: Direct Supabase Client Exposure

**Problem**: The proposed setup exposes the Supabase client directly on `context.locals.supabase`, which violates the hexagonal architecture pattern.

**Current Architecture Pattern** (from `implementation.md` and `hexagonal-architecture-proposal.md`):

- Routes should use **repository interfaces**, not direct database clients
- The Supabase client should be **internal to repository implementations**
- Middleware should inject **repositories**, not infrastructure clients

**Proposed Pattern**:

```typescript
// Routes access Supabase directly
const { data } = await context.locals.supabase.from("families").select();
```

**Required Pattern** (with destructuring for shorter access):

```typescript
// Routes access repositories (destructure for shorter syntax)
const { family, event, user: userRepo } = context.locals.repositories;
const families = await family.findByUserId(userId);

// Or for single use cases:
const families = await context.locals.repositories.family.findByUserId(userId);
```

**Note**: Destructuring at the top of route handlers reduces nesting chains while maintaining type safety and architectural boundaries.

### Issues with Proposed Setup

1. **Violates Dependency Inversion Principle**: Routes would depend on infrastructure (Supabase) instead of domain abstractions (repositories)

2. **Makes Testing Difficult**: Can't easily swap to in-memory repositories for tests

3. **Bypasses Business Logic**: Routes could bypass service layer and repository interfaces

4. **No Authentication Integration**: The recipe doesn't include user authentication from Supabase Auth

## Recommended Setup (Aligned with Architecture)

### 1. Supabase Client Initialization

✅ **KEEP**: The proposed `src/db/supabase.client.ts` is correct, but should be used **internally** by repositories, not exposed directly.

```typescript
// src/db/supabase.client.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Export for use in repository implementations
export function createSupabaseClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}
```

### 2. Middleware Setup (Modified)

❌ **REJECT**: The proposed middleware adds Supabase client directly.

✅ **USE**: Middleware should:

1. Create Supabase client (for auth and repositories)
2. Extract authenticated user from Supabase Auth
3. Create repositories using factory pattern
4. Inject repositories (and user) into `context.locals`

```typescript
// src/middleware/index.ts
import { defineMiddleware } from "astro:middleware";
import { createSupabaseClient } from "../db/supabase.client.ts";
import { createRepositories } from "../repositories/factory.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  // Determine if we should use in-memory or SQL repositories
  const useInMemory = import.meta.env.USE_IN_MEMORY_DB === "true" || import.meta.env.MODE === "test";

  let supabase: ReturnType<typeof createSupabaseClient> | undefined;
  let user: import("@supabase/supabase-js").User | null = null;

  // Only create Supabase client if we're using SQL repositories
  // (in-memory repos don't need Supabase)
  if (!useInMemory) {
    supabase = createSupabaseClient();

    // Extract authenticated user (for authorization)
    // Only available when using Supabase
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  }

  // Factory automatically switches between SQL (Supabase) and in-memory
  // Based on environment or explicit configuration
  const repositories = createRepositories(supabase);

  // Inject repositories and user into context
  // Routes don't know if they're using SQL or in-memory repositories!
  context.locals.repositories = repositories;
  context.locals.user = user;

  return next();
});
```

**How Switching Works**:

1. **Production/Dev**: Middleware creates Supabase client → Factory returns SQL repositories → Routes use Supabase
2. **Test Mode**: Middleware skips Supabase → Factory returns in-memory repositories → Routes use in-memory
3. **Explicit Override**: Set `USE_IN_MEMORY_DB=true` to force in-memory even in dev/prod

### 3. TypeScript Environment Definitions (Modified)

❌ **REJECT**: Proposed types expose Supabase client directly.

✅ **USE**: Types should expose repositories and user:

```typescript
// src/env.d.ts
/// <reference types="astro/client" />
import type { User } from "@supabase/supabase-js";
import type { FamilyRepository, EventRepository, UserRepository } from "./repositories/interfaces/index.ts";

declare global {
  namespace App {
    interface Locals {
      repositories: {
        family: FamilyRepository;
        event: EventRepository;
        user: UserRepository;
      };
      user: User | null;
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

### 4. Repository Factory (Missing from Recipe) - **CRITICAL FOR REQUIREMENT**

The recipe doesn't include the repository factory, which is **essential** for your requirement: "Use Supabase but with abstraction to switch between SQL repo and in-memory repo".

**Complete Factory Implementation with Switching Logic**:

```typescript
// src/repositories/factory.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types.ts";

// SQL implementations (use Supabase)
import { SQLFamilyRepository } from "./implementations/sql/SQLFamilyRepository.ts";
import { SQLEventRepository } from "./implementations/sql/SQLEventRepository.ts";
import { SQLUserRepository } from "./implementations/sql/SQLUserRepository.ts";

// In-memory implementations (for testing)
import { InMemoryFamilyRepository } from "./implementations/in-memory/InMemoryFamilyRepository.ts";
import { InMemoryEventRepository } from "./implementations/in-memory/InMemoryEventRepository.ts";
import { InMemoryUserRepository } from "./implementations/in-memory/InMemoryUserRepository.ts";

// Repository interfaces type
import type { FamilyRepository, EventRepository, UserRepository } from "./interfaces/index.ts";

export type Repositories = {
  family: FamilyRepository;
  event: EventRepository;
  user: UserRepository;
};

/**
 * Create SQL repositories using Supabase client.
 * Used in production and when connecting to real Supabase database.
 */
export function createSQLRepositories(supabase: SupabaseClient<Database>): Repositories {
  return {
    family: new SQLFamilyRepository(supabase),
    event: new SQLEventRepository(supabase),
    user: new SQLUserRepository(supabase),
  };
}

/**
 * Create in-memory repositories for testing.
 * Fast, isolated, no database dependency.
 */
export function createInMemoryRepositories(): Repositories {
  return {
    family: new InMemoryFamilyRepository(),
    event: new InMemoryEventRepository(),
    user: new InMemoryUserRepository(),
  };
}

/**
 * Main factory function - automatically switches based on environment.
 *
 * Strategy: Environment-based switching
 * - Production/dev: Uses Supabase (SQL repositories)
 * - Test mode: Uses in-memory repositories
 *
 * Can be overridden via environment variable for explicit control.
 */
export function createRepositories(supabase?: SupabaseClient<Database>): Repositories {
  // Option 1: Explicit environment variable override
  const useInMemory = import.meta.env.USE_IN_MEMORY_DB === "true";

  // Option 2: Automatic based on Astro mode
  const isTestMode = import.meta.env.MODE === "test";

  // Use in-memory if explicitly set OR in test mode
  if (useInMemory || isTestMode) {
    return createInMemoryRepositories();
  }

  // Default: Use Supabase (SQL repositories)
  if (!supabase) {
    throw new Error(
      "Supabase client is required for SQL repositories. " + "Provide supabase client or set USE_IN_MEMORY_DB=true"
    );
  }

  return createSQLRepositories(supabase);
}
```

**Key Points**:

- ✅ **Uses Supabase** in production (via `createSQLRepositories`)
- ✅ **Switches to in-memory** automatically in test mode
- ✅ **Can be explicitly controlled** via `USE_IN_MEMORY_DB` env variable
- ✅ **Same interface** - routes don't know which implementation is used
- ✅ **Type-safe** - all repositories implement the same interfaces

## Required Components Not in Recipe

1. **Repository Factory** (`src/repositories/factory.ts`)
2. **Repository Interfaces** (`src/repositories/interfaces/`)
3. **SQL Repository Implementations** (`src/repositories/implementations/sql/`)
4. **User Authentication Extraction** (from Supabase Auth)

## Validation Summary

| Component          | Recipe Status | Architecture Alignment     | Action Required                |
| ------------------ | ------------- | -------------------------- | ------------------------------ |
| Supabase Client    | ✅ Proposed   | ⚠️ Needs internal use only | Modify to not expose directly  |
| Middleware         | ❌ Proposed   | ❌ Violates architecture   | Rewrite to inject repositories |
| TypeScript Types   | ❌ Proposed   | ❌ Wrong structure         | Update to include repositories |
| Repository Factory | ❌ Missing    | ❌ Critical component      | Add factory pattern            |
| Authentication     | ❌ Missing    | ❌ Required for routes     | Add user extraction            |

## Repository Access Pattern (Reducing Nesting)

To reduce nesting chains in routes, use destructuring:

```typescript
// src/pages/api/families/index.ts
import type { APIContext } from "astro";

export async function GET({ locals }: APIContext) {
  // Destructure repositories at the top for shorter access
  const { family, event } = locals.repositories;

  // Now use shorter syntax instead of locals.repositories.family.findByUserId()
  const families = await family.findByUserId(locals.user?.id ?? "");
  return new Response(JSON.stringify(families));
}

// Example with service layer (from implementation.md pattern)
export async function POST({ request, locals }: APIContext) {
  const { family } = locals.repositories; // Destructure once
  const familyService = new FamilyService(family); // Shorter!
  // ... rest of handler
}
```

This pattern:

- ✅ Maintains architectural boundaries (still using repositories)
- ✅ Reduces nesting chains (`family.findByUserId()` vs `locals.repositories.family.findByUserId()`)
- ✅ Keeps type safety
- ✅ Works well with TypeScript autocomplete

Alternative patterns:

- For single use: `await locals.repositories.family.findById(id)`
- For multiple repos: Destructure at the top
- For cleaner code: Extract to a helper: `const repos = locals.repositories;`

## Recommended Action Plan

1. ✅ **Dependency installed**: `@supabase/supabase-js` is already installed

2. **Create Supabase client** (keep recipe, but mark as internal)

3. **Create repository factory** (not in recipe, but required)

4. **Create repository interfaces** (not in recipe, but required)

5. **Create SQL repository implementations** (not in recipe, but required)

6. **Update middleware** to inject repositories instead of Supabase client

7. **Update TypeScript types** to include repositories structure

8. **Add authentication** extraction from Supabase Auth

## Requirement Validation: Supabase with SQL/In-Memory Abstraction

**Your Requirement**: "Use Supabase but with abstraction to switch between SQL repo and in-memory repo - must have"

✅ **REQUIREMENT MET** with the proposed architecture:

1. **Uses Supabase**: SQL repositories (`SQLFamilyRepository`, etc.) use Supabase client internally
2. **Full Abstraction**: Routes use repository interfaces, not Supabase directly
3. **Switching Mechanism**: Factory pattern automatically switches based on:
   - Environment mode (test vs production)
   - Explicit configuration (`USE_IN_MEMORY_DB` env variable)
4. **Same Interface**: Both SQL and in-memory implementations implement the same interfaces
5. **No Code Changes**: Routes work identically regardless of which implementation is used

**Example Usage**:

```typescript
// This code works with BOTH SQL (Supabase) and in-memory repositories
export async function GET({ locals }: APIContext) {
  const { family } = locals.repositories; // Could be SQL or in-memory!
  const families = await family.findByUserId(userId);
  return new Response(JSON.stringify(families));
}
```

**Switching Examples**:

- **Production**: `import.meta.env.MODE !== "test"` → Uses Supabase (SQL)
- **Testing**: `import.meta.env.MODE === "test"` → Uses in-memory
- **Manual Override**: `USE_IN_MEMORY_DB=true` → Forces in-memory

## Conclusion

The proposed recipe provides a basic Supabase integration but **does not align** with the project's hexagonal architecture. It would create technical debt by exposing infrastructure concerns directly to routes.

**Recommendation**: Use the recipe as a starting point, but modify it to:

- ✅ Keep Supabase client creation internal (used by SQL repositories only)
- ✅ Add repository factory pattern **with switching logic** (critical for your requirement)
- ✅ Inject repositories (not Supabase client) via middleware
- ✅ Include user authentication extraction
- ✅ Enable automatic switching between Supabase (SQL) and in-memory repositories

This maintains the architectural boundaries, **meets your requirement for abstraction**, and enables testability with in-memory repositories while using Supabase in production.
