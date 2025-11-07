# EventService Refactoring Plan

## Current Issues

### 1. **Code Duplication**

- Participant validation logic repeated in `createEvent`, `updateEvent`, and `validateEvent`
- Conflict checking logic duplicated in `createEvent` and `updateEvent`
- Scope validation repeated in `updateEvent` and `deleteEvent`
- Synced event checks duplicated

### 2. **Violation of Single Responsibility Principle**

- `EventService` is doing too much:
  - Validation logic
  - Business rule enforcement
  - Repository orchestration
  - DTO mapping
  - Audit logging

### 3. **Long Methods**

- `createEvent`: ~90 lines
- `updateEvent`: ~145 lines
- `deleteEvent`: ~75 lines
- Hard to test individual pieces of logic

### 4. **Mixed Concerns**

- Domain logic (validation, business rules) mixed with infrastructure concerns (logging, repository calls)
- Hard to test business logic in isolation

### 5. **Poor Readability**

- Deeply nested conditionals
- Business rules scattered throughout service methods
- Hard to understand the "why" behind certain validations

## Proposed Solution: Domain Entity Pattern

### Architecture Overview

```
src/domain/
├── entities/
│   └── Event.ts          # Domain entity with static validation/business logic methods
├── errors.ts             # (existing)
└── result.ts             # (existing)

src/services/
└── EventService.ts       # Orchestration layer (simplified)
```

### Benefits

1. **Separation of Concerns**
   - Domain logic in `Event` entity
   - Service focuses on orchestration and coordination

2. **Testability**
   - Domain logic can be tested without repositories
   - Business rules are explicit and isolated

3. **Reusability**
   - Validation logic can be reused across different contexts
   - Business rules are centralized

4. **Maintainability**
   - Changes to business rules happen in one place
   - Easier to understand and modify

5. **Follows DDD Principles**
   - Domain entities contain business logic
   - Services coordinate between domain and infrastructure

## Refactoring Plan

### Phase 1: Create Event Domain Entity

**File:** `src/domain/entities/Event.ts`

#### Static Methods to Extract:

1. **`validateParticipants()`**
   - Input: `familyId`, `participants`, `familyMembers`, `children`
   - Returns: `Result<void, ValidationError>`
   - Logic: Check if participants exist in family

2. **`validateScope()`**
   - Input: `scope`, `recurrencePattern`, `occurrenceDate`
   - Returns: `Result<void, ValidationError>`
   - Logic: Validate scope usage for recurring events

3. **`validateTimeRange()`**
   - Input: `startTime`, `endTime`
   - Returns: `Result<void, ValidationError>`
   - Logic: Ensure end time is after start time

4. **`validateSyncedEventModification()`**
   - Input: `isSynced`, `operation` (update/delete)
   - Returns: `Result<void, ForbiddenError>`
   - Logic: Prevent modification of synced events

5. **`checkConflicts()`** (business logic wrapper)
   - Input: `eventType`, `conflicts` array
   - Returns: `Result<void, ConflictError>`
   - Logic: Convert conflicts to ConflictError if blocker event

6. **`canModify()`**
   - Input: `event`, `userId`, `isMember`
   - Returns: `Result<void, DomainError>`
   - Logic: Combined authorization check (member + not synced)

### Phase 2: Create Event Validator Helper

**File:** `src/domain/entities/EventValidator.ts` (optional, if Event class gets too large)

Alternative: Keep all validation in `Event` class as static methods.

### Phase 3: Refactor EventService

**Changes:**

1. **Extract participant validation**

   ```typescript
   // Before
   if (command.participants && command.participants.length > 0) {
     const validationResult = await this.validateParticipants(...);
     // ...
   }

   // After
   if (command.participants && command.participants.length > 0) {
     const members = await this.familyRepo.getFamilyMembers(familyId);
     const children = await this.childRepo.findByFamilyId(familyId);
     const validationResult = Event.validateParticipants(
       familyId,
       command.participants,
       members,
       children
     );
     if (!validationResult.success) return validationResult;
   }
   ```

2. **Extract scope validation**

   ```typescript
   // Before
   if (scope === "this" && !event.recurrence_pattern) {
     return err(new ValidationError(...));
   }

   // After
   const scopeValidation = Event.validateScope(scope, event.recurrence_pattern, occurrenceDate);
   if (!scopeValidation.success) return scopeValidation;
   ```

3. **Extract conflict checking**

   ```typescript
   // Before
   if (command.event_type === "blocker") {
     const conflicts = await this.eventRepo.checkConflicts(...);
     if (conflicts.length > 0) {
       return err(new ConflictError(...));
     }
   }

   // After
   if (command.event_type === "blocker") {
     const conflicts = await this.eventRepo.checkConflicts(...);
     const conflictResult = Event.checkConflicts("blocker", conflicts);
     if (!conflictResult.success) return conflictResult;
   }
   ```

4. **Extract authorization checks**

   ```typescript
   // Before
   const isMember = await this.familyRepo.isUserMember(event.family_id, userId);
   if (!isMember) {
     return err(new ForbiddenError(...));
   }
   if (event.is_synced) {
     return err(new ForbiddenError(...));
   }

   // After
   const isMember = await this.familyRepo.isUserMember(event.family_id, userId);
   const canModifyResult = Event.canModify(event, userId, isMember);
   if (!canModifyResult.success) return canModifyResult;
   ```

### Phase 4: Simplify Service Methods

**After refactoring, service methods should:**

1. **Load required data** (from repositories)
2. **Call domain validation** (Event static methods)
3. **Call repository operations** (if validation passes)
4. **Map to DTOs** (for responses)
5. **Handle logging** (infrastructure concern)

**Example - Simplified `createEvent`:**

```typescript
async createEvent(command: CreateEventCommand, userId: string): Promise<Result<CreateEventResponseDTO, DomainError>> {
  // 1. Load data
  const isMember = await this.familyRepo.isUserMember(command.family_id, userId);
  if (!isMember) {
    return err(new ForbiddenError("You do not have access to this family"));
  }

  // 2. Validate participants (if provided)
  if (command.participants && command.participants.length > 0) {
    const members = await this.familyRepo.getFamilyMembers(command.family_id);
    const children = await this.childRepo.findByFamilyId(command.family_id);
    const participantValidation = Event.validateParticipants(
      command.family_id,
      command.participants,
      members,
      children
    );
    if (!participantValidation.success) return participantValidation;
  }

  // 3. Check conflicts (if blocker event)
  if (command.event_type === "blocker") {
    const conflicts = await this.eventRepo.checkConflicts(
      command.family_id,
      command.start_time,
      command.end_time,
      command.participants ?? [],
      undefined
    );
    const conflictResult = Event.checkConflicts("blocker", conflicts);
    if (!conflictResult.success) return conflictResult;
  }

  // 4. Create event
  try {
    const event = await this.eventRepo.create({
      title: command.title,
      start_time: command.start_time,
      end_time: command.end_time,
      family_id: command.family_id,
      event_type: command.event_type ?? "elastic",
      is_all_day: command.is_all_day ?? false,
      recurrence_pattern: command.recurrence_pattern ?? null,
      participants: command.participants,
    });

    const participants = await this.eventRepo.getParticipants(event.id);

    // 5. Log (non-blocking)
    this.logRepo.create({...}).catch(console.error);

    // 6. Map to DTO
    return ok(this.mapToCreateResponseDTO(event, participants));
  } catch (error) {
    console.error("Error in EventService.createEvent:", error);
    return err(new DomainError(500, "Failed to create event"));
  }
}
```

## Implementation Steps

### Step 1: Create Domain Entity Structure

1. Create `src/domain/entities/` directory
2. Create `src/domain/entities/Event.ts`
3. Add static validation methods one by one
4. Write unit tests for each validation method

### Step 2: Extract Validation Logic

1. Move `validateParticipants` from EventService to Event
2. Move scope validation logic to Event
3. Move time validation logic to Event
4. Move synced event checks to Event

### Step 3: Extract Business Logic

1. Move conflict checking logic to Event
2. Create `canModify` helper method
3. Extract DTO mapping to separate methods (if needed)

### Step 4: Refactor EventService

1. Update `createEvent` to use Event static methods
2. Update `updateEvent` to use Event static methods
3. Update `deleteEvent` to use Event static methods
4. Update `validateEvent` to use Event static methods

### Step 5: Testing

1. Unit tests for Event static methods (no dependencies)
2. Integration tests for EventService (with repositories)
3. Ensure all existing tests still pass

### Step 6: Cleanup

1. Remove duplicate code
2. Extract helper methods for DTO mapping if needed
3. Review and simplify service methods

## Code Structure After Refactoring

### Event Domain Entity

```typescript
// src/domain/entities/Event.ts
import type { Result } from "@/domain/result";
import { ok, err } from "@/domain/result";
import { ValidationError, ForbiddenError, ConflictError } from "@/domain/errors";
import type { ParticipantReferenceDTO, ConflictingEventDTO } from "@/types";

export class Event {
  static validateParticipants(
    familyId: string,
    participants: ParticipantReferenceDTO[],
    familyMembers: Array<{ user_id: string }>,
    children: Array<{ id: string }>
  ): Result<void, ValidationError> {
    const memberIds = new Set(familyMembers.map((m) => m.user_id));
    const childIds = new Set(children.map((c) => c.id));

    for (const participant of participants) {
      if (participant.type === "user") {
        if (!memberIds.has(participant.id)) {
          return err(
            new ValidationError(`Participant ${participant.id} not found in family`, {
              participants: "invalid",
            })
          );
        }
      } else if (participant.type === "child") {
        if (!childIds.has(participant.id)) {
          return err(
            new ValidationError(`Participant ${participant.id} not found in family`, {
              participants: "invalid",
            })
          );
        }
      }
    }

    return ok(undefined);
  }

  static validateScope(
    scope: "this" | "future" | "all",
    recurrencePattern: unknown,
    occurrenceDate: string | undefined
  ): Result<void, ValidationError> {
    if (scope === "this" && !recurrencePattern) {
      return err(new ValidationError("Scope 'this' can only be used for recurring events", { scope: "invalid" }));
    }

    if (scope === "this" && !occurrenceDate) {
      return err(
        new ValidationError("Date parameter required for scope='this' on recurring events", {
          date: "required",
        })
      );
    }

    return ok(undefined);
  }

  static validateSyncedEventModification(
    isSynced: boolean,
    operation: "update" | "delete"
  ): Result<void, ForbiddenError> {
    if (isSynced) {
      return err(new ForbiddenError("Synced events cannot be modified"));
    }
    return ok(undefined);
  }

  static checkConflicts(
    eventType: "elastic" | "blocker",
    conflicts: Array<{ id: string; title: string; start_time: string; end_time: string; participants: unknown[] }>
  ): Result<void, ConflictError> {
    if (eventType === "blocker" && conflicts.length > 0) {
      const conflictingEvents: ConflictingEventDTO[] = conflicts.map((c) => ({
        id: c.id,
        title: c.title,
        start_time: c.start_time,
        end_time: c.end_time,
        participants: c.participants,
      }));

      return err(new ConflictError("This blocker event conflicts with an existing blocker event", conflictingEvents));
    }

    return ok(undefined);
  }

  static canModify(
    event: { is_synced: boolean; family_id: string },
    userId: string,
    isMember: boolean
  ): Result<void, ForbiddenError> {
    if (!isMember) {
      return err(new ForbiddenError("You do not have access to this event"));
    }

    if (event.is_synced) {
      return err(new ForbiddenError("Synced events cannot be modified"));
    }

    return ok(undefined);
  }
}
```

### Simplified EventService

```typescript
// Key improvements:
// - Shorter methods
// - Clear separation: load → validate → execute → map → log
// - Business logic delegated to Event domain entity
// - Easier to test and maintain
```

## Benefits Summary

1. **Clean Code Principles**
   - ✅ Single Responsibility: Event handles domain logic, Service handles orchestration
   - ✅ DRY: No code duplication
   - ✅ KISS: Simpler, focused methods
   - ✅ Testability: Domain logic testable without infrastructure

2. **Maintainability**
   - Business rules in one place
   - Easier to understand and modify
   - Changes to validation logic don't affect service orchestration

3. **Testability**
   - Domain logic can be unit tested without mocks
   - Service tests focus on orchestration
   - Business rules are explicit and isolated

4. **Alignment with Project Rules**
   - ✅ Follows clean code guidelines
   - ✅ Uses early returns and guard clauses
   - ✅ Avoids unnecessary else statements
   - ✅ Code is self-documenting

## Migration Strategy

1. **Incremental Refactoring**
   - Extract one method at a time
   - Write tests for extracted method
   - Update service to use extracted method
   - Verify tests pass

2. **Backward Compatibility**
   - Keep service methods working during refactoring
   - Don't break existing functionality
   - Run tests after each step

3. **Documentation**
   - Update implementation plans
   - Document new domain entity pattern
   - Add examples of usage

## Estimated Impact

- **Lines of Code Reduction**: ~150-200 lines in EventService
- **Test Coverage**: Improved (domain logic easier to test)
- **Maintainability**: Significantly improved
- **Code Quality**: Better adherence to SOLID principles

## Next Steps

1. Review and approve this plan
2. Create Event domain entity with first validation method
3. Write tests for Event domain entity
4. Refactor EventService incrementally
5. Update documentation
