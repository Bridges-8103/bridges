import { NextRequest } from "next/server";
import { sendResponse } from "@/lib/sendResponse";
import { withAuth } from "@/lib/auth";
import { targetUserParamsSchema } from "@/modules/connections/connections.schema";
import { ConnectionsService } from "@/modules/connections/connections.service";

/**
 * Get connection status with target user
 * @description Retrieves relationship status between authenticated user and target user (NONE, PENDING_SENT, PENDING_RECEIVED, CONNECTED, SELF).
 * @auth bearer
 * @response 200
 * @openapi
 */
export const GET = withAuth<{ targetUserId: string }>(
  async (_req: NextRequest, { params, user }) => {
    const rawParams = await params;
    const parsed = targetUserParamsSchema.safeParse(rawParams);

    if (!parsed.success) {
      return sendResponse(400, null, "Invalid target user ID.", parsed.error.format());
    }

    const dbUser = await ConnectionsService.resolveDbUser(user);
    const status = await ConnectionsService.getConnectionStatus(dbUser.id, parsed.data.targetUserId);

    return sendResponse(200, status, "Connection status retrieved successfully.");
  }
);
