import type { ExpoPushTicket } from "expo-server-sdk";

export interface SendPushNotificationOptions {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;
  priority?: "default" | "normal" | "high";
}

export interface SendPushResult {
  total: number;
  successCount: number;
  failureCount: number;
  tickets: ExpoPushTicket[];
  deactivatedTokens?: string[];
}

export interface RegisterPushTokenInput {
  token: string;
  platform?: "ios" | "android" | "web";
  deviceId?: string;
  deviceName?: string;
}

export interface StoredPushToken {
  id: number;
  userId: number | null;
  token: string;
  platform: string | null;
  deviceId: string | null;
  deviceName: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt: Date | null;
}
