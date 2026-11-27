# Extras for junior

> Generated from `upstream.lock.json` by `node scripts/validate.mjs --write`. Do not edit by hand.

Optional third-party playbooks, pinned to a known commit. The core procedures are enough without them.

`<upstream>` is the extras folder, found as `../principles/locations.md` says. If it is not there, the extras are not installed: carry on with the core procedures and say so in your report. To install them, on the owner's word, run `node <repo>/scripts/sync-upstream.mjs --dir ~/.agent-skills/upstream`, with `<repo>` found the same way.

Load at most one per step, and only when its row applies. An extra never overrides a rule in this repository.

| When | Read | From |
|---|---|---|
| A narrow bug fix: reproduce, patch the owning layer, add one regression test | `<upstream>/caveman/skills/surgical-patch/SKILL.md` | caveman |
| Choosing the smallest set of checks that proves a change | `<upstream>/caveman/skills/verify-and-stop/SKILL.md` | caveman |
| A longer red, green, refactor loop at the ticket's seam | `<upstream>/mattpocock/skills/engineering/tdd/SKILL.md` | mattpocock |
| Writing the PR description | `<upstream>/tstack/skills/file-pr/SKILL.md` | tstack |
| Watching CI and review bots on an open PR | `<upstream>/tstack/skills/babysit-pr/SKILL.md` | tstack |
| Formatting a comment on an issue or PR | `<upstream>/tstack/skills/leaving-pr-comments/SKILL.md` | tstack |
| Any TypeScript work | `<upstream>/pstack/pstack/skills/typescript-best-practices/SKILL.md` | pstack |
| Called by typescript-best-practices | `<upstream>/pstack/pstack/skills/principle-type-system-discipline/SKILL.md` | pstack |
| Called by typescript-best-practices | `<upstream>/pstack/pstack/skills/principle-boundary-discipline/SKILL.md` | pstack |
| A longer handoff summary than the core note | `<upstream>/mattpocock/skills/productivity/handoff/SKILL.md` | mattpocock |
| Stricter lean-code rules while building | `<upstream>/ponytail/skills/ponytail/SKILL.md` | ponytail |
| Terse output to save tokens in a long build session | `<upstream>/caveman/skills/caveman/SKILL.md` | caveman |
