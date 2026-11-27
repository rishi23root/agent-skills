# Plan: align the factory with the T3 multi-agent note (2026-11-27)

Status: **accepted 2026-11-27.** Each ticket runs in its own thread and
opens its own PR. Written by the manager
after a second, closer reading of *T3 Code: Building Multi-Agent Workflows*
(Nov 2026), against the skills as they stand after PR 2 and PR 3.

## The decision

1. **Move toward the note's shape where it does not break a rule we hold.**
   The note is a tested setup. Its seats, loops, stop rules, permissions and
   automation come in. Our stricter gates (proof by run, patch-id verdicts,
   the merge gate, depth two) stay.
2. **Map, do not rename.** The note's roles map onto what exists:

   | Note | Here |
   |---|---|
   | Lead | the manager, `senior` when dispatching |
   | Builder | `junior` or `mid` worker |
   | Playtester | `review`, run in its "break it" mode, from another provider |
   | Copywriter | a docs pass in `ship`, run last on the final diff |
   | Dispatcher | an automation template that files briefs, never merges |
   | Charter (TEAM.md) | the project's `AGENTS.md` plus `docs/agents/factory.md` |
   | Brief | `improve/brief-format.md` and the worker brief in `dispatch` |

3. **Measurement before automation.** The note's central claim is the
   confidence that a green PR is good. We cannot see that number today, so it
   comes first.
4. **The setup skill comes last** and checks for everything this plan adds.

None of the seven improvements from the first reading was resolved by PR 2.
PR 2 added the plugin install, which the setup skill will build on.

## Phase 0: housekeeping (before any ticket)

| # | Ticket | Seat | Touches | Done when |
|---|---|---|---|---|
| H1 | Push the merge of `main` into PR 3, let CI pass, merge PR 3 | owner | none | PR 3 merged. Every ticket below is cut from that `main` |
| H2 | Decision 18 still says `Council: none, pair or three`; the rule is now `Voices: <number>, <reason>` | junior | `docs/architecture.md` | The text matches `review/council.md` |

## Phase 1: measure and verify (note §VIII)

| # | Ticket | Seat | Touches | Done when |
|---|---|---|---|---|
| T1 | **The confidence number.** New outcomes `reverted` and `defect-after-merge`, set by `runlog.mjs close` on an already merged row. `summary` prints the share of merged PRs that stayed good, per task type and model | mid | `scripts/runlog.mjs`, `skills/runlog/SKILL.md`, `docs/validation.md` | Adding a merged row, then closing it `reverted`, lowers the printed share; `runlog.mjs` rejects `reverted` on a row that never merged |
| T2 | **Playtester mode in review.** For a change a user can reach, the reviewer works through a fixed attack list (empty input, huge input, two tabs at once, slow network, unicode, expired login, missing permission) and reports which it tried. On recheck, every earlier finding is marked `FIXED`, `STILL BROKEN` or `NEW REGRESSION`, and the fix diff itself gets one look for regressions | mid | `skills/review/SKILL.md`, new `skills/review/attacks.md` | `review/SKILL.md` stays under 170 lines; scenario rows added |
| T3 | **What to test before merging.** The PR description gains one line: what the owner should try by hand, and what is risky since the last round | junior | `skills/ship/SKILL.md` | A PR opened by `ship` carries the line |

## Phase 2: stop rules (note §IV-D, §V)

| # | Ticket | Seat | Touches | Done when |
|---|---|---|---|---|
| T4 | **A run-wide hop cap.** Count every send-back and every move up a seat on one ticket. At four without the owner, stop and report, whatever the per-seat round cap says. The number lives only in `review` | mid | `skills/review/SKILL.md`, `skills/dispatch/SKILL.md` (points to it) | A ticket sent back three times at `junior` and once at `mid` stops and reports. Scenario row added |
| T5 | **Usage limit as a handoff trigger.** `handoff` fires when the provider's usage is near its limit; the note says what is done, what is half done with file and line, and the next three commands. `harness.md` names T3's auto-resume, snooze and fallback model | junior | `skills/handoff/SKILL.md`, `skills/dispatch/harness.md` | Both files say it once; no number repeated from `allocation.md` |
| T6 | **Goal loop pinned to "done when".** Where the harness has a goal command, the worker sets it to the brief's acceptance checks, never to an opinion | junior | `skills/dispatch/SKILL.md` (worker brief), `skills/dispatch/harness.md` | The worker brief has the line; `harness.md` has the row |

## Phase 3: platform and models (note §IX, §X)

| # | Ticket | Seat | Touches | Done when |
|---|---|---|---|---|
| T7 | **Permission per role.** The worker brief states the mode: builder auto-accept or auto inside its own worktree; reviewer, council voice and playtester supervised; the manager supervised; full access only in a sandbox. `harness.md` maps each to T3's four modes and the other harnesses | mid | `skills/dispatch/SKILL.md`, `skills/dispatch/harness.md` | A dispatched reviewer runs supervised. Scenario row added |
| T8 | **Allocation by family.** `10x` effort drops from "highest available" to high. Add the other providers' models confirmed on this machine (`gpt-6-luna` ran a review on 2026-11-27). Add a "family hint" column: build on one family, playtest on another, copy on a third. The title and commit-message model is the fast tier | mid | `skills/dispatch/allocation.md` | Validator passes; no model names outside this file |
| T9 | **Operations notes.** One section in `docs/fleet.md`: long runs on the always-on machine, MCP servers trimmed per agent, CLIs preferred over MCP servers, new-thread default lowered from full access | junior | `docs/fleet.md` | Section present; no skill changed |

## Phase 4: automation (note §VII)

These are markdown prompts kept in the repository. Nothing here installs or
schedules them. The setup skill offers to.

| # | Ticket | Seat | Touches | Done when |
|---|---|---|---|---|
| T10 | **PR webhook.** On a new PR: run `gate.mjs`, start a review from another provider in playtester mode, post the verdict on the PR | mid | new `templates/automation/pr-opened.md`, `README.md` | Run once by hand against a test PR, output pasted |
| T11 | **Daily triage.** Every weekday: `runlog.mjs audit`, PRs waiting at the gate, rows left `pending`, the good-merge share from T1. One report to the owner | mid | new `templates/automation/daily-triage.md` | Run once by hand, output pasted |
| T12 | **Copywriter pass.** `ship` runs a docs pass last, on the final diff: README, changelog, user-facing strings, only inside the profile's docs paths, on the cheapest model, preferably another provider | mid | `skills/ship/SKILL.md`, `templates/factory.md` (new `Docs paths` line) | `ship` stays under 170 lines; scenario row added |
| T13 | **Dispatcher brief.** The standing instruction for an outside agent (Grok Bot) or a scheduled T3 task: watch the tracker, deduplicate against open threads, write a brief with `improve`, and start a thread on the lead that owns the PR. Its job is to sort and route. It never merges, deploys or replies in public | senior | new `templates/automation/dispatcher.md`, `docs/fleet.md` | Reviewed by another provider |

## Phase 5: the setup skill (after Phases 1 to 4)

A typed procedure, `setup`, that checks a machine and a project and says what
is missing, with the step to fix each. It installs nothing on its own; it asks.

- Providers: each harness installed and signed in (Claude Code, Codex,
  Antigravity, Grok Build), and which models each can run today.
- T3: environment linked (not only paired), T3 Connect on, MCP URL, default
  permission mode, fallback and text-generation models, auto-resume.
- Outside agents: Grok Bot connected over MCP with OAuth at supervised.
- Automation: the Phase 4 templates present as scheduled or webhook tasks.
- Repository: `gh` signed in, Node version, extras synced, `local.md` or the
  plugin route found, `docs/agents/factory.md` and `checks/` present.

Output: one table of `ok` or `missing`, and for each missing line the exact
step. It needs a Decisions row, because decision 20 said no setup skill was
added. It gets its own plan after this one ships.

## Order and cost

- Touches overlap: T2 and T4 share `review/SKILL.md`; T4, T6 and T7 share
  `dispatch/SKILL.md`; T3 and T12 share `ship/SKILL.md`; T5, T6 and T7 share
  `harness.md`. Those run in sequence. The rest may run in parallel within
  the caps, but the repository is in pilot mode: one builder at a time.
- Suggested order: H1, H2, T1, T2, T7, then **run the pilot**, then T3 to T6,
  T8 to T13, then the setup plan.
- Each ticket is `small` (one PR). About 15 PRs, each reviewed by another
  provider.

## Owner decisions (answered 2026-11-27)

1. **PR 3.** The merge of `main` is pushed to it. Tickets are cut from its
   branch until it merges.
2. **The join step.** Yes: one PR per ticket stays the default; a join onto
   one integration branch is an option for `feature` size when the slices only
   make sense together.
3. **The lead's job is to split and assign.** It picks the right agent and
   model for each slice. It may fix or build a piece itself when that is
   needed, but that is not its main job.
4. **The dispatcher may start a thread** that owns a PR, not only file an
   issue. It still never merges, deploys or replies in public.
5. **Real PRs**, not drafts.
