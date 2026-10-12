import { NextRequest } from "next/server";
import { sendResponse } from "@/lib/sendResponse";
import { withAuth, type AuthUser } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validate";
import { SessionsService } from "@/modules/sessions/sessions.service";
import {
  MessagesService,
  getMessagesQuerySchema,
  sendMessageSchema,
} from "@/modules/messages";

/**
 * Get messages in a conversation (marks unread messages as read)
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
  const { searchParams } = new URL(req.url);

  const queryResult = getMessagesQuerySchema.safeParse({
    limit: searchParams.get("limit") || undefined,
    cursor: searchParams.get("cursor") || undefined,
  });

  const options = queryResult.success ? queryResult.data : {};
  const messages = await MessagesService.getConversationMessages(
    conversationId,
    dbUser.id,
    options
  );

  return sendResponse(200, messages, "Messages retrieved successfully.");
});

/**
 * Send a new message in a conversation (dispatches push notification to recipient)
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

  const message = await MessagesService.sendMessage(
    conversationId,
    dbUser.id,
    body
  );

  return sendResponse(201, message, "Message sent successfully.");
});
