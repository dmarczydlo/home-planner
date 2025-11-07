import type { APIContext } from "astro";
import { FamilyService } from "@/services/FamilyService";
import { mapResultToResponse } from "@/lib/http/responseMapper";
import { requireAuth, validatePathParams, validateBody, handleApiRequest } from "@/lib/http/apiHelpers";
import { updateFamilyCommandSchema, familyIdPathSchema } from "@/types";

export const prerender = false;

export async function GET({ params, locals }: APIContext): Promise<Response> {
  return handleApiRequest(async () => {
    const userId = requireAuth(locals);
    if (userId instanceof Response) return userId;

    const pathResult = validatePathParams(familyIdPathSchema, params);
    if (!pathResult.success) {
      return mapResultToResponse(pathResult);
    }

    const familyId = pathResult.data.id;

    const familyService = new FamilyService(
      locals.repositories.family,
      locals.repositories.child,
      locals.repositories.log
    );
    const result = await familyService.getFamilyDetails(familyId, userId);

    return mapResultToResponse(result);
  }, "GET /api/families/[id]");
}

export async function PATCH({ params, request, locals }: APIContext): Promise<Response> {
  return handleApiRequest(async () => {
    const userId = requireAuth(locals);
    if (userId instanceof Response) return userId;

    const pathResult = validatePathParams(familyIdPathSchema, params);
    if (!pathResult.success) {
      return mapResultToResponse(pathResult);
    }

    const familyId = pathResult.data.id;

    const bodyResult = await validateBody(updateFamilyCommandSchema, request);
    if (!bodyResult.success) {
      return mapResultToResponse(bodyResult);
    }

    const familyService = new FamilyService(
      locals.repositories.family,
      locals.repositories.child,
      locals.repositories.log
    );
    const result = await familyService.updateFamily(familyId, bodyResult.data, userId);

    return mapResultToResponse(result);
  }, "PATCH /api/families/[id]");
}

export async function DELETE({ params, locals }: APIContext): Promise<Response> {
  return handleApiRequest(async () => {
    const userId = requireAuth(locals);
    if (userId instanceof Response) return userId;

    const pathResult = validatePathParams(familyIdPathSchema, params);
    if (!pathResult.success) {
      return mapResultToResponse(pathResult);
    }

    const familyId = pathResult.data.id;

    const familyService = new FamilyService(
      locals.repositories.family,
      locals.repositories.child,
      locals.repositories.log
    );
    const result = await familyService.deleteFamily(familyId, userId);

    return mapResultToResponse(result, { successStatus: 204 });
  }, "DELETE /api/families/[id]");
}

