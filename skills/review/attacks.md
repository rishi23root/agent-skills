# Attacks

The fixed list for `review`'s "break it" mode. Run each one against the
running product, at the PR's head commit. Aim it at what the diff changed.

Use a local or test instance with test data. Never aim an attack at
production, at real user data or at someone else's service. Keep a huge input
only as large as it takes to pass the limit the product should hold.

| Attack | Try | It breaks when |
|---|---|---|
| Empty input | Nothing, only spaces, an empty list or file | It crashes, saves a blank record, or says nothing |
| Huge input | A very long string, a large file, many rows | It hangs, crashes, cuts data without saying so, or accepts what it cannot show |
| Two tabs or sessions at once | The same action on the same record from both. A double submit | One write is lost, a record is made twice, or a stale view overwrites a newer one |
| Slow or dropped network | Delay the request. Cut it part way, then retry | It looks done when it is not, half the data is saved, or the retry does it twice |
| Unicode | "Piña", emoji, right-to-left text, the same letter typed composed and decomposed | Text is garbled or cut, or a search, a match or a length limit gets it wrong |
| Expired login | End or expire the session, then act | The action still happens, the typed work is lost, or no message says to sign in again |
| Missing permission | Act as a user without the right, by the screen and by a direct request | The action or the data gets through, or only the screen was hiding it |

## Report

One line for each attack, all seven, after the findings:

```
<attack>: tried | does not apply | not run
```

- `tried`: what you did and what you saw. "Held", or the finding it became.
- `does not apply`: why the change has nothing it could hit. A command with
  no login has no expired login.
- `not run`: it applies and you could not run it. Say why. It is not a pass
  (`../principles/evidence.md`).

An attack that breaks something is a finding like any other. Severity and
proof by run in [SKILL.md](SKILL.md) decide whether it blocks.
