import type { APIContext } from "astro";
import { FamilyService } from "@/services/FamilyService";
import { mapResultToResponse } from "@/lib/http/responseMapper";
import { requireAuth, validatePathParams, validateResponse, handleApiRequest } from "@/lib/http/apiHelpers";
import { ok } from "@/domain/result";
import { familyIdParamPathSchema, listFamilyMembersResponseSchema } from "@/types";

export const prerender = false;

export async function GET({ params, locals }: APIContext): Promise<Response> {
  return handleApiRequest(async () => {
    const userId = requireAuth(locals);
    if (userId instanceof Response) return userId;

    const pathResult = validatePathParams(familyIdParamPathSchema, params);
    if (!pathResult.success) {
      return mapResultToResponse(pathResult);
    }

    const familyId = pathResult.data.familyId;

    const familyService = new FamilyService(
      locals.repositories.family,
      locals.repositories.child,
      locals.repositories.log
    );
    const result = await familyService.getFamilyMembers(familyId, userId);

    if (!result.success) {
      return mapResultToResponse(result);
    }

    const responseData = { members: result.data };
    const responseValidation = validateResponse(listFamilyMembersResponseSchema, responseData);
    if (!responseValidation.success) {
      return mapResultToResponse(responseValidation);
    }

    return mapResultToResponse(ok(responseData));
  }, "GET /api/families/[familyId]/members");
}
