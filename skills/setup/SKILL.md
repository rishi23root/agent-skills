---
name: setup
description: >-
  First-run interview. Checks a machine and a project for what a factory run
  needs, asks only for what it cannot detect, writes on a yes, and ends with
  one table of what is ready and the fix for what is not.
disable-model-invocation: true
metadata:
  layer: "2"
  role: first-run
  requires: ""
  reads: "principles"
---

# setup

Setup runs once on a new machine and once in each new project. It leaves both
ready for `/factory` to run end to end, or it says exactly what is still in
the way. You check, you ask, you show, and you write only what the owner
agreed to.

## Typed by the owner, with no ticket

Setup is always typed. It takes no ticket, writes no brief and builds
nothing. The project is the one the owner names, else the current repository.
If two projects fit or none does, ask which one and stop.

It is safe to type again, after a new agent is installed or a project
changes. A line that is already `ok` is left alone.

## Rules for every section

- **Detect before you ask.** Run the check script first. Ask the owner only
  for what it could not find out. A question the machine could have answered
  wastes their time and invites a wrong answer.
- **One batch per section.** Put all of a section's questions in one message.
  Any of them may be answered with "skip". A skipped item keeps its state in
  the table and is not asked again in this run.
- **Show, then write on a yes.** Before a write or a command that changes
  something, show exactly what it is and where it lands. Go ahead only after
  a yes for that item. A yes covers the thing it was said about, not the next.
- **Nothing happens on its own.** You install nothing, schedule nothing and
  change no setting on the machine, the account or the repository without a
  yes. Signing in is the owner's act: give the command and wait.
- **Write where the factory already reads.** Each section names the place. A
  fact stored where no skill looks is lost, so never invent a file for one.
- **Twice changes nothing.** Check before every write. When the value is
  already there, do not write it again.
- **No secret in any file.** A token, a password or a signing secret never
  goes in a file, an issue, a PR, a command you show or your report. You
  never ask the owner to paste one into the conversation.
- **What you cannot check is `unknown`.** Give the exact steps. When the
  owner says they did them, that line's Found cell reads "confirmed by the
  owner". Never turn a guess into `ok`.

## The check script

Find the repository as `../principles/locations.md` says. Then, from the
project's folder:

```
node <repo>/scripts/setup.mjs
```

It reads and never writes. It prints one table. Each line is `ok`, `missing`
or `unknown`, and `required` or `optional`, and every line that is not `ok`
carries its fix. Required means a factory run cannot reach a PR at the merge
gate without it. The script exits non-zero while a required line is missing.

If the script cannot run, that is the first finding. Say why (no Node, or the
repository was not found), give the fix, and stop. Do not check by hand what
the script checks: a hand check drifts from the script, and the owner then
has two answers.

## The sections

Work through them in this order. Earlier ones unblock later ones: nothing on
GitHub can be read before `gh` is signed in.

| Section | Settles | A yes writes to | Detail |
|---|---|---|---|
| Machine | Node, git, Python 3, the git identity | git's global config | [machine.md](machine.md) |
| GitHub | `gh` signed in, its token scopes, write access to the repository | nothing: the owner signs in | [machine.md](machine.md) |
| Skills | each agent on this machine can load the skills | that agent's plugins, or the project's skills folders | [machine.md](machine.md) |
| Locations | the scripts and the extras are where the skills look for them | `local.md`, through the installer, and the extras folder | [machine.md](machine.md) |
| Profile | `docs/agents/factory.md` exists and has a mode | that file, in the project | [project.md](project.md) |
| Guards | the default branch is protected, the tracker labels exist | the repository's settings | [project.md](project.md) |

For each section:

1. Read its lines in the table. When every line is `ok`, say so in one line
   and move on. Do not read its detail file.
2. Otherwise read that section's part of the detail file. It says what to
   ask, what a yes allows, and what must stay the owner's act.
3. Ask the section's questions in one batch, each with the answer you
   detected or would recommend, worded so that "yes" accepts it.
4. Show each write. Do the ones that got a yes. Run the script again when a
   later section depends on the result.

## The table at the end

After the last write, run the script once more, with the same options, and
show its table whole, as printed. Do not retype it from memory: the table is the script's, and a line
you typed is a claim, not a check.

Change a line only for something the script cannot see and the owner
confirmed in this run. Say so in its Found cell.

Under the table, in this order:

1. What you wrote or ran, and where, one line each.
2. What the owner skipped.
3. Whether the factory is ready. While a required line is missing it is not:
   say which line, and do not soften it.
4. The next thing to type. After an install, that is a restart of the agent
   session, because a running session does not see new skills.

## Stop when

- The owner says stop. Show the table as it stands.
- A fix needs something only the owner can do, such as signing in or asking
  an administrator. Give the step, then go on with the sections that do not
  depend on it.
- A command would change more than you showed. Do not run it. Show the
  difference and ask again.
