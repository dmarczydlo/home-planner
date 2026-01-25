import { describe, it, expect, beforeEach } from "vitest";
import type { APIContext } from "astro";
import { GET, POST } from "./index";
import { InMemoryFamilyRepository } from "@/repositories/implementations/in-memory/InMemoryFamilyRepository";
import { InMemoryChildRepository } from "@/repositories/implementations/in-memory/InMemoryChildRepository";
import { InMemoryLogRepository } from "@/repositories/implementations/in-memory/InMemoryLogRepository";
import { createInMemoryRepositories } from "@/repositories/factory";

describe("GET /api/families/[familyId]/children", () => {
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

  it("should return 200 with children list for authenticated member", async () => {
    await childRepo.create({ family_id: familyId, name: "Alice" });
    await childRepo.create({ family_id: familyId, name: "Bob" });

    const context = createMockContext({ userId });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("children");
    expect(Array.isArray(data.children)).toBe(true);
    expect(data.children.length).toBe(2);
    expect(data.children[0]).toHaveProperty("id");
    expect(data.children[0]).toHaveProperty("family_id");
    expect(data.children[0]).toHaveProperty("name");
    expect(data.children[0]).toHaveProperty("created_at");
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

  it("should return empty children array when family has no children", async () => {
    const context = createMockContext({ userId });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.children).toHaveLength(0);
    expect(Array.isArray(data.children)).toBe(true);
  });

  it("should return children ordered by created_at ascending", async () => {
    const child1 = await childRepo.create({ family_id: familyId, name: "First" });
    await new Promise((resolve) => setTimeout(resolve, 10));
    const child2 = await childRepo.create({ family_id: familyId, name: "Second" });

    const context = createMockContext({ userId });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.children.length).toBe(2);
    const createdDates = data.children.map((c: { created_at: string }) => new Date(c.created_at).getTime());
    const sortedDates = [...createdDates].sort((a: number, b: number) => a - b);
    expect(createdDates).toEqual(sortedDates);
    expect(data.children[0].id).toBe(child1.id);
    expect(data.children[1].id).toBe(child2.id);
  });

  it("should include all required child fields in response", async () => {
    await childRepo.create({ family_id: familyId, name: "Test Child" });

    const context = createMockContext({ userId });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.children.length).toBe(1);

    const child = data.children[0];
    expect(child).toHaveProperty("id");
    expect(child).toHaveProperty("family_id");
    expect(child).toHaveProperty("name");
    expect(child).toHaveProperty("created_at");
    expect(child.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(child.family_id).toBe(familyId);
    expect(child.name).toBe("Test Child");
    expect(child.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it("should validate response schema", async () => {
    await childRepo.create({ family_id: familyId, name: "Schema Test" });

    const context = createMockContext({ userId });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("children");
    expect(Array.isArray(data.children)).toBe(true);
  });
});

describe("POST /api/families/[familyId]/children", () => {
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
  });

  function createMockContext(params: { familyId?: string; userId?: string; body?: unknown }): APIContext {
    return {
      params: { familyId: params.familyId ?? familyId },
      request: new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: params.body ? JSON.stringify(params.body) : undefined,
      }),
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

  it("should create child and return 201 with child data", async () => {
    const context = createMockContext({
      userId,
      body: { name: "Alice" },
    });
    const response = await POST(context);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("family_id");
    expect(data).toHaveProperty("name");
    expect(data).toHaveProperty("created_at");
    expect(data.family_id).toBe(familyId);
    expect(data.name).toBe("Alice");
    expect(data.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it("should return 401 when not authenticated", async () => {
    const context = createMockContext({
      userId: undefined,
      body: { name: "Alice" },
    });
    const response = await POST(context);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("unauthorized");
  });

  it("should return 403 when user is not a member", async () => {
    const context = createMockContext({
      userId: otherUserId,
      body: { name: "Alice" },
    });
    const response = await POST(context);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("forbidden");
  });

  it("should return 400 when name is missing", async () => {
    const context = createMockContext({
      userId,
      body: {},
    });
    const response = await POST(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("validation");
    expect(data).toHaveProperty("details");
    expect(data.details).toHaveProperty("name");
  });

  it("should return 400 when name is empty string", async () => {
    const context = createMockContext({
      userId,
      body: { name: "" },
    });
    const response = await POST(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("validation");
  });

  it("should return 400 when name is only whitespace", async () => {
    const context = createMockContext({
      userId,
      body: { name: "   " },
    });
    const response = await POST(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("validation");
  });

  it("should return 400 when name exceeds 100 characters", async () => {
    const longName = "a".repeat(101);
    const context = createMockContext({
      userId,
      body: { name: longName },
    });
    const response = await POST(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("validation");
    expect(data).toHaveProperty("details");
    expect(data.details).toHaveProperty("name");
    expect(data.details.name).toContain("100");
  });

  it("should trim whitespace from name", async () => {
    const context = createMockContext({
      userId,
      body: { name: "  Alice  " },
    });
    const response = await POST(context);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.name).toBe("Alice");
  });

  it("should return 400 when family ID is invalid UUID", async () => {
    const context = createMockContext({
      familyId: "invalid-id",
      userId,
      body: { name: "Alice" },
    });
    const response = await POST(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("validation");
  });

  it("should return 404 when family does not exist", async () => {
    const fakeId = "550e8400-e29b-41d4-a716-446655440000";
    const context = createMockContext({
      familyId: fakeId,
      userId,
      body: { name: "Alice" },
    });
    const response = await POST(context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("notfound");
  });

  it("should return 400 when request body is invalid JSON", async () => {
    const context = {
      params: { familyId },
      request: new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      }),
      locals: {
        user: { id: userId, email: "test@example.com" },
        repositories: {
          family: familyRepo,
          child: childRepo,
          log: logRepo,
        },
      },
    } as unknown as APIContext;

    const response = await POST(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("validation");
  });

  it("should create child with valid name", async () => {
    const context = createMockContext({
      userId,
      body: { name: "Bob" },
    });
    const response = await POST(context);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.name).toBe("Bob");

    const children = await childRepo.findByFamilyId(familyId);
    expect(children.length).toBe(1);
    expect(children[0].name).toBe("Bob");
  });

  it("should validate response schema", async () => {
    const context = createMockContext({
      userId,
      body: { name: "Test Child" },
    });
    const response = await POST(context);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("family_id");
    expect(data).toHaveProperty("name");
    expect(data).toHaveProperty("created_at");
    expect(data.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(data.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
