# Findings: what we tried, what happened, what rule it produced

Source: the owner's improvement log (Nov 16-24 2026), operating-model notes and `skill-use.md`. Numbers are quoted from those sources.

## Summary

- Standing skill descriptions are a per-turn tax. Live skills went 58 -> 25 -> 7, and description chars went 8,509 -> 4,539 -> 2,039.
- Third-party plugins cost more than the personal stack: 4 plugins held 21,601 of 25,705 description chars (84.0%) in one Cursor session.
- Written rules do not run. The allocator's log file has 0 rows because its only writer is a sentence. A hook is the fix.
- Fan-out raises total tokens, and human review is the bottleneck, so dispatch stays a gated pilot.
- Most "tested" claims are single samples. The last section lists what to re-measure.

## Findings

| # | Date | What was tried or observed | Result (with the number) | Rule it produced | Evidence level |
|---|---|---|---|---|---|
| 1 | Nov 17 | Linked full upstream skill repos everywhere | 58 skills, 8,509 description chars, 239,309 B of SKILL.md | Allowlist via `profile.json` (`keep` + `parkedWhy`); park the rest | Measured |
| 2 | Nov 17 | Trimmed to a curated list | 58 -> 24 skills; 8,509 -> 4,098 chars; 239,309 B -> 82,069 B | Curate before adding | Measured |
| 3 | Nov 18 | Cursor context ring showed ~20% used by Skills | 81 offered skills, 25,705 chars (~6,400 tokens); 38,499 chars with XML and paths | Measure the live prompt block, not the folder you control | Measured |
| 4 | Nov 18 | Located the source of the tax | 4 plugins (Vercel, Neon, Slack, Cloudflare) = 21,601 of 25,705 chars (84.0%), ~900 KB of ~1.0 MB | Uninstall plugins you are not using; Cursor has no per-plugin disable | Measured (uninstall not yet verified) |
| 5 | Nov 18 | Assumed trimming the personal list would shrink the bar | Personal stack was 4,098 chars against ~25,705 | Find the biggest consumer first | Measured |
| 6 | Nov 20 | Antigravity session | 4 built-ins, 1,345 chars; none of the personal skills loaded (no junction) | Each provider needs its own link; check what actually loaded | Observed once |
| 7 | Nov 20 | Audited all 25 personal skills | About 75% of the combined list was noise; 9 keep, 7 trim, 9 park | Audit before keeping; broken cross-references and trigger collisions are common | Observed once |
| 8 | Nov 21 | Four role routers replaced the live stack, loaded only when named (`disable-model-invocation: true`) | Live 25 -> 7, 65 parked; chars 4,539 -> 2,039 (-55%; -76% vs the 8,509 baseline); bytes 86,703 -> 35,952 | Named-only invocation; routers read 1-2 playbooks by path | Measured |
| 9 | Nov 20 | Dictated client words fed to coding agents | Intake scored 9/10 in review; `client-brief` rated most useful skill | Restate and confirm before spec; the intake skill stops without coding | Observed once |
| 10 | Nov 24 | Haiku run guessed at a dictation slip ("attack on HPR", meant PR) | It flagged the guess but ran with it | Ask before acting on an ambiguous phrase | Observed once |
| 11 | Nov 21 | `to-tickets` says "avoid file paths"; the clone gate needs file overlap | Clash produced the `Touches:` block | Tickets stay behavioral; a separate Technical Dependencies comment carries `Touches:` | Reasoned / not yet tested |
| 12 | Nov 21 | One thread per issue | Higher per-task accuracy, higher total tokens (each thread pays a cold start); pays off only on flat-rate plans | Fan-out is a gated pilot: 1-2 threads, stop at a review-ready PR | Reasoned / not yet tested |
| 13 | Nov 21 | Scored dispatch readiness | Unattended 6/10, gated pilot 8.5/10; six blockers listed | Do not run unattended dispatch yet | Observed once |
| 14 | Nov 21 | Human review in the chain | Listed as blocker 6 | Cap reviews in flight (steady: 2) | Observed once |
| 15 | Nov 21 | Quota ran out mid-question; Claude looked missing | Antigravity Claude and GPT-OSS at 0% until Nov 27; Cursor other models 100% used, resets Dec 12 | Read live quota before picking provider, model and effort | Observed once |
| 16 | Nov 23 | Claude reviewed the allocator | `task-stats.jsonl` has 0 rows (still absent Nov 24); thresholds 10%, 15%, 5% disagree; placement rule in 5 files | "Prose is not a mechanism": the harness writes the log; one copy of each rule; one quota ladder | Observed once |
| 17 | Nov 23 | Reading split from judgment | Sonnet subagent read (82,788 tokens, 61 s, 17 tool calls); the stronger model only judged | Cheap model reads, strong model decides; spend by thinking difficulty, not task size | Observed once |
| 18 | Nov 24 | Hook logger on Claude Code (7 events) | 1.6 MB in about 80 minutes | Log by hook; judge success by CI and merge, not "done"; set `cleanupPeriodDays` | Measured |
| 19 | Nov 24 | Agent on the PC tried to start threads on backroom | Paired, not linked; N machines need N(N-1) manual links | Treat the second machine as unreachable until linked | Observed once |
| 20 | Nov 24 | Merged 15 PRs into one integration branch before deploy | 15 deploys -> 1; 553 tests pass, 1 suite fails; deploy would be a native build, not OTA | Batch merges; add a "what will this trigger" line to PR review | Observed once |
| 21 | Nov 17 | Operating-model limits | WIP: pilot 1 build / 1 review / 0 clones; steady max 4 builds / 2 reviews / hard cap 6 agents; 5-point clone gate | Only the manager seat may fan out, and only when all gates pass | Reasoned / not yet tested |
| 22 | Nov 17 | Context handoff | 50-65% window; PR size aim ~100-200 lines (small-change benchmark) | Write a memory note, resume with `freshContext: true` | Reasoned / not yet tested |
| 23 | Nov 21 | Worker backroom host limits | 8-12 GB RAM; capped at 2 concurrent turns, worktrees on NVMe | Size concurrency to the host | Reasoned / not yet tested |

## Research behind the operating model

The notes name Brooks's law (adding agents adds coordination cost) as the reason for the depth limit (manager to worker, workers never hire) and the WIP caps. They cite a small-change benchmark for the 100-200 line target. They also cite a published `pstack` router pattern for named-only roles. I found no notes on career ladders or staff archetypes beyond the L1 to L5+ seat labels.

## Open questions still untested

- Does a full session push work out to a thread better than a subagent? The test for "related to the current session" is undefined.
- Does the memory-note handoff continue cleanly in a fresh context?
- Do named-only routers get invoked when needed, or do they sit unused?
- How many runs per task type before the log may move the model tier table? (Proposed ~20 per two models, a guess.)
- What is a success definition for tasks with no PR (search, review)?
- Does backroom hold at 2 concurrent turns?

## Numbers to re-measure before quoting

- Post-uninstall Cursor catalog: 25,705 -> 4,104 is projected. The four plugins were still on disk Nov 20.
- Source disagreement: two older notes (metrics and inventory) show 25 live skills, 4,539 chars, 86,703 B; `skill-use.md` (generated 2026-11-21 15:35) shows 7, 2,039, 35,952 B. Use the newer.
- The operating-model note says 6 live skills and 1,806 chars. That predates the allocator (7th skill) and is older.
- The "about 75% noise" figure is one audit run.
- Token figures are chars divided by 4, an estimate.
- The 1.6 MB per 80 minutes logger volume is one session.
- 82,788 tokens, 61 s, 17 calls is one subagent run.
- The 15 deploys -> 1 saving is one batch.
- Provider quota snapshots (Nov 21) are already stale.
