import type { Result } from "@/domain/result";
import { ok, err } from "@/domain/result";
import { NotFoundError, ValidationError, ForbiddenError, DomainError, InternalError } from "@/domain/errors";
import type { ChildRepository } from "@/repositories/interfaces/ChildRepository";
import type { FamilyRepository } from "@/repositories/interfaces/FamilyRepository";
import type { LogRepository } from "@/repositories/interfaces/LogRepository";
import type {
  CreateChildCommand,
  UpdateChildCommand,
  ChildDTO,
  ListChildrenResponseDTO,
  UpdateChildResponseDTO,
} from "@/types";

export class ChildService {
  constructor(
    private readonly childRepo: ChildRepository,
    private readonly familyRepo: FamilyRepository,
    private readonly logRepo: LogRepository
  ) {}

  async listChildren(familyId: string, userId: string): Promise<Result<ListChildrenResponseDTO, DomainError>> {
    if (!familyId || familyId.trim() === "") {
      return err(new ValidationError("Family ID is required"));
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
      const children = await this.childRepo.findByFamilyId(familyId);

      const childrenDTOs: ChildDTO[] = children.map((child) => ({
        id: child.id,
        family_id: child.family_id,
        name: child.name,
        created_at: child.created_at,
      }));

      return ok({ children: childrenDTOs });
    } catch (error) {
      return err(new InternalError("Failed to retrieve children"));
    }
  }

  async createChild(
    familyId: string,
    command: CreateChildCommand,
    userId: string
  ): Promise<Result<ChildDTO, DomainError>> {
    if (!familyId || familyId.trim() === "") {
      return err(new ValidationError("Family ID is required"));
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
      const child = await this.childRepo.create({
        family_id: familyId,
        name: command.name,
      });

      this.logRepo
        .create({
          family_id: familyId,
          actor_id: userId,
          actor_type: "user",
          action: "child.create",
          details: { child_id: child.id, name: child.name },
        })
        .catch((error) => {
          console.error("Failed to log child.create:", error);
        });

      return ok({
        id: child.id,
        family_id: child.family_id,
        name: child.name,
        created_at: child.created_at,
      });
    } catch (error) {
      return err(new InternalError("Failed to create child"));
    }
  }

  async updateChild(
    familyId: string,
    childId: string,
    command: UpdateChildCommand,
    userId: string
  ): Promise<Result<UpdateChildResponseDTO, DomainError>> {
    if (!familyId || familyId.trim() === "") {
      return err(new ValidationError("Family ID is required"));
    }

    if (!childId || childId.trim() === "") {
      return err(new ValidationError("Child ID is required"));
    }

    const family = await this.familyRepo.findById(familyId);
    if (!family) {
      return err(new NotFoundError("Family", familyId));
    }

    const isMember = await this.familyRepo.isUserMember(familyId, userId);
    if (!isMember) {
      return err(new ForbiddenError("You do not have access to this family"));
    }

    const child = await this.childRepo.findById(childId);
    if (!child) {
      return err(new NotFoundError("Child", childId));
    }

    const belongsToFamily = await this.childRepo.belongsToFamily(childId, familyId);
    if (!belongsToFamily) {
      return err(new NotFoundError("Child", childId));
    }

    try {
      const updateData: { name?: string } = {};
      if (command.name !== undefined) {
        updateData.name = command.name;
      }

      const updated = await this.childRepo.update(childId, updateData);

      this.logRepo
        .create({
          family_id: familyId,
          actor_id: userId,
          actor_type: "user",
          action: "child.update",
          details: { child_id: childId, name: updated.name },
        })
        .catch((error) => {
          console.error("Failed to log child.update:", error);
        });

      return ok({
        id: updated.id,
        family_id: updated.family_id,
        name: updated.name,
        created_at: updated.created_at,
        updated_at: updated.updated_at ?? new Date().toISOString(),
      });
    } catch (error) {
      return err(new InternalError("Failed to update child"));
    }
  }

  async deleteChild(familyId: string, childId: string, userId: string): Promise<Result<void, DomainError>> {
    if (!familyId || familyId.trim() === "") {
      return err(new ValidationError("Family ID is required"));
    }

    if (!childId || childId.trim() === "") {
      return err(new ValidationError("Child ID is required"));
    }

    const family = await this.familyRepo.findById(familyId);
    if (!family) {
      return err(new NotFoundError("Family", familyId));
    }

    const isMember = await this.familyRepo.isUserMember(familyId, userId);
    if (!isMember) {
      return err(new ForbiddenError("You do not have access to this family"));
    }

    const child = await this.childRepo.findById(childId);
    if (!child) {
      return err(new NotFoundError("Child", childId));
    }

    const belongsToFamily = await this.childRepo.belongsToFamily(childId, familyId);
    if (!belongsToFamily) {
      return err(new NotFoundError("Child", childId));
    }

    try {
      await this.childRepo.delete(childId);

      this.logRepo
        .create({
          family_id: familyId,
          actor_id: userId,
          actor_type: "user",
          action: "child.delete",
          details: { child_id: childId, name: child.name },
        })
        .catch((error) => {
          console.error("Failed to log child.delete:", error);
        });

      return ok(undefined);
    } catch (error) {
      return err(new InternalError("Failed to delete child"));
    }
  }
}
