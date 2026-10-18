import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ROUTES } from '@/constants/routes';
import { useRole } from '@/hooks/use-role';
import { useConversationsQuery } from '@/services/messaging';

function formatConversationTime(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  if (date.getTime() >= startOfToday) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  if (date.getTime() >= startOfToday - dayMs) return 'Yesterday';
  if (date.getTime() >= startOfToday - 6 * dayMs) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function MessagesScreen() {
  const router = useRouter();
  const { isMentor } = useRole();
  const [search, setSearch] = useState('');

  const { data: conversations = [], isLoading, isRefetching, refetch } = useConversationsQuery();

  const filtered = useMemo(
    () =>
      conversations.filter((c) =>
        c.participant.name.toLowerCase().includes(search.trim().toLowerCase())
      ),
    [conversations, search]
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}>
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
          <Text style={styles.subtitle}>
            {isMentor
              ? 'Direct conversations with your students.'
              : 'Direct conversations with your mentors.'}
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <SymbolView
            name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
            size={18}
            tintColor="#9CA3AF"
          />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search conversations..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
        </View>

        {/* Conversation List */}
        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#3B5DF6" />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.centerBox}>
            <Text style={styles.emptyTitle}>
              {conversations.length === 0 ? 'No conversations yet' : 'No matches'}
            </Text>
            {conversations.length === 0 ? (
              <Text style={styles.emptySubtitle}>
                {isMentor
                  ? 'Once you confirm a session with a student, you can chat with them here.'
                  : 'Once a mentor confirms your session, you can chat with them here.'}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map((conv) => (
              <Pressable
                key={conv.id}
                onPress={() => router.push(ROUTES.chat(conv.id))}
                style={({ pressed }) => [styles.convoItem, pressed && styles.pressed]}>
                {conv.participant.avatarUrl ? (
                  <Image source={{ uri: conv.participant.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarInitial}>
                      {conv.participant.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={styles.convoMeta}>
                  <View style={styles.nameRow}>
                    <Text style={styles.mentorName} numberOfLines={1}>
                      {conv.participant.name}
                    </Text>
                    <Text style={styles.time}>{formatConversationTime(conv.lastMessageAt)}</Text>
                  </View>
                  <Text
                    style={[styles.lastMessage, conv.unreadCount > 0 && styles.lastMessageUnread]}
                    numberOfLines={1}>
                    {conv.lastMessage
                      ? `${conv.lastMessage.isMine ? 'You: ' : ''}${conv.lastMessage.body}`
                      : 'Say hello 👋'}
                  </Text>
                </View>

                {conv.unreadCount > 0 ? (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 20,
  },
  header: {
    marginTop: 8,
    gap: 6,
  },
  title: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F8',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    padding: 0,
  },
  list: {
    gap: 8,
  },
  convoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#3B5DF6',
    fontSize: 18,
    fontWeight: '700',
  },
  centerBox: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 48,
    paddingHorizontal: 16,
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
  convoMeta: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  mentorName: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },
  time: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  lastMessage: {
    color: '#6B7280',
    fontSize: 13,
  },
  lastMessageUnread: {
    color: '#111827',
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: '#3B5DF6',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
    backgroundColor: '#F9FAFB',
  },
});
