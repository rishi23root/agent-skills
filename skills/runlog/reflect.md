# Reflect: turning lessons into changes

Run this when a lesson has shown up three times in the log, when the owner has
corrected the same mistake twice, or when the owner asks for a retro. It
proposes changes. It makes none until the owner agrees.

## 1. Collect

Read `runlog.mjs summary` and `runlog.mjs audit`, the lessons, the review
findings on the PRs involved, and the handoff notes. Read a transcript only
for the run that went wrong, and only the part around the mistake.

## 2. Filter

Keep a finding only when all three are true:

1. It will still be true in six months. It is not about one ticket.
2. It would change what a future agent does.
3. It points at a skill, script or check that the runs actually used.

## 3. Pick the strongest fix

Fix a class of mistake at the highest rung that can hold it:

1. A **mechanism**: a validator check, a script, a hook, a required CI check,
   a type. Nothing has to remember it.
2. A **project check**: one file in the project's checks folder that the
   reviewer applies to every diff.
3. A **principle or skill line**: prose. Use it only when 1 and 2 cannot
   express the rule, and write it once.

Anything a linter or a test could enforce does not become prose.

## 4. Propose

Give the owner three lists and wait:

- **Accepted:** the change, the file it goes in, and the evidence (rows,
  findings, PR links).
- **Rejected:** what you considered and dropped, with the filter it failed.
- **Backlog:** right, but not worth doing yet, or needs a tool you lack.

## 5. Test the change

A skill change is tested blind before it is merged: the scenarios and method
are in `evals/scenarios.md`, section F, in the factory repository (its path
is found as `../principles/locations.md` says). Record the result there. If the change
did not move a result, remove it.
