import type { ConnectionStatus, MessageType } from "@prisma/client";

export interface ParticipantSummary {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
}

export interface ConversationSummaryDto {
  id: number;
  connectionId: number | null;
  connectionStatus: ConnectionStatus;
  otherParticipant: ParticipantSummary;
  lastMessageText: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
}

export interface MessageDto {
  id: number;
  conversationId: number;
  senderId: number | null;
  senderName?: string;
  senderAvatarUrl?: string | null;
  content: string;
  messageType: MessageType;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  createdAt: string;
  isMine: boolean;
}

export interface SendMessageInput {
  content: string;
  messageType?: MessageType;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

export interface GetMessagesOptions {
  limit?: number;
  cursor?: number;
}
