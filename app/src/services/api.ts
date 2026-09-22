import axios from 'axios';

type TokenGetter = () => Promise<string | null>;

let authTokenGetter: TokenGetter | null = null;

/**
 * Configure dynamic token retrieval callback (e.g. from Clerk useAuth().getToken).
 */
export const setAuthTokenGetter = (getter: TokenGetter | null) => {
  authTokenGetter = getter;
};

// eslint-disable-next-line import/no-named-as-default-member
export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
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
