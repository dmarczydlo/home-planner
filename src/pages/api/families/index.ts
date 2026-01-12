import type { APIContext } from "astro";
import { FamilyService } from "@/services/FamilyService";
import { mapResultToResponse } from "@/lib/http/responseMapper";
import { handleApiRequest } from "@/lib/http/apiHelpers";
import { createFamilyCommandSchema, type CreateFamilyCommand } from "@/types";

export const prerender = false;

export async function POST({ request, locals }: APIContext): Promise<Response> {
  return handleApiRequest<unknown, unknown, CreateFamilyCommand>({
    handler: async ({ userId, body, locals }) => {
      const familyService = new FamilyService(
        locals.repositories.family,
        locals.repositories.child,
        locals.repositories.log,
        locals.repositories.user
      );
      const result = await familyService.createFamily(body, userId);
      return mapResultToResponse(result, { successStatus: 201 });
    },
    context: "POST /api/families",
    bodySchema: createFamilyCommandSchema,
    request,
    locals,
  });
}
