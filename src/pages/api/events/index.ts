import type { APIContext } from "astro";
import { EventService } from "@/services/EventService";
import { mapResultToResponse } from "@/lib/http/responseMapper";
import { requireAuth, validateQueryParams, validateBody, handleApiRequest } from "@/lib/http/apiHelpers";
import { createEventCommandSchema, listEventsQuerySchema } from "@/types";

export const prerender = false;

export async function GET({ url, locals }: APIContext): Promise<Response> {
  return handleApiRequest(async () => {
    const userId = requireAuth(locals);
    if (userId instanceof Response) return userId;

    const queryResult = validateQueryParams(listEventsQuerySchema, url);
    if (!queryResult.success) {
      return mapResultToResponse(queryResult);
    }

    const query = queryResult.data;
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
  }, "GET /api/events");
}

export async function POST({ request, locals }: APIContext): Promise<Response> {
  return handleApiRequest(async () => {
    const userId = requireAuth(locals);
    if (userId instanceof Response) return userId;

    const bodyResult = await validateBody(createEventCommandSchema, request);
    if (!bodyResult.success) {
      return mapResultToResponse(bodyResult);
    }

    const eventService = new EventService(
      locals.repositories.event,
      locals.repositories.family,
      locals.repositories.child,
      locals.repositories.log
    );

    const result = await eventService.createEvent(bodyResult.data, userId);

    return mapResultToResponse(result, { successStatus: 201 });
  }, "POST /api/events");
}
