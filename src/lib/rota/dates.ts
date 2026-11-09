/**
 * Days and weeks for the rota.
 *
 * A day travels through the app as "YYYY-MM-DD" text and is stored as a
 * Postgres DATE. Doing the maths on that text in UTC means a shift on Tuesday
 * stays on Tuesday whatever the server's clock zone is.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
export const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
export const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** A day as stored in a DATE column. */
export function toDbDate(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

/** A DATE column back to "YYYY-MM-DD". */
export function fromDbDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(day: string, days: number): string {
  return fromDbDate(new Date(toDbDate(day).getTime() + days * DAY_MS));
}

/** The Monday of the week a day falls in. */
export function mondayOf(day: string): string {
  const weekday = toDbDate(day).getUTCDay(); // 0 = Sunday
  return addDays(day, weekday === 0 ? -6 : 1 - weekday);
}

/** The seven days of the week starting on `monday`. */
export function daysOfWeek(monday: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

/** Today at the café. CAFE_TIMEZONE (e.g. Europe/London) if set, else the server's zone. */
export function today(now: Date = new Date()): string {
  const zone = process.env.CAFE_TIMEZONE?.trim() || undefined;
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

/** A week from a URL, or this week. Anything unreadable is this week. */
export function weekFromParam(value: string | undefined, now: Date = new Date()): string {
  if (value && ISO_DAY.test(value) && !Number.isNaN(toDbDate(value).getTime())) {
    return mondayOf(value);
  }
  return mondayOf(today(now));
}

function format(day: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }).format(toDbDate(day));
}

/** "Tue 11 Nov" */
export function shortDay(day: string): string {
  return format(day, { weekday: 'short', day: 'numeric', month: 'short' });
}

/** "Tuesday 11 November" */
export function longDay(day: string): string {
  return format(day, { weekday: 'long', day: 'numeric', month: 'long' });
}

/** "Week of 10 Nov" */
export function weekName(monday: string): string {
  return `Week of ${format(monday, { day: 'numeric', month: 'short' })}`;
}

/** Whether two shifts on the same day overlap. Touching ends do not count. */
export function overlaps(
  a: { startTime: string; endTime: string },
  b: { startTime: string; endTime: string },
): boolean {
  return a.startTime < b.endTime && b.startTime < a.endTime;
}
