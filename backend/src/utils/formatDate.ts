/**
 * Format an ISO date string or Date object into a readable formatted string.
 */
export function formatDate(
  dateInput: string | Date,
  locale = "en-US",
  options?: Intl.DateTimeFormatOptions
): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  };

  return new Intl.DateTimeFormat(locale, defaultOptions).format(date);
}
