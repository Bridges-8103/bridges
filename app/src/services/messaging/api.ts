import { api } from '@/services/api';
import type { ConversationDto, MessageDto } from './types';

interface ApiEnvelope<T> {
  status: number;
  data: T;
  message?: string;
  errors?: unknown;
}

/**
 * Fetch the current user's conversations
 */
export const getConversations = async (): Promise<ConversationDto[]> => {
  const response = await api.get<ApiEnvelope<ConversationDto[]>>('/api/conversations');
  return response.data?.data || [];
};

/**
 * Fetch a single conversation (chat header)
 */
export const getConversation = async (conversationId: number): Promise<ConversationDto> => {
  const response = await api.get<ApiEnvelope<ConversationDto>>(
    `/api/conversations/${conversationId}`
  );
  return response.data.data;
};

/**
 * Get or create the conversation with another user
 */
export const startConversation = async (participantId: number): Promise<ConversationDto> => {
  const response = await api.post<ApiEnvelope<ConversationDto>>('/api/conversations', {
    participantId,
  });
  return response.data.data;
};

/**
 * Fetch messages; pass `after` to only fetch messages newer than a given message id
 */
export const getMessages = async (
  conversationId: number,
  after?: number
): Promise<MessageDto[]> => {
  const response = await api.get<ApiEnvelope<MessageDto[]>>(
    `/api/conversations/${conversationId}/messages`,
    { params: after !== undefined ? { after } : undefined }
  );
  return response.data?.data || [];
};

/**
 * Send a message
 */
export const sendMessage = async (conversationId: number, body: string): Promise<MessageDto> => {
  const response = await api.post<ApiEnvelope<MessageDto>>(
    `/api/conversations/${conversationId}/messages`,
    { body }
  );
  return response.data.data;
};
