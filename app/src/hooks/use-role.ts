import { useAuth, type AuthUser } from '@/hooks/use-auth';
import { useProfileQuery } from '@/services/profile/queries';
import type { UserProfile } from '@/services/profile/types';

export type UserRole = 'STUDENT' | 'MENTOR';

export interface UseRoleReturn {
  role: UserRole;
  isMentor: boolean;
  isStudent: boolean;
  profile: UserProfile | null | undefined;
  user: AuthUser | null;
  isLoading: boolean;
  updateRole: (newRole: UserRole) => Promise<void>;
}

/**
 * Hook to resolve and check active user role ('STUDENT' vs 'MENTOR').
 * Prioritizes the database UserProfile record, falling back to Clerk auth metadata.
 */
export function useRole(): UseRoleReturn {
  const { user, isLoaded, updateRole } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useProfileQuery();

  const resolvedRole: UserRole =
    profile?.role === 'MENTOR' || user?.role === 'MENTOR'
      ? 'MENTOR'
      : 'STUDENT';

  const isMentor = resolvedRole === 'MENTOR';
  const isStudent = resolvedRole === 'STUDENT';

  return {
    role: resolvedRole,
    isMentor,
    isStudent,
    profile,
    user,
    isLoading: !isLoaded || isProfileLoading,
    updateRole,
  };
}
