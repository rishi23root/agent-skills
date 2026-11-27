# Machine, GitHub, skills and locations

Detail for the first four sections of [SKILL.md](SKILL.md). The script's
table already holds the fix for each line. This file says what to ask, what a
yes allows, and what stays the owner's act.

## Machine

| Line | Ask | On a yes |
|---|---|---|
| Node, git | Nothing. Give the fix from the table | Nothing. Installing a runtime is the owner's act |
| Python 3 | Nothing. It is optional: one extra needs it | Nothing |
| git identity | "Commit on this machine as this name and this address?" Show the two commands from the table | Run them. They set git's global config, so every repository on the machine gets the identity |

- The address the table offers is the GitHub account's noreply address. It
  keeps the owner's real address out of public history, and GitHub still
  credits the commits to them. If the owner gives another name or address,
  use theirs.
- The table can offer that address only when `gh` is signed in. If it shows
  a placeholder, do the GitHub section first and run the script again.
- An identity set only inside this project counts as `ok`: commits here
  work. Say that other repositories on the machine still have none.

## GitHub

Nothing is written here. The owner signs in, in their own terminal, because
the sign-in opens a browser and ends with a token that you must never see.

| Line | Tell the owner |
|---|---|
| GitHub CLI | Install it. The table has the link |
| Signed in | Run `gh auth login`, then say when it is done |
| Scope `repo` | Run the `gh auth refresh` line from the table. Without this scope no PR can be opened, commented on or merged, and branch protection cannot be read |
| Scope `workflow` | Optional. Needed only to push a PR that edits a CI workflow file |
| Scopes `unknown` | The token is a fine-grained one, which lists no scopes. Go by the Repository line and the Guards lines. If a later step is refused, the token lacks that permission: say which |
| Repository | The account needs write access. With read access only, the owner asks for access or works in a fork they own |

After the owner says they signed in, run the script again and take the
result from it. Sign-in can be checked, so check it.

## Skills

One line per agent, and one required line: at least one agent must be able
to load the skills, or `/factory` cannot be typed anywhere.

| Way to install | Offer it when | Command |
|---|---|---|
| Plugin | The owner wants the skills in every project, updating themselves | The line in the table. It is the one in the repository's README |
| Linked into this project | They want to try one project first, or they work on the skills from a clone | `node <repo>/scripts/install.mjs --project <project>` |

- Installing is the owner's decision. Say what the command changes before
  the yes: a plugin installs for the user, in every project; the linker adds
  two skills folders to this project and nothing outside it.
- Run the linker with `--dry-run` first and show what it printed.
- Skip a line for an agent the owner does not use. One agent is enough.
- `unknown` means the agent's own plugin list did not answer. Ask the owner
  to run the command in the table and say what it shows.
- The script asks an agent for its plugin list only when that agent has run
  on this machine before. Asking one that never ran would make it create
  its own settings folder.
- A harness that drives other agents shows a thread the skills its
  provider's agent can load. The lines for those agents are the ones that
  count there.
- New skills appear only after the agent session restarts. Setup itself
  goes on. Say so in the last part of your report.

## Locations

The rule is `../principles/locations.md`. The script follows it.

| Line | Means | On a yes |
|---|---|---|
| Factory scripts | The folder the script ran from holds the other scripts too | Nothing. If it is `missing`, this copy is incomplete: install again |
| A skills folder whose `local.md` "does not lead to the scripts" (on a Skills line) | The skills were linked or copied, and `local.md` is gone or names a folder that moved | Run the linker again for that project. It rewrites `local.md`. Never write `local.md` by hand: the installer owns its format |
| Extras | The optional third-party playbooks are cloned, at their pinned commits | Run the `sync-upstream` line from the table |

- A plugin install has no `local.md` and needs none: the scripts are found
  two folders above each skill.
- The extras are optional. Before the yes, say what the command does: it
  clones public repositories into the folder the table names, outside any
  project, and checks out the pinned commit of each.
