/**
 * Route paths for navigation via router.push(), router.replace(), and <Redirect />.
 */
export const ROUTES = {
  INDEX: '/',
  WELCOME: '/welcome',
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
  TABS: '/(tabs)',
  MENTOR_PROFILE: '/mentor-profile',
  MENTOR_AVAILABILITY: '/mentor-availability',
  SELECT_TAGS: '/select-tags',
  mentorDetail: (id: string | number) => `/mentor/${id}` as const,
  mentorBook: (id: string | number) => `/mentor/${id}/book` as const,
  mentorConfirmBooking: (id: string | number) => `/mentor/${id}/confirm-booking` as const,
} as const;

export type RoutePath =
  | Exclude<(typeof ROUTES)[keyof typeof ROUTES], Function>
  | `/mentor/${string}`
  | `/mentor/${string}/book`
  | `/mentor/${string}/confirm-booking`;

/**
 * Route segments corresponding to top-level route folders/files.
 * Used for inspecting route segments via Expo Router's `useSegments()`
 * and configuring `<Stack.Screen name="..." />`.
 */
export const ROUTE_SEGMENTS = {
  INDEX: 'index',
  WELCOME: 'welcome',
  SIGN_IN: 'sign-in',
  SIGN_UP: 'sign-up',
  TABS: '(tabs)',
  MENTOR_PROFILE: 'mentor-profile',
  MENTOR_AVAILABILITY: 'mentor-availability',
  SELECT_TAGS: 'select-tags',
  MENTOR: 'mentor',
  MENTOR_DETAIL: 'mentor/[id]',
  MENTOR_BOOK: 'mentor/[id]/book',
  MENTOR_CONFIRM: 'mentor/[id]/confirm-booking',
} as const;

export type RouteSegment = (typeof ROUTE_SEGMENTS)[keyof typeof ROUTE_SEGMENTS];

/**
 * Route access classification.
 * - 'auth': Routes intended for unauthenticated users (sign-in, sign-up, welcome).
 * - 'protected': Routes requiring an authenticated user session (tabs, mentor profile).
 * - 'public': Neutral routes accessible or handling gate logic (e.g., root index gate).
 */
export type RouteAccessType = 'auth' | 'protected' | 'public';

/**
 * Array of route segments that belong to auth screens.
 */
export const AUTH_ROUTE_SEGMENTS: readonly RouteSegment[] = [
  ROUTE_SEGMENTS.SIGN_IN,
  ROUTE_SEGMENTS.SIGN_UP,
  ROUTE_SEGMENTS.WELCOME,
] as const;

/**
 * Array of route segments that require authentication.
 */
export const PROTECTED_ROUTE_SEGMENTS: readonly RouteSegment[] = [
  ROUTE_SEGMENTS.TABS,
  ROUTE_SEGMENTS.MENTOR_PROFILE,
  ROUTE_SEGMENTS.MENTOR_AVAILABILITY,
  ROUTE_SEGMENTS.SELECT_TAGS,
  ROUTE_SEGMENTS.MENTOR,
  ROUTE_SEGMENTS.MENTOR_DETAIL,
  ROUTE_SEGMENTS.MENTOR_BOOK,
  ROUTE_SEGMENTS.MENTOR_CONFIRM,
] as const;

/**
 * Mapping of each top-level route segment to its access type.
 */
export const ROUTE_ACCESS_MAP: Record<RouteSegment, RouteAccessType> = {
  [ROUTE_SEGMENTS.INDEX]: 'public',
  [ROUTE_SEGMENTS.WELCOME]: 'auth',
  [ROUTE_SEGMENTS.SIGN_IN]: 'auth',
  [ROUTE_SEGMENTS.SIGN_UP]: 'auth',
  [ROUTE_SEGMENTS.TABS]: 'protected',
  [ROUTE_SEGMENTS.MENTOR_PROFILE]: 'protected',
  [ROUTE_SEGMENTS.MENTOR_AVAILABILITY]: 'protected',
  [ROUTE_SEGMENTS.SELECT_TAGS]: 'protected',
  [ROUTE_SEGMENTS.MENTOR]: 'protected',
  [ROUTE_SEGMENTS.MENTOR_DETAIL]: 'protected',
  [ROUTE_SEGMENTS.MENTOR_BOOK]: 'protected',
  [ROUTE_SEGMENTS.MENTOR_CONFIRM]: 'protected',
};

/**
 * Normalizes a route path or segment by stripping any leading slash.
 */
function normalizeSegment(routeOrSegment?: string): string | undefined {
  if (!routeOrSegment) return undefined;
  return routeOrSegment.startsWith('/') ? routeOrSegment.slice(1) : routeOrSegment;
}

/**
 * Checks whether a given route or root segment is an authentication route.
 */
export function isAuthRoute(routeOrSegment?: string): boolean {
  const segment = normalizeSegment(routeOrSegment);
  return Boolean(segment && (AUTH_ROUTE_SEGMENTS as readonly string[]).includes(segment));
}

/**
 * Checks whether a given route or root segment is a protected route.
 */
export function isProtectedRoute(routeOrSegment?: string): boolean {
  const segment = normalizeSegment(routeOrSegment);
  return Boolean(segment && (PROTECTED_ROUTE_SEGMENTS as readonly string[]).includes(segment));
}
