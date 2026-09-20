import { NextRequest } from "next/server";
import { ZodSchema } from "zod";
import { BadRequestError } from "./errors";

/**
 * Parses and validates a JSON request body against a Zod schema.
 * Throws a ZodError or BadRequestError on invalid data.
 */
export async function parseJsonBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<T> {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    throw new BadRequestError("Malformed JSON body in request.");
  }

  return schema.parse(body);
}

/**
 * Parses and validates URL query parameters against a Zod schema.
 */
export function parseQueryParams<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): T {
  const { searchParams } = new URL(req.url);
  const paramsObj: Record<string, string> = {};

  searchParams.forEach((value, key) => {
    paramsObj[key] = value;
  });

  return schema.parse(paramsObj);
}
