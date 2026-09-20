import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { mockMentors } from '@/data/mock-mentors';

type Conversation = {
  id: string;
  mentor: (typeof mockMentors)[0];
  lastMessage: string;
  time: string;
  unreadCount?: number;
};

export default function MessagesScreen() {
  const [search, setSearch] = useState('');

  const conversations: Conversation[] = [
    {
      id: 'c1',
      mentor: mockMentors[0], // Dr. Priya Nair
      lastMessage: "I've reviewed your thesis draft! Let's discuss it at 3 PM today.",
      time: '10:45 AM',
      unreadCount: 1,
    },
    {
      id: 'c2',
      mentor: mockMentors[1], // Marcus Okonkwo
      lastMessage: 'Check out this paper on distributed Raft consensus.',
      time: 'Yesterday',
    },
    {
      id: 'c3',
      mentor: mockMentors[3], // Sarah Chen
      lastMessage: 'Great chat yesterday! Send over your updated resume whenever you are ready.',
      time: '3d ago',
    },
  ];

  const filtered = conversations.filter((c) =>
    c.mentor.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
          <Text style={styles.subtitle}>Direct conversations with your mentors.</Text>
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
        <View style={styles.list}>
          {filtered.map((conv) => (
            <Pressable
              key={conv.id}
              onPress={() =>
                Alert.alert(conv.mentor.name, `Conversation with ${conv.mentor.name}\n\n"${conv.lastMessage}"`)
              }
              style={({ pressed }) => [styles.convoItem, pressed && styles.pressed]}>
              <View style={styles.avatarWrapper}>
                <Image source={{ uri: conv.mentor.avatarUri }} style={styles.avatar} />
                {conv.mentor.isOnline && <View style={styles.onlineBadge} />}
              </View>

              <View style={styles.convoMeta}>
                <View style={styles.nameRow}>
                  <Text style={styles.mentorName}>{conv.mentor.name}</Text>
                  <Text style={styles.time}>{conv.time}</Text>
                </View>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {conv.lastMessage}
                </Text>
              </View>

              {Boolean(conv.unreadCount) && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{conv.unreadCount}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
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
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  convoMeta: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
