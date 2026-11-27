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
| `10x`: framing, council voice, rescue | frontier | high |
| `senior`: spec | frontier | high |
| `mid`: feature build, diagnosis, ticket slicing | workhorse | medium, or high when risk is high |
| `junior`: one ready ticket | workhorse | medium. Use fast for a purely mechanical ticket |
| Read-only search or locating code | fast | low |
| Titles, branch names and commit messages the harness writes with its own model | fast | low |
| Review, risk normal | the tier of the seat whose level it reviews at (`review/level.md`), and at least the author's tier | medium |
| Review, risk high | frontier | high |

Do not run the strongest model at its maximum effort by default: it costs far
more and is reported to do worse.

Which provider reviews is decided by the review procedure, not here. This
table only sets the tier.

## Family hint

A family is one provider's models. They share blind spots, so spread the work
when more than one provider can run:

| Work | Family |
|---|---|
| Builders | one provider |
| The playtester, who tries to break the change, and the reviewers | another provider than the builders' |
| The copywriter, who does the docs pass | a third provider, when one is available |

This is a preference under the quota floor below, not a rule above it. It
never puts a model below the floor into play, and never drops a tier. How many
voices review, and which of them must come from another provider, is decided
by `review/council.md`. This hint changes neither.

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

Hints only, checked 2026-11-27. The harness is the source of truth. **Run**
means a run on this machine confirmed the model. **Offered** means the harness
listed it but it has not been run. **Not placed** means no tier is recorded
yet: place it before you choose it.

| Tier | Provider | Model | Via | Status |
|---|---|---|---|---|
| frontier | Anthropic | Claude Fable 5.2, Claude Opus 5.5 | Claude Code | run not recorded |
| workhorse | Anthropic | Claude Sonnet 5.5 | Claude Code | run |
| fast | Anthropic | Claude Haiku 5.5 | Claude Code | run not recorded |
| not placed | OpenAI | `gpt-6-luna` | Codex | run (reviews), 2026-11-27 |
| not placed | Google | `gemini-4-neon`, `gemini-3.8-flash` | Antigravity | offered, 2026-11-27 |
| not placed | xAI | `grok-4.7` | Cursor | offered, 2026-11-27 |

The native Grok provider is disabled on this machine. Mark a model run only
after a run on this machine has confirmed it. Do not copy names from memory.
