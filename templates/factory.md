# Factory profile

> Copy this file into a project as `docs/agents/factory.md` and fill it in.
> The factory skills read it first. It holds the facts about this repository
> that would otherwise be guessed or rediscovered on every run. Keep it short.

## Project

- **Name:**
- **One line:** what it is and who uses it
- **Default branch:**

## Where things are

- **Spec:** path or tracker link
- **Glossary:** path, or none
- **Decision records:** path, or none
- **Notes outside the repo:** path to a hub or notes folder, or none
- **Docs paths:** the files and folders the docs pass in `ship` may edit (default: the README, and a changelog if there is one)
- **Checks folder:** path to the plain-English review checks, or none (default `checks/`)

## Tracker

- **Kind:** GitHub issues | GitLab | committed files in `docs/tickets/`
- **Labels**, if they differ from the defaults:

| Default | Used here |
|---|---|
| `needs-triage` | |
| `needs-info` | |
| `ready-for-agent` | |
| `ready-for-human` | |
| `wontfix` | |

## Commands

| Purpose | Command |
|---|---|
| Install | |
| Type check | |
| Lint | |
| Unit tests | |
| One test file | |
| Full suite | |
| Run the app | |
| Run the app on another port | |
| Build | |

## Rules for this repository

- **Never touch:** paths or modules that are off limits to agents
- **High risk here:** anything beyond the default list that needs a senior review
- **Merge method:** squash | merge | rebase
- **Release note:** how a change reaches users, and anything a merge triggers

## Fleet

- **Mode:** pilot | steady. Leave it as pilot until one ticket has gone the whole way. Only the owner changes this line
- **Families:** which provider manages, builds and reviews, when you have a preference. For example: manager A, builders A, reviewers B. Providers, not model names
- **Machines that may run workers:**
- **Ports and local databases:** what one builder uses by default, and how a second builder gets its own
- **Council models**, if a council is used:
