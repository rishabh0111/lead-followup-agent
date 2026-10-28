const MS_PER_DAY = 86_400_000;

const istFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Today's date in India time as YYYY-MM-DD. */
export function todayIST(now: Date = new Date()): string {
  return istFormat.format(now);
}

/** The current moment as India time, YYYY-MM-DDTHH:MM:SS+05:30. */
export function nowIST(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() + 330 * 60_000);
  return shifted.toISOString().slice(0, 19) + "+05:30";
}

function toUTC(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Add (or subtract) whole days to a YYYY-MM-DD date. */
export function addDays(date: string, days: number): string {
  return new Date(toUTC(date) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUTC(to) - toUTC(from)) / MS_PER_DAY);
}

/** True for a real calendar date written as YYYY-MM-DD. */
export function isoDate(d: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  return new Date(toUTC(d)).toISOString().slice(0, 10) === d;
}
