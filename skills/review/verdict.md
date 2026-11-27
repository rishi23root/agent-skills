# Recording the verdict

The "Recording the verdict" section of `review` points here. Read this before
you post.

Post findings and verdict on the PR, not in chat. Keep prose terse, and keep
`Level:`, `Voices:`, `PASS`/`FAIL`, suspicion count and the final line exact
(commit reviewed and patch id):

```
Factory-Review: APPROVE <head commit> patch <patch id>
```

The patch id is the first field of `gh pr diff <PR> | git patch-id --stable`.
Use `SEND-BACK` or `COMMENT` in place of `APPROVE` as needed. The merge gate
reads this line. A verdict covers a patch, not a commit: after a rebase that
leaves the diff unchanged the patch id is the same and the verdict stands. If
the diff changed at all, the verdict is void and the new diff is reviewed.
When the reviewer has a different GitHub account from the author, also submit
a normal GitHub review.
