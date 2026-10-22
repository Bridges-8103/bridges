import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

const AVATARS = {
  center: 'https://i.pravatar.cc/300?u=mentor-1',
  topLeft: 'https://i.pravatar.cc/300?u=mentor-2',
  topRight: 'https://i.pravatar.cc/300?u=mentor-4',
  bottomLeft: 'https://i.pravatar.cc/300?u=mentor-3',
  bottomRight: 'https://i.pravatar.cc/300?u=mentor-5',
};

export function MentorAvatarCluster() {
  return (
    <View style={styles.outerContainer}>
      <View style={styles.clusterCircle}>
        {/* Top Left Avatar */}
        <Image source={{ uri: AVATARS.topLeft }} style={[styles.avatar, styles.topLeft]} />

        {/* Top Right Avatar */}
        <Image source={{ uri: AVATARS.topRight }} style={[styles.avatar, styles.topRight]} />

        {/* Center Avatar */}
        <Image source={{ uri: AVATARS.center }} style={[styles.avatar, styles.center]} />

        {/* Bottom Left Avatar */}
        <Image source={{ uri: AVATARS.bottomLeft }} style={[styles.avatar, styles.bottomLeft]} />

        {/* Bottom Right Avatar */}
        <Image source={{ uri: AVATARS.bottomRight }} style={[styles.avatar, styles.bottomRight]} />
      </View>

      {/* Mentors Community Badge */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Mentors & Peers</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 240,
    marginVertical: 10,
  },
  clusterCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatar: {
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    position: 'absolute',
  },
  center: {
    width: 76,
    height: 76,
    zIndex: 5,
  },
  topLeft: {
    width: 50,
    height: 50,
    top: 14,
    left: 18,
    zIndex: 2,
  },
  topRight: {
    width: 48,
    height: 48,
    top: 20,
    right: 22,
    zIndex: 2,
  },
  bottomLeft: {
    width: 52,
    height: 52,
    bottom: 18,
    left: 24,
    zIndex: 3,
  },
  bottomRight: {
    width: 46,
    height: 46,
    bottom: 22,
    right: 26,
    zIndex: 3,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 56,
    backgroundColor: '#3B5DF6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 10,
    shadowColor: '#3B5DF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
