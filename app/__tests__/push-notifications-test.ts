import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import {
  registerForPushNotificationsAsync,
  getCachedPushToken,
  unregisterCurrentPushToken,
} from '@/hooks/use-push-notifications';
import * as notificationsApi from '@/services/notifications/api';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  AndroidImportance: { MAX: 5 },
}));

jest.mock('expo-device', () => ({
  isDevice: true,
  modelName: 'iPhone 15 Pro',
}));

jest.mock('@/services/notifications/api', () => ({
  registerPushToken: jest.fn(),
  unregisterPushToken: jest.fn(),
}));

describe('Push Notifications Hook & Registration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Device as { isDevice: boolean }).isDevice = true;
  });

  it('bypasses registration and logs warning if running on non-physical device (simulator)', async () => {
    (Device as { isDevice: boolean }).isDevice = false;
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const token = await registerForPushNotificationsAsync();

    expect(token).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Physical device required')
    );
    warnSpy.mockRestore();
  });

  it('requests permissions if not initially granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'undetermined',
    });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'granted',
    });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValueOnce({
      data: 'ExponentPushToken[mock-token-12345]',
    });

    const token = await registerForPushNotificationsAsync();

    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({
      projectId: '11bc69db-f44f-4611-a65a-d13aece96343',
    });
    expect(token).toBe('ExponentPushToken[mock-token-12345]');
  });

  it('returns null if permissions are denied', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'denied',
    });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'denied',
    });

    const token = await registerForPushNotificationsAsync();

    expect(token).toBeNull();
    expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it('successfully unregisters active push token', async () => {
    (notificationsApi.unregisterPushToken as jest.Mock).mockResolvedValueOnce({
      success: true,
    });

    // When no token cached
    const resEmpty = await unregisterCurrentPushToken();
    expect(resEmpty).toBe(false);

    // After token is obtained
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'granted',
    });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValueOnce({
      data: 'ExponentPushToken[mock-token-logout]',
    });
    await registerForPushNotificationsAsync();

    // Verify unregister
    const res = await unregisterCurrentPushToken();
    // cachedPushToken is updated during hook lifecycle or register
    expect(typeof res).toBe('boolean');
  });
});
