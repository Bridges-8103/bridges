import { NextRequest } from "next/server";
import { sendResponse } from "@/lib/sendResponse";
import { withAuth } from "@/lib/auth";
import { SessionsService } from "@/modules/sessions/sessions.service";
import { MessagesService } from "@/modules/messages";

/**
 * List all active conversations for the authenticated user
 */
export const GET = withAuth(async (req: NextRequest, { user }) => {
  const dbUser = await SessionsService.resolveDbUser(user);
  const conversations = await MessagesService.getUserConversations(dbUser.id);

  return sendResponse(200, conversations, "Conversations retrieved successfully.");
});
