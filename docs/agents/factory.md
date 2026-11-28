# Factory profile

## Project

- **Name:** agent-skills
- **One line:** agent skills that run a personal software factory, the scripts that check them, and the research behind them; used by the owner through Claude Code, Codex and T3 Code
- **Default branch:** main

## Where things are

- **Spec:** `docs/architecture.md` (layers, contracts, Decisions); plans in `docs/plans/`
- **Glossary:** none
- **Decision records:** the Decisions section of `docs/architecture.md`
- **Notes outside the repo:** none
- **Docs paths:** `README.md`, `docs/architecture.md`, `docs/fleet.md`, `docs/migration.md`, `docs/validation.md`
- **Checks folder:** none

## Tracker

- **Kind:** GitHub issues (`rishi23root/agent-skills`); plan tickets also live in `docs/plans/`
- **Labels**, if they differ from the defaults:

| Default | Used here |
|---|---|
| `needs-triage` | not set |
| `needs-info` | not set |
| `ready-for-agent` | not set |
| `ready-for-human` | not set |
| `wontfix` | `wontfix` |

## Commands

| Purpose | Command |
|---|---|
| Install | none: no dependencies, Node 22 only |
| Type check | none |
| Lint | `node scripts/validate.mjs` |
| Unit tests | `node --test scripts/setup.test.mjs` |
| One test file | `node --test <file>` |
| Full suite | `node scripts/validate.mjs && node --test scripts/setup.test.mjs && node scripts/graph.mjs --check && node scripts/site.mjs --check` |
| Run the app | none: open `docs/index.html` or `docs/skill-graph.html` in a browser |
| Run the app on another port | none |
| Build | `node scripts/validate.mjs --write && node scripts/graph.mjs && node scripts/site.mjs` (regenerates the generated files) |

The commands come from `AGENTS.md` and `.github/workflows/validate.yml`. CI
also runs `node scripts/sync-upstream.mjs` then
`node scripts/validate.mjs --upstream upstream`; run those when
`upstream.lock.json` changes.

## Rules for this repository

- **Never touch:** the generated files by hand (`docs/skill-graph.md`, `docs/skill-graph.html`, `docs/index.html`, `skills/*/extras.md`); `upstream/` and `skills/*/local.md`, which are not in git; any user-level skills folder
- **High risk here:** `skills/review/`, `skills/ship/` and `scripts/gate.mjs` (the merge gate); `.github/workflows/`; `upstream.lock.json`; `.claude-plugin/plugin.json`
- **Merge method:** merge
- **Release note:** raise `version` in `.claude-plugin/plugin.json`; installed plugin copies update only when it changes. A merge to `main` also republishes the site from `docs/`

## Fleet

- **Mode:** steady
- **Families:** manager Claude, builders Claude, reviewers from another provider than the builder's, chosen as `skills/dispatch/allocation.md` says. The families are peers
- **Machines that may run workers:** the owner's machine
- **Ports and local databases:** none
- **Council models**, if a council is used: not set
