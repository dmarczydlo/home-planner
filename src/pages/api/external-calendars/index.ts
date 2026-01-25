import type { APIContext } from "astro";
import { ExternalCalendarService } from "@/services/ExternalCalendarService";
import { handleApiRequest } from "@/lib/http/apiHelpers";
import { mapResultToResponse } from "@/lib/http/responseMapper";
import { connectCalendarCommandSchema, type ConnectCalendarCommand } from "@/types";

export const prerender = false;

export async function GET({ locals }: APIContext): Promise<Response> {
  return handleApiRequest({
    handler: async ({ userId, locals }) => {
      const calendarService = new ExternalCalendarService(
        locals.repositories.externalCalendar,
        locals.repositories.log,
        locals.repositories.event,
        locals.repositories.family
      );
      const result = await calendarService.listCalendars(userId);
      return mapResultToResponse(result);
    },
    context: "GET /api/external-calendars",
    locals,
  });
}

export async function POST({ request, locals }: APIContext): Promise<Response> {
  return handleApiRequest<unknown, unknown, ConnectCalendarCommand>({
    handler: async ({ userId, body, locals }) => {
      const calendarService = new ExternalCalendarService(
        locals.repositories.externalCalendar,
        locals.repositories.log,
        locals.repositories.event,
        locals.repositories.family
      );
      const result = await calendarService.initiateOAuth(userId, body.provider, body.return_path);
      return mapResultToResponse(result);
    },
    context: "POST /api/external-calendars",
    bodySchema: connectCalendarCommandSchema,
    request,
    locals,
  });
}
