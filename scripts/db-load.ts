import { readFileSync } from "node:fs";
import { daysBetween, todayIST } from "../lib/dates";
import { shiftSeed } from "../lib/seed-shift";
import type { SeedFile } from "../lib/types";

async function main() {
  // Import after env is loaded so lib/db reads DATABASE_URL.
  const { neon } = await import("@neondatabase/serverless");
  const { saveLead, insertMessage } = await import("../lib/db");
  const sql = neon(process.env.DATABASE_URL!);

  const schema = readFileSync("db/schema.sql", "utf8");
  for (const stmt of schema.split(";")) {
    const text = stmt
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n")
      .trim();
    if (text) await sql.query(text);
  }

  const raw: SeedFile = JSON.parse(readFileSync("data/seed.json", "utf8"));
  const days = daysBetween(raw.dataDate, todayIST());
  const seed = shiftSeed(raw, days);

  for (const lead of seed.leads) await saveLead(lead);
  for (const m of seed.messages) await insertMessage(m);

  const sign = days >= 0 ? "+" : "";
  console.log(`Loaded ${seed.leads.length} leads, ${seed.messages.length} messages, shifted ${sign}${days} days`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
