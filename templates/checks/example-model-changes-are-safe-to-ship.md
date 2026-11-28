# Model changes are safe to ship

**PASS** when a production (real users or data, canary too) change to a
prompt, model or confidence threshold:
- meets the project's stated pass bar on an eval run of that version, shown by
  CI or a results file, using committed cases with expected results;
- leaves each model call's trace naming the versions used; and
- can return to the last version by a documented revert, flag or config step.

**FAIL** when any of these is missing from the diff, repository or CI.

Fails:
- `config/agents.yaml`: `escalate_below: 0.9` lowered to `0.6`, no eval run.
- `src/triage.ts`: new model, but traces record no model or prompt version.
- A hosted prompt overwritten in place, with no earlier version to restore.

Does not apply to: tests, offline evals and local experiments.
