import { api } from '@/services/api';
import type {
  BookingDto,
  CreateBookingsInput,
  SetAvailabilityInput,
  SlotDto,
  UpdateBookingStatusInput,
} from './types';

interface ApiEnvelope<T> {
  status: number;
  data: T;
  message?: string;
  errors?: unknown;
}

function unwrap<T>(envelope: ApiEnvelope<T>): T {
  return envelope?.data;
}

/**
 * Fetch open available slots for a specific mentor
 */
export const getMentorAvailableSlots = async (
  mentorId: string | number,
  from?: string,
  to?: string
): Promise<SlotDto[]> => {
  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to) params.to = to;

  const response = await api.get<ApiEnvelope<SlotDto[]>>(
    `/api/mentors/${mentorId}/slots`,
    { params }
  );
  return unwrap(response.data) || [];
};

/**
 * Fetch mentor's configured slots (authenticated mentor)
 */
export const getMentorConfiguredSlots = async (
  from?: string,
  to?: string
): Promise<SlotDto[]> => {
  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to) params.to = to;

  const response = await api.get<ApiEnvelope<SlotDto[]>>(
    '/api/mentor/availability',
    { params }
  );
  return unwrap(response.data) || [];
};

/**
 * Bulk save/toggle mentor availability slots
 */
export const setMentorAvailability = async (
  input: SetAvailabilityInput
): Promise<{ updatedCount: number }> => {
  const response = await api.put<ApiEnvelope<{ updatedCount: number }>>(
    '/api/mentor/availability',
    input
  );
  return unwrap(response.data);
};

/**
 * Reserve one or multiple session slots
 */
export const createBookings = async (
  input: CreateBookingsInput
): Promise<BookingDto[]> => {
  const response = await api.post<ApiEnvelope<BookingDto[]>>(
    '/api/bookings',
    input
  );
  return unwrap(response.data);
};

/**
 * Fetch bookings for current user (as student or mentor)
 */
export const getBookings = async (
  role?: string,
  status?: string
): Promise<BookingDto[]> => {
  const params: Record<string, string> = {};
  if (role) params.role = role;
  if (status) params.status = status;

  const response = await api.get<ApiEnvelope<BookingDto[]>>(
    '/api/bookings',
    { params }
  );
  return unwrap(response.data) || [];
};

/**
 * Update booking status (confirm, decline, cancel)
 */
export const updateBookingStatus = async (
  bookingId: number,
  input: UpdateBookingStatusInput
): Promise<BookingDto> => {
  const response = await api.patch<ApiEnvelope<BookingDto>>(
    `/api/bookings/${bookingId}/status`,
    input
  );
  return unwrap(response.data);
};
