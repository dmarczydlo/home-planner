import { describe, it, expect, beforeEach } from "vitest";
import type { APIContext } from "astro";
import { GET } from "./index";
import { InMemoryFamilyRepository } from "@/repositories/implementations/in-memory/InMemoryFamilyRepository";
import { InMemoryLogRepository } from "@/repositories/implementations/in-memory/InMemoryLogRepository";
import { createInMemoryRepositories } from "@/repositories/factory";

describe("GET /api/logs", () => {
  let familyRepo: InMemoryFamilyRepository;
  let logRepo: InMemoryLogRepository;
  let userId: string;
  let adminUserId: string;
  let memberUserId: string;
  let familyId: string;
  let otherFamilyId: string;

  beforeEach(async () => {
    const repos = createInMemoryRepositories();
    familyRepo = repos.family as InMemoryFamilyRepository;
    logRepo = repos.log as InMemoryLogRepository;

    userId = "550e8400-e29b-41d4-a716-446655440001";
    adminUserId = "550e8400-e29b-41d4-a716-446655440002";
    memberUserId = "550e8400-e29b-41d4-a716-446655440003";

    const family = await familyRepo.create({ name: "Test Family" });
    familyId = family.id;
    await familyRepo.addMember(familyId, adminUserId, "admin");
    await familyRepo.addMember(familyId, memberUserId, "member");

    const otherFamily = await familyRepo.create({ name: "Other Family" });
    otherFamilyId = otherFamily.id;

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
  });

  function createMockContext(params: {
    userId?: string;
    queryParams?: Record<string, string>;
  }): APIContext {
    const queryString = params.queryParams
      ? "?" + new URLSearchParams(params.queryParams).toString()
      : "";
    const url = new URL(`http://localhost/api/logs${queryString}`);

    return {
      url,
      locals: {
        user: params.userId ? { id: params.userId, email: "test@example.com" } : undefined,
        repositories: {
          family: familyRepo,
          log: logRepo,
        },
      },
    } as unknown as APIContext;
  }

  it("should return 200 with logs for authenticated admin user", async () => {
    const context = createMockContext({
      userId: adminUserId,
      queryParams: { family_id: familyId },
    });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("logs");
    expect(data).toHaveProperty("pagination");
    expect(Array.isArray(data.logs)).toBe(true);
    expect(data.logs.length).toBeGreaterThan(0);
    expect(data.pagination).toHaveProperty("total");
    expect(data.pagination).toHaveProperty("limit");
    expect(data.pagination).toHaveProperty("offset");
    expect(data.pagination).toHaveProperty("has_more");
  });

  it("should return 401 when not authenticated", async () => {
    const context = createMockContext({
      userId: undefined,
      queryParams: { family_id: familyId },
    });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("unauthorized");
    expect(data.message).toContain("Missing or invalid JWT token");
  });

  it("should return 403 when user is not a member of specified family", async () => {
    const context = createMockContext({
      userId: userId,
      queryParams: { family_id: otherFamilyId },
    });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("forbidden");
    expect(data.message).toContain("do not have access");
  });

  it("should return 400 when limit is invalid", async () => {
    const context = createMockContext({
      userId: adminUserId,
      queryParams: { family_id: familyId, limit: "invalid" },
    });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("validation");
  });

  it("should return 400 when limit exceeds maximum", async () => {
    const context = createMockContext({
      userId: adminUserId,
      queryParams: { family_id: familyId, limit: "101" },
    });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("validation");
  });

  it("should return 400 when offset is negative", async () => {
    const context = createMockContext({
      userId: adminUserId,
      queryParams: { family_id: familyId, offset: "-1" },
    });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("validation");
  });

  it("should return 400 when end_date is before start_date", async () => {
    const context = createMockContext({
      userId: adminUserId,
      queryParams: {
        family_id: familyId,
        start_date: "2024-01-15",
        end_date: "2024-01-10",
      },
    });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("validation");
    expect(data.details).toHaveProperty("end_date");
  });

  it("should return 400 when family_id is invalid UUID", async () => {
    const context = createMockContext({
      userId: adminUserId,
      queryParams: { family_id: "invalid-uuid" },
    });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("validation");
  });

  it("should filter logs by actor_id", async () => {
    const context = createMockContext({
      userId: adminUserId,
      queryParams: { family_id: familyId, actor_id: memberUserId },
    });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.logs.length).toBe(1);
    expect(data.logs[0].actor_id).toBe(memberUserId);
  });

  it("should filter logs by action", async () => {
    const context = createMockContext({
      userId: adminUserId,
      queryParams: { family_id: familyId, action: "event.sync" },
    });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.logs.length).toBe(1);
    expect(data.logs[0].action).toBe("event.sync");
    expect(data.logs[0].actor_type).toBe("system");
  });

  it("should filter logs by date range", async () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const context = createMockContext({
      userId: adminUserId,
      queryParams: {
        family_id: familyId,
        start_date: yesterday.toISOString().split("T")[0],
        end_date: tomorrow.toISOString().split("T")[0],
      },
    });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.logs.length).toBeGreaterThan(0);
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

    const context = createMockContext({
      userId: adminUserId,
      queryParams: { family_id: familyId, limit: "3", offset: "0" },
    });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.logs.length).toBe(3);
    expect(data.pagination.limit).toBe(3);
    expect(data.pagination.offset).toBe(0);
    expect(data.pagination.has_more).toBe(data.pagination.total > 3);
  });

  it("should return only own actions and system actions for regular member", async () => {
    const context = createMockContext({
      userId: memberUserId,
      queryParams: { family_id: familyId },
    });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.logs.length).toBe(2);
    const actorIds = data.logs.map((log: { actor_id: string | null }) => log.actor_id);
    const actorTypes = data.logs.map((log: { actor_type: string }) => log.actor_type);
    expect(actorIds).toContain(memberUserId);
    expect(actorTypes).toContain("system");
    expect(actorIds).not.toContain(adminUserId);
  });

  it("should return all logs for admin user", async () => {
    const context = createMockContext({
      userId: adminUserId,
      queryParams: { family_id: familyId },
    });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.logs.length).toBe(3);
    const actorIds = data.logs.map((log: { actor_id: string | null }) => log.actor_id);
    expect(actorIds).toContain(adminUserId);
    expect(actorIds).toContain(memberUserId);
    expect(actorIds).toContain(null);
  });

  it("should return logs from all families when no family_id specified", async () => {
    const otherFamily = await familyRepo.create({ name: "Another Family" });
    await familyRepo.addMember(otherFamily.id, adminUserId, "admin");

    await logRepo.create({
      family_id: otherFamily.id,
      actor_id: adminUserId,
      actor_type: "user",
      action: "event.create",
      details: null,
    });

    const context = createMockContext({
      userId: adminUserId,
      queryParams: {},
    });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.logs.length).toBeGreaterThan(0);
  });

  it("should use default limit and offset when not provided", async () => {
    const context = createMockContext({
      userId: adminUserId,
      queryParams: { family_id: familyId },
    });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination.limit).toBe(50);
    expect(data.pagination.offset).toBe(0);
  });

  it("should return logs ordered by created_at descending", async () => {
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

    const context = createMockContext({
      userId: adminUserId,
      queryParams: { family_id: familyId },
    });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    if (data.logs.length >= 2) {
      const firstDate = new Date(data.logs[0].created_at).getTime();
      const secondDate = new Date(data.logs[1].created_at).getTime();
      expect(firstDate).toBeGreaterThanOrEqual(secondDate);
    }
  });

  it("should return correct log structure", async () => {
    const context = createMockContext({
      userId: adminUserId,
      queryParams: { family_id: familyId },
    });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    if (data.logs.length > 0) {
      const log = data.logs[0];
      expect(log).toHaveProperty("id");
      expect(log).toHaveProperty("family_id");
      expect(log).toHaveProperty("actor_id");
      expect(log).toHaveProperty("actor_type");
      expect(log).toHaveProperty("action");
      expect(log).toHaveProperty("details");
      expect(log).toHaveProperty("created_at");
      expect(["user", "system"]).toContain(log.actor_type);
      expect(typeof log.id).toBe("number");
      expect(typeof log.action).toBe("string");
      expect(typeof log.created_at).toBe("string");
    }
  });

  it("should return empty logs array when no logs match filters", async () => {
    const context = createMockContext({
      userId: adminUserId,
      queryParams: { family_id: familyId, action: "nonexistent.action" },
    });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.logs.length).toBe(0);
    expect(data.pagination.total).toBe(0);
    expect(data.pagination.has_more).toBe(false);
  });

  it("should handle multiple query parameters together", async () => {
    const context = createMockContext({
      userId: adminUserId,
      queryParams: {
        family_id: familyId,
        actor_id: memberUserId,
        action: "event.create",
        limit: "10",
        offset: "0",
      },
    });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.logs.length).toBe(1);
    expect(data.logs[0].actor_id).toBe(memberUserId);
    expect(data.logs[0].action).toBe("event.create");
  });
});

