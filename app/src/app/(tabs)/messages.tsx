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
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { ROUTES } from '@/constants/routes';
import { useConversationsQuery } from '@/services/messages';

function formatMessageTime(isoString?: string | null): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Yesterday';

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function MessagesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const {
    data: conversations = [],
    isLoading,
    isRefetching,
    refetch,
  } = useConversationsQuery();

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const term = search.toLowerCase();
    return conversations.filter((c) =>
      c.otherParticipant.name.toLowerCase().includes(term)
    );
  }, [conversations, search]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
        }>
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
          <Text style={styles.subtitle}>Direct conversations with your mentors and mentees.</Text>
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

        {/* Loading state */}
        {isLoading && conversations.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B5DF6" />
            <Text style={styles.loadingText}>Loading conversations...</Text>
          </View>
        ) : filtered.length === 0 ? (
          /* Empty state */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <SymbolView
                name={{
                  ios: 'bubble.left.and.bubble.right',
                  android: 'chat',
                  web: 'chat',
                }}
                size={40}
                tintColor="#6B7280"
              />
            </View>
            <Text style={styles.emptyTitle}>
              {search.trim() ? 'No matching conversations' : 'No conversations yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {search.trim()
                ? `No conversation found matching "${search}".`
                : 'Book a mentorship session to connect and start messaging directly!'}
            </Text>
            {!search.trim() && (
              <Pressable
                onPress={() => router.push('/explore')}
                style={({ pressed }) => [styles.exploreBtn, pressed && styles.pressed]}>
                <Text style={styles.exploreBtnText}>Explore Mentors</Text>
              </Pressable>
            )}
          </View>
        ) : (
          /* Conversation List */
          <View style={styles.list}>
            {filtered.map((conv) => {
              const other = conv.otherParticipant;
              const formattedTime = formatMessageTime(conv.lastMessageAt);
              const isMentor = other.role === 'MENTOR';
              const hasLastMessage = Boolean(conv.lastMessageText);

              return (
                <Pressable
                  key={conv.id}
                  onPress={() => router.push(ROUTES.messageThread(conv.id))}
                  style={({ pressed }) => [styles.convoItem, pressed && styles.pressed]}>
                  {/* Avatar */}
                  <View style={styles.avatarWrapper}>
                    {other.avatarUrl ? (
                      <Image source={{ uri: other.avatarUrl }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarInitial}>
                          {other.name?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Metadata */}
                  <View style={styles.convoMeta}>
                    <View style={styles.nameRow}>
                      <View style={styles.nameBadgeRow}>
                        <Text style={styles.participantName} numberOfLines={1}>
                          {other.name}
                        </Text>
                        <View
                          style={[
                            styles.roleBadge,
                            isMentor ? styles.roleBadgeMentor : styles.roleBadgeStudent,
                          ]}>
                          <Text
                            style={[
                              styles.roleBadgeText,
                              isMentor
                                ? styles.roleBadgeTextMentor
                                : styles.roleBadgeTextStudent,
                            ]}>
                            {isMentor ? 'Mentor' : 'Student'}
                          </Text>
                        </View>
                      </View>
                      {formattedTime ? <Text style={styles.time}>{formattedTime}</Text> : null}
                    </View>

                    {/* Last message preview or placeholder */}
                    <Text
                      style={[
                        styles.lastMessage,
                        !hasLastMessage && styles.placeholderMessage,
                      ]}
                      numberOfLines={1}>
                      {hasLastMessage
                        ? conv.lastMessageText
                        : 'Session confirmed! Say hello 👋'}
                    </Text>
                  </View>

                  {/* Unread badge */}
                  {Boolean(conv.unreadCount > 0) && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>
                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
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
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    gap: 12,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3F4F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  exploreBtn: {
    marginTop: 8,
    backgroundColor: '#3B5DF6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
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
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4B5563',
  },
  convoMeta: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  participantName: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
    maxWidth: '70%',
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
  time: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  lastMessage: {
    color: '#6B7280',
    fontSize: 13,
  },
  placeholderMessage: {
    color: '#3B5DF6',
    fontStyle: 'italic',
  },
  unreadBadge: {
    backgroundColor: '#3B5DF6',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
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
