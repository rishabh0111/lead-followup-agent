# Note

## What was built

A Next.js app on Neon Postgres. The Today list shows each rep's overdue and due-today leads, most urgent first, with a tag, a reason and a draft message for each. A lead page shows the chat and lets the rep edit the draft, save it, mark it sent, or add a message. New leads can be added. A filter picks one rep or all reps.

## How the agent decides

The model (Gemini Flash-Lite) reads the lead's fields and chat and returns a tag (Hot, Warm or Cold), a one-line reason, a requested date if the buyer gave one, and a draft in the buyer's language. The prompt asks it to look at buying signals, open objections, unanswered rep messages and how long the buyer has been silent. Its answer is checked against a schema in code.

The model does not pick the follow-up date. Code does: the requested date if there is one, otherwise Hot today, Warm +3 days, Cold +10 days, never before today. Marking a draft sent moves the follow-up date by +1, +3 or +10 days.

The agent runs when the seed is built, and live only when a message or a lead is added. It never runs on page load, save draft or mark sent. Simple rules run only when the model fails: a buying signal means Hot, two unanswered rep messages or 14 or more days of buyer silence means Cold, anything else is Warm. A lead that already has a result keeps it and shows "agent unavailable".

Writes are capped (200 leads, 100 messages per lead) because the demo is public with no login.

## AI tools used

Gemini Flash-Lite runs inside the app. Claude Code was used to build it.

## Next

- Sync real WhatsApp chats instead of adding messages by hand.
- Give each rep a login so they see only their own leads.
- Send reminders when a lead becomes due.
