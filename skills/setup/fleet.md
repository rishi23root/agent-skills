# Providers, harness settings, automation, run log and test run

Detail for five sections of [SKILL.md](SKILL.md). A script cannot see most
of this: the harness knows it, or only the owner does. The names of the
harness's tools and settings are in `../dispatch/harness.md`, under "Settings
the factory relies on". Use the column for the harness you run in.

## Providers

The merge gate needs a reviewer from another provider than the builder's. A
machine with one provider stops every PR at the gate until the owner waives
that in writing, PR by PR. So this section comes before anything is built.

1. **Ask the harness what can run a worker now.** A provider that is signed
   out, disabled or reporting an error is not a candidate. The script's
   "signed in" line is a hint. It is not the answer.
2. **Show the candidates as providers**, each with the tiers it can fill.
   Tiers and model names are placed by `../dispatch/allocation.md`. Do not
   write a model name anywhere else.
3. **Ask one batch:** which provider manages, which builds, which reviews?
   Recommend what the family hint in `allocation.md` gives: builders on one
   provider, reviewers on another. The manager is the session the owner
   types in.
4. **Warn plainly when no provider other than the builder's can review.**
   Say: every PR will stop at the merge gate, because its condition 7 needs
   a reviewer from another provider, and you would have to waive it in
   writing on each PR. Then give the way out: sign in to a second provider.
   The line is `missing`. Do not soften it, and do not offer the same
   provider as its own reviewer.
5. **Offer to prove it.** Signed in is not the same as able to run: a
   provider whose sandbox cannot start a shell, or whose worker never starts,
   can prove nothing by a run. On a yes, start one read-only worker on the
   reviewer's provider, in the mode a reviewer gets, and ask it to run one
   harmless command and quote the output. Say first that this costs one cold
   start. If it fails, try the next provider and report each failure with its
   error. A provider that stops to ask before each command can review only
   while the owner is at the desk: say so. The line is `ok` only after a run
   you saw.
6. **Write the choice on a yes**, to the Families line in the Fleet section
   of the project's profile: `manager <provider>, builders <provider>,
   reviewers <provider>`. Providers, not models. Change that one line only.
   `allocation.md` reads it before its own hint.

## Harness settings

Read "Settings the factory relies on" in `../dispatch/harness.md`. For each
row that applies to this harness:

- **The harness can report it:** read it. It is `ok` when it has the value
  the row asks for. Otherwise show the step.
- **It is "by hand":** no tool shows it. Give the owner the exact step from
  the row, in one batch with the others, and ask which are done. A setting
  they confirm is `ok`, with "confirmed by the owner". One they skip stays
  `unknown`, with its step.
- **Never change a harness setting yourself**, even when a tool could. The
  default permission mode and the fallback model decide what runs unattended
  and on whose subscription. Those are the owner's.
- A setting for a second machine is asked only when the profile names a
  second machine, or the owner says they have one.

In the final table, replace the script's one Harness line with one line per
setting.

## Automation

Two templates are offered, from the repository's `templates/automation/`
folder. Each needs its own yes. A third, the dispatcher, is not offered here:
it starts agents from other people's text, and has blanks only the owner can
fill.

First read the harness's list of scheduled and webhook tasks for this
project. A task whose prompt is a template's block is already wired: say so
and do not create a second one.

**The PR review webhook** (`pr-opened.md`). Without it, a PR opened outside
the skills gets no review until someone starts one.

1. Say what a yes starts: one review by another provider for every PR that
   opens, with nobody watching, in the permission mode an unattended
   reviewer gets. Say that the harness must be reachable from the code host.
2. On a yes, create the webhook task in the harness, with the template's
   block as its prompt and the placeholder its first lines name. Limit it to
   the event of a PR being opened, so an edit or a close starts nothing.
3. The harness returns the task's address once. Whoever holds it can start
   an agent on this machine, so treat it as a secret: use it in the one
   command that creates the webhook, and nowhere else. It goes in no file,
   issue, PR, message or report. The owner can find it again in the
   harness's settings.

   ```
   gh api repos/<owner>/<repo>/hooks -f name=web -F active=true \
     -f "events[]=pull_request" -f "config[content_type]=json" \
     -f "config[url]=<the address>"
   ```

4. A signing secret is the owner's to set, on both sides, through the
   harness's private prompt. You never see it.
5. Run the script again. The webhook line now counts one. Tell the owner to
   open the next PR while they watch, and to approve the task's recurring
   prompts once: a mode that asks before acting stalls with nobody there.

**Daily triage** (`daily-triage.md`). Ask for the time of day. On a yes,
create a task for weekday mornings at that time, with the template's block as
its prompt. Report when it next runs.

If the script says a webhook already fires on pull requests and the
harness's list has no matching task, stop and show both facts. Something else
owns that webhook. Do not add a second.

## Run log

The script's line names the file a run row goes to, and says whether one
could be written there. It writes none. With the line `ok`, ask nothing.

- **`missing`:** show the fix. Making a folder writable is the owner's act.
- **The owner wants another file:** the factory reads the path from the
  `AGENT_RUNLOG` environment variable. Give the line for their shell profile
  and let them add it. A profile file is theirs, and setting the variable
  only in this session would send the next session's rows somewhere else.
- **The log is on another path than they expected:** say so plainly. Rows in
  two files cannot be summed, so the summary would be wrong.

## Test run

One tiny task, taken the whole way to a PR at the merge gate, and not merged.
It is the only check that every part works together.

- Offer it only when no required line is `missing`. Otherwise it would fail
  on that line and teach nothing.
- Ask: "Start one test run now? It opens one tiny PR, has it reviewed by
  another provider and stops at the merge gate. It costs one build and one
  review."
- **On a yes,** start it as a session of its own, with its own checkout,
  where the harness can. Its first message is the command in the script's
  Test run line, word for word. Put the session's link under the table.
- **Otherwise,** print that command for the owner to type in a fresh
  session.
- Setup never runs the factory inside its own session. The layer rule
  forbids a procedure loading the manager, and a run that shares setup's
  context would not test a cold start.
- The line turns `ok` when that run has logged its row. Until then it keeps
  the script's state. The PR is a test: the owner closes it without merging.
