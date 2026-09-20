import React, { createContext, useContext } from 'react';
import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/expo';

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
  const { isLoaded, isSignedIn, signOut } = useClerkAuth();
  const { user: clerkUser } = useClerkUser();

  const user: AuthUser | null = isSignedIn
    ? {
        id: clerkUser?.id || 'usr_current',
        name:
          clerkUser?.fullName ||
          clerkUser?.firstName ||
          clerkUser?.username ||
          clerkUser?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
          'Jamie Chen',
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
