import { describe, it, expect, beforeEach } from "vitest";
import type { APIContext } from "astro";
import { GET } from "./members";
import { InMemoryFamilyRepository } from "@/repositories/implementations/in-memory/InMemoryFamilyRepository";
import { InMemoryChildRepository } from "@/repositories/implementations/in-memory/InMemoryChildRepository";
import { InMemoryLogRepository } from "@/repositories/implementations/in-memory/InMemoryLogRepository";
import { createInMemoryRepositories } from "@/repositories/factory";

describe("GET /api/families/[familyId]/members", () => {
  let familyRepo: InMemoryFamilyRepository;
  let childRepo: InMemoryChildRepository;
  let logRepo: InMemoryLogRepository;
  let userId: string;
  let familyId: string;
  let otherUserId: string;

  beforeEach(async () => {
    const repos = createInMemoryRepositories();
    familyRepo = repos.family as InMemoryFamilyRepository;
    childRepo = repos.child as InMemoryChildRepository;
    logRepo = repos.log as InMemoryLogRepository;

    userId = "550e8400-e29b-41d4-a716-446655440001";
    otherUserId = "550e8400-e29b-41d4-a716-446655440002";

    const family = await familyRepo.create({ name: "The Smiths" });
    familyId = family.id;
    await familyRepo.addMember(familyId, userId, "admin");
    familyRepo.setUser(userId, { full_name: "John Doe", avatar_url: "https:
  });

  function createMockContext(params: { familyId?: string; userId?: string }): APIContext {
    return {
      params: { familyId: params.familyId ?? familyId },
      locals: {
        user: params.userId ? { id: params.userId, email: "test@example.com" } : undefined,
        repositories: {
          family: familyRepo,
          child: childRepo,
          log: logRepo,
        },
      },
    } as unknown as APIContext;
  }

  it("should return 200 with members list for authenticated member", async () => {
    const memberUserId = "550e8400-e29b-41d4-a716-446655440003";
    await familyRepo.addMember(familyId, memberUserId, "member");
    familyRepo.setUser(memberUserId, { full_name: "Jane Doe", avatar_url: null });

    const context = createMockContext({ userId });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("members");
    expect(Array.isArray(data.members)).toBe(true);
    expect(data.members.length).toBeGreaterThanOrEqual(1);
    expect(data.members[0]).toHaveProperty("user_id");
    expect(data.members[0]).toHaveProperty("full_name");
    expect(data.members[0]).toHaveProperty("avatar_url");
    expect(data.members[0]).toHaveProperty("role");
    expect(data.members[0]).toHaveProperty("joined_at");
  });

  it("should return 401 when not authenticated", async () => {
    const context = createMockContext({ userId: undefined });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("unauthorized");
  });

  it("should return 403 when user is not a member", async () => {
    const context = createMockContext({ userId: otherUserId });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("forbidden");
    expect(data.message).toContain("do not have access");
  });

  it("should return 400 when family ID is missing", async () => {
    const context = {
      params: {},
      locals: {
        user: { id: userId, email: "test@example.com" },
        repositories: {
          family: familyRepo,
          child: childRepo,
          log: logRepo,
        },
      },
    } as unknown as APIContext;
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("validation");
  });

  it("should return 400 when family ID is invalid UUID", async () => {
    const context = createMockContext({ familyId: "invalid-id", userId });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("validation");
    expect(data.message).toContain("Invalid path parameters");
  });

  it("should return 404 when family does not exist", async () => {
    const fakeId = "550e8400-e29b-41d4-a716-446655440000";
    const context = createMockContext({ familyId: fakeId, userId });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("notfound");
  });

  it("should return empty members array when family has only one member", async () => {
    const context = createMockContext({ userId });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.members).toHaveLength(1);
    expect(data.members[0].user_id).toBe(userId);
  });

  it("should return members ordered by joined_at ascending", async () => {
    const member1Id = "550e8400-e29b-41d4-a716-446655440004";
    const member2Id = "550e8400-e29b-41d4-a716-446655440005";

    await familyRepo.addMember(familyId, member1Id, "member");
    await new Promise((resolve) => setTimeout(resolve, 10));
    await familyRepo.addMember(familyId, member2Id, "member");

    familyRepo.setUser(member1Id, { full_name: "Member 1", avatar_url: null });
    familyRepo.setUser(member2Id, { full_name: "Member 2", avatar_url: null });

    const context = createMockContext({ userId });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.members.length).toBeGreaterThanOrEqual(3);

    const joinedDates = data.members.map((m: { joined_at: string }) => new Date(m.joined_at).getTime());
    const sortedDates = [...joinedDates].sort((a: number, b: number) => a - b);
    expect(joinedDates).toEqual(sortedDates);
  });

  it("should include all required member fields in response", async () => {
    const context = createMockContext({ userId });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.members.length).toBeGreaterThan(0);

    const member = data.members[0];
    expect(member).toHaveProperty("user_id");
    expect(member).toHaveProperty("full_name");
    expect(member).toHaveProperty("avatar_url");
    expect(member).toHaveProperty("role");
    expect(member).toHaveProperty("joined_at");
    expect(["admin", "member"]).toContain(member.role);
    expect(typeof member.joined_at).toBe("string");
  });

  it("should handle members with null full_name and avatar_url", async () => {
    const memberUserId = "550e8400-e29b-41d4-a716-446655440006";
    await familyRepo.addMember(familyId, memberUserId, "member");
    familyRepo.setUser(memberUserId, { full_name: null, avatar_url: null });

    const context = createMockContext({ userId });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    const member = data.members.find((m: { user_id: string }) => m.user_id === memberUserId);
    expect(member).toBeDefined();
    if (member) {
      expect(member.full_name).toBeNull();
      expect(member.avatar_url).toBeNull();
    }
  });

  it("should validate response schema", async () => {
    const context = createMockContext({ userId });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("members");
    expect(Array.isArray(data.members)).toBe(true);

    if (data.members.length > 0) {
      const member = data.members[0];
      expect(member.user_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(member.joined_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    }
  });
});
