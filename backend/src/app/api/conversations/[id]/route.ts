import { NextRequest } from "next/server";
import { sendResponse } from "@/lib/sendResponse";
import { withAuth, type AuthUser } from "@/lib/auth";
import { SessionsService } from "@/modules/sessions/sessions.service";
import { MessagingService } from "@/modules/messaging";

/**
 * Get a single conversation summary (used for the chat header)
 */
export const GET = withAuth(async (
  _req: NextRequest,
  { user, params }: { user: AuthUser; params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const conversationId = parseInt(id, 10);
  if (isNaN(conversationId)) {
    return sendResponse(400, null, "Invalid conversation ID.");
  }

  const dbUser = await SessionsService.resolveDbUser(user);
  const conversation = await MessagingService.getConversation(conversationId, dbUser.id);

  return sendResponse(200, conversation, "Conversation retrieved successfully.");
});
