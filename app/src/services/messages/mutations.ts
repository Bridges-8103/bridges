import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { sendMessage } from './api';
import { messageKeys } from './keys';
import type { MessageDto, SendMessageInput } from './types';

interface MutationContext {
  previousMessages?: MessageDto[];
}

export const useSendMessageMutation = (
  conversationId: number,
  options?: UseMutationOptions<MessageDto, Error, SendMessageInput, MutationContext>
) => {
  const queryClient = useQueryClient();

  return useMutation<MessageDto, Error, SendMessageInput, MutationContext>({
    mutationFn: (input: SendMessageInput) => sendMessage(conversationId, input),
    onMutate: async (newMsg: SendMessageInput) => {
      // Cancel outgoing queries so they do not overwrite optimistic state
      await queryClient.cancelQueries({ queryKey: messageKeys.messages(conversationId) });

      // Snapshot previous messages
      const previousMessages = queryClient.getQueryData<MessageDto[]>(
        messageKeys.messages(conversationId)
      );

      // Optimistic message placeholder
      const optimisticMessage: MessageDto = {
        id: Date.now(),
        conversationId,
        senderId: -1,
        content: newMsg.content,
        messageType: newMsg.messageType || 'TEXT',
        fileUrl: newMsg.fileUrl || null,
        fileName: newMsg.fileName || null,
        fileSize: newMsg.fileSize || null,
        createdAt: new Date().toISOString(),
        isMine: true,
      };

      if (previousMessages) {
        queryClient.setQueryData<MessageDto[]>(
          messageKeys.messages(conversationId),
          [...previousMessages, optimisticMessage]
        );
      } else {
        queryClient.setQueryData<MessageDto[]>(
          messageKeys.messages(conversationId),
          [optimisticMessage]
        );
      }

      return { previousMessages };
    },
    onError: (_err, _newMsg, context) => {
      // Rollback on network failure
      if (context?.previousMessages) {
        queryClient.setQueryData(
          messageKeys.messages(conversationId),
          context.previousMessages
        );
      }
    },
    onSettled: async () => {
      // Re-sync server state and update conversation lastMessage previews
      await queryClient.invalidateQueries({ queryKey: messageKeys.messages(conversationId) });
      await queryClient.invalidateQueries({ queryKey: messageKeys.conversations() });
    },
    ...options,
  });
};
