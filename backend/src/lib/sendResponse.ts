import { NextResponse } from "next/server";

export interface ApiResponse<T = unknown> {
  status: number;
  data: T | null;
  message: string;
  errors?: unknown;
}

/**
 * Standardized API response formatter.
 * Ensures consistent JSON response structure across all API route handlers.
 *
 * @param status - HTTP status code (200, 201, 400, 404, 500, etc.)
 * @param data - The response payload, or null if empty
 * @param message - Optional descriptive message
 * @param errors - Optional error details (e.g., Zod validation errors)
 */
export function sendResponse<T>(
  status: number,
  data: T | null = null,
  message = "",
  errors?: unknown
): NextResponse<ApiResponse<T>> {
  const payload: ApiResponse<T> = {
    status,
    data,
    message,
    ...(errors !== undefined ? { errors } : {}),
  };

  return NextResponse.json(payload, { status });
}

export default sendResponse;
