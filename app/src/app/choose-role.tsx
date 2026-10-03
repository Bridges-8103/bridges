import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/use-auth';

type RoleType = 'STUDENT' | 'MENTOR';

export default function ChooseRoleScreen() {
  const router = useRouter();
  const { user, updateRole, signOut } = useAuth();

  const [selectedRole, setSelectedRole] = useState<RoleType>(
    user?.role === 'MENTOR' ? 'MENTOR' : 'STUDENT'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async (roleToUse: RoleType = selectedRole) => {
    setIsSubmitting(true);
    try {
      if (updateRole) {
        await updateRole(roleToUse);
      }
      router.replace({
        pathname: ROUTES.MENTOR_PROFILE,
        params: { role: roleToUse, isNew: 'true', name: user?.name },
      });
    } catch {
      // Still proceed even if metadata sync fails
      router.replace({
        pathname: ROUTES.MENTOR_PROFILE,
        params: { role: roleToUse, isNew: 'true', name: user?.name },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Do you want to sign out and return to the welcome screen?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace(ROUTES.WELCOME);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        {/* Top Header Row with Sign Out / Account switch */}
        <View style={styles.topRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>🌉 Bridges</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={handleSignOut}
            hitSlop={8}
            style={styles.signOutButton}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>

        {/* Header Heading */}
        <View style={styles.header}>
          <Text style={styles.title}>Choose your role</Text>
          <Text style={styles.subtitle}>
            Welcome{user?.name ? `, ${user.name}` : ''}! Tell us how you plan to use Bridges. You can
            switch roles or adjust your profile details at any time.
          </Text>
        </View>

        {/* Role Cards */}
        <View style={styles.roleCardContainer}>
          {/* Student Card */}
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => setSelectedRole('STUDENT')}
            style={({ pressed }) => [
              styles.roleCard,
              selectedRole === 'STUDENT'
                ? styles.roleCardActiveStudent
                : styles.roleCardInactive,
              pressed && styles.roleCardPressed,
            ]}>
            <View style={styles.roleCardHeader}>
              <View
                style={[
                  styles.roleEmojiContainer,
                  { backgroundColor: '#EEF3FF', borderColor: '#C7D7FF' },
                ]}>
                <Text style={styles.roleEmoji}>🎓</Text>
              </View>

              <View style={styles.roleCardTitleSection}>
                <View style={styles.roleTitleRow}>
                  <Text style={styles.roleTitle}>Student</Text>
                  {selectedRole === 'STUDENT' && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>Selected</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.roleDescription}>
                  I&apos;m looking for guidance, career advice, and connections with industry
                  professionals.
                </Text>
              </View>

              <View
                style={[
                  styles.roleRadioCircle,
                  selectedRole === 'STUDENT'
                    ? styles.roleRadioCircleActiveStudent
                    : styles.roleRadioCircleInactive,
                ]}>
                {selectedRole === 'STUDENT' && (
                  <SymbolView
                    name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                    size={12}
                    tintColor="#FFFFFF"
                  />
                )}
              </View>
            </View>

            {/* Perks */}
            <View style={[styles.rolePerksList, { borderTopColor: '#E5EDFF' }]}>
              <PerkItem
                text="Browse 200+ verified industry mentors"
                color="#4A6CF7"
              />
              <PerkItem text="Book 1-on-1 mentorship sessions" color="#4A6CF7" />
              <PerkItem
                text="Get personalised career and university guidance"
                color="#4A6CF7"
              />
            </View>
          </Pressable>

          {/* Mentor Card */}
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => setSelectedRole('MENTOR')}
            style={({ pressed }) => [
              styles.roleCard,
              selectedRole === 'MENTOR'
                ? styles.roleCardActiveMentor
                : styles.roleCardInactive,
              pressed && styles.roleCardPressed,
            ]}>
            <View style={styles.roleCardHeader}>
              <View
                style={[
                  styles.roleEmojiContainer,
                  { backgroundColor: '#F3EEFF', borderColor: '#D4BBFF' },
                ]}>
                <Text style={styles.roleEmoji}>🌟</Text>
              </View>

              <View style={styles.roleCardTitleSection}>
                <View style={styles.roleTitleRow}>
                  <Text style={styles.roleTitle}>Mentor</Text>
                  {selectedRole === 'MENTOR' && (
                    <View
                      style={[styles.selectedBadge, { backgroundColor: '#EDE4FF' }]}>
                      <Text
                        style={[styles.selectedBadgeText, { color: '#7C3AED' }]}>
                        Selected
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.roleDescription}>
                  I want to share my industry experience, guide students, and support the next
                  generation.
                </Text>
              </View>

              <View
                style={[
                  styles.roleRadioCircle,
                  selectedRole === 'MENTOR'
                    ? styles.roleRadioCircleActiveMentor
                    : styles.roleRadioCircleInactive,
                ]}>
                {selectedRole === 'MENTOR' && (
                  <SymbolView
                    name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                    size={12}
                    tintColor="#FFFFFF"
                  />
                )}
              </View>
            </View>

            {/* Perks */}
            <View style={[styles.rolePerksList, { borderTopColor: '#EFE5FF' }]}>
              <PerkItem
                text="Set your own availability & meeting schedule"
                color="#7C3AED"
              />
              <PerkItem
                text="Guide students in your field of expertise"
                color="#7C3AED"
              />
              <PerkItem
                text="Build your personal leadership profile"
                color="#7C3AED"
              />
            </View>
          </Pressable>
        </View>

        {/* Action Button */}
        <View style={styles.bottomSection}>
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => handleContinue()}
            style={({ pressed }) => [
              styles.continueButton,
              selectedRole === 'MENTOR'
                ? styles.continueButtonMentor
                : styles.continueButtonStudent,
              pressed && styles.pressed,
            ]}>
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.continueButtonText}>
                Continue as {selectedRole === 'MENTOR' ? 'Mentor' : 'Student'}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PerkItem({ text, color }: { text: string; color: string }) {
  return (
    <View style={styles.perkItem}>
      <View style={[styles.perkDot, { backgroundColor: color }]}>
        <SymbolView
          name={{ ios: 'checkmark', android: 'check', web: 'check' }}
          size={8}
          tintColor="#FFFFFF"
        />
      </View>
      <Text style={styles.perkText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 36,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F8',
  },
  logoBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B5DF6',
  },
  signOutButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  signOutText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  header: {
    marginBottom: 28,
    gap: 8,
  },
  title: {
    color: '#111827',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 15,
    lineHeight: 22,
  },
  roleCardContainer: {
    gap: 16,
    marginBottom: 28,
  },
  roleCard: {
    borderWidth: 2,
    borderRadius: 22,
    padding: 20,
    gap: 14,
  },
  roleCardInactive: {
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFBFF',
  },
  roleCardActiveStudent: {
    borderColor: '#4A6CF7',
    backgroundColor: '#F7F9FF',
    shadowColor: '#4A6CF7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  roleCardActiveMentor: {
    borderColor: '#7C3AED',
    backgroundColor: '#FAF7FF',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  roleCardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  roleCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  roleEmojiContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  roleEmoji: {
    fontSize: 22,
  },
  roleCardTitleSection: {
    flex: 1,
    gap: 4,
  },
  roleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  selectedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#E0EAFF',
  },
  selectedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B5DF6',
  },
  roleDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  roleRadioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  roleRadioCircleInactive: {
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  roleRadioCircleActiveStudent: {
    borderColor: '#4A6CF7',
    backgroundColor: '#4A6CF7',
  },
  roleRadioCircleActiveMentor: {
    borderColor: '#7C3AED',
    backgroundColor: '#7C3AED',
  },
  rolePerksList: {
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 8,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  perkDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  bottomSection: {
    marginTop: 'auto',
    paddingTop: 12,
  },
  continueButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonStudent: {
    backgroundColor: '#3B5DF6',
    shadowColor: '#3B5DF6',
  },
  continueButtonMentor: {
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.88,
  },
});
