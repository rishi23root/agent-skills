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
   shell command is skipped only for unattended work that runs commands:
   building, reviewing, running checks. It stays a full candidate for work
   that runs none (reading files, locating code, research, docs and copy),
   and for any work the owner is watching.
2. **Ask what is left.** Read each candidate model's remaining quota when the
   harness exposes it. If it does not, say so in the run log and go on.
3. **Apply the quota floor: 15 percent.** A model below the floor is skipped.
   - First switch to another provider's model in the same tier.
   - Only then drop one tier, and only if the task tolerates it.
   - Never drop a tier for a high-risk review or a spec. Wait, or ask the owner.
4. **Choose by fit.** In the tier the work needs, the families left are
   peers. Pick one as "Fit within a tier" says. For a review, the provider
   rules (`../principles/independent-review.md`, `review/council.md`)
   filter the list first.
5. **On a failed start, take the next.** A model that fails to start, or
   errors before it does any work, is skipped. Start another candidate in the
   tier at once, without asking the owner: a failed start is not a decision for them.
   Name each skipped model and its error in your report, and log it as a
   `BLOCKED` run. Ask the owner only when no candidate is left in the tier.
   For a review, an empty list is not yet that point: run the same-provider
   review that `review/SKILL.md` gives under "Who reviews", and the gap
   reaches the owner at the gate. Step 3 still holds: never drop a tier for
   a high-risk review or a spec.
6. **Size the context.** Use a large context window only when the worker truly
   has to hold a large part of the repository. A focused ticket runs on the
   default window.

## Fit within a tier

No family is another's fallback. Within a tier the families are peers that
do well at different work. Choose by these, the first that decides:

1. **The run log.** It records task type, model, effort and outcome. When one
   task type has at least ten rows for a model, its success rate decides
   for that task type, and adjusts this table. Fewer rows than that is an
   anecdote. One bad run does not move a model down a tier. Leave out the
   `BLOCKED` rows of failed starts: they measure the route, not the model.
2. **Role and spread.** Give the role to the family the Family hint gives
   it, so builder, reviewer and copywriter sit on different families.
3. **Quota.** Of the peers still equal, take the one with more quota left.

Public leaderboards help place a new model in a tier. They do not order the
models inside one. A run on this machine shows that a model can run. It does
not rank it either.

## Current examples

Hints only, checked 2026-11-28. The harness is the source of truth. **Run**
means a run on this machine confirmed the model. **Offered** means the harness
listed it but it has not been run. **Not placed** means no tier is recorded
yet: place it before you choose it. Rows within a tier are peers, in no order.

| Tier | Provider | Model | Via | Status |
|---|---|---|---|---|
| frontier | Anthropic | Claude Opus 5.5 | Claude Code | run (manager, builds, reviews), 2026-11-27 |
| frontier | OpenAI | `gpt-6-luna`, effort high | Codex | run (reviews, unattended), 2026-11-27 |
| frontier | Google | `gemini-4-neon` | Antigravity, Cursor | offered, 2026-11-28 |
| workhorse | Anthropic | Claude Sonnet 5.5 | Claude Code | run |
| workhorse | OpenAI | `gpt-6-luna`, effort low or medium | Codex | run at medium (a recheck), 2026-11-28 |
| workhorse | Google | `gemini-4-carbon`, `gemini-4-argon` | Antigravity, Cursor | offered, 2026-11-28 |
| fast | Anthropic | Claude Haiku 5.5 | Claude Code | run not recorded |
| fast | Google | `gemini-3.8-flash` | Antigravity, Cursor | offered, 2026-11-28 |
| not used | Anthropic | Claude Fable 5.2 | Claude Code | the owner's choice |
| not placed | xAI | `grok-4.7` | Cursor | offered, 2026-11-27 |

Antigravity asks the owner to approve each shell command, so step 1 limits
it for unattended work. Cursor failed to start twice on 2026-11-27. The
native Grok provider is disabled on this machine. Mark a model run only
after a run on this machine has confirmed it. Do not copy names from memory.
