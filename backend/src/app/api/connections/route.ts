import { NextRequest } from "next/server";
import { sendResponse } from "@/lib/sendResponse";
import { withAuth } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validate";
import {
  createConnectionSchema,
  connectionQuerySchema,
} from "@/modules/connections/connections.schema";
import { ConnectionsService } from "@/modules/connections/connections.service";

/**
 * List active connections
 * @description Retrieves a paginated list of the authenticated user's active 1st-degree connections.
 * @auth bearer
 * @response 200
 * @openapi
 */
export const GET = withAuth(async (req: NextRequest, { user }) => {
  const dbUser = await ConnectionsService.resolveDbUser(user);
  const { searchParams } = new URL(req.url);

  const rawQuery = {
    page: searchParams.get("page") || undefined,
    limit: searchParams.get("limit") || undefined,
    search: searchParams.get("search") || undefined,
    role: searchParams.get("role") || undefined,
  };

  const parsed = connectionQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    return sendResponse(400, null, "Invalid query parameters.", parsed.error.format());
  }

  const result = await ConnectionsService.listConnections(dbUser.id, parsed.data);
  return sendResponse(200, result, "Connections retrieved successfully.");
});

/**
 * Send connection request
 * @description Sends a connection request to another student or mentor, or auto-connects if the receiver already requested.
 * @auth bearer
 * @body createConnectionSchema
 * @response 201
 * @openapi
 */
export const POST = withAuth(async (req: NextRequest, { user }) => {
  const dbUser = await ConnectionsService.resolveDbUser(user);
  const body = await parseJsonBody(req, createConnectionSchema);

  const connection = await ConnectionsService.createConnection(dbUser.id, body);
  return sendResponse(201, connection, "Connection request sent successfully.");
});
