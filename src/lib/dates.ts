/**
 * Trip-date helpers (TA-57). Framework-free. Dates are inclusive ISO
 * "YYYY-MM-DD" strings and are parsed in UTC so day counts never shift with the
 * server's timezone.
 */
import { config } from "@/lib/config";
import type { TripDates } from "@/types/trip";

const DAY_MS = 86_400_000;

function toUtcMs(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Inclusive number of days in the window (start and end both counted). */
export function tripDayCount(dates: TripDates): number {
  return Math.round((toUtcMs(dates.end) - toUtcMs(dates.start)) / DAY_MS) + 1;
}

const dateFmt = new Intl.DateTimeFormat(config.locale, {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** A system-prompt line pinning the exact dates + day count for the planner. */
export function formatTripDatesNote(dates: TripDates): string {
  const start = dateFmt.format(new Date(toUtcMs(dates.start)));
  const end = dateFmt.format(new Date(toUtcMs(dates.end)));
  const n = tripDayCount(dates);
  return `The traveler's trip runs ${start} to ${end} (${n} days). Plan exactly ${n} day${n === 1 ? "" : "s"} to match these dates.`;
}
