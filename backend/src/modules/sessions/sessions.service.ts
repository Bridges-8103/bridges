import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";
import { SESSION_CONFIG } from "./sessions.constants";
import type {
  BookingDto,
  CreateBookingsInput,
  SetAvailabilityInput,
  SlotDto,
  UpdateBookingStatusInput,
} from "./sessions.types";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "@/lib/errors";
import { type AuthUser } from "@/lib/auth";

export class SessionsService {
  /**
   * Resolves the authenticated user (Clerk or local) to a Prisma User record.
   */
  static async resolveDbUser(authUser: AuthUser) {
    if (authUser.email) {
      const user = await prisma.user.findUnique({
        where: { email: authUser.email },
      });
      if (user) return user;
    }

    const numId = parseInt(authUser.id, 10);
    if (!isNaN(numId)) {
      const user = await prisma.user.findUnique({
        where: { id: numId },
      });
      if (user) return user;
    }

    // Auto-provision user if email exists
    if (authUser.email) {
      const newUser = await prisma.user.create({
        data: {
          email: authUser.email,
          name: authUser.email.split("@")[0],
          role: authUser.role === "MENTOR" ? "MENTOR" : "STUDENT",
        },
      });
      return newUser;
    }

    throw new UnauthorizedError("Unable to resolve authenticated user record.");
  }
  /**
   * Public or student-facing: retrieves bookable unreserved slots for a specific mentor.
   */
  static async getMentorAvailableSlots(
    mentorId: number,
    fromStr?: string,
    toStr?: string
  ): Promise<SlotDto[]> {
    const now = new Date();
    const from = fromStr ? new Date(fromStr) : now;
    const to = toStr
      ? new Date(toStr)
      : new Date(now.getTime() + SESSION_CONFIG.BOOKING_HORIZON_DAYS * 24 * 60 * 60 * 1000);

    const slots = await prisma.sessionSlot.findMany({
      where: {
        mentorId,
        isAvailable: true,
        startTime: {
          gte: from > now ? from : now,
          lte: to,
        },
        OR: [
          { booking: null },
          { booking: { status: { in: [BookingStatus.DECLINED, BookingStatus.CANCELLED] } } },
        ],
      },
      include: {
        booking: {
          select: { id: true, status: true },
        },
      },
      orderBy: { startTime: "asc" },
    });

    return slots.map((slot) => ({
      id: slot.id,
      mentorId: slot.mentorId,
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString(),
      isAvailable: slot.isAvailable,
      isBooked: false,
    }));
  }

  /**
   * Mentor-facing: retrieves all configured slots for the authenticated mentor.
   */
  static async getMentorConfiguredSlots(
    mentorUserId: number,
    fromStr?: string,
    toStr?: string
  ): Promise<SlotDto[]> {
    const now = new Date();
    const from = fromStr ? new Date(fromStr) : now;
    const to = toStr
      ? new Date(toStr)
      : new Date(now.getTime() + SESSION_CONFIG.BOOKING_HORIZON_DAYS * 24 * 60 * 60 * 1000);

    const slots = await prisma.sessionSlot.findMany({
      where: {
        mentorId: mentorUserId,
        startTime: {
          gte: from,
          lte: to,
        },
      },
      include: {
        booking: {
          select: { id: true, status: true },
        },
      },
      orderBy: { startTime: "asc" },
    });

    return slots.map((slot) => {
      const activeBooking =
        slot.booking &&
        (slot.booking.status === BookingStatus.PENDING ||
          slot.booking.status === BookingStatus.CONFIRMED);

      return {
        id: slot.id,
        mentorId: slot.mentorId,
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
        isAvailable: slot.isAvailable,
        isBooked: Boolean(activeBooking),
        bookingStatus: slot.booking?.status,
        bookingId: slot.booking?.id,
      };
    });
  }

  /**
   * Mentor-facing: bulk upsert availability slots.
   */
  static async setMentorAvailability(
    mentorUserId: number,
    input: SetAvailabilityInput
  ): Promise<{ updatedCount: number }> {
    let updatedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const item of input.slots) {
        const start = new Date(item.startTime);
        const end = item.endTime
          ? new Date(item.endTime)
          : new Date(start.getTime() + SESSION_CONFIG.SLOT_DURATION_MINUTES * 60 * 1000);

        // Check if there is an existing active booking for this slot
        const existingSlot = await tx.sessionSlot.findUnique({
          where: {
            mentorId_startTime: {
              mentorId: mentorUserId,
              startTime: start,
            },
          },
          include: { booking: true },
        });

        if (
          existingSlot?.booking &&
          (existingSlot.booking.status === BookingStatus.PENDING ||
            existingSlot.booking.status === BookingStatus.CONFIRMED)
        ) {
          if (!item.isAvailable) {
            throw new ConflictError(
              `Cannot remove availability for slot at ${start.toISOString()} because it already has an active booking request.`
            );
          }
        }

        await tx.sessionSlot.upsert({
          where: {
            mentorId_startTime: {
              mentorId: mentorUserId,
              startTime: start,
            },
          },
          create: {
            mentorId: mentorUserId,
            startTime: start,
            endTime: end,
            isAvailable: item.isAvailable,
          },
          update: {
            endTime: end,
            isAvailable: item.isAvailable,
          },
        });

        updatedCount++;
      }
    });

    return { updatedCount };
  }

  /**
   * Student-facing: atomically reserve one or multiple session slots with notes on what to cover.
   */
  static async createBookings(
    studentUserId: number,
    input: CreateBookingsInput
  ): Promise<BookingDto[]> {
    if (studentUserId === input.mentorId) {
      throw new BadRequestError("You cannot book a mentorship session with yourself.");
    }

    const mentor = await prisma.user.findUnique({
      where: { id: input.mentorId },
    });
    if (!mentor) {
      throw new NotFoundError(`Mentor with ID ${input.mentorId} not found.`);
    }

    const batchId = crypto.randomUUID();
    const slotIds = input.bookings.map((b) => b.slotId);

    // Atomically reserve the slots and create bookings
    const createdBookings = await prisma.$transaction(async (tx) => {
      const slots = await tx.sessionSlot.findMany({
        where: {
          id: { in: slotIds },
          mentorId: input.mentorId,
        },
        include: {
          booking: true,
        },
      });

      if (slots.length !== slotIds.length) {
        throw new NotFoundError("One or more requested slots do not exist for this mentor.");
      }

      const now = new Date();
      for (const slot of slots) {
        if (slot.startTime <= now) {
          throw new BadRequestError(
            `Slot at ${slot.startTime.toISOString()} is in the past and cannot be booked.`
          );
        }

        const isTaken =
          !slot.isAvailable ||
          (slot.booking &&
            (slot.booking.status === BookingStatus.PENDING ||
              slot.booking.status === BookingStatus.CONFIRMED));

        if (isTaken) {
          throw new ConflictError(
            `Slot at ${slot.startTime.toISOString()} is no longer available. Please choose another time.`
          );
        }
      }

      const results = [];
      for (const bookingReq of input.bookings) {
        const slot = slots.find((s) => s.id === bookingReq.slotId)!;

        // If a previously declined or cancelled booking exists for this slot, delete or replace it
        if (slot.booking) {
          await tx.sessionBooking.delete({
            where: { id: slot.booking.id },
          });
        }

        // Create new booking
        const newBooking = await tx.sessionBooking.create({
          data: {
            slotId: slot.id,
            mentorId: input.mentorId,
            studentId: studentUserId,
            batchId,
            topic: bookingReq.topic,
            notes: bookingReq.notes || null,
            status: BookingStatus.PENDING,
          },
          include: {
            slot: true,
            mentor: { include: { mentorDetail: true } },
            student: { include: { studentDetail: true } },
          },
        });

        // Mark slot as booked/unavailable
        await tx.sessionSlot.update({
          where: { id: slot.id },
          data: { isAvailable: false },
        });

        results.push(newBooking);
      }

      return results;
    });

    return createdBookings.map((b) => this.mapBookingToDto(b));
  }

  /**
   * Retrieves bookings for the authenticated user (as student or mentor).
   */
  static async getUserBookings(
    userId: number,
    role?: string,
    statusFilter?: BookingStatus
  ): Promise<BookingDto[]> {
    const isMentor = role === "MENTOR";

    const bookings = await prisma.sessionBooking.findMany({
      where: {
        ...(isMentor ? { mentorId: userId } : { studentId: userId }),
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      include: {
        slot: true,
        mentor: { include: { mentorDetail: true } },
        student: { include: { studentDetail: true } },
      },
      orderBy: { slot: { startTime: "asc" } },
    });

    return bookings.map((b) => this.mapBookingToDto(b));
  }

  /**
   * Mentor confirms/declines or student cancels a booking.
   */
  static async updateBookingStatus(
    bookingId: number,
    actorUserId: number,
    input: UpdateBookingStatusInput
  ): Promise<BookingDto> {
    const booking = await prisma.sessionBooking.findUnique({
      where: { id: bookingId },
      include: {
        slot: true,
        mentor: { include: { mentorDetail: true } },
        student: { include: { studentDetail: true } },
      },
    });

    if (!booking) {
      throw new NotFoundError(`Booking with ID ${bookingId} not found.`);
    }

    const isMentor = booking.mentorId === actorUserId;
    const isStudent = booking.studentId === actorUserId;

    if (!isMentor && !isStudent) {
      throw new ForbiddenError("You do not have permission to update this booking.");
    }

    // Role-specific action validation
    if (input.status === "CONFIRMED" || input.status === "DECLINED") {
      if (!isMentor) {
        throw new ForbiddenError("Only the mentor can confirm or decline this session.");
      }
    } else if (input.status === "CANCELLED") {
      // Both student or mentor can cancel
    }

    const nextStatus = input.status as BookingStatus;

    // Execute in transaction
    const updated = await prisma.$transaction(async (tx) => {
      // If declining or cancelling, unlock the slot for future bookings
      if (nextStatus === BookingStatus.DECLINED || nextStatus === BookingStatus.CANCELLED) {
        await tx.sessionSlot.update({
          where: { id: booking.slotId },
          data: { isAvailable: true },
        });
      }

      return tx.sessionBooking.update({
        where: { id: bookingId },
        data: {
          status: nextStatus,
          declineReason: input.reason || booking.declineReason,
          meetingLink: input.meetingLink || booking.meetingLink,
        },
        include: {
          slot: true,
          mentor: { include: { mentorDetail: true } },
          student: { include: { studentDetail: true } },
        },
      });
    });

    return this.mapBookingToDto(updated);
  }

  /**
   * Helper mapper to standardized BookingDto
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static mapBookingToDto(b: any): BookingDto {
    return {
      id: b.id,
      slotId: b.slotId,
      mentorId: b.mentorId,
      studentId: b.studentId,
      batchId: b.batchId,
      topic: b.topic,
      notes: b.notes,
      status: b.status,
      meetingLink: b.meetingLink,
      declineReason: b.declineReason,
      slot: {
        startTime: b.slot.startTime.toISOString(),
        endTime: b.slot.endTime.toISOString(),
      },
      mentor: b.mentor
        ? {
            id: String(b.mentor.id),
            name: b.mentor.name,
            email: b.mentor.mentorDetail?.contactEmail || b.mentor.email,
            avatarUrl: b.mentor.avatarUrl,
            role: b.mentor.role,
            subtitle: b.mentor.mentorDetail?.jobTitle
              ? `${b.mentor.mentorDetail.jobTitle}${b.mentor.mentorDetail.company ? ` @ ${b.mentor.mentorDetail.company}` : ""}`
              : undefined,
          }
        : undefined,
      student: b.student
        ? {
            id: String(b.student.id),
            name: b.student.name,
            email: b.student.email,
            avatarUrl: b.student.avatarUrl,
            role: b.student.role,
            subtitle: b.student.studentDetail?.university
              ? `${b.student.studentDetail.university}${b.student.studentDetail.fieldOfStudy ? ` · ${b.student.studentDetail.fieldOfStudy}` : ""}`
              : undefined,
          }
        : undefined,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    };
  }
}
