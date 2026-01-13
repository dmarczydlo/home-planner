import type { APIContext } from "astro";
import { ExternalCalendarService } from "@/services/ExternalCalendarService";
import { handleApiRequest } from "@/lib/http/apiHelpers";
import { mapResultToResponse } from "@/lib/http/responseMapper";

export const prerender = false;

export async function POST({ locals }: APIContext): Promise<Response> {
  return handleApiRequest({
    handler: async ({ userId, locals }) => {
      const calendarService = new ExternalCalendarService(
        locals.repositories.externalCalendar,
        locals.repositories.log,
        locals.repositories.event,
        locals.repositories.family
      );
      const result = await calendarService.syncAllCalendars(userId);
      return mapResultToResponse(result);
    },
    context: "POST /api/external-calendars/sync",
    locals,
  });
}
