import type { APIContext } from "astro";

export const prerender = false;

export async function GET({ url, request }: APIContext): Promise<Response> {
  const requestOrigin = new URL(request.url).origin;
  const frontendUrl = import.meta.env.FRONTEND_URL || 
    requestOrigin ||
    import.meta.env.PUBLIC_SUPABASE_URL?.replace("/rest/v1", "") || 
    "http://localhost:4321";
  
  const redirectTo = `${frontendUrl}/auth/callback`;
  
  const config = {
    frontendUrl,
    redirectTo,
    supabaseUrl: import.meta.env.SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!(import.meta.env.SUPABASE_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY),
    environment: {
      FRONTEND_URL: import.meta.env.FRONTEND_URL,
      PUBLIC_SUPABASE_URL: import.meta.env.PUBLIC_SUPABASE_URL,
      SUPABASE_URL: import.meta.env.SUPABASE_URL,
      hasSUPABASE_KEY: !!import.meta.env.SUPABASE_KEY,
      hasPUBLIC_SUPABASE_ANON_KEY: !!import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    },
    instructions: {
      step1: "Copy the 'redirectTo' URL above",
      step2: "Go to Supabase Dashboard → Authentication → URL Configuration",
      step3: "Add the redirectTo URL to the 'Redirect URLs' list",
      step4: "Make sure it matches EXACTLY (including http/https and port)",
    },
  };

  return new Response(JSON.stringify(config, null, 2), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

