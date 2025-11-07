import type { APIContext } from "astro";
import { FamilyService } from "@/services/FamilyService";
import { mapResultToResponse } from "@/lib/http/responseMapper";
import { handleApiRequest } from "@/lib/http/apiHelpers";
import {
  updateFamilyCommandSchema,
  familyIdPathSchema,
  type FamilyIdPath,
  type UpdateFamilyCommand,
} from "@/types";

export const prerender = false;

export async function GET({ params, locals }: APIContext): Promise<Response> {
  return handleApiRequest<FamilyIdPath>({
    handler: async ({ userId, path, locals }) => {
      const familyService = new FamilyService(
        locals.repositories.family,
        locals.repositories.child,
        locals.repositories.log
      );
      const result = await familyService.getFamilyDetails(path.id, userId);
      return mapResultToResponse(result);
    },
    context: "GET /api/families/[id]",
    pathSchema: familyIdPathSchema,
    params,
    locals,
  });
}

export async function PATCH({ params, request, locals }: APIContext): Promise<Response> {
  return handleApiRequest<FamilyIdPath, unknown, UpdateFamilyCommand>({
    handler: async ({ userId, path, body, locals }) => {
      const familyService = new FamilyService(
        locals.repositories.family,
        locals.repositories.child,
        locals.repositories.log
      );
      const result = await familyService.updateFamily(path.id, body, userId);
      return mapResultToResponse(result);
    },
    context: "PATCH /api/families/[id]",
    pathSchema: familyIdPathSchema,
    bodySchema: updateFamilyCommandSchema,
    params,
    request,
    locals,
  });
}

export async function DELETE({ params, locals }: APIContext): Promise<Response> {
  return handleApiRequest<FamilyIdPath>({
    handler: async ({ userId, path, locals }) => {
      const familyService = new FamilyService(
        locals.repositories.family,
        locals.repositories.child,
        locals.repositories.log
      );
      const result = await familyService.deleteFamily(path.id, userId);
      return mapResultToResponse(result, { successStatus: 204 });
    },
    context: "DELETE /api/families/[id]",
    pathSchema: familyIdPathSchema,
    params,
    locals,
  });
}

