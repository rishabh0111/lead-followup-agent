# Decisions

None of these come from the brief. They started as my proposals and were settled on 28 Oct 2026.
Keep whatever is chosen simple enough to explain in the note.

| # | Question | Decision | Status |
| --- | --- | --- | --- |
| 1 | Stack | One Next.js app (App Router, TypeScript). Storage is Neon Postgres with two tables (`leads`, `messages`), plain SQL, one schema file. SQLite or a JSON file can't keep writes on Vercel | decided |
| 2 | Hosting | Vercel Hobby: Next.js runs natively and never sleeps. Render's free tier takes about a minute to wake and wipes its disk | decided |
| 3 | Model | Gemini Flash-Lite with a JSON response schema `{tag, reason, requested_date, draft}`, checked again in code. Flash's free daily limit is too low; Groq's Llama doesn't enforce a schema | decided |
| 4 | Tagging rules | The model tags every lead from its fields and chat. Rules run only when the model fails: buying signal means Hot; two unanswered rep messages or 14+ days of buyer silence means Cold; else Warm. No-chat leads go by source and days since contact | decided |
| 5 | Follow-up date | The model only extracts a requested date. Code sets the date: the requested date if any, else Hot today, Warm +3 days, Cold +10 days; never earlier than today | decided |
| 6 | Urgency order | Today list: overdue first (Hot, Warm, Cold, then most days overdue), then due today (Hot, Warm, Cold, then oldest last contact). Later list below, by follow-up date. "Today" is India time | decided |
| 7 | When the agent runs | For every lead at seed time, by a local script. Live only for one lead when a message or a lead is added. Never on page load, never when a draft is saved or sent | decided |
| 8 | Rep view | A filter by rep on the same screen, "All reps" by default. Not a login (that's out of scope) | decided |
| 9 | Draft language | Match the buyer's language and tone (English or Hinglish); 2 to 4 lines, a single ask, answers any open objection, signed with the rep's first name | decided |
| 10 | Model fails or hits its limit | A lead with a past result keeps it and shows "agent unavailable". A new lead gets the rules result and a template draft. The app still works | decided |
| 11 | Seed and load | `npm run seed` reads the Excel sheet and chats, runs the agent, writes a committed seed file. `npm run db:load` loads it into the database. The deployed app never reads Excel or seeds itself | decided |
| 12 | Demo dates | Sample data is written as if today were 28 Oct 2026. Loading shifts every date forward by the days since then, so overdue and due-today leads always exist | decided |
| 13 | Mark as sent | Adds the draft to the chat as a rep message, sets last contact to today, moves the follow-up date to +1 (Hot), +3 (Warm) or +10 (Cold) days, clears the draft | decided |
| 14 | Add message and add lead | One message at a time (rep or buyer), then the agent re-runs for that lead and replaces the draft. A new lead takes the required fields and an optional first buyer message, and is assessed straight away | decided |
| 15 | Tests | Vitest on the pure lead rules and the chat parser. The database, model call and page are checked by running the main flow on the live link | decided |
| 16 | Seed timing | The seed assesses each lead as of its own last contact date, as if the agent ran when that message arrived. Assessing everything as of the data date would leave no lead overdue on load day | decided |
