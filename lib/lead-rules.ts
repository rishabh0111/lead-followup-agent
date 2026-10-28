import { z } from "zod";
import { TAG_RANK } from "./constants";
import { addDays, daysBetween, isoDate, todayIST } from "./dates";
import type { Assessment, Lead, LeadFields, Message, Tag, Urgency } from "./types";

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

const SENT_OFFSET_DAYS: Record<Tag, number> = { Hot: 1, Warm: 3, Cold: 10 };

export function markSent(lead: Lead, draftText: string, now: Date): { lead: Lead; message: Message } | null {
  const text = draftText.trim();
  if (!text) return null;
  const today = todayIST(now);
  const sentAt = now.toISOString();
  return {
    lead: {
      ...lead,
      lastContactDate: today,
      followUpDate: addDays(today, SENT_OFFSET_DAYS[lead.tag]),
      draft: null,
      draftSentAt: sentAt,
    },
    message: { leadId: lead.id, sentAt, sender: "rep", senderName: lead.rep, text },
  };
}

const BUYING_SIGNAL = /\b(quote|quotation|price|rate|pi|proforma|delivery|payment|advance)\b/i;
const MONTH = "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
const NAMED_DATE = new RegExp(
  `\\b\\d{1,2}(?:st|nd|rd|th)?\\s*(?:of\\s+)?${MONTH}\\b|\\b${MONTH}\\.?\\s*\\d{1,2}\\b|\\b\\d{1,2}/\\d{1,2}\\b`,
  "i",
);

const firstName = (full: string) => full.trim().split(/\s+/)[0] ?? full;

function rules(lead: LeadFields, tag: Tag, reason: string): Assessment {
  const draft =
    `Hi ${firstName(lead.name)}, following up on the ${lead.productInterest ?? "packaging machines"} ` +
    `we discussed. Is there a good time to talk this week?\n- ${firstName(lead.rep)}`;
  return { tag, reason, requestedDate: null, draft };
}

export function rulesAssessment(lead: LeadFields, chat: Message[], today: string): Assessment {
  if (chat.length === 0) {
    const days = daysBetween(lead.lastContactDate, today);
    if (days >= 14) return rules(lead, "Cold", `Rules: no contact for ${days} days`);
    if ((lead.source === "IndiaMART" || lead.source === "Cold call") && days >= 8) {
      return rules(lead, "Cold", `Rules: ${days} days since a ${lead.source} enquiry, no chat`);
    }
    return rules(lead, "Warm", `Rules: new ${lead.source} lead, no chat yet`);
  }
  const lastTwo = chat.slice(-2);
  if (lastTwo.length === 2 && lastTwo.every(m => m.sender === "rep")) {
    return rules(lead, "Cold", "Rules: no reply to the last 2 messages");
  }
  const lastBuyer = [...chat].reverse().find(m => m.sender === "buyer");
  if (lastBuyer) {
    const silent = daysBetween(todayIST(new Date(lastBuyer.sentAt)), today);
    if (silent >= 14) return rules(lead, "Cold", `Rules: buyer silent for ${silent} days`);
    if (BUYING_SIGNAL.test(lastBuyer.text)) {
      return rules(lead, "Hot", "Rules: buyer asked about price, delivery or payment");
    }
    if (NAMED_DATE.test(lastBuyer.text)) return rules(lead, "Hot", "Rules: buyer gave a date");
  }
  return rules(lead, "Warm", "Rules: buyer engaged, no buying signal yet");
}

const AgentAnswer = z.object({
  tag: z.enum(["Hot", "Warm", "Cold"]),
  reason: z.string().min(1).max(160),
  requested_date: z.string().refine(isoDate).nullable(),
  draft: z.string().min(1),
});

export function checkAgentResponse(raw: unknown): Assessment | null {
  const r = AgentAnswer.safeParse(raw);
  if (!r.success) return null;
  const { tag, reason, requested_date, draft } = r.data;
  return { tag, reason, requestedDate: requested_date, draft };
}

function pickFields(f: LeadFields): LeadFields {
  return {
    id: f.id, name: f.name, company: f.company, phone: f.phone, source: f.source,
    rep: f.rep, productInterest: f.productInterest, lastContactDate: f.lastContactDate,
  };
}

export function resolveAssessment(
  fields: LeadFields,
  agent: Assessment | null,
  previous: Lead | null,
  chat: Message[],
  today: string,
  now: Date,
): Lead {
  const base = pickFields(fields);
  const assessedAt = now.toISOString();
  if (agent) {
    return {
      ...base, ...agent,
      followUpDate: schedule(agent.tag, agent.requestedDate, today),
      draftSentAt: null, assessedAt, assessedBy: "agent", agentUnavailable: false,
    };
  }
  if (previous) return { ...previous, ...base, agentUnavailable: true, assessedAt };
  const a = rulesAssessment(base, chat, today);
  return {
    ...base, ...a,
    followUpDate: schedule(a.tag, null, today),
    draftSentAt: null, assessedAt, assessedBy: "rules", agentUnavailable: true,
  };
}
