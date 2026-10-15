import { NextRequest } from "next/server";
import { sendResponse } from "@/lib/sendResponse";
import { withAuth } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validate";
import {
  connectionParamsSchema,
  updateConnectionStatusSchema,
} from "@/modules/connections/connections.schema";
import { ConnectionsService } from "@/modules/connections/connections.service";

/**
 * Respond to connection request
 * @description Accepts or declines an incoming pending connection request.
 * @auth bearer
 * @body updateConnectionStatusSchema
 * @response 200
 * @openapi
 */
export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, { params, user }) => {
    const rawParams = await params;
    const parsedParams = connectionParamsSchema.safeParse(rawParams);

    if (!parsedParams.success) {
      return sendResponse(400, null, "Invalid connection ID.", parsedParams.error.format());
    }

    const body = await parseJsonBody(req, updateConnectionStatusSchema);
    const dbUser = await ConnectionsService.resolveDbUser(user);

    const updated = await ConnectionsService.respondToRequest(
      dbUser.id,
      parsedParams.data.id,
      body
    );

    return sendResponse(200, updated, `Connection ${body.status.toLowerCase()} successfully.`);
  }
);

/**
 * Remove connection or withdraw request
 * @description Removes a mutual connection or withdraws a pending outgoing request.
 * @auth bearer
 * @response 200
 * @openapi
 */
export const DELETE = withAuth<{ id: string }>(
  async (_req: NextRequest, { params, user }) => {
    const rawParams = await params;
    const parsedParams = connectionParamsSchema.safeParse(rawParams);

    if (!parsedParams.success) {
      return sendResponse(400, null, "Invalid connection ID.", parsedParams.error.format());
    }

    const dbUser = await ConnectionsService.resolveDbUser(user);
    const result = await ConnectionsService.removeConnection(dbUser.id, parsedParams.data.id);

    return sendResponse(200, result, result.message);
  }
);
