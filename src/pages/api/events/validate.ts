import type { APIContext } from "astro";
import { EventService } from "@/services/EventService";
import { mapResultToResponse } from "@/lib/http/responseMapper";
import { requireAuth, validateBody, handleApiRequest } from "@/lib/http/apiHelpers";
import { validateEventCommandSchema } from "@/types";

export const prerender = false;

export async function POST({ request, locals }: APIContext): Promise<Response> {
  return handleApiRequest(async () => {
    const userId = requireAuth(locals);
    if (userId instanceof Response) return userId;

    const bodyResult = await validateBody(validateEventCommandSchema, request);
    if (!bodyResult.success) {
      return mapResultToResponse(bodyResult);
    }

    const eventService = new EventService(
      locals.repositories.family,
      locals.repositories.event,
      locals.repositories.log
    );

    const result = await eventService.validateEvent(bodyResult.data, userId);

    return mapResultToResponse(result);
  }, "POST /api/events/validate");
}
