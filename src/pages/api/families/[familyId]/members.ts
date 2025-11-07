import type { APIContext } from "astro";
import { FamilyService } from "@/services/FamilyService";
import { mapResultToResponse } from "@/lib/http/responseMapper";
import { requireAuth } from "@/lib/http/apiHelpers";
import { ValidationError } from "@/domain/errors";
import { err, ok } from "@/domain/result";
import { uuidSchema, listFamilyMembersResponseSchema } from "@/types";

export const prerender = false;

export async function GET({ params, locals }: APIContext): Promise<Response> {
  try {
    const userId = requireAuth(locals);
    if (userId instanceof Response) return userId;

    const familyId = params.familyId;
    if (!familyId) {
      return mapResultToResponse(
        err(new ValidationError("Family ID is required", { familyId: "required" }))
      );
    }

    const uuidValidation = uuidSchema.safeParse(familyId);
    if (!uuidValidation.success) {
      return mapResultToResponse(
        err(new ValidationError("Invalid family ID format", { familyId: "invalid_uuid" }))
      );
    }

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
    const validation = listFamilyMembersResponseSchema.safeParse(responseData);
    if (!validation.success) {
      return mapResultToResponse(
        err(
          new ValidationError("Invalid response data", {
            response: "Failed validation",
          })
        )
      );
    }

    return mapResultToResponse(ok(responseData));
  } catch (error) {
    console.error("Unexpected error in GET /api/families/[familyId]/members:", error);
    return new Response(
      JSON.stringify({
        error: "internal_error",
        message: "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

