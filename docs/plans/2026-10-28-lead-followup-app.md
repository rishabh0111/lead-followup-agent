# Lead Follow-up App Implementation Plan

> **For agentic workers:** this plan runs task by task under `/sf-execute` (inline or subagent-driven mode). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a one-page Next.js app where an agent tags each lead Hot, Warm or Cold with a reason, schedules its follow-up date and writes a draft, and reps see today's leads first, edit and send drafts, and add messages and leads.

**Architecture:** All decisions live in one pure module, `lib/lead-rules.ts` (scheduling, ordering, mark sent, rules fallback, checking the model's answer). The agent (`lib/agent.ts`) calls Gemini and returns an assessment or `null`; `lib/leads.ts` combines agent, rules and database for the writes. Pages are Server Components that read from Neon directly; writes are Server Actions in `app/actions.ts` (these are the spec's "server routes"). Sample data is assessed once by a local seed script and loaded with a date shift.

**Tech Stack:** Node 24, Next.js 16.4 (App Router, TypeScript), React 19.3, Neon Postgres via `@neondatabase/serverless` 1.2, Gemini via `@google/genai` 2.31, `zod` 4 for checking model output, `exceljs` 4.4 for the sheet, Vitest 5, `tsx` for scripts.

**Spec:** GitHub issue #1, https://github.com/rishabh0111/lead-followup-agent/issues/1. Also `docs/DECISIONS.md` and `GLOSSARY.md`.

## Global Constraints

- Vocabulary follows `GLOSSARY.md`: Lead, Rep, Buyer, Source, Chat, Message, Draft, Tag, Reason, Requested date, Follow-up date, Overdue, Due today, Today list. Never "follow-up" alone in UI copy or code names.
- Dates are `YYYY-MM-DD` strings; "today" is always computed in `Asia/Kolkata`, never from the server clock's date. Message times are ISO 8601 strings with offset.
- Follow-up date from an assessment: requested date if present, else Hot +0, Warm +3, Cold +10 days; never earlier than today.
- Follow-up date on mark sent: Hot +1, Warm +3, Cold +10 days from today.
- Draft: buyer's language and tone (English or Hinglish), 2 to 4 lines, one clear ask, answers any open objection, signed with the rep's first name.
- Rules-assessment reasons start with `Rules: `.
- The agent runs at seed time and live only on add message / add lead. Never on page load, never on save draft or mark sent.
- Model name is one constant, `MODEL` in `lib/constants.ts`, default `gemini-3.5-flash-lite`. `GEMINI_API_KEY` and `DATABASE_URL` come only from env (`.env.local`, git-ignored; Vercel env vars).
- No login, no real WhatsApp sending, no payments, no reset button, no lead deletion or field editing, no multi-line chat paste.
- Commits follow Conventional Commits; no Claude co-author trailer.

## Review Focus

1. **Server runs in UTC near midnight IST.** At 19:00 UTC on 28 Oct it is already 29 Oct in India; the Today list must use 29 Oct. Pinned in Task 1 (`todayIST` test).
2. **Model returns a requested date in the past or a malformed date.** A past date must clamp to today; a malformed date or unknown tag must count as a model failure, not crash. Pinned in Task 2 (`schedule` clamp) and Task 3 (`checkAgentResponse`).
3. **Rep double-clicks Mark as sent, or empties the draft and sends.** The second send must not append an empty message or move the date again. Pinned in Task 3 (`markSent` returns `null` for blank text); guarded in Task 9 (the action ignores a lead whose draft is already null) and checked in Task 10 Step 3.
4. **New lead with no first message while Gemini is down.** It must still be tagged and scheduled by rules, from source and days since last contact. Pinned in Task 3 (`resolveAssessment` with no previous and no chat).
5. **`db:load` run days after the data date.** Every date moves by the same number of days, including requested dates and message times; null requested dates stay null. Pinned in Task 8 (`shiftSeed` test).

---

## Seed timing (decision made while planning; confirm at review)

The spec assesses at seed time, and `schedule` never returns a date before "today". If the seed assessed every lead as of the data date, no lead would ever be overdue on load day, which breaks user stories 2 and 27. So the seed assesses **each lead as of its own last contact date**, as if the agent had run when that last message happened. A Hot lead last contacted 3 days ago is then 3 days overdue on load day. Task 7 implements this; Task 5 spreads last contact dates so the load-day Today list has 3 to 6 overdue and 3 to 6 due-today leads.

---

### Task 1: Scaffold, Vitest and dates

**Files:**
- Create: `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `next-env.d.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `public/` (from create-next-app)
- Create: `vitest.config.ts`, `.env.example`
- Modify: `.gitignore` (create-next-app's; keep `.env*` ignored but add `!.env.example`)
- Create: `lib/dates.ts`
- Test: `lib/dates.test.ts`

**Interfaces:**
- Produces: `todayIST(now?: Date): string`, `addDays(date: string, days: number): string`, `daysBetween(from: string, to: string): number` (to − from, in whole days), `isoDate(d: string): boolean` (valid `YYYY-MM-DD` calendar date).

- [ ] **Step 1: Scaffold into a temp folder and move it in** (the repo already has `README.md`, `CLAUDE.md`, `GLOSSARY.md`, `docs/`, which create-next-app refuses to overwrite)

Run: `npx create-next-app@16.4.3 .tmp-app --ts --app --eslint --no-tailwind --no-src-dir --import-alias "@/*" --use-npm --yes`
Then move everything except `.tmp-app/README.md` and `.tmp-app/.git` into the repo root and delete `.tmp-app`.
Expected: `npm run build` succeeds.

- [ ] **Step 2: Add test and script tooling**

Run: `npm i @neondatabase/serverless@1.2.0 @google/genai@2.31.0 zod@4 && npm i -D vitest@5 tsx@4 exceljs@4.4.0`
Add scripts to `package.json`: `"test": "vitest run"`, `"seed": "tsx --env-file=.env.local scripts/seed.ts"`, `"db:load": "tsx --env-file=.env.local scripts/db-load.ts"`.
`vitest.config.ts`: node environment, `resolve.alias` `@` → repo root.
`.env.example`: `DATABASE_URL=` and `GEMINI_API_KEY=` with one comment line each.

- [ ] **Step 3: Write the failing tests**

```ts
// lib/dates.test.ts
test("todayIST uses India time, not UTC", () => {
  expect(todayIST(new Date("2026-10-28T19:00:00Z"))).toBe("2026-10-29");
  expect(todayIST(new Date("2026-10-28T18:00:00Z"))).toBe("2026-10-28");
});
test("addDays crosses month ends", () => {
  expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
  expect(addDays("2026-11-02", -3)).toBe("2026-10-30");
});
test("daysBetween counts whole days, negative when to is earlier", () => {
  expect(daysBetween("2026-10-25", "2026-10-28")).toBe(3);
  expect(daysBetween("2026-10-28", "2026-10-25")).toBe(-3);
});
test("isoDate accepts real calendar dates only", () => {
  expect(isoDate("2026-10-28")).toBe(true);
  expect(isoDate("2026-02-30")).toBe(false);
  expect(isoDate("28/10/2026")).toBe(false);
});
```

- [ ] **Step 4: Run and see them fail** — Run: `npm test` — Expected: FAIL, `lib/dates` not found.

- [ ] **Step 5: Implement `lib/dates.ts`**

`todayIST` uses `Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" })`. `addDays` and `daysBetween` do arithmetic on UTC midnights (`Date.UTC`) so no local timezone leaks in.

- [ ] **Step 6: Run and see them pass** — Run: `npm test` — Expected: 4 passed.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "build: scaffold next app with vitest and date helpers"
```

---

### Task 2: Lead types, constants, schedule, classify and order

**Files:**
- Create: `lib/types.ts`, `lib/constants.ts`, `lib/lead-rules.ts`
- Test: `lib/lead-rules.test.ts`, `lib/test-helpers.ts`

**Interfaces:**
- Consumes: `addDays`, `daysBetween` from Task 1.
- Produces, in `lib/types.ts`:

```ts
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
```

- Produces, in `lib/constants.ts`: `REPS` (5 full names: `Amit Verma`, `Neha Kapoor`, `Rahul Mehta`, `Sana Sheikh`, `Vikram Rao`), `SOURCES` (`IndiaMART`, `Trade show`, `Website form`, `Referral`, `Cold call`, `WhatsApp`), `DATA_DATE = "2026-10-28"`, `MODEL = "gemini-3.5-flash-lite"`, `TAG_RANK: Record<Tag, number>` (Hot 0, Warm 1, Cold 2).
- Produces, in `lib/lead-rules.ts`: `schedule(tag: Tag, requestedDate: string | null, today: string): string`, `classify(lead: Pick<Lead, "followUpDate">, today: string): Urgency`, `order(leads: Lead[], today: string): { today: Lead[]; later: Lead[] }`.
- Produces, in `lib/test-helpers.ts`: `makeLead(over?: Partial<Lead>): Lead` with sensible defaults (id `L001`, tag `Warm`, dates `2026-10-28`, `assessedBy: "agent"`, `agentUnavailable: false`).

- [ ] **Step 1: Write the failing tests**

```ts
const T = "2026-10-28";
test("schedule uses the requested date when there is one", () => {
  expect(schedule("Cold", "2026-11-05", T)).toBe("2026-11-05");
});
test("schedule offsets by tag", () => {
  expect(schedule("Hot", null, T)).toBe("2026-10-28");
  expect(schedule("Warm", null, T)).toBe("2026-10-31");
  expect(schedule("Cold", null, T)).toBe("2026-11-07");
});
test("schedule never returns a date before today", () => {
  expect(schedule("Warm", "2026-10-20", T)).toBe(T);
});
test("classify splits at today", () => {
  expect(classify({ followUpDate: "2026-10-27" }, T)).toBe("overdue");
  expect(classify({ followUpDate: T }, T)).toBe("today");
  expect(classify({ followUpDate: "2026-10-29" }, T)).toBe("later");
});
test("order puts overdue first, by tag then most days overdue", () => {
  const coldLate = makeLead({ id: "A", tag: "Cold", followUpDate: "2026-10-19" });
  const hotLate = makeLead({ id: "B", tag: "Hot", followUpDate: "2026-10-27" });
  const hotLater = makeLead({ id: "C", tag: "Hot", followUpDate: "2026-10-24" });
  const dueWarm = makeLead({ id: "D", tag: "Warm", followUpDate: T });
  expect(order([dueWarm, coldLate, hotLate, hotLater], T).today.map(l => l.id)).toEqual(["C", "B", "A", "D"]);
});
test("due today orders by tag then oldest last contact", () => {
  const a = makeLead({ id: "A", tag: "Warm", followUpDate: T, lastContactDate: "2026-10-20" });
  const b = makeLead({ id: "B", tag: "Warm", followUpDate: T, lastContactDate: "2026-10-10" });
  const c = makeLead({ id: "C", tag: "Hot", followUpDate: T, lastContactDate: "2026-10-27" });
  expect(order([a, b, c], T).today.map(l => l.id)).toEqual(["C", "B", "A"]);
});
test("later list is ordered by follow-up date", () => {
  const a = makeLead({ id: "A", followUpDate: "2026-11-05" });
  const b = makeLead({ id: "B", followUpDate: "2026-10-30" });
  const r = order([a, b], T);
  expect(r.today).toEqual([]);
  expect(r.later.map(l => l.id)).toEqual(["B", "A"]);
});
```

- [ ] **Step 2: Run and see them fail** — Run: `npm test -- lib/lead-rules.test.ts` — Expected: FAIL, exports missing.

- [ ] **Step 3: Implement the types, constants and the three functions**

`order` sorts with one comparator per group; ties after the listed keys fall back to `id` so output is stable.

- [ ] **Step 4: Run and see them pass** — Run: `npm test` — Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add lib/types.ts lib/constants.ts lib/lead-rules.ts lib/lead-rules.test.ts lib/test-helpers.ts
git commit -m "feat: add lead scheduling and urgency order rules"
```

---

### Task 3: Mark sent, rules assessment, checking the model, resolving an assessment

**Files:**
- Modify: `lib/lead-rules.ts`, `lib/test-helpers.ts`
- Test: `lib/lead-rules.test.ts`

**Interfaces:**
- Consumes: Task 1 dates, Task 2 types, `schedule`, `REPS`.
- Produces:
  - `markSent(lead: Lead, draftText: string, now: Date): { lead: Lead; message: Message } | null` — `null` when `draftText.trim()` is empty. The message is `{ leadId, sentAt: now.toISOString(), sender: "rep", senderName: lead.rep, text: draftText.trim() }`. The lead gets `lastContactDate = todayIST(now)`, `followUpDate = addDays(today, {Hot: 1, Warm: 3, Cold: 10}[tag])`, `draft = null`, `draftSentAt = now.toISOString()`.
  - `rulesAssessment(lead: LeadFields, chat: Message[], today: string): Assessment`
  - `checkAgentResponse(raw: unknown): Assessment | null` — zod schema `{ tag: enum Hot|Warm|Cold, reason: non-empty string ≤ 160 chars, requested_date: isoDate string or null, draft: non-empty string }`, mapped to camelCase. Any mismatch → `null`.
  - `resolveAssessment(fields: LeadFields, agent: Assessment | null, previous: Lead | null, chat: Message[], today: string, now: Date): Lead`:
    - agent result → lead from `fields` + agent, `followUpDate = schedule(...)`, `assessedBy "agent"`, `agentUnavailable false`, `draftSentAt null`.
    - no agent, previous exists → `{ ...previous, ...fields, agentUnavailable: true }` (keeps previous tag, reason, draft and follow-up date; takes the new last contact date).
    - no agent, no previous → rules assessment, `assessedBy "rules"`, `agentUnavailable true`.
    - `assessedAt = now.toISOString()` in every case.

Rules assessment, in this order (first match wins):

| Situation | Tag | Reason |
|---|---|---|
| No messages, days since last contact ≥ 14 | Cold | `Rules: no contact for N days` |
| No messages, source `IndiaMART` or `Cold call`, days ≥ 8 | Cold | `Rules: N days since a <source> enquiry, no chat` |
| No messages, otherwise | Warm | `Rules: new <source> lead, no chat yet` |
| Last two messages both from the rep | Cold | `Rules: no reply to the last 2 messages` |
| Last buyer message ≥ 14 days before today | Cold | `Rules: buyer silent for N days` |
| Last buyer message matches `/\b(quote|quotation|price|rate|pi|proforma|delivery|payment|advance)\b/i` | Hot | `Rules: buyer asked about price, delivery or payment` |
| Otherwise | Warm | `Rules: buyer engaged, no buying signal yet` |

Template draft (exact copy): `Hi <buyer first name>, following up on the <product interest, or "packaging machines"> we discussed. Is there a good time to talk this week?\n- <rep first name>`. `requestedDate` is always `null`.

- [ ] **Step 1: Write the failing tests**

```ts
const NOW = new Date("2026-10-28T06:00:00Z"); // 11:30 IST
test("markSent appends the draft as a rep message and moves the date", () => {
  const r = markSent(makeLead({ tag: "Hot", followUpDate: "2026-10-26", draft: "old" }), "  Sending the PI now.  ", NOW)!;
  expect(r.message).toMatchObject({ sender: "rep", text: "Sending the PI now.", leadId: "L001" });
  expect(r.lead).toMatchObject({ lastContactDate: "2026-10-28", followUpDate: "2026-10-29", draft: null });
  expect(classify(r.lead, "2026-10-28")).toBe("later");
});
test("markSent offsets Warm +3 and Cold +10", () => {
  expect(markSent(makeLead({ tag: "Warm" }), "x", NOW)!.lead.followUpDate).toBe("2026-10-31");
  expect(markSent(makeLead({ tag: "Cold" }), "x", NOW)!.lead.followUpDate).toBe("2026-11-07");
});
test("markSent refuses a blank draft", () => {
  expect(markSent(makeLead(), "   ", NOW)).toBeNull();
});
test("rules: buyer price question is Hot", () => {
  const chat = [msg("rep", "Sharing brochure"), msg("buyer", "Bhai rate kya hai 2 machines ka?")];
  expect(rulesAssessment(makeLead(), chat, "2026-10-28")).toMatchObject({ tag: "Hot", requestedDate: null });
});
test("rules: two unanswered rep messages is Cold even after a price question", () => {
  const chat = [msg("buyer", "Send quote"), msg("rep", "Sent"), msg("rep", "Any update?")];
  expect(rulesAssessment(makeLead(), chat, "2026-10-28").tag).toBe("Cold");
});
test("rules: buyer silent 14 days is Cold", () => {
  const chat = [msg("buyer", "Will check", "2026-10-14T05:00:00Z"), msg("rep", "Ok")];
  expect(rulesAssessment(makeLead(), chat, "2026-10-28").reason).toBe("Rules: buyer silent for 14 days");
});
test("rules: no chat goes by source and age", () => {
  expect(rulesAssessment(makeLead({ source: "Referral", lastContactDate: "2026-10-25" }), [], "2026-10-28").tag).toBe("Warm");
  expect(rulesAssessment(makeLead({ source: "IndiaMART", lastContactDate: "2026-10-18" }), [], "2026-10-28").tag).toBe("Cold");
  expect(rulesAssessment(makeLead({ source: "Referral", lastContactDate: "2026-10-01" }), [], "2026-10-28").tag).toBe("Cold");
});
test("rules reasons start with 'Rules: ' and the draft is signed by the rep", () => {
  const a = rulesAssessment(makeLead({ name: "Priya Nair", rep: "Amit Verma", productInterest: "carton sealer" }), [], "2026-10-28");
  expect(a.reason.startsWith("Rules: ")).toBe(true);
  expect(a.draft).toBe("Hi Priya, following up on the carton sealer we discussed. Is there a good time to talk this week?\n- Amit");
});
test("checkAgentResponse accepts a valid answer", () => {
  expect(checkAgentResponse({ tag: "Hot", reason: "Asked for PI", requested_date: null, draft: "Hi" }))
    .toEqual({ tag: "Hot", reason: "Asked for PI", requestedDate: null, draft: "Hi" });
});
test("checkAgentResponse rejects bad tags, dates and missing fields", () => {
  expect(checkAgentResponse({ tag: "Hot!", reason: "r", requested_date: null, draft: "d" })).toBeNull();
  expect(checkAgentResponse({ tag: "Hot", reason: "r", requested_date: "next Monday", draft: "d" })).toBeNull();
  expect(checkAgentResponse({ tag: "Hot", reason: "r", requested_date: null })).toBeNull();
  expect(checkAgentResponse("not json")).toBeNull();
});
test("resolveAssessment schedules an agent result, clamping a past requested date", () => {
  const l = resolveAssessment(makeLead(), { tag: "Warm", reason: "r", requestedDate: "2026-10-01", draft: "d" }, null, [], "2026-10-28", NOW);
  expect(l).toMatchObject({ followUpDate: "2026-10-28", assessedBy: "agent", agentUnavailable: false });
});
test("resolveAssessment keeps the previous result when the agent fails", () => {
  const prev = makeLead({ tag: "Hot", reason: "Asked for PI", draft: "d", followUpDate: "2026-10-28", lastContactDate: "2026-10-20" });
  const l = resolveAssessment({ ...prev, lastContactDate: "2026-10-28" }, null, prev, [], "2026-10-28", NOW);
  expect(l).toMatchObject({ tag: "Hot", reason: "Asked for PI", lastContactDate: "2026-10-28", agentUnavailable: true });
});
test("resolveAssessment falls back to rules for a new lead when the agent fails", () => {
  const l = resolveAssessment(makeLead({ source: "Referral" }), null, null, [], "2026-10-28", NOW);
  expect(l).toMatchObject({ assessedBy: "rules", agentUnavailable: true, tag: "Warm" });
  expect(l.followUpDate).toBe("2026-10-31");
});
```

`msg(sender, text, sentAt = "2026-10-27T05:00:00Z")` goes in `lib/test-helpers.ts`.

- [ ] **Step 2: Run and see them fail** — Run: `npm test` — Expected: FAIL on the new exports.

- [ ] **Step 3: Implement the four functions in `lib/lead-rules.ts`**

Days for "buyer silent" are `daysBetween(todayIST(new Date(lastBuyer.sentAt)), today)`.

- [ ] **Step 4: Run and see them pass** — Run: `npm test` — Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add lib/lead-rules.ts lib/lead-rules.test.ts lib/test-helpers.ts
git commit -m "feat: add mark sent, rules fallback and agent answer checks"
```

---

### Task 4: Chat parser

**Files:**
- Create: `lib/chat-parser.ts`
- Test: `lib/chat-parser.test.ts`

**Interfaces:**
- Consumes: `Message` from Task 2.
- Produces: `parseChat(leadId: string, text: string): Message[]`. Line format `[DD/MM/YY, HH:MM] <Name>: <text>`; the time is IST, so `sentAt` is `20YY-MM-DDTHH:MM:00+05:30`. A sender starting `Rep (` is `sender: "rep"` with `senderName` the name inside the brackets; any other sender is `"buyer"` with that name. A line that does not start with `[` continues the previous message's text, joined with `\n`. Blank lines are skipped. A line that starts with `[` but doesn't match throws `Error("Bad chat line N in <leadId>: <line>")`.

- [ ] **Step 1: Write the failing tests**

```ts
const text = [
  "[12/10/26, 10:14] Rep (Amit): Hi Priya, sharing the quote for the 2 carton sealers.",
  "[12/10/26, 11:02] Priya Nair: Thanks. Delivery Diwali se pehle ho jayegi?",
  "Aur payment terms bhi bata dena",
  "",
].join("\n");
test("parses rep and buyer lines with IST timestamps", () => {
  const [a, b] = parseChat("L001", text);
  expect(a).toEqual({ leadId: "L001", sentAt: "2026-10-12T10:14:00+05:30", sender: "rep", senderName: "Amit", text: "Hi Priya, sharing the quote for the 2 carton sealers." });
  expect(b).toMatchObject({ sender: "buyer", senderName: "Priya Nair" });
});
test("joins continuation lines onto the previous message", () => {
  expect(parseChat("L001", text)[1].text).toBe("Thanks. Delivery Diwali se pehle ho jayegi?\nAur payment terms bhi bata dena");
});
test("throws on a malformed timestamped line", () => {
  expect(() => parseChat("L002", "[12-10-26 10:14] Amit: hi")).toThrow("Bad chat line 1 in L002");
});
```

- [ ] **Step 2: Run and see them fail** — Run: `npm test -- lib/chat-parser.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement `parseChat`** with one regex: `/^\[(\d{2})\/(\d{2})\/(\d{2}), (\d{2}):(\d{2})\] ([^:]+): (.*)$/`.
- [ ] **Step 4: Run and see them pass** — Run: `npm test` — Expected: all pass.
- [ ] **Step 5: Commit**

```bash
git add lib/chat-parser.ts lib/chat-parser.test.ts
git commit -m "feat: parse whatsapp-style chat exports"
```

---

### Task 5: Sample data

**Files:**
- Create: `scripts/make-leads-xlsx.ts`, `data/leads.xlsx`, `data/chats/L0NN.txt` (12 or more files)

**Interfaces:**
- Consumes: `REPS`, `SOURCES`, `DATA_DATE`, `parseChat`.
- Produces: `data/leads.xlsx` with one sheet `Leads`, header row exactly `lead_id, name, company, phone, source, last_contact_date, rep, product_interest`, dates as `YYYY-MM-DD` text cells. Chats in `data/chats/<lead_id>.txt` in Task 4's format.

`scripts/make-leads-xlsx.ts` holds the rows as an array and writes the sheet with `exceljs`; the sheet is the stand-in for the business's Excel file and is what the seed reads.

Content rules (DATA.md has the full list):
- 22 leads, `L001`–`L022`, 4 or 5 per rep, all six sources used. Companies are invented Indian food, pharma, FMCG, e-commerce and dairy businesses; product interest is one of carton sealer, shrink wrapper, strapping machine, form-fill-seal, case erector, labelling machine.
- Phones are `+91 00000 000NN` (an invalid Indian mobile prefix, so clearly fake).
- Written as if today were `DATA_DATE` (2026-10-28). Last contact dates: 4 on 28 Oct, 6 between 24 and 27 Oct, 6 between 15 and 23 Oct, 6 between 20 Sep and 14 Oct.
- 13 chats, 4 to 12 lines, with the last message on the lead's last contact date. Each case below appears at least once; note the lead ID of each in a comment at the top of `make-leads-xlsx.ts`:
  - Hot: asks for a quote; says "send PI"; asks delivery or payment terms; gives a date ("we decide by 5 Nov").
  - Warm: "will discuss internally"; asks for a brochure or video; interested with no timeline. **One Warm lead with no buying signal and a recent last contact is the main-flow lead for adding a quote request** (step 3 of PLAN.md's main flow).
  - Cold: no reply to the last 2 rep messages; "not now, next quarter"; budget freeze.
  - Buyer asks to be called on a specific date (e.g. "call me on 3 Nov").
  - Objection: price too high; comparing with a named, invented competitor.
  - Hinglish or casual tone in at least 3 chats.
- 9 leads have no chat.
- No name, company or number may belong to a real person or business: invented names only, no real brands.

- [ ] **Step 1: Write the chat files and the script, then generate the sheet**

Run: `npx tsx scripts/make-leads-xlsx.ts`
Expected: `data/leads.xlsx` written, prints `22 leads`.

- [ ] **Step 2: Check every chat parses and lines up with its lead**

Run: `npx tsx -e "import {readdirSync,readFileSync} from 'fs'; import {parseChat} from './lib/chat-parser'; for (const f of readdirSync('data/chats')) { const m = parseChat(f.slice(0,4), readFileSync('data/chats/'+f,'utf8')); console.log(f, m.length, m.at(-1)!.sentAt.slice(0,10)); }"`
Expected: 13 or more files, each 4 to 12 messages, and each last date equal to that lead's `last_contact_date`.

- [ ] **Step 3: Commit**

```bash
git add scripts/make-leads-xlsx.ts data/leads.xlsx data/chats
git commit -m "feat: add made-up sample leads and chats"
```

---

### Task 6: Agent

**Files:**
- Create: `lib/prompt.ts`, `lib/agent.ts`
- Modify: `lib/constants.ts` (only if Step 3 finds a newer model name)

**Interfaces:**
- Consumes: `LeadFields`, `Message`, `Assessment`, `checkAgentResponse`, `daysBetween`, `MODEL`.
- Produces:
  - `buildPrompt(lead: LeadFields, chat: Message[], today: string): string`
  - `assessWithAgent(lead: LeadFields, chat: Message[], today: string): Promise<Assessment | null>` — never throws; returns `null` on missing key, network error, timeout (20 s via `AbortSignal.timeout`), or a failed `checkAgentResponse`. Logs the failure reason with `console.error`.

`lib/prompt.ts` holds the instructions as one exported template string, readable on its own in the walkthrough. It must contain:
- the role: an assistant to an Indian B2B packaging-equipment sales rep;
- the inputs: today's date, the lead's fields, days since last contact, and the chat with each line marked `REP` or `BUYER` and dated;
- Hot signals: asked for a quote or price, gave a decision or purchase date, said "send PI", asked about delivery or payment terms;
- Warm signals: interested but no timeline, "will discuss internally", asked for a brochure or video;
- Cold signals: no reply to the last 2 rep messages, "not now" or "next quarter", a budget freeze, or long silence;
- no chat: judge from source and days since last contact;
- `reason`: one line under 120 characters naming the specific signal from the chat;
- `requested_date`: only when the buyer asked to be contacted on or by a date, as `YYYY-MM-DD` resolved against today; otherwise null;
- the draft rules from Global Constraints, plus: answer any open objection, never invent prices or discounts, never promise a delivery date;
- one short example of input and output (a Hinglish one).

`assessWithAgent` calls `new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }).models.generateContent({ model: MODEL, contents: buildPrompt(...), config: { responseMimeType: "application/json", responseJsonSchema: <schema with tag enum, reason, requested_date (string, nullable), draft, all required>, temperature: 0.3, abortSignal } })`, then `JSON.parse(response.text)` and `checkAgentResponse`.

- [ ] **Step 1: Write `lib/prompt.ts` and `lib/agent.ts`**

- [ ] **Step 2: Typecheck** — Run: `npx tsc --noEmit` — Expected: no errors.

- [ ] **Step 3: Confirm the model name against the live API** (needs `GEMINI_API_KEY` in `.env.local`; ask the user for it if missing)

Run: `npx tsx --env-file=.env.local -e "import {GoogleGenAI} from '@google/genai'; (async()=>{const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY}); for await (const m of await ai.models.list()) if (m.name?.includes('flash-lite')) console.log(m.name)})()"`
Expected: a list including `models/gemini-3.5-flash-lite`. If a newer non-preview text Flash-Lite is listed, set `MODEL` to it.

- [ ] **Step 4: Commit**

```bash
git add lib/prompt.ts lib/agent.ts lib/constants.ts
git commit -m "feat: add gemini agent with structured output"
```

---

### Task 7: Seed script

**Files:**
- Create: `scripts/seed.ts`, `data/seed.json`
- Modify: `lib/types.ts` (add `SeedFile`), `lib/prompt.ts` (only if Step 3 finds misread cases), `scripts/make-leads-xlsx.ts`, `data/leads.xlsx` (only if the Today counts are off)

**Interfaces:**
- Consumes: `parseChat`, `assessWithAgent`, `resolveAssessment`, `DATA_DATE`, `LeadFields`.
- Produces: `data/seed.json` shaped `{ dataDate: string; leads: Lead[]; messages: Message[] }` (type `SeedFile`, exported from `lib/types.ts`).

Reads `data/leads.xlsx` with `exceljs`, and each lead's chat if the file exists. For each lead, in ID order, it calls `assessWithAgent(fields, chat, fields.lastContactDate)` and then `resolveAssessment(fields, result, null, chat, fields.lastContactDate, new Date(\`${fields.lastContactDate}T12:00:00+05:30\`))`. This is the seed timing decision at the top of this plan. It waits 4 s between calls to stay under the free per-minute limit. It prints one line per lead (`L001 Hot agent 2026-10-26 Asked for PI for 2 sealers`) and a summary of how many leads used rules. `--only L001,L005` limits the run for a quick check and doesn't write the file.

- [ ] **Step 1: Write `scripts/seed.ts`; try two leads** — Run: `npm run seed -- --only L001,L002` — Expected: 2 lines tagged by `agent`, no file written.

- [ ] **Step 2: Run the full seed** — Run: `npm run seed` — Expected: 22 lines, `0 by rules`, `data/seed.json` written.

- [ ] **Step 3: Check the result by hand against the chats**

For each chat lead, read its tag, reason and draft next to the chat. Check that every Hot, Warm and Cold case from Task 5 got the tag it was written for; that the requested-date lead's follow-up date equals the date the buyer gave; that the objection drafts answer the objection; and that Hinglish chats got Hinglish drafts. Also count what the Today list would hold on load day, as of `DATA_DATE`: 3 to 6 overdue and 3 to 6 due today. If the prompt misreads a case, fix `lib/prompt.ts` and re-run. If the counts are off, adjust last contact dates in Task 5's data and re-run.

- [ ] **Step 4: Commit**

```bash
git add scripts/seed.ts data/seed.json lib/types.ts lib/prompt.ts
git commit -m "feat: add seed script and assessed sample data"
```

---

### Task 8: Database, date shift and load script

**Files:**
- Create: `db/schema.sql`, `lib/db.ts`, `lib/seed-shift.ts`, `scripts/db-load.ts`
- Test: `lib/seed-shift.test.ts` (uses `makeLead` from `lib/test-helpers.ts`)

**Interfaces:**
- Consumes: `Lead`, `Message`, `SeedFile`, `addDays`, `daysBetween`, `todayIST`.
- Produces:
  - `shiftSeed(seed: SeedFile, days: number): SeedFile` (pure)
  - in `lib/db.ts`:
    - `getLeads(rep?: string): Promise<Lead[]>`
    - `getLead(id: string): Promise<{ lead: Lead; messages: Message[] } | null>` (messages ordered by `sent_at`)
    - `saveLead(lead: Lead): Promise<void>` (an upsert on `id`)
    - `insertMessage(m: Message): Promise<void>`
    - `updateDraft(id: string, draft: string): Promise<void>`
    - `nextLeadId(): Promise<string>` (the highest `L` number + 1, zero-padded to 3)

`db/schema.sql` drops and recreates both tables:
- `leads`: `id text primary key`, `name`, `company`, `phone`, `source`, `rep` text not null, `product_interest text`, `last_contact_date date not null`, `follow_up_date date not null`, `tag text not null check (tag in ('Hot','Warm','Cold'))`, `reason text not null`, `requested_date date`, `draft text`, `draft_sent_at timestamptz`, `assessed_at timestamptz not null`, `assessed_by text not null check (assessed_by in ('agent','rules'))`, `agent_unavailable boolean not null default false`.
- `messages`: `id serial primary key`, `lead_id text not null references leads(id)`, `sent_at timestamptz not null`, `sender text not null check (sender in ('rep','buyer'))`, `sender_name text not null`, `text text not null`, with an index on `lead_id`.

`lib/db.ts` uses `neon(process.env.DATABASE_URL!)` tagged templates. Date columns are selected with `::text` casts (in one shared column list), so they come back as `YYYY-MM-DD` and never pass through a JS `Date`. Each timestamp column is selected as `to_char(col at time zone 'Asia/Kolkata', 'YYYY-MM-DD"T"HH24:MI:SS"+05:30"')`. Rows are mapped from snake_case to the camelCase types in one `toLead` / `toMessage` function each.

`scripts/db-load.ts` runs the statements in `schema.sql` in order (split on `;`), reads `data/seed.json`, shifts it by `daysBetween(seed.dataDate, todayIST())`, and inserts every lead, then every message. It prints `Loaded 22 leads, N messages, shifted +D days`.

- [ ] **Step 1: Write the failing test**

```ts
test("shiftSeed moves every date by the same number of days", () => {
  const seed: SeedFile = {
    dataDate: "2026-10-28",
    leads: [makeLead({ lastContactDate: "2026-10-26", followUpDate: "2026-10-27", requestedDate: "2026-11-03", assessedAt: "2026-10-26T12:00:00+05:30" }),
            makeLead({ id: "L002", requestedDate: null })],
    messages: [{ leadId: "L001", sentAt: "2026-10-26T10:14:00+05:30", sender: "rep", senderName: "Amit", text: "hi" }],
  };
  const s = shiftSeed(seed, 3);
  expect(s.dataDate).toBe("2026-10-31");
  expect(s.leads[0]).toMatchObject({ lastContactDate: "2026-10-29", followUpDate: "2026-10-30", requestedDate: "2026-11-06", assessedAt: "2026-10-29T12:00:00+05:30" });
  expect(s.leads[1].requestedDate).toBeNull();
  expect(s.messages[0].sentAt).toBe("2026-10-29T10:14:00+05:30");
});
```

- [ ] **Step 2: Run and see it fail** — Run: `npm test -- lib/seed-shift.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement `shiftSeed`.** Timestamps keep their time and `+05:30` suffix; only the date part moves, using `addDays`. This also covers `draftSentAt` when it isn't null.
- [ ] **Step 4: Run and see it pass** — Run: `npm test` — Expected: all pass.
- [ ] **Step 5: Write `db/schema.sql`, `lib/db.ts`, `scripts/db-load.ts`, and load into the dev database.** This needs `DATABASE_URL` for a Neon dev branch in `.env.local`; ask the user to create the Neon project and paste the URL if it's missing.

Run: `npm run db:load`
Expected: `Loaded 22 leads, N messages, shifted +D days`.

- [ ] **Step 6: Check the round trip**

Run: `npx tsx --env-file=.env.local -e "import {getLeads,getLead} from './lib/db'; (async()=>{const l=await getLeads(); console.log(l.length, l[0].followUpDate, typeof l[0].followUpDate); console.log((await getLead('L001'))?.messages.length)})()"`
Expected: `22 <a YYYY-MM-DD date> string`, then L001's message count.

- [ ] **Step 7: Commit**

```bash
git add db/schema.sql lib/db.ts lib/seed-shift.ts lib/seed-shift.test.ts scripts/db-load.ts
git commit -m "feat: add neon store and seed loader with date shift"
```

---

### Task 9: Lead writes (Server Actions)

**Files:**
- Create: `lib/leads.ts`, `app/actions.ts`

**Interfaces:**
- Consumes: `lib/db.ts` (Task 8), `assessWithAgent` (Task 6), `resolveAssessment`, `markSent` (Task 3), `todayIST`.
- Produces:
  - `lib/leads.ts`: `reassess(leadId: string): Promise<Lead>`. It loads the lead and its chat, calls `assessWithAgent(lead, chat, todayIST())`, then `resolveAssessment(lead, result, lead, chat, todayIST(), new Date())`, then `saveLead`, and returns the saved lead.
  - `app/actions.ts` (`"use server"`), all taking `FormData` and ending with `revalidatePath("/")` plus `revalidatePath(\`/leads/${id}\`)`:
    - `saveDraftAction(fd)`: fields `id`, `draft`. Calls `updateDraft`.
    - `markSentAction(fd)`: fields `id`, `draft`. Loads the lead. If `lead.draft` is null (already sent), it does nothing. Otherwise it calls `markSent(lead, draft, new Date())`; `null` means it does nothing; else it runs `insertMessage` and `saveLead`.
    - `addMessageAction(fd)`: fields `id`, `sender` (`rep` | `buyer`), `text`. Blank text does nothing. The sender name is `lead.rep` for rep messages and `lead.name` for buyer messages; `sentAt` is now in IST. It sets the lead's `lastContactDate` to today, saves the lead, inserts the message, then calls `reassess(id)`.
    - `addLeadAction(fd)`: fields `name`, `company`, `phone`, `source`, `rep`, `productInterest` (optional), `lastContactDate` (defaults to today), `firstMessage` (optional). It checks that the required fields are non-blank and that `source` and `rep` are in `SOURCES` and `REPS`; on failure it returns `{ error: string }`. It gets the ID from `nextLeadId()`, builds the lead with `resolveAssessment(fields, await assessWithAgent(fields, chat, today), null, chat, today, now)` (where `chat` is the first message as a buyer message, or empty), saves the lead and then the message, and redirects to `/leads/<id>`.

The ordering in `addLeadAction` matters: `messages.lead_id` references `leads`, so the lead must be saved before its message. `addMessageAction` doesn't have this problem because its lead already exists.

- [ ] **Step 1: Write both files**
- [ ] **Step 2: Typecheck and test** — Run: `npx tsc --noEmit && npm test` — Expected: no errors, all pass.
- [ ] **Step 3: Commit**

```bash
git add lib/leads.ts app/actions.ts
git commit -m "feat: add server actions for drafts, messages and leads"
```

---

### Task 10: Screens

**Files:**
- Modify: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- Create: `app/leads/[id]/page.tsx`, `app/leads/new/page.tsx`, `app/components/LeadList.tsx`, `app/components/RepFilter.tsx`, `app/components/TagBadge.tsx`, `app/components/DraftEditor.tsx`, `app/components/AddMessageForm.tsx`, `app/components/AddLeadForm.tsx`

**Interfaces:**
- Consumes: `getLeads`, `getLead`, `order`, `classify`, `todayIST`, `daysBetween`, the actions from Task 9, `REPS`, `SOURCES`.
- Produces: the three routes `/`, `/leads/[id]`, `/leads/new`.

If `/sf-design` has written a design doc in `docs/designs/`, follow it for layout, type and colour. Otherwise use plain, readable CSS in `globals.css`, with colour tokens on `:root` and a phone-width layout. The behaviour below is fixed either way:

- Every page sets `export const dynamic = "force-dynamic"`, because "today" changes daily and so does the data.
- `/` (`?rep=<full name>` filters by rep):
  - Header: the app name, today's date in IST (for example "Wed 28 Oct"), the rep filter (a `<select>` of "All reps" plus `REPS`, which changes the `rep` query param), and an "Add lead" link.
  - **Today** section: `order(...).today`. Each overdue row has a red treatment and the label "N days overdue"; each due-today row says "Due today". Rows show name, company, the tag badge, the reason, and the rep's first name when the filter is "All reps". The whole row links to `/leads/<id>`. When the list is empty: "No one to contact today."
  - **Later** section: `order(...).later`, each row showing its follow-up date ("Fri 30 Oct").
- `/leads/[id]` (returns `notFound()` for an unknown ID):
  - Back link; name, company, phone, source, rep, product interest.
  - The tag badge, the reason, and the follow-up date with its urgency label. If `agentUnavailable` is true: "Agent unavailable, showing the last assessment". If `assessedBy` is `rules`: "Tagged by rules".
  - `DraftEditor` (a client component) shows a textarea with the draft, **Save**, and **Mark as sent**, both forms posting to the actions. Buttons are disabled while pending (`useFormStatus`). When `draft` is null and `draftSentAt` is set, it shows "Sent <today | date>", with no textarea.
  - The chat: messages in time order, with rep and buyer visually distinct, each showing the sender name and time.
  - `AddMessageForm` has a From control (Rep or Buyer), a textarea, and an "Add message" button. While pending the button reads "Updating lead…", because the agent runs.
- `/leads/new` uses `AddLeadForm`, with the fields from Task 9. Source and rep are selects, last contact date is a date input defaulting to today, and there's an optional "First message from buyer" textarea. Errors from the action show above the form. The submit button reads "Adding and tagging…" while pending.

- [ ] **Step 1: Build the pages and components**
- [ ] **Step 2: Build** — Run: `npm run build` — Expected: build succeeds with no type errors.
- [ ] **Step 3: Run the main flow locally** against the dev database. Run: `npm run dev`, then use the chrome-devtools MCP (see `docs/agents/tools.md`) on `http://localhost:3000`:
  1. The Today list shows overdue leads in red at the top, Hot before Warm before Cold.
  2. Open a Hot lead, edit the draft, Save, reload, and see the edit kept. Mark as sent: the draft shows in the chat, and the lead is in Later with tomorrow's date.
  3. On the main-flow Warm lead, add a buyer message asking for a quote: the tag turns Hot, with a new reason and draft.
  4. Add a new lead with a first message: it lands tagged and scheduled.
  5. Filter by one rep: only their leads show.
  6. At a 375 px wide viewport: no horizontal scroll, and the first Today row is visible without scrolling.
  Expected: every item behaves as described, with no console errors. Then reset the dev data: `npm run db:load`.
- [ ] **Step 4: Commit**

```bash
git add app
git commit -m "feat: add today list, lead detail and add lead screens"
```

---

### Task 11: Deploy and check on the live link

**Files:**
- Modify: `CLAUDE.md` (the `## Testing` lines, with the real commands), `docs/agents/tools.md` (no change expected)

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: The user creates the Vercel project and links Neon.** Ask the user to:
  1. import `rishabh0111/lead-followup-agent` in Vercel;
  2. add Neon from Vercel's Marketplace for the production database, which sets `DATABASE_URL`;
  3. set `GEMINI_API_KEY` in the project's env vars.
  Expected: the user confirms, and gives the production URL and the production `DATABASE_URL`.
- [ ] **Step 2: Load production data**

Run: `DATABASE_URL=<prod url> npx tsx scripts/db-load.ts`. Don't add the prod URL to `.env.local`.
Expected: `Loaded 22 leads, …`.
- [ ] **Step 3: Push and deploy** — Run: `git push origin main` — Expected: the Vercel deployment goes green.
- [ ] **Step 4: Run Task 10 Step 3's main flow on the live URL** with the chrome-devtools MCP. Expected: all 6 checks pass with no console errors. Then reload production data with Step 2, so the reviewer starts clean.
- [ ] **Step 5: Record the commands in `CLAUDE.md` `## Testing`**: Framework `Vitest 5`, Test `npm test`, Single test file `npx vitest run <path>`, Lint `npm run lint`, Typecheck `npx tsc --noEmit`, Build `npm run build`.
- [ ] **Step 6: Commit and push**

```bash
git add CLAUDE.md
git commit -m "docs: record test and build commands"
git push origin main
```

---

### Task 12: README and note

**Files:**
- Modify: `README.md`
- Create: `NOTE.md`

- [ ] **Step 1: README.** Keep the opening paragraphs, and change the status line to the live link. Add:
  - **Run locally**: `npm i`, then copy `.env.example` to `.env.local` and fill it in, then `npm run db:load`, then `npm run dev`.
  - **Scripts**: what `seed` and `db:load` do, and when to re-run `db:load` (when the demo dates go stale).
  - **Code map**: one line each for `lib/lead-rules.ts`, `lib/agent.ts`, `lib/prompt.ts`, `lib/db.ts`, `app/`.
  - The existing docs table, with `GLOSSARY.md` added.
- [ ] **Step 2: NOTE.md, half a page.** Cover:
  - what was built;
  - how the agent decides Hot, Warm or Cold: the prompt's signals, how code sets the date, and that rules only run when the model fails;
  - which AI tools were used: Gemini Flash-Lite in the app, and Claude Code for building;
  - what to build next, 3 bullets: real WhatsApp sync, per-rep login, and reminders.
- [ ] **Step 3: Commit and push**

```bash
git add README.md NOTE.md
git commit -m "docs: add run instructions and project note"
git push origin main
```

The video (at most 3 minutes, following PLAN.md's main flow) and making the repo public are the user's last steps, after this task.
