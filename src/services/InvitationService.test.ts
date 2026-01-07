import { describe, it, expect, beforeEach } from "vitest";
import { InvitationService } from "./InvitationService";
import { InMemoryInvitationRepository } from "@/repositories/implementations/in-memory/InMemoryInvitationRepository";
import { InMemoryFamilyRepository } from "@/repositories/implementations/in-memory/InMemoryFamilyRepository";
import { InMemoryUserRepository } from "@/repositories/implementations/in-memory/InMemoryUserRepository";
import { InMemoryLogRepository } from "@/repositories/implementations/in-memory/InMemoryLogRepository";
import { ValidationError, NotFoundError, ForbiddenError, ConflictError, DomainError } from "@/domain/errors";
import type { InvitationEntity } from "@/types";

describe("InvitationService", () => {
  let invitationService: InvitationService;
  let invitationRepo: InMemoryInvitationRepository;
  let familyRepo: InMemoryFamilyRepository;
  let userRepo: InMemoryUserRepository;
  let logRepo: InMemoryLogRepository;
  let userId: string;
  let familyId: string;
  let otherUserId: string;

  beforeEach(async () => {
    invitationRepo = new InMemoryInvitationRepository();
    familyRepo = new InMemoryFamilyRepository();
    userRepo = new InMemoryUserRepository();
    logRepo = new InMemoryLogRepository();

    invitationService = new InvitationService(invitationRepo, familyRepo, userRepo, logRepo);

    userId = "550e8400-e29b-41d4-a716-446655440001";
    otherUserId = "550e8400-e29b-41d4-a716-446655440002";

    const family = await familyRepo.create({ name: "The Smiths" });
    familyId = family.id;
    await familyRepo.addMember(familyId, userId, "admin");

    userRepo.seed({ id: userId, full_name: "John Doe", avatar_url: null, updated_at: null }, [], "john@example.com");
  });

  describe("listInvitations", () => {
    it("should return invitations for a family member", async () => {
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

      const result = await invitationService.listInvitations(familyId, userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.invitations).toHaveLength(1);
        expect(result.data.invitations[0].id).toBe(invitation1.id);
        expect(result.data.invitations[0].invitee_email).toBe("alice@example.com");
        expect(result.data.invitations[0].invited_by.id).toBe(userId);
        expect(result.data.invitations[0].invited_by.full_name).toBe("John Doe");
      }
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

      const result = await invitationService.listInvitations(familyId, userId, "pending");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.invitations).toHaveLength(1);
        expect(result.data.invitations[0].status).toBe("pending");
      }
    });

    it("should return error if family ID is invalid UUID", async () => {
      const result = await invitationService.listInvitations("invalid-id", userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("Invalid family ID format");
      }
    });

    it("should return error if family not found", async () => {
      const fakeId = "550e8400-e29b-41d4-a716-446655440000";
      const result = await invitationService.listInvitations(fakeId, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });

    it("should return error if user is not a member", async () => {
      const result = await invitationService.listInvitations(familyId, otherUserId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ForbiddenError);
        expect(result.error.message).toContain("do not have access");
      }
    });
  });

  describe("createInvitation", () => {
    it("should create an invitation successfully", async () => {
      const command = { invitee_email: "alice@example.com" };
      const result = await invitationService.createInvitation(familyId, command, userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.invitee_email).toBe("alice@example.com");
        expect(result.data.family_id).toBe(familyId);
        expect(result.data.invited_by).toBe(userId);
        expect(result.data.status).toBe("pending");
        expect(result.data.token).toBeDefined();
        expect(result.data.token.length).toBeGreaterThan(0);
        expect(result.data.invitation_url).toBeDefined();
        expect(result.data.invitation_url).toContain(result.data.token);
        expect(result.data.expires_at).toBeDefined();

        const expiresAt = new Date(result.data.expires_at);
        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        expect(expiresAt.getTime()).toBeCloseTo(sevenDaysFromNow.getTime(), -3);
      }
    });

    it("should return error if family ID is invalid UUID", async () => {
      const command = { invitee_email: "alice@example.com" };
      const result = await invitationService.createInvitation("invalid-id", command, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("Invalid family ID format");
      }
    });

    it("should return error if email is invalid", async () => {
      const command = { invitee_email: "invalid-email" };
      const result = await invitationService.createInvitation(familyId, command, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should return error if family not found", async () => {
      const fakeId = "550e8400-e29b-41d4-a716-446655440000";
      const command = { invitee_email: "alice@example.com" };
      const result = await invitationService.createInvitation(fakeId, command, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });

    it("should return error if user is not a member", async () => {
      const command = { invitee_email: "alice@example.com" };
      const result = await invitationService.createInvitation(familyId, command, otherUserId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ForbiddenError);
        expect(result.error.message).toContain("do not have access");
      }
    });

    it("should return error if user already a member", async () => {
      const existingUser = await userRepo.create({
        id: "550e8400-e29b-41d4-a716-446655440003",
        full_name: "Alice",
      });
      userRepo.seed(existingUser, [], "alice@example.com");
      await familyRepo.addMember(familyId, existingUser.id, "member");

      const command = { invitee_email: "alice@example.com" };
      const result = await invitationService.createInvitation(familyId, command, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("already a member");
      }
    });

    it("should return error if pending invitation already exists", async () => {
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

      const command = { invitee_email: "alice@example.com" };
      const result = await invitationService.createInvitation(familyId, command, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ConflictError);
        expect(result.error.message).toContain("pending invitation already exists");
      }
    });

    it("should allow creating invitation if previous invitation was accepted", async () => {
      const acceptedInvitation: InvitationEntity = {
        id: crypto.randomUUID(),
        family_id: familyId,
        invited_by: userId,
        invitee_email: "alice@example.com",
        token: "accepted-token",
        status: "accepted",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };
      invitationRepo.addInvitation(acceptedInvitation);

      const command = { invitee_email: "alice@example.com" };
      const result = await invitationService.createInvitation(familyId, command, userId);

      expect(result.success).toBe(true);
    });

    it("should create audit log entry", async () => {
      const command = { invitee_email: "alice@example.com" };
      const result = await invitationService.createInvitation(familyId, command, userId);

      expect(result.success).toBe(true);
      if (result.success) {
        const logs = logRepo.getLogs();
        const invitationLog = logs.find((log) => log.action === "invitation.create");
        expect(invitationLog).toBeDefined();
        expect(invitationLog?.actor_id).toBe(userId);
        expect(invitationLog?.actor_type).toBe("user");
        expect(invitationLog?.family_id).toBe(familyId);
      }
    });
  });
});


