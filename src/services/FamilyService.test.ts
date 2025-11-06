import { describe, it, expect, beforeEach } from "vitest";
import { FamilyService } from "./FamilyService";
import { InMemoryFamilyRepository } from "@/repositories/implementations/in-memory/InMemoryFamilyRepository";
import { InMemoryChildRepository } from "@/repositories/implementations/in-memory/InMemoryChildRepository";
import { InMemoryLogRepository } from "@/repositories/implementations/in-memory/InMemoryLogRepository";
import { ValidationError, NotFoundError, ForbiddenError } from "@/domain/errors";

describe("FamilyService", () => {
  let familyService: FamilyService;
  let familyRepo: InMemoryFamilyRepository;
  let childRepo: InMemoryChildRepository;
  let logRepo: InMemoryLogRepository;
  let userId: string;

  beforeEach(() => {
    familyRepo = new InMemoryFamilyRepository();
    childRepo = new InMemoryChildRepository();
    logRepo = new InMemoryLogRepository();
    familyService = new FamilyService(familyRepo, childRepo, logRepo);
    userId = "user-123";
  });

  describe("createFamily", () => {
    it("should create a family and add creator as admin", async () => {
      const command = { name: "The Smiths" };
      const result = await familyService.createFamily(command, userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("The Smiths");
        expect(result.data.role).toBe("admin");
        expect(result.data.id).toBeDefined();
        expect(result.data.created_at).toBeDefined();
      }
    });

    it("should return error if name is empty", async () => {
      const command = { name: "" };
      const result = await familyService.createFamily(command, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("required");
      }
    });

    it("should return error if name is only whitespace", async () => {
      const command = { name: "   " };
      const result = await familyService.createFamily(command, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should return error if name exceeds 100 characters", async () => {
      const command = { name: "a".repeat(101) };
      const result = await familyService.createFamily(command, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("100 characters");
      }
    });

    it("should log family.create action", async () => {
      const command = { name: "The Smiths" };
      await familyService.createFamily(command, userId);

      const logs = logRepo.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe("family.create");
      expect(logs[0].actor_id).toBe(userId);
      expect(logs[0].actor_type).toBe("user");
    });
  });

  describe("getFamilyDetails", () => {
    it("should return family details with members and children", async () => {
      const family = await familyRepo.create({ name: "The Smiths" });
      await familyRepo.addMember(family.id, userId, "admin");
      familyRepo.setUser(userId, { full_name: "John Doe", avatar_url: null });

      const result = await familyService.getFamilyDetails(family.id, userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(family.id);
        expect(result.data.name).toBe("The Smiths");
        expect(result.data.members).toHaveLength(1);
        expect(result.data.members[0].user_id).toBe(userId);
        expect(result.data.members[0].role).toBe("admin");
        expect(result.data.children).toHaveLength(0);
      }
    });

    it("should return error if family ID is invalid UUID", async () => {
      const result = await familyService.getFamilyDetails("invalid-id", userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("Invalid family ID format");
      }
    });

    it("should return error if family not found", async () => {
      const fakeId = "550e8400-e29b-41d4-a716-446655440000";
      const result = await familyService.getFamilyDetails(fakeId, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });

    it("should return error if user is not a member", async () => {
      const family = await familyRepo.create({ name: "The Smiths" });
      const otherUserId = "other-user-123";

      const result = await familyService.getFamilyDetails(family.id, otherUserId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ForbiddenError);
        expect(result.error.message).toContain("do not have access");
      }
    });

    it("should include children in response", async () => {
      const family = await familyRepo.create({ name: "The Smiths" });
      await familyRepo.addMember(family.id, userId, "admin");
      familyRepo.setUser(userId, { full_name: "John Doe", avatar_url: null });

      childRepo.addChild({
        id: "child-1",
        family_id: family.id,
        name: "Alice",
        created_at: new Date().toISOString(),
      });

      const result = await familyService.getFamilyDetails(family.id, userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.children).toHaveLength(1);
        expect(result.data.children[0].name).toBe("Alice");
      }
    });
  });

  describe("updateFamily", () => {
    let familyId: string;

    beforeEach(async () => {
      const family = await familyRepo.create({ name: "The Smiths" });
      familyId = family.id;
      await familyRepo.addMember(familyId, userId, "admin");
    });

    it("should update family name", async () => {
      const command = { name: "The Smith Family" };
      const result = await familyService.updateFamily(familyId, command, userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("The Smith Family");
        expect(result.data.updated_at).toBeDefined();
      }
    });

    it("should return error if no fields provided", async () => {
      const command = {};
      const result = await familyService.updateFamily(familyId, command, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("At least one field");
      }
    });

    it("should return error if name is empty", async () => {
      const command = { name: "" };
      const result = await familyService.updateFamily(familyId, command, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should return error if name exceeds 100 characters", async () => {
      const command = { name: "a".repeat(101) };
      const result = await familyService.updateFamily(familyId, command, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should return error if family ID is invalid", async () => {
      const command = { name: "New Name" };
      const result = await familyService.updateFamily("invalid-id", command, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should return error if family not found", async () => {
      const fakeId = "550e8400-e29b-41d4-a716-446655440000";
      const command = { name: "New Name" };
      const result = await familyService.updateFamily(fakeId, command, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });

    it("should return error if user is not admin", async () => {
      const memberUserId = "member-user-123";
      await familyRepo.addMember(familyId, memberUserId, "member");

      const command = { name: "New Name" };
      const result = await familyService.updateFamily(familyId, command, memberUserId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ForbiddenError);
        expect(result.error.message).toContain("not an admin");
      }
    });

    it("should log family.update action", async () => {
      const command = { name: "Updated Name" };
      await familyService.updateFamily(familyId, command, userId);

      const logs = logRepo.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe("family.update");
      expect(logs[0].actor_id).toBe(userId);
    });
  });

  describe("deleteFamily", () => {
    let familyId: string;

    beforeEach(async () => {
      const family = await familyRepo.create({ name: "The Smiths" });
      familyId = family.id;
      await familyRepo.addMember(familyId, userId, "admin");
    });

    it("should delete family", async () => {
      const result = await familyService.deleteFamily(familyId, userId);

      expect(result.success).toBe(true);

      const deletedFamily = await familyRepo.findById(familyId);
      expect(deletedFamily).toBeNull();
    });

    it("should return error if family ID is invalid", async () => {
      const result = await familyService.deleteFamily("invalid-id", userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should return error if family not found", async () => {
      const fakeId = "550e8400-e29b-41d4-a716-446655440000";
      const result = await familyService.deleteFamily(fakeId, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });

    it("should return error if user is not admin", async () => {
      const memberUserId = "member-user-123";
      await familyRepo.addMember(familyId, memberUserId, "member");

      const result = await familyService.deleteFamily(familyId, memberUserId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ForbiddenError);
        expect(result.error.message).toContain("not an admin");
      }
    });

    it("should log family.delete action", async () => {
      await familyService.deleteFamily(familyId, userId);

      const logs = logRepo.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe("family.delete");
      expect(logs[0].actor_id).toBe(userId);
      expect(logs[0].family_id).toBe(familyId);
    });
  });
});
