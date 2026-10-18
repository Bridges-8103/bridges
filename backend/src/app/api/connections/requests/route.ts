import { NextRequest } from "next/server";
import { sendResponse } from "@/lib/sendResponse";
import { withAuth } from "@/lib/auth";
import { ConnectionsService } from "@/modules/connections/connections.service";

/**
 * List pending connection requests
 * @description Retrieves incoming requests awaiting response and outgoing sent requests.
 * @auth bearer
 * @response 200
 * @openapi
 */
export const GET = withAuth(async (_req: NextRequest, { user }) => {
  const dbUser = await ConnectionsService.resolveDbUser(user);
  const result = await ConnectionsService.listRequests(dbUser.id);
  return sendResponse(200, result, "Pending connection requests retrieved successfully.");
});
