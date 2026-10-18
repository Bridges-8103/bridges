import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendMessage, startConversation } from './api';
import { messagingKeys } from './keys';
import type { ConversationDto, MessageDto } from './types';

/**
 * Mutation to send a message. The sent message is appended to the cached thread on success.
 */
export const useSendMessageMutation = (conversationId: number) => {
  const queryClient = useQueryClient();

  return useMutation<MessageDto, Error, string>({
    mutationFn: (body) => sendMessage(conversationId, body),
    onSuccess: (message) => {
      queryClient.setQueryData<MessageDto[]>(
        messagingKeys.messages(conversationId),
        (prev = []) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message])
      );
      queryClient.invalidateQueries({ queryKey: messagingKeys.conversations() });
    },
  });
};

/**
 * Mutation to get or create the conversation with another user
 */
export const useStartConversationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<ConversationDto, Error, number>({
    mutationFn: (participantId) => startConversation(participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.conversations() });
    },
  });
};
