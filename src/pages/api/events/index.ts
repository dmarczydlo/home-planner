import type { APIContext } from "astro";
import { EventService } from "@/services/EventService";
import { mapResultToResponse } from "@/lib/http/responseMapper";
import { handleApiRequest } from "@/lib/http/apiHelpers";
import {
  createEventCommandSchema,
  listEventsQuerySchema,
  type ListEventsQuery,
  type CreateEventCommand,
} from "@/types";

export const prerender = false;

export async function GET({ url, locals }: APIContext): Promise<Response> {
  return handleApiRequest<unknown, ListEventsQuery>({
    handler: async ({ userId, query, locals }) => {
      const participantIds = query.participant_ids
        ? query.participant_ids
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean)
        : undefined;

      const eventService = new EventService(
        locals.repositories.event,
        locals.repositories.family,
        locals.repositories.child,
        locals.repositories.log
      );

      const result = await eventService.listEvents(
        query.family_id,
        query.start_date,
        query.end_date,
        {
          participantIds,
          eventType: query.event_type,
          includeSynced: query.include_synced,
          limit: query.limit,
          offset: query.offset,
        },
        userId
      );

      return mapResultToResponse(result);
    },
    context: "GET /api/events",
    querySchema: listEventsQuerySchema,
    url,
    locals,
  });
}

export async function POST({ request, locals }: APIContext): Promise<Response> {
  return handleApiRequest<unknown, unknown, CreateEventCommand>({
    handler: async ({ userId, body, locals }) => {
      const eventService = new EventService(
        locals.repositories.event,
        locals.repositories.family,
        locals.repositories.child,
        locals.repositories.log
      );

      const result = await eventService.createEvent(body, userId);
      return mapResultToResponse(result, { successStatus: 201 });
    },
    context: "POST /api/events",
    bodySchema: createEventCommandSchema,
    request,
    locals,
  });
}
