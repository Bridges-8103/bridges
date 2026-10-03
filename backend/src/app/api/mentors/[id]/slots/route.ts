import { NextRequest } from "next/server";
import { sendResponse } from "@/lib/sendResponse";
import { SessionsService } from "@/modules/sessions/sessions.service";
import { mentorSlotsQuerySchema } from "@/modules/sessions/sessions.schema";

/**
 * Fetch available booking slots for a mentor
 * @description Retrieves upcoming 30-min unreserved slots configured by the mentor.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const mentorId = parseInt(id, 10);
  if (isNaN(mentorId)) {
    return sendResponse(400, null, "Invalid mentor ID.");
  }

  const { searchParams } = new URL(req.url);
  const parsedQuery = mentorSlotsQuerySchema.safeParse({
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
  });

  if (!parsedQuery.success) {
    return sendResponse(400, null, "Invalid date query parameters", parsedQuery.error.format());
  }

  const slots = await SessionsService.getMentorAvailableSlots(
    mentorId,
    parsedQuery.data.from,
    parsedQuery.data.to
  );

  return sendResponse(200, slots, "Available slots retrieved successfully.");
}
