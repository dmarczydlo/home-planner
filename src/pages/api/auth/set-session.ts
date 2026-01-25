import type { APIContext } from "astro";

export const prerender = false;

export async function POST({ request, cookies }: APIContext): Promise<Response> {
  try {
    const { access_token, expires_at, expires_in } = await request.json();

    if (!access_token) {
      return new Response(JSON.stringify({ error: "Missing access_token" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const maxAge = expires_at ? Math.max(expires_at - Math.floor(Date.now() / 1000), 0) : expires_in || 3600;

    cookies.set("hp_access_token", access_token, {
      path: "/",
      maxAge: maxAge,
      sameSite: "lax",
      secure: import.meta.env.PROD,
      httpOnly: false,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error setting session cookie:", error);
    return new Response(JSON.stringify({ error: "Failed to set session" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
