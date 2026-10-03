import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@clerk/nextjs/server";
import { UnauthorizedError, ForbiddenError } from "./errors";
import { verifyJwt } from "./jwt";
import { handleApiError } from "./apiHandler";
import { resolveClerkUser } from "./clerkUser";

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
  let headerEmail = req.headers.get("x-user-email");
  let headerRole = req.headers.get("x-user-role");

  if (headerUserId && headerEmail) {
    // If the proxy passed a placeholder @clerk.user, attempt direct resolution
    if (headerEmail.endsWith("@clerk.user") && headerUserId.startsWith("user_")) {
      const resolved = await resolveClerkUser(headerUserId);
      if (resolved?.email) {
        headerEmail = resolved.email;
        if (!headerRole && resolved.role) {
          headerRole = resolved.role;
        }
      }
    }

    console.log(
      `[auth.getAuthUser] Headers resolved: id=${headerUserId}, email=${headerEmail}, role=${headerRole || 'none'}`
    );

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

  // 2a. Try Clerk token verification
  try {
    const clerkPayload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    const claims = clerkPayload as Record<string, unknown>;
    const userId = clerkPayload.sub;

    let email =
      typeof claims.email === "string"
        ? claims.email
        : typeof claims.primary_email === "string"
        ? claims.primary_email
        : "";
    let role = typeof claims.role === "string" ? claims.role : undefined;

    // Resolve via Clerk User API when email is missing from JWT claims
    if (!email && process.env.CLERK_SECRET_KEY) {
      const resolved = await resolveClerkUser(userId, process.env.CLERK_SECRET_KEY);
      if (resolved) {
        email = resolved.email;
        if (!role && resolved.role) {
          role = resolved.role;
        }
      }
    }

    if (!email) {
      email = `${userId}@clerk.user`;
    }

    console.log(
      `[auth.getAuthUser] Clerk token verified: sub=${userId}, email=${email}, role=${role || 'none'}`
    );

    return {
      id: userId,
      email,
      role,
    };
  } catch {
    // 2b. Fallback: verify backend HS256 JWT
    try {
      const payload = await verifyJwt(token);
      console.log(
        `[auth.getAuthUser] Local JWT verified: sub=${payload.sub}, email=${payload.email}, role=${payload.role || 'none'}`
      );
      return {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    } catch {
      return null;
    }
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

/**
 * Checks whether the current authenticated user is the owner of a resource or has an ADMIN role.
 *
 * @param resourceOwnerId The ID of the user who owns the resource.
 * @param actor The authenticated user making the request.
 * @returns boolean indicating if the actor is authorized.
 */
export function isOwnerOrAdmin(
  resourceOwnerId: string | number | null | undefined,
  actor: AuthUser
): boolean {
  if (!resourceOwnerId || !actor) {
    return false;
  }
  // Admins always have full permissions across resources
  if (actor.role === "ADMIN") {
    return true;
  }
  return String(resourceOwnerId) === String(actor.id);
}

/**
 * Asserts that the authenticated user owns the resource or has an ADMIN role.
 * Throws a ForbiddenError (HTTP 403) if authorization check fails.
 *
 * @param resourceOwnerId The ID of the user who owns the resource.
 * @param actor The authenticated user making the request.
 * @param customMessage Optional custom error message.
 * @throws ForbiddenError when the user does not have permission.
 */
export function assertOwnership(
  resourceOwnerId: string | number | null | undefined,
  actor: AuthUser,
  customMessage = "Forbidden: You do not have permission to access or modify another account's resource."
): void {
  if (!isOwnerOrAdmin(resourceOwnerId, actor)) {
    throw new ForbiddenError(customMessage);
  }
}
