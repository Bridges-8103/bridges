export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'DECLINED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface SlotDto {
  id: number;
  mentorId: number;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  isAvailable: boolean;
  isBooked: boolean;
  bookingStatus?: BookingStatus;
  bookingId?: number;
}

export interface SetAvailabilitySlotItem {
  startTime: string;
  endTime?: string;
  isAvailable: boolean;
}

export interface SetAvailabilityInput {
  slots: SetAvailabilitySlotItem[];
}

export interface SessionBookingRequestItem {
  slotId: number;
  topic: string;
  notes?: string;
}

export interface CreateBookingsInput {
  mentorId: number;
  bookings: SessionBookingRequestItem[];
}

export interface BookingUserSummary {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
  subtitle?: string | null;
}

export interface BookingDto {
  id: number;
  slotId: number;
  mentorId: number;
  studentId: number;
  batchId?: string | null;
  topic: string;
  notes?: string | null;
  status: BookingStatus;
  meetingLink?: string | null;
  declineReason?: string | null;
  slot: {
    startTime: string;
    endTime: string;
  };
  mentor?: BookingUserSummary;
  student?: BookingUserSummary;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateBookingStatusInput {
  status: 'CONFIRMED' | 'DECLINED' | 'CANCELLED';
  reason?: string;
  meetingLink?: string;
}
