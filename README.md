# pstack for OpenCode

An OpenCode port of [pstack](https://github.com/cursor/plugins/tree/main/pstack) by Lauren Tan (poteto). It builds on Michael Denyer's Claude Code version, [michael-denyer/pstack-claude](https://github.com/michael-denyer/pstack-claude), and reworks it for OpenCode commands, subagents, model routing, and automatic routing.

pstack is a collection of agent workflows built on the idea "if you want to go fast, go deep first." Rather than adding code, it aims to remove code while keeping only verified changes. `poteto-mode` picks the playbook that fits the task and calls the skills it needs.

## Differences from the Claude Code version

The Claude Code version works on OpenCode as long as the skills are in `~/.agents/skills/`, but it does not provide the following:

- Slash commands such as `/poteto-mode`
- Subagent definitions for `poteto-agent`, `comment-sicko`, and the thermo-nuclear reviewers
- Per-role model routing
- Automatic routing at session start

This port adds them using OpenCode's mechanisms.

| Feature | Claude Code version | This port |
| --- | --- | --- |
| Skills | `skills/` | `~/.config/opencode/skills/` |
| Commands | Skills become `/pstack:<name>` | `commands/<name>.md` becomes `/<name>` |
| Subagents | `pstack:poteto-agent` | `poteto-agent` |
| Model selection | `Agent`'s `model` | Fixed per role agent |
| Automatic routing | SessionStart hook | OpenCode plugin's `context` hook |
| Model configuration | `~/.claude/pstack-models.md` | `~/.config/opencode/pstack-models.md` |

## Requirements

- OpenCode 2.1.3 or later
- `git`
- GitHub CLI (`gh`) if you use the PR workflow
- Bun if you use `watch-pr` or `orch`

## Install

```sh
git clone https://github.com/<your-name>/pstack-opencode.git
cd pstack-opencode
./install.sh
```

This links skills, commands, agents, and plugins into the global configuration (`~/.config/opencode`). Existing files are not overwritten.

To install per project:

```sh
cd /path/to/project
/path/to/pstack-opencode/install.sh --project
```

This links into `./.opencode/`. Project configuration takes precedence over global configuration.

To install by copying:

```sh
./install.sh --copy
```

If you use `XDG_CONFIG_HOME`, the `opencode` directory under it is the target. Set `OPENCODE_CONFIG_DIR` to be explicit.

After installing, restart OpenCode or start a new session.

### First-time setup

```text
/setup-pstack
```

This detects available models with `opencode models` and writes per-role models to `~/.config/opencode/pstack-models.md`. pstack works without splitting models, but panels (`arena`, `architect`, `interrogate`) are more effective when they use different models.

## Usage

```text
/poteto-mode Fix the bug where search filters reset when the page changes
```

`poteto-mode` picks the playbook that fits the task and calls `how`, `why`, `architect`, `arena`, `interrogate`, `swarm`, and others as needed.

You can also call skills directly.

```text
/how How does canceling a run work? Is there an N+1?
/interrogate Review this PR
/tdd Write a test that reproduces this bug first
```

The command list is in [docs/reference.md](docs/reference.md).

### Using todos

Enable OpenCode's todo tool and `poteto-mode` manages the playbook steps as todos.

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "experimental": {
    "todo": true
  }
}
```

If you do not enable it, the checklist is written to `.audit/<task-slug>.todo.md`.

## Model routing

Claude Code's `Agent` tool accepts `model`, but OpenCode's `subagent` tool accepts only an agent ID. pstack therefore provides a dedicated subagent for each role, and the plugin applies the value from `pstack-models.md` to that agent's `model`.

Example:

```markdown
feature, refactoring: anthropic/claude-sonnet-4-5
bug-fix: anthropic/claude-opus-4-1#high
judgment and prose: anthropic/claude-opus-4-1
strongest judgment: anthropic/claude-opus-4-1#max
arena runners: anthropic/claude-opus-4-1, openai/gpt-5.1, google/gemini-3-pro
default effort: high
session hook: on
```

- `provider/model` is an OpenCode model reference.
- You can specify a model variant, such as `#high`.
- `inherit-parent` or `auto` uses the parent session's model.
- Panels are comma-separated; the first entry maps to `pstack-panel-1` through the fourth to `pstack-panel-4`.
- `session hook: off` stops automatic routing.

The role-to-agent mapping is in [skills/poteto-mode/references/opencode-tools.md](skills/poteto-mode/references/opencode-tools.md#role-agents).

When you edit `pstack-models.md`, the plugin detects the change and applies it on the next prompt.

## Subagents

| Agent | Purpose |
| --- | --- |
| `poteto-agent` | General implementation delegate |
| `pstack-feature` | Feature work and refactoring |
| `pstack-bug-fix` | Bug fixes |
| `pstack-perf` | Performance issues |
| `pstack-hillclimb` | Continuous metric improvement |
| `pstack-judgment` | Judgment and prose |
| `pstack-strongest` | Hardest judgment calls |
| `pstack-how-*` | `how` exploration and explanation |
| `pstack-why-*` | `why` investigation and synthesis |
| `pstack-reflect-*` | `reflect` review |
| `pstack-panel-1` through `pstack-panel-4` | Panels for `arena`, `architect`, `interrogate` |
| `pstack-swarm-worker` | `swarm` workers |
| `comment-sicko` | Comment-removal review (read-only) |
| `thermo-nuclear-review-subagent` | Bug and security audit (read-only) |
| `thermo-nuclear-code-quality-review-subagent` | Maintainability audit (read-only) |

Read-only agents reject `edit`. Only `poteto-agent` and the implementation role agents can edit files.

## Automatic routing

The plugin adds a short instruction to the system prompt of every model request. It prompts loading `poteto-mode` when the task matches:

- Changes that touch multiple files
- Changes to shared signatures
- Design or architecture decisions
- Bugs with an unknown cause
- Performance issues

Small tasks proceed directly.

To turn it off, add the following to `pstack-models.md`:

```text
session hook: off
```

## Changing models

Rerun `/setup-pstack`, or edit `pstack-models.md` directly. The plugin detects the file change and applies it to the role agents on the next prompt.

## Uninstall

```sh
./uninstall.sh
```

This removes only the symlinks into this checkout. For copy installs or to force removal:

```sh
./uninstall.sh --force
```

`~/.config/opencode/pstack-models.md` is removed only with `--force`.

## Layout

```text
skills/                      65 skills (41 public + 24 principles)
commands/                    /<name> command for each public skill
agents/                      pstack subagents
plugins/pstack.ts            Model application and automatic routing
hooks/session-start.md       Automatic routing mandate text
examples/pstack-models.md    Model configuration template
install.sh                   Global / project installer
```

## Known limitations

- OpenCode's `subagent` has no model parameter. This port addresses that by splitting agents per role.
- The four panel agents are shared by `arena`, `architect`, and `interrogate`. pstack checks `arena runners`, `architect runners`, `interrogate reviewers`, then `arena cross-judge pool`, and uses the first list that contains a real model. If you write different lists for the three roles, the first role that is not entirely `inherit-parent` wins. Write the same list, or edit the `pstack-panel-*` agents directly.
- OpenCode subagents are one level deep by default. The parent chat that loaded `poteto-mode` owns every spawn.
- OpenCode has no `SessionStart` hook, so the mandate is injected on every request through the `context` hook.
- Automatic routing applies to every agent, but it is not injected into `poteto-agent`, `pstack-*`, `comment-sicko`, or the thermo-nuclear agents.

## License and attribution

MIT. The original pstack is by Lauren Tan (poteto), the Claude Code version is by Michael Denyer, and parts of cursor-team-kit and thermos are by Cursor. See [NOTICE.md](NOTICE.md), [LICENSE](LICENSE), [LICENSE-cursor-team-kit](LICENSE-cursor-team-kit), and [LICENSE-thermos](LICENSE-thermos) for details.
