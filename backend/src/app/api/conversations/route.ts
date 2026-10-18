import { NextRequest } from "next/server";
import { sendResponse } from "@/lib/sendResponse";
import { withAuth } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validate";
import { SessionsService } from "@/modules/sessions/sessions.service";
import { MessagingService, startConversationSchema } from "@/modules/messaging";

/**
 * List the authenticated user's conversations (chat-eligible mentor/student pairs)
 */
export const GET = withAuth(async (_req: NextRequest, { user }) => {
  const dbUser = await SessionsService.resolveDbUser(user);
  const conversations = await MessagingService.listConversations(dbUser.id);

  return sendResponse(200, conversations, "Conversations retrieved successfully.");
});

/**
 * Get or create the conversation with another user (requires a confirmed session between them)
 */
export const POST = withAuth(async (req: NextRequest, { user }) => {
  const dbUser = await SessionsService.resolveDbUser(user);
  const body = await parseJsonBody(req, startConversationSchema);

  const conversation = await MessagingService.getOrCreateConversation(dbUser.id, body.participantId);

  return sendResponse(200, conversation, "Conversation retrieved successfully.");
});
