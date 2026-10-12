import { z } from "zod";

export const sendMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, { message: "Message content cannot be empty" })
    .max(2000, { message: "Message cannot exceed 2000 characters" }),
  messageType: z.enum(["TEXT", "IMAGE", "FILE", "SYSTEM"]).default("TEXT"),
  fileUrl: z.string().trim().url({ message: "fileUrl must be a valid URL" }).optional(),
  fileName: z.string().trim().max(255).optional(),
  fileSize: z.number().int().positive().optional(),
});

export const getMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
  cursor: z.coerce.number().int().positive().optional(),
});
