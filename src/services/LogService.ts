import type { Result } from "@/domain/result";
import { ok, err } from "@/domain/result";
import { NotFoundError, ValidationError, ForbiddenError, DomainError, InternalError } from "@/domain/errors";
import type { LogRepository } from "@/repositories/interfaces/LogRepository";
import type { FamilyRepository } from "@/repositories/interfaces/FamilyRepository";
import type { ListLogsQuery, ListLogsResponseDTO, LogDTO } from "@/types";

export class LogService {
  constructor(
    private readonly logRepo: LogRepository,
    private readonly familyRepo: FamilyRepository
  ) {}

  async listLogs(query: ListLogsQuery, userId: string): Promise<Result<ListLogsResponseDTO, DomainError>> {
    if (!userId || typeof userId !== "string") {
      return err(new ValidationError("User ID is required"));
    }

    try {
      if (query.family_id) {
        const isMember = await this.familyRepo.isUserMember(query.family_id, userId);
        if (!isMember) {
          return err(new ForbiddenError("You do not have access to view logs for this family"));
        }
      }

      let isAdmin = false;

      if (query.family_id) {
        isAdmin = await this.familyRepo.isUserAdmin(query.family_id, userId);
      } else {
        const userFamilies = await this.familyRepo.findByUserId(userId);
        for (const family of userFamilies) {
          const familyIsAdmin = await this.familyRepo.isUserAdmin(family.id, userId);
          if (familyIsAdmin) {
            isAdmin = true;
            break;
          }
        }
      }

      const filters = {
        family_id: query.family_id,
        actor_id: query.actor_id,
        action: query.action,
        start_date: query.start_date ? new Date(query.start_date) : undefined,
        end_date: query.end_date ? new Date(query.end_date) : undefined,
        limit: query.limit,
        offset: query.offset,
      };

      const result = await this.logRepo.findByFilters(filters, userId, isAdmin);

      const logDTOs: LogDTO[] = result.logs.map((log) => ({
        id: log.id,
        family_id: log.family_id,
        actor_id: log.actor_id,
        actor_type: log.actor_type,
        action: log.action,
        details: log.details,
        created_at: log.created_at,
      }));

      const response: ListLogsResponseDTO = {
        logs: logDTOs,
        pagination: {
          total: result.total,
          limit: query.limit,
          offset: query.offset,
          has_more: query.offset + query.limit < result.total,
        },
      };

      return ok(response);
    } catch (error) {
      console.error("Error in LogService.listLogs:", error);
      return err(new InternalError("Failed to retrieve logs"));
    }
  }
}
