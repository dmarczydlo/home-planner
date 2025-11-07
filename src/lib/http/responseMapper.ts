import type { Result } from "@/domain/result";
import type { DomainError } from "@/domain/errors";
import { ValidationError, ConflictError } from "@/domain/errors";

export function mapResultToResponse<T>(
  result: Result<T, DomainError>,
  options?: {
    successStatus?: number;
  }
): Response {
  if (result.success) {
    const status = options?.successStatus ?? 200;
    const body = status === 204 ? undefined : JSON.stringify(result.data);

    const headers: HeadersInit = {};
    if (status !== 204) {
      headers["Content-Type"] = "application/json";
    }

    return new Response(body, {
      status,
      headers,
    });
  }

  const error = result.error;
  const statusCode = error.statusCode || 500;

  const errorBody: Record<string, unknown> = {
    error: error.name.replace("Error", "").toLowerCase(),
    message: error.message,
  };

  if (error instanceof ValidationError && error.fields) {
    errorBody.details = error.fields;
  }

  if (error instanceof ConflictError && error.conflictingEvents) {
    errorBody.conflicting_events = error.conflictingEvents;
  }

  return new Response(JSON.stringify(errorBody), {
    status: statusCode,
    headers: { "Content-Type": "application/json" },
  });
}

