# SRP Refactoring Plan

## Current Issues

### EventService.ts (605 lines) - Too Many Responsibilities:
1. **Authorization** - Family membership checks
2. **Event CRUD** - Create, Read, Update, Delete
3. **DTO Mapping** - Converting domain to DTOs
4. **Logging** - Audit logging
5. **Validation** - Event validation
6. **Conflict Checking** - Blocker event conflicts
7. **Scope Handling** - Recurring event scope logic
8. **Exception Handling** - Error handling

### Family.ts (330 lines) - Too Many Responsibilities:
1. **Member Management** - CRUD for members
2. **Child Management** - CRUD for children
3. **Event Management** - Event collection management
4. **Participant Building** - Converting refs to participants
5. **Participant Validation** - Validating participants belong to family
6. **DTO Conversion** - Converting to DTOs
7. **Event Creation** - Creating events with validation

## Refactoring Plan

### Extract from EventService:

1. **EventMapper** (`src/lib/mappers/EventMapper.ts`)
   - `toCreateResponseDTO(event: Event): CreateEventResponseDTO`
   - `toUpdateResponseDTO(event: EventDetails): UpdateEventResponseDTO`
   - `toDetailsDTO(event: EventDetails): EventDetailsDTO`
   - `toListDTO(event: EventWithParticipants): EventWithParticipantsDTO`
   - `fromRepositoryDetails(eventDetails: EventDetails): Event`

2. **EventAuthorization** (`src/lib/authorization/EventAuthorization.ts`)
   - `checkFamilyAccess(family: Family, userId: string): Result<void, ForbiddenError>`
   - `checkEventAccess(event: Event, family: Family, userId: string): Result<void, DomainError>`

3. **EventScopeHandler** (`src/lib/event/EventScopeHandler.ts`)
   - `handleUpdateScope(event: Event, command: UpdateEventCommand, scope: "this" | "future" | "all", occurrenceDate: string | undefined, family: Family, eventsRepo: EventRepository): Promise<Result<{ exceptionCreated: boolean }, DomainError>>`
   - `handleDeleteScope(event: Event, scope: "this" | "future" | "all", occurrenceDate: string | undefined, eventsRepo: EventRepository): Promise<Result<void, DomainError>>`

### Extract from Family:

1. **ParticipantService** (`src/lib/participants/ParticipantService.ts`)
   - `buildParticipants(family: Family, participantRefs: ParticipantReferenceDTO[]): EventParticipant[]`
   - `validateParticipants(family: Family, participantRefs: ParticipantReferenceDTO[]): Result<void, ValidationError>`

2. **FamilyDTOMapper** (`src/lib/mappers/FamilyDTOMapper.ts`)
   - `toMembersDTO(family: Family): FamilyMemberDTO[]`
   - `toChildrenDTO(family: Family): ChildDTO[]`
   - `toDetailsDTO(family: Family): FamilyDetailsDTO`

## Benefits

- **EventService**: ~200 lines (focused on orchestration)
- **Family**: ~200 lines (focused on domain logic)
- **Better testability**: Each class has single responsibility
- **Reusability**: Mappers and services can be reused
- **Maintainability**: Changes isolated to specific areas

