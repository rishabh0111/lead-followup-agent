import { TAG_RANK } from "./constants";
import { addDays } from "./dates";
import type { Lead, Tag, Urgency } from "./types";

const OFFSET_DAYS: Record<Tag, number> = { Hot: 0, Warm: 3, Cold: 10 };

export function schedule(tag: Tag, requestedDate: string | null, today: string): string {
  const date = requestedDate ?? addDays(today, OFFSET_DAYS[tag]);
  return date < today ? today : date;
}

export function classify(lead: Pick<Lead, "followUpDate">, today: string): Urgency {
  if (lead.followUpDate < today) return "overdue";
  if (lead.followUpDate === today) return "today";
  return "later";
}

const cmp = (a: string | number, b: string | number) => (a < b ? -1 : a > b ? 1 : 0);

export function order(leads: Lead[], today: string): { today: Lead[]; later: Lead[] } {
  const overdue: Lead[] = [];
  const due: Lead[] = [];
  const later: Lead[] = [];
  for (const lead of leads) {
    const u = classify(lead, today);
    (u === "overdue" ? overdue : u === "today" ? due : later).push(lead);
  }
  // Earlier follow-up date means more days overdue.
  overdue.sort((a, b) =>
    cmp(TAG_RANK[a.tag], TAG_RANK[b.tag]) || cmp(a.followUpDate, b.followUpDate) || cmp(a.id, b.id));
  due.sort((a, b) =>
    cmp(TAG_RANK[a.tag], TAG_RANK[b.tag]) || cmp(a.lastContactDate, b.lastContactDate) || cmp(a.id, b.id));
  later.sort((a, b) => cmp(a.followUpDate, b.followUpDate) || cmp(a.id, b.id));
  return { today: [...overdue, ...due], later };
}
