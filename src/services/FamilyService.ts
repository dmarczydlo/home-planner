import type { Result } from "@/domain/result";
import { ok, err } from "@/domain/result";
import { NotFoundError, ValidationError, ForbiddenError, DomainError } from "@/domain/errors";
import type { FamilyRepository } from "@/repositories/interfaces/FamilyRepository";
import type { LogRepository } from "@/repositories/interfaces/LogRepository";
import type {
  CreateFamilyCommand,
  UpdateFamilyCommand,
  CreateFamilyResponseDTO,
  FamilyDetailsDTO,
  UpdateFamilyResponseDTO,
  FamilyMemberDTO,
} from "@/types";
import { Family } from "@/domain/entities/Family";
import { FamilyDTOMapper } from "@/lib/mappers/FamilyDTOMapper";

export class FamilyService {
  constructor(
    private readonly familyRepo: FamilyRepository,
    private readonly logRepo: LogRepository
  ) {}

  async createFamily(
    command: CreateFamilyCommand,
    userId: string
  ): Promise<Result<CreateFamilyResponseDTO, DomainError>> {
    try {
      const createdAt = new Date().toISOString();
      const familyId = crypto.randomUUID();

      const family = Family.create(familyId, command.name, createdAt, [], []).addMember({
        id: userId,
        name: "owner",
        role: "admin",
        joinedAt: createdAt,
        userId: userId,
      });

      await this.familyRepo.store(family);

      this.logRepo
        .create({
          family_id: familyId,
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
        created_at: family.createdAt,
        role: "admin",
      });
    } catch (error) {
      if (error instanceof Error) {
        return err(new ValidationError(error.message));
      }
      return err(new DomainError(500, "Failed to create family"));
    }
  }

  async getFamilyDetails(familyId: string, userId: string): Promise<Result<FamilyDetailsDTO, DomainError>> {
    const family = await this.familyRepo.findById(familyId);
    if (!family) {
      return err(new NotFoundError("Family", familyId));
    }

    if (!family.isMember(userId)) {
      return err(new ForbiddenError("You do not have access to this family"));
    }

    return ok(FamilyDTOMapper.toDetailsDTO(family));
  }

  async getFamilyMembers(familyId: string, userId: string): Promise<Result<FamilyMemberDTO[], DomainError>> {
    const family = await this.familyRepo.findById(familyId);
    if (!family) {
      return err(new NotFoundError("Family", familyId));
    }

    if (!family.isMember(userId)) {
      return err(new ForbiddenError("You do not have access to this family"));
    }

    try {
      const members = FamilyDTOMapper.toMembersDTO(family);

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
      return err(new DomainError(500, "Failed to retrieve family members"));
    }
  }

  async updateFamily(
    familyId: string,
    command: UpdateFamilyCommand,
    userId: string
  ): Promise<Result<UpdateFamilyResponseDTO, DomainError>> {
    const family = await this.familyRepo.findById(familyId);
    if (!family) {
      return err(new NotFoundError("Family", familyId));
    }

    if (!family.isAdmin(userId)) {
      return err(new ForbiddenError("You are not an admin of this family"));
    }

    try {
      let updatedFamily = family;
      if (command.name !== undefined) {
        updatedFamily = family.updateName(command.name);
      }

      await this.familyRepo.store(updatedFamily);

      this.logRepo
        .create({
          family_id: familyId,
          actor_id: userId,
          actor_type: "user",
          action: "family.update",
          details: { name: updatedFamily.name },
        })
        .catch((error) => {
          console.error("Failed to log family.update:", error);
        });

      return ok({
        id: updatedFamily.id,
        name: updatedFamily.name,
        created_at: updatedFamily.createdAt,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof Error) {
        return err(new ValidationError(error.message));
      }
      return err(new DomainError(500, "Failed to update family"));
    }
  }

  async deleteFamily(familyId: string, userId: string): Promise<Result<void, DomainError>> {
    const family = await this.familyRepo.findById(familyId);
    if (!family) {
      return err(new NotFoundError("Family", familyId));
    }

    if (!family.isAdmin(userId)) {
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
      return err(new DomainError(500, "Failed to delete family"));
    }
  }
}
