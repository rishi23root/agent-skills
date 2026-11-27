# Industry patterns

What well-known practitioners publish about their own agent skills, and what
this repository took from each. Read on 2026-11-24 from the primary sources
listed. Anything that could not be checked against a primary source is marked
**unverified**.

A closer reading of the four repos that are pinned as extras is in
[upstream-skills.md](upstream-skills.md).

## Matt Pocock, `mattpocock/skills`

**Structure.** Skills are split into user-invoked ones, which you type and
which orchestrate, and model-invoked ones, which are small reusable
disciplines. A user-invoked skill may call a model-invoked one, never another
user-invoked one.

**Main chain.** `grill-with-docs` (or `grill-me`), then `to-spec`, then
`to-tickets`, then `implement` per ticket with the context cleared between
tickets, or `implement-spec` for the whole graph. `implement` uses `tdd` and
ends with `code-review`. `ask-matt` is the router.

**Per-repo setup.** A setup skill interviews you once and writes the tracker,
label and domain facts into `docs/agents/`. Every other skill reads those
files and stops if they are missing.

**Tickets.** Tracer-bullet slices with blocking edges. Bodies describe durable
behaviour and acceptance, not file paths. Labels form a small state machine:
`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`.

**Fleet.** `implement-spec` walks the frontier of unblocked tickets. Each
ticket gets a fresh implementer in its own worktree. A merger agent integrates
onto one branch. Subagents receive pointers, not copied content.

**Review.** Two parallel fresh reviewers, one for standards and one for spec,
reported side by side with no single winner. This is prose, with no hard gate.

Sources: <https://github.com/mattpocock/skills>

## Theo Browne, `t3dotgg/tstack`

**Structure.** Nine skills triggered by short phrases: `full-send`,
`full-stop`, `council`, `sol-loop`, `file-pr`, `takeover`, `babysit-pr`,
`modernize`, `leaving-pr-comments`.

**Chain.** `full-send` calls `sol-loop`, `file-pr` and `babysit-pr`.
`full-stop` is the same journey that stops at the merge decision. Several
skills share `leaving-pr-comments` as a formatter.

**Fleet.** `council` starts three read-only delegates in parallel on models
from different providers, and loops until they are satisfied. It uses T3
Code's `delegate_task` after reading `orchestrator_capabilities`.

**Validation.** The merge gate is written as conditions that can each be
checked on the latest commit: proof covers the whole diff, required checks are
green, bot findings are fixed or dismissed with a reason, no person has
requested changes, the branch is current. Admin bypass is banned. Proof must be
evidence seen in the session. When blocked, the default is to leave the PR
open.

**Personal config** such as which models sit on the council stays in
`AGENTS.md` or `CLAUDE.md`, so a skill update does not overwrite it.

**Unverified:** that his personal global `AGENTS.md` and fleet repository are
unpublished, and the existence of a talk titled "Delete your CLAUDE.md". Both
appeared only in secondary summaries.

Sources: <https://github.com/t3dotgg/tstack>,
<https://github.com/pingdotgg/t3code/blob/main/AGENTS.md>

## Jesse Vincent, `obra/superpowers`

**Structure.** About fifteen skills that trigger automatically and are
described as mandatory workflows: brainstorming, worktrees, writing plans,
subagent-driven development, test-driven development, requesting and receiving
code review, finishing a branch, systematic debugging, verification before
completion.

**Fleet.** A controller dispatches one fresh implementer per task.
Implementers do not run in parallel and cannot dispatch. They write full
reports to files and return only a status: `DONE`, `DONE_WITH_CONCERNS`,
`NEEDS_CONTEXT` or `BLOCKED`.

**Validation.** Each task is reviewed for spec compliance and for code
quality. The fix loop runs three rounds with the original implementer, then
escalates to a stronger model, with a cap. Unresolved findings go into a
ledger file. The controller may not advance while a Critical or Important
finding is open. A progress ledger is kept in a file because conversation
memory does not survive compaction.

Sources: <https://github.com/obra/superpowers>

## Anthropic

**Skill authoring.** Only the name and description are always loaded. The
description says what the skill does and when to use it. Keep the body under
500 lines, references one level deep. Write evaluations first, at least three
scenarios, and test on weak and strong models. Prefer a validation script for
fragile operations.

**Claude Code practice.** Instructions in `CLAUDE.md` or a skill are advisory.
"If something has to happen every time, make it a hook." Review with a fresh
subagent that has not seen the conversation, and tell it to skip style.

**Multi-agent systems.** A lead agent gives each worker an objective, an
output format, tools and boundaries. Effort scales with complexity, because a
multi-agent run costs many times what a single chat does. The lead keeps its
plan in external memory.

**Agent patterns.** Five named shapes: chaining, routing, parallelisation,
orchestrator and workers, evaluator and optimiser. Use the simplest that
works, check against ground truth from the environment, and cap iterations.

**Unverified:** the details usually attributed to Boris Cherny's personal
workflow (parallel sessions, a short shared `CLAUDE.md` updated after every
mistake, a formatter hook). The original thread could not be read. Only
third-party summaries were available.

Sources:
<https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices>,
<https://code.claude.com/docs/en/best-practices>,
<https://www.anthropic.com/engineering/multi-agent-research-system>,
<https://www.anthropic.com/engineering/building-effective-agents>

## Where they agree

| Pattern | Who | Here |
|---|---|---|
| A fresh context for every worker | Pocock, Superpowers, Anthropic | `dispatch`: the worker brief is all a worker gets |
| The reviewer is not the author | All four | `review`, and the gate |
| Review against the written spec | Pocock, Superpowers | `review`: the Spec axis |
| Spec and tickets are durable files with behavioural acceptance | Pocock, Superpowers, Anthropic | `spec`, `tickets` |
| Small descriptions, thin skill files, detail in references | Pocock, Anthropic | Size limits in `validate.mjs` |
| Skills are composed from small parts | Pocock, Theo, Superpowers | Layers 2 and 3 |
| The orchestrator passes pointers, not content | Pocock, Superpowers, Anthropic | `dispatch` section 5 |
| Evidence before "done" | Theo, Superpowers, Anthropic | `build`: Prove it. `report-format.md` |

## Where they disagree, and the choice made here

| Question | Positions | Choice here | Reason |
|---|---|---|---|
| Automatic or by name | Superpowers triggers automatically. Pocock makes side-effecting skills explicit. Theo uses trigger phrases | Everything by name | A measured audit here found most automatic triggering was noise |
| Parallel builders | Pocock runs them in parallel worktrees. Superpowers forbids it | Allowed, behind a gate and caps, starting in pilot mode at one | Parallel work raised total tokens here, and review is the bottleneck |
| Shape of review | Pocock: two axes, no verdict. Superpowers: one reviewer, hard gate. Theo: cross-provider council to agreement | Two axes, one verdict, hard gate. Cross-provider only for high risk. Council by the table in `review/council.md` (until 2026-11-27: only through `10x`) | A verdict is needed to gate. A council on every PR costs too much |
| Enforcement | Mostly prose. Only Anthropic's docs push rules into hooks | Scripts for what can be checked, and an honest table of what is still prose | "Prose is not a mechanism" was this project's own finding |
| How many skills | Pocock about 27. Theo 9. Superpowers about 15 | 14, of which 6 are typed | The owner wanted a small set of main skills |
| Router | Pocock has `ask-matt`. Theo has none | `factory` routes and also manages | The owner wanted one command that manages everything |

## What was taken from whom

| Idea | From | Where it lives here |
|---|---|---|
| Label state machine and `ready-for-agent` | Pocock | `tickets` |
| Tickets as behaviour, no file paths in the body | Pocock | `tickets`, `improve/brief-format.md` |
| The frontier of unblocked tickets | Pocock | `tickets`, `dispatch` |
| Per-repo facts in a file written once | Pocock | `templates/factory.md` |
| Two review axes | Pocock | `review` |
| A merge gate of checkable conditions, and "leave it open" | Theo | `ship`, `scripts/gate.mjs` |
| Stop at the gate by default, merge only on a word | Theo (`full-stop`, `full-send`) | `ship` |
| Council of three providers | Theo | `review/council.md` |
| Status codes for worker reports | Superpowers | `dispatch/report-format.md` |
| A ledger in a file | Superpowers | `factory` |
| A capped fix loop that escalates | Superpowers | `review` |
| Subtract before you add | Gebert (`ponytail`) | `build`: the ladder |
| Reproduce and rank causes before patching | Brussee (`caveman`), Pocock | `build`, `mid` |
| Objective, output format, tools, boundaries | Anthropic | `dispatch`: the worker brief |
| Scale effort to complexity | Anthropic | `improve/sizing.md` |
| Hooks for rules that must always hold | Anthropic | `validation.md`, next steps |
| Evaluation scenarios, tested on weak and strong models | Anthropic | `evals/scenarios.md` |
