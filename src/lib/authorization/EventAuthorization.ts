import type { Result } from "@/domain/result";
import { ok, err } from "@/domain/result";
import { NotFoundError, ForbiddenError } from "@/domain/errors";
import type { Family } from "@/domain/entities/Family";
import type { EventDetails } from "@/repositories/interfaces/EventRepository";

export class EventAuthorization {
  static checkFamilyAccess(
    family: Family | null,
    familyId: string,
    userId: string
  ): Result<Family, NotFoundError | ForbiddenError> {
    if (!family) {
      return err(new NotFoundError("Family", familyId));
    }

    if (!family.isMember(userId)) {
      return err(new ForbiddenError("You do not have access to this family"));
    }

    return ok(family);
  }

  static checkEventBelongsToFamily(
    eventDetails: EventDetails | null,
    expectedFamilyId: string,
    eventId: string
  ): Result<EventDetails, NotFoundError> {
    if (!eventDetails) {
      return err(new NotFoundError("Event", eventId));
    }

    if (eventDetails.family_id !== expectedFamilyId) {
      return err(new NotFoundError("Event", eventId));
    }

    return ok(eventDetails);
  }
}
