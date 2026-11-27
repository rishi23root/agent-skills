# The fix loop

The steps after a send-back, for `review`. The section of that name points
here.

1. The original author fixes what was sent back, with a clean context: the
   ticket, the PR and the findings.
2. The same reviewer rechecks: it marks every earlier finding and looks once
   through the fix diff, as [recheck.md](recheck.md) says.
3. Cap: **three rounds**. Five when risk is `high`. This is the only place
   the number is written. A round is one send-back and the recheck of its
   fixes. The cap is hit when the recheck of the last round still has a
   Critical or Important finding.
4. At the cap, stop. Move the ticket up one seat or to a stronger model, and
   record the unresolved findings in the ledger, or in the report to the owner
   when the work is too small to have one. The manager closes the run's log
   row with outcome `capped`, not `sent-back`.
   The same finding sent back twice is a sign the cause is misread:
   `../principles/attack-the-premise.md`.
5. The manager does not advance a ticket while a Critical or Important finding
   is open.
