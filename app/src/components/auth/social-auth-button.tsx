import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

type SocialAuthButtonProps = {
  provider: 'google' | 'apple';
  onPress?: () => void;
};

export function SocialAuthButton({ provider, onPress }: SocialAuthButtonProps) {
  const isGoogle = provider === 'google';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <View style={styles.iconContainer}>
        {isGoogle ? (
          <View style={styles.googleBadge}>
            <Text style={styles.googleG}>G</Text>
          </View>
        ) : (
          <SymbolView
            name={{ ios: 'apple.logo', android: 'favorite', web: 'star' }}
            size={18}
            tintColor="#000000"
          />
        )}
      </View>
      <Text style={styles.buttonText}>{isGoogle ? 'Google' : 'Apple'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  pressed: {
    opacity: 0.75,
    backgroundColor: '#F9FAFB',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EA4335',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleG: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginTop: -1,
  },
  buttonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },
});
