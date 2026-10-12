import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { SymbolView } from 'expo-symbols';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  useConversationDetailQuery,
  useMessagesQuery,
  useSendMessageMutation,
  type MessageDto,
} from '@/services/messages';

function formatBubbleTime(isoString?: string | null): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageThreadScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = parseInt(id || '', 10);

  const [inputContent, setInputContent] = useState('');

  // Fetch conversation detail / participant info
  const { data: conversation } = useConversationDetailQuery(conversationId);

  // Fetch messages with smart polling (every 3.5s while chat screen is open)
  const { data: messages = [], isLoading: isMessagesLoading } = useMessagesQuery(
    conversationId,
    undefined,
    {
      refetchInterval: 3500,
    }
  );

  const sendMutation = useSendMessageMutation(conversationId);

  const other = conversation?.otherParticipant;
  const isMentor = other?.role === 'MENTOR';

  // Inverted FlatList requires reversing chronological order
  const invertedMessages = useMemo(() => {
    return [...messages].reverse();
  }, [messages]);

  const handleSend = useCallback(() => {
    const trimmed = inputContent.trim();
    if (!trimmed || sendMutation.isPending) return;

    setInputContent('');
    sendMutation.mutate({
      content: trimmed,
      messageType: 'TEXT',
    });
  }, [inputContent, sendMutation]);

  const renderMessageItem = useCallback(({ item }: { item: MessageDto }) => {
    if (item.messageType === 'SYSTEM') {
      return (
        <View style={styles.systemMessageWrap}>
          <View style={styles.systemMessagePill}>
            <SymbolView
              name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
              size={14}
              tintColor="#16A34A"
            />
            <Text style={styles.systemMessageText}>{item.content}</Text>
          </View>
          <Text style={styles.systemMessageTime}>{formatBubbleTime(item.createdAt)}</Text>
        </View>
      );
    }

    const isMine = item.isMine;

    return (
      <View
        style={[
          styles.messageRow,
          isMine ? styles.messageRowMine : styles.messageRowOther,
        ]}>
        <View
          style={[
            styles.bubble,
            isMine ? styles.bubbleMine : styles.bubbleOther,
          ]}>
          <Text
            style={[
              styles.bubbleText,
              isMine ? styles.bubbleTextMine : styles.bubbleTextOther,
            ]}>
            {item.content}
          </Text>
          <Text
            style={[
              styles.bubbleTime,
              isMine ? styles.bubbleTimeMine : styles.bubbleTimeOther,
            ]}>
            {formatBubbleTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  }, []);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              size={22}
              tintColor="#111827"
            />
          </Pressable>

          {/* Participant Info */}
          <View style={styles.headerUser}>
            {other?.avatarUrl ? (
              <Image source={{ uri: other.avatarUrl }} style={styles.headerAvatar} />
            ) : (
              <View style={styles.headerAvatarFallback}>
                <Text style={styles.headerAvatarInitial}>
                  {other?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={styles.headerTextCol}>
              <View style={styles.headerNameRow}>
                <Text style={styles.headerName} numberOfLines={1}>
                  {other?.name || 'Chat'}
                </Text>
                {other?.role ? (
                  <View
                    style={[
                      styles.roleBadge,
                      isMentor ? styles.roleBadgeMentor : styles.roleBadgeStudent,
                    ]}>
                    <Text
                      style={[
                        styles.roleBadgeText,
                        isMentor ? styles.roleBadgeTextMentor : styles.roleBadgeTextStudent,
                      ]}>
                      {isMentor ? 'Mentor' : 'Student'}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.headerSubtext}>Session connected</Text>
            </View>
          </View>
        </View>

        {/* Message Thread */}
        {isMessagesLoading && messages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B5DF6" />
          </View>
        ) : (
          <FlatList
            inverted
            data={invertedMessages}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Bottom Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            value={inputContent}
            onChangeText={setInputContent}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={2000}
            style={styles.textInput}
          />
          <Pressable
            accessibilityRole="button"
            disabled={!inputContent.trim() || sendMutation.isPending}
            onPress={handleSend}
            style={({ pressed }) => [
              styles.sendBtn,
              !inputContent.trim() && styles.sendBtnDisabled,
              pressed && styles.pressed,
            ]}>
            {sendMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <SymbolView
                name={{
                  ios: 'arrow.up.circle.fill',
                  android: 'send',
                  web: 'send',
                }}
                size={30}
                tintColor={inputContent.trim() ? '#3B5DF6' : '#D1D5DB'}
              />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  backBtn: {
    padding: 6,
    marginLeft: -4,
  },
  headerUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4B5563',
  },
  headerTextCol: {
    flex: 1,
    gap: 2,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    maxWidth: '75%',
  },
  headerSubtext: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '500',
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeMentor: {
    backgroundColor: '#EEF2FF',
  },
  roleBadgeStudent: {
    backgroundColor: '#F0FDF4',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  roleBadgeTextMentor: {
    color: '#3B5DF6',
  },
  roleBadgeTextStudent: {
    color: '#16A34A',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  systemMessageWrap: {
    alignItems: 'center',
    marginVertical: 8,
    gap: 4,
  },
  systemMessagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  systemMessageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  systemMessageTime: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 3,
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    gap: 4,
  },
  bubbleMine: {
    backgroundColor: '#3B5DF6',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#F3F4F8',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  bubbleTextMine: {
    color: '#FFFFFF',
  },
  bubbleTextOther: {
    color: '#111827',
  },
  bubbleTime: {
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  bubbleTimeMine: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  bubbleTimeOther: {
    color: '#9CA3AF',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F3F4F8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 15,
    color: '#111827',
    maxHeight: 100,
  },
  sendBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.8,
  },
});
