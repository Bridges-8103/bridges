import React from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useAuth } from '@/hooks/use-auth';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

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
        <View style={styles.userCard}>
          <Image
            source={{
              uri:
                user?.avatarUri ||
                'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=256&h=256&fit=crop&crop=faces',
            }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Jamie Chen'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'jamie.chen@stanford.edu'}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Stanford University</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Year 3 · CS</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Menu */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Account & Settings</Text>

          <Pressable
            onPress={() => router.push('/mentor-profile')}
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
