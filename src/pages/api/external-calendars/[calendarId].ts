import type { APIContext } from "astro";
import { ExternalCalendarService } from "@/services/ExternalCalendarService";
import { handleApiRequest } from "@/lib/http/apiHelpers";
import { mapResultToResponse } from "@/lib/http/responseMapper";
import { calendarIdPathSchema, type CalendarIdPath } from "@/types";

export const prerender = false;

export async function DELETE({ params, locals }: APIContext): Promise<Response> {
  return handleApiRequest<CalendarIdPath>({
    handler: async ({ userId, path, locals }) => {
      const calendarService = new ExternalCalendarService(
        locals.repositories.externalCalendar,
        locals.repositories.log,
        locals.repositories.event,
        locals.repositories.family
      );
      const result = await calendarService.disconnectCalendar(userId, path.calendarId);
      return mapResultToResponse(result, { successStatus: 204 });
    },
    context: "DELETE /api/external-calendars/[calendarId]",
    pathSchema: calendarIdPathSchema,
    params,
    locals,
  });
}

