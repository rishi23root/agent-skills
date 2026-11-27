# Extras for senior

> Generated from `upstream.lock.json` by `node scripts/validate.mjs --write`. Do not edit by hand.

Optional third-party playbooks, pinned to a known commit. The core procedures are enough without them.

`<upstream>` is the extras folder, found as `../principles/locations.md` says. If it is not there, the extras are not installed: carry on with the core procedures and say so in your report. To install them, on the owner's word, run `node <repo>/scripts/sync-upstream.mjs --dir ~/.agent-skills/upstream`, with `<repo>` found the same way.

Load at most one per step, and only when its row applies. An extra never overrides a rule in this repository.

| When | Read | From |
|---|---|---|
| Formatting a comment on an issue or PR | `<upstream>/tstack/skills/leaving-pr-comments/SKILL.md` | tstack |
| Publishing tickets with native blocking links on the tracker | `<upstream>/mattpocock/skills/engineering/to-tickets/SKILL.md` | mattpocock |
| A second review pass focused on bugs, security, load and lean code | `<upstream>/ponytail/skills/ponytail-review/SKILL.md` | ponytail |
| Two parallel fresh reviewers, one per axis | `<upstream>/mattpocock/skills/engineering/code-review/SKILL.md` | mattpocock |
| Interviewing the owner to close open questions and sharpen the glossary | `<upstream>/mattpocock/skills/engineering/grill-with-docs/SKILL.md` | mattpocock |
| Publishing a spec to the tracker | `<upstream>/mattpocock/skills/engineering/to-spec/SKILL.md` | mattpocock |
| Fuzzy or duplicate terms in the spec or glossary | `<upstream>/mattpocock/skills/engineering/domain-modeling/SKILL.md` | mattpocock |
| Judging module depth, interfaces and seams | `<upstream>/mattpocock/skills/engineering/codebase-design/SKILL.md` | mattpocock |
| Running a whole ticket graph on one integration branch | `<upstream>/mattpocock/skills/engineering/implement-spec/SKILL.md` | mattpocock |
| A review loop with a model from a second provider | `<upstream>/tstack/skills/sol-loop/SKILL.md` | tstack |
| Taking a proven change to a PR that waits at the merge gate | `<upstream>/tstack/skills/full-stop/SKILL.md` | tstack |
| Only when the owner says to merge: through the gate to a merged PR | `<upstream>/tstack/skills/full-send/SKILL.md` | tstack |
| A ranked health audit of a whole repository | `<upstream>/ponytail/skills/ponytail-audit/SKILL.md` | ponytail |
| Collecting the shortcuts that were marked in code | `<upstream>/ponytail/skills/ponytail-debt/SKILL.md` | ponytail |
| A schema, API or config change that needs expand, migrate, contract | `<upstream>/caveman/skills/migration/SKILL.md` | caveman |
| After a project: what in the harness or tests should change | `<upstream>/mattpocock/skills/engineering/retro/SKILL.md` | mattpocock |
| Called by grill-with-docs, triage, wayfinder and improve-codebase-architecture: one round of questions, each with a recommended answer | `<upstream>/mattpocock/skills/productivity/grilling/SKILL.md` | mattpocock |
| Called by retro; also when writing or pruning a skill, AGENTS.md or CLAUDE.md | `<upstream>/mattpocock/skills/productivity/writing-for-agents/SKILL.md` | mattpocock |
| A manual procedure only a person can do (credentials, CI secrets, a cutover): write it as numbered steps | `<upstream>/mattpocock/skills/engineering/wizard/SKILL.md` | mattpocock |
| The answers sit with a third party, not the owner: turn the open questions into a form to send | `<upstream>/mattpocock/skills/productivity/to-questionnaire/SKILL.md` | mattpocock |
| Reviewing a small diff that looks risky: find the one fact it is safe because of, and prove it by a run | `<upstream>/pstack/pstack/skills/blast-radius/SKILL.md` | pstack |
| Before changing code whose reason is unclear: answer from commits and PRs | `<upstream>/pstack/pstack/skills/why/SKILL.md` | pstack |
| Before reporting any measured speed-up or regression | `<upstream>/pstack/pstack/skills/benchmark-checklist/SKILL.md` | pstack |
| The owner keeps correcting the same mistake: fix it in structure before prose | `<upstream>/pstack/pstack/skills/correct/SKILL.md` | pstack |
| Tightening prose for the owner: a PR body, a report, a doc | `<upstream>/pstack/pstack/skills/unslop/SKILL.md` | pstack |
| Writing a doc, a spec or a README | `<upstream>/pstack/pstack/skills/technical-writing/SKILL.md` | pstack |
| Once per repository: map how to launch, drive and observe each feature. Write the result under the project's own docs or .claude folder, not .cursor | `<upstream>/pstack/pstack/skills/create-verification-skill/SKILL.md` | pstack |
| Upkeep of the verification map that create-verification-skill wrote | `<upstream>/pstack/pstack/skills/maintain-verification-skill/SKILL.md` | pstack |
| A longer handoff summary than the core note | `<upstream>/mattpocock/skills/productivity/handoff/SKILL.md` | mattpocock |
| Stricter lean-code rules while building | `<upstream>/ponytail/skills/ponytail/SKILL.md` | ponytail |
