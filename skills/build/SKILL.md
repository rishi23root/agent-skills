---
name: build
description: >-
  Procedure. Implements one ticket: failing check first, smallest change that
  passes, observed proof, self-check, commit, report.
disable-model-invocation: true
user-invocable: false
metadata:
  layer: "3"
  role: procedure
  requires: ""
  reads: "dispatch principles"
---

# build

One ticket, one branch, one small change, proven.

## Before you write anything

1. Read the ticket or brief fully. State its title and its acceptance checks
   back in one line each.
2. Confirm the scope is written down. Your edits stay inside `Touches`. If
   the work cannot be done inside it, stop and report. Do not widen it
   yourself.
   - A ticket carries its scope in the Technical Dependencies block.
   - A `small` brief has no ticket. Its scope is three **scope lines** added
     to the brief by whoever hands it to you, after reading the code:
     `Touches`, `Must not touch` and `Seam to test`.
   - If you are the top session and nobody has written them, read the code
     the change needs and write them into the brief before your first edit.
   - If you are a worker and they are missing, stop with `NEEDS_CONTEXT`.
3. Work in a branch or worktree cut from the ticket's `Base`, or from the
   default branch when there is no ticket. Never build on the default branch
   itself.
4. Run the existing checks once, before changing anything, so you know what
   was already failing.

## The loop

1. **Red.** Write the check that shows the behaviour is missing, at the
   ticket's `Seam to test` (`../principles/test-behaviour.md`). For a bug,
   this is the reproduction. Run it and watch it fail for the right reason.
2. **Green.** Make the smallest change that passes, by the ladder in
   `../principles/smallest-change.md`.
3. **Refactor** only what you touched, and only while the checks stay green.
4. Repeat for the next acceptance check.

While you work, run the type check and the one test file often. Run the full
suite once, at the end.

## Bugs with an unknown cause

Do not patch a symptom. Reproduce it, make the reproduction as small as you
can, list the possible causes in order of likelihood, and test the cheapest one
to rule out first. Fix it in the layer that owns the cause. Leave the
reproduction behind as a regression test.

Prove the fix on the same surface where the bug was reproduced. A bug seen in
the running app is not proven fixed by a unit test alone. Paste the failing
output and then the passing output. A run that was inconclusive is not a pass.

## Prove it

Run the smallest set of checks that covers your diff: the new checks, the
module's tests, the type check and the linter. Run the whole suite when the
change touches shared code. Use the commands in the repo profile
(`docs/agents/factory.md`) when it exists.

You must have seen the output. Report each check as passed, failed or not
run, as `../principles/evidence.md` defines them.

For a change a user can see, run the product and look at it. A passing unit
test with everything mocked is not proof that the feature works.

## Self-check, then commit

Read your own diff once as a stranger would. Look for: anything outside
`Touches`, leftover debug output, code the ticket did not ask for, a check that
passes for the wrong reason. Then commit with a message that states the
behaviour that changed and why.

A self-check is not a review. The review comes from someone else.

## Stop conditions

Stop and report, with status `NEEDS_CONTEXT` or `BLOCKED`, when:

- A needed fact is missing.
- The work needs a file outside `Touches`.
- The same check has failed three times after three different attempts. After
  the second, test the belief first (`../principles/attack-the-premise.md`).
- You find the ticket or the spec is wrong.

## Report

Use `../dispatch/report-format.md`, whether you are a worker or working in the
manager's own session.
