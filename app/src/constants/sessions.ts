/**
 * Configurable constants for mentorship sessions.
 */
export const SESSION_CONFIG = {
  /** Hardcoded slot unit in minutes (can be changed in code) */
  SLOT_DURATION_MINUTES: 30,

  /** How many days into the future mentors can configure and students can book */
  BOOKING_HORIZON_DAYS: 30,

  /** Default start and end hours for quick availability presets */
  DEFAULT_WORK_START_HOUR: 9,
  DEFAULT_WORK_END_HOUR: 18,
} as const;
