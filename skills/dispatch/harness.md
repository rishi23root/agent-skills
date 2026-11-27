# Harness adapters

The procedure is the same everywhere. Only the tool names differ. Use the
column for the harness you are running in. If a tool in your column is not
available, fall to the last column. Do not switch provider or tool family
without telling the owner.

| Need | T3 Code | Claude Code | Codex | No orchestration tools |
|---|---|---|---|---|
| What can run, and options | `orchestrator_capabilities`, once per thread | The Agent tool's listed agent types and models | `spawn_agent` options | Nothing to query |
| Subagent in this session | `delegate_task` for another provider or a separate checkout. The native subagent tool for the same provider | Agent tool | `spawn_agent`, then wait | Do the work in this session, one ticket at a time |
| Separate checkout for a builder | `isolation: "worktree"` on `delegate_task` | `isolation: "worktree"` on the Agent tool | A git worktree | A git worktree you create |
| Own thread with its own PR | `t3_thread_launch` with a worktree `workspaceStrategy` | Not available. Use a subagent, or ask the owner to open a session | Not available | Ask the owner to open a session |
| Wait for a worker | Follow the `next` it returns. Do not poll | The tool returns when the agent finishes | Wait call | n/a |
| Watch a PR's checks | `watch_pull_request`, then end the turn | `gh pr checks` when asked | `gh pr checks` | `gh pr checks` |
| Resume with a clean context | `t3_thread_send` with fresh context, pointing at the handoff note | Start a new agent with the handoff note | Start a new agent | New session, read the handoff note |
| Stop a worker | `task_cancel` | Stop the agent | Cancel | n/a |
| Another machine | Only an environment that is linked. Pass its environment id | Not available | Not available | Not available |

## Permission modes

The role rules are in section 5 of `SKILL.md`. These are the names that
carry them out, strictest first.

| Behaviour | Roles | T3 Code (`runtimeMode`) | Claude Code (`permissionMode`) | Codex (`--sandbox`, `--ask-for-approval`) |
|---|---|---|---|---|
| Supervised | Manager, reviewer, council voice, playtester, other read-only workers | Approval required (`approval-required`) | `manual` (`default`) | `read-only`, `on-request` |
| Accepts its own edits | Builder | Auto-accept edits (`auto-accept-edits`) | `acceptEdits` | `workspace-write`, `on-request` |
| Fully on its own | Builder | Auto (`auto`) | `auto` | `--approve-for-me` |
| No limits | Throwaway sandbox only | Full access (`full-access`) | `bypassPermissions` | `--dangerously-bypass-approvals-and-sandbox` |

- **Set the mode on every start.** In T3, pass `runtimeMode` to
  `delegate_task` or `t3_thread_launch`. Left out, the worker inherits yours.
  This applies even where the tool says to omit it unless the user asks: the
  role rule is the owner's standing request. T3 rejects a mode above yours.
  Where a tool does not, check it yourself.
- **A missing mode falls back to the next stricter one**, never a looser one.
- **Supervised pauses for a person. It is not a read-only lock.** Whoever
  answers approves checks and denies edits. If nobody can answer, the worker
  stalls: report that, and do not loosen the mode.
- **Claude Code subagents** take `permissionMode` from the agent definition,
  not from the Agent tool call, and plugin agents ignore it. A parent that
  accepts edits, runs in auto or skips permissions overrides it. When you
  cannot set the mode, run the worker as its own session with
  `--permission-mode`, or tell the owner that "read only" rests on the brief
  and on whatever tools the agent type lacks.
- **"Inside its own worktree" is not what a mode means.** The separate
  checkout and the brief's boundaries carry that part.
- **T3 starts new threads at full access by default.** Tell the owner to
  lower the default. Until then, a manager thread is above supervised.

## Notes

- **Linked is not paired.** A second machine that is only paired cannot be
  targeted by an agent. If the task needs it and it is not linked, say so and
  stop. Do not drive it over SSH as a workaround unless the owner asks.
- **A separate checkout is not optional for builders.** Two builders in one
  working tree overwrite each other.
- **Read-only workers** (search, review, research) do not need a worktree.
- **New top-level threads** are created only when the owner asked for threads,
  or the ticket owns a PR under the placement table in `SKILL.md`. "Parallel"
  and "delegate" do not by themselves mean a new thread.
