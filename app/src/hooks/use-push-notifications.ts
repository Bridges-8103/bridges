import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import {
  useRegisterPushTokenMutation,
  unregisterPushToken,
} from '@/services/notifications';
import { connectionKeys } from '@/services/connections';

// Configure foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let cachedPushToken: string | null = null;

export function getCachedPushToken(): string | null {
  return cachedPushToken;
}

export async function unregisterCurrentPushToken(): Promise<boolean> {
  if (!cachedPushToken) return false;
  try {
    await unregisterPushToken({ token: cachedPushToken });
    console.info('[usePushNotifications] Push token successfully unregistered from backend');
    return true;
  } catch (err) {
    console.warn('[usePushNotifications] Failed to unregister push token:', err);
    return false;
  }
}

/**
 * Requests permissions, configures Android channels, and retrieves the device Expo push token.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  // Set up Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#140C59',
    });
  }

  // Push notifications require a physical device
  if (!Device.isDevice) {
    console.warn(
      '[usePushNotifications] Physical device required for remote push notifications (running on simulator/emulator).'
    );
    return null;
  }

  // Check and request notification permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[usePushNotifications] Notification permissions not granted. Status:', finalStatus);
    return null;
  }

  // Resolve EAS project ID if available with fallback to configured Bridges project
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
    '11bc69db-f44f-4611-a65a-d13aece96343';

  try {
    const pushTokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    console.info('[usePushNotifications] Successfully retrieved Expo push token:', pushTokenData.data);
    return pushTokenData.data;
  } catch (error) {
    console.error('[usePushNotifications] Failed to retrieve Expo push token:', error);
    return null;
  }
}

/**
 * Custom hook managing push notification token lifecycle, foreground listeners, and interaction deep links.
 */
export function usePushNotifications() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const registerMutation = useRegisterPushTokenMutation();

  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);

  const lastRegisteredTokenRef = useRef<string | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // Obtain token on mount and cache it
  useEffect(() => {
    let isMounted = true;

    registerForPushNotificationsAsync().then((token) => {
      if (isMounted && token) {
        cachedPushToken = token;
        setExpoPushToken(token);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // When signed in and token is available, register token with backend (deduplicated)
  const registerToken = registerMutation.mutate;
  useEffect(() => {
    if (!isSignedIn) {
      lastRegisteredTokenRef.current = null;
      return;
    }

    if (expoPushToken && lastRegisteredTokenRef.current !== expoPushToken) {
      lastRegisteredTokenRef.current = expoPushToken;
      registerToken(
        {
          token: expoPushToken,
          platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web',
          deviceName: Device.modelName ?? undefined,
        },
        {
          onSuccess: (data) => {
            console.info('[usePushNotifications] Push token registered with backend:', data);
          },
          onError: (error) => {
            console.error('[usePushNotifications] Failed to register push token with backend:', error);
            // Allow retry on error
            lastRegisteredTokenRef.current = null;
          },
        }
      );
    }
  }, [isSignedIn, expoPushToken, registerToken]);

  // Listen for incoming notifications and user responses (clicks)
  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener((incoming) => {
      setNotification(incoming);
      const data = incoming.request.content.data;
      if (
        data &&
        typeof data === 'object' &&
        (data.type === 'CONNECTION_REQUEST' || data.type === 'CONNECTION_ACCEPTED')
      ) {
        queryClient.invalidateQueries({ queryKey: connectionKeys.all });
      }
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data && typeof data === 'object') {
        const targetRoute = (data.route || data.url) as string | undefined;
        if (targetRoute && typeof targetRoute === 'string') {
          try {
            router.push(targetRoute as any);
          } catch (err) {
            console.warn('[usePushNotifications] Failed to navigate to route from notification:', err);
          }
        }
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [router, queryClient]);

  return {
    expoPushToken,
    notification,
    isRegistering: registerMutation.isPending,
  };
}
