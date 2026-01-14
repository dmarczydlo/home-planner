import type { APIContext } from "astro";

export const prerender = false;

export async function POST({ request }: APIContext): Promise<Response> {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = cookieHeader.split(";").map((c) => c.trim());

  const supabaseCookies = cookies.filter((cookie) => cookie.startsWith("sb-")).map((cookie) => cookie.split("=")[0]);

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  supabaseCookies.forEach((name) => {
    headers.append("Set-Cookie", `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`);
  });
  headers.append("Set-Cookie", "hp_access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax");

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers,
  });
}
