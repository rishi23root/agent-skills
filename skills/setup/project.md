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

- **Which checks.** When the owner names the checks CI must pass, give them
  to the script: `--require-check <name,name>`. When they do not know, the
  table proposes the checks that ran on the branch's newest commit. Ask
  "require these?".
- **Use the fix in the table, exactly.** For a branch that already has a
  rule, it only adds a check or includes administrators. Do not write a call
  of your own that sets the whole protection of such a branch: that call
  replaces every rule on it, including ones the owner set by hand.
- **An unprotected branch** gets one command that creates the rule: the
  checks, administrators included, and nothing else. It asks for no review
  approval, because one account cannot approve its own PR.
- **A fix "by hand"** appears when the rule exists but status checks are
  off. Give the owner the steps. Do not look for a command.
- **A ruleset** shows as `unknown`. The script cannot see who may bypass
  it. The owner looks, and tells you.
- **`unknown`, could not be read:** only an administrator can read branch
  protection. The owner asks one.
- Say what the command changes, run it on a yes, then run the script again
  and show the line.

### Tracker labels

A ticket moves through five states, and each state is a label. The profile
may rename them, in its "Used here" column. Fill that in first, so the script
checks the names this project uses.

- On a yes, run the create commands from the table. They add labels. Never
  rename or delete a label that is already there.
- When issues are off, tickets are files in `docs/tickets/`, and no label is
  needed.
