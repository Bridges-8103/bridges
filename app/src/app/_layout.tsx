import { ClerkProvider, useAuth as useClerkAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '@/context/auth-context';

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
const hasValidPublishableKey =
  publishableKey?.startsWith('pk_test_') ||
  publishableKey?.startsWith('pk_live_');

function AuthGate() {
  const { isLoaded, isSignedIn } = useClerkAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!isLoaded) return;

    const currentRoute = segments[0] as string | undefined;
    const isAuthRoute =
      currentRoute === 'sign-in' || currentRoute === 'sign-up' || currentRoute === 'welcome';

    if (!isSignedIn && !isAuthRoute && currentRoute) {
      router.replace('/welcome');
    } else if (isSignedIn && isAuthRoute) {
      router.replace('/(tabs)');
    }
  }, [isLoaded, isSignedIn, router, segments]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="mentor-profile" />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}

function MissingKeyScreen({ invalidKey = false }: { invalidKey?: boolean }) {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <View style={styles.missingKey}>
      <Text style={styles.missingKeyTitle}>
        {invalidKey ? 'Invalid Clerk key' : 'Clerk is not configured'}
      </Text>
      <Text style={styles.missingKeyBody}>
        {invalidKey
          ? 'Use a Clerk publishable key starting with pk_test_ or pk_live_. Never put an sk_ secret key in an EXPO_PUBLIC variable.'
          : 'Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your .env file and restart Expo.'}
      </Text>
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Safety fallback: guarantee splash screen hides even if overlay animation stalls
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!hasValidPublishableKey) {
    return <MissingKeyScreen invalidKey={Boolean(publishableKey)} />;
  }

  return (
    <ClerkProvider publishableKey={publishableKey!} tokenCache={tokenCache}>
      <AuthProvider>
        <ThemeProvider value={DefaultTheme}>
          <AnimatedSplashOverlay />
          <AuthGate />
        </ThemeProvider>
      </AuthProvider>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  missingKey: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F8F9FD',
  },
  missingKeyTitle: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  missingKeyBody: {
    color: '#6B7280',
    fontSize: 16,
    lineHeight: 24,
  },
});
