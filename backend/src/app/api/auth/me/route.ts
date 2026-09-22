import { NextRequest } from "next/server";
import { sendResponse } from "@/lib/sendResponse";
import { withAuth } from "@/lib/auth";

/**
 * Current user session
 * @description Returns the claims of the currently authenticated user.
 * @response 200:authMeResponseSchema
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = withAuth(async (_req: NextRequest, { user }) => {
  return sendResponse(
    200,
    { user },
    "Current user session retrieved successfully."
  );
});
