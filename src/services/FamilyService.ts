import type { Result } from "@/domain/result";
import { ok, err } from "@/domain/result";
import { NotFoundError, ValidationError, ForbiddenError, DomainError, InternalError } from "@/domain/errors";
import type { FamilyRepository } from "@/repositories/interfaces/FamilyRepository";
import type { ChildRepository } from "@/repositories/interfaces/ChildRepository";
import type { LogRepository } from "@/repositories/interfaces/LogRepository";
import type { UserRepository } from "@/repositories/interfaces/UserRepository";
import { createFamilyCommandSchema, updateFamilyCommandSchema, uuidSchema, validateSchema } from "@/types";
import type {
  CreateFamilyCommand,
  UpdateFamilyCommand,
  CreateFamilyResponseDTO,
  FamilyDetailsDTO,
  UpdateFamilyResponseDTO,
  FamilyMemberDTO,
} from "@/types";
import type { z } from "zod";

export class FamilyService {
  constructor(
    private readonly familyRepo: FamilyRepository,
    private readonly childRepo: ChildRepository,
    private readonly logRepo: LogRepository,
    private readonly userRepo: UserRepository
  ) {}

  async createFamily(
    command: CreateFamilyCommand,
    userId: string
  ): Promise<Result<CreateFamilyResponseDTO, DomainError>> {
    const validationResult = validateSchema(createFamilyCommandSchema, command);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue: z.ZodIssue) => {
        const path = issue.path.join(".");
        fieldErrors[path] = issue.message;
      });
      const firstError = validationResult.error.issues[0];
      const errorMessage = firstError ? firstError.message : "Invalid family data";
      return err(new ValidationError(errorMessage, fieldErrors));
    }

    try {
      let user = await this.userRepo.findById(userId);
      if (!user) {
        user = await this.userRepo.create({ id: userId });
      }

      const family = await this.familyRepo.create({ name: validationResult.data.name });
      await this.familyRepo.addMember(family.id, userId, "admin");

      this.logRepo
        .create({
          family_id: family.id,
          actor_id: userId,
          actor_type: "user",
          action: "family.create",
          details: { name: family.name },
        })
        .catch((error) => {
          console.error("Failed to log family.create:", error);
        });

      return ok({
        id: family.id,
        name: family.name,
        created_at: family.created_at,
        role: "admin",
      });
    } catch (error) {
      console.error("Error creating family:", error);
      return err(new InternalError("Failed to create family"));
    }
  }

  async getFamilyDetails(familyId: string, userId: string): Promise<Result<FamilyDetailsDTO, DomainError>> {
    const uuidValidation = uuidSchema.safeParse(familyId);
    if (!uuidValidation.success) {
      return err(new ValidationError("Invalid family ID format"));
    }

    const family = await this.familyRepo.findById(familyId);
    if (!family) {
      return err(new NotFoundError("Family", familyId));
    }

    const isMember = await this.familyRepo.isUserMember(familyId, userId);
    if (!isMember) {
      return err(new ForbiddenError("You do not have access to this family"));
    }

    const members = await this.familyRepo.getFamilyMembers(familyId);
    const children = await this.childRepo.findByFamilyId(familyId);

    return ok({
      id: family.id,
      name: family.name,
      created_at: family.created_at,
      members,
      children,
    });
  }

  async getFamilyMembers(familyId: string, userId: string): Promise<Result<FamilyMemberDTO[], DomainError>> {
    const uuidValidation = uuidSchema.safeParse(familyId);
    if (!uuidValidation.success) {
      return err(new ValidationError("Invalid family ID format"));
    }

    const family = await this.familyRepo.findById(familyId);
    if (!family) {
      return err(new NotFoundError("Family", familyId));
    }

    const isMember = await this.familyRepo.isUserMember(familyId, userId);
    if (!isMember) {
      return err(new ForbiddenError("You do not have access to this family"));
    }

    try {
      const memberEntities = await this.familyRepo.getFamilyMembers(familyId);

      const members: FamilyMemberDTO[] = memberEntities.map((entity) => ({
        user_id: entity.user_id,
        full_name: entity.full_name,
        avatar_url: entity.avatar_url,
        role: entity.role,
        joined_at: entity.joined_at,
      }));

      this.logRepo
        .create({
          family_id: familyId,
          actor_id: userId,
          actor_type: "user",
          action: "family.members.list",
          details: { member_count: members.length },
        })
        .catch((error) => {
          console.error("Failed to log family.members.list:", error);
        });

      return ok(members);
    } catch (error) {
      console.error("Error in FamilyService.getFamilyMembers:", error);
      return err(new InternalError("Failed to retrieve family members"));
    }
  }

  async updateFamily(
    familyId: string,
    command: UpdateFamilyCommand,
    userId: string
  ): Promise<Result<UpdateFamilyResponseDTO, DomainError>> {
    const uuidValidation = uuidSchema.safeParse(familyId);
    if (!uuidValidation.success) {
      return err(new ValidationError("Invalid family ID format"));
    }

    const validationResult = validateSchema(updateFamilyCommandSchema, command);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue: z.ZodIssue) => {
        const path = issue.path.join(".");
        fieldErrors[path] = issue.message;
      });
      const firstError = validationResult.error.issues[0];
      const errorMessage = firstError ? firstError.message : "Invalid family data";
      return err(new ValidationError(errorMessage, fieldErrors));
    }

    const family = await this.familyRepo.findById(familyId);
    if (!family) {
      return err(new NotFoundError("Family", familyId));
    }

    const isAdmin = await this.familyRepo.isUserAdmin(familyId, userId);
    if (!isAdmin) {
      return err(new ForbiddenError("You are not an admin of this family"));
    }

    try {
      const updated = await this.familyRepo.update(familyId, validationResult.data);

      this.logRepo
        .create({
          family_id: familyId,
          actor_id: userId,
          actor_type: "user",
          action: "family.update",
          details: { name: updated.name },
        })
        .catch((error) => {
          console.error("Failed to log family.update:", error);
        });

      return ok({
        id: updated.id,
        name: updated.name,
        created_at: updated.created_at,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error in FamilyService.updateFamily:", error);
      return err(new InternalError("Failed to update family"));
    }
  }

  async deleteFamily(familyId: string, userId: string): Promise<Result<void, DomainError>> {
    const uuidValidation = uuidSchema.safeParse(familyId);
    if (!uuidValidation.success) {
      return err(new ValidationError("Invalid family ID format"));
    }

    const family = await this.familyRepo.findById(familyId);
    if (!family) {
      return err(new NotFoundError("Family", familyId));
    }

    const isAdmin = await this.familyRepo.isUserAdmin(familyId, userId);
    if (!isAdmin) {
      return err(new ForbiddenError("You are not an admin of this family"));
    }

    try {
      await this.familyRepo.delete(familyId);

      this.logRepo
        .create({
          family_id: familyId,
          actor_id: userId,
          actor_type: "user",
          action: "family.delete",
          details: { family_id: familyId },
        })
        .catch((error) => {
          console.error("Failed to log family.delete:", error);
        });

      return ok(undefined);
    } catch (error) {
      console.error("Error in FamilyService.deleteFamily:", error);
      return err(new InternalError("Failed to delete family"));
    }
  }
}
