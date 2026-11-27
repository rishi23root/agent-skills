# Locations

Two folders, found in this order. The first that exists wins.

- **Repository**, which holds `scripts/`: the `repo` line in `local.md` next
  to the skill; else two folders above the skill's own folder, when
  `scripts/gate.mjs` is there (a plugin install).
- **Extras** (`<upstream>`): the `upstream` line in `local.md`; else
  `~/.agent-skills/upstream`.

Neither found means not installed: carry on without it and say so in your
report.

**Applies when:** a step runs a factory script or reads an extra.
