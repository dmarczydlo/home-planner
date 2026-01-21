import type { APIContext } from "astro";
import { LogService } from "@/services/LogService";
import { mapResultToResponse } from "@/lib/http/responseMapper";
import { requireAuth, validateQueryParams, handleApiRequest } from "@/lib/http/apiHelpers";
import { listLogsQuerySchema } from "@/types";

export const prerender = false;

export async function GET({ url, locals }: APIContext): Promise<Response> {
  return handleApiRequest(async () => {
    const userId = requireAuth(locals);
    if (userId instanceof Response) return userId;

    const queryResult = validateQueryParams(listLogsQuerySchema, url);
    if (!queryResult.success) {
      return mapResultToResponse(queryResult);
    }

    const logService = new LogService(locals.repositories.log, locals.repositories.family);
    const result = await logService.listLogs(queryResult.data, userId);

    return mapResultToResponse(result);
  }, "GET /api/logs");
}
