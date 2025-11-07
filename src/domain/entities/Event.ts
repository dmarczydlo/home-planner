import type { Result } from "@/domain/result";
import { ok, err } from "@/domain/result";
import { ValidationError, ForbiddenError, ConflictError } from "@/domain/errors";
import type {
  ParticipantReferenceDTO,
  ConflictingEventDTO,
  RecurrencePatternDTO,
  EventDTO,
  EventDetailsDTO,
} from "@/types";

export interface EventParticipant {
  id: string;
  name: string;
  type: "user" | "child";
  avatarUrl?: string | null;
}

export interface EventException {
  id: string;
  originalDate: string;
  newStartTime: string | null;
  newEndTime: string | null;
  isCancelled: boolean;
}

export class Event {
  constructor(
    public readonly id: string,
    public readonly familyId: string,
    public readonly title: string,
    public readonly startTime: string,
    public readonly endTime: string,
    public readonly eventType: "elastic" | "blocker",
    public readonly isAllDay: boolean,
    public readonly createdAt: string,
    public readonly recurrencePattern: RecurrencePatternDTO | null,
    public readonly isSynced: boolean,
    public readonly externalCalendarId: string | null,
    public readonly updatedAt: string | null,
    public readonly participants: EventParticipant[],
    public readonly exceptions: EventException[]
  ) {}

  static create(
    id: string,
    familyId: string,
    title: string,
    startTime: string,
    endTime: string,
    eventType: "elastic" | "blocker",
    isAllDay: boolean,
    createdAt: string,
    recurrencePattern: RecurrencePatternDTO | null,
    isSynced: boolean,
    externalCalendarId: string | null,
    updatedAt: string | null,
    participants: EventParticipant[],
    exceptions: EventException[]
  ): Event {
    if (!id || id.trim() === "") {
      throw new Error("Event id cannot be empty");
    }
    if (!familyId || familyId.trim() === "") {
      throw new Error("Event familyId cannot be empty");
    }
    if (!title || title.trim() === "") {
      throw new Error("Event title cannot be empty");
    }
    if (new Date(endTime) <= new Date(startTime)) {
      throw new Error("End time must be after start time");
    }
    if (!Array.isArray(participants)) {
      throw new Error("Participants must be an array");
    }
    if (!Array.isArray(exceptions)) {
      throw new Error("Exceptions must be an array");
    }

    return new Event(
      id,
      familyId,
      title,
      startTime,
      endTime,
      eventType,
      isAllDay,
      createdAt,
      recurrencePattern,
      isSynced,
      externalCalendarId,
      updatedAt,
      participants,
      exceptions
    );
  }

  static validateParticipants(
    participants: ParticipantReferenceDTO[],
    familyMembers: Array<{ user_id: string } | { userId: string }>,
    children: Array<{ id: string }>
  ): Result<void, ValidationError> {
    const memberIds = new Set(familyMembers.map((m) => ("user_id" in m ? m.user_id : m.userId)));
    const childIds = new Set(children.map((c) => c.id));

    for (const participant of participants) {
      if (participant.type === "user" && !memberIds.has(participant.id)) {
        return err(
          new ValidationError(`Participant ${participant.id} not found in family`, {
            participants: "invalid",
          })
        );
      }

      if (participant.type === "child" && !childIds.has(participant.id)) {
        return err(
          new ValidationError(`Participant ${participant.id} not found in family`, {
            participants: "invalid",
          })
        );
      }
    }

    return ok(undefined);
  }

  static detectBlockerConflicts(
    eventType: "elastic" | "blocker",
    startTime: string,
    endTime: string,
    participantRefs: ParticipantReferenceDTO[],
    existingEvents: Event[]
  ): Result<ConflictingEventDTO[], ConflictError> {
    if (eventType !== "blocker") {
      return ok([]);
    }

    const conflictingBlockers = existingEvents.filter((e) => {
      if (e.eventType !== "blocker") return false;
      if (e.startTime >= endTime || e.endTime <= startTime) return false;

      const eventParticipantIds = new Set(e.participants.map((p) => p.id));
      return participantRefs.some((p) => eventParticipantIds.has(p.id));
    });

    if (conflictingBlockers.length > 0) {
      const conflictingEvents: ConflictingEventDTO[] = conflictingBlockers.map((e) => ({
        id: e.id,
        title: e.title,
        start_time: e.startTime,
        end_time: e.endTime,
        participants: e.participants.map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          avatar_url: p.avatarUrl ?? null,
        })),
      }));

      return err(new ConflictError("This blocker event conflicts with an existing blocker event", conflictingEvents));
    }

    return ok([]);
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

  static checkConflicts(
    eventType: "elastic" | "blocker",
    conflicts: Array<{
      id: string;
      title: string;
      start_time: string;
      end_time: string;
      participants: Array<{ id: string; name: string; type: "user" | "child"; avatar_url?: string | null }>;
    }>
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

  canModify(isMember: boolean): Result<void, ForbiddenError> {
    if (!isMember) {
      return err(new ForbiddenError("You do not have access to this event"));
    }

    if (this.isSynced) {
      return err(new ForbiddenError("Synced events cannot be modified"));
    }

    return ok(undefined);
  }

  updateTitle(title: string): Event {
    if (!title || title.trim() === "") {
      throw new Error("Event title cannot be empty");
    }
    return Event.create(
      this.id,
      this.familyId,
      title,
      this.startTime,
      this.endTime,
      this.eventType,
      this.isAllDay,
      this.createdAt,
      this.recurrencePattern,
      this.isSynced,
      this.externalCalendarId,
      new Date().toISOString(),
      this.participants,
      this.exceptions
    );
  }

  updateTime(startTime: string, endTime: string): Event {
    if (new Date(endTime) <= new Date(startTime)) {
      throw new Error("End time must be after start time");
    }
    return Event.create(
      this.id,
      this.familyId,
      this.title,
      startTime,
      endTime,
      this.eventType,
      this.isAllDay,
      this.createdAt,
      this.recurrencePattern,
      this.isSynced,
      this.externalCalendarId,
      new Date().toISOString(),
      this.participants,
      this.exceptions
    );
  }

  updateEventType(eventType: "elastic" | "blocker"): Event {
    return Event.create(
      this.id,
      this.familyId,
      this.title,
      this.startTime,
      this.endTime,
      eventType,
      this.isAllDay,
      this.createdAt,
      this.recurrencePattern,
      this.isSynced,
      this.externalCalendarId,
      new Date().toISOString(),
      this.participants,
      this.exceptions
    );
  }

  updateRecurrencePattern(recurrencePattern: RecurrencePatternDTO | null): Event {
    return Event.create(
      this.id,
      this.familyId,
      this.title,
      this.startTime,
      this.endTime,
      this.eventType,
      this.isAllDay,
      this.createdAt,
      recurrencePattern,
      this.isSynced,
      this.externalCalendarId,
      new Date().toISOString(),
      this.participants,
      this.exceptions
    );
  }

  updateParticipants(participants: EventParticipant[]): Event {
    return Event.create(
      this.id,
      this.familyId,
      this.title,
      this.startTime,
      this.endTime,
      this.eventType,
      this.isAllDay,
      this.createdAt,
      this.recurrencePattern,
      this.isSynced,
      this.externalCalendarId,
      new Date().toISOString(),
      participants,
      this.exceptions
    );
  }

  addException(exception: EventException): Event {
    const newExceptions = [...this.exceptions, exception];
    return Event.create(
      this.id,
      this.familyId,
      this.title,
      this.startTime,
      this.endTime,
      this.eventType,
      this.isAllDay,
      this.createdAt,
      this.recurrencePattern,
      this.isSynced,
      this.externalCalendarId,
      new Date().toISOString(),
      this.participants,
      newExceptions
    );
  }

  toDTO(): EventDTO {
    return {
      id: this.id,
      family_id: this.familyId,
      title: this.title,
      start_time: this.startTime,
      end_time: this.endTime,
      is_all_day: this.isAllDay,
      event_type: this.eventType,
      recurrence_pattern: this.recurrencePattern,
      is_synced: this.isSynced,
      external_calendar_id: this.externalCalendarId,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }

  toDetailsDTO(): EventDetailsDTO {
    return {
      ...this.toDTO(),
      participants: this.participants.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        avatar_url: p.avatarUrl ?? null,
      })),
      exceptions: this.exceptions.map((e) => ({
        id: e.id,
        original_date: e.originalDate,
        new_start_time: e.newStartTime,
        new_end_time: e.newEndTime,
        is_cancelled: e.isCancelled,
      })),
    };
  }
}
