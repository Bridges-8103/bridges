import { NextRequest } from "next/server";
import { sendResponse } from "@/lib/sendResponse";
import { withAuth, type AuthUser } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validate";
import { SessionsService } from "@/modules/sessions/sessions.service";
import { updateBookingStatusSchema } from "@/modules/sessions/sessions.schema";

/**
 * Update booking status (Mentor: confirm/decline, Student: cancel)
 */
export const PATCH = withAuth(async (
  req: NextRequest,
  { user, params }: { user: AuthUser; params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const bookingId = parseInt(id, 10);
  if (isNaN(bookingId)) {
    return sendResponse(400, null, "Invalid booking ID.");
  }

  const dbUser = await SessionsService.resolveDbUser(user);
  const body = await parseJsonBody(req, updateBookingStatusSchema);

  const updated = await SessionsService.updateBookingStatus(
    bookingId,
    dbUser.id,
    body
  );

  return sendResponse(200, updated, `Booking status updated to ${updated.status}.`);
});
