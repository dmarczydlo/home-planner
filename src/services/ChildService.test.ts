import { describe, it, expect, beforeEach } from "vitest";
import { ChildService } from "./ChildService";
import { InMemoryChildRepository } from "@/repositories/implementations/in-memory/InMemoryChildRepository";
import { InMemoryFamilyRepository } from "@/repositories/implementations/in-memory/InMemoryFamilyRepository";
import { InMemoryLogRepository } from "@/repositories/implementations/in-memory/InMemoryLogRepository";
import { ValidationError, NotFoundError, ForbiddenError, InternalError } from "@/domain/errors";

describe("ChildService", () => {
  let childService: ChildService;
  let childRepo: InMemoryChildRepository;
  let familyRepo: InMemoryFamilyRepository;
  let logRepo: InMemoryLogRepository;
  let userId: string;
  let familyId: string;

  beforeEach(async () => {
    childRepo = new InMemoryChildRepository();
    familyRepo = new InMemoryFamilyRepository();
    logRepo = new InMemoryLogRepository();
    childService = new ChildService(childRepo, familyRepo, logRepo);
    userId = "user-123";

    const family = await familyRepo.create({ name: "The Smiths" });
    familyId = family.id;
    await familyRepo.addMember(familyId, userId, "admin");
  });

  describe("listChildren", () => {
    it("should return children when user is a family member", async () => {
      const child1 = await childRepo.create({ family_id: familyId, name: "Alice" });
      const child2 = await childRepo.create({ family_id: familyId, name: "Bob" });

      const result = await childService.listChildren(familyId, userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.children).toHaveLength(2);
        expect(result.data.children[0].id).toBe(child1.id);
        expect(result.data.children[0].name).toBe("Alice");
        expect(result.data.children[1].id).toBe(child2.id);
        expect(result.data.children[1].name).toBe("Bob");
      }
    });

    it("should return empty array when family has no children", async () => {
      const result = await childService.listChildren(familyId, userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.children).toHaveLength(0);
      }
    });

    it("should return error if family ID is empty", async () => {
      const result = await childService.listChildren("", userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("Family ID is required");
      }
    });

    it("should return error if family does not exist", async () => {
      const nonExistentFamilyId = "00000000-0000-0000-0000-000000000000";
      const result = await childService.listChildren(nonExistentFamilyId, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(NotFoundError);
        expect(result.error.message).toContain("Family");
      }
    });

    it("should return error if user is not a family member", async () => {
      const otherFamily = await familyRepo.create({ name: "Other Family" });
      const result = await childService.listChildren(otherFamily.id, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ForbiddenError);
        expect(result.error.message).toContain("access to this family");
      }
    });

    it("should return children ordered by created_at", async () => {
      const child1 = await childRepo.create({ family_id: familyId, name: "First" });
      await new Promise((resolve) => setTimeout(resolve, 10));
      const child2 = await childRepo.create({ family_id: familyId, name: "Second" });

      const result = await childService.listChildren(familyId, userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.children).toHaveLength(2);
        expect(result.data.children[0].id).toBe(child1.id);
        expect(result.data.children[1].id).toBe(child2.id);
      }
    });
  });

  describe("createChild", () => {
    it("should create a child successfully", async () => {
      const command = { name: "Alice" };
      const result = await childService.createChild(familyId, command, userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Alice");
        expect(result.data.family_id).toBe(familyId);
        expect(result.data.id).toBeDefined();
        expect(result.data.created_at).toBeDefined();
      }
    });

    it("should return error if family ID is empty", async () => {
      const command = { name: "Alice" };
      const result = await childService.createChild("", command, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("Family ID is required");
      }
    });

    it("should return error if family does not exist", async () => {
      const nonExistentFamilyId = "00000000-0000-0000-0000-000000000000";
      const command = { name: "Alice" };
      const result = await childService.createChild(nonExistentFamilyId, command, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(NotFoundError);
        expect(result.error.message).toContain("Family");
      }
    });

    it("should return error if user is not a family member", async () => {
      const otherFamily = await familyRepo.create({ name: "Other Family" });
      const command = { name: "Alice" };
      const result = await childService.createChild(otherFamily.id, command, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ForbiddenError);
        expect(result.error.message).toContain("access to this family");
      }
    });

    it("should log child.create action", async () => {
      const command = { name: "Alice" };
      const result = await childService.createChild(familyId, command, userId);

      expect(result.success).toBe(true);
      const logs = logRepo.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe("child.create");
      expect(logs[0].actor_id).toBe(userId);
      expect(logs[0].actor_type).toBe("user");
      expect(logs[0].family_id).toBe(familyId);
      if (result.success) {
        expect(logs[0].details).toMatchObject({
          child_id: result.data.id,
          name: "Alice",
        });
      }
    });
  });

  describe("updateChild", () => {
    let childId: string;

    beforeEach(async () => {
      const child = await childRepo.create({ family_id: familyId, name: "Alice" });
      childId = child.id;
    });

    it("should update child name successfully", async () => {
      const command = { name: "Alice Updated" };
      const result = await childService.updateChild(familyId, childId, command, userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Alice Updated");
        expect(result.data.id).toBe(childId);
        expect(result.data.family_id).toBe(familyId);
        expect(result.data.updated_at).toBeDefined();
      }
    });

    it("should return error if family ID is empty", async () => {
      const command = { name: "Updated" };
      const result = await childService.updateChild("", childId, command, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("Family ID is required");
      }
    });

    it("should return error if child ID is empty", async () => {
      const command = { name: "Updated" };
      const result = await childService.updateChild(familyId, "", command, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("Child ID is required");
      }
    });

    it("should return error if family does not exist", async () => {
      const nonExistentFamilyId = "00000000-0000-0000-0000-000000000000";
      const command = { name: "Updated" };
      const result = await childService.updateChild(nonExistentFamilyId, childId, command, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(NotFoundError);
        expect(result.error.message).toContain("Family");
      }
    });

    it("should return error if user is not a family member", async () => {
      const otherFamily = await familyRepo.create({ name: "Other Family" });
      const command = { name: "Updated" };
      const result = await childService.updateChild(otherFamily.id, childId, command, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ForbiddenError);
        expect(result.error.message).toContain("access to this family");
      }
    });

    it("should return error if child does not exist", async () => {
      const nonExistentChildId = "00000000-0000-0000-0000-000000000000";
      const command = { name: "Updated" };
      const result = await childService.updateChild(familyId, nonExistentChildId, command, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(NotFoundError);
        expect(result.error.message).toContain("Child");
      }
    });

    it("should return error if child belongs to different family", async () => {
      const otherFamily = await familyRepo.create({ name: "Other Family" });
      const otherUserId = "other-user-123";
      await familyRepo.addMember(otherFamily.id, otherUserId, "admin");
      const otherChild = await childRepo.create({ family_id: otherFamily.id, name: "Other Child" });

      const command = { name: "Updated" };
      const result = await childService.updateChild(familyId, otherChild.id, command, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(NotFoundError);
        expect(result.error.message).toContain("Child");
      }
    });

    it("should log child.update action", async () => {
      const command = { name: "Alice Updated" };
      const result = await childService.updateChild(familyId, childId, command, userId);

      expect(result.success).toBe(true);
      const logs = logRepo.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe("child.update");
      expect(logs[0].actor_id).toBe(userId);
      expect(logs[0].actor_type).toBe("user");
      expect(logs[0].family_id).toBe(familyId);
      if (result.success) {
        expect(logs[0].details).toMatchObject({
          child_id: childId,
          name: "Alice Updated",
        });
      }
    });
  });

  describe("deleteChild", () => {
    let childId: string;

    beforeEach(async () => {
      const child = await childRepo.create({ family_id: familyId, name: "Alice" });
      childId = child.id;
    });

    it("should delete child successfully", async () => {
      const result = await childService.deleteChild(familyId, childId, userId);

      expect(result.success).toBe(true);
      const deletedChild = await childRepo.findById(childId);
      expect(deletedChild).toBeNull();
    });

    it("should return error if family ID is empty", async () => {
      const result = await childService.deleteChild("", childId, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("Family ID is required");
      }
    });

    it("should return error if child ID is empty", async () => {
      const result = await childService.deleteChild(familyId, "", userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("Child ID is required");
      }
    });

    it("should return error if family does not exist", async () => {
      const nonExistentFamilyId = "00000000-0000-0000-0000-000000000000";
      const result = await childService.deleteChild(nonExistentFamilyId, childId, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(NotFoundError);
        expect(result.error.message).toContain("Family");
      }
    });

    it("should return error if user is not a family member", async () => {
      const otherFamily = await familyRepo.create({ name: "Other Family" });
      const result = await childService.deleteChild(otherFamily.id, childId, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ForbiddenError);
        expect(result.error.message).toContain("access to this family");
      }
    });

    it("should return error if child does not exist", async () => {
      const nonExistentChildId = "00000000-0000-0000-0000-000000000000";
      const result = await childService.deleteChild(familyId, nonExistentChildId, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(NotFoundError);
        expect(result.error.message).toContain("Child");
      }
    });

    it("should return error if child belongs to different family", async () => {
      const otherFamily = await familyRepo.create({ name: "Other Family" });
      const otherUserId = "other-user-123";
      await familyRepo.addMember(otherFamily.id, otherUserId, "admin");
      const otherChild = await childRepo.create({ family_id: otherFamily.id, name: "Other Child" });

      const result = await childService.deleteChild(familyId, otherChild.id, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(NotFoundError);
        expect(result.error.message).toContain("Child");
      }
    });

    it("should log child.delete action", async () => {
      const result = await childService.deleteChild(familyId, childId, userId);

      expect(result.success).toBe(true);
      const logs = logRepo.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe("child.delete");
      expect(logs[0].actor_id).toBe(userId);
      expect(logs[0].actor_type).toBe("user");
      expect(logs[0].family_id).toBe(familyId);
      expect(logs[0].details).toMatchObject({
        child_id: childId,
        name: "Alice",
      });
    });
  });
});
