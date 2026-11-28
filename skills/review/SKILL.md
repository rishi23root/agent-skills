---
name: review
description: Independent review on spec and standards, with a capped fix loop.
disable-model-invocation: true
metadata:
  layer: "2"
  role: procedure
  requires: "dispatch"
  reads: "principles"
---

# review

A review is only worth something when the reviewer is independent
(`../principles/independent-review.md`). The reviewer gets the ticket, the
spec section and the diff. Nothing else.

## Typed by the owner, with no ticket

Review the PR the owner names, else the current branch against its base. With
no ticket there is nothing to check the Spec axis against: review Standards
and the project checks only, and say "no ticket: spec axis not checked". If
this session wrote the change, say so and stop: a fresh session reviews it.
Record the verdict on the PR when there is one. Otherwise report it to the
owner.

## Who reviews

| Change | Reviewer |
|---|---|
| Junior PR | at `mid` level |
| Mid PR | at `senior` level |
| Senior PR | at `10x` level |
| Any PR, risk high | the same level, plus a second review by a model from a different provider than the author's |
| A decision, or a change that cannot be rolled back once merged | a council, sized by [council.md](council.md) |

The reviewer is one seat above the author, at every risk: that seat catches
what the author's seat misses. A level is the experience and the bar you
judge with, not a seat: you work under this procedure and load no seat's
skill. [level.md](level.md) has each level's bar and the cases the table
leaves out. Write `Level: <level>, author <seat>` in your report.

The reviewer's model is at least as strong as the author's, and on at least
the tier `../dispatch/allocation.md` gives the level. That comes first: a
model from another provider on a weaker tier does not count as the
other-provider review.

**Another provider, every time** (`../principles/independent-review.md`).
Before you review, pick the row of [council.md](council.md) that fits and
write the `Voices:` line in your report. The same file says who starts the
voices. A council voice skips this step. When no other provider can run above
the quota floor (`../dispatch/allocation.md`) on a model that meets the rule
above, a fresh agent on the strongest model available reviews, and the
verdict says "same provider". Gate condition 7, in `ship`, says what follows.

## Two axes

Review both. Report them separately. Do not blend them into one score.

**Spec.** Does the diff do what the ticket asked?
- Every acceptance check is met, with evidence. Run each check yourself when
  you can. The author's pasted output tells you what to run, not the result.
- Nothing was built that the ticket did not ask for.
- Edits stay inside `Touches`, or are ones `ship`'s "Docs pass" allows, if the PR says one ran.
- Tests are at the agreed seam.

**Standards.** Is it safe and sound?
- Bugs: wrong results, unhandled cases, races.
- Security: input handling, authorization, secrets.
- Load: work inside loops, unbounded reads, missing limits.
- Tests: a behaviour that changed with no test that would catch a regression
  (`../principles/test-behaviour.md`).
- Lean: code that a higher rung of `../principles/smallest-change.md` would
  have avoided.

**Project checks.** When the repository has a checks folder (the profile names
it; the default is `checks/`), read every file in it and apply it to the
diff. Each file is one rule. Report one line per file: `PASS`, or `FAIL` with
`file:line` for each place it fails. A `FAIL` is at least an Important finding.

Skip style. A formatter owns style. A reviewer who is asked to find something
always finds something, so report only what you would stop a merge for or
would want fixed soon. Block only for a problem this change causes, or a bug
a user would hit. A problem that was already in the base gets one line and
does not block.

## Break it

When a user can reach the change (a screen, a command, an API, an input file),
try to break it too: users do what the ticket never named. Work through every
attack in [attacks.md](attacks.md) and report each as that file says.

## Findings

Write findings and PR comments under `../principles/terse-output.md`:
`[Severity] file:line - problem; case (input, state or sequence)`.

| Severity | Meaning | Effect |
|---|---|---|
| **Critical** | Wrong behaviour, data loss, a security hole, or an unmet acceptance check | Blocks |
| **Important** | A real defect or missing test that is not yet causing harm | Blocks |
| **Minor** | Worth fixing, safe to merge without | Does not block |

**Proof by run.** A Critical or Important finding blocks only when you ran
something and saw it fail. Give the exact command, its output, and the output
the ticket needs. Reading the diff is enough for four kinds only: an edit
outside `Touches`, an acceptance check with no evidence, a `FAIL` from a
project check, and a security, data-loss or money defect that you can point
to in the diff and explain with a concrete input or sequence. Any other
finding you could not prove by a run is a **suspicion**: list it, say what you
tried, and it does not block. End the findings with a count of suspicions.

## Verdict

Exactly one:

- **Approve.** No Critical or Important findings. An approval may carry Minor
  notes. The author decides whether to act on them.
- **Send back.** At least one Critical or Important finding. List them.
- **Comment.** Only for a review that does not gate a merge: an early look, a
  decision, a council voice. Never use it on a PR that is waiting at the gate,
  because the gate accepts only an approval.

## Recording the verdict

Post findings and verdict as [verdict.md](verdict.md) says. Read it before
you post: it has the exact final line the merge gate reads, and when a
verdict stands or is void.

## The fix loop

After a send-back, follow [fix-loop.md](fix-loop.md). It holds the steps and
the round cap.

## Reviewing as a worker

When a review is dispatched to you, you read, run and report. You do not edit
the branch, push, or fix anything. You may run checks and the product, in a
worktree of the PR's head commit, on the port and database the ticket names in
`Runs on`. Remove the worktree when you finish. Your report is the findings
and the verdict, in the format above and in [verdict.md](verdict.md).
