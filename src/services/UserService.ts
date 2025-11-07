import type { UserRepository } from "@/repositories/interfaces/UserRepository";
import type { UserProfileDTO } from "@/types";
import { userProfileSchema } from "@/types";
import type { Result } from "@/domain/result";
import { ok, err } from "@/domain/result";
import { NotFoundError, ValidationError, DomainError } from "@/domain/errors";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getUserProfile(userId: string): Promise<Result<UserProfileDTO, DomainError>> {
    try {
      const user = await this.userRepository.findById(userId);

      if (!user) {
        return err(new NotFoundError("User", userId));
      }

      const families = await this.userRepository.getFamilyMemberships(userId);

      const profile: UserProfileDTO = {
        id: user.id,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        updated_at: user.updated_at,
        families: families,
      };

      const validation = userProfileSchema.safeParse(profile);
      if (!validation.success) {
        console.error("Profile validation failed:", validation.error);
        return err(new ValidationError("Invalid profile data structure"));
      }

      return ok(validation.data);
    } catch (error) {
      console.error("Error in UserService.getUserProfile:", error);
      throw error;
    }
  }
}
