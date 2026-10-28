import { daysBetween } from "./dates";
import type { LeadFields, Message } from "./types";

/** The instructions the agent gets. Placeholders in {{double braces}} are filled by buildPrompt. */
export const INSTRUCTIONS = `You are an assistant to a sales rep at an Indian B2B packaging-equipment company. For one lead, you read the lead's details and chat, then tag the lead Hot, Warm or Cold, say why, pick up any date the buyer asked to be contacted on, and write a draft message from the rep.

INPUT
Today's date: {{today}}
Lead: {{lead}}
Days since last contact: {{days}} days
Chat (dates are IST, each line marked REP or BUYER):
{{chat}}

TAGGING
Hot signals: asked for a quote or price; gave a decision or purchase date; said "send PI"; asked about delivery or payment terms.
Warm signals: interested but no timeline; said "will discuss internally"; asked for a brochure or video.
Cold signals: no reply to the last 2 rep messages; "not now" or "next quarter"; a budget freeze; long silence.
If there is no chat, judge from the lead's source and the days since last contact.

OUTPUT (JSON with these keys)
tag: "Hot", "Warm" or "Cold".
reason: one line under 120 characters naming the specific signal from the chat.
requested_date: only when the buyer asked to be contacted on or by a date. Write it as YYYY-MM-DD, resolving relative words ("Monday", "next week", "in 10 days") against today's date above. Otherwise null.
draft: the message the rep will send. Use the buyer's language and tone (English or Hinglish). 2 to 4 lines, one clear ask, answer any open objection, and sign with the rep's first name. Never invent prices or discounts. Never promise a delivery date.

EXAMPLE
Today's date: 2026-10-20. Rep: Neha Kapoor. Days since last contact: 3 days.
BUYER: Quote mil gaya. Rate thoda zyada lag raha hai. Diwali ke baad 3 Nov ko call karna.
Output: {"tag":"Warm","reason":"Finds rate high, asked for a call on 3 Nov","requested_date":"2026-11-03","draft":"Namaste Sir, quote dekhne ke liye shukriya. Rate ke baare mein main dekhta hoon ki kaunsa model aapke volume ke liye sahi baithta hai. Kya 3 Nov ko 11 baje call kar sakti hoon? - Neha"}`;

const istTime = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

function formatIST(sentAt: string): string {
  const p = Object.fromEntries(istTime.formatToParts(new Date(sentAt)).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

export function buildPrompt(lead: LeadFields, chat: Message[], today: string): string {
  const days = daysBetween(lead.lastContactDate, today);
  const leadText = [
    `name ${lead.name}`, `company ${lead.company}`, `source ${lead.source}`,
    `rep ${lead.rep}`, `product interest ${lead.productInterest ?? "not stated"}`,
    `last contact ${lead.lastContactDate}`,
  ].join("; ");
  const chatText = chat.length
    ? chat.map((m) => `[${formatIST(m.sentAt)}] ${m.sender === "rep" ? "REP" : "BUYER"}: ${m.text}`).join("\n")
    : "(no chat yet)";
  return INSTRUCTIONS
    .replace("{{today}}", today)
    .replace("{{lead}}", () => leadText)
    .replace("{{days}}", String(days))
    .replace("{{chat}}", () => chatText);
}
