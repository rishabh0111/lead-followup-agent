# Triage labels

Skills name a role; apply the label string in the second column.

| Role | Label here | Meaning |
|---|---|---|
| `bug` | `bug` | Category: something is broken |
| `enhancement` | `enhancement` | Category: a new feature or improvement |
| `needs-triage` | `needs-triage` | State: a maintainer has to evaluate it |
| `needs-info` | `needs-info` | State: waiting on the reporter |
| `ready-for-agent` | `ready-for-agent` | State: fully specified, an agent can take it unattended |
| `ready-for-human` | `ready-for-human` | State: needs a person to implement or merge |
| `wontfix` | `wontfix` | State: will not be done |

Each triaged ticket carries one category and one state.

`sf-decision-map` uses its own labels on maps and their tickets, never mixed with the roles above:
`decision-map:map`, `decision-map:research`, `decision-map:prototype`, `decision-map:decision-rounds`, `decision-map:task`.
