import type { APIContext } from "astro";
import { FamilyService } from "@/services/FamilyService";
import { mapResultToResponse } from "@/lib/http/responseMapper";
import { requireAuth, validateBody, handleApiRequest } from "@/lib/http/apiHelpers";
import { createFamilyCommandSchema } from "@/types";

export const prerender = false;

export async function POST({ request, locals }: APIContext): Promise<Response> {
  return handleApiRequest(async () => {
    const userId = requireAuth(locals);
    if (userId instanceof Response) return userId;

    const bodyResult = await validateBody(createFamilyCommandSchema, request);
    if (!bodyResult.success) {
      return mapResultToResponse(bodyResult);
    }

    const familyService = new FamilyService(locals.repositories.family, locals.repositories.log);
    const result = await familyService.createFamily(bodyResult.data, userId);

    return mapResultToResponse(result, { successStatus: 201 });
  }, "POST /api/families");
}
