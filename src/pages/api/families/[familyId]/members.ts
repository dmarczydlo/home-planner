import type { APIContext } from "astro";
import { FamilyService } from "@/services/FamilyService";
import { mapResultToResponse } from "@/lib/http/responseMapper";
import { validateResponse, handleApiRequest } from "@/lib/http/apiHelpers";
import { ok } from "@/domain/result";
import { familyIdParamPathSchema, listFamilyMembersResponseSchema, type FamilyIdParamPath } from "@/types";

export const prerender = false;

export async function GET({ params, locals }: APIContext): Promise<Response> {
  return handleApiRequest<FamilyIdParamPath>({
    handler: async ({ userId, path, locals }) => {
      const familyService = new FamilyService(
        locals.repositories.family,
        locals.repositories.child,
        locals.repositories.log,
        locals.repositories.user
      );
      const result = await familyService.getFamilyMembers(path.familyId, userId);

      if (!result.success) {
        return mapResultToResponse(result);
      }

      const responseData = { members: result.data };
      const responseValidation = validateResponse(listFamilyMembersResponseSchema, responseData);
      if (!responseValidation.success) {
        return mapResultToResponse(responseValidation);
      }

      return mapResultToResponse(ok(responseData));
    },
    context: "GET /api/families/[familyId]/members",
    pathSchema: familyIdParamPathSchema,
    params,
    locals,
  });
}
