import { describe, it, expect, beforeEach } from "vitest";
import { LogService } from "./LogService";
import { InMemoryLogRepository } from "@/repositories/implementations/in-memory/InMemoryLogRepository";
import { InMemoryFamilyRepository } from "@/repositories/implementations/in-memory/InMemoryFamilyRepository";
import { ValidationError, ForbiddenError, DomainError } from "@/domain/errors";

describe("LogService", () => {
  let logService: LogService;
  let logRepo: InMemoryLogRepository;
  let familyRepo: InMemoryFamilyRepository;
  let userId: string;
  let adminUserId: string;
  let memberUserId: string;
  let familyId: string;

  beforeEach(async () => {
    logRepo = new InMemoryLogRepository();
    familyRepo = new InMemoryFamilyRepository();
    logService = new LogService(logRepo, familyRepo);

    userId = "user-123";
    adminUserId = "admin-user-123";
    memberUserId = "member-user-123";

    const family = await familyRepo.create({ name: "Test Family" });
    familyId = family.id;
    await familyRepo.addMember(familyId, adminUserId, "admin");
    await familyRepo.addMember(familyId, memberUserId, "member");
  });

  describe("listLogs", () => {
    beforeEach(async () => {
      await logRepo.create({
        family_id: familyId,
        actor_id: adminUserId,
        actor_type: "user",
        action: "event.create",
        details: { event_id: "event-1" },
      });

      await logRepo.create({
        family_id: familyId,
        actor_id: memberUserId,
        actor_type: "user",
        action: "event.create",
        details: { event_id: "event-2" },
      });

      await logRepo.create({
        family_id: familyId,
        actor_id: null,
        actor_type: "system",
        action: "event.sync",
        details: { source: "google" },
      });

      await logRepo.create({
        family_id: null,
        actor_id: adminUserId,
        actor_type: "user",
        action: "user.update",
        details: { field: "name" },
      });
    });

    it("should return error if userId is missing", async () => {
      const query = { limit: 50, offset: 0 };
      const result = await logService.listLogs(query, "");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("User ID is required");
      }
    });

    it("should return error if user is not a member of specified family", async () => {
      const otherFamily = await familyRepo.create({ name: "Other Family" });
      const query = { family_id: otherFamily.id, limit: 50, offset: 0 };
      const result = await logService.listLogs(query, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ForbiddenError);
        expect(result.error.message).toContain("do not have access");
      }
    });

    it("should return all logs for admin user when filtering by family", async () => {
      const query = { family_id: familyId, limit: 50, offset: 0 };
      const result = await logService.listLogs(query, adminUserId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.logs.length).toBe(3);
        expect(result.data.pagination.total).toBe(3);
        expect(result.data.pagination.limit).toBe(50);
        expect(result.data.pagination.offset).toBe(0);
        expect(result.data.pagination.has_more).toBe(false);
      }
    });

    it("should return only own actions and system actions for regular member", async () => {
      const query = { family_id: familyId, limit: 50, offset: 0 };
      const result = await logService.listLogs(query, memberUserId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.logs.length).toBe(2);
        const actorIds = result.data.logs.map((log) => log.actor_id);
        const actorTypes = result.data.logs.map((log) => log.actor_type);
        expect(actorIds).toContain(memberUserId);
        expect(actorTypes).toContain("system");
        expect(actorIds).not.toContain(adminUserId);
      }
    });

    it("should return system actions for all members", async () => {
      const query = { family_id: familyId, limit: 50, offset: 0 };
      const adminResult = await logService.listLogs(query, adminUserId);
      const memberResult = await logService.listLogs(query, memberUserId);

      expect(adminResult.success).toBe(true);
      expect(memberResult.success).toBe(true);

      if (adminResult.success && memberResult.success) {
        const adminSystemLogs = adminResult.data.logs.filter((log) => log.actor_type === "system");
        const memberSystemLogs = memberResult.data.logs.filter((log) => log.actor_type === "system");

        expect(adminSystemLogs.length).toBe(1);
        expect(memberSystemLogs.length).toBe(1);
        expect(adminSystemLogs[0].id).toBe(memberSystemLogs[0].id);
      }
    });

    it("should filter logs by actor_id", async () => {
      const query = { family_id: familyId, actor_id: memberUserId, limit: 50, offset: 0 };
      const result = await logService.listLogs(query, adminUserId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.logs.length).toBe(1);
        expect(result.data.logs[0].actor_id).toBe(memberUserId);
      }
    });

    it("should filter logs by action", async () => {
      const query = { family_id: familyId, action: "event.sync", limit: 50, offset: 0 };
      const result = await logService.listLogs(query, adminUserId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.logs.length).toBe(1);
        expect(result.data.logs[0].action).toBe("event.sync");
        expect(result.data.logs[0].actor_type).toBe("system");
      }
    });

    it("should filter logs by date range", async () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      await logRepo.create({
        family_id: familyId,
        actor_id: adminUserId,
        actor_type: "user",
        action: "event.create",
        details: null,
      });

      const query = {
        family_id: familyId,
        start_date: yesterday.toISOString().split("T")[0],
        end_date: tomorrow.toISOString().split("T")[0],
        limit: 50,
        offset: 0,
      };

      const result = await logService.listLogs(query, adminUserId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.logs.length).toBeGreaterThanOrEqual(3);
      }
    });

    it("should handle pagination correctly", async () => {
      for (let i = 0; i < 5; i++) {
        await logRepo.create({
          family_id: familyId,
          actor_id: adminUserId,
          actor_type: "user",
          action: `event.create.${i}`,
          details: null,
        });
      }

      const query1 = { family_id: familyId, limit: 3, offset: 0 };
      const result1 = await logService.listLogs(query1, adminUserId);

      expect(result1.success).toBe(true);
      if (result1.success) {
        expect(result1.data.logs.length).toBe(3);
        expect(result1.data.pagination.has_more).toBe(true);
        expect(result1.data.pagination.total).toBeGreaterThan(3);
      }

      const query2 = { family_id: familyId, limit: 3, offset: 3 };
      const result2 = await logService.listLogs(query2, adminUserId);

      expect(result2.success).toBe(true);
      if (result2.success) {
        expect(result2.data.logs.length).toBeGreaterThanOrEqual(1);
        expect(result2.data.pagination.offset).toBe(3);
      }
    });

    it("should return logs from all families when no family_id specified for admin", async () => {
      const otherFamily = await familyRepo.create({ name: "Other Family" });
      await familyRepo.addMember(otherFamily.id, adminUserId, "admin");

      await logRepo.create({
        family_id: otherFamily.id,
        actor_id: adminUserId,
        actor_type: "user",
        action: "event.create",
        details: null,
      });

      const query = { limit: 50, offset: 0 };
      const result = await logService.listLogs(query, adminUserId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.logs.length).toBeGreaterThan(0);
      }
    });

    it("should return logs from all families when no family_id specified for member", async () => {
      const otherFamily = await familyRepo.create({ name: "Other Family" });
      await familyRepo.addMember(otherFamily.id, memberUserId, "member");

      await logRepo.create({
        family_id: otherFamily.id,
        actor_id: memberUserId,
        actor_type: "user",
        action: "event.create",
        details: null,
      });

      const query = { limit: 50, offset: 0 };
      const result = await logService.listLogs(query, memberUserId);

      expect(result.success).toBe(true);
      if (result.success) {
        const userLogs = result.data.logs.filter((log) => log.actor_id === memberUserId);
        expect(userLogs.length).toBeGreaterThan(0);
      }
    });

    it("should return empty array when no logs match filters", async () => {
      const query = { family_id: familyId, action: "nonexistent.action", limit: 50, offset: 0 };
      const result = await logService.listLogs(query, adminUserId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.logs.length).toBe(0);
        expect(result.data.pagination.total).toBe(0);
        expect(result.data.pagination.has_more).toBe(false);
      }
    });

    it("should handle database errors gracefully", async () => {
      const brokenRepo = {
        findByFilters: async () => {
          throw new Error("Database connection failed");
        },
      } as unknown as typeof logRepo;

      const brokenService = new LogService(brokenRepo, familyRepo);
      const query = { family_id: familyId, limit: 50, offset: 0 };
      const result = await brokenService.listLogs(query, adminUserId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(DomainError);
        expect(result.error.statusCode).toBe(500);
        expect(result.error.message).toContain("Failed to retrieve logs");
      }
    });

    it("should return logs ordered by created_at descending", async () => {
      const now = new Date();
      const earlier = new Date(now.getTime() - 1000);

      await logRepo.create({
        family_id: familyId,
        actor_id: adminUserId,
        actor_type: "user",
        action: "event.create.old",
        details: null,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await logRepo.create({
        family_id: familyId,
        actor_id: adminUserId,
        actor_type: "user",
        action: "event.create.new",
        details: null,
      });

      const query = { family_id: familyId, limit: 50, offset: 0 };
      const result = await logService.listLogs(query, adminUserId);

      expect(result.success).toBe(true);
      if (result.success && result.data.logs.length >= 2) {
        const firstLog = result.data.logs[0];
        const secondLog = result.data.logs[1];
        const firstDate = new Date(firstLog.created_at).getTime();
        const secondDate = new Date(secondLog.created_at).getTime();
        expect(firstDate).toBeGreaterThanOrEqual(secondDate);
      }
    });

    it("should correctly calculate has_more for pagination", async () => {
      for (let i = 0; i < 10; i++) {
        await logRepo.create({
          family_id: familyId,
          actor_id: adminUserId,
          actor_type: "user",
          action: `event.create.${i}`,
          details: null,
        });
      }

      const query = { family_id: familyId, limit: 5, offset: 0 };
      const result = await logService.listLogs(query, adminUserId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.logs.length).toBe(5);
        expect(result.data.pagination.has_more).toBe(result.data.pagination.total > 5);
      }
    });
  });
});
