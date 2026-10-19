import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTheme } from '@/hooks/use-theme';
import { ROUTES } from '@/constants/routes';
import {
  useAcceptConnectionMutation,
  useConnectionRequestsQuery,
  useConnectionsQuery,
  useDeclineConnectionMutation,
  useRemoveConnectionMutation,
  type Connection,
} from '@/services/connections';

export default function ConnectionsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{ tab?: 'connections' | 'invitations' }>();

  const [activeTabOverride, setActiveTabOverride] = useState<'connections' | 'invitations' | null>(null);
  const activeTab: 'connections' | 'invitations' =
    activeTabOverride ?? (params.tab === 'invitations' ? 'invitations' : 'connections');
  const setActiveTab = (tab: 'connections' | 'invitations') => setActiveTabOverride(tab);
  const [searchQuery, setSearchQuery] = useState('');

  // Queries
  const {
    data: connectionsData,
    isLoading: isConnectionsLoading,
    refetch: refetchConnections,
    isRefetching: isConnectionsRefetching,
  } = useConnectionsQuery({ search: searchQuery.trim() || undefined });

  const {
    data: requestsData,
    isLoading: isRequestsLoading,
    refetch: refetchRequests,
    isRefetching: isRequestsRefetching,
  } = useConnectionRequestsQuery();

  // Mutations
  const acceptMutation = useAcceptConnectionMutation();
  const declineMutation = useDeclineConnectionMutation();
  const removeMutation = useRemoveConnectionMutation();

  const isRefreshing = isConnectionsRefetching || isRequestsRefetching;
  const onRefresh = async () => {
    await Promise.all([refetchConnections(), refetchRequests()]);
  };

  const incomingRequests = requestsData?.incoming ?? [];
  const outgoingRequests = requestsData?.outgoing ?? [];
  const connectionsList = connectionsData?.items ?? [];
  const totalConnections = connectionsData?.total ?? 0;

  const handleRemoveConnection = (conn: Connection) => {
    Alert.alert(
      'Remove Connection',
      `Are you sure you want to remove your connection with ${conn.connectedUser.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () =>
            removeMutation.mutate({
              connectionId: conn.id,
              targetUserId: conn.connectedUser.id,
            }),
        },
      ]
    );
  };

  const handleWithdrawRequest = (conn: Connection) => {
    Alert.alert(
      'Withdraw Request',
      `Cancel your pending connection invitation to ${conn.connectedUser.name}?`,
      [
        { text: 'Keep Waiting', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: () =>
            removeMutation.mutate({
              connectionId: conn.id,
              targetUserId: conn.connectedUser.id,
            }),
        },
      ]
    );
  };

  const handleAcceptRequest = (conn: Connection) => {
    acceptMutation.mutate({
      connectionId: conn.id,
      targetUserId: conn.connectedUser.id,
    });
  };

  const handleDeclineRequest = (conn: Connection) => {
    declineMutation.mutate({
      connectionId: conn.id,
      targetUserId: conn.connectedUser.id,
    });
  };

  const handleNavigateToUser = (conn: Connection) => {
    if (conn.connectedUser.role === 'MENTOR') {
      router.push(ROUTES.mentorDetail(conn.connectedUser.id));
    }
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Top Navigation Bar */}
      <View style={[styles.navBar, { borderBottomColor: theme.border }]}>
        <Pressable
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => router.back()}
          style={styles.backBtn}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'chevron_left' }}
            size={20}
            tintColor="#111827"
          />
        </Pressable>

        <Text style={styles.navTitle}>My Connections</Text>

        <View style={{ width: 36 }} />
      </View>

      {/* Tabs Switcher */}
      <View style={styles.tabsContainer}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setActiveTab('connections')}
          style={[styles.tabBtn, activeTab === 'connections' && styles.tabBtnActive]}>
          <Text style={[styles.tabBtnText, activeTab === 'connections' && styles.tabBtnTextActive]}>
            Connections ({totalConnections})
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => setActiveTab('invitations')}
          style={[styles.tabBtn, activeTab === 'invitations' && styles.tabBtnActive]}>
          <Text style={[styles.tabBtnText, activeTab === 'invitations' && styles.tabBtnTextActive]}>
            Invitations ({incomingRequests.length})
          </Text>
          {incomingRequests.length > 0 && (
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>{incomingRequests.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}>
        {activeTab === 'connections' ? (
          <>
            {/* Search Input */}
            <View style={styles.searchBar}>
              <SymbolView
                name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
                size={18}
                tintColor="#9CA3AF"
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search connections by name…"
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <SymbolView
                    name={{ ios: 'xmark.circle.fill', android: 'close', web: 'close' }}
                    size={16}
                    tintColor="#9CA3AF"
                  />
                </Pressable>
              )}
            </View>

            {isConnectionsLoading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#3B5DF6" />
                <Text style={styles.helperText}>Loading connections…</Text>
              </View>
            ) : connectionsList.length > 0 ? (
              <View style={styles.listContainer}>
                {connectionsList.map((conn) => {
                  const u = conn.connectedUser;
                  const initials = u.name
                    .split(' ')
                    .filter((part) => !part.includes('.'))
                    .slice(0, 2)
                    .map((p) => p.charAt(0))
                    .join('')
                    .toUpperCase();

                  return (
                    <Pressable
                      key={conn.id}
                      onPress={() => handleNavigateToUser(conn)}
                      style={({ pressed }) => [styles.userCard, pressed && styles.cardPressed]}>
                      <View style={styles.cardHeader}>
                        {u.avatarUrl ? (
                          <Image source={{ uri: u.avatarUrl }} style={styles.avatar} />
                        ) : (
                          <View style={[styles.avatar, styles.avatarFallback]}>
                            <Text style={styles.avatarInitial}>{initials || 'U'}</Text>
                          </View>
                        )}

                        <View style={styles.userMeta}>
                          <View style={styles.nameRow}>
                            <Text style={styles.userName} numberOfLines={1}>
                              {u.name}
                            </Text>
                            <View
                              style={[
                                styles.roleBadge,
                                u.role === 'MENTOR' ? styles.roleBadgeMentor : styles.roleBadgeStudent,
                              ]}>
                              <Text
                                style={[
                                  styles.roleBadgeText,
                                  u.role === 'MENTOR'
                                    ? styles.roleBadgeTextMentor
                                    : styles.roleBadgeTextStudent,
                                ]}>
                                {u.role === 'MENTOR' ? 'Mentor' : 'Mentee'}
                              </Text>
                            </View>
                          </View>

                          {u.headline ? (
                            <Text style={styles.headlineText} numberOfLines={1}>
                              {u.headline}
                            </Text>
                          ) : null}

                          <Text style={styles.timeText}>
                            Connected {new Date(conn.updatedAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>

                      {/* Card Action Row */}
                      <View style={styles.cardActionRow}>
                        {u.role === 'MENTOR' && (
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => handleNavigateToUser(conn)}
                            style={styles.viewProfileBtn}>
                            <Text style={styles.viewProfileBtnText}>View Profile</Text>
                          </Pressable>
                        )}

                        <Pressable
                          accessibilityRole="button"
                          onPress={() => handleRemoveConnection(conn)}
                          style={styles.removeBtn}>
                          <SymbolView
                            name={{ ios: 'person.badge.minus', android: 'person_remove', web: 'person_remove' }}
                            size={14}
                            tintColor="#DC2626"
                          />
                          <Text style={styles.removeBtnText}>Remove</Text>
                        </Pressable>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <SymbolView
                  name={{ ios: 'person.2.slash', android: 'people', web: 'people' }}
                  size={42}
                  tintColor="#9CA3AF"
                />
                <Text style={styles.emptyTitle}>No connections yet</Text>
                <Text style={styles.emptySubtitle}>
                  Discover mentors and peers to build your professional network.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push(ROUTES.TABS)}
                  style={styles.exploreCtaBtn}>
                  <Text style={styles.exploreCtaBtnText}>Explore Network</Text>
                </Pressable>
              </View>
            )}
          </>
        ) : (
          /* Invitations Tab */
          <View style={styles.invitationsSection}>
            {/* Incoming Requests */}
            <View style={styles.subSection}>
              <Text style={styles.subSectionTitle}>
                Received Invitations ({incomingRequests.length})
              </Text>

              {isRequestsLoading ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="small" color="#3B5DF6" />
                </View>
              ) : incomingRequests.length > 0 ? (
                incomingRequests.map((conn) => {
                  const u = conn.connectedUser;
                  return (
                    <View key={conn.id} style={styles.inviteCard}>
                      <View style={styles.cardHeader}>
                        {u.avatarUrl ? (
                          <Image source={{ uri: u.avatarUrl }} style={styles.avatar} />
                        ) : (
                          <View style={[styles.avatar, styles.avatarFallback]}>
                            <Text style={styles.avatarInitial}>{u.name.charAt(0)}</Text>
                          </View>
                        )}

                        <View style={styles.userMeta}>
                          <Text style={styles.userName}>{u.name}</Text>
                          {u.headline ? (
                            <Text style={styles.headlineText} numberOfLines={1}>
                              {u.headline}
                            </Text>
                          ) : null}
                          <Text style={styles.timeText}>
                            Sent {new Date(conn.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>

                      {conn.note ? (
                        <View style={styles.noteBox}>
                          <Text style={styles.noteText}>{`"${conn.note}"`}</Text>
                        </View>
                      ) : null}

                      <View style={styles.inviteActions}>
                        <Pressable
                          accessibilityRole="button"
                          disabled={acceptMutation.isPending}
                          onPress={() => handleAcceptRequest(conn)}
                          style={[styles.acceptBtn, acceptMutation.isPending && styles.disabled]}>
                          <Text style={styles.acceptBtnText}>Accept</Text>
                        </Pressable>

                        <Pressable
                          accessibilityRole="button"
                          disabled={declineMutation.isPending}
                          onPress={() => handleDeclineRequest(conn)}
                          style={[styles.declineBtn, declineMutation.isPending && styles.disabled]}>
                          <Text style={styles.declineBtnText}>Decline</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyCardText}>No pending received invitations.</Text>
                </View>
              )}
            </View>

            {/* Outgoing Requests */}
            <View style={styles.subSection}>
              <Text style={styles.subSectionTitle}>
                Sent Invitations ({outgoingRequests.length})
              </Text>

              {outgoingRequests.length > 0 ? (
                outgoingRequests.map((conn) => {
                  const u = conn.connectedUser;
                  return (
                    <View key={conn.id} style={styles.inviteCard}>
                      <View style={styles.cardHeader}>
                        {u.avatarUrl ? (
                          <Image source={{ uri: u.avatarUrl }} style={styles.avatar} />
                        ) : (
                          <View style={[styles.avatar, styles.avatarFallback]}>
                            <Text style={styles.avatarInitial}>{u.name.charAt(0)}</Text>
                          </View>
                        )}

                        <View style={styles.userMeta}>
                          <Text style={styles.userName}>{u.name}</Text>
                          {u.headline ? (
                            <Text style={styles.headlineText} numberOfLines={1}>
                              {u.headline}
                            </Text>
                          ) : null}
                          <Text style={styles.timeText}>
                            Sent {new Date(conn.createdAt).toLocaleDateString()}
                          </Text>
                        </View>

                        <Pressable
                          accessibilityRole="button"
                          onPress={() => handleWithdrawRequest(conn)}
                          style={styles.withdrawBtn}>
                          <Text style={styles.withdrawBtnText}>Withdraw</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyCardText}>No outgoing invitations awaiting reply.</Text>
                </View>
              )}
            </View>
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
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: 6,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F8',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabBtnTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  badgeCount: {
    backgroundColor: '#3B5DF6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    padding: 0,
  },
  listContainer: {
    gap: 12,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F1F5',
    padding: 14,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardPressed: {
    opacity: 0.95,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3B5DF6',
  },
  userMeta: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeMentor: {
    backgroundColor: '#F3EEFF',
  },
  roleBadgeStudent: {
    backgroundColor: '#EEF2FF',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  roleBadgeTextMentor: {
    color: '#7C3AED',
  },
  roleBadgeTextStudent: {
    color: '#3B5DF6',
  },
  headlineText: {
    fontSize: 13,
    color: '#4B5563',
  },
  timeText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6',
  },
  viewProfileBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F8',
  },
  viewProfileBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  removeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  invitationsSection: {
    gap: 20,
  },
  subSection: {
    gap: 10,
  },
  subSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  inviteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F1F5',
    padding: 14,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  noteBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#3B5DF6',
  },
  noteText: {
    fontSize: 13,
    color: '#4B5563',
    fontStyle: 'italic',
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 10,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: '#3B5DF6',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  declineBtn: {
    flex: 1,
    backgroundColor: '#F3F4F8',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtnText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '600',
  },
  withdrawBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F8',
  },
  withdrawBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptyCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  emptyCardText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  centerContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  helperText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  exploreCtaBtn: {
    marginTop: 8,
    backgroundColor: '#3B5DF6',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  exploreCtaBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
});
