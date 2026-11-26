# Working in this repository

This repository holds agent skills and the research behind them. Read
`README.md`, then `docs/architecture.md`.

## Before you change a skill

1. Find the one file that owns the rule you want to change. The table of
   contracts in `docs/architecture.md` says which. Change it there, and
   nowhere else.
2. Keep the layer rule: a skill loads only skills in a layer below it.
   Dependencies are declared in each skill's `metadata` block:
   - `requires`: skills whose `SKILL.md` this one loads.
   - `reads`: skills whose reference files this one reads.
   - `escalates`: for seats, the seat it hands problems up to.
3. Do not add a skill when a section or a reference file will do. A new typed
   skill needs a reason written in `docs/architecture.md` under Decisions.

## After you change a skill

```
node scripts/validate.mjs --write
```

It checks names, layers, links and sizes, and regenerates
`docs/skill-graph.md` and `skills/<seat>/extras.md`. Commit the regenerated
files with your change. CI fails if they are stale.

If you changed a skill's `metadata`, `upstream.lock.json` or a plan in
`docs/plans`, also run `node scripts/graph.mjs`. It regenerates
`docs/skill-graph.html`, which CI checks the same way.

If you changed behaviour, add or update a row in `evals/scenarios.md`.

## Writing style for skills

- Second person, present tense, short sentences.
- Say what must be true and why. A rule with its reason is followed more
  reliably than a rule in capitals.
- Behaviour, not tool names. Tool names go in `skills/dispatch/harness.md`.
- No absolute paths. Siblings are `../<skill>/`. Machine paths come from
  `local.md`, which the installer writes.
- No model names outside `skills/dispatch/allocation.md`.
- Under 170 lines per `SKILL.md`. Move detail to a reference file next to it.

## Do not

- Do not edit generated files by hand (`docs/skill-graph.md`,
  `docs/skill-graph.html`, `extras.md`).
- Do not copy third-party skill text into this repository. Reference it
  through `upstream.lock.json`.
- Do not install these skills into a user-level skills folder as part of a
  change. Installing is the owner's decision.
- Do not put client names, private project details or credentials in any file.
