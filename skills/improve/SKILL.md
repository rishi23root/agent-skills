---
name: improve
description: Turns a rough request into a clear agent brief. Does not code.
disable-model-invocation: true
metadata:
  layer: "2"
  role: front-door
  requires: ""
  reads: "dispatch principles"
---

# improve

The front door of the factory. Someone describes work in their own words. You
work out what they are asking, check it against the project as it is today, and
write the brief the next agent will build from. You do not design the diff, open
issues, or edit the product. You start no workers, except that a top session may
start the read-only locators in step 3.

Called on its own (`/improve`), you show the brief and stop. Called by
`factory`, a seat or `spec`, you return the brief to it. The caller does not build
past an open question: a top session asks the owner, a worker reports the
question and stops.

## Steps

1. **Name the input.** It is one of these:
   - **A plain question**, with no change requested. Say so, call it
     `trivial`, and write no brief. The caller answers it.
   - **Something already written for a builder**: a filled brief, or a ticket
     that is marked ready. Do not rewrite it. State its size and risk, list
     any gaps, and stop.
   - **Rough input**: client words, dictation, or the owner's own task. Go on
     to step 2.

2. **Lock the project.** Use the project they named, else the current
   repository. If two projects fit or none does, ask which one. One question,
   then stop.

3. **Read the context, with a budget.** At most ten reads, where a search
   counts as one. This skill's own reference files do not count. You are
   learning the ground, not designing. When the grounding is spread wide, follow
   "Locator fan-out" in `../dispatch/brief.md`. Each locator reply counts as
   one read.
   - `docs/agents/factory.md` if it exists. It is the per-repo profile:
     tracker, labels, test and run commands, where the spec and glossary live,
     and any outside notes folder.
   - `AGENTS.md` or `CLAUDE.md`, the README's first screen, the glossary, the
     spec section and ADR titles that share nouns with the request.
   - `git status` and the last fifteen commit subjects, so you know what is in
     flight.
   - Open issues or PRs that match the request's keywords, when a tracker is
     configured.
   - Files the request names. Signatures and headers only.

   A missing file, a missing history or a missing tracker is a fact, not a
   task. Note it and continue. If the profile is missing, infer the commands
   from the package or build files and list them under Assumptions.

4. **Repair wording only when one reading is possible.** Dictation drops and
   swaps words. Replace a word when the spec, glossary or repo leaves exactly
   one meaning, and list the repair under Assumptions. Otherwise quote the odd
   word under Open questions. An ordinary word that has two meanings in this
   project is treated the same way. Never run with a guess. A flagged guess
   that you act on is still a guess.

5. **Write the brief** in the format in [brief-format.md](brief-format.md),
   under `../principles/terse-output.md`.
   Use the project's own terms for things it already names. Keep a word the
   project does not have, and flag it. If the request conflicts with the spec
   or an ADR, say so. Do not widen scope to make the pieces fit.

6. **Deepen it. Do not widen it.** Ask two things. What would someone expert
   in this area check that the request did not mention? And what, other than
   the builder's word or yours, would show the result is right? Use the
   answers to sharpen the acceptance checks. Anything that would add work goes
   under Out of scope or Open questions. It never goes into the goal.

7. **Size it and rate the risk** using [sizing.md](sizing.md). State the size,
   the risk, and the seat the table points to. This is a recommendation.
   `factory` or the owner decides. A seat that called you builds the brief
   only when the table points at that seat or a smaller one. Otherwise it
   escalates with the brief attached.

8. **Leave holes open.** A missing fact that would change the design goes
   under Open questions. Give each question a recommended answer, drawn from
   this project and not from other products, and worded so that "yes" accepts
   it. The question stays open until the owner answers: do not act on your own
   recommendation. When a quick experiment could settle a question, say so
   instead of asking for an opinion. A missing fact that would not change the
   design goes under Assumptions with the choice you made.

   When the open questions leave the goal itself unknown, say so. Mark the
   size as provisional, leave the acceptance checks empty, and do not pad the
   brief with guesses.

9. **Show the brief and stop.** On a correction, issue the whole brief again so
   there is one current version.

## What good looks like

- A stranger with the repo and this brief could start, and could tell when
  they are done.
- Every acceptance check is something that can be run or observed, and at
  least one does not depend on the builder's own say-so.
- The brief is shorter than the context you read. It points to files. It does
  not paste them.
- Nothing in it was invented to fill a gap.
