import type { APIContext } from "astro";
import { FamilyService } from "@/services/FamilyService";
import { mapResultToResponse } from "@/lib/http/responseMapper";
import { requireAuth, parseJSON } from "@/lib/http/apiHelpers";
import { updateFamilyCommandSchema } from "@/types";
import { ValidationError } from "@/domain/errors";
import { err } from "@/domain/result";

export const prerender = false;

export async function GET({ params, locals }: APIContext): Promise<Response> {
  try {
    const userId = requireAuth(locals);
    if (userId instanceof Response) return userId;

    const familyId = params.id;
    if (!familyId) {
      return mapResultToResponse(
        err(new ValidationError("Family ID is required", { familyId: "required" }))
      );
    }

    const familyService = new FamilyService(
      locals.repositories.family,
      locals.repositories.child,
      locals.repositories.log
    );
    const result = await familyService.getFamilyDetails(familyId, userId);

    return mapResultToResponse(result);
  } catch (error) {
    console.error("Unexpected error in GET /api/families/[id]:", error);
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

export async function PATCH({ params, request, locals }: APIContext): Promise<Response> {
  try {
    const userId = requireAuth(locals);
    if (userId instanceof Response) return userId;

    const familyId = params.id;
    if (!familyId) {
      return mapResultToResponse(
        err(new ValidationError("Family ID is required", { familyId: "required" }))
      );
    }

    const bodyResult = await parseJSON(request);
    if (!bodyResult.success) {
      return mapResultToResponse(bodyResult);
    }

    const validationResult = updateFamilyCommandSchema.safeParse(bodyResult.data);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        const path = err.path.join(".");
        fieldErrors[path] = err.message;
      });

      return mapResultToResponse(
        err(
          new ValidationError("Invalid request body", fieldErrors)
        )
      );
    }

    const familyService = new FamilyService(
      locals.repositories.family,
      locals.repositories.child,
      locals.repositories.log
    );
    const result = await familyService.updateFamily(familyId, validationResult.data, userId);

    return mapResultToResponse(result);
  } catch (error) {
    console.error("Unexpected error in PATCH /api/families/[id]:", error);
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

export async function DELETE({ params, locals }: APIContext): Promise<Response> {
  try {
    const userId = requireAuth(locals);
    if (userId instanceof Response) return userId;

    const familyId = params.id;
    if (!familyId) {
      return mapResultToResponse(
        err(new ValidationError("Family ID is required", { familyId: "required" }))
      );
    }

    const familyService = new FamilyService(
      locals.repositories.family,
      locals.repositories.child,
      locals.repositories.log
    );
    const result = await familyService.deleteFamily(familyId, userId);

    return mapResultToResponse(result, { successStatus: 204 });
  } catch (error) {
    console.error("Unexpected error in DELETE /api/families/[id]:", error);
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

