# Model changes ship with eval results

**PASS** when a change to a production prompt, model or confidence threshold
shows an eval run of the changed version: a CI job on the PR, or a results
file in the diff. The eval cases are in the repository and have expected
results, and the run meets the project's stated pass bar.

**FAIL** when there is no such run, it misses the bar, or the project states
no bar. "Tried it by hand" is not a run.

Fails:
- `prompts/triage.txt` edited, with no eval job and no results file.
- `config/agents.yaml`: `escalate_below: 0.9` lowered to `0.6`, no eval run.

Does not apply to: prompts used only in tests or throwaway experiments.
