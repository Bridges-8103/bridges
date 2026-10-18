import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useConversationQuery, useMessagesQuery, useSendMessageMutation } from '@/services/messaging';
import type { MessageDto } from '@/services/messaging';

const MAX_MESSAGE_LENGTH = 2000;

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = Number(id);

  const { data: conversation } = useConversationQuery(conversationId);
  const { data: messages = [], isLoading, error } = useMessagesQuery(conversationId);
  const sendMutation = useSendMessageMutation(conversationId);

  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<MessageDto>>(null);

  const participant = conversation?.participant;

  const handleSend = useCallback(async () => {
    const body = draft.trim();
    if (!body || sendMutation.isPending) return;

    setDraft('');
    try {
      await sendMutation.mutateAsync(body);
    } catch (err: any) {
      setDraft(body);
      Alert.alert(
        'Message not sent',
        err?.response?.data?.message || err?.message || 'Please try again.'
      );
    }
  }, [draft, sendMutation]);

  const renderMessage = useCallback(
    ({ item, index }: { item: MessageDto; index: number }) => {
      const previous = messages[index - 1];
      const showDay =
        !previous || new Date(previous.createdAt).toDateString() !== new Date(item.createdAt).toDateString();

      return (
        <View>
          {showDay ? <Text style={styles.dayLabel}>{formatDayLabel(item.createdAt)}</Text> : null}
          <View style={[styles.bubbleRow, item.isMine ? styles.rowMine : styles.rowTheirs]}>
            <View style={[styles.bubble, item.isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
              <Text style={[styles.bubbleText, item.isMine && styles.bubbleTextMine]}>{item.body}</Text>
              <Text style={[styles.bubbleTime, item.isMine && styles.bubbleTimeMine]}>
                {formatMessageTime(item.createdAt)}
              </Text>
            </View>
          </View>
        </View>
      );
    },
    [messages]
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backButton}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            size={20}
            tintColor="#111827"
          />
        </Pressable>
        {participant?.avatarUrl ? (
          <Image source={{ uri: participant.avatarUrl }} style={styles.headerAvatar} />
        ) : (
          <View style={[styles.headerAvatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>{participant?.name?.charAt(0).toUpperCase() ?? '?'}</Text>
          </View>
        )}
        <View style={styles.headerText}>
          <Text style={styles.headerName} numberOfLines={1}>
            {participant?.name ?? 'Chat'}
          </Text>
          {participant?.subtitle ? (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {participant.subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#3B5DF6" />
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Text style={styles.emptyTitle}>Couldn&apos;t load this conversation</Text>
            <Text style={styles.emptySubtitle}>
              Chat is available once a session between you has been confirmed.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => String(m.id)}
            renderItem={renderMessage}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.centerBox}>
                <Text style={styles.emptyTitle}>Say hello 👋</Text>
                <Text style={styles.emptySubtitle}>
                  Start the conversation with {participant?.name ?? 'your match'}.
                </Text>
              </View>
            }
          />
        )}

        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Write a message…"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            multiline
            maxLength={MAX_MESSAGE_LENGTH}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            onPress={handleSend}
            disabled={!draft.trim() || sendMutation.isPending}
            style={({ pressed }) => [
              styles.sendButton,
              (!draft.trim() || sendMutation.isPending) && styles.sendButtonDisabled,
              pressed && styles.pressed,
            ]}>
            <SymbolView
              name={{ ios: 'arrow.up', android: 'send', web: 'send' }}
              size={18}
              tintColor="#FFFFFF"
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#3B5DF6',
    fontSize: 16,
    fontWeight: '700',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  headerName: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#6B7280',
    fontSize: 12,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  dayLabel: {
    alignSelf: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    marginVertical: 10,
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    gap: 3,
  },
  bubbleMine: {
    backgroundColor: '#3B5DF6',
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: '#F3F4F8',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    color: '#111827',
    fontSize: 15,
    lineHeight: 20,
  },
  bubbleTextMine: { color: '#FFFFFF' },
  bubbleTime: {
    color: '#9CA3AF',
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  bubbleTimeMine: { color: '#C7D2FE' },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 32,
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#6B7280',
    fontSize: 13,
    textAlign: 'center',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: '#F3F4F8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: '#111827',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B5DF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#C7D2FE',
  },
  pressed: {
    opacity: 0.8,
  },
});
