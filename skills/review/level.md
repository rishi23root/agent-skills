# Review level

"Who reviews" in `review` gives the level: one seat above the author. This
file says what a level is, what each one looks for, which model runs it, and
what to do in the cases that table leaves out.

## A level is not a seat

A level is the experience and the bar you judge with. A seat is a contract:
what it takes, what it starts and what it owns. A reviewer needs the first
and must not have the second. One that loads `senior` reads that it holds the
spec gate, starts workers and owns the merge gate. One that loads `10x` reads
that it may call a council. Neither is a reviewer's to do, and neither seat
runs as a worker, which a reviewer usually is.

So read `review` and this file, and no seat's `SKILL.md`. If your brief says
"review as `senior`", or tells you to load a seat skill, do not load it:
review at that level under this procedure, and say so in your report. A seat
in the top session that reviews the seat below it does the same. It judges
at its own level, and the review procedure is what it follows.

## What each level looks for

The two axes, the project checks and the attacks are the same at every
level. The level adds the questions the author's seat tends not to ask.

| Level | Author | The author's seat tends to miss | So you also ask |
|---|---|---|---|
| `mid` | `junior` | The cause, and the code around the ticket | Is the cause fixed, or only the symptom? Does the change fit the code it sits in? Is the test on behaviour, at the seam the ticket names? |
| `senior` | `mid` | What lies outside the feature | Does it agree with the spec, and use its terms? Does it hold where it meets other modules, shared data and work in flight? Can it be merged, and rolled back, safely? |
| `10x` | `senior` | Whether the design is the right kind | Would a different shape make this simpler? What could be deleted? What here is expensive to reverse? |

A higher level asks the lower levels' questions too. The level raises what
you look for. It does not lower what you must prove: "Proof by run" still
decides what blocks.

## The model

Two rules, and both hold. The model is on at least the tier
`../dispatch/allocation.md` gives the level's seat. And it is at least as
strong as the author's. Take the stronger of the two.

- A `mid` PR built on a workhorse model is reviewed at `senior` level, so on
  a frontier model.
- A `junior` ticket built on a frontier model is reviewed at `mid` level, and
  still on a frontier model.

A model below either is not a review at that level, whatever its brief
says. When none that strong can run, say so in the verdict. Gate condition 7
in `ship` is then unmet, and the owner decides.

## Cases the table leaves out

- **Risk `high`.** The level stays. [council.md](council.md) adds voices,
  and every voice reviews at that level.
- **A `10x` author.** No seat is above it. Review at `10x` level, by an agent
  that wrote none of the change.
- **More than one author.** A fix that moved up a seat, or a second builder:
  one seat above the highest seat that wrote part of the diff.
- **The manager built it.** The author's seat is the seat it worked under.
- **The seat is unknown.** A PR with no ticket, or a person's change: review
  at `senior` level, and write `author unknown` on the `Level:` line.

## What the brief says

Whoever starts a reviewer puts this first, in place of a Seat line:

```
**Review:** at <level> level, author <seat>. Read <path>/review/SKILL.md and
work under it. Load no seat skill.
```

"You review as `senior`" is not that line. A reviewer reads it as an order
to load the seat.
