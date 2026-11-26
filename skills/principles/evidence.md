# Evidence

A claim that something works counts only with output a person or agent saw.
Each check is reported as exactly one of:

- **passed**: it was run and seen to pass. Quote the last lines of output.
- **failed**: it was run and it failed. Say how.
- **not run**: say why. A check that could not be run is not a pass.

"Tests pass", with no output, is a sentence. It is not evidence.

**Applies when:** a builder reports, a reviewer checks an acceptance check, a
manager reads a worker's `DONE`, or a PR claims proof.
