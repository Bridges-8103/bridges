export const sessionKeys = {
  all: ['sessions'] as const,
  mentorAvailableSlots: (mentorId: string | number) =>
    [...sessionKeys.all, 'mentor-available-slots', String(mentorId)] as const,
  mentorConfiguredSlots: (from?: string, to?: string) =>
    [...sessionKeys.all, 'mentor-configured-slots', { from, to }] as const,
  bookings: (role?: string, status?: string) =>
    [...sessionKeys.all, 'bookings', { role, status }] as const,
};
