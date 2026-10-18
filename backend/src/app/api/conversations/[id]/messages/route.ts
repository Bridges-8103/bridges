import { NextRequest } from "next/server";
import { sendResponse } from "@/lib/sendResponse";
import { withAuth, type AuthUser } from "@/lib/auth";
import { parseJsonBody, parseQueryParams } from "@/lib/validate";
import { SessionsService } from "@/modules/sessions/sessions.service";
import {
  MessagingService,
  listMessagesQuerySchema,
  sendMessageSchema,
} from "@/modules/messaging";

/**
 * List messages in chronological order. Pass `?after=<messageId>` to fetch only newer messages
 * (polling). Also marks the conversation as read for the caller.
 */
export const GET = withAuth(async (
  req: NextRequest,
  { user, params }: { user: AuthUser; params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const conversationId = parseInt(id, 10);
  if (isNaN(conversationId)) {
    return sendResponse(400, null, "Invalid conversation ID.");
  }

  const dbUser = await SessionsService.resolveDbUser(user);
  const query = parseQueryParams(req, listMessagesQuerySchema);
  const messages = await MessagingService.listMessages(conversationId, dbUser.id, query);

  return sendResponse(200, messages, "Messages retrieved successfully.");
});

/**
 * Send a message in a conversation
 */
export const POST = withAuth(async (
  req: NextRequest,
  { user, params }: { user: AuthUser; params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const conversationId = parseInt(id, 10);
  if (isNaN(conversationId)) {
    return sendResponse(400, null, "Invalid conversation ID.");
  }

  const dbUser = await SessionsService.resolveDbUser(user);
  const body = await parseJsonBody(req, sendMessageSchema);
  const message = await MessagingService.sendMessage(conversationId, dbUser.id, body.body);

  return sendResponse(201, message, "Message sent successfully.");
});
