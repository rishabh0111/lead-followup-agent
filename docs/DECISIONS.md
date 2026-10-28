# Decisions

None of these come from the brief. They're my proposals, still open until marked as decided.
Keep whatever is chosen simple enough to explain in the note.

| # | Question | Proposal | Status |
| --- | --- | --- | --- |
| 1 | Stack | A single app (Next.js or FastAPI + React) with SQLite or a JSON store | open |
| 2 | Hosting | A free tier: Vercel, Render or Railway. Must open with no setup | open |
| 3 | Model | A free-tier model (Gemini Flash or Groq Llama) with a structured JSON output of `{tag, reason, next_followup_date, draft}` | open |
| 4 | Tagging rules | The model reads the chat. Rules fill in for missing chats and act as a check: an explicit buying signal means Hot; no reply in 14 days or more means Cold | open |
| 5 | Follow-up date | Use the date the buyer asked for if there is one. Otherwise Hot is today or tomorrow, Warm is +3 days and Cold is +10 days; never earlier than today | open |
| 6 | Urgency order | Overdue first (most days overdue on top), then due today with Hot before Warm before Cold, then by last contact date | open |
| 7 | When the agent runs | On seed, and again for just that lead whenever a lead or chat is added. Never on page load | open |
| 8 | Rep view | A filter by rep on the same screen. Not a login (that's out of scope) | open |
| 9 | Draft language | Match the buyer's language and tone (English or Hinglish); short, with a single ask | open |
| 10 | Model fails or hits its limit | Keep the last result and show "agent unavailable"; the app still works | open |
