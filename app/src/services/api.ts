import axios from 'axios';

type TokenGetter = () => Promise<string | null>;

let authTokenGetter: TokenGetter | null = null;

/**
 * Configure dynamic token retrieval callback (e.g. from Clerk useAuth().getToken).
 */
export const setAuthTokenGetter = (getter: TokenGetter | null) => {
  authTokenGetter = getter;
};

const resolveApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!envUrl) {
    return 'http://localhost:3001';
  }
  if (envUrl.includes('localhost:3000') || envUrl.includes('127.0.0.1:3000')) {
    console.warn(
      `[api] EXPO_PUBLIC_API_URL is configured to port 3000 (${envUrl}), but Bridges backend runs on port 3001. Redirecting to port 3001.`
    );
    return envUrl.replace(':3000', ':3001');
  }
  return envUrl;
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
