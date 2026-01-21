import { describe, it, expect, beforeEach } from "vitest";
import type { APIContext } from "astro";
import { PATCH, DELETE } from "./[childId]";
import { InMemoryFamilyRepository } from "@/repositories/implementations/in-memory/InMemoryFamilyRepository";
import { InMemoryChildRepository } from "@/repositories/implementations/in-memory/InMemoryChildRepository";
import { InMemoryLogRepository } from "@/repositories/implementations/in-memory/InMemoryLogRepository";
import { createInMemoryRepositories } from "@/repositories/factory";

describe("PATCH /api/families/[familyId]/children/[childId]", () => {
  let familyRepo: InMemoryFamilyRepository;
  let childRepo: InMemoryChildRepository;
  let logRepo: InMemoryLogRepository;
  let userId: string;
  let familyId: string;
  let otherUserId: string;
  let otherFamilyId: string;
  let childId: string;

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

    const otherFamily = await familyRepo.create({ name: "The Jones" });
    otherFamilyId = otherFamily.id;
    await familyRepo.addMember(otherFamilyId, otherUserId, "admin");

    const child = await childRepo.create({ family_id: familyId, name: "Alice" });
    childId = child.id;
  });

  function createMockContext(params: {
    familyId?: string;
    childId?: string;
    userId?: string;
    body?: unknown;
  }): APIContext {
    return {
      params: {
        familyId: params.familyId ?? familyId,
        childId: params.childId ?? childId,
      },
      request: new Request("http://localhost", {
        method: "PATCH",
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

  it("should update child and return 200 with updated child data", async () => {
    const context = createMockContext({
      userId,
      body: { name: "Alice Updated" },
    });
    const response = await PATCH(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("family_id");
    expect(data).toHaveProperty("name");
    expect(data).toHaveProperty("created_at");
    expect(data).toHaveProperty("updated_at");
    expect(data.id).toBe(childId);
    expect(data.name).toBe("Alice Updated");
    expect(data.updated_at).toBeDefined();
  });

  it("should return 401 when not authenticated", async () => {
    const context = createMockContext({
      userId: undefined,
      body: { name: "Updated" },
    });
    const response = await PATCH(context);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("unauthorized");
  });

  it("should return 403 when user is not a member", async () => {
    const context = createMockContext({
      userId: otherUserId,
      body: { name: "Updated" },
    });
    const response = await PATCH(context);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("forbidden");
  });

  it("should return 404 when child does not exist", async () => {
    const fakeId = "550e8400-e29b-41d4-a716-446655440000";
    const context = createMockContext({
      childId: fakeId,
      userId,
      body: { name: "Updated" },
    });
    const response = await PATCH(context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("notfound");
  });

  it("should return 404 when child belongs to different family", async () => {
    const otherChild = await childRepo.create({ family_id: otherFamilyId, name: "Other Child" });

    const context = createMockContext({
      childId: otherChild.id,
      userId,
      body: { name: "Updated" },
    });
    const response = await PATCH(context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("notfound");
  });

  it("should return 400 when name is empty string", async () => {
    const context = createMockContext({
      userId,
      body: { name: "" },
    });
    const response = await PATCH(context);
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
    const response = await PATCH(context);
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
    const response = await PATCH(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("validation");
  });

  it("should allow empty body (no updates)", async () => {
    const context = createMockContext({
      userId,
      body: {},
    });
    const response = await PATCH(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.name).toBe("Alice");
  });

  it("should trim whitespace from name", async () => {
    const context = createMockContext({
      userId,
      body: { name: "  Bob  " },
    });
    const response = await PATCH(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.name).toBe("Bob");
  });

  it("should return 400 when family ID is invalid UUID", async () => {
    const context = createMockContext({
      familyId: "invalid-id",
      userId,
      body: { name: "Updated" },
    });
    const response = await PATCH(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("validation");
  });

  it("should return 400 when child ID is invalid UUID", async () => {
    const context = createMockContext({
      childId: "invalid-id",
      userId,
      body: { name: "Updated" },
    });
    const response = await PATCH(context);
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
      body: { name: "Updated" },
    });
    const response = await PATCH(context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("notfound");
  });

  it("should update child name successfully", async () => {
    const context = createMockContext({
      userId,
      body: { name: "Bob" },
    });
    const response = await PATCH(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.name).toBe("Bob");

    const updated = await childRepo.findById(childId);
    expect(updated?.name).toBe("Bob");
  });

  it("should validate response schema", async () => {
    const context = createMockContext({
      userId,
      body: { name: "Test Child" },
    });
    const response = await PATCH(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("family_id");
    expect(data).toHaveProperty("name");
    expect(data).toHaveProperty("created_at");
    expect(data).toHaveProperty("updated_at");
    expect(data.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(data.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

describe("DELETE /api/families/[familyId]/children/[childId]", () => {
  let familyRepo: InMemoryFamilyRepository;
  let childRepo: InMemoryChildRepository;
  let logRepo: InMemoryLogRepository;
  let userId: string;
  let familyId: string;
  let otherUserId: string;
  let otherFamilyId: string;
  let childId: string;

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

    const otherFamily = await familyRepo.create({ name: "The Jones" });
    otherFamilyId = otherFamily.id;
    await familyRepo.addMember(otherFamilyId, otherUserId, "admin");

    const child = await childRepo.create({ family_id: familyId, name: "Alice" });
    childId = child.id;
  });

  function createMockContext(params: { familyId?: string; childId?: string; userId?: string }): APIContext {
    return {
      params: {
        familyId: params.familyId ?? familyId,
        childId: params.childId ?? childId,
      },
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

  it("should delete child and return 204", async () => {
    const context = createMockContext({ userId });
    const response = await DELETE(context);

    expect(response.status).toBe(204);
    expect(response.body).toBeNull();

    const deleted = await childRepo.findById(childId);
    expect(deleted).toBeNull();
  });

  it("should return 401 when not authenticated", async () => {
    const context = createMockContext({ userId: undefined });
    const response = await DELETE(context);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("unauthorized");
  });

  it("should return 403 when user is not a member", async () => {
    const context = createMockContext({ userId: otherUserId });
    const response = await DELETE(context);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("forbidden");
  });

  it("should return 404 when child does not exist", async () => {
    const fakeId = "550e8400-e29b-41d4-a716-446655440000";
    const context = createMockContext({ childId: fakeId, userId });
    const response = await DELETE(context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("notfound");
  });

  it("should return 404 when child belongs to different family", async () => {
    const otherChild = await childRepo.create({ family_id: otherFamilyId, name: "Other Child" });

    const context = createMockContext({ childId: otherChild.id, userId });
    const response = await DELETE(context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("notfound");
  });

  it("should return 400 when family ID is invalid UUID", async () => {
    const context = createMockContext({ familyId: "invalid-id", userId });
    const response = await DELETE(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("validation");
  });

  it("should return 400 when child ID is invalid UUID", async () => {
    const context = createMockContext({ childId: "invalid-id", userId });
    const response = await DELETE(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("validation");
  });

  it("should return 404 when family does not exist", async () => {
    const fakeId = "550e8400-e29b-41d4-a716-446655440000";
    const context = createMockContext({ familyId: fakeId, userId });
    const response = await DELETE(context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("notfound");
  });

  it("should delete child successfully", async () => {
    const child = await childRepo.create({ family_id: familyId, name: "To Delete" });
    const context = createMockContext({ childId: child.id, userId });
    const response = await DELETE(context);

    expect(response.status).toBe(204);

    const deleted = await childRepo.findById(child.id);
    expect(deleted).toBeNull();

    const remaining = await childRepo.findByFamilyId(familyId);
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe(childId);
  });
});
