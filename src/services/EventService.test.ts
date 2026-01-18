import { describe, it, expect, beforeEach } from "vitest";
import { EventService } from "./EventService";
import { InMemoryEventRepository } from "@/repositories/implementations/in-memory/InMemoryEventRepository";
import { InMemoryFamilyRepository } from "@/repositories/implementations/in-memory/InMemoryFamilyRepository";
import { InMemoryChildRepository } from "@/repositories/implementations/in-memory/InMemoryChildRepository";
import { InMemoryLogRepository } from "@/repositories/implementations/in-memory/InMemoryLogRepository";
import { NotFoundError, ForbiddenError, ValidationError, ConflictError, InternalError } from "@/domain/errors";
import type { CreateEventCommand, UpdateEventCommand, ValidateEventCommand } from "@/types";

describe("EventService", () => {
  let eventService: EventService;
  let eventRepo: InMemoryEventRepository;
  let familyRepo: InMemoryFamilyRepository;
  let childRepo: InMemoryChildRepository;
  let logRepo: InMemoryLogRepository;
  let userId: string;
  let familyId: string;

  beforeEach(async () => {
    eventRepo = new InMemoryEventRepository();
    familyRepo = new InMemoryFamilyRepository();
    childRepo = new InMemoryChildRepository();
    logRepo = new InMemoryLogRepository();
    eventService = new EventService(eventRepo, familyRepo, childRepo, logRepo);

    userId = "user-123";
    const family = await familyRepo.create({ name: "Test Family" });
    familyId = family.id;
    await familyRepo.addMember(familyId, userId, "admin");
    familyRepo.setUser(userId, { full_name: "Test User", avatar_url: null });
  });

  describe("listEvents", () => {
    it("should list events successfully with default filters", async () => {
      // Arrange
      const startDate = "2024-01-01T00:00:00Z";
      const endDate = "2024-01-31T23:59:59Z";
      await eventRepo.create({
        title: "Test Event",
        start_time: "2024-01-15T10:00:00Z",
        end_time: "2024-01-15T11:00:00Z",
        family_id: familyId,
        event_type: "elastic",
      });

      // Act
      const result = await eventService.listEvents(familyId, startDate, endDate, {}, userId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.events).toHaveLength(1);
        expect(result.data.events[0].title).toBe("Test Event");
        expect(result.data.pagination.total).toBe(1);
        expect(result.data.pagination.has_more).toBe(false);
      }
    });

    it("should list events filtered by participant", async () => {
      // Arrange
      const startDate = "2024-01-01T00:00:00Z";
      const endDate = "2024-01-31T23:59:59Z";
      const child = await childRepo.create({ family_id: familyId, name: "Child 1" });
      const event1 = await eventRepo.create({
        title: "Event 1",
        start_time: "2024-01-15T10:00:00Z",
        end_time: "2024-01-15T11:00:00Z",
        family_id: familyId,
        event_type: "elastic",
        participants: [{ id: child.id, type: "child" }],
      });
      await eventRepo.create({
        title: "Event 2",
        start_time: "2024-01-16T10:00:00Z",
        end_time: "2024-01-16T11:00:00Z",
        family_id: familyId,
        event_type: "elastic",
        participants: [{ id: userId, type: "user" }],
      });

      // Act
      const result = await eventService.listEvents(
        familyId,
        startDate,
        endDate,
        { participantIds: [child.id] },
        userId
      );

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.events.length).toBeGreaterThanOrEqual(1);
        const eventWithChild = result.data.events.find((e) => e.id === event1.id);
        expect(eventWithChild).toBeDefined();
      }
    });

    it("should list events filtered by event type", async () => {
      // Arrange
      const startDate = "2024-01-01T00:00:00Z";
      const endDate = "2024-01-31T23:59:59Z";
      await eventRepo.create({
        title: "Elastic Event",
        start_time: "2024-01-15T10:00:00Z",
        end_time: "2024-01-15T11:00:00Z",
        family_id: familyId,
        event_type: "elastic",
      });
      await eventRepo.create({
        title: "Blocker Event",
        start_time: "2024-01-16T10:00:00Z",
        end_time: "2024-01-16T11:00:00Z",
        family_id: familyId,
        event_type: "blocker",
      });

      // Act
      const result = await eventService.listEvents(
        familyId,
        startDate,
        endDate,
        { eventType: "blocker" },
        userId
      );

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.events.every((e) => e.event_type === "blocker")).toBe(true);
        expect(result.data.events.some((e) => e.title === "Blocker Event")).toBe(true);
      }
    });

    it("should list events with pagination", async () => {
      // Arrange
      const startDate = "2024-01-01T00:00:00Z";
      const endDate = "2024-01-31T23:59:59Z";
      for (let i = 0; i < 15; i++) {
        await eventRepo.create({
          title: `Event ${i}`,
          start_time: `2024-01-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
          end_time: `2024-01-${String(i + 1).padStart(2, "0")}T11:00:00Z`,
          family_id: familyId,
          event_type: "elastic",
        });
      }

      // Act
      const result = await eventService.listEvents(familyId, startDate, endDate, { limit: 10, offset: 0 }, userId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.events.length).toBe(10);
        expect(result.data.pagination.total).toBeGreaterThanOrEqual(15);
        expect(result.data.pagination.has_more).toBe(true);
        expect(result.data.pagination.limit).toBe(10);
        expect(result.data.pagination.offset).toBe(0);
      }
    });

    it("should exclude synced events when includeSynced is false", async () => {
      // Arrange
      const startDate = "2024-01-01T00:00:00Z";
      const endDate = "2024-01-31T23:59:59Z";
      await eventRepo.create({
        title: "Non-synced Event",
        start_time: "2024-01-15T10:00:00Z",
        end_time: "2024-01-15T11:00:00Z",
        family_id: familyId,
        event_type: "elastic",
      });
      const syncedEvent = await eventRepo.create({
        title: "Synced Event",
        start_time: "2024-01-16T10:00:00Z",
        end_time: "2024-01-16T11:00:00Z",
        family_id: familyId,
        event_type: "elastic",
      });
      await eventRepo.update(syncedEvent.id, { is_synced: true });

      // Act
      const result = await eventService.listEvents(
        familyId,
        startDate,
        endDate,
        { includeSynced: false },
        userId
      );

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.events.every((e) => !e.is_synced)).toBe(true);
        expect(result.data.events.some((e) => e.title === "Synced Event")).toBe(false);
      }
    });

    it("should return error when user is not family member", async () => {
      // Arrange
      const startDate = "2024-01-01T00:00:00Z";
      const endDate = "2024-01-31T23:59:59Z";
      const otherUserId = "other-user-123";

      // Act
      const result = await eventService.listEvents(familyId, startDate, endDate, {}, otherUserId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ForbiddenError);
        expect(result.error.message).toContain("do not have access to this family");
      }
    });

    it("should handle repository errors gracefully", async () => {
      // Arrange
      const brokenRepo = {
        findByDateRange: async () => {
          throw new Error("Database error");
        },
      } as unknown as typeof eventRepo;
      const brokenService = new EventService(brokenRepo, familyRepo, childRepo, logRepo);
      const startDate = "2024-01-01T00:00:00Z";
      const endDate = "2024-01-31T23:59:59Z";

      // Act
      const result = await brokenService.listEvents(familyId, startDate, endDate, {}, userId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(InternalError);
        expect(result.error.message).toContain("Failed to retrieve events");
      }
    });
  });

  describe("getEventById", () => {
    it("should get event by ID successfully", async () => {
      // Arrange
      const event = await eventRepo.create({
        title: "Test Event",
        start_time: "2024-01-15T10:00:00Z",
        end_time: "2024-01-15T11:00:00Z",
        family_id: familyId,
        event_type: "elastic",
        participants: [{ id: userId, type: "user" }],
      });

      // Act
      const result = await eventService.getEventById(event.id, undefined, userId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(event.id);
        expect(result.data.title).toBe("Test Event");
        expect(result.data.participants).toBeDefined();
        expect(result.data.exceptions).toBeDefined();
      }
    });

    it("should get event by ID with occurrence date (recurring event)", async () => {
      // Arrange
      const event = await eventRepo.create({
        title: "Recurring Event",
        start_time: "2024-01-01T10:00:00Z",
        end_time: "2024-01-01T11:00:00Z",
        family_id: familyId,
        event_type: "elastic",
        recurrence_pattern: {
          frequency: "daily",
          end_date: "2024-01-31T23:59:59Z",
        },
      });
      const occurrenceDate = "2024-01-15";
      await eventRepo.createException(event.id, {
        original_date: occurrenceDate,
        new_start_time: "2024-01-15T14:00:00Z",
        new_end_time: "2024-01-15T15:00:00Z",
        is_cancelled: false,
      });

      // Act
      const result = await eventService.getEventById(event.id, occurrenceDate, userId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(event.id);
        expect(result.data.exceptions.length).toBeGreaterThan(0);
      }
    });

    it("should return error when event not found", async () => {
      // Arrange
      const nonExistentEventId = "00000000-0000-0000-0000-000000000000";

      // Act
      const result = await eventService.getEventById(nonExistentEventId, undefined, userId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(NotFoundError);
        expect(result.error.message).toContain("Event");
      }
    });

    it("should return error when user not family member", async () => {
      // Arrange
      const event = await eventRepo.create({
        title: "Test Event",
        start_time: "2024-01-15T10:00:00Z",
        end_time: "2024-01-15T11:00:00Z",
        family_id: familyId,
        event_type: "elastic",
      });
      const otherUserId = "other-user-123";

      // Act
      const result = await eventService.getEventById(event.id, undefined, otherUserId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ForbiddenError);
        expect(result.error.message).toContain("do not have access to this event");
      }
    });
  });

  describe("createEvent", () => {
    it("should create elastic event successfully", async () => {
      // Arrange
      const command: CreateEventCommand = {
        title: "New Event",
        start_time: "2024-01-15T10:00:00Z",
        end_time: "2024-01-15T11:00:00Z",
        family_id: familyId,
        event_type: "elastic",
      };

      // Act
      const result = await eventService.createEvent(command, userId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("New Event");
        expect(result.data.event_type).toBe("elastic");
        expect(result.data.family_id).toBe(familyId);
        expect(result.data.id).toBeDefined();
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
      const logs = logRepo.getLogs();
      expect(logs.some((log) => log.action === "event.create")).toBe(true);
    });

    it("should create blocker event successfully", async () => {
      // Arrange
      const command: CreateEventCommand = {
        title: "Blocker Event",
        start_time: "2024-01-15T10:00:00Z",
        end_time: "2024-01-15T11:00:00Z",
        family_id: familyId,
        event_type: "blocker",
      };

      // Act
      const result = await eventService.createEvent(command, userId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.event_type).toBe("blocker");
      }
    });

    it("should create event with participants (users and children)", async () => {
      // Arrange
      const child = await childRepo.create({ family_id: familyId, name: "Child 1" });
      const command: CreateEventCommand = {
        title: "Event with Participants",
        start_time: "2024-01-15T10:00:00Z",
        end_time: "2024-01-15T11:00:00Z",
        family_id: familyId,
        event_type: "elastic",
        participants: [
          { id: userId, type: "user" },
          { id: child.id, type: "child" },
        ],
      };

      // Act
      const result = await eventService.createEvent(command, userId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.participants.length).toBe(2);
        expect(result.data.participants.some((p) => p.id === userId && p.type === "user")).toBe(true);
        expect(result.data.participants.some((p) => p.id === child.id && p.type === "child")).toBe(true);
      }
    });

    it("should create recurring daily event", async () => {
      // Arrange
      const command: CreateEventCommand = {
        title: "Daily Recurring Event",
        start_time: "2024-01-01T10:00:00Z",
        end_time: "2024-01-01T11:00:00Z",
        family_id: familyId,
        event_type: "elastic",
        recurrence_pattern: {
          frequency: "daily",
          end_date: "2024-01-31T23:59:59Z",
        },
      };

      // Act
      const result = await eventService.createEvent(command, userId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.recurrence_pattern).toBeDefined();
        expect(result.data.recurrence_pattern?.frequency).toBe("daily");
      }
    });

    it("should create recurring weekly event", async () => {
      // Arrange
      const command: CreateEventCommand = {
        title: "Weekly Recurring Event",
        start_time: "2024-01-01T10:00:00Z",
        end_time: "2024-01-01T11:00:00Z",
        family_id: familyId,
        event_type: "elastic",
        recurrence_pattern: {
          frequency: "weekly",
          interval: 1,
          end_date: "2024-12-31T23:59:59Z",
        },
      };

      // Act
      const result = await eventService.createEvent(command, userId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.recurrence_pattern?.frequency).toBe("weekly");
        expect(result.data.recurrence_pattern?.interval).toBe(1);
      }
    });

    it("should create recurring monthly event", async () => {
      const command: CreateEventCommand = {
        title: "Monthly Recurring Event",
        start_time: "2024-01-01T10:00:00Z",
        end_time: "2024-01-01T11:00:00Z",
        family_id: familyId,
        event_type: "elastic",
        recurrence_pattern: {
          frequency: "monthly",
          end_date: "2024-12-31T23:59:59Z",
        },
      };

      const result = await eventService.createEvent(command, userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.recurrence_pattern?.frequency).toBe("monthly");
      }
    });

    it("should prevent creation of blocker event with conflict", async () => {
      const existingEvent = await eventRepo.create({
        title: "Existing Blocker",
        start_time: "2024-01-15T10:00:00Z",
        end_time: "2024-01-15T11:00:00Z",
        family_id: familyId,
        event_type: "blocker",
        participants: [{ id: userId, type: "user" }],
      });

      const command: CreateEventCommand = {
        title: "Conflicting Blocker",
        start_time: "2024-01-15T10:30:00Z",
        end_time: "2024-01-15T11:30:00Z",
        family_id: familyId,
        event_type: "blocker",
        participants: [{ id: userId, type: "user" }],
      };

      const result = await eventService.createEvent(command, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ConflictError);
        expect(result.error.conflictingEvents).toBeDefined();
        expect(result.error.conflictingEvents.length).toBeGreaterThan(0);
      }
    });

    it("should allow creation of elastic event with conflict", async () => {
      await eventRepo.create({
        title: "Existing Blocker",
        start_time: "2024-01-15T10:00:00Z",
        end_time: "2024-01-15T11:00:00Z",
        family_id: familyId,
        event_type: "blocker",
        participants: [{ id: userId, type: "user" }],
      });

      const command: CreateEventCommand = {
        title: "Elastic Overlapping Blocker",
        start_time: "2024-01-15T10:30:00Z",
        end_time: "2024-01-15T11:30:00Z",
        family_id: familyId,
        event_type: "elastic",
        participants: [{ id: userId, type: "user" }],
      };

      const result = await eventService.createEvent(command, userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.event_type).toBe("elastic");
      }
    });

    it("should return error when participant user is invalid", async () => {
      const command: CreateEventCommand = {
        title: "Event with Invalid User",
        start_time: "2024-01-15T10:00:00Z",
        end_time: "2024-01-15T11:00:00Z",
        family_id: familyId,
        event_type: "elastic",
        participants: [{ id: "invalid-user", type: "user" }],
      };

      const result = await eventService.createEvent(command, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("not found in family");
      }
    });

    it("should return error when participant child is invalid", async () => {
      const command: CreateEventCommand = {
        title: "Event with Invalid Child",
        start_time: "2024-01-15T10:00:00Z",
        end_time: "2024-01-15T11:00:00Z",
        family_id: familyId,
        event_type: "elastic",
        participants: [{ id: "invalid-child", type: "child" }],
      };

      const result = await eventService.createEvent(command, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("not found in family");
      }
    });

    it("should return error when user not family member", async () => {
      const command: CreateEventCommand = {
        title: "New Event",
        start_time: "2024-01-15T10:00:00Z",
        end_time: "2024-01-15T11:00:00Z",
        family_id: familyId,
        event_type: "elastic",
      };
      const otherUserId = "other-user-123";

      const result = await eventService.createEvent(command, otherUserId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ForbiddenError);
        expect(result.error.message).toContain("do not have access to this family");
      }
    });
  });

  describe("updateEvent", () => {
    let eventId: string;

    beforeEach(async () => {
      const event = await eventRepo.create({
        title: "Original Event",
        start_time: "2024-01-15T10:00:00Z",
        end_time: "2024-01-15T11:00:00Z",
        family_id: familyId,
        event_type: "elastic",
      });
      eventId = event.id;
    });

    it("should update non-recurring event", async () => {
      const command: UpdateEventCommand = {
        title: "Updated Event",
        start_time: "2024-01-15T14:00:00Z",
        end_time: "2024-01-15T15:00:00Z",
      };

      const result = await eventService.updateEvent(eventId, command, "all", undefined, userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Updated Event");
        expect(result.data.start_time).toBe("2024-01-15T14:00:00Z");
      }

      await new Promise((resolve) => setTimeout(resolve, 10));
      const logs = logRepo.getLogs();
      expect(logs.some((log) => log.action === "event.update")).toBe(true);
    });

    it("should update single occurrence of recurring event", async () => {
      const recurringEvent = await eventRepo.create({
        title: "Recurring Event",
        start_time: "2024-01-01T10:00:00Z",
        end_time: "2024-01-01T11:00:00Z",
        family_id: familyId,
        event_type: "elastic",
        recurrence_pattern: {
          frequency: "daily",
          end_date: "2024-01-31T23:59:59Z",
        },
      });

      const command: UpdateEventCommand = {
        title: "Updated Occurrence",
      };
      const occurrenceDate = "2024-01-15";

      const result = await eventService.updateEvent(recurringEvent.id, command, "this", occurrenceDate, userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.exception_created).toBe(true);
      }
    });

    it("should update future occurrences of recurring event", async () => {
      const recurringEvent = await eventRepo.create({
        title: "Recurring Event",
        start_time: "2024-01-01T10:00:00Z",
        end_time: "2024-01-01T11:00:00Z",
        family_id: familyId,
        event_type: "elastic",
        recurrence_pattern: {
          frequency: "daily",
          end_date: "2024-01-31T23:59:59Z",
        },
      });

      const command: UpdateEventCommand = {
        title: "Updated Future Events",
      };
      const occurrenceDate = "2024-01-15";

      const result = await eventService.updateEvent(recurringEvent.id, command, "future", occurrenceDate, userId);

      expect(result.success).toBe(true);
      if (result.success) {
        const updatedEvent = await eventRepo.findById(recurringEvent.id);
        expect(updatedEvent?.recurrence_pattern?.end_date).toBeDefined();
      }
    });

    it("should update all occurrences of recurring event", async () => {
      const recurringEvent = await eventRepo.create({
        title: "Recurring Event",
        start_time: "2024-01-01T10:00:00Z",
        end_time: "2024-01-01T11:00:00Z",
        family_id: familyId,
        event_type: "elastic",
        recurrence_pattern: {
          frequency: "daily",
          end_date: "2024-01-31T23:59:59Z",
        },
      });

      await eventRepo.createException(recurringEvent.id, {
        original_date: "2024-01-15",
        new_start_time: "2024-01-15T14:00:00Z",
        new_end_time: "2024-01-15T15:00:00Z",
        is_cancelled: false,
      });

      const command: UpdateEventCommand = {
        title: "Updated All Events",
      };

      const result = await eventService.updateEvent(recurringEvent.id, command, "all", undefined, userId);

      expect(result.success).toBe(true);
      if (result.success) {
        const exceptions = await eventRepo.getExceptions(recurringEvent.id);
        expect(exceptions.length).toBe(0);
      }
    });

    it("should prevent update when conflict detected", async () => {
      await eventRepo.create({
        title: "Existing Blocker",
        start_time: "2024-01-15T10:00:00Z",
        end_time: "2024-01-15T11:00:00Z",
        family_id: familyId,
        event_type: "blocker",
        participants: [{ id: userId, type: "user" }],
      });

      const blockerEvent = await eventRepo.create({
        title: "Blocker to Update",
        start_time: "2024-01-16T10:00:00Z",
        end_time: "2024-01-16T11:00:00Z",
        family_id: familyId,
        event_type: "blocker",
        participants: [{ id: userId, type: "user" }],
      });

      const command: UpdateEventCommand = {
        start_time: "2024-01-15T10:30:00Z",
        end_time: "2024-01-15T11:30:00Z",
      };

      const result = await eventService.updateEvent(blockerEvent.id, command, "all", undefined, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ConflictError);
      }
    });

    it("should return error when event not found", async () => {
      const command: UpdateEventCommand = { title: "Updated" };
      const nonExistentEventId = "00000000-0000-0000-0000-000000000000";

      const result = await eventService.updateEvent(nonExistentEventId, command, "all", undefined, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });

    it("should prevent modification of synced events", async () => {
      const syncedEvent = await eventRepo.create({
        title: "Synced Event",
        start_time: "2024-01-15T10:00:00Z",
        end_time: "2024-01-15T11:00:00Z",
        family_id: familyId,
        event_type: "elastic",
      });
      await eventRepo.update(syncedEvent.id, { is_synced: true });

      const command: UpdateEventCommand = { title: "Updated" };

      const result = await eventService.updateEvent(syncedEvent.id, command, "all", undefined, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ForbiddenError);
        expect(result.error.message).toContain("Synced events cannot be modified");
      }
    });
  });

  describe("deleteEvent", () => {
    it("should delete non-recurring event", async () => {
      const event = await eventRepo.create({
        title: "Event to Delete",
        start_time: "2024-01-15T10:00:00Z",
        end_time: "2024-01-15T11:00:00Z",
        family_id: familyId,
        event_type: "elastic",
      });

      const result = await eventService.deleteEvent(event.id, "all", undefined, userId);

      expect(result.success).toBe(true);

      const deletedEvent = await eventRepo.findById(event.id);
      expect(deletedEvent).toBeNull();

      await new Promise((resolve) => setTimeout(resolve, 10));
      const logs = logRepo.getLogs();
      expect(logs.some((log) => log.action === "event.delete")).toBe(true);
    });

    it("should delete single occurrence of recurring event", async () => {
      const recurringEvent = await eventRepo.create({
        title: "Recurring Event",
        start_time: "2024-01-01T10:00:00Z",
        end_time: "2024-01-01T11:00:00Z",
        family_id: familyId,
        event_type: "elastic",
        recurrence_pattern: {
          frequency: "daily",
          end_date: "2024-01-31T23:59:59Z",
        },
      });

      const occurrenceDate = "2024-01-15";

      const result = await eventService.deleteEvent(recurringEvent.id, "this", occurrenceDate, userId);

      expect(result.success).toBe(true);

      const exceptions = await eventRepo.getExceptions(recurringEvent.id);
      expect(exceptions.length).toBe(1);
      expect(exceptions[0].is_cancelled).toBe(true);
    });

    it("should delete future occurrences of recurring event", async () => {
      const recurringEvent = await eventRepo.create({
        title: "Recurring Event",
        start_time: "2024-01-01T10:00:00Z",
        end_time: "2024-01-01T11:00:00Z",
        family_id: familyId,
        event_type: "elastic",
        recurrence_pattern: {
          frequency: "daily",
          end_date: "2024-01-31T23:59:59Z",
        },
      });

      const occurrenceDate = "2024-01-15";

      const result = await eventService.deleteEvent(recurringEvent.id, "future", occurrenceDate, userId);

      expect(result.success).toBe(true);

      const updatedEvent = await eventRepo.findById(recurringEvent.id);
      expect(updatedEvent?.recurrence_pattern?.end_date).toBeDefined();
    });

    it("should prevent deletion of synced events", async () => {
      const syncedEvent = await eventRepo.create({
        title: "Synced Event",
        start_time: "2024-01-15T10:00:00Z",
        end_time: "2024-01-15T11:00:00Z",
        family_id: familyId,
        event_type: "elastic",
      });
      await eventRepo.update(syncedEvent.id, { is_synced: true });

      const result = await eventService.deleteEvent(syncedEvent.id, "all", undefined, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ForbiddenError);
        expect(result.error.message).toContain("Synced events cannot be modified");
      }
    });

    it("should return error when event not found", async () => {
      const nonExistentEventId = "00000000-0000-0000-0000-000000000000";

      const result = await eventService.deleteEvent(nonExistentEventId, "all", undefined, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });
  });

  describe("validateEvent", () => {
    it("should validate event successfully - no conflicts", async () => {
      const command: ValidateEventCommand = {
        family_id: familyId,
        title: "New Event",
        start_time: "2024-01-20T10:00:00Z",
        end_time: "2024-01-20T11:00:00Z",
        event_type: "blocker",
        participants: [{ id: userId, type: "user" }],
      };

      const result = await eventService.validateEvent(command, userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
        expect(result.data.conflicts).toHaveLength(0);
      }
    });

    it("should detect conflicts", async () => {
      await eventRepo.create({
        title: "Existing Blocker",
        start_time: "2024-01-15T10:00:00Z",
        end_time: "2024-01-15T11:00:00Z",
        family_id: familyId,
        event_type: "blocker",
        participants: [{ id: userId, type: "user" }],
      });

      const command: ValidateEventCommand = {
        family_id: familyId,
        title: "Conflicting Event",
        start_time: "2024-01-15T10:30:00Z",
        end_time: "2024-01-15T11:30:00Z",
        event_type: "blocker",
        participants: [{ id: userId, type: "user" }],
      };

      const result = await eventService.validateEvent(command, userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(false);
        expect(result.data.conflicts.length).toBeGreaterThan(0);
      }
    });

    it("should validate participants", async () => {
      const command: ValidateEventCommand = {
        family_id: familyId,
        title: "Event with Invalid Participant",
        start_time: "2024-01-15T10:00:00Z",
        end_time: "2024-01-15T11:00:00Z",
        event_type: "elastic",
        participants: [{ id: "invalid-user", type: "user" }],
      };

      const result = await eventService.validateEvent(command, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should exclude current event from conflicts", async () => {
      const existingEvent = await eventRepo.create({
        title: "Existing Event",
        start_time: "2024-01-15T10:00:00Z",
        end_time: "2024-01-15T11:00:00Z",
        family_id: familyId,
        event_type: "blocker",
        participants: [{ id: userId, type: "user" }],
      });

      const command: ValidateEventCommand = {
        family_id: familyId,
        title: "Same Event",
        start_time: "2024-01-15T10:00:00Z",
        end_time: "2024-01-15T11:00:00Z",
        event_type: "blocker",
        participants: [{ id: userId, type: "user" }],
        exclude_event_id: existingEvent.id,
      };

      const result = await eventService.validateEvent(command, userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
        expect(result.data.conflicts.length).toBe(0);
      }
    });

    it("should return error when user not family member", async () => {
      const command: ValidateEventCommand = {
        family_id: familyId,
        title: "New Event",
        start_time: "2024-01-15T10:00:00Z",
        end_time: "2024-01-15T11:00:00Z",
        event_type: "elastic",
      };
      const otherUserId = "other-user-123";

      const result = await eventService.validateEvent(command, otherUserId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ForbiddenError);
      }
    });
  });
});
