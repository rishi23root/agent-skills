# Extras for junior

> Generated from `upstream.lock.json` by `node scripts/validate.mjs --write`. Do not edit by hand.

Optional third-party playbooks, pinned to a known commit. The core procedures are enough without them.

`<upstream>` is the folder recorded in `local.md`, next to this file. `scripts/install.mjs` writes it. If `local.md` is missing or says the folder is absent, the extras are not installed: carry on with the core procedures and say so in your report.

Load at most one per step, and only when its row applies. An extra never overrides a rule in this repository.

| When | Read | From |
|---|---|---|
| A narrow bug fix: reproduce, patch the owning layer, add one regression test | `<upstream>/caveman/skills/surgical-patch/SKILL.md` | caveman |
| Choosing the smallest set of checks that proves a change | `<upstream>/caveman/skills/verify-and-stop/SKILL.md` | caveman |
| A longer red, green, refactor loop at the ticket's seam | `<upstream>/mattpocock/skills/engineering/tdd/SKILL.md` | mattpocock |
| Writing the PR description | `<upstream>/tstack/skills/file-pr/SKILL.md` | tstack |
| Watching CI and review bots on an open PR | `<upstream>/tstack/skills/babysit-pr/SKILL.md` | tstack |
| Formatting a comment on an issue or PR | `<upstream>/tstack/skills/leaving-pr-comments/SKILL.md` | tstack |
| A longer handoff summary than the core note | `<upstream>/mattpocock/skills/productivity/handoff/SKILL.md` | mattpocock |
| Stricter lean-code rules while building | `<upstream>/ponytail/skills/ponytail/SKILL.md` | ponytail |
| Terse output to save tokens in a long build session | `<upstream>/caveman/skills/caveman/SKILL.md` | caveman |
