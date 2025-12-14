import type { APIContext } from "astro";
import { createSupabaseClient } from "@/db/supabase.client";
import { UserService } from "@/services/UserService";
import { createRepositories } from "@/repositories/factory";

export const prerender = false;

export async function GET({ url }: APIContext): Promise<Response> {
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  const frontendUrl = import.meta.env.FRONTEND_URL || import.meta.env.PUBLIC_SUPABASE_URL?.replace("/rest/v1", "") || "http://localhost:4321";
  const loginUrl = `${frontendUrl}/auth/login`;

  if (error) {
    return Response.redirect(`${loginUrl}?error=auth_failed`, 302);
  }

  if (!code) {
    return Response.redirect(`${loginUrl}?error=no_code`, 302);
  }

  try {
    const supabase = createSupabaseClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError || !sessionData?.user) {
      console.error("Session exchange error:", sessionError);
      return Response.redirect(`${loginUrl}?error=session_failed`, 302);
    }

    const userId = sessionData.user.id;
    const repositories = createRepositories(supabase);
    const userService = new UserService(repositories.user);

    const userResult = await userService.getUserProfile(userId);

    if (!userResult.success) {
      const userNotFound = userResult.error.name === "NotFoundError";
      
      if (userNotFound) {
        try {
          const userMetadata = sessionData.user.user_metadata;
          await repositories.user.create({
            id: userId,
            full_name: userMetadata?.full_name || userMetadata?.name || null,
            avatar_url: userMetadata?.avatar_url || userMetadata?.picture || null,
          });

          const newUserResult = await userService.getUserProfile(userId);
          if (!newUserResult.success) {
            return Response.redirect(`${loginUrl}?error=user_creation_failed`, 302);
          }

          const hasCompletedOnboarding = newUserResult.data.families && newUserResult.data.families.length > 0;
          return Response.redirect(
            hasCompletedOnboarding ? `${frontendUrl}/calendar/week` : `${frontendUrl}/onboarding/welcome`,
            302
          );
        } catch (createError) {
          console.error("User creation error:", createError);
          return Response.redirect(`${loginUrl}?error=user_creation_failed`, 302);
        }
      }

      return Response.redirect(`${loginUrl}?error=user_not_found`, 302);
    }

    const hasCompletedOnboarding = userResult.data.families && userResult.data.families.length > 0;

    if (!hasCompletedOnboarding) {
      return Response.redirect(`${frontendUrl}/onboarding/welcome`, 302);
    }

    return Response.redirect(`${frontendUrl}/calendar/week`, 302);
  } catch (error) {
    console.error("Unexpected error in OAuth callback:", error);
    return Response.redirect(`${loginUrl}?error=unexpected_error`, 302);
  }
}

