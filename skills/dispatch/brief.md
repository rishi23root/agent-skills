# The worker brief

Section 5 of `dispatch` gives the brief. This file holds the rest: the brief
for a read-only worker, the permission mode each role starts in, and what
the brief may carry.

For a read-only worker (search, review, research, a council voice), replace
the Seat line with the one thing it must produce, and Boundaries with "Read
only. Change nothing." A reviewer is the exception: it changes nothing on the
branch, but it may run checks in its own worktree of the PR's head.
`review/level.md` has its first line. A worker that only locates code replies
in the locator format in [report-format.md](report-format.md).

**Locator fan-out.** When grounding spans three or more areas (modules,
folders or subsystems), do not read them yourself. Start one read-only locator
per area, all at once, within the caps in [SKILL.md](SKILL.md) section 2, on
the tier [allocation.md](allocation.md) gives for locating code. Each replies
in the locator format. Read that map, not the files. Under three areas, read
them yourself: a cold start costs more than a few reads. Only the top session
fans out. A worker keeps its one helper.

The role sets the permission mode. Start the worker in it
([harness.md](harness.md)): the line in the brief only tells the worker, and
the harness is what holds it.

- **Builder:** may accept its own edits, or run fully on its own, inside its
  own worktree only.
- **Reviewer, council voice, playtester, any other read-only worker:** the
  strictest mode that still runs checks with nobody there to approve them. It
  never edits. A real read-only lock is better, when the worker needs to write
  nothing in its checkout.
- **The manager:** the loosest mode any of its workers needs, at most fully on
  its own. It is supervised only when the owner is at the desk and nothing
  runs unattended.
- **No limits at all:** only in a throwaway sandbox, and never the manager.

No worker starts in a mode above the manager's own, so a supervised
manager's workers are all supervised. A mode that runs checks alone may allow
edits, so a verdict for another head and patch than you sent is void. Later,
the gate voids it on any push that changes the patch.

Only `junior` and `mid` run as workers. `senior` and `10x` work in the top
session.

Give links and paths. Do not paste the conversation, a notes folder, or file
contents. Paths must work from where the worker runs: a worker in another
worktree or on another machine cannot see files that are not in git. Reading
is where a worker's tokens go, so a narrow brief is the cheapest saving
available. One logged read-only run here used over 80,000 tokens.
