# Automation templates

Prompts for runs that start without you: a webhook or a schedule. Each file
says what it does and how it is wired.

Nothing here installs or schedules itself. You create the task in your harness
and paste the prompt into it. In T3 Code, `pr-opened.md` goes in a webhook
task, with the code host's webhook pointed at the task's URL.

A scheduled or webhook run uses a thread's permission mode. A mode that asks
before acting stalls with nobody there, so run the task once while you watch
and approve its recurring prompts once.

| File | Runs when |
|---|---|
| [pr-opened.md](pr-opened.md) | A PR opens |
