/*
 * Assesses every sample lead once through the live agent and writes data/seed.json.
 * Run: npm run seed                  (all leads, writes the file)
 *      npm run seed -- --only L001,L005   (quick check, writes nothing)
 *      npm run seed -- --only L001 --merge   (re-assess listed IDs, update them in data/seed.json)
 */
import ExcelJS from "exceljs";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { assessWithAgent } from "../lib/agent";
import { parseChat } from "../lib/chat-parser";
import { DATA_DATE } from "../lib/constants";
import { resolveAssessment } from "../lib/lead-rules";
import type { Lead, LeadFields, Message, SeedFile } from "../lib/types";

const WAIT_MS = 4000;

function cellText(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10); // Excel dates are UTC midnight
  if (typeof v === "object") {
    const o = v as { richText?: { text: string }[]; text?: unknown; result?: unknown };
    if (o.richText) return o.richText.map((r) => r.text).join("").trim();
    if (o.text !== undefined) return cellText(o.text);
    if (o.result !== undefined) return cellText(o.result);
  }
  return String(v).trim();
}

async function readLeads(): Promise<LeadFields[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile("data/leads.xlsx");
  const ws = wb.worksheets[0];
  const leads: LeadFields[] = [];
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const c = (i: number) => cellText(row.getCell(i).value);
    if (!c(1)) return;
    leads.push({
      id: c(1), name: c(2), company: c(3), phone: c(4), source: c(5),
      lastContactDate: c(6), rep: c(7), productInterest: c(8) || null,
    });
  });
  return leads.sort((a, b) => a.id.localeCompare(b.id));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const i = process.argv.indexOf("--only");
  const only = i >= 0 ? new Set((process.argv[i + 1] ?? "").split(",").map((s) => s.trim()).filter(Boolean)) : null;
  const all = await readLeads();
  const fields = only ? all.filter((l) => only.has(l.id)) : all;
  const leads: Lead[] = [];
  const messages: Message[] = [];
  for (let k = 0; k < fields.length; k++) {
    const f = fields[k];
    const file = `data/chats/${f.id}.txt`;
    const chat = existsSync(file) ? parseChat(f.id, readFileSync(file, "utf8")) : [];
    if (k > 0) await sleep(WAIT_MS);
    const result = await assessWithAgent(f, chat, f.lastContactDate);
    const lead = resolveAssessment(f, result, null, chat, f.lastContactDate, new Date(`${f.lastContactDate}T12:00:00+05:30`));
    leads.push(lead);
    messages.push(...chat);
    console.log(`${lead.id} ${lead.tag} ${lead.assessedBy} ${lead.followUpDate} ${lead.reason}`);
  }
  const byRules = leads.filter((l) => l.assessedBy === "rules").length;
  console.log(`${leads.length} leads, ${byRules} by rules`);
  if (only && process.argv.includes("--merge")) {
    const file = "data/seed.json";
    const cur: SeedFile = JSON.parse(readFileSync(file, "utf8"));
    cur.leads = cur.leads.map((l) => leads.find((n) => n.id === l.id) ?? l);
    writeFileSync(file, JSON.stringify(cur, null, 2) + "\n");
    console.log("merged into data/seed.json");
    return;
  }
  if (only) {
    console.log("--only: no file written");
    return;
  }
  const seed: SeedFile = { dataDate: DATA_DATE, leads, messages };
  writeFileSync("data/seed.json", JSON.stringify(seed, null, 2) + "\n");
  console.log("wrote data/seed.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
