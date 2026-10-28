"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assessWithAgent } from "@/lib/agent";
import { REPS, SOURCES } from "@/lib/constants";
import { isoDate, nowIST, todayIST } from "@/lib/dates";
import { getLead, insertMessage, nextLeadId, saveLead, updateDraft } from "@/lib/db";
import { markSent, resolveAssessment } from "@/lib/lead-rules";
import { reassess } from "@/lib/leads";
import type { LeadFields, Message } from "@/lib/types";

export type AddLeadState = { error?: string };

// [Rule 2] Length caps: public endpoints, no login. Draft and message text <= 2000, names/company/phone/product <= 120.
const MAX_TEXT = 2000;
const MAX_NAME = 120;

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function refresh(id: string) {
  revalidatePath("/");
  revalidatePath(`/leads/${id}`);
}

export async function saveDraftAction(fd: FormData): Promise<void> {
  const id = str(fd, "id");
  const draft = str(fd, "draft");
  if (!id || !draft || draft.length > MAX_TEXT) return;
  if (!(await getLead(id))) return;
  await updateDraft(id, draft);
  refresh(id);
}

export async function markSentAction(fd: FormData): Promise<void> {
  const id = str(fd, "id");
  const draft = str(fd, "draft");
  if (!id || draft.length > MAX_TEXT) return;
  const found = await getLead(id);
  if (!found || found.lead.draft === null) return;
  const sent = markSent(found.lead, draft, new Date());
  if (!sent) return;
  // Lead first: if the message insert fails, the draft is already null and a retry is a no-op.
  await saveLead(sent.lead);
  await insertMessage(sent.message);
  refresh(id);
}

export async function addMessageAction(fd: FormData): Promise<void> {
  const id = str(fd, "id");
  const sender = str(fd, "sender");
  const text = str(fd, "text");
  if (!id || !text || text.length > MAX_TEXT) return;
  if (sender !== "rep" && sender !== "buyer") return;
  const found = await getLead(id);
  if (!found) return;
  const { lead } = found;
  const now = new Date();
  try {
    await saveLead({ ...lead, lastContactDate: todayIST(now) });
    await insertMessage({
      leadId: id,
      sentAt: nowIST(now),
      sender,
      senderName: sender === "rep" ? lead.rep : lead.name,
      text,
    });
    await reassess(id);
  } finally {
    refresh(id);
  }
}

export async function addLeadAction(_prev: AddLeadState, fd: FormData): Promise<AddLeadState> {
  const name = str(fd, "name");
  const company = str(fd, "company");
  const phone = str(fd, "phone");
  const source = str(fd, "source");
  const rep = str(fd, "rep");
  const productInterest = str(fd, "productInterest");
  const firstMessage = str(fd, "firstMessage");
  const now = new Date();
  const today = todayIST(now);
  const lastContactDate = str(fd, "lastContactDate") || today;

  if (!name || !company || !phone) return { error: "Name, company and phone are required." };
  if (name.length > MAX_NAME || company.length > MAX_NAME || phone.length > MAX_NAME || productInterest.length > MAX_NAME)
    return { error: `Name, company, phone and product interest must be ${MAX_NAME} characters or fewer.` };
  if (!(SOURCES as readonly string[]).includes(source)) return { error: "Choose a valid source." };
  if (!(REPS as readonly string[]).includes(rep)) return { error: "Choose a valid rep." };
  if (!isoDate(lastContactDate)) return { error: "Last contact date is not a valid date." };
  if (lastContactDate > today) return { error: "Last contact date cannot be in the future." };
  if (firstMessage.length > MAX_TEXT) return { error: `First message must be ${MAX_TEXT} characters or fewer.` };

  const id = await nextLeadId();
  const fields: LeadFields = {
    id, name, company, phone, source, rep,
    productInterest: productInterest || null,
    lastContactDate,
  };
  const chat: Message[] = firstMessage
    ? [{ leadId: id, sentAt: nowIST(now), sender: "buyer", senderName: name, text: firstMessage }]
    : [];
  const agent = await assessWithAgent(fields, chat, today);
  const lead = resolveAssessment(fields, agent, null, chat, today, now);
  await saveLead(lead);
  for (const m of chat) await insertMessage(m);
  refresh(id);
  redirect(`/leads/${id}`);
}
