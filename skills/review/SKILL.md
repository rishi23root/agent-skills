---
name: review
description: >-
  Procedure. Independent review of a change on two axes, spec and standards,
  with severity, a verdict, and a capped fix loop.
disable-model-invocation: true
user-invocable: false
metadata:
  layer: "3"
  role: procedure
  requires: ""
---

# review

A review is only worth something when the reviewer is not the author and has
not watched the author work. The reviewer starts with a clean context and gets
the ticket, the spec section and the diff. Nothing else.

## Who reviews

| Change | Reviewer |
|---|---|
| Junior PR, risk normal | `mid` |
| Mid PR, risk normal | another `mid` or `senior` |
| Any PR, risk high | `senior`, plus a second review by a model from a different provider than the author's |
| A decision, or a change that is very expensive to get wrong | a council of three, through `10x` |

The reviewer's model is at least as strong as the author's. The author never
reviews, approves or merges their own change.

When no second provider can run, the high-risk review is still done, by a
fresh agent on the strongest model available, and the verdict says "same
provider". The merge gate treats that as unmet until the owner waives it.

## Two axes

Review both. Report them separately. Do not blend them into one score.

**Spec.** Does the diff do what the ticket asked?
- Every acceptance check is met, with evidence.
- Nothing was built that the ticket did not ask for.
- Edits stay inside `Touches`.
- Tests are at the agreed seam.

**Standards.** Is it safe and sound?
- Bugs: wrong results, unhandled cases, races.
- Security: input handling, authorization, secrets.
- Load: work inside loops, unbounded reads, missing limits.
- Tests: a behaviour that changed with no test that would catch a regression.
- Lean: code that could be deleted, or a helper that already existed.

Skip style. A formatter owns style. A reviewer who is asked to find something
always finds something, so report only what you would stop a merge for or
would want fixed soon.

## Findings

Each finding has a severity, a location, what is wrong, and a concrete case
that shows it (an input, a state, a sequence).

| Severity | Meaning | Effect |
|---|---|---|
| **Critical** | Wrong behaviour, data loss, a security hole, or an unmet acceptance check | Blocks |
| **Important** | A real defect or missing test that is not yet causing harm | Blocks |
| **Minor** | Worth fixing, safe to merge without | Does not block |

A finding without a concrete case is a suspicion. Label it as one.

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
reviewed:

```
Factory-Review: APPROVE <head commit>
```

Use `SEND-BACK` or `COMMENT` in place of `APPROVE` as needed. The merge gate
reads this line. A verdict for an older commit does not count for a newer one.
When the reviewer has a different GitHub account from the author, also submit
a normal GitHub review.

## The fix loop

1. The original author fixes what was sent back, with a clean context: the
   ticket, the PR and the findings.
2. The same reviewer checks the fixes. Only the findings. Not a fresh sweep.
3. Cap: **three rounds**. Five when risk is `high`. This is the only place
   the number is written.
4. At the cap, stop. Move the ticket up one seat or to a stronger model, and
   record the unresolved findings in the ledger, or in the report to the owner
   when the work is too small to have one.
5. The manager does not advance a ticket while a Critical or Important finding
   is open.

## Reviewing as a worker

When a review is dispatched to you, you read and report. You do not edit the
branch. Your report is the findings and the verdict, in the format above.
