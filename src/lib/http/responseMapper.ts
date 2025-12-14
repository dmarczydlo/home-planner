import type { Result } from "@/domain/result";
import type { DomainError } from "@/domain/errors";
import {
  ValidationError,
  ConflictError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
  InternalError,
  RateLimitError,
} from "@/domain/errors";

function mapDomainErrorToHttpStatus(error: DomainError): number {
  if (error instanceof ValidationError) {
    return 400;
  }
  if (error instanceof UnauthorizedError) {
    return 401;
  }
  if (error instanceof ForbiddenError) {
    return 403;
  }
  if (error instanceof NotFoundError) {
    return 404;
  }
  if (error instanceof ConflictError) {
    return 409;
  }
  if (error instanceof RateLimitError) {
    return 429;
  }
  if (error instanceof InternalError) {
    return 500;
  }
  return 500;
}

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
  const statusCode = mapDomainErrorToHttpStatus(error);

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

  if (error instanceof RateLimitError) {
    errorBody.error = "rate_limit_exceeded";
    errorBody.details = {
      retry_after: error.retryAfter,
    };
    return new Response(JSON.stringify(errorBody), {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": error.retryAfter.toString(),
      },
    });
  }

  return new Response(JSON.stringify(errorBody), {
    status: statusCode,
    headers: { "Content-Type": "application/json" },
  });
}

