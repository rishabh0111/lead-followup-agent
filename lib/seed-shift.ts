import { addDays } from "./dates";
import type { SeedFile } from "./types";

// Move the leading YYYY-MM-DD of a date or timestamp; keep the rest as is.
function shift(value: string, days: number): string {
  return addDays(value.slice(0, 10), days) + value.slice(10);
}

function shiftOrNull(value: string | null, days: number): string | null {
  return value === null ? null : shift(value, days);
}

/** Return a copy of the seed with every date moved by `days`. Pure. */
export function shiftSeed(seed: SeedFile, days: number): SeedFile {
  return {
    dataDate: shift(seed.dataDate, days),
    leads: seed.leads.map((l) => ({
      ...l,
      lastContactDate: shift(l.lastContactDate, days),
      followUpDate: shift(l.followUpDate, days),
      requestedDate: shiftOrNull(l.requestedDate, days),
      assessedAt: shift(l.assessedAt, days),
      draftSentAt: shiftOrNull(l.draftSentAt, days),
    })),
    messages: seed.messages.map((m) => ({ ...m, sentAt: shift(m.sentAt, days) })),
  };
}
