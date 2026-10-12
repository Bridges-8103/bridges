import { NextRequest } from "next/server";
import { sendResponse } from "@/lib/sendResponse";
import { withAuth, type AuthUser } from "@/lib/auth";
import { SessionsService } from "@/modules/sessions/sessions.service";
import { MessagesService } from "@/modules/messages";

/**
 * Retrieve or provision the conversation associated with a specific session booking
 */
export const GET = withAuth(async (
  req: NextRequest,
  { user, params }: { user: AuthUser; params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const bookingId = parseInt(id, 10);
  if (isNaN(bookingId)) {
    return sendResponse(400, null, "Invalid booking ID.");
  }

  const dbUser = await SessionsService.resolveDbUser(user);
  const result = await MessagesService.getConversationByBookingId(bookingId, dbUser.id);

  if (!result) {
    return sendResponse(404, null, "Conversation not available yet. Session must be confirmed first.");
  }

  return sendResponse(200, result, "Booking conversation retrieved successfully.");
});
