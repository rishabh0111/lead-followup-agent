# lead-followup-agent

## Agent skills

- Issue tracker: GitHub forge, tickets in GitHub Issues (`rishabh0111/lead-followup-agent`). See `docs/agents/issue-tracker.md`.
- Triage labels: default strings. See `docs/agents/triage-labels.md`.
- Domain docs: single-context, ADRs in `docs/adr/`. See `docs/agents/domain.md`.
- Work docs: specs, designs, plans, lessons and the codebase map. See `docs/agents/work-docs.md`.
- Tools: Chrome DevTools MCP (user scope, autoConnect), Node v24 with Chrome for direction scripts. See `docs/agents/tools.md`.
- Commands: see `## Testing`.

## Testing

- Framework: none (stack not chosen yet, see `docs/DECISIONS.md` #1)
- Test: none
- Single test file: none
- Lint: none
- Typecheck: none
- Build: none

## Design System

Read DESIGN.md before visual or UI work: it defines the fonts, colors, spacing, and
aesthetic direction. Ask the user before departing from it. When reviewing or QA-ing
UI, flag code that doesn't match DESIGN.md.
