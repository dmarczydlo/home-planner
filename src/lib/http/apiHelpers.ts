import type { APIContext } from "astro";
import type { Result } from "@/domain/result";
import { ok, err } from "@/domain/result";
import { ValidationError } from "@/domain/errors";

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

export async function parseJSON<T>(request: Request): Promise<Result<T, ValidationError>> {
  try {
    const data = await request.json();
    return ok(data);
  } catch {
    return err(new ValidationError("Invalid JSON in request body"));
  }
}
