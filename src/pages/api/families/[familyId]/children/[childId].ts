import type { APIContext } from "astro";
import { ChildService } from "@/services/ChildService";
import { mapResultToResponse } from "@/lib/http/responseMapper";
import { validateResponse, handleApiRequest } from "@/lib/http/apiHelpers";
import {
  familyIdParamPathSchema,
  childIdPathSchema,
  updateChildCommandSchema,
  updateChildResponseSchema,
  type UpdateChildCommand,
} from "@/types";
import { ok } from "@/domain/result";
import { z } from "zod";

export const prerender = false;

const childPathParamsSchema = familyIdParamPathSchema.merge(childIdPathSchema);
type ChildPathParams = z.infer<typeof childPathParamsSchema>;

export async function PATCH({ params, request, locals }: APIContext): Promise<Response> {
  return handleApiRequest<ChildPathParams, unknown, UpdateChildCommand>({
    handler: async ({ userId, path, body, locals }) => {
      const childService = new ChildService(
        locals.repositories.child,
        locals.repositories.family,
        locals.repositories.log
      );

      const result = await childService.updateChild(path.familyId, path.childId, body, userId);

      if (!result.success) {
        return mapResultToResponse(result);
      }

      const responseValidation = validateResponse(updateChildResponseSchema, result.data);
      if (!responseValidation.success) {
        return mapResultToResponse(responseValidation);
      }

      return mapResultToResponse(ok(result.data));
    },
    context: "PATCH /api/families/[familyId]/children/[childId]",
    pathSchema: childPathParamsSchema,
    bodySchema: updateChildCommandSchema,
    params,
    request,
    locals,
  });
}

export async function DELETE({ params, locals }: APIContext): Promise<Response> {
  return handleApiRequest<ChildPathParams>({
    handler: async ({ userId, path, locals }) => {
      const childService = new ChildService(
        locals.repositories.child,
        locals.repositories.family,
        locals.repositories.log
      );

      const result = await childService.deleteChild(path.familyId, path.childId, userId);
      return mapResultToResponse(result, { successStatus: 204 });
    },
    context: "DELETE /api/families/[familyId]/children/[childId]",
    pathSchema: childPathParamsSchema,
    params,
    locals,
  });
}
