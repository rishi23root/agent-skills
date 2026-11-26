# Brief format

One artifact, two readers. The first section is for the person who asked. The
rest is for the agent who builds.

```markdown
## What I understood

- Up to five plain sentences. No stack names, file names or type names.
- Each one is something the requester can accept or reject.
- Nothing they did not ask for.

## Agent brief

**Project:** name, and the spec, hub or issue this ties to
**Type:** bug | feature | refactor | research | ops | docs
**Size / Risk:** trivial | small | feature | project | fog  /  normal | high (why)
**Goal:** one sentence stating the outcome, not the activity

**Current behaviour:** what happens today that this request stands on
**Desired behaviour:** what is true when this is done, including the edge they named

**Pointers:** where to start reading (files, issue, spec section, commands).
These are places to look. They are not instructions to edit those files.

**Constraints:** conventions to follow, things that must not change

**Acceptance checks:**
- [ ] A check a stranger can run or observe, with the command when there is one

**Out of scope:**
- What a keen builder might add and should not

**Assumptions:** inferred facts and small choices made, each of which could be wrong
**Conflicts:** none, or one line per clash with the spec, an ADR or work in flight

## Open questions

- A question whose answer would change the design.
  **Recommended:** the answer you would pick, and why. "Yes" accepts it.
- Or: **Settle by prototype:** a question a quick experiment can answer.
- Or "None."

## Next step

Seat and stage this should go to, from the sizing table.
```

## Rules

- Behaviour, not procedure. Say what must be true, not which lines to change.
  File ownership (`Touches`) is set later by someone who has read the code: on
  the ticket for `feature` size and above, or as scope lines added to this
  brief for `small`. Pointers are not `Touches`.
- Anything you cannot make checkable without a missing fact is an open
  question, not an acceptance check.
- A recommended answer is not an assumption. Nothing is built on it until the
  owner says yes.
- A builder receives this brief. It never receives the raw transcript.
