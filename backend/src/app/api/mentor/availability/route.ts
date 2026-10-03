import { NextRequest } from "next/server";
import { sendResponse } from "@/lib/sendResponse";
import { withAuth } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validate";
import { SessionsService } from "@/modules/sessions/sessions.service";
import {
  mentorSlotsQuerySchema,
  setAvailabilitySchema,
} from "@/modules/sessions/sessions.schema";

/**
 * Get authenticated mentor's configured slots
 */
export const GET = withAuth(async (req: NextRequest, { user }) => {
  const dbUser = await SessionsService.resolveDbUser(user);

  const { searchParams } = new URL(req.url);
  const parsedQuery = mentorSlotsQuerySchema.safeParse({
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
  });

  if (!parsedQuery.success) {
    return sendResponse(400, null, "Invalid date query parameters", parsedQuery.error.format());
  }

  const slots = await SessionsService.getMentorConfiguredSlots(
    dbUser.id,
    parsedQuery.data.from,
    parsedQuery.data.to
  );

  return sendResponse(200, slots, "Configured slots retrieved successfully.");
});

/**
 * Bulk save/toggle availability slots for authenticated mentor
 */
export const PUT = withAuth(async (req: NextRequest, { user }) => {
  const dbUser = await SessionsService.resolveDbUser(user);
  const body = await parseJsonBody(req, setAvailabilitySchema);

  const result = await SessionsService.setMentorAvailability(dbUser.id, body);

  return sendResponse(200, result, "Mentor availability updated successfully.");
});
