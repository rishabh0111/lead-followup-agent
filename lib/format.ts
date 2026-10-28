import { daysBetween } from "./dates";

// Calendar dates are formatted through UTC so the server's own timezone can't shift the day.
const dayFormat = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" });
const istTime = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const istDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" });

/** "Wed 28 Oct" for a YYYY-MM-DD date. */
export function formatDay(date: string): string {
  const parts = dayFormat.formatToParts(new Date(date + "T00:00:00Z"));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("weekday")} ${get("day")} ${get("month")}`;
}

export function overdueLabel(days: number): string {
  return days === 1 ? "1 day overdue" : `${days} days overdue`;
}

/** "N days overdue", "Due today", or the formatted Follow-up date. */
export function urgencyLabel(followUpDate: string, today: string): string {
  if (followUpDate < today) return overdueLabel(daysBetween(followUpDate, today));
  if (followUpDate === today) return "Due today";
  return formatDay(followUpDate);
}

/** HH:MM of a message timestamp, in India time. */
export function messageTime(sentAt: string): string {
  return istTime.format(new Date(sentAt));
}

/** YYYY-MM-DD of a message timestamp, in India time. */
export function messageDay(sentAt: string): string {
  return istDate.format(new Date(sentAt));
}

export function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] ?? full;
}
