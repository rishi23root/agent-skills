# Worker report format

Every worker ends with this report. The manager reads the first line and
decides what to do next.

```markdown
**Status:** DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
**Ticket:** <link>   **Branch / PR:** <name or URL, with the head commit>

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
| `DONE` | Acceptance checks met, with evidence | Send to review |
| `DONE_WITH_CONCERNS` | Built, but the worker doubts something | Read the concerns, then review |
| `NEEDS_CONTEXT` | A fact is missing. Work is paused, not failed | Answer, then resume the same worker |
| `BLOCKED` | Cannot finish as briefed | Change the ticket, seat or model |

## Rules

- Evidence is output the worker saw. Quote it. Do not summarise it as "tests
  pass".
- A check that was not run is listed as not run.
- A long report goes in a file or on the PR. The reply carries the status and
  the path.
- Never report `DONE` with an open question.
