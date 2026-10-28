import type { Lead, Message, Sender } from "./types";

export function msg(sender: Sender, text: string, sentAt = "2026-10-27T05:00:00Z"): Message {
  return { leadId: "L001", sentAt, sender, senderName: sender === "rep" ? "Amit Verma" : "Buyer", text };
}

export function makeLead(over: Partial<Lead> = {}): Lead {
  return {
    id: "L001", name: "Test Buyer", company: "Test Co", phone: "+91 90000 00000",
    source: "Website form", rep: "Amit Verma", productInterest: null,
    lastContactDate: "2026-10-28", followUpDate: "2026-10-28",
    tag: "Warm", reason: "Test reason", requestedDate: null,
    draft: null, draftSentAt: null,
    assessedAt: "2026-10-28", assessedBy: "agent", agentUnavailable: false,
    ...over,
  };
}
