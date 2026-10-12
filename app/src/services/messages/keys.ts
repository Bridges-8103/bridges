export const messageKeys = {
  all: ['messages'] as const,
  conversations: () => [...messageKeys.all, 'conversations'] as const,
  conversationDetail: (id: number) => [...messageKeys.all, 'detail', id] as const,
  messages: (conversationId: number) => [...messageKeys.all, 'thread', conversationId] as const,
  bookingConversation: (bookingId: number) =>
    [...messageKeys.all, 'booking-conversation', bookingId] as const,
};
