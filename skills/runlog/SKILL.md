---
name: runlog
description: >-
  Procedure. Records one row per worker run (task type, seat, model, cost,
  outcome, lesson) so later model choice and process changes rest on data.
disable-model-invocation: true
user-invocable: false
metadata:
  layer: "3"
  role: procedure
  requires: ""
  reads: "principles"
---

# runlog

Without a log, every claim about which model or process works better is a
feeling. The run log is one line per run. It feeds two things: the model
allocation table, and the record of what improved from one day to the next.

## When

- One row each time a worker run ends, whatever its status. `dispatch` writes
  it when the worker returns.
- One row for work a seat did in the top session, when it was `small` or
  larger. The manager writes it at the end.
- No row for `trivial` work, and none for a run that stopped before anything
  was built.

## Where

A JSON Lines file. The default is `~/agent-logs/task-stats.jsonl`. Set
`AGENT_RUNLOG` to use another path.

## How

When the factory scripts are installed (find them as
`../principles/locations.md` says):

```
node <repo>/scripts/runlog.mjs add --type feature --size small --seat junior \
  --placement subagent --provider <provider> --model <model id> \
  --effort medium --status DONE --outcome pending --ticket <link> \
  --tokens 41200 --minutes 9 --extras "tdd,file-pr" \
  --lesson "ticket lacked the test command"
```

The script checks the fields and appends the row. Without the script, append
one JSON object with the same fields by hand.

## Fields

| Field | Values |
|---|---|
| `t` | ISO time, set by the script |
| `type` | The brief's Type (`bug`, `feature`, `refactor`, `research`, `ops`, `docs`), or for a worker that is not building: `search`, `review`, `spec` |
| `size` | `trivial`, `small`, `feature`, `project`, `fog` |
| `seat` | `junior`, `mid`, `senior`, `10x`, `manager` |
| `placement` | `here`, `subagent`, `thread` |
| `provider`, `model`, `effort` | what actually ran |
| `status` | the worker's own status code |
| `outcome` | `pending`, `merged`, `sent-back`, `capped` (hit the review round cap), `abandoned` |
| `rounds` | review rounds used |
| `tokens`, `minutes` | from the harness. Leave empty when it does not report them. Do not estimate |
| `ticket` | link |
| `extras` | names of any optional extras that were loaded, comma separated. This is how an extra earns a place in the core |
| `lesson` | one sentence: what would make the next run of this kind cheaper or safer |

## Outcome is not status

`status` is what the worker said. `outcome` is what happened: did the change
merge, was it sent back, was it dropped. Set `outcome` from the review and the
merge, never from the worker's own report. A row starts as `pending`. Close it
when the PR closes:

```
node <repo>/scripts/runlog.mjs close --ticket <link> --outcome merged --rounds 1
```

The log is append-only. `close` adds a closing line. It never rewrites a row,
so a number that was once logged can always be traced. To correct a row, add a
new one and say so in its lesson. `capped` is its own outcome on purpose: a
run that hit the round cap must not look like an ordinary send-back.

## Reading it

```
node <repo>/scripts/runlog.mjs summary
```

It prints, for each task type and model, the number of runs, the share that
merged without being sent back, and the median tokens. Ten rows is the minimum
before a number changes a rule.

```
node <repo>/scripts/runlog.mjs audit
```

It lists rows that cannot be trusted as they stand: no ticket, a `DONE` with
no tokens or minutes, a row left `pending` for more than 14 days.

## The lesson field

This is the improvement loop. At the end of each run, ask what made it cost
more than it should have: a ticket missing a fact, a worker reading too much,
a review that found what a check could have caught. Write one sentence. When
the same lesson shows up three times, change the skill that owns the rule,
following [reflect.md](reflect.md). A skill is never edited from one run.
