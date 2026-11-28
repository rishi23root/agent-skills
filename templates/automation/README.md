# Automation templates

Prompts for runs that start without you: a webhook or a schedule. Each file
says what it does and how it is wired.

Nothing here installs or schedules itself. You create the task in your harness
and paste the prompt into it, or type `/factory-setup`, which offers to wire
`pr-opened.md` and `daily-triage.md` and does each only on a yes. In T3 Code, `pr-opened.md` goes in a webhook
task, with the code host's webhook pointed at the task's URL.

A scheduled or webhook run uses a thread's permission mode. A mode that asks
before acting stalls with nobody there, so run the task once while you watch
and approve its recurring prompts once. A step you would not pre-approve does
not belong in the task: stop it at a draft or a PR instead.

| File | Runs when |
|---|---|
| [pr-opened.md](pr-opened.md) | A PR opens |
| [daily-triage.md](daily-triage.md) | Every weekday morning |
| [dispatcher.md](dispatcher.md) | On the interval you set, or always on |

## Cost of a run that repeats

A run that repeats pays its start-up cost every time, whether or not anything
changed. Most of that cost is reading, so cut the reading first.

- **A fresh session per run.** A run that replies inside one long chat
  re-reads the whole chat each time, and that history soon outweighs the
  work. Give each run a new session, or a thread that holds only that task.
  The task's own record, such as the dispatcher's cursor file, carries what
  the next run needs.
- **An event over a poll.** Where the source can call you, as a code host's
  webhook can, start the run on the event. Poll only what cannot.
- **A change check before a full pass.** A run on a schedule tighter than
  once an hour first makes one small read and stops when nothing changed, as
  step 0 of [dispatcher.md](dispatcher.md) does. With no such check, run it
  hourly or less often.
- **A command before a browser, a script before reasoning.** Read state
  through the code host's command-line tool or its API, not a page. When a
  script prints the answer, run it and report what it printed.
- **Live facts only.** A status, head SHA, check or assignee comes from a
  read made in this run. An earlier run's word for it may be stale.

## Weekly audit

Once a week, the daily triage looks at each scheduled and webhook task of the
project and gives it one verdict. It reads only these records: the harness's
list of the project's tasks, each task's run history where the harness shows
one, the dispatcher's cursor file (its `no_change` and full-pass lines for the
week), and the run log rows the runlog summary prints. A task none of these
records covers gets UNKNOWN, with what was missing.

| Verdict | When the records show |
|---|---|
| KEEP | Most runs found work |
| SLOW DOWN | Most runs found nothing, on a schedule tighter than the source changes |
| EVENT TRIGGER | It polls a source that can send an event instead |
| CHANGE CHECK | It runs on a schedule with no cheap check first |
| RETIRE | No run found work all week, or another task does its job |
| UNKNOWN | No record covers it |

The audit only reports. The owner changes or removes a task.
