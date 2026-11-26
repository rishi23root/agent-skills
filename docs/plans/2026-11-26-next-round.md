# Plan: next round of skills (2026-11-26)

Status: proposed. Nothing below is built yet. Written by the `10x` seat; each
ticket is handed to the seat named on it.

## The decision

1. **pstack is a source of ideas, not a runtime.** Its router (`poteto-mode`)
   loads about 11 KB plus a principles index every session, lets workers start
   workers, and rejects planning, review rounds and asking the owner. Those
   are the opposite of our rules. We take its best ideas into our own words,
   and pin a handful of its standalone skills as extras. We do not install it.
2. **Fix what is broken before adding anything.** Two skills that our pinned
   extras call are not pinned (see T1). The validator did not catch it.
3. **Harden verification first, add features later.** The best ideas from
   pstack, the four libraries and the T3 multi-agent paper all point at the
   same thing: proof that a green PR is good. Those go first. Anything that
   needs run-log data waits for the pilot.
4. **Do not let this round delay the pilot.** Phases 0 and 1 are small. Run the
   pilot after Phase 1. Phases 3 and 4 use what the pilot teaches.

Sources read for this plan:
- pstack: `cursor/plugins`, folder `pstack/`, commit `ca782ed` (2026-11-24),
  MIT, by Lauren Tan. All 59 skills plus the playbooks that matter.
- The 39 upstream skills that are on disk but not pinned.
- *T3 Code: Building Multi-Agent Workflows* (Nov 2026 working note).

## Phase 0: fix (done 2026-11-26)

| # | Ticket | Seat | Touches | Done when |
|---|---|---|---|---|
| T1 | Pin mattpocock `productivity/grilling` (needed by `grill-with-docs`, `triage`, `wayfinder` and `improve-codebase-architecture`) and `productivity/writing-for-agents` (needed by `retro`) | mid | `upstream.lock.json`, generated `extras.md` | `validate.mjs --write` passes; both appear in the seats that hold the calling extras |
| T2 | Validator: with `--upstream`, warn when a pinned extra names another skill from its own library that is not pinned | mid | `scripts/validate.mjs` | Removing `grilling` from the lock makes the check fail with the four callers named |

## Phase 1: verification (before the pilot)

Each is a few lines in one core skill. Keep every skill under the 170-line
and 9,000-byte limits.

| # | Ticket | Seat | Touches | Source |
|---|---|---|---|---|
| T3 | **Proof by run.** A Critical or Important finding blocks only with a command the reviewer ran and its output. Without one it is reported as a suspicion and does not block. The report counts the dropped findings | senior | `skills/review/SKILL.md` | pstack `interrogate` lines 9, 30 |
| T4 | **Cross-family review by default.** A reviewer from a different provider than the author when one has quota; required for high risk as now | senior | `skills/review/SKILL.md`, `skills/dispatch/allocation.md` | T3 paper, GILD 417/1,287 |
| T5 | **A verdict covers a patch, not a SHA.** Record `git patch-id` with `Factory-Review: APPROVE`; after a rebase compare it before discarding or trusting the verdict. Confirm a merge by reading the PR back (a queued or auto-merge is not a merge) | senior | `skills/review/SKILL.md`, `skills/ship/SKILL.md`, `scripts/gate.mjs` | pstack `shipping.md` lines 7-8 |
| T6 | **Same surface.** A bug fix is proven on the surface where it was reproduced, with failing-then-passing output pasted; an inconclusive run is not a pass. Add the check cadence: type check and single tests often, the full suite once at the end | mid | `skills/build/SKILL.md` | pstack `bug-fix.md`; mattpocock `implement` |
| T7 | **Ports and databases.** Tickets that start a server or touch a local database name their own port and database | mid | `skills/tickets/ticket-format.md` | T3 paper §VI-A |
| T8 | **Read-only helper output.** One `path:start-end reason` line per location, only for ranges actually read, or `no relevant locations found` | mid | `skills/dispatch/SKILL.md` | caveman `caveman-explore` |
| T9 | **Capped runs are visible.** Add outcome `capped` (hit the round cap) to the run log | junior | `scripts/runlog.mjs`, `skills/runlog/SKILL.md` | T3 paper, "silent caps" |
| T10 | **Duplicate-run guard.** Before dispatch, check the ledger and open PRs for the same ticket | mid | `skills/dispatch/SKILL.md` | mattpocock `software-factory` |

## Phase 2: front door and extras (alongside the pilot)

| # | Ticket | Seat | Touches | Source |
|---|---|---|---|---|
| T11 | **Deeper, not bigger.** `improve` names what a strong professional would also check, and what outside signal would show the result is right (feeds acceptance checks). Choices an experiment can settle are marked "prototype"; taste and product calls stay with the owner | senior | `skills/improve/SKILL.md`, `brief-format.md` | pstack `sharpen` |
| T12 | **Recommended answers.** Each open question in a brief carries a recommended answer, worded so "yes" accepts it, marked as a recommendation (not an assumption) | mid | `skills/improve/SKILL.md` | mattpocock `grilling` |
| T13 | **Decidable reports.** Every report to the owner lists each call only the owner can make, with link, evidence, risk and our pick | mid | `skills/factory/SKILL.md`, `skills/handoff/SKILL.md` | pstack `ketchup` |
| T14 | Add pstack as the 5th pinned source, with these extras: `blast-radius` (senior, mid reviewing), `why` (mid, senior), `benchmark-checklist` (senior, 10x), `correct` (senior), `unslop` + `technical-writing` (senior), `typescript-best-practices` with its two principles (junior, mid), `create-verification-skill` + `maintain-verification-skill` (senior, once per repo) | mid | `upstream.lock.json`, `LICENSING`/README note, `scripts/sync-upstream.mjs` (sparse path inside `cursor/plugins`) | pstack |
| T15 | Add mattpocock extras: `wizard` (senior, 10x), `setup-pre-commit` (mid, once per Node repo), `to-questionnaire` (senior, 10x) | mid | `upstream.lock.json` | mattpocock |
| T16 | Cost at a glance: generate context cost per entry point into `docs/skill-graph.md`, a short README section, and the interactive call graph script under `scripts/` | mid | `scripts/validate.mjs`, `README.md` | other thread, 2026-11-24 |

## Phase 3: per-project checks and principles (after the pilot)

| # | Ticket | Seat | Touches |
|---|---|---|---|
| T17 | **Plain-English checks.** A project keeps `checks/*.md`, one PASS/FAIL rule per file with failing examples. `review` runs every file and reports each verdict. `create-verification-skill`'s feature-map layout is the model. Start with one project | senior | `skills/review/SKILL.md`, `templates/`, one pilot repo |
| T18 | **Principles folder.** `principles/<name>.md`, our own words, one rule and one "applies when" line each, under 600 bytes. Core skills cite them by name instead of restating; the validator fails on a missing name. First set: laziness ladder, prove it works, fix root causes, attack the premise (new), test behaviour not implementation (new). Expect the core skills to get shorter | senior | new `principles/`, `skills/build`, `skills/review`, `scripts/validate.mjs` |

## Phase 4: learning loop (needs 10+ run-log rows)

| # | Ticket | Seat | Touches |
|---|---|---|---|
| T19 | **Reflect.** After a run, propose skill edits from the transcript and run log. Keep a finding only if it would still hold in six months, would change what a future agent does, and maps to a skill that run used. Output Accepted / Rejected / Backlog and wait for the owner. Anything a lint could enforce goes to backlog | senior | `skills/runlog/SKILL.md` |
| T20 | **Blind tests for skill changes.** An organic prompt with no hint it is a test, a judge from another provider, grading from what the transcript shows was opened. Extends `evals/scenarios.md` | senior | `evals/` |
| T21 | **Audit rows.** Run-log rows are never edited, only superseded; a different-provider agent flags weak evidence | mid | `scripts/runlog.mjs` |

## Owner decisions (only you can make these)

1. **Git guardrails.** mattpocock `git-guardrails-claude-code` blocks dangerous
   git commands with a hook. As shipped it also blocks every `git push`, which
   would stop `ship`. Install it per machine with push to feature branches
   allowed? It changes your live setup, so it is your call.
2. **Pre-commit gates.** Running type check and tests on every commit is a
   strong check and may be slow. Which repos?
3. **"Never block on the human".** pstack's rule. We keep asking the owner for
   merges and missing facts. Confirm.

## What we skip, and why

- From pstack: `poteto-mode`, `poteto-agent`/`worker.md`, `figure-it-out`,
  `arena`, `swarm`, `architect` (duplicate `factory`, `spec`, `council` or
  break depth 2); `recall`, `ketchup-video`, `teach`, `bro`, `how`,
  `in-your-own-words`, `tdd` (covered or not factory work); formal
  verification and `statechart` (TLA+, Java, Bun); `setup-pstack`,
  `automate-me`, `make-bot-ui`, `poteto-help` (Cursor-only).
- From the four libraries: Caveman Cloud skills (vendor login), mattpocock
  `in-progress/*` (unstable), course and personal skills, display cards.
  `caveman-commit` also forbids the attribution lines we use.
- Dropping `caveman-commit`, `cavecrew`, `caveman-review` and `implement` in
  the first version was right. Dropping `caveman-explore` and `pr` left two
  jobs without an owner; T8 and T5 cover them.

## Conflicts with pstack we keep on purpose

| pstack | Ours | Why we keep ours |
|---|---|---|
| Never block on the human; the bar is the whole bar | Owner says merge; review rounds and gate | You are the last reviewer; the gate is the cheapest guard against a wrong merge |
| Workers start agents | Depth two | Cost and visibility |
| Lead reviews every child's diff | Never review your own work | Same-author blind spots |
| No planning | Spec and tickets for feature size and up | Small tasks skip both already |
| Router plus principles index loaded each session | Load nothing until named | Standing cost stays near zero |
