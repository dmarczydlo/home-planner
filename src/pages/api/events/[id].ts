import type { APIContext } from "astro";
import { EventService } from "@/services/EventService";
import { mapResultToResponse } from "@/lib/http/responseMapper";
import { handleApiRequest } from "@/lib/http/apiHelpers";
import {
  updateEventCommandSchema,
  getEventQuerySchema,
  eventIdPathSchema,
  updateEventQuerySchema,
  type EventIdPath,
  type GetEventQuery,
  type UpdateEventQuery,
  type UpdateEventCommand,
} from "@/types";

export const prerender = false;

export async function GET({ params, url, locals }: APIContext): Promise<Response> {
  return handleApiRequest<EventIdPath, GetEventQuery>({
    handler: async ({ userId, path, query, locals }) => {
      const eventService = new EventService(
        locals.repositories.event,
        locals.repositories.family,
        locals.repositories.child,
        locals.repositories.log
      );

      const result = await eventService.getEventById(path.id, query.date, userId);
      return mapResultToResponse(result);
    },
    context: "GET /api/events/[id]",
    pathSchema: eventIdPathSchema,
    querySchema: getEventQuerySchema,
    params,
    url,
    locals,
  });
}

export async function PATCH({ params, request, url, locals }: APIContext): Promise<Response> {
  return handleApiRequest<EventIdPath, UpdateEventQuery, UpdateEventCommand>({
    handler: async ({ userId, path, query, body, locals }) => {
      const eventService = new EventService(
        locals.repositories.event,
        locals.repositories.family,
        locals.repositories.child,
        locals.repositories.log
      );

      const result = await eventService.updateEvent(path.id, body, query.scope, query.date, userId);
      return mapResultToResponse(result);
    },
    context: "PATCH /api/events/[id]",
    pathSchema: eventIdPathSchema,
    querySchema: updateEventQuerySchema,
    bodySchema: updateEventCommandSchema,
    params,
    url,
    request,
    locals,
  });
}

export async function DELETE({ params, url, locals }: APIContext): Promise<Response> {
  return handleApiRequest<EventIdPath, UpdateEventQuery>({
    handler: async ({ userId, path, query, locals }) => {
      const eventService = new EventService(
        locals.repositories.event,
        locals.repositories.family,
        locals.repositories.child,
        locals.repositories.log
      );

      const result = await eventService.deleteEvent(path.id, query.scope, query.date, userId);
      return mapResultToResponse(result, { successStatus: 204 });
    },
    context: "DELETE /api/events/[id]",
    pathSchema: eventIdPathSchema,
    querySchema: updateEventQuerySchema,
    params,
    url,
    locals,
  });
}
