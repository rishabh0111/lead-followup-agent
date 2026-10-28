export type Tag = "Hot" | "Warm" | "Cold";
export type Sender = "rep" | "buyer";
export interface Message { id?: number; leadId: string; sentAt: string; sender: Sender; senderName: string; text: string }
export interface LeadFields { id: string; name: string; company: string; phone: string; source: string; rep: string; productInterest: string | null; lastContactDate: string }
export interface Assessment { tag: Tag; reason: string; requestedDate: string | null; draft: string }
export interface Lead extends LeadFields {
  followUpDate: string; tag: Tag; reason: string; requestedDate: string | null;
  draft: string | null; draftSentAt: string | null;
  assessedAt: string; assessedBy: "agent" | "rules"; agentUnavailable: boolean;
}
export type Urgency = "overdue" | "today" | "later";
export interface SeedFile { dataDate: string; leads: Lead[]; messages: Message[] }
