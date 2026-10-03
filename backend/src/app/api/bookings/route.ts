import { NextRequest } from "next/server";
import { sendResponse } from "@/lib/sendResponse";
import { withAuth } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validate";
import { SessionsService } from "@/modules/sessions/sessions.service";
import { createBookingsSchema } from "@/modules/sessions/sessions.schema";
import { BookingStatus } from "@prisma/client";

/**
 * Get user's bookings (as student or mentor)
 */
export const GET = withAuth(async (req: NextRequest, { user }) => {
  const dbUser = await SessionsService.resolveDbUser(user);
  const { searchParams } = new URL(req.url);

  const queryRole = searchParams.get("role") || dbUser.role;
  const statusParam = searchParams.get("status");
  const statusFilter =
    statusParam && Object.values(BookingStatus).includes(statusParam as BookingStatus)
      ? (statusParam as BookingStatus)
      : undefined;

  const bookings = await SessionsService.getUserBookings(dbUser.id, queryRole, statusFilter);

  return sendResponse(200, bookings, "Bookings retrieved successfully.");
});

/**
 * Reserve one or multiple session slots
 */
export const POST = withAuth(async (req: NextRequest, { user }) => {
  const dbUser = await SessionsService.resolveDbUser(user);
  const body = await parseJsonBody(req, createBookingsSchema);

  const created = await SessionsService.createBookings(dbUser.id, body);

  return sendResponse(201, created, "Session booking request submitted successfully.");
});
