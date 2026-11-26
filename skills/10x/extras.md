# Extras for 10x

> Generated from `upstream.lock.json` by `node scripts/validate.mjs --write`. Do not edit by hand.

Optional third-party playbooks, pinned to a known commit. The core procedures are enough without them.

`<upstream>` is the folder recorded in `local.md`, next to this file. `scripts/install.mjs` writes it. If `local.md` is missing or says the folder is absent, the extras are not installed: carry on with the core procedures and say so in your report.

Load at most one per step, and only when its row applies. An extra never overrides a rule in this repository.

| When | Read | From |
|---|---|---|
| Publishing tickets with native blocking links on the tracker | `<upstream>/mattpocock/skills/engineering/to-tickets/SKILL.md` | mattpocock |
| A hard bug: reproduce, minimise, hypothesise, instrument, fix | `<upstream>/mattpocock/skills/engineering/diagnosing-bugs/SKILL.md` | mattpocock |
| Judging module depth, interfaces and seams | `<upstream>/mattpocock/skills/engineering/codebase-design/SKILL.md` | mattpocock |
| A schema, API or config change that needs expand, migrate, contract | `<upstream>/caveman/skills/migration/SKILL.md` | caveman |
| Three models from three providers on one decision or review | `<upstream>/tstack/skills/council/SKILL.md` | tstack |
| Scope too unclear for one spec: chart it as decision tickets | `<upstream>/mattpocock/skills/engineering/wayfinder/SKILL.md` | mattpocock |
| Primary-source research by read-only scouts | `<upstream>/mattpocock/skills/engineering/research/SKILL.md` | mattpocock |
| A throwaway prototype to settle one design question | `<upstream>/mattpocock/skills/engineering/prototype/SKILL.md` | mattpocock |
| Scanning a repository for shallow modules to deepen | `<upstream>/mattpocock/skills/engineering/improve-codebase-architecture/SKILL.md` | mattpocock |
| Called by grill-with-docs, triage, wayfinder and improve-codebase-architecture: one round of questions, each with a recommended answer | `<upstream>/mattpocock/skills/productivity/grilling/SKILL.md` | mattpocock |
| Called by retro; also when writing or pruning a skill, AGENTS.md or CLAUDE.md | `<upstream>/mattpocock/skills/productivity/writing-for-agents/SKILL.md` | mattpocock |
| A manual procedure only a person can do (credentials, CI secrets, a cutover): write it as numbered steps | `<upstream>/mattpocock/skills/engineering/wizard/SKILL.md` | mattpocock |
| The answers sit with a third party, not the owner: turn the open questions into a form to send | `<upstream>/mattpocock/skills/productivity/to-questionnaire/SKILL.md` | mattpocock |
| Before reporting any measured speed-up or regression | `<upstream>/pstack/pstack/skills/benchmark-checklist/SKILL.md` | pstack |
| A longer handoff summary than the core note | `<upstream>/mattpocock/skills/productivity/handoff/SKILL.md` | mattpocock |
| Stricter lean-code rules while building | `<upstream>/ponytail/skills/ponytail/SKILL.md` | ponytail |
