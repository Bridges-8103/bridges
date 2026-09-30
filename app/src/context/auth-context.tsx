import React, { createContext, useContext, useEffect } from 'react';
import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/expo';
import { setAuthTokenGetter } from '@/services/api';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatarUri?: string;
  role?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  isSignedIn: boolean;
  isLoaded: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=256&h=256&fit=crop&crop=faces';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, signOut, getToken } = useClerkAuth();
  const { user: clerkUser } = useClerkUser();

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

  const user: AuthUser | null = isSignedIn
    ? {
        id: clerkUser?.id || 'usr_current',
        name: resolvedName,
        email: clerkUser?.primaryEmailAddress?.emailAddress || 'student@university.edu',
        avatarUri: clerkUser?.imageUrl || DEFAULT_AVATAR,
        role: 'STUDENT',
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isSignedIn: Boolean(isSignedIn),
        isLoaded: Boolean(isLoaded),
        signOut: async () => {
          await signOut();
        },
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
