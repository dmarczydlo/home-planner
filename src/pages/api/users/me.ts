import type { APIContext } from "astro";
import { UserService } from "@/services/UserService";
import { requireAuth, handleApiRequest } from "@/lib/http/apiHelpers";
import { mapResultToResponse } from "@/lib/http/responseMapper";

export async function GET({ locals }: APIContext): Promise<Response> {
  return handleApiRequest(async () => {
    const userId = requireAuth(locals);
    if (userId instanceof Response) {
      return userId;
    }

    const userService = new UserService(locals.repositories.user);

    const result = await userService.getUserProfile(userId);

    return mapResultToResponse(result);
  }, "GET /api/users/me");
}

