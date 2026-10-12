import { api } from '@/services/api';
import type {
  ConversationSummaryDto,
  GetMessagesOptions,
  MessageDto,
  SendMessageInput,
} from './types';

interface ApiEnvelope<T> {
  status: number;
  data: T;
  message?: string;
  errors?: unknown;
}

function unwrap<T>(envelope: ApiEnvelope<T>): T {
  return envelope?.data;
}

export const getConversations = async (): Promise<ConversationSummaryDto[]> => {
  const response = await api.get<ApiEnvelope<ConversationSummaryDto[]>>('/api/conversations');
  return unwrap(response.data) || [];
};

export const getConversation = async (id: number): Promise<ConversationSummaryDto> => {
  const response = await api.get<ApiEnvelope<ConversationSummaryDto>>(`/api/conversations/${id}`);
  return unwrap(response.data);
};

export const getMessages = async (
  conversationId: number,
  options?: GetMessagesOptions
): Promise<MessageDto[]> => {
  const params: Record<string, string | number> = {};
  if (options?.limit) params.limit = options.limit;
  if (options?.cursor) params.cursor = options.cursor;

  const response = await api.get<ApiEnvelope<MessageDto[]>>(
    `/api/conversations/${conversationId}/messages`,
    { params }
  );
  return unwrap(response.data) || [];
};

export const sendMessage = async (
  conversationId: number,
  input: SendMessageInput
): Promise<MessageDto> => {
  const response = await api.post<ApiEnvelope<MessageDto>>(
    `/api/conversations/${conversationId}/messages`,
    input
  );
  return unwrap(response.data);
};

export const getBookingConversation = async (
  bookingId: number
): Promise<{ conversationId: number }> => {
  const response = await api.get<ApiEnvelope<{ conversationId: number }>>(
    `/api/bookings/${bookingId}/conversation`
  );
  return unwrap(response.data);
};
