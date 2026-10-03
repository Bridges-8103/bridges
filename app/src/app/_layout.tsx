import { ClerkProvider, useAuth as useClerkAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { QueryClientProvider } from '@tanstack/react-query';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import {
  isAuthRoute,
  isProtectedRoute,
  ROUTES,
  ROUTE_SEGMENTS,
} from '@/constants/routes';
import { AuthProvider } from '@/context/auth-context';
import { queryClient } from '@/lib/query-client';

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

    const rootSegment = segments[0] as string | undefined;

    if (!isSignedIn && isProtectedRoute(rootSegment)) {
      router.replace(ROUTES.WELCOME);
    } else if (isSignedIn && isAuthRoute(rootSegment)) {
      router.replace(ROUTES.INDEX);
    }
  }, [isLoaded, isSignedIn, router, segments]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name={ROUTE_SEGMENTS.INDEX} />
        <Stack.Screen name={ROUTE_SEGMENTS.TABS} />
        <Stack.Screen name={ROUTE_SEGMENTS.WELCOME} />
        <Stack.Screen name={ROUTE_SEGMENTS.SIGN_IN} />
        <Stack.Screen name={ROUTE_SEGMENTS.SIGN_UP} />
        <Stack.Screen name={ROUTE_SEGMENTS.CHOOSE_ROLE} />
        <Stack.Screen name={ROUTE_SEGMENTS.MENTOR_PROFILE} />
        <Stack.Screen name={ROUTE_SEGMENTS.MENTOR_AVAILABILITY} />
        <Stack.Screen
          name={ROUTE_SEGMENTS.SELECT_TAGS}
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen name={ROUTE_SEGMENTS.MENTOR_DETAIL} />
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
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider value={DefaultTheme}>
            <AnimatedSplashOverlay />
            <AuthGate />
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
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
