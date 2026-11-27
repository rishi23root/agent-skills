# Profile and guards

Detail for the Profile and Guards sections of [SKILL.md](SKILL.md).

## Profile

The profile is `docs/agents/factory.md` in the project. Every skill reads it
first, so a fact in it is not guessed again on each run. Its template is
`<repo>/templates/factory.md`.

1. **A profile that exists is left alone.** Do not reformat it or fill lines
   the owner left empty. When its Mode line is still open, ask about that
   line only.
2. **With no profile, print the draft.** From the project's folder:

   ```
   node <repo>/scripts/setup.mjs --draft-profile
   ```

   It prints the template with what the repository shows: name, default
   branch, tracker, docs paths, merge method, and the commands it found in
   the package or build files. It writes nothing.
3. **Fill what you can read.** The project's agent instructions, its README
   and its CI workflow usually name the test and lint commands. Five reads at
   most. Mark each line you filled this way with the file it came from, so
   the owner can check it.
4. **Ask for the rest in one batch.** That is every line still holding the
   template's own words: usually the one-line description, the paths agents
   must never touch, what counts as high risk here, the release note,
   machines and ports. "None" is an answer. A line the owner skips is
   written as `not set`, so nobody mistakes the template's words for a fact.
5. **Confirm the merge method** when the draft says "Confirm it". The draft
   read it from how the last PRs landed, and that is a habit, not a rule.
6. **The mode is `pilot`.** Always, in a new profile. Do not ask, and do not
   offer `steady`. Only the owner changes that line, later, by their own
   edit, after one ticket has gone the whole way.
7. **Show the whole file, then write on a yes.** Write it as an uncommitted
   change in the project. Do not commit or push it: the owner reads the diff
   first, and a profile that reaches the default branch unread teaches every
   later run something nobody checked.

## Guards

Two guards. Both are settings on the repository, so each needs its own yes.

### The default branch

The merge gate reads the checks the repository requires. With none required
the gate is weak: it passes with a note. With administrators exempt, the
owner's own token can merge past a red check. So the line is `ok` only when
the branch requires at least one check, for administrators too.

- **Which checks.** The owner names the checks a pull request must pass. Give
  them to the script: `--require-check <name,name>`. Until they are named,
  the script builds no command. It lists what the newest pull request ran,
  as a hint to ask about. Never require a check that runs only after a
  merge, such as a deploy: no PR could pass it, and every merge would stop.
- **Use the fix in the table, exactly.** For a branch that already has a
  rule, it only adds a check or includes administrators. Do not write a call
  of your own that sets the whole protection of such a branch: that call
  replaces every rule on it, including ones the owner set by hand.
- **An unprotected branch** gets one command that creates the rule: the
  named checks, administrators included. It asks for no review approval,
  because one account cannot approve its own PR. Say what follows before the
  yes: nobody pushes straight to the branch, force-pushes it or deletes it
  any more, the owner included. Every change arrives through a PR whose
  checks passed.
- **Check again right before you run it.** The fix was built from how the
  branch looked when the script ran. If time has passed, run the script
  again first: a rule added in between would be replaced by the create
  command.
- **A refused command ends the attempt.** Show the refusal and stop. Do not
  try another call in its place. A rule that covers the branch by a pattern
  may not accept these calls: the owner then changes it in the settings.
- **No command, only steps:** a name that is not plain text is never put in
  a command, because it could change what the command does. The table then
  gives the steps to do by hand.
- **A fix "by hand"** also appears when the rule exists but status checks
  are off. Give the owner the steps. Do not look for a command.
- **A ruleset** shows as `unknown`. The script cannot see who may bypass
  it. The owner looks, and tells you.
- **`unknown`, could not be read:** only an administrator can read branch
  protection. The owner asks one.
- Say what the command changes, run it on a yes, then run the script again
  and show the line.

### Tracker labels

A ticket moves through five states, and each state is a label. The profile
may rename them, in its "Used here" column. Fill that in first, so the script
checks the names this project uses. A cell left empty or `not set` means the
default name.

- On a yes, run the create commands from the table. They add labels. Never
  rename or delete a label that is already there.
- When issues are off, tickets are files in `docs/tickets/`, and no label is
  needed.
