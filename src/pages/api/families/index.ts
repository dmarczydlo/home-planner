import type { APIContext } from "astro";
import { FamilyService } from "@/services/FamilyService";
import { mapResultToResponse } from "@/lib/http/responseMapper";
import { requireAuth, parseJSON } from "@/lib/http/apiHelpers";
import { createFamilyCommandSchema } from "@/types";
import { ValidationError } from "@/domain/errors";
import { err } from "@/domain/result";

export const prerender = false;

export async function POST({ request, locals }: APIContext): Promise<Response> {
  try {
    const userId = requireAuth(locals);
    if (userId instanceof Response) return userId;

    const bodyResult = await parseJSON(request);
    if (!bodyResult.success) {
      return mapResultToResponse(bodyResult);
    }

    const validationResult = createFamilyCommandSchema.safeParse(bodyResult.data);
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
    const result = await familyService.createFamily(validationResult.data, userId);

    return mapResultToResponse(result, { successStatus: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /api/families:", error);
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

