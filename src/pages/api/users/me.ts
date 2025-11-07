import type { APIContext } from "astro";
import { UserService } from "@/services/UserService";
import { handleApiRequest } from "@/lib/http/apiHelpers";
import { mapResultToResponse } from "@/lib/http/responseMapper";

export async function GET({ locals }: APIContext): Promise<Response> {
  return handleApiRequest({
    handler: async ({ userId, locals }) => {
      const userService = new UserService(locals.repositories.user);
      const result = await userService.getUserProfile(userId);
      return mapResultToResponse(result);
    },
    context: "GET /api/users/me",
    locals,
  });
}

