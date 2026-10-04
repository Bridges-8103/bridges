import { Expo, type ExpoPushMessage, type ExpoPushTicket } from "expo-server-sdk";
import { prisma } from "@/lib/prisma";
import type {
  RegisterPushTokenInput,
  SendPushNotificationOptions,
  SendPushResult,
  StoredPushToken,
} from "./notifications.types";

const expoClient = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN || undefined,
});

export class NotificationService {
  /**
   * Registers or updates a device push token for an authenticated or guest user.
   */
  static async registerToken(
    userId: number | null,
    input: RegisterPushTokenInput
  ): Promise<StoredPushToken> {
    const existing = await prisma.pushToken.findUnique({
      where: { token: input.token },
    });

    if (existing) {
      return prisma.pushToken.update({
        where: { token: input.token },
        data: {
          userId: userId !== null ? userId : existing.userId,
          platform: input.platform || existing.platform,
          deviceId: input.deviceId || existing.deviceId,
          deviceName: input.deviceName || existing.deviceName,
          isActive: true,
          lastUsedAt: new Date(),
        },
      });
    }

    return prisma.pushToken.create({
      data: {
        token: input.token,
        userId,
        platform: input.platform || null,
        deviceId: input.deviceId || null,
        deviceName: input.deviceName || null,
        isActive: true,
        lastUsedAt: new Date(),
      },
    });
  }

  /**
   * Deactivates a device push token (e.g. upon user logout).
   */
  static async unregisterToken(token: string): Promise<boolean> {
    const result = await prisma.pushToken.updateMany({
      where: { token },
      data: { isActive: false },
    });
    return result.count > 0;
  }

  /**
   * Retrieves all active device tokens for a given user ID.
   */
  static async getActiveUserTokens(userId: number): Promise<StoredPushToken[]> {
    return prisma.pushToken.findMany({
      where: { userId, isActive: true },
    });
  }

  /**
   * Dispatches push notifications to one or multiple Expo push tokens.
   * Batches notifications in chunks of <= 100 and handles invalid/unregistered tokens.
   */
  static async sendPushNotifications(
    options: SendPushNotificationOptions
  ): Promise<SendPushResult> {
    const rawTokens = Array.isArray(options.to) ? options.to : [options.to];
    const uniqueTokens = Array.from(new Set(rawTokens.filter(Boolean)));

    const validTokens: string[] = [];
    const invalidFormatTokens: string[] = [];

    for (const token of uniqueTokens) {
      if (Expo.isExpoPushToken(token)) {
        validTokens.push(token);
      } else {
        invalidFormatTokens.push(token);
        console.warn(`[NotificationService] Token is not a valid Expo push token: ${token}`);
      }
    }

    if (validTokens.length === 0) {
      return {
        total: uniqueTokens.length,
        successCount: 0,
        failureCount: uniqueTokens.length,
        tickets: [],
        deactivatedTokens: [],
      };
    }

    // Build message payloads
    const messages: ExpoPushMessage[] = validTokens.map((token) => ({
      to: token,
      sound: options.sound === null ? null : (options.sound || "default"),
      title: options.title,
      body: options.body,
      data: options.data,
      badge: options.badge,
      channelId: options.channelId,
      priority: options.priority,
    }));

    // Chunk into batches of up to 100 messages
    const chunks = expoClient.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];
    const tokensToDeactivate: string[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expoClient.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);

        // Check tickets for device unregistered errors
        ticketChunk.forEach((ticket, index) => {
          if (ticket.status === "error") {
            console.error(
              `[NotificationService] Push notification ticket error: ${ticket.message} (${ticket.details?.error})`
            );
            if (ticket.details?.error === "DeviceNotRegistered") {
              const target = chunk[index]?.to;
              if (typeof target === "string") {
                tokensToDeactivate.push(target);
              }
            }
          }
        });
      } catch (error) {
        console.error("[NotificationService] Batch push transmission error:", error);
      }
    }

    // Automatically deactivate tokens that are no longer registered on Apple/Google servers
    if (tokensToDeactivate.length > 0) {
      console.log(
        `[NotificationService] Deactivating ${tokensToDeactivate.length} unregistered tokens...`
      );
      await prisma.pushToken.updateMany({
        where: { token: { in: tokensToDeactivate } },
        data: { isActive: false },
      });
    }

    const successCount = tickets.filter((t) => t.status === "ok").length;
    const failureCount = tickets.filter((t) => t.status === "error").length + invalidFormatTokens.length;

    return {
      total: uniqueTokens.length,
      successCount,
      failureCount,
      tickets,
      deactivatedTokens: tokensToDeactivate,
    };
  }

  /**
   * Helper to dispatch notification to all active devices of a user.
   */
  static async sendToUser(
    userId: number,
    options: Omit<SendPushNotificationOptions, "to">
  ): Promise<SendPushResult> {
    const tokens = await this.getActiveUserTokens(userId);
    if (tokens.length === 0) {
      return {
        total: 0,
        successCount: 0,
        failureCount: 0,
        tickets: [],
        deactivatedTokens: [],
      };
    }

    return this.sendPushNotifications({
      ...options,
      to: tokens.map((t) => t.token),
    });
  }
}
