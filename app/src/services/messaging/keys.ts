export const messagingKeys = {
  all: ['messaging'] as const,
  conversations: () => [...messagingKeys.all, 'conversations'] as const,
  conversation: (conversationId: number) =>
    [...messagingKeys.all, 'conversation', conversationId] as const,
  messages: (conversationId: number) =>
    [...messagingKeys.all, 'messages', conversationId] as const,
};
