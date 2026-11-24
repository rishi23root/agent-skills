# Extras for mid

> Generated from `upstream.lock.json` by `node scripts/validate.mjs --write`. Do not edit by hand.

Optional third-party playbooks, pinned to a known commit. The core procedures are enough without them.

`<upstream>` is the folder recorded in `local.md`, next to this file. `scripts/install.mjs` writes it. If `local.md` is missing or says the folder is absent, the extras are not installed: carry on with the core procedures and say so in your report.

Load at most one per step, and only when its row applies. An extra never overrides a rule in this repository.

| When | Read | From |
|---|---|---|
| A longer red, green, refactor loop at the ticket's seam | `<upstream>/mattpocock/skills/engineering/tdd/SKILL.md` | mattpocock |
| Writing the PR description | `<upstream>/tstack/skills/file-pr/SKILL.md` | tstack |
| Watching CI and review bots on an open PR | `<upstream>/tstack/skills/babysit-pr/SKILL.md` | tstack |
| Formatting a comment on an issue or PR | `<upstream>/tstack/skills/leaving-pr-comments/SKILL.md` | tstack |
| Once per repository: set up the tracker, labels and agent docs | `<upstream>/mattpocock/skills/engineering/setup-matt-pocock-skills/SKILL.md` | mattpocock |
| Working through a queue of existing issues | `<upstream>/mattpocock/skills/engineering/triage/SKILL.md` | mattpocock |
| Publishing tickets with native blocking links on the tracker | `<upstream>/mattpocock/skills/engineering/to-tickets/SKILL.md` | mattpocock |
| A hard bug: reproduce, minimise, hypothesise, instrument, fix | `<upstream>/mattpocock/skills/engineering/diagnosing-bugs/SKILL.md` | mattpocock |
| The cause is unknown and code must not be touched yet | `<upstream>/caveman/skills/investigate-first/SKILL.md` | caveman |
| A new slice that is at risk of being overbuilt | `<upstream>/caveman/skills/lean-build/SKILL.md` | caveman |
| A restructuring that must not change behaviour | `<upstream>/caveman/skills/safe-refactor/SKILL.md` | caveman |
| Deciding whether a stale PR is rebased, reworked or closed | `<upstream>/tstack/skills/modernize/SKILL.md` | tstack |
| Finishing another author's branch or PR while keeping their credit | `<upstream>/tstack/skills/takeover/SKILL.md` | tstack |
| A second review pass focused on bugs, security, load and lean code | `<upstream>/ponytail/skills/ponytail-review/SKILL.md` | ponytail |
| Two parallel fresh reviewers, one per axis | `<upstream>/mattpocock/skills/engineering/code-review/SKILL.md` | mattpocock |
| A longer handoff summary than the core note | `<upstream>/mattpocock/skills/productivity/handoff/SKILL.md` | mattpocock |
| Stricter lean-code rules while building | `<upstream>/ponytail/skills/ponytail/SKILL.md` | ponytail |
| Terse output to save tokens in a long build session | `<upstream>/caveman/skills/caveman/SKILL.md` | caveman |
