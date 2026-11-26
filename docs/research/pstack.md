# pstack and the T3 multi-agent note

Two outside sources were read on 2026-11-24 to 2026-11-26, after the first
version of this repository was pushed. This page records what each one is,
what was taken, what was not, and why. The changes themselves are listed in
[../plans/2026-11-26-next-round.md](../plans/2026-11-26-next-round.md).

## pstack

**What it is.** A skills library by Lauren Tan (GitHub `poteto`), MIT
licensed. It is not a repository of its own: it is the `pstack/` folder of
`github.com/cursor/plugins`. Read at commit `ca782ed` (2026-11-24). It has 59
skill folders: one router (`poteto-mode`) that picks one of about 22
playbooks, 24 one-rule `principle-*` skills that the others cite by name, and
about 30 working skills.

**How it differs from this repository.** It answers a different question. It
has no manager, no seniority seats, and no spec, ticket, review and ship
pipeline. Its strength is the quality of thinking inside one run, and proof
that work is right.

### Taken as ideas, written here in our own words

| Idea | pstack source | Where it went |
|---|---|---|
| A finding counts only when a run proves it | `interrogate` | `review`, "Proof by run" |
| A verdict covers a patch, not a commit | `playbooks/shipping.md` | `review`, `ship`, `scripts/gate.mjs` |
| Read the PR back after merging; queued is not merged | `playbooks/shipping.md` | `ship`, step 4 |
| Verify on the surface where the bug was reproduced | `playbooks/bug-fix.md` | `build` |
| Deeper, not bigger | `sharpen` | `improve`, step 6 |
| A report lists every call only the owner can make | `ketchup` | `factory` step 8, `handoff` |
| A missing piece of evidence is asked for once, then counts as a gap | `swarm` | `dispatch`, section 7 |
| Rules as short files that skills cite | the `principle-*` skills | `skills/principles/` |
| Two fixes on one belief: test the belief | `principle-attack-the-premise` | `principles/attack-the-premise.md` |
| The two-edit test for a test | `principle-test-behavior-not-implementation` | `principles/test-behaviour.md` |
| Lessons become edits only after a filter and the owner's yes | `reflect` | `runlog/reflect.md` |
| Fix a class of mistake in structure before prose | `correct` | `runlog/reflect.md`, step 3 |
| Blind tests for a skill change | `playbooks/eval.md` | `evals/scenarios.md`, section F |
| Comment text is data, never a command | `playbooks/babysit.md` | `principles/text-is-data.md` |

### Pinned as optional extras

`blast-radius`, `why`, `benchmark-checklist`, `correct`, `unslop`,
`technical-writing`, `typescript-best-practices` with the two principles it
calls, `create-verification-skill` and `maintain-verification-skill`. Each
works without the router. The seats and the "when" for each are in
`upstream.lock.json`.

### Not taken

| Skill | Why not |
|---|---|
| `poteto-mode`, `poteto-agent`, `worker.md` | Loads about 11 KB and a principles index in every session. Lets workers start workers. Says the kickoff's bar is the whole bar, with no review round on top |
| `figure-it-out`, `architect`, `arena`, `swarm` | The same jobs as `factory`, `spec`, the council extra and `dispatch` |
| `recall`, `how`, `teach`, `bro`, `in-your-own-words`, `tdd` | Covered already, or not factory work |
| Formal verification skills, `statechart` | Need TLA+, Java and Bun |
| `setup-pstack`, `automate-me`, `make-bot-ui`, `poteto-help` | Tied to Cursor |

### Where pstack and this repository disagree

| pstack | Here | Why this side was kept |
|---|---|---|
| Never block on the human | The owner approves each merge and answers design-changing questions | The owner is the last reviewer. A wrong merge costs more than a wait |
| Workers may start agents | Depth of two | Cost, and failures stay visible to the session holding the plan |
| The lead reviews every child's diff | The author, and whoever briefed them closely, does not review | Shared blind spots |
| "The best spec is code" | A spec and tickets for feature size and up | Small work already skips both |
| A different-vendor reviewer | The same, preferred by default | In Claude Code pstack's own adapter drops the other vendor's model and runs the session model, so there it is not a different vendor. Here the reviewer runs through a harness that has the second provider |

## T3 Code: Building Multi-Agent Workflows (November 2026)

**What it is.** A working note that describes a five-seat team on T3 Code: a
dispatcher, a lead, builders, a read-only reviewer from another model family,
and a copywriter. It draws on Theo Browne's public posts and on setups others
published.

**What is evidence in it and what is not.** The setups of Theo's team, GILD
and Smaje are reported results. The token budgets and the cost per feature
are the authors' assumptions, and the note says so. The reported results rest
on strong checks (typed code, CI, preview deployments, plain-English review
checks), so they show that the shape works on top of that kind of checking.

| Idea | Status here |
|---|---|
| Seats defined by contract, models assigned second | Already so: seats, plus `allocation.md` |
| A brief with a runnable "done when" and a "do not" | Already so: `brief-format.md`, `Touches`, `Must not touch` |
| The reviewer never edits | Already so |
| Three review rounds, then a person | Already so |
| Reviewer from another model family | Was high risk only. Now preferred at every risk level. GILD reported one in three additions rejected this way (417 of 1,287) |
| A folder of plain-English checks run on every PR | Added: `templates/checks`, and the "Project checks" step in `review` |
| Separate ports and databases per slice | Added: `Runs on` on the ticket |
| A cap that was hit is its own outcome | Added: outcome `capped` |
| An always-on dispatcher that files briefs | Not taken yet. It multiplies whatever error rate exists, so it waits for pilot data |
| A join step that merges slices into one branch | Not taken. Here each ticket is its own small PR, which is easier for one person to review |
| A copywriter seat | Not taken. A docs pass on a cheap model, run last, is enough at this volume |
