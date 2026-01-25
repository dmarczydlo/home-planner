import type { APIContext } from "astro";
import { EventService } from "@/services/EventService";
import { mapResultToResponse } from "@/lib/http/responseMapper";
import { handleApiRequest } from "@/lib/http/apiHelpers";
import { validateEventCommandSchema, type ValidateEventCommand } from "@/types";

export const prerender = false;

export async function POST({ request, locals }: APIContext): Promise<Response> {
  return handleApiRequest<unknown, unknown, ValidateEventCommand>({
    handler: async ({ userId, body, locals }) => {
      const eventService = new EventService(
        locals.repositories.event,
        locals.repositories.family,
        locals.repositories.child,
        locals.repositories.log
      );

      const result = await eventService.validateEvent(body, userId);
      return mapResultToResponse(result);
    },
    context: "POST /api/events/validate",
    bodySchema: validateEventCommandSchema,
    request,
    locals,
  });
}
