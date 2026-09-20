import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { sendResponse } from "./sendResponse";
import { ApiError } from "./errors";

/**
 * Standard error dispatcher that converts caught errors into standardized API responses.
 */
export function handleApiError(error: unknown): NextResponse {
  // Handle schema validation errors from Zod
  if (error instanceof ZodError) {
    return sendResponse(
      400,
      null,
      "Validation failed. Please check the request payload.",
      error.flatten()
    );
  }

  // Handle explicitly thrown domain/HTTP errors
  if (error instanceof ApiError) {
    return sendResponse(error.statusCode, null, error.message, error.errors);
  }

  // Handle generic and unhandled errors
  const isDev = process.env.NODE_ENV === "development";
  console.error("[API Unhandled Error]:", error);

  return sendResponse(
    500,
    null,
    isDev && error instanceof Error
      ? error.message
      : "Internal server error occurred.",
    isDev && error instanceof Error ? { stack: error.stack } : undefined
  );
}

/**
 * Higher-order function wrapping Next.js route handlers with standard error catching.
 */
export function withErrorHandler<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<NextResponse | Response>
) {
  return async (...args: TArgs): Promise<NextResponse | Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
