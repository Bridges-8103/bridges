# Agent Guidelines: Expo Mobile App Architecture (`app/`)

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

---

## 1. MANDATORY: TanStack Query for All Server State

All developers, contributors, and agents working on the mobile app (`app/`) MUST strictly use **TanStack Query (`@tanstack/react-query` v5)** for managing asynchronous remote/server data fetching, caching, synchronization, and mutations.

### Strict Enforcement Rules:
- ❌ **NEVER hand-roll `useEffect` + `axios`**: Do not use `useEffect` with manual `useState` (`isLoading`, `error`, `data`) for remote network data fetching.
- ❌ **NEVER store server cache in Zustand or Context**: Client state stores (Zustand) and React Context are strictly reserved for client-only UI state (such as theme preferences, draft modal states, navigation state). Never duplicate or sync API response data into client stores.
- ❌ **DO NOT write a wrapper API client**: Do NOT construct custom wrapper classes, custom request abstractions, or wrapper fetchers on top of Axios. Use the standard `api` Axios instance (`axios.create({ baseURL })`) directly.
- ✅ **ALWAYS use `useQuery` or `useSuspenseQuery`** for fetching server data.
- ✅ **ALWAYS use `useMutation`** for creating, updating, or deleting server resources.
- ✅ **Centralized Query Client**: The root `QueryClient` instance is initialized in `src/lib/query-client.ts` and wrapped via `<QueryClientProvider client={queryClient}>` in `src/app/_layout.tsx`.
- ✅ **Query Key Factories**: All query keys must be structured as centralized, typed tuple arrays per entity. Never pass unorganized or magic string query keys.
- ✅ **Invalidation on Mutation**: When mutating server state, always invalidate or update affected query keys using `queryClient.invalidateQueries({ queryKey: ... })`.

---

## 2. API Services Folder Architecture (`src/services/`)

All backend communications, Axios calls, query keys, and TanStack Query hooks MUST be located under `src/services/` organized into sub-folders by **endpoint / entity**:

```
src/services/
├── api.ts                  # Shared Axios instance (axios.create({ baseURL })) - NO custom wrapper
├── index.ts                # Root export of services
└── <entity>/               # Sub-folder per endpoint/domain (e.g. profile, mentors, sessions)
    ├── types.ts            # TypeScript request/response contracts and data models
    ├── keys.ts             # Typed query key factory for this entity
    ├── api.ts              # Direct Axios HTTP calls (getProfile, updateProfile, etc.)
    ├── queries.ts          # Custom useQuery hooks for this entity
    ├── mutations.ts        # Custom useMutation hooks with automatic cache invalidation
    └── index.ts            # Entity barrel export
```

---

## 3. Implementation Blueprint (Example: `services/profile/`)

### A. Shared Axios Instance (`src/services/api.ts`)
```ts
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

export default api;
```

### B. Endpoint Types (`src/services/profile/types.ts`)
```ts
export interface UserProfile {
  id: string;
  userId: string;
  name?: string;
  bio?: string;
  role?: string;
  skills?: string[];
}

export interface UpdateProfileInput {
  name?: string;
  bio?: string;
  skills?: string[];
}
```

### C. Query Key Factory (`src/services/profile/keys.ts`)
```ts
export const profileKeys = {
  all: ['profile'] as const,
  current: () => [...profileKeys.all, 'current'] as const,
  detail: (userId: string) => [...profileKeys.all, 'detail', userId] as const,
};
```

### D. Direct Axios Calls (`src/services/profile/api.ts`)
```ts
import { api } from '@/services/api';
import { UpdateProfileInput, UserProfile } from './types';

export const getProfile = async (): Promise<UserProfile> => {
  const response = await api.get<UserProfile>('/api/profile');
  return response.data;
};

export const updateProfile = async (input: UpdateProfileInput): Promise<UserProfile> => {
  const response = await api.patch<UserProfile>('/api/profile', input);
  return response.data;
};
```

### E. Example `useQuery` Hook (`src/services/profile/queries.ts`)
```ts
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { getProfile } from './api';
import { profileKeys } from './keys';
import { UserProfile } from './types';

export function useProfileQuery(
  options?: Omit<UseQueryOptions<UserProfile, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: profileKeys.current(),
    queryFn: getProfile,
    ...options,
  });
}
```

### F. Example `useMutation` Hook (`src/services/profile/mutations.ts`)
```ts
import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { updateProfile } from './api';
import { profileKeys } from './keys';
import { UpdateProfileInput, UserProfile } from './types';

export function useUpdateProfileMutation(
  options?: UseMutationOptions<UserProfile, Error, UpdateProfileInput>
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: updateProfile,
    onSuccess: async (...args) => {
      // Invalidate queries to automatically refresh server cache
      await queryClient.invalidateQueries({ queryKey: profileKeys.current() });
      await options?.onSuccess?.(...args);
    },
  });
}
```

### G. Consuming in Screens / Components
```tsx
import { Text, View, Button } from 'react-native';
import { useProfileQuery, useUpdateProfileMutation } from '@/services/profile';

export function ProfileScreen() {
  const { data: profile, isLoading, error } = useProfileQuery();
  const updateMutation = useUpdateProfileMutation();

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error loading profile</Text>;

  return (
    <View>
      <Text>{profile?.name}</Text>
      <Button
        title="Update Bio"
        onPress={() => updateMutation.mutate({ bio: 'New bio content' })}
        disabled={updateMutation.isPending}
      />
    </View>
  );
}
```

---

## 4. Directory Structure Conventions (`app/src/`)

- `app/` — Expo Router routes (file-based navigation, screens, tabs, layouts).
- `services/` — All API integrations organized by endpoint/entity sub-folders with `queries.ts` and `mutations.ts` using Axios directly.
- `components/` — Modular React Native UI components (categorized into `ui/`, `home/`, `mentor-profile/`, etc.).
- `hooks/` — Custom UI or client-only hooks (e.g. `useColorScheme`, `useTheme`).
- `lib/` — Shared infrastructure (`query-client.ts`, `query-keys.ts`).
- `context/` — Client-only React Contexts (e.g., authentication, global theme).
- `constants/` — Static design tokens, themes, layout constants.
- `types/` — Shared TypeScript type declarations.
