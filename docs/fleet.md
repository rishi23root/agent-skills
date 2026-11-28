# Fleet and subagents

How one manager session, its workers, separate threads and more than one
machine work together. The rules themselves live in
`skills/dispatch/SKILL.md`. This page explains them.

## Vocabulary

| Term | Meaning |
|---|---|
| **Manager** | The top session, whichever skill it was started with (`factory`, or a seat called directly). It is the only one that dispatches |
| **Worker** | Any run the manager starts. A builder works as `junior` or `mid`. `senior` and `10x` never run as workers |
| **Subagent** | A worker inside the manager's session. Its result comes back to the manager |
| **Own thread** | A worker that is a separate conversation. It owns one ticket and that ticket's PR |
| **Seat** | The level a worker works at: junior, mid, senior or 10x |
| **Fleet** | All workers in flight at one time |
| **Orchestration layer** | `dispatch`, plus the harness tools it calls |

## Shape

```mermaid
flowchart TD
  O[Owner] --> MG[Manager session<br/>frontier model]
  MG -->|subagent| A[Read-only workers<br/>search, review, research, council]
  MG -->|subagent, worktree| B[Builder on the current PR]
  MG -->|own thread, worktree| C[Builder that owns ticket 1 and its PR]
  MG -->|own thread, worktree| D[Builder that owns ticket 2 and its PR]
  C -.->|one read-only locator| C1[helper]
  A & B & C & D -->|report: status and evidence| MG
  MG --> RV[Reviewer<br/>different agent, clean context]
```

Depth is two: manager, then worker. A worker never starts workers, apart from
one read-only helper to find code. This is deliberate. Every extra level
multiplies cost and hides failures from the one session that holds the plan.

## Subagent or own thread

The test is where the result lands.

| The result | Placement |
|---|---|
| Lands on the branch this session is building | Subagent |
| Is a finding, not a change (search, review, research) | Subagent |
| Has to be integrated by the manager before anything is pushed | Subagent |
| Is its own PR and needs nothing unpublished from this session | Own thread |

Unsure means subagent. An own thread is the more expensive choice: it pays a
full cold start and it needs its own review slot.

## The clone gate

Before any builder starts, five things must be true: what to build is settled
for the size of the work, the ticket has no open question, nothing else is
working on it or in its way, a review slot is free, and the caps are respected.

The third point is the one that makes parallel work safe. Every ready ticket
names the files it may change in its `Touches` line. Two tickets with
overlapping `Touches` never run at the same time. A worktree separates files
and nothing else, so a ticket that starts a server or uses a local database
also names its port and database in `Runs on`. And a ticket that already has
a thread or an open PR is never started a second time.

## Caps, and why review is the real limit

| Mode | Builders | Reviews | Workers of any kind |
|---|---|---|---|
| Pilot | 1 | 1 | 3 |
| Steady | 4 | 2 | 6 |

A repository is in pilot mode until its profile says otherwise, and only the
owner changes that.

Builders are cheap to start. Review is not, and a person is usually the last
reviewer. If builders finish faster than reviews clear, the result is a queue
of stale PRs that conflict with each other. So the rule is: when two PRs are
waiting for review, start no builder.

Adding workers to late work makes it later. Each new worker has to be briefed,
its output has to be integrated, and its PR has to be reviewed.

## What parallel work costs

Each worker starts cold and reads its way in. So four workers on four tickets
should spend more tokens in total than one session doing the four in a row.
What they buy is wall-clock time, and a clean context per ticket, which should
improve accuracy on each one. This is reasoned from how the runs work. It has
not been measured here yet, and the run log exists to measure it.

So: run in parallel when the tickets are independent and time matters. Run in
sequence, with a handoff between tickets, when they are not or it does not.

## Models

The manager runs on the strongest model, because it holds the plan and judges
the results. Workers run on the cheapest model that fits their seat and risk.
Search and reading go to the fastest model. A review goes to a model from a
different provider than the author's every time, because a model from the
same family tends to miss what the author missed. With no other provider
available, only the owner can waive that, PR by PR.

```mermaid
flowchart LR
  T[Ticket: seat and risk] --> TI[Tier from the table]
  TI --> P{Provider can run it,<br/>quota above 15 percent?}
  P -- yes --> GO[Start the worker]
  P -- no --> O{Another provider,<br/>same tier?}
  O -- yes --> GO
  O -- no --> DR{Task tolerates<br/>a lower tier?}
  DR -- yes --> GO
  DR -- no, risky review or spec --> W[Wait, or ask the owner]
```

The table is `skills/dispatch/allocation.md`. It changes only when the run log
has at least ten rows for a task type and model.

## Machines

A second machine helps only if an agent can start work on it. In T3 Code that
requires the machine to be **linked**, not just paired. Until then the second
machine is used by hand. A machine with less than 16 GB of memory runs at most
two active workers.

## Operations

Running the fleet day to day.

- Put long runs on the always-on machine, not on a laptop. A laptop is only a
  window onto them.
- Every parallel agent loads its own copy of every MCP server, so keep that
  list short. Where a command-line tool exists, such as `gh`, prefer it. It
  costs nothing while it is not running.
- New T3 Code threads start with full access. Lower that default on day one.
  [dispatch](../skills/dispatch/SKILL.md) sets the mode each role runs in.
- In T3 Code, set three things:
  - a fallback model on another subscription,
  - auto-resume after a usage limit,
  - the cheapest model for text generation.
- A scheduled run uses the same permission mode as a thread. An approval
  prompt with nobody there waits and then times out, and the run is lost.
  Approve its recurring prompts once while you are at the desk. A step you
  would not approve ahead of time is left out: the run stops at a draft or
  a PR, and you take the step.
- A run that repeats is built to stay cheap: a fresh session per run, an
  event over a poll, a change check before a full pass, and live facts only.
  The rules and the weekly audit are in
  [the automation templates](../templates/automation/README.md).
- Agents on one machine share its files, its logins and its tokens. A
  sentence in a prompt does not keep one agent out of what another may touch.
  The boundary is what the agent cannot reach: a credential it was never
  given, a permission its account lacks, a mode that withholds the step. So
  give an unattended agent only the logins its job needs.

## What the manager keeps

The ledger: ticket, seat, worker, state, PR, open findings. It does not keep
the workers' transcripts, and it does not poll. When asked how a worker is
doing, it reads that worker, then answers.

## Failure modes this design is built against

| Failure | Guard |
|---|---|
| Two builders overwrite each other | `Touches` on every ticket, a worktree per builder |
| A worker says "done" and it is not | Status codes, quoted evidence, independent review |
| A worker reads the whole repository | The brief gives pointers and boundaries |
| The manager forgets state after a long run | The ledger, on the ticket or in a file |
| A PR bounces forever | A round cap, then a stronger seat or model |
| Fan-out burns a quota | Caps, the quota floor, the review limit |
| A worker starts its own workers | Depth of two, stated in every worker brief |
| Two builders fight over one port or database | `Runs on` on the ticket |
| The same ticket is started twice | The clone gate checks for a thread link and an open PR |
| A helper invents a file path | The locator reply format: only ranges it read, or "no relevant locations found" |
| A reviewer blocks on a hunch | A blocking finding needs a run that shows the failure |
| A capped loop is reported as a normal send-back | Outcome `capped` in the run log |
| An instruction arrives inside a worker's report | A report is a claim, never an order |
