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

export async function POST({ request, locals }: APIContext): Promise<Response> {
  return handleApiRequest({
    handler: async ({ userId, locals }) => {
      const body = await request.json();

      if (body.id !== userId) {
        return new Response(JSON.stringify({ error: "Cannot create profile for another user" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const userService = new UserService(locals.repositories.user);

      await locals.repositories.user.create({
        id: userId,
        full_name: body.full_name || null,
        avatar_url: body.avatar_url || null,
      });

      const result = await userService.getUserProfile(userId);
      return mapResultToResponse(result, 201);
    },
    context: "POST /api/users/me",
    locals,
  });
}
