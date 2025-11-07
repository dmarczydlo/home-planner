import type { APIContext } from "astro";
import type { Result } from "@/domain/result";
import { ok, err } from "@/domain/result";
import { ValidationError } from "@/domain/errors";
import type { z } from "zod";
import { mapResultToResponse } from "./responseMapper";

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

export function getQueryParam(url: URL, name: string): string | undefined {
  return url.searchParams.get(name) ?? undefined;
}

export function getQueryParamAsInt(url: URL, name: string, defaultValue?: number): number | undefined {
  const value = url.searchParams.get(name);
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export function getQueryParamAsBoolean(url: URL, name: string, defaultValue?: boolean): boolean | undefined {
  const value = url.searchParams.get(name);
  if (!value) return defaultValue;
  return value === "true" || value === "1";
}

function formatZodErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  error.issues.forEach((issue) => {
    const path = issue.path.join(".");
    fieldErrors[path] = issue.message;
  });
  return fieldErrors;
}

export function validatePathParams<T>(
  schema: z.ZodSchema<T>,
  params: unknown,
  errorMessage: string = "Invalid path parameters"
): Result<T, ValidationError> {
  const validation = schema.safeParse(params);
  if (!validation.success) {
    return err(new ValidationError(errorMessage, formatZodErrors(validation.error)));
  }
  return ok(validation.data);
}

export function validateQueryParams<T>(
  schema: z.ZodSchema<T>,
  url: URL,
  errorMessage: string = "Invalid query parameters"
): Result<T, ValidationError> {
  const queryParams: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });

  const validation = schema.safeParse(queryParams);
  if (!validation.success) {
    return err(new ValidationError(errorMessage, formatZodErrors(validation.error)));
  }
  return ok(validation.data);
}

export async function validateBody<T>(
  schema: z.ZodSchema<T>,
  request: Request,
  errorMessage: string = "Invalid request body"
): Promise<Result<T, ValidationError>> {
  const bodyResult = await parseJSON(request);
  if (!bodyResult.success) {
    return bodyResult;
  }

  const validation = schema.safeParse(bodyResult.data);
  if (!validation.success) {
    return err(new ValidationError(errorMessage, formatZodErrors(validation.error)));
  }
  return ok(validation.data);
}

export function validateResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  errorMessage: string = "Invalid response data"
): Result<T, ValidationError> {
  const validation = schema.safeParse(data);
  if (!validation.success) {
    return err(new ValidationError(errorMessage, { response: "Failed validation" }));
  }
  return ok(validation.data);
}

type ApiHandlerContext<TPath = unknown, TQuery = unknown, TBody = unknown> = {
  userId: string;
  path: TPath;
  query: TQuery;
  body: TBody;
  locals: APIContext["locals"];
};

type ApiHandler<TPath = unknown, TQuery = unknown, TBody = unknown> = (
  context: ApiHandlerContext<TPath, TQuery, TBody>
) => Promise<Response> | Response;

type HandleApiRequestOptions<TPath = unknown, TQuery = unknown, TBody = unknown> = {
  handler: ApiHandler<TPath, TQuery, TBody>;
  context: string;
  pathSchema?: z.ZodSchema<TPath>;
  querySchema?: z.ZodSchema<TQuery>;
  bodySchema?: z.ZodSchema<TBody>;
  requireAuth?: boolean;
  params?: unknown;
  url?: URL;
  request?: Request;
  locals: APIContext["locals"];
};

export async function handleApiRequest(
  handler: () => Promise<Response> | Response,
  contextString: string
): Promise<Response>;
export async function handleApiRequest<TPath = unknown, TQuery = unknown, TBody = unknown>(
  options: HandleApiRequestOptions<TPath, TQuery, TBody>
): Promise<Response>;
export async function handleApiRequest<TPath = unknown, TQuery = unknown, TBody = unknown>(
  handlerOrOptions: (() => Promise<Response> | Response) | HandleApiRequestOptions<TPath, TQuery, TBody>,
  contextString?: string
): Promise<Response> {
  if (typeof handlerOrOptions === "function") {
    const handler = handlerOrOptions;
    const ctx = contextString!;
    try {
      return await handler();
    } catch (error) {
      console.error(`Unexpected error in ${ctx}:`, error);
      return new Response(
        JSON.stringify({
          error: "internal_error",
          message: "An unexpected error occurred",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  const options = handlerOrOptions as HandleApiRequestOptions<TPath, TQuery, TBody>;
  const {
    handler,
    context,
    pathSchema,
    querySchema,
    bodySchema,
    requireAuth: requireAuthOption = true,
    params,
    url,
    request,
    locals,
  } = options;

  try {
    const userId = requireAuthOption ? requireAuth(locals) : "";
    if (userId instanceof Response) return userId;

    let pathData: TPath = undefined as TPath;
    let queryData: TQuery = undefined as TQuery;
    let bodyData: TBody = undefined as TBody;

    if (pathSchema && params !== undefined) {
      const pathResult = validatePathParams(pathSchema, params);
      if (!pathResult.success) {
        return mapResultToResponse(pathResult);
      }
      pathData = pathResult.data;
    }

    if (querySchema && url) {
      const queryResult = validateQueryParams(querySchema, url);
      if (!queryResult.success) {
        return mapResultToResponse(queryResult);
      }
      queryData = queryResult.data;
    }

    if (bodySchema && request) {
      const bodyResult = await validateBody(bodySchema, request);
      if (!bodyResult.success) {
        return mapResultToResponse(bodyResult);
      }
      bodyData = bodyResult.data;
    }

    return await handler({
      userId: userId as string,
      path: pathData,
      query: queryData,
      body: bodyData,
      locals,
    });
  } catch (error) {
    console.error(`Unexpected error in ${context}:`, error);
    return new Response(
      JSON.stringify({
        error: "internal_error",
        message: "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
