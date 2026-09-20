import { NextRequest } from "next/server";
import { sendResponse } from "@/lib/sendResponse";
import { withAuth } from "@/lib/auth";

/**
 * GET /api/auth/me
 * Protected route returning the current authenticated user's session claims.
 */
export const GET = withAuth(async (_req: NextRequest, { user }) => {
  return sendResponse(
    200,
    { user },
    "Current user session retrieved successfully."
  );
});
