# OpenCode mapping

Read this before following any pstack skill on OpenCode. It translates the
Claude Code tool names, agent names, model routing, and paths the shared skills
use into OpenCode 2.x equivalents. This mapping is OpenCode-specific. Do not
apply it on another runtime.

Verified on OpenCode 2.1.3.

## Tools

| Claude Code | OpenCode |
| --- | --- |
| `Skill` | `skill` tool with `{ "id": "<skill-id>" }` |
| `Agent` / `Task` | `subagent` tool with `{ agent, description, prompt }` |
| `AskUserQuestion` | `question` tool |
| `Read` | `read` tool |
| `Write` | `write` tool |
| `Edit` | `edit` tool |
| `Bash` | `shell` tool |
| `Grep` | `grep` tool |
| `Glob` | `glob` tool |
| `WebFetch` | `webfetch` tool |
| `WebSearch` | `websearch` tool |
| `TaskCreate`, `TaskUpdate`, `TodoWrite` | `todowrite` when `experimental.todo` is enabled in `opencode.json`; otherwise an uncommitted `.audit/<task-slug>.todo.md` checklist |

`run_in_background: true` becomes `background: true`. To continue an existing
child, pass its returned `sessionID` to another `subagent` call. OpenCode nests
subagents one level deep by default, so the chat that received `poteto-mode`
owns every spawn. A child cannot fan out further unless the user raised
`experimental.subagent_depth`.

`subagent_type: "pstack:poteto-agent"` becomes `agent: "poteto-agent"`.
`subagent_type: "pstack:comment-sicko"` becomes `agent: "comment-sicko"`.
`subagent_type: "pstack:thermo-nuclear-review-subagent"` and
`subagent_type: "pstack:thermo-nuclear-code-quality-review-subagent"` drop the
`pstack:` prefix the same way.

`subagent_type: "general-purpose"` has no direct equivalent. Pick the role
agent below that matches the model line the skill names. The role agent carries
that model, so do not look for a `model` field on the `subagent` call.

## Role agents

OpenCode's `subagent` tool selects an agent, not a model. pstack therefore
ships one delegate agent per model role. The `pstack` plugin reads
`pstack-models.md` and writes each role's model onto its agent.

| Sheet role | Agent |
| --- | --- |
| `feature, refactoring` | `pstack-feature` |
| `bug-fix` | `pstack-bug-fix` |
| `perf-issue` | `pstack-perf` |
| `hillclimb` | `pstack-hillclimb` |
| `judgment and prose` | `pstack-judgment` |
| `strongest judgment` | `pstack-strongest` |
| `how explorer` | `pstack-how-explorer` |
| `how explainer` | `pstack-how-explainer` |
| `why investigators` | `pstack-why-investigator` |
| `why synthesizer` | `pstack-why-synthesizer` |
| `reflect tooling` | `pstack-reflect-tooling` |
| `reflect judgment, divergent, synthesizer` | `pstack-reflect-judgment` |
| `arena runners`, `architect runners`, `interrogate reviewers` | `pstack-panel-1` through `pstack-panel-4` |
| `arena cross-judge pool` | `pstack-panel-1` through `pstack-panel-4` |
| `swarm workers` | `pstack-swarm-worker` |

For a panel, the first entry of the sheet list is `pstack-panel-1`, the second
is `pstack-panel-2`, and so on. A role with a single value uses the first
entry. A missing role line means that agent inherits the parent session's
model. The aliases `inherit-parent` and `auto` mean the same thing and leave
the agent's model unset.

The four panel agents are shared by `arena`, `architect`, and `interrogate`.
The plugin checks `arena runners`, `architect runners`, `interrogate reviewers`,
then `arena cross-judge pool`, and uses the first role that assigns at least
one concrete model. If every panel role is `inherit-parent`, no panel model is
set and the agents inherit the parent session's model.

The panel agents and the review agents are read-only. `poteto-agent`,
`pstack-feature`, `pstack-bug-fix`, `pstack-perf`, `pstack-hillclimb`, and the
other implementation roles may edit. Match the agent to the work the skill
describes.

## Model values

OpenCode model references use `provider/model`, optionally with a model variant
as `provider/model#variant`. Examples:

```text
anthropic/claude-sonnet-4-5
anthropic/claude-opus-4-1#high
opencode/gpt-5.1-codex#xhigh
```

The `pstack-models.md` sheet uses the same values. The pstack plugin parses the
sheet at startup and applies each role to its agent. `inherit-parent` and
`auto` are also accepted. A value that is not a full `provider/model` reference
is ignored, because OpenCode cannot resolve a bare family name such as `opus`
without a provider.

The sheet's `default effort` line accepts `session` or one of `low`, `medium`,
`high`, `xhigh`, and `max`. When a role value carries `@<level>`, the plugin
applies `#<level>` as the model variant only when that model exposes a variant
with that ID. Otherwise it uses the model without a variant. Prefer writing the
variant explicitly as `provider/model#high` when the model supports it.

The sheet path is `${OPENCODE_CONFIG_DIR:-${XDG_CONFIG_HOME:-~/.config}/opencode}/pstack-models.md`.
A project can override it with `.opencode/pstack-models.md`. The plugin reads
the project sheet first and falls back to the global sheet.

## Skills

Every public skill is available as a command with the same name. Claude Code's
`/pstack:how` becomes `/how`; `/pstack:poteto-mode` becomes `/poteto-mode`.
Claude Code's `pstack:` agent namespace is dropped: `pstack:poteto-agent`
becomes `poteto-agent`.

Load a skill by its exact directory ID with the `skill` tool. The `principle-*`
skills are hidden from the automatic skill list to keep the context small, but
they remain registered and can be loaded by ID. `poteto-mode`'s Principles
section names each one.

## Per-skill notes

| Skill | OpenCode note |
| --- | --- |
| `poteto-mode` | The plugin injects its routing mandate at every model request unless the sheet says `session hook: off`. The chat that loads the skill owns the playbook. Delegates use the role agents above. |
| `setup-pstack` | Use `opencode models` to list real `provider/model` references. Write the OpenCode sheet, not a Claude sheet. The plugin applies it. |
| `how`, `why`, `reflect` | Replace each `Agent` call with `subagent` and the matching role agent. A reviewer that must not edit uses a read-only role agent. |
| `arena`, `architect`, `interrogate` | Spawn one `pstack-panel-N` agent per configured panel entry. Keep the panel model-diverse. |
| `swarm` | Spawn every worker as `pstack-swarm-worker` with `background: true`. |
| `no-comments`, `thermos` | Use `comment-sicko` and the two `thermo-nuclear-*` agents. Their permissions deny edits. |
| `tdd` | Use the normal `build` agent. The TDD loop is enforced by the skill, not by an agent type. |

## Paths

| Claude Code | OpenCode |
| --- | --- |
| `~/.claude/pstack-models.md` | `~/.config/opencode/pstack-models.md` |
| `~/.claude/skills/` | `~/.config/opencode/skills/` |
| `CLAUDE.md` | `AGENTS.md` |
| `~/.claude/plugins/` | `~/.config/opencode/plugins/` |

The skills, agents, commands, and the routing plugin install into the OpenCode
config directory. Project installs go under `.opencode/` instead.

## Verification

Before declaring a change done, verify against the real artifact. OpenCode's
`shell`, `read`, and project test commands are the same tools the skills name.
A passing compile is not proof that a UI, CLI, or runtime behavior works. Follow
pstack's `principle-prove-it-works` skill.
