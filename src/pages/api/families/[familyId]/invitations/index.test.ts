import { describe, it, expect, beforeEach } from "vitest";
import type { APIContext } from "astro";
import { GET, POST } from "./index";
import { createInMemoryRepositories } from "@/repositories/factory";
import { InMemoryFamilyRepository } from "@/repositories/implementations/in-memory/InMemoryFamilyRepository";
import { InMemoryInvitationRepository } from "@/repositories/implementations/in-memory/InMemoryInvitationRepository";
import { InMemoryUserRepository } from "@/repositories/implementations/in-memory/InMemoryUserRepository";
import { InMemoryLogRepository } from "@/repositories/implementations/in-memory/InMemoryLogRepository";
import type { InvitationEntity } from "@/types";

describe("GET /api/families/[familyId]/invitations", () => {
  let familyRepo: InMemoryFamilyRepository;
  let invitationRepo: InMemoryInvitationRepository;
  let userRepo: InMemoryUserRepository;
  let logRepo: InMemoryLogRepository;
  let userId: string;
  let familyId: string;
  let otherUserId: string;

  beforeEach(async () => {
    const repos = createInMemoryRepositories();
    familyRepo = repos.family as InMemoryFamilyRepository;
    invitationRepo = repos.invitation as InMemoryInvitationRepository;
    userRepo = repos.user as InMemoryUserRepository;
    logRepo = repos.log as InMemoryLogRepository;

    userId = "550e8400-e29b-41d4-a716-446655440001";
    otherUserId = "550e8400-e29b-41d4-a716-446655440002";

    const family = await familyRepo.create({ name: "The Smiths" });
    familyId = family.id;
    await familyRepo.addMember(familyId, userId, "admin");

    userRepo.seed({ id: userId, full_name: "John Doe", avatar_url: null, updated_at: null }, [], "john@example.com");
  });

  function createMockContext(params: { familyId?: string; userId?: string; status?: string }): APIContext {
    const url = new URL("http://localhost");
    if (params.status) {
      url.searchParams.set("status", params.status);
    }

    return {
      params: { familyId: params.familyId ?? familyId },
      url,
      locals: {
        user: params.userId ? { id: params.userId, email: "test@example.com" } : undefined,
        repositories: {
          family: familyRepo,
          invitation: invitationRepo,
          user: userRepo,
          log: logRepo,
        },
      },
    } as unknown as APIContext;
  }

  it("should return 200 with invitations list for authenticated member", async () => {
    const invitation1: InvitationEntity = {
      id: crypto.randomUUID(),
      family_id: familyId,
      invited_by: userId,
      invitee_email: "alice@example.com",
      token: "token1",
      status: "pending",
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    };
    invitationRepo.addInvitation(invitation1);

    const context = createMockContext({ userId });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("invitations");
    expect(Array.isArray(data.invitations)).toBe(true);
    expect(data.invitations.length).toBe(1);
    expect(data.invitations[0]).toHaveProperty("id");
    expect(data.invitations[0]).toHaveProperty("family_id");
    expect(data.invitations[0]).toHaveProperty("invitee_email");
    expect(data.invitations[0]).toHaveProperty("status");
    expect(data.invitations[0]).toHaveProperty("invited_by");
    expect(data.invitations[0].invited_by).toHaveProperty("id");
    expect(data.invitations[0].invited_by).toHaveProperty("full_name");
  });

  it("should filter invitations by status", async () => {
    const pendingInvitation: InvitationEntity = {
      id: crypto.randomUUID(),
      family_id: familyId,
      invited_by: userId,
      invitee_email: "alice@example.com",
      token: "token1",
      status: "pending",
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    };
    const acceptedInvitation: InvitationEntity = {
      id: crypto.randomUUID(),
      family_id: familyId,
      invited_by: userId,
      invitee_email: "bob@example.com",
      token: "token2",
      status: "accepted",
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    };
    invitationRepo.addInvitation(pendingInvitation);
    invitationRepo.addInvitation(acceptedInvitation);

    const context = createMockContext({ userId, status: "pending" });
    const response = await GET(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.invitations.length).toBe(1);
    expect(data.invitations[0].status).toBe("pending");
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

  it("should return 400 when family ID is invalid", async () => {
    const context = {
      params: { familyId: "invalid-id" },
      url: new URL("http://localhost"),
      locals: {
        user: { id: userId, email: "test@example.com" },
        repositories: {
          family: familyRepo,
          invitation: invitationRepo,
          user: userRepo,
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

  it("should return 400 when status is invalid", async () => {
    const url = new URL("http://localhost");
    url.searchParams.set("status", "invalid-status");

    const context = {
      params: { familyId },
      url,
      locals: {
        user: { id: userId, email: "test@example.com" },
        repositories: {
          family: familyRepo,
          invitation: invitationRepo,
          user: userRepo,
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
});

describe("POST /api/families/[familyId]/invitations", () => {
  let familyRepo: InMemoryFamilyRepository;
  let invitationRepo: InMemoryInvitationRepository;
  let userRepo: InMemoryUserRepository;
  let logRepo: InMemoryLogRepository;
  let userId: string;
  let familyId: string;
  let otherUserId: string;

  beforeEach(async () => {
    const repos = createInMemoryRepositories();
    familyRepo = repos.family as InMemoryFamilyRepository;
    invitationRepo = repos.invitation as InMemoryInvitationRepository;
    userRepo = repos.user as InMemoryUserRepository;
    logRepo = repos.log as InMemoryLogRepository;

    userId = "550e8400-e29b-41d4-a716-446655440001";
    otherUserId = "550e8400-e29b-41d4-a716-446655440002";

    const family = await familyRepo.create({ name: "The Smiths" });
    familyId = family.id;
    await familyRepo.addMember(familyId, userId, "admin");

    userRepo.seed({ id: userId, full_name: "John Doe", avatar_url: null, updated_at: null }, [], "john@example.com");
  });

  function createMockContext(params: {
    familyId?: string;
    userId?: string;
    body?: { invitee_email: string };
  }): APIContext {
    return {
      params: { familyId: params.familyId ?? familyId },
      request: new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params.body ?? { invitee_email: "alice@example.com" }),
      }),
      locals: {
        user: params.userId ? { id: params.userId, email: "test@example.com" } : undefined,
        repositories: {
          family: familyRepo,
          invitation: invitationRepo,
          user: userRepo,
          log: logRepo,
        },
      },
    } as unknown as APIContext;
  }

  it("should return 201 with created invitation", async () => {
    const context = createMockContext({ userId });
    const response = await POST(context);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("family_id");
    expect(data).toHaveProperty("invited_by");
    expect(data).toHaveProperty("invitee_email");
    expect(data).toHaveProperty("token");
    expect(data).toHaveProperty("status");
    expect(data).toHaveProperty("expires_at");
    expect(data).toHaveProperty("created_at");
    expect(data).toHaveProperty("invitation_url");
    expect(data.invitee_email).toBe("alice@example.com");
    expect(data.status).toBe("pending");
    expect(data.invitation_url).toContain(data.token);
  });

  it("should return 401 when not authenticated", async () => {
    const context = createMockContext({ userId: undefined });
    const response = await POST(context);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("unauthorized");
  });

  it("should return 403 when user is not a member", async () => {
    const context = createMockContext({ userId: otherUserId });
    const response = await POST(context);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("forbidden");
    expect(data.message).toContain("do not have access");
  });

  it("should return 400 when family ID is invalid", async () => {
    const context = createMockContext({ familyId: "invalid-id", userId });
    const response = await POST(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("validation");
  });

  it("should return 400 when email is invalid", async () => {
    const context = createMockContext({
      userId,
      body: { invitee_email: "invalid-email" },
    });
    const response = await POST(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("validation");
  });

  it("should return 400 when email is missing", async () => {
    const context = {
      params: { familyId },
      request: new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
      locals: {
        user: { id: userId, email: "test@example.com" },
        repositories: {
          family: familyRepo,
          invitation: invitationRepo,
          user: userRepo,
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

  it("should return 409 when pending invitation already exists", async () => {
    const existingInvitation: InvitationEntity = {
      id: crypto.randomUUID(),
      family_id: familyId,
      invited_by: userId,
      invitee_email: "alice@example.com",
      token: "existing-token",
      status: "pending",
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    };
    invitationRepo.addInvitation(existingInvitation);

    const context = createMockContext({
      userId,
      body: { invitee_email: "alice@example.com" },
    });
    const response = await POST(context);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("conflict");
    expect(data.message).toContain("pending invitation already exists");
  });

  it("should return 400 when user already a member", async () => {
    const existingUser = await userRepo.create({
      id: "550e8400-e29b-41d4-a716-446655440003",
      full_name: "Alice",
    });
    userRepo.seed(existingUser, [], "alice@example.com");
    await familyRepo.addMember(familyId, existingUser.id, "member");

    const context = createMockContext({
      userId,
      body: { invitee_email: "alice@example.com" },
    });
    const response = await POST(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("validation");
    expect(data.message).toContain("already a member");
  });
});
