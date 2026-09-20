import { NextRequest, NextResponse } from "next/server";
import { UnauthorizedError, ForbiddenError } from "./errors";
import { verifyJwt } from "./jwt";
import { handleApiError } from "./apiHandler";

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

export interface AuthOptions {
  roles?: string[];
}

/**
 * Extracts authentication token from Authorization header (Bearer) or session cookie.
 */
export function extractAuthToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  const cookieToken =
    req.cookies.get("auth_token")?.value || req.cookies.get("token")?.value;
  if (cookieToken) {
    return cookieToken.trim();
  }

  return null;
}

/**
 * Resolves authenticated user identity either from Edge Proxy forwarded headers or by verifying the token.
 */
export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  // 1. First check if Edge Proxy already validated the token and set internal headers
  const headerUserId = req.headers.get("x-user-id");
  const headerEmail = req.headers.get("x-user-email");
  const headerRole = req.headers.get("x-user-role");

  if (headerUserId && headerEmail) {
    return {
      id: headerUserId,
      email: headerEmail,
      role: headerRole || undefined,
    };
  }

  // 2. Fallback: verify the token directly
  const token = extractAuthToken(req);
  if (!token) {
    return null;
  }

  try {
    const payload = await verifyJwt(token);
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

/**
 * Requires an authenticated user session, throwing UnauthorizedError or ForbiddenError if check fails.
 */
export async function requireAuth(
  req: NextRequest,
  options: AuthOptions = {}
): Promise<AuthUser> {
  const user = await getAuthUser(req);

  if (!user) {
    throw new UnauthorizedError(
      "Authentication token is missing, invalid, or expired."
    );
  }

  if (options.roles && options.roles.length > 0) {
    if (!user.role || !options.roles.includes(user.role)) {
      throw new ForbiddenError(
        `Access denied. Requires one of roles: ${options.roles.join(", ")}`
      );
    }
  }

  return user;
}

/**
 * Higher-order wrapper for protected route handlers.
 * Next.js route handlers take (request: NextRequest, context: { params: Promise<any> }).
 * This wrapper extracts and verifies the user, injecting { user, params } into your handler.
 */
export function withAuth<
  TParams extends Record<string, unknown> = Record<string, unknown>
>(
  handler: (
    req: NextRequest,
    context: { user: AuthUser; params: Promise<TParams> }
  ) => Promise<NextResponse | Response>,
  options: AuthOptions = {}
) {
  return async (
    req: NextRequest,
    context: { params: Promise<TParams> }
  ): Promise<NextResponse | Response> => {
    try {
      const user = await requireAuth(req, options);
      return await handler(req, {
        user,
        params: context?.params,
      });
    } catch (error) {
      return handleApiError(error);
    }
  };
}
