import type { Result } from "@/domain/result";
import type { DomainError } from "@/domain/errors";
import { ValidationError } from "@/domain/errors";

export function mapResultToResponse<T>(result: Result<T, DomainError>): Response {
  if (result.success) {
    return new Response(JSON.stringify(result.data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const error = result.error;
  const statusCode = error.statusCode || 500;

  const errorBody = {
    error: error.name.replace("Error", "").toLowerCase(),
    message: error.message,
    ...(error instanceof ValidationError && error.fields
      ? { details: error.fields }
      : {}),
  };

  return new Response(JSON.stringify(errorBody), {
    status: statusCode,
    headers: { "Content-Type": "application/json" },
  });
}

