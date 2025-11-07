import type { Result } from "@/domain/result";
import { ok, err } from "@/domain/result";
import { NotFoundError, ForbiddenError, DomainError } from "@/domain/errors";
import { Event } from "@/domain/entities/Event";
import type { EventRepository } from "@/repositories/interfaces/EventRepository";
import type { FamilyRepository } from "@/repositories/interfaces/FamilyRepository";
import type { ChildRepository } from "@/repositories/interfaces/ChildRepository.ts";
import type { LogRepository } from "@/repositories/interfaces/LogRepository";
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
    private readonly eventRepo: EventRepository,
    private readonly familyRepo: FamilyRepository,
    private readonly childRepo: ChildRepository,
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
    const isMember = await this.familyRepo.isUserMember(familyId, userId);
    if (!isMember) {
      return err(new ForbiddenError("You do not have access to this family"));
    }

    try {
      const limit = Math.min(options.limit ?? 100, 100);
      const offset = Math.max(options.offset ?? 0, 0);

      const result = await this.eventRepo.findByDateRange({
        familyId,
        startDate,
        endDate,
        participantIds: options.participantIds,
        eventType: options.eventType,
        includeSynced: options.includeSynced ?? true,
        limit,
        offset,
      });

      const events: EventWithParticipantsDTO[] = result.events.map((e) => ({
        id: e.id,
        family_id: e.family_id,
        title: e.title,
        start_time: e.start_time,
        end_time: e.end_time,
        is_all_day: e.is_all_day,
        event_type: e.event_type,
        recurrence_pattern: e.recurrence_pattern ?? null,
        is_synced: e.is_synced ?? false,
        external_calendar_id: e.external_calendar_id ?? null,
        created_at: e.created_at,
        updated_at: e.updated_at ?? null,
        participants: e.participants,
        has_conflict: e.has_conflict ?? false,
      }));

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
    eventId: string,
    occurrenceDate: string | undefined,
    userId: string
  ): Promise<Result<EventDetailsDTO, DomainError>> {
    try {
      const event = await this.eventRepo.findByIdWithDetails(eventId, occurrenceDate);
      if (!event) {
        return err(new NotFoundError("Event", eventId));
      }

      const isMember = await this.familyRepo.isUserMember(event.family_id, userId);
      if (!isMember) {
        return err(new ForbiddenError("You do not have access to this event"));
      }

      return ok({
        id: event.id,
        family_id: event.family_id,
        title: event.title,
        start_time: event.start_time,
        end_time: event.end_time,
        is_all_day: event.is_all_day,
        event_type: event.event_type,
        recurrence_pattern: event.recurrence_pattern ?? null,
        is_synced: event.is_synced ?? false,
        external_calendar_id: event.external_calendar_id ?? null,
        created_at: event.created_at,
        updated_at: event.updated_at ?? null,
        participants: event.participants,
        exceptions: event.exceptions.map((ex) => ({
          id: ex.id,
          original_date: ex.original_date,
          new_start_time: ex.new_start_time,
          new_end_time: ex.new_end_time,
          is_cancelled: ex.is_cancelled,
        })),
      });
    } catch (error) {
      console.error("Error in EventService.getEventById:", error);
      return err(new DomainError(500, "Failed to retrieve event"));
    }
  }

  async createEvent(command: CreateEventCommand, userId: string): Promise<Result<CreateEventResponseDTO, DomainError>> {
    const isMember = await this.familyRepo.isUserMember(command.family_id, userId);
    if (!isMember) {
      return err(new ForbiddenError("You do not have access to this family"));
    }

    if (command.participants && command.participants.length > 0) {
      const members = await this.familyRepo.getFamilyMembers(command.family_id);
      const children = await this.childRepo.findByFamilyId(command.family_id);
      const participantValidation = Event.validateParticipants(command.participants, members, children);
      if (!participantValidation.success) {
        return participantValidation;
      }
    }

    if (command.event_type === "blocker") {
      const conflicts = await this.eventRepo.checkConflicts(
        command.family_id,
        command.start_time,
        command.end_time,
        command.participants ?? [],
        undefined
      );

      const conflictResult = Event.checkConflicts(command.event_type, conflicts);
      if (!conflictResult.success) {
        return conflictResult;
      }
    }

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

      this.logRepo
        .create({
          family_id: command.family_id,
          actor_id: userId,
          actor_type: "user",
          action: "event.create",
          details: {
            event_id: event.id,
            title: event.title,
            event_type: event.event_type,
          },
        })
        .catch((error) => {
          console.error("Failed to log event.create:", error);
        });

      return ok({
        id: event.id,
        family_id: event.family_id,
        title: event.title,
        start_time: event.start_time,
        end_time: event.end_time,
        is_all_day: event.is_all_day,
        event_type: event.event_type,
        recurrence_pattern: event.recurrence_pattern ?? null,
        is_synced: event.is_synced ?? false,
        external_calendar_id: event.external_calendar_id ?? null,
        created_at: event.created_at,
        updated_at: event.updated_at ?? null,
        participants: participants.map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          avatar_url: p.avatar_url ?? null,
        })),
      });
    } catch (error) {
      console.error("Error in EventService.createEvent:", error);
      return err(new DomainError(500, "Failed to create event"));
    }
  }

  async updateEvent(
    eventId: string,
    command: UpdateEventCommand,
    scope: "this" | "future" | "all",
    occurrenceDate: string | undefined,
    userId: string
  ): Promise<Result<UpdateEventResponseDTO, DomainError>> {
    const event = await this.eventRepo.findById(eventId);
    if (!event) {
      return err(new NotFoundError("Event", eventId));
    }

    const isMember = await this.familyRepo.isUserMember(event.family_id, userId);
    const canModifyResult = Event.canModify(event, isMember);
    if (!canModifyResult.success) {
      return canModifyResult;
    }

    const scopeValidation = Event.validateScope(scope, event.recurrence_pattern, occurrenceDate);
    if (!scopeValidation.success) {
      return scopeValidation;
    }

    if (command.participants && command.participants.length > 0) {
      const members = await this.familyRepo.getFamilyMembers(event.family_id);
      const children = await this.childRepo.findByFamilyId(event.family_id);
      const participantValidation = Event.validateParticipants(command.participants, members, children);
      if (!participantValidation.success) {
        return participantValidation;
      }
    }

    if (command.event_type === "blocker" || event.event_type === "blocker") {
      const startTime = command.start_time ?? event.start_time;
      const endTime = command.end_time ?? event.end_time;
      const participants = command.participants ?? (await this.eventRepo.getParticipants(eventId));

      const conflicts = await this.eventRepo.checkConflicts(
        event.family_id,
        startTime,
        endTime,
        participants.map((p) => ({ id: p.id, type: p.type })),
        eventId
      );

      const eventType = command.event_type ?? event.event_type;
      const conflictResult = Event.checkConflicts(eventType, conflicts);
      if (!conflictResult.success) {
        return conflictResult;
      }
    }

    try {
      let exceptionCreated = false;

      if (scope === "this" && event.recurrence_pattern && occurrenceDate) {
        const exception = await this.eventRepo.createException(eventId, {
          original_date: occurrenceDate,
          new_start_time: command.start_time ?? null,
          new_end_time: command.end_time ?? null,
          is_cancelled: false,
        });
        exceptionCreated = !!exception;
      } else if (scope === "future" && event.recurrence_pattern) {
        if (command.recurrence_pattern) {
          const updatedPattern = {
            ...event.recurrence_pattern,
            end_date: occurrenceDate ?? event.start_time,
          };
          await this.eventRepo.update(eventId, {
            ...command,
            recurrence_pattern: updatedPattern,
          });
        }
      } else {
        await this.eventRepo.update(eventId, command);
        if (scope === "all" && event.recurrence_pattern) {
          await this.eventRepo.deleteExceptions(eventId);
        }
      }

      const updatedEvent = await this.eventRepo.findById(eventId);
      if (!updatedEvent) {
        return err(new NotFoundError("Event", eventId));
      }

      const participants = await this.eventRepo.getParticipants(eventId);

      this.logRepo
        .create({
          family_id: event.family_id,
          actor_id: userId,
          actor_type: "user",
          action: "event.update",
          details: {
            event_id: eventId,
            title: updatedEvent.title,
            event_type: updatedEvent.event_type,
            scope,
          },
        })
        .catch((error) => {
          console.error("Failed to log event.update:", error);
        });

      return ok({
        id: updatedEvent.id,
        family_id: updatedEvent.family_id,
        title: updatedEvent.title,
        start_time: updatedEvent.start_time,
        end_time: updatedEvent.end_time,
        is_all_day: updatedEvent.is_all_day,
        event_type: updatedEvent.event_type,
        recurrence_pattern: updatedEvent.recurrence_pattern ?? null,
        is_synced: updatedEvent.is_synced ?? false,
        external_calendar_id: updatedEvent.external_calendar_id ?? null,
        created_at: updatedEvent.created_at,
        updated_at: updatedEvent.updated_at ?? null,
        participants: participants.map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          avatar_url: p.avatar_url ?? null,
        })),
        exception_created: exceptionCreated,
      });
    } catch (error) {
      console.error("Error in EventService.updateEvent:", error);
      return err(new DomainError(500, "Failed to update event"));
    }
  }

  async deleteEvent(
    eventId: string,
    scope: "this" | "future" | "all",
    occurrenceDate: string | undefined,
    userId: string
  ): Promise<Result<void, DomainError>> {
    const event = await this.eventRepo.findById(eventId);
    if (!event) {
      return err(new NotFoundError("Event", eventId));
    }

    const isMember = await this.familyRepo.isUserMember(event.family_id, userId);
    const canModifyResult = Event.canModify(event, isMember);
    if (!canModifyResult.success) {
      return canModifyResult;
    }

    const scopeValidation = Event.validateScope(scope, event.recurrence_pattern, occurrenceDate);
    if (!scopeValidation.success) {
      return scopeValidation;
    }

    try {
      if (scope === "this" && event.recurrence_pattern && occurrenceDate) {
        await this.eventRepo.createException(eventId, {
          original_date: occurrenceDate,
          new_start_time: null,
          new_end_time: null,
          is_cancelled: true,
        });
      } else if (scope === "future" && event.recurrence_pattern) {
        const updatedPattern = {
          ...event.recurrence_pattern,
          end_date: occurrenceDate ?? event.start_time,
        };
        await this.eventRepo.update(eventId, {
          recurrence_pattern: updatedPattern,
        });
      } else {
        await this.eventRepo.delete(eventId);
      }

      this.logRepo
        .create({
          family_id: event.family_id,
          actor_id: userId,
          actor_type: "user",
          action: "event.delete",
          details: {
            event_id: eventId,
            title: event.title,
            event_type: event.event_type,
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
    const isMember = await this.familyRepo.isUserMember(command.family_id, userId);
    if (!isMember) {
      return err(new ForbiddenError("You do not have access to this family"));
    }

    const errors: Array<{ field: string; message: string }> = [];
    let conflicts: ConflictingEventDTO[] = [];

    if (command.participants && command.participants.length > 0) {
      const members = await this.familyRepo.getFamilyMembers(command.family_id);
      const children = await this.childRepo.findByFamilyId(command.family_id);
      const participantValidation = Event.validateParticipants(command.participants, members, children);
      if (!participantValidation.success) {
        return participantValidation;
      }
    }

    if (command.event_type === "blocker") {
      const conflictResults = await this.eventRepo.checkConflicts(
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
