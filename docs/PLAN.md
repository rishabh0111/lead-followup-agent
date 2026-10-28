# Plan

**Deadline: 29 Oct 2026, 23:20 IST** (36 hours from 28 Oct 2026, 11:21). The hard limit is 48
hours, but aim for 36.

## Requirements

### Step 1. Sample data (made up)
- At least **20 fake leads**, each with a name, company, phone, source and last contact date.
- At least **10 short WhatsApp-style chats** between a rep and a buyer.
- Details in [DATA.md](DATA.md).

### Step 2. The agent must
1. Read the leads and the chats.
2. Tag each lead **Hot, Warm or Cold**, with a **one-line reason**.
3. Set a **next follow-up date** for each lead.
4. Draft the **next follow-up message** for each lead.

### Step 3. The screen must
- Show **today's follow-ups at the top, most urgent first**.
- Make **overdue** follow-ups stand out clearly.
- Let a rep **open a lead** and see the chat, the tag, the reason and the draft message.
- Let a rep **edit the draft** and **mark it as sent**.
- Let a rep **add a new lead or a new chat**, and have the agent **update that lead**.

### Out of scope: do not build
- Login
- Real WhatsApp sending
- Payments

Only build what's listed. No half-built extras. If something gets stuck, pick the simplest
option, write it down in the note, and keep going.

## Deliverables (all 4 are required)

| # | What | Details |
| --- | --- | --- |
| 1 | Live link | A deployed app anyone can open and use, with no local setup |
| 2 | Code | A GitHub repo others can see (make it public at the end, or create a separate public one) |
| 3 | Video | **3 minutes at most.** Show the app working the way a sales rep would use it |
| 4 | Short note | **Half a page**: what was built, how the agent decides Hot/Warm/Cold, which AI tools were used, what to build next |

Rules: any language, framework, AI model or AI coding tool is fine, and free tiers are fine for
hosting and models. AI coding tools are expected. Every part must be something I can explain myself.

## Acceptance checks (pass/fail; at least 5 of 6, and "It works" must pass)

| Check | Pass means |
| --- | --- |
| It works | The live link opens and the main flow runs with no errors |
| Agent is useful | The Hot/Warm/Cold tags and reasons make sense for the chats |
| Drafts are usable | A rep could send the draft with small edits or none |
| Screen is clear | A rep knows who to call today within 10 seconds of opening it |
| Scope is right | Only what was asked, done well |
| You can explain it | The note and video clearly explain how it works and why |

A follow-up round is a live walkthrough of the build, so keep the code small and readable.

## Main flow (what the video shows)

1. Open the app: today's list, overdue at the top in red, then Hot before Warm before Cold.
2. Open a Hot lead: chat, tag, reason and draft. Edit the draft, mark it as sent, and the lead
   leaves today's list with a new follow-up date.
3. Add a new chat to a Warm lead where the buyer asks for a quote. The agent re-runs and the lead
   turns Hot, with a new reason and a new draft.
4. Add a new lead: it gets tagged and scheduled straight away.

## Timeline

| Block | Work | Hours |
| --- | --- | --- |
| 1 | Sample data (leads.xlsx + chats) | 1.5 |
| 2 | Agent: prompt, structured output, rules fallback, store | 3 |
| 3 | API: list, get, edit draft, mark as sent, add lead, add chat | 2 |
| 4 | Screen: today list, overdue styling, lead detail, forms | 4 |
| 5 | Deploy and test the flow on the live link | 1.5 |
| 6 | Note, README, record the video | 2 |
| | Buffer | 2 |
