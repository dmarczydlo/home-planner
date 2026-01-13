import type { APIContext } from "astro";

export const prerender = false;

export async function GET({ url, request }: APIContext): Promise<Response> {
  const requestOrigin = new URL(request.url).origin;
  const frontendUrl = import.meta.env.FRONTEND_URL || requestOrigin || "http://localhost:3000";
  const redirectTo = `${frontendUrl}/auth/callback`;

  const supabaseUrl = import.meta.env.SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_KEY;

  const verification = {
    timestamp: new Date().toISOString(),
    frontend: {
      url: frontendUrl,
      redirectTo,
      requestOrigin,
    },
    supabase: {
      url: supabaseUrl,
      hasKey: !!supabaseKey,
      keyFormat: supabaseKey?.startsWith("eyJ") ? "Valid JWT ✅" : "Invalid format ❌",
    },
    google: {
      expectedCallback: supabaseUrl ? `${supabaseUrl}/auth/v1/callback` : "N/A",
      note: "This should be in Google Cloud Console → Authorized redirect URIs",
    },
    supabaseDashboard: {
      siteUrl: "Should be: " + frontendUrl,
      redirectUrl: "Should be: " + redirectTo,
      note: "Check: Authentication → URL Configuration",
    },
    flow: {
      type: "PKCE (Code Flow)",
      required: {
        responseType: "code",
        codeChallenge: "Present",
        codeChallengeMethod: "S256",
      },
      note: "Verify in browser console when clicking 'Sign in with Google'",
    },
    checklist: {
      googleCloudConsole: [
        "OAuth Client type is 'Web application'",
        `Authorized redirect URIs includes: ${supabaseUrl}/auth/v1/callback`,
        `Authorized JavaScript origins includes: ${frontendUrl}`,
      ],
      supabaseDashboard: [
        "Google provider is enabled",
        "Client ID and Secret are set correctly",
        `Site URL is: ${frontendUrl}`,
        `Redirect URLs includes: ${redirectTo}`,
      ],
      code: [
        `redirectTo in code matches: ${redirectTo}`,
        "OAuth URL shows response_type=code",
        "OAuth URL includes code_challenge parameter",
      ],
    },
    nextSteps: [
      "1. Check browser console when clicking 'Sign in with Google'",
      "2. Verify OAuth URL shows response_type=code (PKCE flow)",
      "3. Verify redirect_uri in OAuth URL matches redirectTo exactly",
      "4. Check Supabase Auth Logs for any errors",
      "5. After Google auth, check Network tab for Supabase callback redirect",
    ],
  };

  return new Response(JSON.stringify(verification, null, 2), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
