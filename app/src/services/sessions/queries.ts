import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import {
  getBookings,
  getMentorAvailableSlots,
  getMentorConfiguredSlots,
} from './api';
import { sessionKeys } from './keys';
import type { BookingDto, SlotDto } from './types';

/**
 * Hook to fetch available unbooked slots for a mentor
 */
export const useMentorAvailableSlotsQuery = (
  mentorId: string | number,
  from?: string,
  to?: string,
  options?: Omit<UseQueryOptions<SlotDto[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<SlotDto[], Error>({
    queryKey: sessionKeys.mentorAvailableSlots(mentorId),
    queryFn: () => getMentorAvailableSlots(mentorId, from, to),
    enabled: Boolean(mentorId),
    staleTime: 1000 * 30, // 30 seconds
    ...options,
  });
};

/**
 * Hook to fetch configured slots for the logged in mentor
 */
export const useMentorConfiguredSlotsQuery = (
  from?: string,
  to?: string,
  options?: Omit<UseQueryOptions<SlotDto[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<SlotDto[], Error>({
    queryKey: sessionKeys.mentorConfiguredSlots(from, to),
    queryFn: () => getMentorConfiguredSlots(from, to),
    staleTime: 1000 * 30,
    ...options,
  });
};

/**
 * Hook to fetch user's bookings (as mentor or student)
 */
export const useBookingsQuery = (
  role?: string,
  status?: string,
  options?: Omit<UseQueryOptions<BookingDto[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<BookingDto[], Error>({
    queryKey: sessionKeys.bookings(role, status),
    queryFn: () => getBookings(role, status),
    staleTime: 1000 * 15, // 15 seconds
    ...options,
  });
};
