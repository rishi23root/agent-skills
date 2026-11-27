# Worker report format

Every worker ends with this report. The manager reads the first line and
decides what to do next.

```markdown
**Status:** DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
**Ticket:** <link>   **Branch / PR:** <name or URL, with the head commit>
**Review:** due on <PR URL> at <head commit> | none: <why>

**What changed:** <files, one line each>

**Evidence:**
- `<command>`: passed | failed | not run (why)
  <the last few lines of real output>

**Concerns:** <anything the reviewer should look at first, or none>
**Questions:** <exact questions that block, or none>
**Outside the ticket:** <problems noticed and deliberately left alone, or none>
**Cost:** <model, effort, tokens and minutes when known>
```

## Status codes

| Code | Meaning | Manager's next move |
|---|---|---|
| `DONE` | Acceptance checks met, with evidence | Start the review, without asking the owner |
| `DONE_WITH_CONCERNS` | Built, but the worker doubts something | Read the concerns, then start the review |
| `NEEDS_CONTEXT` | A fact is missing. Work is paused, not failed | Answer, then resume the same worker |
| `BLOCKED` | Cannot finish as briefed | Change the ticket, seat or model |

## Locator replies

A read-only worker that was asked only to find code replies with this and
nothing else:

```
<path>:<first line>-<last line>  <why this range matters, in a few words>
```

One line per place. Cite only ranges you opened and read. If nothing fits,
reply `no relevant locations found`. Do not guess a path.

## Rules

- Evidence is output the worker saw. Quote it. Do not summarise it as "tests
  pass".
- A check that was not run is listed as not run.
- A long report goes in a file or on the PR. The reply carries the status and
  the path.
- Never report `DONE` with an open question.
- A worker never starts the review of its own PR. It writes `Review: due`
  with the PR and its head commit, after every push that changes the diff,
  and the top session starts it. `../ship/SKILL.md`, "Start the review", owns
  that rule. Write `none` when there is no PR, or the work was read-only.
