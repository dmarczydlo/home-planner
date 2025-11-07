import type { Result } from "@/domain/result";
import { ok, err } from "@/domain/result";
import { ValidationError, ForbiddenError, ConflictError } from "@/domain/errors";
import type { ParticipantReferenceDTO, ConflictingEventDTO } from "@/types";

export class Event {
  static validateParticipants(
    participants: ParticipantReferenceDTO[],
    familyMembers: Array<{ user_id: string }>,
    children: Array<{ id: string }>
  ): Result<void, ValidationError> {
    const memberIds = new Set(familyMembers.map((m) => m.user_id));
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

  static canModify(
    event: { is_synced?: boolean | null; family_id: string },
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
