import { z } from "zod";

export const createConnectionSchema = z.object({
  receiverId: z.coerce.number().int().positive("Receiver ID must be a positive integer"),
  note: z.string().max(500, "Note cannot exceed 500 characters").optional(),
});

export const updateConnectionStatusSchema = z.object({
  status: z.enum(["CONNECTED", "DECLINED"]),
});

export const connectionParamsSchema = z.object({
  id: z.coerce.number().int().positive("Connection ID must be a positive integer"),
});

export const targetUserParamsSchema = z.object({
  targetUserId: z.coerce.number().int().positive("Target User ID must be a positive integer"),
});

export const connectionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  role: z.enum(["STUDENT", "MENTOR"]).optional(),
});
