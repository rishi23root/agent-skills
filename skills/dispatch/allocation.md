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

The owner's choice comes first: when the repo profile
(`docs/agents/factory.md`) has a Families line, use it, and use this table for
what it leaves out.

This is a preference under the quota floor below, not a rule above it. It
never puts a model below the floor into play, and never drops a tier. How many
voices review, and which of them must come from another provider, is decided
by `review/council.md`. This hint changes neither.

## Before choosing

1. **Ask what can run.** Query the harness for providers that can run a child
   task right now and have no blocking error. A provider that is logged out or
   disabled is not a candidate. A provider that asks a person to approve each
   command is a candidate only while the owner is at the desk and watching
   that run.
2. **Ask what is left.** Read each candidate model's remaining quota when the
   harness exposes it. If it does not, say so in the run log and go on.
3. **Apply the quota floor: 15 percent.** A model below the floor is skipped.
   - First switch to another provider's model in the same tier.
   - Only then drop one tier, and only if the task tolerates it.
   - Never drop a tier for a high-risk review or a spec. Wait, or ask the owner.
4. **Rank what is left.** In the tier the work needs, order the candidates
   best first, as "Rank within a tier" says, and take the first. For a
   review, the provider rules (`../principles/independent-review.md`,
   `review/council.md`) filter the list before it is ranked.
5. **On a failed start, take the next.** A model that fails to start, or
   errors before it does any work, is skipped. Start the next candidate at
   once, without asking the owner: a failed start is not a decision for them.
   Name each skipped model and its error in your report, and log it as a
   `BLOCKED` run. Ask the owner only when no candidate is left in the tier.
   For a review, an empty list is not yet that point: run the same-provider
   review that `review/SKILL.md` gives under "Who reviews", and the gap
   reaches the owner at the gate. Step 3 still holds: never drop a tier for
   a high-risk review or a spec.
6. **Size the context.** Use a large context window only when the worker truly
   has to hold a large part of the repository. A focused ticket runs on the
   default window.

## Rank within a tier

Quality decides the order, not the provider. Use these sources, the first
that has an answer:

1. **The run log.** It records task type, model, effort and outcome. When one
   task type has at least ten rows for a model, use its success rate to
   order it and to adjust this table. Fewer rows than that is an anecdote.
   One bad run does not move a model down a tier. Leave out the `BLOCKED`
   rows of failed starts: they measure the route, not the model.
2. **Public coding leaderboards.** Read more than one, and write down the
   date. They often disagree, so none decides alone: a model near the top of
   most of them ranks high, and one that leads a single list does not. None
   of them measures code review. Read them again each month.
3. **No source separates two models.** Prefer the one that can run with
   nobody there, then the one with more quota left.

A run on this machine shows that a model can run. It does not rank it.

## Current examples

Hints only, checked 2026-11-27. The harness is the source of truth. **Run**
means a run on this machine confirmed the model. **Offered** means the harness
listed it but it has not been run. **Not placed** means no tier is recorded
yet: place it before you choose it. Within a tier, rows are in rank order,
best first.

| Tier | Provider | Model | Via | Status |
|---|---|---|---|---|
| frontier | Anthropic | Claude Opus 5.5 | Claude Code | run (manager, builds, reviews), 2026-11-27. Near the top of three of four leaderboards read on 2026-11-27 (llm-stats, BenchLeader, AI Stupid Level) |
| frontier | Anthropic | Claude Fable 5.2 | Claude Code | run not recorded. At or near the top of all four leaderboards read on 2026-11-27. Not run on this machine |
| frontier | OpenAI | `gpt-6-luna` | Codex | run (reviews, unattended), 2026-11-27. No leaderboard read on 2026-11-27 lists it by this name. Placed in frontier because it is the reviewer the owner chose and its reviews held; place it again when a leaderboard lists it |
| frontier | Google | `gemini-4-neon` | Antigravity, Cursor | offered, 2026-11-27. First on one leaderboard (BenchLM). Antigravity asks the owner to approve each command, so it runs only while the owner watches. Cursor failed to start twice on 2026-11-27 |
| workhorse | Anthropic | Claude Sonnet 5.5 | Claude Code | run |
| fast | Anthropic | Claude Haiku 5.5 | Claude Code | run not recorded |
| not placed | Google | `gemini-3.8-flash` | Antigravity | offered, 2026-11-27 |
| not placed | xAI | `grok-4.7` | Cursor | offered, 2026-11-27 |

`gemini-4-neon` and `gpt-6-luna` are not separated by any source yet. For
work nobody watches, `gpt-6-luna` goes first, because it runs unattended.

The native Grok provider is disabled on this machine. Mark a model run only
after a run on this machine has confirmed it. Do not copy names from memory.
