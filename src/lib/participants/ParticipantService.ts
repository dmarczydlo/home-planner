import type { Result } from "@/domain/result";
import { ok, err } from "@/domain/result";
import { ValidationError } from "@/domain/errors";
import type { Family } from "@/domain/entities/Family";
import type { EventParticipant } from "@/domain/entities/Event";
import type { ParticipantReferenceDTO } from "@/types";
import { Event } from "@/domain/entities/Event";

export class ParticipantService {
  static buildParticipants(family: Family, participantRefs: ParticipantReferenceDTO[]): EventParticipant[] {
    const participants: EventParticipant[] = [];
    for (const ref of participantRefs) {
      if (ref.type === "user") {
        const member = family.getMember(ref.id);
        if (member) {
          participants.push({
            id: ref.id,
            name: member.name,
            type: "user",
            avatarUrl: member.avatarUrl,
          });
        }
      } else {
        const child = family.children.find((c) => c.id === ref.id);
        if (child) {
          participants.push({
            id: ref.id,
            name: child.name,
            type: "child",
            avatarUrl: null,
          });
        }
      }
    }
    return participants;
  }

  static validateParticipants(
    family: Family,
    participantRefs: ParticipantReferenceDTO[]
  ): Result<void, ValidationError> {
    return Event.validateParticipants(participantRefs, family.members, family.children);
  }
}
