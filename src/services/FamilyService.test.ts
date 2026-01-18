import { describe, it, expect, beforeEach } from "vitest";
import { FamilyService } from "./FamilyService";
import { InMemoryFamilyRepository } from "@/repositories/implementations/in-memory/InMemoryFamilyRepository";
import { InMemoryChildRepository } from "@/repositories/implementations/in-memory/InMemoryChildRepository";
import { InMemoryLogRepository } from "@/repositories/implementations/in-memory/InMemoryLogRepository";
import { InMemoryUserRepository } from "@/repositories/implementations/in-memory/InMemoryUserRepository";
import { ValidationError, NotFoundError, ForbiddenError, DomainError } from "@/domain/errors";

describe("FamilyService", () => {
  let familyService: FamilyService;
  let familyRepo: InMemoryFamilyRepository;
  let childRepo: InMemoryChildRepository;
  let logRepo: InMemoryLogRepository;
  let userRepo: InMemoryUserRepository;
  let userId: string;

  beforeEach(() => {
    familyRepo = new InMemoryFamilyRepository();
    childRepo = new InMemoryChildRepository();
    logRepo = new InMemoryLogRepository();
    userRepo = new InMemoryUserRepository();
    familyService = new FamilyService(familyRepo, childRepo, logRepo, userRepo);
    userId = "user-123";
  });

  describe("createFamily", () => {
    it("should create a family and add creator as admin", async () => {
      // Arrange
      const command = { name: "The Smiths" };

      // Act
      const result = await familyService.createFamily(command, userId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("The Smiths");
        expect(result.data.role).toBe("admin");
        expect(result.data.id).toBeDefined();
        expect(result.data.created_at).toBeDefined();
      }
    });

    it("should log family.create action", async () => {
      // Arrange
      const command = { name: "The Smiths" };

      // Act
      await familyService.createFamily(command, userId);

      // Assert
      const logs = logRepo.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe("family.create");
      expect(logs[0].actor_id).toBe(userId);
      expect(logs[0].actor_type).toBe("user");
    });
  });

  describe("getFamilyDetails", () => {
    it("should return family details with members and children", async () => {
      // Arrange
      const family = await familyRepo.create({ name: "The Smiths" });
      await familyRepo.addMember(family.id, userId, "admin");
      familyRepo.setUser(userId, { full_name: "John Doe", avatar_url: null });

      // Act
      const result = await familyService.getFamilyDetails(family.id, userId);

      // Assert
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
      // Arrange
      // Act
      const result = await familyService.getFamilyDetails("invalid-id", userId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(DomainError);
      }
    });

    it("should return error if family not found", async () => {
      // Arrange
      const fakeId = "550e8400-e29b-41d4-a716-446655440000";

      // Act
      const result = await familyService.getFamilyDetails(fakeId, userId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });

    it("should return error if user is not a member", async () => {
      // Arrange
      const family = await familyRepo.create({ name: "The Smiths" });
      const otherUserId = "other-user-123";

      // Act
      const result = await familyService.getFamilyDetails(family.id, otherUserId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ForbiddenError);
        expect(result.error.message).toContain("do not have access");
      }
    });

    it("should include children in response", async () => {
      // Arrange
      const family = await familyRepo.create({ name: "The Smiths" });
      await familyRepo.addMember(family.id, userId, "admin");
      familyRepo.setUser(userId, { full_name: "John Doe", avatar_url: null });
      childRepo.addChild({
        id: "child-1",
        family_id: family.id,
        name: "Alice",
        created_at: new Date().toISOString(),
      });

      // Act
      const result = await familyService.getFamilyDetails(family.id, userId);

      // Assert
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
      // Arrange
      const command = { name: "The Smith Family" };

      // Act
      const result = await familyService.updateFamily(familyId, command, userId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("The Smith Family");
        expect(result.data.updated_at).toBeDefined();
      }
    });

    it("should return error if family ID is invalid", async () => {
      // Arrange
      const command = { name: "New Name" };

      // Act
      const result = await familyService.updateFamily("invalid-id", command, userId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("Invalid family ID format");
      }
    });

    it("should return error if family not found", async () => {
      // Arrange
      const fakeId = "550e8400-e29b-41d4-a716-446655440000";
      const command = { name: "New Name" };

      // Act
      const result = await familyService.updateFamily(fakeId, command, userId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });

    it("should return error if user is not admin", async () => {
      // Arrange
      const memberUserId = "member-user-123";
      await familyRepo.addMember(familyId, memberUserId, "member");
      const command = { name: "New Name" };

      // Act
      const result = await familyService.updateFamily(familyId, command, memberUserId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ForbiddenError);
        expect(result.error.message).toContain("not an admin");
      }
    });

    it("should log family.update action", async () => {
      // Arrange
      const command = { name: "Updated Name" };

      // Act
      await familyService.updateFamily(familyId, command, userId);

      // Assert
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
      // Arrange
      // Act
      const result = await familyService.deleteFamily(familyId, userId);

      // Assert
      expect(result.success).toBe(true);
      const deletedFamily = await familyRepo.findById(familyId);
      expect(deletedFamily).toBeNull();
    });

    it("should return error if family ID is invalid", async () => {
      // Arrange
      // Act
      const result = await familyService.deleteFamily("invalid-id", userId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("Invalid family ID format");
      }
    });

    it("should return error if family not found", async () => {
      // Arrange
      const fakeId = "550e8400-e29b-41d4-a716-446655440000";

      // Act
      const result = await familyService.deleteFamily(fakeId, userId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });

    it("should return error if user is not admin", async () => {
      // Arrange
      const memberUserId = "member-user-123";
      await familyRepo.addMember(familyId, memberUserId, "member");

      // Act
      const result = await familyService.deleteFamily(familyId, memberUserId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ForbiddenError);
        expect(result.error.message).toContain("not an admin");
      }
    });

    it("should log family.delete action", async () => {
      // Arrange
      // Act
      await familyService.deleteFamily(familyId, userId);

      // Assert
      const logs = logRepo.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe("family.delete");
      expect(logs[0].actor_id).toBe(userId);
      expect(logs[0].family_id).toBe(familyId);
    });
  });

  describe("getFamilyMembers", () => {
    let familyId: string;

    beforeEach(async () => {
      const family = await familyRepo.create({ name: "The Smiths" });
      familyId = family.id;
      await familyRepo.addMember(familyId, userId, "admin");
      familyRepo.setUser(userId, { full_name: "John Doe", avatar_url: "https://example.com/avatar.jpg" });
    });

    it("should return members when user is a member", async () => {
      // Arrange
      const memberUserId = "member-user-123";
      await familyRepo.addMember(familyId, memberUserId, "member");
      familyRepo.setUser(memberUserId, { full_name: "Jane Doe", avatar_url: null });

      // Act
      const result = await familyService.getFamilyMembers(familyId, userId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].user_id).toBe(userId);
        expect(result.data[0].full_name).toBe("John Doe");
        expect(result.data[0].avatar_url).toBe("https://example.com/avatar.jpg");
        expect(result.data[0].role).toBe("admin");
        expect(result.data[1].user_id).toBe(memberUserId);
        expect(result.data[1].full_name).toBe("Jane Doe");
        expect(result.data[1].avatar_url).toBeNull();
        expect(result.data[1].role).toBe("member");
      }
    });

    it("should return empty array when family has no members", async () => {
      // Arrange
      const emptyFamily = await familyRepo.create({ name: "Empty Family" });
      await familyRepo.addMember(emptyFamily.id, userId, "admin");

      // Act
      const result = await familyService.getFamilyMembers(emptyFamily.id, userId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].user_id).toBe(userId);
      }
    });

    it("should return error if family ID is invalid UUID", async () => {
      // Arrange
      // Act
      const result = await familyService.getFamilyMembers("invalid-id", userId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(DomainError);
      }
    });

    it("should return error if family not found", async () => {
      // Arrange
      const fakeId = "550e8400-e29b-41d4-a716-446655440000";

      // Act
      const result = await familyService.getFamilyMembers(fakeId, userId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });

    it("should return error if user is not a member", async () => {
      // Arrange
      const otherUserId = "other-user-123";

      // Act
      const result = await familyService.getFamilyMembers(familyId, otherUserId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ForbiddenError);
        expect(result.error.message).toContain("do not have access");
      }
    });

    it("should return members ordered by joined_at ascending", async () => {
      const member1Id = "member-1";
      const member2Id = "member-2";

      await familyRepo.addMember(familyId, member1Id, "member");
      await new Promise((resolve) => setTimeout(resolve, 10));
      await familyRepo.addMember(familyId, member2Id, "member");

      familyRepo.setUser(member1Id, { full_name: "Member 1", avatar_url: null });
      familyRepo.setUser(member2Id, { full_name: "Member 2", avatar_url: null });

      const result = await familyService.getFamilyMembers(familyId, userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBeGreaterThanOrEqual(3);
        const joinedDates = result.data.map((m) => new Date(m.joined_at).getTime());
        const sortedDates = [...joinedDates].sort((a, b) => a - b);
        expect(joinedDates).toEqual(sortedDates);
      }
    });

    it("should log family.members.list action", async () => {
      await familyService.getFamilyMembers(familyId, userId);

      const logs = logRepo.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe("family.members.list");
      expect(logs[0].actor_id).toBe(userId);
      expect(logs[0].actor_type).toBe("user");
      expect(logs[0].family_id).toBe(familyId);
      expect(logs[0].details).toHaveProperty("member_count");
    });

    it("should handle members with null full_name and avatar_url", async () => {
      const memberUserId = "member-user-123";
      await familyRepo.addMember(familyId, memberUserId, "member");
      familyRepo.setUser(memberUserId, { full_name: null, avatar_url: null });

      const result = await familyService.getFamilyMembers(familyId, userId);

      expect(result.success).toBe(true);
      if (result.success) {
        const member = result.data.find((m) => m.user_id === memberUserId);
        expect(member).toBeDefined();
        if (member) {
          expect(member.full_name).toBeNull();
          expect(member.avatar_url).toBeNull();
        }
      }
    });
  });
});
