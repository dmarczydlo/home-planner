import type { APIContext } from "astro";
import { UserService } from "@/services/UserService";
import { requireAuth } from "@/lib/http/apiHelpers";
import { mapResultToResponse } from "@/lib/http/responseMapper";

export async function GET({ locals }: APIContext): Promise<Response> {
  try {
    const userId = requireAuth(locals);
    if (userId instanceof Response) {
      return userId;
    }

    const userService = new UserService(locals.repositories.user);

    const result = await userService.getUserProfile(userId);

    return mapResultToResponse(result);
  } catch (error) {
    console.error("Unexpected error in GET /api/users/me:", error);

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

