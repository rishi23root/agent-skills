---
name: spec
description: Writes a spec from a brief and takes it through the spec gate.
disable-model-invocation: true
metadata:
  layer: "2"
  role: procedure
  requires: "improve dispatch"
  reads: "review"
---

# spec

The spec is the contract between the person who asked and everyone who builds.
The spec gate is the rule that no build starts until that contract is Accepted.
The gate exists because a builder who meets a hole in the spec fills it with a
guess, and guesses compound.

## Typed by the owner, with no ticket

A spec starts from a brief. With no accepted brief, read
`../improve/SKILL.md`, write the brief and show it. Go on only when the owner
accepts it and the table below says this size needs a spec. For `trivial` or
`small`, say that the brief is the spec and stop.

## When a full spec is needed

| Size | What serves as the spec |
|---|---|
| trivial, small | The agent brief is the spec. Skip this procedure. |
| feature | The brief plus the Interfaces and Seams sections below, on the parent ticket. |
| project | A full spec, as below. |

## Where it lives

On the tracker when one is configured, as the parent issue. Otherwise in
`docs/specs/<short-name>.md`. One spec, one place. Notes elsewhere link to it.

## Contents

```markdown
# <Name>
**Status:** Draft | Accepted (by whom, date) | Superseded by <link>

## Problem
Who has it, what happens today, why it matters now.

## Behaviour
What is true when this ships, written as things a user or caller can observe.
Use the glossary's words. A new term gets one definition here and is then added
to the glossary.

## Interfaces
The public surfaces this adds or changes: commands, endpoints, function
signatures, events, schema. Enough that two builders would produce parts that
fit together.

## Seams to test
The highest boundary at which each behaviour can be checked, and the check.
Tests go here, not inside the implementation.

## Acceptance
- [ ] Checks a stranger can run or observe.

## Out of scope

## Risks
What could go wrong, what is hard to undo, and how it would be rolled back.

## Open questions
Must be empty for the spec to be Accepted.

## Decisions
One line each, with the reason. A decision that is expensive to reverse also
gets an ADR.
```

## The gate

A spec is **Accepted** when all of these hold:

1. Open questions is empty. Questions were answered by the owner or by
   evidence, not by the writer picking a default.
2. Every behaviour has a seam and a check.
3. The interfaces are specific enough to slice into tickets.
4. Out of scope names the obvious temptations.
5. The owner said yes. Record who and when in the Status line.

**Waiver.** For a tiny local fix, `senior` may write "Spec waived: <reason>" on
the ticket. The waiver is the record. Use it rarely.

## Getting to Accepted

- **Use a council for a choice that is expensive to reverse.** When the
  options differ in kind, or you want to see how models from several
  providers would trade them off, pick the row in `../review/council.md`. It
  says who starts the voices, through `dispatch`, and where the scores go.
- Ask the owner about open questions in one batch, each with the options and
  what each option costs. Questions the code can answer, you answer by reading
  the code.
- Challenge fuzzy terms. If two words are used for one thing, pick one and fix
  the glossary.
- If the same question survives two rounds, the gate is stuck. Escalate to
  `10x`.

Once Accepted, the spec changes only by a recorded decision. A builder who
finds it wrong stops and reports. They do not quietly build something else.
