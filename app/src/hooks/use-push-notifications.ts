import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import { useRegisterPushTokenMutation } from '@/services/notifications';

// Configure foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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
    console.warn('[usePushNotifications] Physical device required for remote push notifications.');
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
    console.warn('[usePushNotifications] Notification permissions not granted.');
    return null;
  }

  // Resolve EAS project ID if available
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

  try {
    const pushTokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
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
  const registerMutation = useRegisterPushTokenMutation();

  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // Obtain token on mount and register with backend when signed in
  useEffect(() => {
    let isMounted = true;

    registerForPushNotificationsAsync().then((token) => {
      if (isMounted && token) {
        setExpoPushToken(token);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // When signed in and token is available, register token with backend
  useEffect(() => {
    if (isSignedIn && expoPushToken) {
      registerMutation.mutate({
        token: expoPushToken,
        platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web',
        deviceName: Device.modelName ?? undefined,
      });
    }
  }, [isSignedIn, expoPushToken, registerMutation]);

  // Listen for incoming notifications and user responses (clicks)
  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener((incoming) => {
      setNotification(incoming);
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
  }, [router]);

  return {
    expoPushToken,
    notification,
    isRegistering: registerMutation.isPending,
  };
}
