import { useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { getConversation, getConversations, getMessages } from './api';
import { messagingKeys } from './keys';
import type { ConversationDto, MessageDto } from './types';

const MESSAGES_POLL_INTERVAL_MS = 3000;
const CONVERSATIONS_POLL_INTERVAL_MS = 10000;

/**
 * Hook to fetch the user's conversation list (polled so new messages surface)
 */
export const useConversationsQuery = (
  options?: Omit<UseQueryOptions<ConversationDto[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ConversationDto[], Error>({
    queryKey: messagingKeys.conversations(),
    queryFn: getConversations,
    refetchInterval: CONVERSATIONS_POLL_INTERVAL_MS,
    ...options,
  });
};

/**
 * Hook to fetch a single conversation summary
 */
export const useConversationQuery = (conversationId: number) => {
  return useQuery<ConversationDto, Error>({
    queryKey: messagingKeys.conversation(conversationId),
    queryFn: () => getConversation(conversationId),
    enabled: Number.isFinite(conversationId),
  });
};

/**
 * Hook to fetch a conversation's messages and keep them live by polling.
 * The first run loads the latest page; every later run only requests messages newer than the
 * last cached id and merges them into the existing list.
 */
export const useMessagesQuery = (conversationId: number) => {
  const queryClient = useQueryClient();
  const queryKey = messagingKeys.messages(conversationId);

  return useQuery<MessageDto[], Error>({
    queryKey,
    queryFn: async () => {
      const cached = queryClient.getQueryData<MessageDto[]>(queryKey);
      if (!cached?.length) return getMessages(conversationId);

      const lastId = cached.reduce((max, m) => Math.max(max, m.id), 0);
      const fresh = await getMessages(conversationId, lastId);
      if (fresh.length === 0) return cached;

      const known = new Set(cached.map((m) => m.id));
      return [...cached, ...fresh.filter((m) => !known.has(m.id))];
    },
    enabled: Number.isFinite(conversationId),
    refetchInterval: MESSAGES_POLL_INTERVAL_MS,
    staleTime: 0,
  });
};
