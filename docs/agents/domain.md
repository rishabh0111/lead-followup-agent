# Domain docs

Layout: single-context.

## Read before exploring

- The glossary: `GLOSSARY.md` at the repository root.
- The ADRs in `docs/adr/` that touch the area you are about to change.
- `docs/DECISIONS.md`, the project's table of open and decided choices (stack, model, tagging rules). It predates the ADR folder; a decision settled there is binding until an ADR replaces it.

A file that does not exist yet is normal: carry on without it. The `sf-glossary` skill creates the glossary and the first ADR when a term or decision is settled.

## Speak the glossary's language

When your output names a domain concept (an issue title, a test name, a refactor proposal), use the glossary's term, and none of the words it lists to avoid. A concept the glossary lacks is a finding: either the project does not use that idea, or the glossary has a gap worth noting for the `sf-glossary` skill.

## Surface ADR conflicts

When your output contradicts an ADR or a decided row in `docs/DECISIONS.md`, say so openly and give the reason to reopen it, for example: _Contradicts ADR-0007 (event-sourced orders), worth reopening because..._

## Layout

```
/
├── GLOSSARY.md          (created on first settled term)
└── docs/
    ├── DECISIONS.md     (open/decided choices table)
    └── adr/             (created with the first ADR, 0001-<slug>.md)
```
