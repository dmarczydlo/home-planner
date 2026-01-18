import { describe, it, expect, beforeEach } from "vitest";
import { UserService } from "./UserService";
import { InMemoryUserRepository } from "@/repositories/implementations/in-memory/InMemoryUserRepository";
import { NotFoundError, ValidationError } from "@/domain/errors";

describe("UserService", () => {
  let userService: UserService;
  let userRepo: InMemoryUserRepository;
  let userId: string;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    userService = new UserService(userRepo);
    userId = "550e8400-e29b-41d4-a716-446655440001";
  });

  describe("getUserProfile", () => {
    it("should get user profile successfully", async () => {
      // Arrange
      const user = await userRepo.create({ id: userId });
      const familyId = "550e8400-e29b-41d4-a716-446655440002";
      userRepo.seed(user, [
        {
          family_id: familyId,
          family_name: "Test Family",
          role: "admin",
          joined_at: new Date().toISOString(),
        },
      ]);

      // Act
      const result = await userService.getUserProfile(userId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(userId);
        expect(result.data.families).toHaveLength(1);
        expect(result.data.families[0].family_id).toBe(familyId);
        expect(result.data.families[0].role).toBe("admin");
      }
    });

    it("should return error when user not found", async () => {
      // Arrange
      const nonExistentUserId = "550e8400-e29b-41d4-a716-446655440000";

      // Act
      const result = await userService.getUserProfile(nonExistentUserId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(NotFoundError);
        expect(result.error.message).toContain("User");
      }
    });

    it("should include family memberships", async () => {
      // Arrange
      const user = await userRepo.create({ id: userId });
      const familyId1 = "550e8400-e29b-41d4-a716-446655440002";
      const familyId2 = "550e8400-e29b-41d4-a716-446655440003";
      userRepo.seed(user, [
        {
          family_id: familyId1,
          family_name: "Family 1",
          role: "admin",
          joined_at: new Date().toISOString(),
        },
        {
          family_id: familyId2,
          family_name: "Family 2",
          role: "member",
          joined_at: new Date().toISOString(),
        },
      ]);

      // Act
      const result = await userService.getUserProfile(userId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.families).toHaveLength(2);
        expect(result.data.families[0].family_id).toBe(familyId1);
        expect(result.data.families[1].family_id).toBe(familyId2);
      }
    });

    it("should handle null avatar_url", async () => {
      // Arrange
      const user = await userRepo.create({ id: userId, avatar_url: null });

      // Act
      const result = await userService.getUserProfile(userId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.avatar_url).toBeNull();
      }
    });

    it("should handle null full_name", async () => {
      // Arrange
      const user = await userRepo.create({ id: userId, full_name: null });

      // Act
      const result = await userService.getUserProfile(userId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.full_name).toBeNull();
      }
    });

    it("should handle repository errors", async () => {
      // Arrange
      const brokenRepo = {
        findById: async () => {
          throw new Error("Database connection failed");
        },
        getFamilyMemberships: async () => {
          throw new Error("Database connection failed");
        },
      } as unknown as typeof userRepo;
      const brokenService = new UserService(brokenRepo);

      // Act & Assert
      await expect(brokenService.getUserProfile(userId)).rejects.toThrow("Database connection failed");
    });
  });
});
