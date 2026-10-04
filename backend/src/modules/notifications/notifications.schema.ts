import { z } from "zod";

export const registerPushTokenSchema = z.object({
  token: z
    .string()
    .trim()
    .min(1, { message: "Push token is required" })
    .regex(/^(ExponentPushToken|ExpoPushToken)\[.*\]$/, {
      message: "Must be a valid Expo push token format, e.g. ExponentPushToken[xxx]",
    }),
  platform: z.enum(["ios", "android", "web"]).optional(),
  deviceId: z.string().trim().max(255).optional(),
  deviceName: z.string().trim().max(255).optional(),
});

export const unregisterPushTokenSchema = z.object({
  token: z.string().trim().min(1, { message: "Push token is required" }),
});

export const sendTestPushSchema = z.object({
  token: z
    .string()
    .trim()
    .regex(/^(ExponentPushToken|ExpoPushToken)\[.*\]$/, {
      message: "Must be a valid Expo push token format, e.g. ExponentPushToken[xxx]",
    })
    .optional(),
  userId: z.union([z.number().int().positive(), z.string().trim()]).optional(),
  title: z.string().trim().min(1).default("Bridges Notification Test"),
  body: z.string().trim().min(1).default("This is a test notification from the Bridges backend!"),
  data: z.record(z.unknown()).optional(),
  channelId: z.string().trim().optional(),
});

export type RegisterPushTokenBody = z.infer<typeof registerPushTokenSchema>;
export type UnregisterPushTokenBody = z.infer<typeof unregisterPushTokenSchema>;
export type SendTestPushBody = z.infer<typeof sendTestPushSchema>;
