import { neon } from "@neondatabase/serverless";
import type { Lead, Message } from "./types";

const sql = neon(process.env.DATABASE_URL!);

// Dates come back as YYYY-MM-DD text, timestamps as IST strings with +05:30,
// so nothing passes through a JS Date.
const ts = (col: string) =>
  `to_char(${col} at time zone 'Asia/Kolkata', 'YYYY-MM-DD"T"HH24:MI:SS"+05:30"')`;

const LEAD_COLS = `id, name, company, phone, source, rep, product_interest,
  last_contact_date::text as last_contact_date,
  follow_up_date::text as follow_up_date,
  tag, reason,
  requested_date::text as requested_date,
  draft,
  ${ts("draft_sent_at")} as draft_sent_at,
  ${ts("assessed_at")} as assessed_at,
  assessed_by, agent_unavailable`;

const MESSAGE_COLS = `id, lead_id, ${ts("sent_at")} as sent_at, sender, sender_name, text`;

/* eslint-disable @typescript-eslint/no-explicit-any */
function toLead(r: any): Lead {
  return {
    id: r.id, name: r.name, company: r.company, phone: r.phone, source: r.source, rep: r.rep,
    productInterest: r.product_interest,
    lastContactDate: r.last_contact_date, followUpDate: r.follow_up_date,
    tag: r.tag, reason: r.reason, requestedDate: r.requested_date,
    draft: r.draft, draftSentAt: r.draft_sent_at,
    assessedAt: r.assessed_at, assessedBy: r.assessed_by, agentUnavailable: r.agent_unavailable,
  };
}

function toMessage(r: any): Message {
  return { id: r.id, leadId: r.lead_id, sentAt: r.sent_at, sender: r.sender, senderName: r.sender_name, text: r.text };
}

export async function getLeads(rep?: string): Promise<Lead[]> {
  const rows = rep
    ? await sql.query(`select ${LEAD_COLS} from leads where rep = $1`, [rep])
    : await sql.query(`select ${LEAD_COLS} from leads`);
  return rows.map(toLead);
}

export async function getLead(id: string): Promise<{ lead: Lead; messages: Message[] } | null> {
  const leads = await sql.query(`select ${LEAD_COLS} from leads where id = $1`, [id]);
  if (leads.length === 0) return null;
  const msgs = await sql.query(`select ${MESSAGE_COLS} from messages where lead_id = $1 order by sent_at, id`, [id]);
  return { lead: toLead(leads[0]), messages: msgs.map(toMessage) };
}

export async function saveLead(l: Lead): Promise<void> {
  await sql`
    insert into leads (id, name, company, phone, source, rep, product_interest,
      last_contact_date, follow_up_date, tag, reason, requested_date, draft,
      draft_sent_at, assessed_at, assessed_by, agent_unavailable)
    values (${l.id}, ${l.name}, ${l.company}, ${l.phone}, ${l.source}, ${l.rep}, ${l.productInterest},
      ${l.lastContactDate}, ${l.followUpDate}, ${l.tag}, ${l.reason}, ${l.requestedDate}, ${l.draft},
      ${l.draftSentAt}, ${l.assessedAt}, ${l.assessedBy}, ${l.agentUnavailable})
    on conflict (id) do update set
      name = excluded.name, company = excluded.company, phone = excluded.phone,
      source = excluded.source, rep = excluded.rep, product_interest = excluded.product_interest,
      last_contact_date = excluded.last_contact_date, follow_up_date = excluded.follow_up_date,
      tag = excluded.tag, reason = excluded.reason, requested_date = excluded.requested_date,
      draft = excluded.draft, draft_sent_at = excluded.draft_sent_at,
      assessed_at = excluded.assessed_at, assessed_by = excluded.assessed_by,
      agent_unavailable = excluded.agent_unavailable`;
}

// Insert only: returns false when the id is already taken, so a racing add never overwrites.
export async function insertLead(l: Lead): Promise<boolean> {
  const rows = await sql`
    insert into leads (id, name, company, phone, source, rep, product_interest,
      last_contact_date, follow_up_date, tag, reason, requested_date, draft,
      draft_sent_at, assessed_at, assessed_by, agent_unavailable)
    values (${l.id}, ${l.name}, ${l.company}, ${l.phone}, ${l.source}, ${l.rep}, ${l.productInterest},
      ${l.lastContactDate}, ${l.followUpDate}, ${l.tag}, ${l.reason}, ${l.requestedDate}, ${l.draft},
      ${l.draftSentAt}, ${l.assessedAt}, ${l.assessedBy}, ${l.agentUnavailable})
    on conflict (id) do nothing
    returning id`;
  return rows.length > 0;
}

export async function countLeads(): Promise<number> {
  const rows = await sql`select count(*)::int as n from leads`;
  return Number(rows[0].n);
}

export async function countMessages(leadId: string): Promise<number> {
  const rows = await sql`select count(*)::int as n from messages where lead_id = ${leadId}`;
  return Number(rows[0].n);
}

export async function insertMessage(m: Message): Promise<void> {
  await sql`
    insert into messages (lead_id, sent_at, sender, sender_name, text)
    values (${m.leadId}, ${m.sentAt}, ${m.sender}, ${m.senderName}, ${m.text})`;
}

export async function updateDraft(id: string, draft: string): Promise<void> {
  await sql`update leads set draft = ${draft} where id = ${id}`;
}

export async function nextLeadId(): Promise<string> {
  const rows = await sql`
    select coalesce(max(substring(id from 2)::int), 0) as n from leads where id ~ '^L\\d+$'`;
  return "L" + String(Number(rows[0].n) + 1).padStart(3, "0");
}
