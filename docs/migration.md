# Migration and trial

How this repository relates to the skills that were in use before it, and how
to try it without disturbing them.

## Nothing changes until you switch

This repository does not install itself, and it does not read or write the
existing skills folder. The earlier set (the four `*-dev` routers,
`client-brief`, `fleet-model-allocator`, `skill-refs`) keeps working exactly as
it did. The names here are different on purpose, so both sets can be present in
the same session during a trial.

## Old to new

| Before | Now | What changed |
|---|---|---|
| `client-brief` | `improve` | Takes any rough input, not only client words. Adds a context read with a budget, a size and a risk. Still stops after the brief |
| `junior-dev` | `junior` | Same contract. The playbooks it loaded by absolute path are now core procedures (`build`, `ship`, `handoff`), with the originals as optional extras |
| `mid-dev` | `mid` | Same contract. Client intake moved to `improve` |
| `senior-dev` | `senior` | Same contract. The clone gate and caps moved into `dispatch`, where they have one copy |
| `10x-dev` | `10x` | Same entry conditions. Design-twice is described in the seat. The council is in `skills/review/council.md`. The originals are extras |
| `fleet-model-allocator` | `dispatch` and `dispatch/allocation.md` | Model names replaced by tiers. One quota floor. The placement test is now defined. Run record moved to `runlog` |
| The run record section of the allocator | `runlog` and `scripts/runlog.mjs` | A script validates and appends the row. Outcome is separate from the worker's status |
| The "Log rule" in each role skill (`use-log.jsonl`, and "Skills used:" at the end of a reply) | The `extras` field of the run row | One log instead of two. Core procedures are not logged per load. Extras are, because that is the data that decides whether an extra should move into the core |
| The `prompt` field of the allocator's run record | Dropped. The row links the ticket, and the worker brief is built from the ticket | Keeps the log small and free of pasted content |
| `skill-refs`, `profile.json`, `link-skills.ps1` | `scripts/install.mjs`, `scripts/sync-upstream.mjs`, `upstream.lock.json` | Cross-platform. Extras are pinned by commit |
| No manager skill (the manager was a role of `senior-dev`) | `factory` | New. One command that runs the whole loop |
| About 60 third-party playbooks loaded by `D:\` path | 10 core procedures, plus 53 pinned extras from five libraries | The core no longer depends on another repo being present at a fixed path |

## Names

| Use | Instead of |
|---|---|
| manager | fleet manager, dispatcher, controller thread, manager thread |
| seat | role, role router, persona |
| worker | fleet agent, builder thread, in-thread helper |
| subagent, own thread | (unchanged) |
| spec gate | board, board gate |
| handoff | desk rule, memory note, fresh-context bounce |
| tier (frontier, workhorse, fast) | Tier 1, 2, 3 |
| owner | client, user, board (when it means the person who decides) |

## Questions that were open, and how they are settled here

| Open question | Settled as | Where |
|---|---|---|
| When is a task a subagent and when its own thread? | By where the result lands. Unsure means subagent | `dispatch` section 3 |
| What does a thread that owns a PR do? | Worktree from the ticket's base, pushes its branch, opens the PR, watches checks, stops at the gate | `dispatch` section 3, `ship` |
| Which quota threshold: 5, 10 or 15 percent? | 15 | `dispatch/allocation.md` |
| Where is each rule written? | Once, in the skill that owns it | `architecture.md`, contracts table |
| Is the run log real? | The script exists and was tested. A hook to fill it is still to do | `validation.md` |

These are decisions made while writing, not results. Each one is listed in
`architecture.md` with what would change it.

## Trial plan

1. **Read** `architecture.md` and `skill-graph.md`. Correct anything that does
   not match how you think about the system. It is cheaper to change now.
2. **Install into one project only.**
   `node scripts/install.mjs --target <project>/.claude/skills`
3. **Add the profile.** Copy `templates/factory.md` to that project as
   `docs/agents/factory.md` and fill it in.
4. **Run `/improve` on three real requests**, including one dictated one.
   Compare each brief with what you meant. This tests the front door alone.
5. **Run the pilot.** One small ticket through `/factory`: brief, build,
   independent review, PR at the gate. Stop there. Do not merge automatically.
6. **Open a fresh session** with only the ticket and the PR. If it can continue
   the work, the handoff contract holds.
7. **Write the run row and the lesson.** Fix the skill the lesson points at.
8. **Only then** raise the caps, or install more widely.

## Switching over

When the pilot has passed, install into the user-level skills folder, and take
the seven older names out of the allow-list in the old profile so they are no
longer offered. Keep the old folder until a month of run log rows exists. The
extras can point at the clones you already have:
`node scripts/install.mjs --target <dir> --upstream <existing upstream folder>`.
The pinned commits in `upstream.lock.json` are the ones those clones were at
on 2026-11-24.
