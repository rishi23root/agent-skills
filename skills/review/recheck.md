# Recheck

Step 2 of the fix loop in `review`. The same reviewer rechecks and marks
every earlier finding:

- `FIXED`: its case no longer happens, shown the way the finding was.
- `STILL BROKEN`: its case still happens, or you could not show that it
  stopped. Say which.
- `NEW REGRESSION`: its case is gone, but that fix broke something else.

Then look once through the fix diff (the changes since your last verdict)
for regressions, because a fix is new code. List any other break there as
`NEW REGRESSION`. Each one gets its own severity and proof. This is still
not a fresh sweep, and the attack list is not repeated.
