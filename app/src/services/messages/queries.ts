import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import {
  getBookingConversation,
  getConversation,
  getConversations,
  getMessages,
} from './api';
import { messageKeys } from './keys';
import type { ConversationSummaryDto, GetMessagesOptions, MessageDto } from './types';

export const useConversationsQuery = (
  options?: Omit<UseQueryOptions<ConversationSummaryDto[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ConversationSummaryDto[], Error>({
    queryKey: messageKeys.conversations(),
    queryFn: getConversations,
    staleTime: 1000 * 5, // 5 seconds
    ...options,
  });
};

export const useConversationDetailQuery = (
  conversationId: number,
  options?: Omit<UseQueryOptions<ConversationSummaryDto, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ConversationSummaryDto, Error>({
    queryKey: messageKeys.conversationDetail(conversationId),
    queryFn: () => getConversation(conversationId),
    enabled: Boolean(conversationId),
    staleTime: 1000 * 15,
    ...options,
  });
};

export const useMessagesQuery = (
  conversationId: number,
  queryOptions?: GetMessagesOptions,
  options?: Omit<UseQueryOptions<MessageDto[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<MessageDto[], Error>({
    queryKey: messageKeys.messages(conversationId),
    queryFn: () => getMessages(conversationId, queryOptions),
    enabled: Boolean(conversationId),
    ...options,
  });
};

export const useBookingConversationQuery = (
  bookingId: number,
  options?: Omit<UseQueryOptions<{ conversationId: number }, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<{ conversationId: number }, Error>({
    queryKey: messageKeys.bookingConversation(bookingId),
    queryFn: () => getBookingConversation(bookingId),
    enabled: Boolean(bookingId),
    ...options,
  });
};
