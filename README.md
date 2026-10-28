# lead-followup-agent

A lead follow-up agent with a web app on top, for a small sales team.

The business: a small company sells packaging equipment to other businesses and has 5 sales
reps. Its leads live in one Excel sheet and in WhatsApp chats with buyers. Reps forget to follow
up, so good leads go cold, and the owner can't see which leads are hot or who needs a reply today.

The goal is one simple screen that tells each rep who to follow up with today, and what to say.

Status: built. Live demo: <LIVE_URL>

## Run locally

1. `npm i`
2. Copy `.env.example` to `.env.local` and fill in `DATABASE_URL` (a Neon Postgres connection string) and `GEMINI_API_KEY`.
3. `npm run db:load`
4. `npm run dev`

## Scripts

- `npm run seed` reads `data/leads.xlsx` and `data/chats/`, runs the agent on each lead and writes `data/seed.json`. It needs `GEMINI_API_KEY`. Each lead is assessed as of its own last contact date, so some leads are overdue on load day. `npm run seed -- --only L001 --merge` re-assesses only the chosen leads and merges them into the existing seed file.
- `npm run db:load` creates the tables from `db/schema.sql` and loads `data/seed.json` into the database, shifting every date forward so the sample data looks current. Re-run it when the demo dates go stale.
- `npm test`, `npm run lint` and `npm run build` run the tests, the linter and the production build.

## Code map

- `lib/lead-rules.ts`: pure rules: the follow-up date, overdue and due-today checks, Today list order, mark sent, and the rules fallback.
- `lib/agent.ts`: calls the model (`MODEL` in `lib/constants.ts`), checks its JSON answer, and falls back to the rules when the call fails.
- `lib/prompt.ts`: builds the prompt from a lead's fields and chat.
- `lib/db.ts`: Neon Postgres access for leads and messages.
- `app/`: the Next.js pages and server actions: the Today list, lead detail and add lead screens.

## Docs

| Doc | Holds |
| --- | --- |
| [GLOSSARY.md](GLOSSARY.md) | The terms used in the code and docs |
| [NOTE.md](NOTE.md) | What was built, how the agent decides, tools used, next steps |
| [docs/PLAN.md](docs/PLAN.md) | Requirements, out of scope, deliverables, acceptance checks, timeline |
| [docs/DATA.md](docs/DATA.md) | Sample data spec: lead fields, chat format, coverage the data must have |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Choices (stack, model, tagging rules), each marked as decided or not |
