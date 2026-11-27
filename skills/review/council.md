# Council

A council is the same question and the same evidence given to several strong
models from different providers, who answer apart before they see each other.
It exists because models from one family share blind spots, and because a
second opinion that was written after reading the first is not a second
opinion. `review` and `spec` both use it. So does `10x`.

## Decide every time

Every review, and every spec with a design choice in it, writes one line in
its report: `Council: <none | pair | three>, <reason>`. Read the table from
the top and take the first row that fits.

| The work | Voices |
|---|---|
| Two reviewers disagree on a blocking finding | **Three** |
| A spec or a decision where the options differ in kind, or the choice is expensive to reverse | **Three** |
| A review at risk `high` of a change that cannot be rolled back once merged, such as a deletion of data | **Three** |
| Any other review at risk `high` | **Pair.** The two reviewers the "Who reviews" table in `SKILL.md` already requires |
| Anything else | **None.** One independent reviewer, from another provider when one can run |

A council costs several times one review. Say so in the report, and do not
pick a higher row to be safe. The quota floor in `../dispatch/allocation.md`
applies to every voice.

## How it runs

1. **Who starts it.** The top session, through `../dispatch/SKILL.md` and
   inside its caps. If you are a worker, do not start one: put the `Council:`
   line and your reason in your report, and the manager starts it. A review
   already written counts as that provider's answer in round one.
2. **The voices.** Three models from three providers, each at the tier the
   allocation table gives a council voice. With fewer than three providers,
   say so and use what there is. Do not call it a council of three.
3. **Round one, apart.** Each voice gets the same question and the same
   evidence, and nothing from the others. For a review that is the ticket, the
   spec section and the diff. For a spec it is the brief, the options and what
   the code shows. Each gives every option a score from 1 to 10 with reasons,
   or for a review its findings and a verdict.
4. **Round two, once.** Show each voice the others' answers and let it revise.
   That is the last round.
5. **The result.** If they agree, that is the answer. If they do not, the
   disagreement is the finding. Report both sides and the owner decides.

A voice reads, runs checks and advises. It does not edit, push, start workers
or call for a council of its own.

## What a council does not replace

- **In review:** proof by run. A finding one voice proved by a run blocks,
  whatever the others scored. A split with nothing proven does not block:
  report it to the owner with the verdict. The session that ran the council
  writes the verdict and names the voices in the body of the comment. The
  `Factory-Review:` line keeps its exact format, because the gate reads it.
- **In spec:** the owner's yes. Record the scores under Decisions. A question
  the voices split on stays under Open questions.
