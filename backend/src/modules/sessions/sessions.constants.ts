/**
 * Centralized constants for mentorship sessions and availability.
 */
export const SESSION_CONFIG = {
  /** Duration of each individual bookable session slot in minutes */
  SLOT_DURATION_MINUTES: 30,

  /** How many days into the future slots can be scheduled/booked */
  BOOKING_HORIZON_DAYS: 30,

  /** Minimum notice required before a session can be booked (in hours) */
  MIN_NOTICE_HOURS: 1,

  /** Standard working hours (24h format) for presets */
  DEFAULT_WORK_START_HOUR: 9,
  DEFAULT_WORK_END_HOUR: 18,
} as const;
