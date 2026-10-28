import { assessWithAgent } from "./agent";
import { todayIST } from "./dates";
import { getLead, saveLead } from "./db";
import { resolveAssessment } from "./lead-rules";
import type { Lead } from "./types";

/** Re-runs the agent on a lead and its chat, saves the new assessment and returns it. */
export async function reassess(leadId: string): Promise<Lead> {
  const found = await getLead(leadId);
  if (!found) throw new Error(`reassess: unknown lead ${leadId}`);
  const { lead, messages } = found;
  const today = todayIST();
  const result = await assessWithAgent(lead, messages, today);
  const updated = resolveAssessment(lead, result, lead, messages, today, new Date());
  await saveLead(updated);
  return updated;
}
