# Product

<!-- product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router, TypeScript) on Vercel, Neon Postgres, Gemini Flash-Lite. Settled in
`docs/DECISIONS.md` #1 to #3.

## Users

- **Reps (primary).** Five sales reps at a small Indian company that sells packaging
  equipment to other businesses. Each rep works their own leads, talks to buyers on
  WhatsApp, and mostly opens this screen on a laptop at the start of the day and between
  calls. The phone has to work, but it is the second screen.
- **The owner.** Wants to see which leads are hot and who needs a reply today, across
  all reps (the "All reps" filter).
- **The reviewer.** The build is graded against six pass/fail checks in `docs/PLAN.md`,
  a 3-minute video and a live walkthrough. Reps come first; the reviewer should see the
  care in a screen that is clear for reps, not in decoration added for the video.

## Product Purpose

One screen that tells each rep who to contact today and what to say. An agent reads each
lead and its chat, tags it Hot, Warm or Cold with a one-line reason, sets the follow-up
date and writes a draft. The rep edits the draft, marks it as sent, and adds messages or
leads, which the agent reassesses.

Success: a rep knows who to contact today within 10 seconds of opening the screen, and
could send the draft with small edits or none.

## Positioning

It replaces an Excel sheet and memory, not a CRM. The agent reads the actual WhatsApp
chat, including Hinglish, and writes the next message in the buyer's own tone, so a rep's
day starts from a ready answer instead of a blank one.

## Operating Context

- Leads come from one Excel sheet; chats come from WhatsApp exports. Sending happens in
  WhatsApp, outside the app ("mark as sent" only records it).
- "Today" is India time. Overdue leads must stand out; the Today list is ordered overdue
  first, then due today, Hot before Warm before Cold (`docs/DECISIONS.md` #6).
- Demo data is made up and date-shifted so overdue and due-today leads always exist.

## Capabilities and Constraints

- Screens: Today list with Later below (`/`), lead detail (`/leads/[id]`), add lead
  (`/leads/new`). A rep filter, not a login.
- Vocabulary follows `GLOSSARY.md` (Lead, Rep, Buyer, Draft, Tag, Reason, Follow-up date,
  Overdue, Due today, Today list). Never "follow-up" on its own in UI copy.
- Out of scope: login, real WhatsApp sending, payments, deleting or editing lead fields.
  Build only what `docs/PLAN.md` lists.
- The agent can be unavailable; the screen then shows "Agent unavailable, showing the last
  assessment" or "Tagged by rules", and keeps working.
- Screens get about 4 hours of a 36-hour build (deadline 29 Oct 2026, 23:20 IST).

## Brand Commitments

- The seller is a fictional company with an invented brand: **Kasav Packtech** ("kasav"
  means "tighten"). A web search on 28 Oct 2026 found no real business by that name.
- No logo, colours or voice exist yet; all of these are open.

## Evidence on Hand

- Sample data spec in `docs/DATA.md`; 22 made-up leads and 13 or more chats are planned
  (`data/`), none written yet.
- No real customers, testimonials, numbers or logos. Never invent any as if they were real.

## Product Principles

1. Who to contact today comes before everything else on the screen.
2. The agent proposes and the rep decides: every tag shows its reason, and every draft
   can be edited.
3. Only what the brief asks for, done well.
4. It keeps working when the model fails.
