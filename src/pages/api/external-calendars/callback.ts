import type { APIContext } from "astro";
import { ExternalCalendarService } from "@/services/ExternalCalendarService";
import { handleApiRequest } from "@/lib/http/apiHelpers";

export const prerender = false;

export async function GET({ url, locals }: APIContext): Promise<Response> {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const provider = url.searchParams.get("provider");

  const frontendUrl = import.meta.env.FRONTEND_URL || "http://localhost:4321";

  if (!code || !state || !provider) {
    return Response.redirect(`${frontendUrl}/onboarding/welcome?status=error&error=missing_parameters`, 302);
  }

  return handleApiRequest({
    handler: async ({ locals }) => {
      const calendarService = new ExternalCalendarService(
        locals.repositories.externalCalendar,
        locals.repositories.log,
        locals.repositories.event,
        locals.repositories.family
      );

      const result = await calendarService.handleCallback(code, state, provider);

      if (!result.success) {
        const errorCode = result.error.name.replace("Error", "").toLowerCase();
        return Response.redirect(`${frontendUrl}${result.data?.returnPath || "/onboarding/welcome"}?status=error&error=${errorCode}`, 302);
      }

      return Response.redirect(`${frontendUrl}${result.data.returnPath || "/onboarding/welcome"}?status=success&calendar_id=${result.data.calendarId}`, 302);
    },
    context: "GET /api/external-calendars/callback",
    requireAuth: false,
    locals,
  });
}

