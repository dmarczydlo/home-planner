# DDD Refactoring Plan: Family as Aggregate Root

## Current Issues

1. **EventService bypasses Aggregate Root**: Calls non-existent methods on FamilyRepository (`getEventById`, `checkEventConflicts`, `storeEvent`, etc.)
2. **Mixed responsibilities**: EventService contains business logic that should be in domain entities
3. **Inconsistent patterns**: Some mutations go through Family, others bypass it
4. **Query vs Command confusion**: Queries and commands are mixed in the same service

## DDD Principles Applied

### Aggregate Root: Family
- **Family** is the aggregate root containing Events, Members, Children
- All mutations must go through Family aggregate
- Family ensures consistency and enforces business rules

### Domain Entities: Event
- **Event** is an entity within Family aggregate
- Contains event-specific validation and business rules
- Cannot exist without Family

### Service Layer: EventService
- **EventService** coordinates between repositories and aggregates
- For **Commands (Mutations)**: Load Family → Call Family methods → Save Family
- For **Queries (Views)**: Use repositories directly (CQRS pattern)

## Refactoring Plan

### Phase 1: Enhance Family Aggregate Root

Add mutation methods to Family:
- `updateEvent(eventId, updates, scope, occurrenceDate)` - Update event through aggregate
- `deleteEvent(eventId, scope, occurrenceDate)` - Delete event through aggregate
- `checkEventConflicts(startTime, endTime, participantRefs, excludeEventId?)` - Check conflicts using aggregate's events

### Phase 2: Refactor EventService - Commands

**createEvent:**
- Load Family aggregate
- Call `family.createEvent()`
- Call `family.addEvent(event)`
- Save Family aggregate
- Map to DTO

**updateEvent:**
- Load Family aggregate
- Get event from Family.events
- Call `family.updateEvent()` with updates
- Save Family aggregate
- Map to DTO

**deleteEvent:**
- Load Family aggregate
- Call `family.deleteEvent()`
- Save Family aggregate

**validateEvent:**
- Load Family aggregate
- Use `family.checkEventConflicts()` for conflict checking
- Use `family.validateEventParticipants()` for participant validation

### Phase 3: Keep Queries Direct (CQRS)

**listEvents:**
- Use `eventsRepo.findByDateRange()` directly (read model)
- No need to load full Family aggregate

**getEventById:**
- Use `eventsRepo.findByIdWithDetails()` directly (read model)
- Only check Family membership for authorization

## Benefits

1. **Consistency**: All mutations go through aggregate root
2. **Business Rules**: Enforced at domain level
3. **Performance**: Queries don't load unnecessary aggregate data
4. **Testability**: Domain logic isolated from infrastructure
5. **Maintainability**: Clear separation of concerns

