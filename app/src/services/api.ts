import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

type TokenGetter = () => Promise<string | null>;

let authTokenGetter: TokenGetter | null = null;

/**
 * Configure dynamic token retrieval callback (e.g. from Clerk useAuth().getToken).
 */
export const setAuthTokenGetter = (getter: TokenGetter | null) => {
  authTokenGetter = getter;
};

const resolveApiBaseUrl = (): string => {
  let envUrl = process.env.EXPO_PUBLIC_API_URL;

  // Normalize port if port 3000 was mistakenly specified
  if (envUrl?.includes(':3000')) {
    console.warn(
      `[api] EXPO_PUBLIC_API_URL is configured to port 3000 (${envUrl}), but Bridges backend runs on port 3001. Redirecting to port 3001.`
    );
    envUrl = envUrl.replace(':3000', ':3001');
  }

  // If a remote production or explicit non-localhost URL is provided, use it directly
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  // On native mobile (iOS / Android devices and emulators), localhost refers to the device itself.
  // Resolve the machine's actual LAN IP from Expo's hostUri or Android emulator gateway.
  if (Platform.OS !== 'web') {
    const debuggerHost =
      Constants.expoConfig?.hostUri ||
      (Constants as unknown as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;

    if (debuggerHost) {
      const hostIp = debuggerHost.split(':')[0];
      if (hostIp) {
        return `http://${hostIp}:3001`;
      }
    }

    // Android emulator alias for host machine
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3001';
    }
  }

  return envUrl || 'http://localhost:3001';
};

// eslint-disable-next-line import/no-named-as-default-member
export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
});

// Automatically inject Clerk Bearer token into outgoing requests when available
api.interceptors.request.use(async (config) => {
  if (authTokenGetter) {
    try {
      const token = await authTokenGetter();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('[api interceptor] Failed to attach Clerk bearer token:', error);
    }
  }
  return config;
});

export default api;
