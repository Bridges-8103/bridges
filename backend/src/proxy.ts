import { clerkMiddleware, createRouteMatcher, verifyToken } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { verifyJwt } from "@/lib/jwt";
import { sendResponse } from "@/lib/sendResponse";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

/**
 * Public routes that do not require authentication tokens.
 */
const PUBLIC_API_PATHS = [
  "/api-docs",
  "/openapi.json",
  "/api/health",
  "/api/auth/register",
  "/api/auth/refresh",
];

/**
 * Checks if a requested pathname matches any public route.
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_API_PATHS.some(
    (publicPath) => pathname === publicPath || pathname.startsWith(`${publicPath}/`)
  );
}

/**
 * Extracts the bearer token from the Authorization header or fallback cookies.
 */
function getBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  const cookieToken =
    req.cookies.get("auth_token")?.value || req.cookies.get("token")?.value;
  return cookieToken ? cookieToken.trim() : null;
}

/**
 * Helper to apply common CORS headers.
 */
function applyCorsHeaders(response: NextResponse, origin: string | null): NextResponse {
  response.headers.set("Access-Control-Allow-Origin", origin || "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  response.headers.set("Access-Control-Allow-Credentials", "true");
  return response;
}

/**
 * Edge Proxy handler for API routes.
 * Intercepts requests before reaching App Router handlers to enforce CORS, route guards,
 * and authenticated user header injection.
 */
async function handleApiProxy(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  const origin = req.headers.get("origin");

  // Handle CORS preflight OPTIONS request
  if (req.method === "OPTIONS") {
    const preflight = new NextResponse(null, { status: 204 });
    return applyCorsHeaders(preflight, origin);
  }

  // Allow public endpoints to pass through directly
  if (isPublicRoute(pathname)) {
    const response = NextResponse.next();
    return applyCorsHeaders(response, origin);
  }

  // Protected API routes: verify authentication token at the edge
  const token = getBearerToken(req);

  if (!token) {
    const unauthorized = sendResponse(
      401,
      null,
      "Unauthorized: Missing Bearer token in Authorization header."
    );
    return applyCorsHeaders(unauthorized, origin);
  }

  let userId: string;
  let email = "";
  let role: string | undefined;

  // 1. Primary: Verify as Clerk RS256 token (used by mobile app and dashboard)
  try {
    const clerkPayload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    userId = clerkPayload.sub;
    const claims = clerkPayload as Record<string, unknown>;
    email =
      typeof claims.email === "string"
        ? claims.email
        : typeof claims.primary_email === "string"
        ? claims.primary_email
        : `${userId}@clerk.user`;
    role = typeof claims.role === "string" ? claims.role : undefined;
  } catch {
    // 2. Fallback: Verify as backend HS256 JWT
    try {
      const payload = await verifyJwt(token);
      userId = payload.sub;
      email = payload.email;
      role = payload.role;
    } catch (error) {
      const unauthorized = sendResponse(
        401,
        null,
        "Unauthorized: Token is invalid or expired.",
        error instanceof Error ? error.message : undefined
      );
      return applyCorsHeaders(unauthorized, origin);
    }
  }

  // Forward verified user identity downstream to route handlers via internal headers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", userId);
  requestHeaders.set("x-user-email", email);
  if (role) {
    requestHeaders.set("x-user-role", role);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  return applyCorsHeaders(response, origin);
}

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
    return;
  }

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return handleApiProxy(req);
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.[\\w]+$).*)",
    "/(api|trpc)(.*)",
  ],
};
