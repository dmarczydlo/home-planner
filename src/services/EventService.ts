import type { Result } from "@/domain/result";
import { ok, err } from "@/domain/result";
import { DomainError } from "@/domain/errors";
import { Event } from "@/domain/entities/Event";
import type { FamilyRepository } from "@/repositories/interfaces/FamilyRepository";
import type { EventRepository } from "@/repositories/interfaces/EventRepository";
import type { LogRepository } from "@/repositories/interfaces/LogRepository";
import { EventMapper } from "@/lib/mappers/EventMapper";
import { EventAuthorization } from "@/lib/authorization/EventAuthorization";
import { ParticipantService } from "@/lib/participants/ParticipantService";
import { EventScopeHandler } from "@/lib/event/EventScopeHandler";
import type {
  CreateEventCommand,
  UpdateEventCommand,
  ValidateEventCommand,
  CreateEventResponseDTO,
  UpdateEventResponseDTO,
  EventDetailsDTO,
  ListEventsResponseDTO,
  ValidationResultDTO,
  EventWithParticipantsDTO,
  ConflictingEventDTO,
} from "@/types";

export class EventService {
  constructor(
    private readonly familyRepo: FamilyRepository,
    private readonly eventsRepo: EventRepository,
    private readonly logRepo: LogRepository
  ) {}

  async listEvents(
    familyId: string,
    startDate: string,
    endDate: string,
    options: {
      participantIds?: string[];
      eventType?: "elastic" | "blocker";
      includeSynced?: boolean;
      limit?: number;
      offset?: number;
    },
    userId: string
  ): Promise<Result<ListEventsResponseDTO, DomainError>> {
    const family = await this.familyRepo.findById(familyId);
    const accessResult = EventAuthorization.checkFamilyAccess(family, familyId, userId);
    if (!accessResult.success) {
      return accessResult;
    }

    try {
      const limit = Math.min(options.limit ?? 100, 100);
      const offset = Math.max(options.offset ?? 0, 0);

      const result = await this.eventsRepo.findByDateRange({
        familyId,
        startDate,
        endDate,
        participantIds: options.participantIds,
        eventType: options.eventType,
        includeSynced: options.includeSynced ?? true,
        limit: options.limit ?? 100,
        offset: options.offset ?? 0,
      });

      const events = result.events.map(EventMapper.toListDTO);

      return ok({
        events,
        pagination: {
          total: result.total,
          limit,
          offset,
          has_more: offset + events.length < result.total,
        },
      });
    } catch (error) {
      console.error("Error in EventService.listEvents:", error);
      return err(new DomainError(500, "Failed to retrieve events"));
    }
  }

  async getEventById(
    familyId: string,
    eventId: string,
    occurrenceDate: string | undefined,
    userId: string
  ): Promise<Result<EventDetailsDTO, DomainError>> {
    const family = await this.familyRepo.findById(familyId);
    const accessResult = EventAuthorization.checkFamilyAccess(family, familyId, userId);
    if (!accessResult.success) {
      return accessResult;
    }

    try {
      const eventDetails = await this.eventsRepo.findByIdWithDetails(eventId, occurrenceDate);
      const eventAccessResult = EventAuthorization.checkEventBelongsToFamily(eventDetails, familyId, eventId);
      if (!eventAccessResult.success) {
        return eventAccessResult;
      }

      return ok(EventMapper.toDetailsDTO(eventAccessResult.data));
    } catch (error) {
      console.error("Error in EventService.getEventById:", error);
      return err(new DomainError(500, "Failed to retrieve event"));
    }
  }

  async createEvent(command: CreateEventCommand, userId: string): Promise<Result<CreateEventResponseDTO, DomainError>> {
    const family = await this.familyRepo.findById(command.family_id);
    const accessResult = EventAuthorization.checkFamilyAccess(family, command.family_id, userId);
    if (!accessResult.success) {
      return accessResult;
    }

    try {
      if (command.participants && command.participants.length > 0) {
        const validationResult = ParticipantService.validateParticipants(accessResult.data, command.participants);
        if (!validationResult.success) {
          return validationResult;
        }
      }

      if (command.event_type === "blocker") {
        const conflicts = await this.eventsRepo.checkConflicts(
          command.family_id,
          command.start_time,
          command.end_time,
          command.participants ?? [],
          undefined
        );
        const conflictResult = Event.checkConflicts("blocker", conflicts);
        if (!conflictResult.success) {
          return conflictResult;
        }
      }

      const eventId = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const participants = ParticipantService.buildParticipants(accessResult.data, command.participants ?? []);

      const event = Event.create(
        eventId,
        command.family_id,
        command.title,
        command.start_time,
        command.end_time,
        command.event_type ?? "elastic",
        command.is_all_day ?? false,
        createdAt,
        command.recurrence_pattern ?? null,
        false,
        null,
        null,
        participants,
        []
      );

      await this.eventsRepo.store(event);

      this.logRepo
        .create({
          family_id: command.family_id,
          actor_id: userId,
          actor_type: "user",
          action: "event.create",
          details: {
            event_id: event.id,
            title: event.title,
            event_type: event.eventType,
          },
        })
        .catch((error) => {
          console.error("Failed to log event.create:", error);
        });

      return ok(EventMapper.toCreateResponseDTO(event));
    } catch (error) {
      console.error("Error in EventService.createEvent:", error);
      return err(new DomainError(500, "Failed to create event"));
    }
  }

  async updateEvent(
    familyId: string,
    eventId: string,
    command: UpdateEventCommand,
    scope: "this" | "future" | "all",
    occurrenceDate: string | undefined,
    userId: string
  ): Promise<Result<UpdateEventResponseDTO, DomainError>> {
    const family = await this.familyRepo.findById(familyId);
    const accessResult = EventAuthorization.checkFamilyAccess(family, familyId, userId);
    if (!accessResult.success) {
      return accessResult;
    }

    const eventDetails = await this.eventsRepo.findByIdWithDetails(eventId);
    const eventAccessResult = EventAuthorization.checkEventBelongsToFamily(eventDetails, familyId, eventId);
    if (!eventAccessResult.success) {
      return eventAccessResult;
    }

    const event = EventMapper.fromRepositoryDetails(eventAccessResult.data);

    const canModifyResult = event.canModify(true);
    if (!canModifyResult.success) {
      return canModifyResult;
    }

    const scopeValidation = Event.validateScope(scope, event.recurrencePattern, occurrenceDate);
    if (!scopeValidation.success) {
      return scopeValidation;
    }

    if (command.participants && command.participants.length > 0) {
      const validationResult = ParticipantService.validateParticipants(accessResult.data, command.participants);
      if (!validationResult.success) {
        return validationResult;
      }
    }

    if (command.event_type === "blocker" || event.eventType === "blocker") {
      const startTime = command.start_time ?? event.startTime;
      const endTime = command.end_time ?? event.endTime;
      const participants = command.participants ?? event.participants.map((p) => ({ id: p.id, type: p.type }));

      const conflicts = await this.eventsRepo.checkConflicts(familyId, startTime, endTime, participants, eventId);
      const eventType = command.event_type ?? event.eventType;
      const conflictResult = Event.checkConflicts(eventType, conflicts);
      if (!conflictResult.success) {
        return conflictResult;
      }
    }

    try {
      const scopeResult = await EventScopeHandler.handleUpdateScope(
        event,
        command,
        scope,
        occurrenceDate,
        accessResult.data,
        this.eventsRepo
      );
      if (!scopeResult.success) {
        return scopeResult;
      }

      const updatedEventDetails = await this.eventsRepo.findByIdWithDetails(eventId);
      if (!updatedEventDetails) {
        return err(new DomainError(500, "Failed to retrieve updated event"));
      }

      this.logRepo
        .create({
          family_id: familyId,
          actor_id: userId,
          actor_type: "user",
          action: "event.update",
          details: {
            event_id: eventId,
            title: updatedEventDetails.title,
            event_type: updatedEventDetails.event_type,
            scope,
          },
        })
        .catch((error) => {
          console.error("Failed to log event.update:", error);
        });

      return ok(EventMapper.toUpdateResponseDTO(updatedEventDetails, scopeResult.data.exceptionCreated));
    } catch (error) {
      console.error("Error in EventService.updateEvent:", error);
      return err(new DomainError(500, "Failed to update event"));
    }
  }

  async deleteEvent(
    familyId: string,
    eventId: string,
    scope: "this" | "future" | "all",
    occurrenceDate: string | undefined,
    userId: string
  ): Promise<Result<void, DomainError>> {
    const family = await this.familyRepo.findById(familyId);
    const accessResult = EventAuthorization.checkFamilyAccess(family, familyId, userId);
    if (!accessResult.success) {
      return accessResult;
    }

    const eventDetails = await this.eventsRepo.findByIdWithDetails(eventId);
    const eventAccessResult = EventAuthorization.checkEventBelongsToFamily(eventDetails, familyId, eventId);
    if (!eventAccessResult.success) {
      return eventAccessResult;
    }

    const event = EventMapper.fromRepositoryDetails(eventAccessResult.data);

    const canModifyResult = event.canModify(true);
    if (!canModifyResult.success) {
      return canModifyResult;
    }

    const scopeValidation = Event.validateScope(scope, event.recurrencePattern, occurrenceDate);
    if (!scopeValidation.success) {
      return scopeValidation;
    }

    try {
      const deleteResult = await EventScopeHandler.handleDeleteScope(event, scope, occurrenceDate, this.eventsRepo);
      if (!deleteResult.success) {
        return deleteResult;
      }

      this.logRepo
        .create({
          family_id: familyId,
          actor_id: userId,
          actor_type: "user",
          action: "event.delete",
          details: {
            event_id: eventId,
            title: event.title,
            event_type: event.eventType,
            scope,
          },
        })
        .catch((error) => {
          console.error("Failed to log event.delete:", error);
        });

      return ok(undefined);
    } catch (error) {
      console.error("Error in EventService.deleteEvent:", error);
      return err(new DomainError(500, "Failed to delete event"));
    }
  }

  async validateEvent(
    command: ValidateEventCommand,
    userId: string
  ): Promise<Result<ValidationResultDTO, DomainError>> {
    const family = await this.familyRepo.findById(command.family_id);
    const accessResult = EventAuthorization.checkFamilyAccess(family, command.family_id, userId);
    if (!accessResult.success) {
      return accessResult;
    }

    const errors: Array<{ field: string; message: string }> = [];
    let conflicts: ConflictingEventDTO[] = [];

    if (command.participants && command.participants.length > 0) {
      const validationResult = ParticipantService.validateParticipants(accessResult.data, command.participants);
      if (!validationResult.success) {
        return validationResult;
      }
    }

    if (command.event_type === "blocker") {
      const conflictResults = await this.eventsRepo.checkConflicts(
        command.family_id,
        command.start_time,
        command.end_time,
        command.participants ?? [],
        command.exclude_event_id
      );

      conflicts = conflictResults.map((c) => ({
        id: c.id,
        title: c.title,
        start_time: c.start_time,
        end_time: c.end_time,
        participants: c.participants,
      }));
    }

    return ok({
      valid: errors.length === 0 && conflicts.length === 0,
      errors,
      conflicts,
    });
  }
}
