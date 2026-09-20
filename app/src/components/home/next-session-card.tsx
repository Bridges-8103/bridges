import React from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { UpcomingSession } from '@/types/home';

type NextSessionCardProps = {
  session: UpcomingSession;
};

export function NextSessionCard({ session }: NextSessionCardProps) {
  const handleJoin = async () => {
    if (session.zoomUrl) {
      const supported = await Linking.canOpenURL(session.zoomUrl);
      if (supported) {
        Linking.openURL(session.zoomUrl);
        return;
      }
    }
    Alert.alert('Session Starting', `Joining Zoom call with ${session.mentorName}...`);
  };

  const handleReschedule = () => {
    Alert.alert('Reschedule Session', `Request a new time slot with ${session.mentorName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Request New Time', onPress: () => Alert.alert('Request Sent', 'Your mentor has been notified.') },
    ]);
  };

  return (
    <View style={styles.card}>
      {/* Decorative background curve */}
      <View style={styles.decorativeCircle} />

      <View style={styles.content}>
        <Text style={styles.eyebrow}>NEXT SESSION</Text>
        <Text style={styles.title}>{session.title}</Text>
        <Text style={styles.meta}>
          {session.mentorName} · {session.time}
        </Text>

        <View style={styles.buttonRow}>
          <Pressable
            accessibilityRole="button"
            onPress={handleJoin}
            style={({ pressed }) => [styles.joinButton, pressed && styles.pressed]}>
            <Text style={styles.joinButtonText}>Join Zoom</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={handleReschedule}
            style={({ pressed }) => [styles.rescheduleButton, pressed && styles.pressed]}>
            <Text style={styles.rescheduleButtonText}>Reschedule</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#4361EE',
    borderRadius: 22,
    padding: 22,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#4361EE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  decorativeCircle: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  content: {
    gap: 8,
  },
  eyebrow: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  meta: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  joinButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: {
    color: '#3B5DF6',
    fontSize: 14,
    fontWeight: '700',
  },
  rescheduleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rescheduleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
});
