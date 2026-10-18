/**
 * Types for Messaging Service
 *
 * Mirror backend/src/modules/messaging/messaging.types.ts.
 */
export interface ChatParticipantDto {
  id: string;
  name: string;
  avatarUrl?: string | null;
  role: string;
  subtitle?: string | null;
}

export interface MessageDto {
  id: number;
  conversationId: number;
  senderId: string;
  body: string;
  isMine: boolean;
  createdAt: string;
}

export interface ConversationDto {
  id: number;
  participant: ChatParticipantDto;
  lastMessage: { body: string; createdAt: string; isMine: boolean } | null;
  lastMessageAt: string | null;
  unreadCount: number;
}
