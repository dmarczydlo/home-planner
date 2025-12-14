import type { Result } from "@/domain/result";
import { ok, err } from "@/domain/result";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ConflictError,
  DomainError,
  InternalError,
} from "@/domain/errors";
import type { InvitationRepository } from "@/repositories/interfaces/InvitationRepository";
import type { FamilyRepository } from "@/repositories/interfaces/FamilyRepository";
import type { UserRepository } from "@/repositories/interfaces/UserRepository";
import type { LogRepository } from "@/repositories/interfaces/LogRepository";
import { uuidSchema, invitationStatusSchema, createInvitationCommandSchema, validateSchema } from "@/types";
import type {
  CreateInvitationCommand,
  CreateInvitationResponseDTO,
  ListInvitationsResponseDTO,
  InvitationWithInviterDTO,
  InvitationStatus,
} from "@/types";
import type { z } from "zod";
import { generateSecureToken } from "@/lib/utils/token";
import { buildInvitationUrl } from "@/lib/utils/invitation";

export class InvitationService {
  constructor(
    private readonly invitationRepo: InvitationRepository,
    private readonly familyRepo: FamilyRepository,
    private readonly userRepo: UserRepository,
    private readonly logRepo: LogRepository
  ) {}

  async listInvitations(
    familyId: string,
    userId: string,
    status?: InvitationStatus
  ): Promise<Result<ListInvitationsResponseDTO, DomainError>> {
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
      const invitations = await this.invitationRepo.findByFamilyId(familyId, status);

      const invitationsWithInviter: InvitationWithInviterDTO[] = await Promise.all(
        invitations.map(async (invitation) => {
          const inviter = await this.userRepo.findById(invitation.invited_by);
          return {
            id: invitation.id,
            family_id: invitation.family_id,
            invited_by: {
              id: invitation.invited_by,
              full_name: inviter?.full_name ?? null,
            },
            invitee_email: invitation.invitee_email,
            status: invitation.status,
            expires_at: invitation.expires_at,
            created_at: invitation.created_at,
          };
        })
      );

      return ok({
        invitations: invitationsWithInviter,
      });
    } catch (error) {
      console.error("Error in InvitationService.listInvitations:", error);
      return err(new InternalError("Failed to retrieve invitations"));
    }
  }

  async createInvitation(
    familyId: string,
    command: CreateInvitationCommand,
    userId: string
  ): Promise<Result<CreateInvitationResponseDTO, DomainError>> {
    const uuidValidation = uuidSchema.safeParse(familyId);
    if (!uuidValidation.success) {
      return err(new ValidationError("Invalid family ID format"));
    }

    const validationResult = validateSchema(createInvitationCommandSchema, command);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue: z.ZodIssue) => {
        const path = issue.path.join(".");
        fieldErrors[path] = issue.message;
      });
      const firstError = validationResult.error.issues[0];
      const errorMessage = firstError ? firstError.message : "Invalid email format";
      return err(new ValidationError(errorMessage, fieldErrors));
    }

    const family = await this.familyRepo.findById(familyId);
    if (!family) {
      return err(new NotFoundError("Family", familyId));
    }

    const isMember = await this.familyRepo.isUserMember(familyId, userId);
    if (!isMember) {
      return err(new ForbiddenError("You do not have access to this family"));
    }

    const existingUser = await this.userRepo.findByEmail(validationResult.data.invitee_email);
    if (existingUser) {
      const isAlreadyMember = await this.familyRepo.isUserMember(familyId, existingUser.id);
      if (isAlreadyMember) {
        return err(
          new ValidationError("User with this email is already a member of this family", {
            invitee_email: "already_member",
          })
        );
      }
    }

    const pendingInvitation = await this.invitationRepo.findPendingByEmailAndFamily(
      validationResult.data.invitee_email,
      familyId
    );
    if (pendingInvitation) {
      return err(new ConflictError("A pending invitation already exists for this email"));
    }

    try {
      const token = generateSecureToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const invitation = await this.invitationRepo.create({
        family_id: familyId,
        invited_by: userId,
        invitee_email: validationResult.data.invitee_email,
        token,
        status: "pending",
        expires_at: expiresAt.toISOString(),
      });

      const invitationUrl = buildInvitationUrl(token);

      const response: CreateInvitationResponseDTO = {
        id: invitation.id,
        family_id: invitation.family_id,
        invited_by: invitation.invited_by,
        invitee_email: invitation.invitee_email,
        token: invitation.token,
        status: invitation.status,
        expires_at: invitation.expires_at,
        created_at: invitation.created_at,
        invitation_url: invitationUrl,
      };

      this.logRepo
        .create({
          family_id: familyId,
          actor_id: userId,
          actor_type: "user",
          action: "invitation.create",
          details: {
            invitation_id: invitation.id,
            invitee_email: invitation.invitee_email,
            family_id: familyId,
          },
        })
        .catch((error) => {
          console.error("Failed to log invitation.create:", error);
        });

      return ok(response);
    } catch (error) {
      console.error("Error in InvitationService.createInvitation:", error);
      return err(new InternalError("Failed to create invitation"));
    }
  }
}
