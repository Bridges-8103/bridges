import { z } from "zod";

export const setAvailabilitySlotItemSchema = z.object({
  startTime: z.string().datetime({ message: "startTime must be a valid ISO datetime string" }),
  endTime: z.string().datetime({ message: "endTime must be a valid ISO datetime string" }).optional(),
  isAvailable: z.boolean(),
});

export const setAvailabilitySchema = z.object({
  slots: z
    .array(setAvailabilitySlotItemSchema)
    .min(1, { message: "At least one slot must be provided" })
    .max(500, { message: "Maximum 500 slots can be submitted at once" }),
});

export const mentorSlotsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const sessionBookingRequestItemSchema = z.object({
  slotId: z.number().int().positive({ message: "slotId must be a positive integer" }),
  topic: z
    .string()
    .trim()
    .min(3, { message: "What you want to cover must be at least 3 characters" })
    .max(500, { message: "What you want to cover cannot exceed 500 characters" }),
  notes: z.string().trim().max(1000).optional(),
});

export const createBookingsSchema = z.object({
  mentorId: z.number().int().positive({ message: "mentorId must be a positive integer" }),
  bookings: z
    .array(sessionBookingRequestItemSchema)
    .min(1, { message: "At least one slot must be selected for booking" })
    .max(10, { message: "You can book up to 10 slots in a single request" }),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "DECLINED", "CANCELLED"]),
  reason: z.string().trim().max(500).optional(),
  meetingLink: z.string().trim().url({ message: "meetingLink must be a valid URL" }).optional().or(z.literal("")),
});
