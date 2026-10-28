---
# design-md-format=spec
name: Kasav Packtech
description: A dispatch board for a packaging-machinery sales team; ruled, dense and calm, where every colour means one thing.
colors:
  ground: "#F4F5F2"
  surface: "#FFFFFF"
  ink: "#15191A"
  ink-muted: "#5C6566"
  rule: "#D9DDD8"
  rule-strong: "#B9BFBA"
  machine-green: "#1E5B46"
  on-machine-green: "#FFFFFF"
  machine-green-tint: "#E3EEE8"
  overdue: "#C42B1C"
  overdue-tint: "#FBE9E6"
  hot: "#F2A007"
  on-hot: "#15191A"
  warm: "#F3EBD3"
  on-warm: "#6B5414"
  cold: "#E4E9EE"
  on-cold: "#3E5466"
typography:
  display:
    fontFamily: "Archivo, IBM Plex Sans, sans-serif"
    fontSize: "56px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 125"
  headline:
    fontFamily: "Archivo, IBM Plex Sans, sans-serif"
    fontSize: "40px"
    fontWeight: 800
    lineHeight: 1.05
    fontVariation: "'wdth' 118"
  title:
    fontFamily: "Archivo, IBM Plex Sans, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.2
    fontVariation: "'wdth' 112"
  body:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  body-large:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "18px"
    fontWeight: 500
    lineHeight: 1.35
  label:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.02em"
  mono:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.02em"
rounded:
  sm: "2px"
  md: "4px"
spacing:
  s1: "4px"
  s2: "8px"
  s3: "12px"
  s4: "16px"
  s5: "24px"
  s6: "32px"
  s7: "48px"
  s8: "64px"
components:
  button-primary:
    backgroundColor: "{colors.machine-green}"
    textColor: "{colors.on-machine-green}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  tag-hot:
    backgroundColor: "{colors.hot}"
    textColor: "{colors.on-hot}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "3px 8px"
  tag-warm:
    backgroundColor: "{colors.warm}"
    textColor: "{colors.on-warm}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "3px 8px"
  tag-cold:
    backgroundColor: "{colors.cold}"
    textColor: "{colors.on-cold}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "3px 8px"
  lead-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    padding: "8px 24px"
    height: "56px"
  lead-row-overdue:
    backgroundColor: "{colors.overdue-tint}"
    textColor: "{colors.ink}"
  message-buyer:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  message-rep:
    backgroundColor: "{colors.machine-green-tint}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "40px"
---
<!-- SEED: decided with the user before implementation; run /sf-design consultation to record it from code once there is code. -->

# Design System: Kasav Packtech

## Overview

**Creative North Star: "The dispatch board"**

A packaging-machinery firm runs on job boards, dispatch slips and carton labels. This app is the
sales team's version of that board: one ruled list, read top to bottom, that says who to contact
today. It is an operations tool, not a dashboard. There are no stat cards, charts or avatars; the
list itself is the content, and density is a feature.

The day heading is the only loud thing: a big, wide date and a one-line count ("7 to contact
today · 4 overdue"). Everything under it is quiet, ruled and aligned, so overdue red is the first
colour the eye meets. Type and hairline rules do the structural work; colour is reserved for
meaning.

**Product:** see PRODUCT.md. Kasav Packtech is a fictional seller; the brand is invented for the demo.
**Mode per surface:** Today list (`/`): Operate. Lead detail (`/leads/[id]`): Operate. Add lead (`/leads/new`): Operate.
**Reference sites:** none; no research was done (the user chose design knowledge only).
**Key Characteristics:**
- A large, expanded date heading with the day's count beside it.
- Overdue rows in a red tint, with a red mono "N DAYS OVERDUE" label.
- Ruled table rows with no cards, and the whole row clickable.
- A machine-enamel green brand and no blue anywhere.
- Mono figures for dates, phones and counts, so they line up.

## Colors

Cool workshop neutrals with three meanings carried by colour: act (green), late (red), likelihood
(marigold to steel).
**Strategy:** Restrained. One brand accent plus status colours, each with exactly one job.
**Light or dark:** Light only. Reps use it on office laptops in daylight, and on phones in the
field. The preview's dark toggle was a demonstration, not part of the system.

### Primary
- **Machine Green** (#1E5B46): primary buttons, the wordmark, links such as "‹ Today list", focus
  rings and row hover. It is the paint on Indian workshop machinery, which ties the brand to what
  Kasav sells.
- **Machine Green Tint** (#E3EEE8): rep messages in the chat, row hover, and success notices.

### Neutral
- **Ground** (#F4F5F2): page background, buyer messages, and quiet notices. Cool, never cream.
- **Surface** (#FFFFFF): the list, panels and inputs.
- **Ink** (#15191A): text, the 2px rule above the Today list, and the selected segment.
- **Ink Muted** (#5C6566): company names, rep names, meta lines and the Later heading.
- **Rule** (#D9DDD8): row dividers and section dividers.
- **Rule Strong** (#B9BFBA): input and secondary-button borders, and the rule above Later.

### Status
- **Overdue Red** (#C42B1C) on **Overdue Tint** (#FBE9E6): overdue rows and labels, form errors.
- **Hot Marigold** (#F2A007) with Ink text: the Hot tag.
- **Warm** (#F3EBD3) with #6B5414 text: the Warm tag.
- **Cold** (#E4E9EE) with #3E5466 text: the Cold tag.

**The One Meaning Rule.** Each colour means one thing. Red is overdue, or an error that blocks the
rep, and nothing else; Hot is marigold, never red. Green is "act" or "the rep's side", never
"success" decoration. A success notice uses the green tint and words, not a green check badge.

**The No Blue Rule.** No blue in the UI. The Cold tag's steel grey-blue is the only cool hue.

## Typography

**Display Font:** Archivo (with IBM Plex Sans), variable width axis 62 to 125
**Body Font:** IBM Plex Sans (with sans-serif), 400 / 500 / 600
**Label/Mono Font:** IBM Plex Mono (with ui-monospace), 400 / 500
**Character:** Archivo at expanded width reads like stencilled carton labels; Plex Sans is an
engineering face that stays calm in dense rows; Plex Mono lines up dates and phone numbers like a
docket. All three load from Google Fonts (OFL), verified on 28 Oct 2026:
`https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap`.
In Next.js, load them with `next/font/google` (Archivo with `axes: ["wdth"]`).

### Hierarchy
- **Display** (800, 56px, line-height 1, width 125): the date heading on `/` only. 40px under 760px.
- **Headline** (800, 40px, 1.05, width 118): the lead's name on `/leads/[id]` and "New lead".
- **Title** (700, 18px, 1.2, width 112): section heads "Today" and "Later", "Draft to <buyer>". The
  wordmark "KASAV" is Title at width 125 in Machine Green, followed by "Packtech" in body 500.
- **Body Large** (500, 18px, 1.35): the count line and the reason on the lead detail.
- **Body** (400, 15px, 1.5): rows, chat, inputs. Names in rows are body 600.
- **Label** (600, 13px, 0.02em): tags, buttons, field labels.
- **Mono** (500, 13px, uppercase, 0.02em): urgency labels ("2 DAYS OVERDUE", "DUE TODAY", "FRI 30
  OCT"), phone numbers and message times.

The scale (13 / 15 / 18 / 24 / 40 / 56) jumps by size, not weight, so each level reads apart. IBM
Plex Sans is on the overused list as a display face; it is used here only as body and UI on Operate
surfaces, which that list allows.

## Layout

Laptop first; the phone works.
- **Container:** max width 1160px, 16px page gutter. Screens sit on Ground; the app frame is Surface
  with a 1px Rule border.
- **Header:** wordmark left; rep filter and "Add lead" right; 12px by 24px padding; 1px Rule below.
- **Today list (`/`):** the day heading (32px top, 24px bottom padding), then "Today" with a 2px Ink
  rule above, then rows. A row is a 6-column grid: urgency (148px), name and company (1.2fr), tag
  (64px), reason (2fr, one line with ellipsis), rep first name (64px), chevron (16px), with 16px
  gaps, 24px side padding, at least 56px high, and a 1px Rule between rows. "Later" follows after
  32px, with a 1px Rule Strong above and a muted heading.
- **Lead detail (`/leads/[id]`):** back link, then a header with the name, company and a 4-column
  facts row (phone, source, rep, interested in). Below it, two columns: chat and the add-message
  form (flexible), and a 400px panel with tag, reason, follow-up date, draft and actions, sticky to
  the top on scroll. A 1px Rule separates the columns.
- **Add lead (`/leads/new`):** a two-column form, max 760px; the first message spans both columns.
- **Under 760px:** rows become two lines (name with the tag at right; then the urgency label; then
  the reason, wrapped). The rep and chevron hide. The lead detail stacks as header, assessment and
  draft, then chat. The facts become two columns. No horizontal scroll at 375px.
- **Spacing rhythm:** a 4px base (4, 8, 12, 16, 24, 32, 48, 64).

## Elevation & Depth

Flat. Depth comes from tone steps (Ground, then Surface, then tints) and 1px rules. There are no
shadows anywhere, and no cards.

## Shapes

Nearly square. Tags have 2px corners; buttons, inputs, message blocks and the app frame have 4px.
There are no pills and no fully rounded shapes.

## Components

### Buttons
- **Shape:** slightly squared corners (4px), 40px high, 16px side padding, Label type.
- **Primary:** Machine Green with white text. "Add lead", "Mark as sent", and submit on Add lead.
  One primary per view area.
- **Secondary:** Surface, Ink text, 1px Rule Strong border; the border turns Ink on hover. "Save",
  "Add message".
- **Ghost:** Machine Green text, no fill; links such as "‹ Today list".
- **Hover / Focus / Disabled:** primary brightens slightly on hover; every control shows a 2px
  Machine Green focus ring offset 2px; a disabled control sits at 55% opacity with a progress
  cursor and swaps its label for the pending text ("Updating lead…", "Adding and tagging…").

### Chips
- **Tags:** Hot, Warm and Cold as small squared chips (2px corners, 3px by 8px padding, Label
  type). The word always appears, so colour is never the only signal.

### Lead row (signature component)
- The whole row is one link. Overdue rows sit on Overdue Tint, with their urgency label in Overdue
  Red mono. Due-today rows are plain Surface with "DUE TODAY" in Ink mono. Later rows show the
  follow-up date in muted mono. Hover tints the row Machine Green Tint (overdue rows darken their
  red tint a little instead).
- Empty state: "No one to contact today." in Ink, inside the Today section.

### Chat
- Buyer messages sit on the left on Ground with a 1px Rule border; rep messages sit on the right on
  Machine Green Tint. Each shows the sender name and the time in mono, in a muted meta line above.
  Maximum width 78% (92% on phone). A centred mono day line ("Sat 24 Oct") separates days.

### Assessment and draft panel
- Tag, then the urgency and follow-up date in mono (red when overdue), then the reason in Body
  Large, then a rule. "Draft to <buyer first name>" is a Title, above a textarea at least 150px
  high. Save (secondary) and Mark as sent (primary, filling the remaining width) sit on one row.
- Once sent: "Sent today ✓" in Machine Green replaces the textarea.
- Notices, "Agent unavailable, showing the last assessment" and "Tagged by rules", use the quiet
  notice style: 13px muted text on Ground with a 1px Rule border.

### Inputs / Fields
- **Style:** Surface, 1px Rule Strong border, 4px corners, 40px minimum height, 8px by 12px
  padding, body type. Labels are 13px 600 above the field, with "optional" in muted 400.
- **Focus:** a 2px Machine Green ring. **Error:** an Overdue Tint banner above the form, with a bold
  first clause ("Can't add this lead.") and the fix in plain words.
- **From control (Rep / Buyer):** a two-button segmented control; the selected segment is Ink with
  Surface text.

### Navigation
- The header only: wordmark, rep filter (a native select, "All reps" plus the five reps) and "Add
  lead". No sidebar and no tabs.

## Do's and Don'ts

### Do:
- **Do** keep red for overdue and blocking errors only.
- **Do** show every date, time and phone number in IBM Plex Mono.
- **Do** use the glossary's words in UI copy (Lead, Draft, Follow-up date, Overdue, Due today); never
  "follow-up" on its own.
- **Do** design the empty, pending, agent-unavailable and rules-tagged states along with the
  happy path.
- **Do** keep the first Today row visible without scrolling at 1280 by 800 and at 375px.

### Don't:
- **Don't** wrap rows or panels in cards, add shadows, or nest containers.
- **Don't** colour Hot red, and don't signal a tag by colour alone.
- **Don't** add stat tiles, charts, avatars or icons in circles; the list is the content.
- **Don't** add a coloured left border to rows; overdue is the full-row tint.
- **Don't** use blue, gradients, pills or rounded corners over 4px.
- **Don't** copy WhatsApp's own greens or chat-bubble tails.

## Motion

- **Approach:** minimal and functional.
- **Easing:** the browser's `ease` for colour changes.
- **Duration:** 150ms for hover and state colour changes.
- **The one authored moment:** none. Pending buttons change their label instead of showing a
  spinner. `prefers-reduced-motion` turns transitions off.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-10-28 | Initial design system created | By sf-design consultation mode from PRODUCT.md and design knowledge; no research or outside voices. Approved by the user from the rendered preview, `docs/designs/design-system-20261028/preview.html`. |
| 2026-10-28 | Hot is marigold; red is only for overdue | Red always means "act now", which serves the 10-second check. |
| 2026-10-28 | The date heading is the hero on `/` | The count reads in about a second; it costs about 120px above the first row. |
| 2026-10-28 | Machine-green brand, no blue | Sets it apart from CRM tools and ties it to Kasav's machinery. |
| 2026-10-28 | Light only, laptop first | The use scene is office laptops in daylight; the phone layout still works. |
