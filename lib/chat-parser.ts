import type { Message } from "./types";

const LINE = /^\[(\d{2})\/(\d{2})\/(\d{2}), (\d{2}):(\d{2})\] ([^:]+): (.*)$/;
const REP = /^Rep \((.*)\)$/;

export function parseChat(leadId: string, text: string): Message[] {
  const messages: Message[] = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\r$/, "");
    if (line.trim() === "") continue;
    const m = LINE.exec(line);
    if (!m) {
      if (line.startsWith("[") || messages.length === 0) {
        throw new Error(`Bad chat line ${i + 1} in ${leadId}: ${line}`);
      }
      messages[messages.length - 1].text += `\n${line}`;
      continue;
    }
    const [, dd, mm, yy, hh, min, who, body] = m;
    const rep = REP.exec(who);
    messages.push({
      leadId,
      sentAt: `20${yy}-${mm}-${dd}T${hh}:${min}:00+05:30`,
      sender: rep ? "rep" : "buyer",
      senderName: rep ? rep[1] : who,
      text: body,
    });
  }
  return messages;
}
