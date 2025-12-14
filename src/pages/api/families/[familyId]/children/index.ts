import type { APIContext } from "astro";
import { ChildService } from "@/services/ChildService";
import { mapResultToResponse } from "@/lib/http/responseMapper";
import { validateResponse, handleApiRequest } from "@/lib/http/apiHelpers";
import {
  familyIdParamPathSchema,
  createChildCommandSchema,
  listChildrenResponseSchema,
  type FamilyIdParamPath,
  type CreateChildCommand,
} from "@/types";
import { ok } from "@/domain/result";

export const prerender = false;

export async function GET({ params, locals }: APIContext): Promise<Response> {
  return handleApiRequest<FamilyIdParamPath>({
    handler: async ({ userId, path, locals }) => {
      const childService = new ChildService(
        locals.repositories.child,
        locals.repositories.family,
        locals.repositories.log
      );

      const result = await childService.listChildren(path.familyId, userId);

      if (!result.success) {
        return mapResultToResponse(result);
      }

      const responseValidation = validateResponse(listChildrenResponseSchema, result.data);
      if (!responseValidation.success) {
        return mapResultToResponse(responseValidation);
      }

      return mapResultToResponse(ok(result.data));
    },
    context: "GET /api/families/[familyId]/children",
    pathSchema: familyIdParamPathSchema,
    params,
    locals,
  });
}

export async function POST({ params, request, locals }: APIContext): Promise<Response> {
  return handleApiRequest<FamilyIdParamPath, unknown, CreateChildCommand>({
    handler: async ({ userId, path, body, locals }) => {
      const childService = new ChildService(
        locals.repositories.child,
        locals.repositories.family,
        locals.repositories.log
      );

      const result = await childService.createChild(path.familyId, body, userId);

      return mapResultToResponse(result, { successStatus: 201 });
    },
    context: "POST /api/families/[familyId]/children",
    pathSchema: familyIdParamPathSchema,
    bodySchema: createChildCommandSchema,
    params,
    request,
    locals,
  });
}
