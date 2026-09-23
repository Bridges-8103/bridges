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

  const user: AuthUser | null = isSignedIn
    ? {
        id: clerkUser?.id || 'usr_current',
        name:
          clerkUser?.fullName ||
          clerkUser?.firstName ||
          clerkUser?.username ||
          clerkUser?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
          '',
        email: clerkUser?.primaryEmailAddress?.emailAddress || '',
        avatarUri: clerkUser?.imageUrl,
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
