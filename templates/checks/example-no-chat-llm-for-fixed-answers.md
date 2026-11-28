# No chat LLM for fixed-answer decisions

**PASS** when each new or changed decision with a fixed set of answers (routing, tagging,
policy check) is made by deterministic code, or by a bounded classifier that:
- makes one call that only scores those answers, generating no text, and
- escalates below a stated confidence threshold, to a person, a safe default
  or a stronger model.

**FAIL** when a chat LLM prompt makes that decision first, or a classifier's
low-confidence answer is acted on. Chat LLMs are for writing and open
reasoning.

Fails:
- `src/router.ts`: `chat("Reply BILLING or SUPPORT: " + message)`.
- `src/policy.py`: `label = classify(text)`, then used with no threshold.

Does not apply to: escalation after low confidence, offline evals and tests.
