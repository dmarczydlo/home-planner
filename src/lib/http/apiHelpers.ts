import type { APIContext } from "astro";

export function requireAuth(locals: APIContext["locals"]): string | Response {
  const user = locals.user;

  if (!user || !user.id) {
    return new Response(
      JSON.stringify({
        error: "unauthorized",
        message: "Missing or invalid JWT token",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return user.id;
}

