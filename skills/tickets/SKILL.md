---
name: tickets
description: >-
  Procedure. Slices a brief or spec into small vertical tickets with blocking
  edges and file ownership, and marks them ready for an agent.
disable-model-invocation: true
user-invocable: false
metadata:
  layer: "2"
  role: procedure
  requires: ""
---

# tickets

A ticket is ready when a builder with a clean context can finish it without
asking anything, and without colliding with any other builder.

## Slicing

1. **Vertical slices.** Each ticket delivers one thin behaviour through every
   layer it needs, and can be checked on its own. No schema-only, API-only or
   UI-only tickets.
2. **One sitting.** Aim for 100 to 200 changed lines and one PR. If a slice is
   bigger, cut it by behaviour, not by layer.
3. **Walking skeleton first.** The first ticket makes the thinnest end-to-end
   path work. Later tickets widen it.
4. **Blocking edges.** State what each ticket is blocked by. Use the tracker's
   native blocking links when it has them. The unblocked tickets are the
   frontier. Only the frontier is built.
5. **Durable wording.** The body describes behaviour and acceptance. It will
   still be true after a refactor. File paths appear only in the Technical
   Dependencies block.

## Marking a ticket ready

Read the code the ticket will change. Then add the block from
[ticket-format.md](ticket-format.md) and the `ready-for-agent` label.

A ticket is not ready if any of these is true:

- It has no `Touches` or no `Seam to test`.
- Its `Touches` overlaps a ticket that is being built now.
- It starts a server or uses a local database and has no `Runs on` line.
- A ticket that blocks it is still open and it does not name that ticket's
  branch as its base.
- It contains a question.

When risk is `high`, `senior` checks the block before the label goes on.

## Triage of an issue that already exists

Verify the claim before you size it: reproduce the bug, or find the place in
the spec the request stands on. Then move it to exactly one state:

| State label | Meaning |
|---|---|
| `needs-triage` | Nobody has looked yet |
| `needs-info` | Waiting on the reporter. Say exactly what is needed |
| `ready-for-agent` | Has the full block. A builder can start |
| `ready-for-human` | Needs a person: a decision, access, or a judgment call |
| `wontfix` | Out of scope or already covered. Say why |

Label names can differ per repository. The mapping lives in the repo profile,
`docs/agents/factory.md`.

## No tracker

When the repository has no tracker, tickets are files in `docs/tickets/`, one
per ticket, same format. The blocking edges go in the block. Commit them to
the base branch before any builder starts. A builder works in its own
worktree, and a file that is not in git does not exist there.
