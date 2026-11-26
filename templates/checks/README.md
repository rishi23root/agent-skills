# Project checks

> Copy this folder into a project as `checks/` (or name another folder in the
> factory profile). The reviewer reads every file here and applies it to each
> diff. See `skills/review/SKILL.md`, "Project checks".

A check is a rule about this project that a linter cannot express and that you
are tired of repeating in reviews.

## Rules for a check file

- One rule per file. Name the file after the rule: `design-system.md`,
  `no-raw-sql.md`, `money-is-integer-cents.md`.
- Say what passes and what fails in plain words.
- Give at least one example that fails, as a path or a short snippet.
- Keep it under 20 lines. A long check is two checks.
- If a linter, a type or a test could enforce it, write that instead and
  delete the file. A check here costs reviewer tokens on every PR.

## What the reviewer returns

One line per file: `PASS`, or `FAIL` with `file:line` for each place. A `FAIL`
is at least an Important finding, so it blocks the merge.

## When to add one

When the same review comment has been made twice. Not before.
