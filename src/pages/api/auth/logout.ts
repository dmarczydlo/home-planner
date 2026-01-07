import type { APIContext } from "astro";

export const prerender = false;

export async function POST({ request }: APIContext): Promise<Response> {
  // Parse cookies from request header
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = cookieHeader.split(";").map((c) => c.trim());

  // Find all Supabase-related cookie names
  const supabaseCookies = cookies
    .filter((cookie) => cookie.startsWith("sb-"))
    .map((cookie) => cookie.split("=")[0]);

  // Create Set-Cookie headers to clear all Supabase cookies
  const clearCookieHeaders = supabaseCookies.map(
    (name) => `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`
  );

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": clearCookieHeaders.join(", "),
    },
  });
}

