import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createBookings,
  setMentorAvailability,
  updateBookingStatus,
} from './api';
import { sessionKeys } from './keys';
import type {
  BookingDto,
  CreateBookingsInput,
  SetAvailabilityInput,
  UpdateBookingStatusInput,
} from './types';

/**
 * Mutation to save/update mentor's availability slots
 */
export const useSetMentorAvailabilityMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<{ updatedCount: number }, Error, SetAvailabilityInput>({
    mutationFn: (input) => setMentorAvailability(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sessionKeys.all,
      });
    },
  });
};

/**
 * Mutation for students to book one or multiple session slots
 */
export const useCreateBookingsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<BookingDto[], Error, CreateBookingsInput>({
    mutationFn: (input) => createBookings(input),
    onSuccess: (_data, variables) => {
      // Invalidate both mentor slots and booking lists
      queryClient.invalidateQueries({
        queryKey: sessionKeys.mentorAvailableSlots(variables.mentorId),
      });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.all,
      });
    },
  });
};

/**
 * Mutation for mentors to confirm/decline or students to cancel a session
 */
export const useUpdateBookingStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    BookingDto,
    Error,
    { bookingId: number; input: UpdateBookingStatusInput }
  >({
    mutationFn: ({ bookingId, input }) => updateBookingStatus(bookingId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sessionKeys.all,
      });
    },
  });
};
