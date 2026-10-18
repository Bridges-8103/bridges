import { z } from "zod";

export const MESSAGE_MAX_LENGTH = 2000;

export const sendMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, { message: "Message cannot be empty" })
    .max(MESSAGE_MAX_LENGTH, { message: `Message cannot exceed ${MESSAGE_MAX_LENGTH} characters` }),
});

export const startConversationSchema = z.object({
  participantId: z.number().int().positive({ message: "participantId must be a positive integer" }),
});

export const listMessagesQuerySchema = z.object({
  after: z.coerce.number().int().nonnegative().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(100),
});
