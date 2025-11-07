import type { APIContext } from "astro";
import { EventService } from "@/services/EventService";
import { mapResultToResponse } from "@/lib/http/responseMapper";
import {
  requireAuth,
  validatePathParams,
  validateQueryParams,
  validateBody,
  handleApiRequest,
} from "@/lib/http/apiHelpers";
import { updateEventCommandSchema, getEventQuerySchema, eventIdPathSchema, updateEventQuerySchema } from "@/types";

export const prerender = false;

export async function GET({ params, url, locals }: APIContext): Promise<Response> {
  return handleApiRequest(async () => {
    const userId = requireAuth(locals);
    if (userId instanceof Response) return userId;

    const pathResult = validatePathParams(eventIdPathSchema, params);
    if (!pathResult.success) {
      return mapResultToResponse(pathResult);
    }

    const queryResult = validateQueryParams(getEventQuerySchema, url);
    if (!queryResult.success) {
      return mapResultToResponse(queryResult);
    }

    const eventId = pathResult.data.id;
    const occurrenceDate = queryResult.data.date;

    const eventService = new EventService(
      locals.repositories.event,
      locals.repositories.family,
      locals.repositories.child,
      locals.repositories.log
    );

    const result = await eventService.getEventById(eventId, occurrenceDate, userId);

    return mapResultToResponse(result);
  }, "GET /api/events/[id]");
}

export async function PATCH({ params, request, url, locals }: APIContext): Promise<Response> {
  return handleApiRequest(async () => {
    const userId = requireAuth(locals);
    if (userId instanceof Response) return userId;

    const pathResult = validatePathParams(eventIdPathSchema, params);
    if (!pathResult.success) {
      return mapResultToResponse(pathResult);
    }

    const queryResult = validateQueryParams(updateEventQuerySchema, url);
    if (!queryResult.success) {
      return mapResultToResponse(queryResult);
    }

    const eventId = pathResult.data.id;
    const scope = queryResult.data.scope;
    const occurrenceDate = queryResult.data.date;

    const bodyResult = await validateBody(updateEventCommandSchema, request);
    if (!bodyResult.success) {
      return mapResultToResponse(bodyResult);
    }

    const eventService = new EventService(
      locals.repositories.event,
      locals.repositories.family,
      locals.repositories.child,
      locals.repositories.log
    );

    const result = await eventService.updateEvent(eventId, bodyResult.data, scope, occurrenceDate, userId);

    return mapResultToResponse(result);
  }, "PATCH /api/events/[id]");
}

export async function DELETE({ params, url, locals }: APIContext): Promise<Response> {
  return handleApiRequest(async () => {
    const userId = requireAuth(locals);
    if (userId instanceof Response) return userId;

    const pathResult = validatePathParams(eventIdPathSchema, params);
    if (!pathResult.success) {
      return mapResultToResponse(pathResult);
    }

    const queryResult = validateQueryParams(updateEventQuerySchema, url);
    if (!queryResult.success) {
      return mapResultToResponse(queryResult);
    }

    const eventId = pathResult.data.id;
    const scope = queryResult.data.scope;
    const occurrenceDate = queryResult.data.date;

    const eventService = new EventService(
      locals.repositories.event,
      locals.repositories.family,
      locals.repositories.child,
      locals.repositories.log
    );

    const result = await eventService.deleteEvent(eventId, scope, occurrenceDate, userId);

    return mapResultToResponse(result, { successStatus: 204 });
  }, "DELETE /api/events/[id]");
}
