import { describe, it, expect } from "vitest";
import { Event } from "./Event";
import { ValidationError, ForbiddenError, ConflictError } from "@/domain/errors";
import type { ParticipantReferenceDTO, ConflictingEventDTO } from "@/types";

describe("Event Domain Entity", () => {
  describe("validateParticipants", () => {
    it("should validate participants successfully - all valid", () => {
      const participants: ParticipantReferenceDTO[] = [
        { id: "user-1", type: "user" },
        { id: "child-1", type: "child" },
      ];
      const familyMembers = [{ user_id: "user-1" }, { user_id: "user-2" }];
      const children = [{ id: "child-1" }, { id: "child-2" }];

      const result = Event.validateParticipants(participants, familyMembers, children);

      expect(result.success).toBe(true);
    });

    it("should fail validation - invalid user", () => {
      const participants: ParticipantReferenceDTO[] = [
        { id: "invalid-user", type: "user" },
      ];
      const familyMembers = [{ user_id: "user-1" }];
      const children: Array<{ id: string }> = [];

      const result = Event.validateParticipants(participants, familyMembers, children);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("invalid-user");
        expect(result.error.message).toContain("not found in family");
      }
    });

    it("should fail validation - invalid child", () => {
      const participants: ParticipantReferenceDTO[] = [
        { id: "invalid-child", type: "child" },
      ];
      const familyMembers: Array<{ user_id: string }> = [];
      const children = [{ id: "child-1" }];

      const result = Event.validateParticipants(participants, familyMembers, children);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("invalid-child");
        expect(result.error.message).toContain("not found in family");
      }
    });

    it("should handle empty participants array", () => {
      const participants: ParticipantReferenceDTO[] = [];
      const familyMembers = [{ user_id: "user-1" }];
      const children = [{ id: "child-1" }];

      const result = Event.validateParticipants(participants, familyMembers, children);

      expect(result.success).toBe(true);
    });

    it("should fail validation on first invalid participant", () => {
      const participants: ParticipantReferenceDTO[] = [
        { id: "user-1", type: "user" },
        { id: "invalid-user", type: "user" },
        { id: "invalid-child", type: "child" },
      ];
      const familyMembers = [{ user_id: "user-1" }];
      const children = [{ id: "child-1" }];

      const result = Event.validateParticipants(participants, familyMembers, children);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("invalid-user");
      }
    });
  });

  describe("validateScope", () => {
    it("should validate scope successfully - 'all' for non-recurring", () => {
      const result = Event.validateScope("all", null, undefined);

      expect(result.success).toBe(true);
    });

    it("should validate scope successfully - 'this' for recurring with date", () => {
      const recurrencePattern = { frequency: "daily" as const, end_date: "2024-12-31" };
      const occurrenceDate = "2024-01-01";

      const result = Event.validateScope("this", recurrencePattern, occurrenceDate);

      expect(result.success).toBe(true);
    });

    it("should fail validation - 'this' without recurrence pattern", () => {
      const result = Event.validateScope("this", null, "2024-01-01");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("Scope 'this' can only be used for recurring events");
      }
    });

    it("should fail validation - 'this' without occurrence date", () => {
      const recurrencePattern = { frequency: "daily" as const, end_date: "2024-12-31" };

      const result = Event.validateScope("this", recurrencePattern, undefined);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("Date parameter required");
      }
    });

    it("should validate scope successfully - 'future' for recurring", () => {
      const recurrencePattern = { frequency: "daily" as const, end_date: "2024-12-31" };
      const occurrenceDate = "2024-01-01";

      const result = Event.validateScope("future", recurrencePattern, occurrenceDate);

      expect(result.success).toBe(true);
    });

    it("should validate scope successfully - 'future' without occurrence date", () => {
      const recurrencePattern = { frequency: "daily" as const, end_date: "2024-12-31" };

      const result = Event.validateScope("future", recurrencePattern, undefined);

      expect(result.success).toBe(true);
    });
  });

  describe("checkConflicts", () => {
    it("should return error - blocker with conflicts", () => {
      const conflicts = [
        {
          id: "event-1",
          title: "Conflicting Event",
          start_time: "2024-01-01T10:00:00Z",
          end_time: "2024-01-01T11:00:00Z",
          participants: [
            { id: "user-1", name: "User 1", type: "user" as const, avatar_url: null },
          ],
        },
      ];

      const result = Event.checkConflicts("blocker", conflicts);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ConflictError);
        expect(result.error.message).toContain("conflicts with an existing blocker event");
        if (result.error instanceof ConflictError && result.error.conflictingEvents) {
          const conflicts = result.error.conflictingEvents as ConflictingEventDTO[];
          expect(conflicts).toHaveLength(1);
          expect(conflicts[0].id).toBe("event-1");
        }
      }
    });

    it("should succeed - blocker without conflicts", () => {
      const conflicts: Array<{
        id: string;
        title: string;
        start_time: string;
        end_time: string;
        participants: Array<{ id: string; name: string; type: "user" | "child"; avatar_url?: string | null }>;
      }> = [];

      const result = Event.checkConflicts("blocker", conflicts);

      expect(result.success).toBe(true);
    });

    it("should succeed - elastic with conflicts", () => {
      const conflicts = [
        {
          id: "event-1",
          title: "Conflicting Event",
          start_time: "2024-01-01T10:00:00Z",
          end_time: "2024-01-01T11:00:00Z",
          participants: [
            { id: "user-1", name: "User 1", type: "user" as const, avatar_url: null },
          ],
        },
      ];

      const result = Event.checkConflicts("elastic", conflicts);

      expect(result.success).toBe(true);
    });

    it("should format conflicting events correctly", () => {
      const conflicts = [
        {
          id: "event-1",
          title: "Event 1",
          start_time: "2024-01-01T10:00:00Z",
          end_time: "2024-01-01T11:00:00Z",
          participants: [
            { id: "user-1", name: "User 1", type: "user" as const, avatar_url: "https://example.com/avatar.jpg" },
            { id: "child-1", name: "Child 1", type: "child" as const },
          ],
        },
        {
          id: "event-2",
          title: "Event 2",
          start_time: "2024-01-01T14:00:00Z",
          end_time: "2024-01-01T15:00:00Z",
          participants: [{ id: "user-2", name: "User 2", type: "user" as const, avatar_url: null }],
        },
      ];

      const result = Event.checkConflicts("blocker", conflicts);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ConflictError);
        if (result.error instanceof ConflictError && result.error.conflictingEvents) {
          const conflicts = result.error.conflictingEvents as ConflictingEventDTO[];
          expect(conflicts).toHaveLength(2);
          expect(conflicts[0]).toMatchObject({
            id: "event-1",
            title: "Event 1",
            start_time: "2024-01-01T10:00:00Z",
            end_time: "2024-01-01T11:00:00Z",
          });
          expect(conflicts[0].participants).toHaveLength(2);
          expect(conflicts[1].id).toBe("event-2");
        }
      }
    });
  });

  describe("canModify", () => {
    it("should allow modification - member with non-synced event", () => {
      const event = { is_synced: false, family_id: "family-123" };
      const isMember = true;

      const result = Event.canModify(event, isMember);

      expect(result.success).toBe(true);
    });

    it("should prevent modification - non-member", () => {
      const event = { is_synced: false, family_id: "family-123" };
      const isMember = false;

      const result = Event.canModify(event, isMember);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ForbiddenError);
        expect(result.error.message).toContain("do not have access to this event");
      }
    });

    it("should prevent modification - synced event", () => {
      const event = { is_synced: true, family_id: "family-123" };
      const isMember = true;

      const result = Event.canModify(event, isMember);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ForbiddenError);
        expect(result.error.message).toContain("Synced events cannot be modified");
      }
    });

    it("should allow modification - handles null is_synced", () => {
      const event = { is_synced: null, family_id: "family-123" };
      const isMember = true;

      const result = Event.canModify(event, isMember);

      expect(result.success).toBe(true);
    });

    it("should allow modification - handles undefined is_synced", () => {
      const event = { family_id: "family-123" } as { is_synced?: boolean | null; family_id: string };
      const isMember = true;

      const result = Event.canModify(event, isMember);

      expect(result.success).toBe(true);
    });
  });
});
