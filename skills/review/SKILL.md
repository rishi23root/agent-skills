---
name: review
description: >-
  Procedure. Independent review of a change on two axes, spec and standards,
  with severity, a verdict, and a capped fix loop.
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
| Junior PR, risk normal | `mid` |
| Mid PR, risk normal | another `mid` or `senior` |
| Any PR, risk high | `senior`, plus a second review by a model from a different provider than the author's |
| A decision, or a change that is very expensive to get wrong | a council: three voices or more, from different providers |

The reviewer's model is at least as strong as the author's.

**Another provider, every time** (`../principles/independent-review.md`).
Before you review, pick the row of [council.md](council.md) that fits and
write the `Voices:` line in your report. The same file says who starts the
voices. A council voice skips this step. When no other provider can run above
the quota floor (`../dispatch/allocation.md`), a fresh agent on the strongest
model available reviews, and the verdict says "same provider". The merge gate
treats that as unmet, at every risk, until the owner waives it.

## Two axes

Review both. Report them separately. Do not blend them into one score.

**Spec.** Does the diff do what the ticket asked?
- Every acceptance check is met, with evidence. Run each check yourself when
  you can. The author's pasted output tells you what to run, not the result.
- Nothing was built that the ticket did not ask for.
- Edits stay inside `Touches`.
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

## Findings

Each finding has a severity, a location, what is wrong, and a concrete case
that shows it (an input, a state, a sequence).

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

Post the findings and the verdict on the PR, so the record is with the change
and not in a chat. End the comment with one line that names the commit you
reviewed and the id of the patch:

```
Factory-Review: APPROVE <head commit> patch <patch id>
```

The patch id is the first field of `gh pr diff <PR> | git patch-id --stable`.
Use `SEND-BACK` or `COMMENT` in place of `APPROVE` as needed. The merge gate
reads this line. A verdict covers a patch, not a commit: after a rebase that
leaves the diff unchanged the patch id is the same and the verdict stands. If
the diff changed at all, the verdict is void and the new diff is reviewed.
When the reviewer has a different GitHub account from the author, also submit
a normal GitHub review.

## The fix loop

1. The original author fixes what was sent back, with a clean context: the
   ticket, the PR and the findings.
2. The same reviewer checks the fixes. Only the findings. Not a fresh sweep.
3. Cap: **three rounds**. Five when risk is `high`. This is the only place
   the number is written. A round is one send-back and the recheck of its
   fixes. The cap is hit when the recheck of the last round still has a
   Critical or Important finding.
4. At the cap, stop. Move the ticket up one seat or to a stronger model, and
   record the unresolved findings in the ledger, or in the report to the owner
   when the work is too small to have one. The manager closes the run's log
   row with outcome `capped`, not `sent-back`.
   The same finding sent back twice is a sign the cause is misread:
   `../principles/attack-the-premise.md`.
5. The manager does not advance a ticket while a Critical or Important finding
   is open.

## Reviewing as a worker

When a review is dispatched to you, you read, run and report. You do not edit
the branch, push, or fix anything. You may run checks and the product, in a
worktree of the PR's head commit, on the port and database the ticket names in
`Runs on`. Remove the worktree when you finish. Your report is the findings
and the verdict, in the format above.
