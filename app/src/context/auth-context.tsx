import React, { createContext, useContext, useEffect } from 'react';
import { useAuth as useClerkAuth, useUser as useClerkUser, useClerk } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { setAuthTokenGetter } from '@/services/api';
import { queryClient } from '@/lib/query-client';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatarUri?: string;
  role?: 'STUDENT' | 'MENTOR';
};

type AuthContextType = {
  user: AuthUser | null;
  isSignedIn: boolean;
  isLoaded: boolean;
  signOut: () => Promise<void>;
  updateRole: (role: 'STUDENT' | 'MENTOR') => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=256&h=256&fit=crop&crop=faces';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useClerkAuth();
  const { user: clerkUser } = useClerkUser();
  const { signOut: clerkSignOut } = useClerk();

  useEffect(() => {
    if (isSignedIn) {
      setAuthTokenGetter(getToken);
    } else {
      setAuthTokenGetter(null);
    }
  }, [isSignedIn, getToken]);

  const metadataFullName =
    typeof clerkUser?.unsafeMetadata?.fullName === 'string' && clerkUser.unsafeMetadata.fullName.trim()
      ? clerkUser.unsafeMetadata.fullName.trim()
      : typeof clerkUser?.unsafeMetadata?.name === 'string' && clerkUser.unsafeMetadata.name.trim()
        ? clerkUser.unsafeMetadata.name.trim()
        : undefined;

  const clerkFirstName = clerkUser?.firstName?.trim();
  const clerkLastName = clerkUser?.lastName?.trim();
  const clerkFullName =
    clerkUser?.fullName?.trim() ||
    (clerkFirstName && clerkLastName ? `${clerkFirstName} ${clerkLastName}` : clerkFirstName);

  const realName = clerkFullName || metadataFullName;

  const rawUsername = clerkUser?.username?.trim();
  const isGeneratedUsername =
    !rawUsername ||
    rawUsername.startsWith('user_') ||
    /_\d{2,4}$/.test(rawUsername);

  let cleanedUsername: string | undefined;
  if (rawUsername) {
    if (!isGeneratedUsername) {
      cleanedUsername = rawUsername;
    } else if (rawUsername.includes('_') && !rawUsername.startsWith('user_')) {
      const withoutDigits = rawUsername.replace(/_\d+$/, '');
      cleanedUsername = withoutDigits
        .split('_')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
  }

  const emailPrefix = clerkUser?.primaryEmailAddress?.emailAddress?.split('@')[0];
  let cleanEmailName: string | undefined;
  if (emailPrefix && !emailPrefix.startsWith('user_')) {
    cleanEmailName = emailPrefix
      .split(/[._-]/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  const resolvedName = realName || cleanedUsername || cleanEmailName || 'Jamie Chen';

  const metadataRole =
    typeof clerkUser?.unsafeMetadata?.role === 'string' &&
    (clerkUser.unsafeMetadata.role.toUpperCase() === 'MENTOR' ||
      clerkUser.unsafeMetadata.role.toUpperCase() === 'STUDENT')
      ? (clerkUser.unsafeMetadata.role.toUpperCase() as 'STUDENT' | 'MENTOR')
      : typeof clerkUser?.publicMetadata?.role === 'string' &&
        (clerkUser.publicMetadata.role.toUpperCase() === 'MENTOR' ||
          clerkUser.publicMetadata.role.toUpperCase() === 'STUDENT')
        ? (clerkUser.publicMetadata.role.toUpperCase() as 'STUDENT' | 'MENTOR')
        : undefined;

  const user: AuthUser | null = isSignedIn
    ? {
        id: clerkUser?.id || 'usr_current',
        name: resolvedName,
        email: clerkUser?.primaryEmailAddress?.emailAddress || 'user@bridges.app',
        avatarUri: clerkUser?.imageUrl || DEFAULT_AVATAR,
        role: metadataRole,
      }
    : null;

  const updateRole = async (newRole: 'STUDENT' | 'MENTOR') => {
    if (clerkUser) {
      await clerkUser.update({
        unsafeMetadata: {
          ...clerkUser.unsafeMetadata,
          role: newRole,
        },
      });
    }
  };

  const handleSignOut = async () => {
    try {
      // 1. Explicitly sign out on Clerk side to terminate active session & clear cookies/storage
      await clerkSignOut();
    } catch (err) {
      console.warn('[auth] Error during Clerk signOut:', err);
    }

    // 2. Immediately detach the token getter and delete any default authorization header
    setAuthTokenGetter(null);

    // 3. Clear all cached queries in TanStack Query to prevent stale user profile & bookings from leaking
    queryClient.clear();

    // 4. On native devices, clear SecureStore clerk tokens if present
    try {
      if (tokenCache?.clearToken) {
        await tokenCache.clearToken('__clerk_client_jwt');
      }
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync('__clerk_client_jwt');
      }
    } catch {
      // Key may already be deleted or not present
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isSignedIn: Boolean(isSignedIn),
        isLoaded: Boolean(isLoaded),
        signOut: handleSignOut,
        updateRole,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
