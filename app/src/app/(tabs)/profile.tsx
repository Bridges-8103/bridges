import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useAuth } from '@/hooks/use-auth';
import { useProfileQuery } from '@/services/profile/queries';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { data: profile, isPending, isError, error, refetch, isRefetching } = useProfileQuery();

  // Clerk identity is the trustworthy fallback while the profile loads or
  // before the user has created one. Never render invented placeholder data.
  const displayName = profile?.displayName || user?.name || 'Your profile';
  const email = user?.email ?? '';
  const avatarUri = profile?.avatarUrl || user?.avatarUri;
  const hasProfile = Boolean(profile);

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/welcome');
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>My Profile</Text>
        </View>

        {/* User Card */}
        {isPending ? (
          <View style={[styles.userCard, styles.stateCard]}>
            <ActivityIndicator color="#3B5DF6" />
            <Text style={styles.stateText}>Loading your profile…</Text>
          </View>
        ) : isError ? (
          <View style={[styles.userCard, styles.stateCard]}>
            <Text style={styles.stateTitle}>Couldn&apos;t load your profile</Text>
            <Text style={styles.stateText}>{error?.message ?? 'Please try again.'}</Text>
            <Pressable
              accessibilityRole="button"
              disabled={isRefetching}
              onPress={() => refetch()}
              style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
              <Text style={styles.retryText}>{isRefetching ? 'Retrying…' : 'Retry'}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.userCard}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>
                  {displayName.trim().charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{displayName}</Text>
              {email ? <Text style={styles.userEmail}>{email}</Text> : null}
              {profile?.bio ? (
                <Text numberOfLines={2} style={styles.userBio}>
                  {profile.bio}
                </Text>
              ) : null}
              {hasProfile && profile ? (
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.badge,
                      profile.role === 'MENTOR' ? styles.badgeMentor : styles.badgeStudent,
                    ]}>
                    <Text
                      style={[
                        styles.badgeText,
                        profile.role === 'MENTOR'
                          ? styles.badgeMentorText
                          : styles.badgeStudentText,
                      ]}>
                      {profile.role === 'MENTOR' ? '🌟 Mentor' : '🎓 Student'}
                    </Text>
                  </View>

                  {profile.role === 'STUDENT' && profile.studentDetail?.university ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {profile.studentDetail.university}
                        {profile.studentDetail.yearOfStudy
                          ? ` · Yr ${profile.studentDetail.yearOfStudy}`
                          : ''}
                      </Text>
                    </View>
                  ) : profile.role === 'MENTOR' && profile.mentorDetail?.jobTitle ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {profile.mentorDetail.jobTitle}
                        {profile.mentorDetail.company
                          ? ` @ ${profile.mentorDetail.company}`
                          : ''}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <View style={styles.badgeRow}>
                  <View style={[styles.badge, styles.badgeWarning]}>
                    <Text style={[styles.badgeText, styles.badgeWarningText]}>
                      Profile not set up yet
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {!isPending && !isError && !hasProfile ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/mentor-profile')}
            style={({ pressed }) => [styles.ctaButton, pressed && styles.pressed]}>
            <Text style={styles.ctaText}>Complete your profile</Text>
          </Pressable>
        ) : null}

        {/* Action Menu */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Account & Settings</Text>

          <Pressable
            onPress={() =>
              router.push({
                pathname: '/mentor-profile',
                params: { role: profile?.role || 'STUDENT' },
              })
            }
            style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: '#EEF2FF' }]}>
                <SymbolView
                  name={{ ios: 'person.text.rectangle', android: 'badge', web: 'badge' }}
                  size={18}
                  tintColor="#3B5DF6"
                />
              </View>
              <View>
                <Text style={styles.menuItemText}>Edit Full Profile</Text>
                <Text style={styles.menuItemSub}>Skills, bio, academic background</Text>
              </View>
            </View>
            <SymbolView
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              size={14}
              tintColor="#9CA3AF"
            />
          </Pressable>

          <Pressable
            onPress={() => router.push('/welcome')}
            style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: '#F3F4F8' }]}>
                <SymbolView
                  name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
                  size={18}
                  tintColor="#4B5563"
                />
              </View>
              <View>
                <Text style={styles.menuItemText}>View Welcome / Onboarding</Text>
                <Text style={styles.menuItemSub}>See the introductory tour</Text>
              </View>
            </View>
            <SymbolView
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              size={14}
              tintColor="#9CA3AF"
            />
          </Pressable>

          <Pressable
            onPress={() => Alert.alert('Notifications', 'Notification preferences updated.')}
            style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: '#F3F4F8' }]}>
                <SymbolView
                  name={{ ios: 'bell', android: 'notifications', web: 'notifications' }}
                  size={18}
                  tintColor="#4B5563"
                />
              </View>
              <View>
                <Text style={styles.menuItemText}>Notification Settings</Text>
                <Text style={styles.menuItemSub}>Email and in-app alerts</Text>
              </View>
            </View>
            <SymbolView
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              size={14}
              tintColor="#9CA3AF"
            />
          </Pressable>
        </View>

        {/* Sign Out Button */}
        <Pressable
          accessibilityRole="button"
          onPress={handleSignOut}
          style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
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
    gap: 24,
  },
  header: {
    marginTop: 8,
  },
  title: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#F8F9FD',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  userEmail: {
    color: '#6B7280',
    fontSize: 13,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  badge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: '#4B5563',
    fontSize: 11,
    fontWeight: '600',
  },
  badgeWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  badgeWarningText: {
    color: '#92400E',
  },
  badgeStudent: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D7FF',
  },
  badgeStudentText: {
    color: '#3B5DF6',
  },
  badgeMentor: {
    backgroundColor: '#F3EEFF',
    borderColor: '#D4BBFF',
  },
  badgeMentorText: {
    color: '#7C3AED',
  },
  userBio: {
    color: '#4B5563',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#3B5DF6',
    fontSize: 24,
    fontWeight: '700',
  },
  stateCard: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },
  stateTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },
  stateText: {
    color: '#6B7280',
    fontSize: 13,
  },
  retryButton: {
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
  },
  retryText: {
    color: '#3B5DF6',
    fontSize: 13,
    fontWeight: '700',
  },
  ctaButton: {
    backgroundColor: '#3B5DF6',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  menuSection: {
    gap: 10,
  },
  menuTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },
  menuItemSub: {
    color: '#6B7280',
    fontSize: 12,
  },
  signOutButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  signOutText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});
