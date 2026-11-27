# Sizing and risk

One table decides how much process a request gets. More process than the size
needs wastes tokens. Less loses the work.

## Size

| Size | Signals | Seat | Stages that run |
|---|---|---|---|
| **trivial** | A question, an explanation, or a change that is obvious, in one file, under about 20 lines | none, the current session does it | do it, show proof |
| **small** | One ticket, one PR, up to about 200 changed lines, in a module whose owner is known | `junior`. Use `mid` when several files change or the cause of a bug is unknown | brief, scope lines, build, review, ship |
| **feature** | Two to six tickets under one section of the spec | `mid` | brief, interfaces and seams, tickets, build, review, ship |
| **project** | A new spec, more than six tickets, or work that crosses modules | `senior` | brief, spec gate, tickets, dispatch, build, review, ship |
| **fog** | Nobody can yet say what done looks like, or the approach is an open architecture choice | `10x` frames it, then it is sized again | brief, framing, then re-size |

When two rows fit, take the smaller one and say what would move it up.

Count every file the repository's own rules force the change to touch: tests,
generated files, a changelog. A one-line fix that must also update a test and
a generated file is `small`, not `trivial`.

## Risk

Risk is **high** when the change touches any of: authentication or
permissions, money, a schema or data migration, a public interface, concurrency,
secrets, deletion of data, or production infrastructure. Otherwise it is
**normal**.

High risk changes three things:

1. The seat moves up one (`junior` to `mid`, `mid` to `senior`).
2. `senior` reviews as well as the reviewer from another provider, who is
   there at every risk level.
3. The owner sees the brief before any build starts.
