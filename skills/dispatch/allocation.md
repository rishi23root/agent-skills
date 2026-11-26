# Model and effort allocation

## Tiers

Tiers are classes, not model names. Names change every few months. Ask the
harness what is available today and place each model in a tier.

| Tier | What it is for | Cost |
|---|---|---|
| **frontier** | Managing, specs, architecture, risky review, rescue | Scarce. Spend it on judgment |
| **workhorse** | Building features, fixing bugs, writing tests, routine review | Moderate |
| **fast** | Search, locating code, formatting, log reading, mechanical edits | Cheap |

## Seat to tier

| Work | Tier | Effort |
|---|---|---|
| Manager (`factory`, `senior` when dispatching) | frontier | high |
| `10x`: framing, council voice, rescue | frontier | highest available |
| `senior`: spec, risky review | frontier | high |
| `mid`: feature build, diagnosis, ticket slicing | workhorse | medium, or high when risk is high |
| `junior`: one ready ticket | workhorse | medium. Use fast for a purely mechanical ticket |
| Read-only search or locating code | fast | low |
| Review, risk normal | at least the author's tier | medium |
| Review, risk high | frontier | high |

Which provider reviews is decided by the review procedure, not here. This
table only sets the tier.

## Before choosing

1. **Ask what can run.** Query the harness for providers that can run a child
   task right now and have no blocking error. A provider that is logged out or
   disabled is not a candidate.
2. **Ask what is left.** Read each candidate model's remaining quota when the
   harness exposes it. If it does not, say so in the run log and go on.
3. **Apply the quota floor: 15 percent.** A model below the floor is skipped.
   - First switch to another provider's model in the same tier.
   - Only then drop one tier, and only if the task tolerates it.
   - Never drop a tier for a high-risk review or a spec. Wait, or ask the owner.
4. **Size the context.** Use a large context window only when the worker truly
   has to hold a large part of the repository. A focused ticket runs on the
   default window.

## Learn from the log

The run log records task type, model, effort and outcome. When one task type
has at least ten rows for a model, use its success rate to adjust this table.
Fewer rows than that is an anecdote. One bad run does not move a model down a
tier.

## Current examples

Hints only, checked 2026-11. The harness is the source of truth.

| Tier | Examples |
|---|---|
| frontier | Claude Fable 5.2, Claude Opus 5.5 |
| workhorse | Claude Sonnet 5.5 |
| fast | Claude Haiku 5.5 |

Add the other providers' models here once a run on this machine has confirmed
them. Do not copy names from memory.
