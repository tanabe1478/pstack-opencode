# pstack for OpenCode

[![MIT license](https://img.shields.io/github/license/tanabe1478/pstack-opencode)](LICENSE)

**An OpenCode port of [Lauren Tan (@poteto)](https://x.com/poteto)'s [pstack](https://github.com/cursor/plugins/tree/main/pstack).** It keeps the skills and workflows close to the original and translates the parts that depend on Claude Code into OpenCode's commands, subagents, model routing, and plugin hooks.

Lauren built pstack from the skills she uses to ship code at Cursor. In a [55-minute interview with Denis Labelle](https://x.com/DenisLabelle/status/2091337807939706928), she says she shipped 1,000 pull requests in one month after steadily improving how her agents work and verify their results.

> If you want to go fast, go deep first.

pstack is not a new model or a hosted service. It gives your agent engineering rules, step-by-step workflows for different kinds of work, focused skills, and small local tools. The normal entry point is `poteto-mode`: you give it a task in plain language, and it chooses the playbook that fits and calls the skills it needs.

This is an unofficial community port. It builds on Michael Denyer's [pstack-claude](https://github.com/michael-denyer/pstack-claude), which brings the same skills to Claude Code. In Cursor, use Lauren's original. In OpenCode, use this repository. Another community port, [Open Pstack](https://github.com/ericlitman/open-pstack), covers Claude Code and Codex and shaped the structure of this README.

## What this port adds

Compared with the Claude Code version:

- **Slash commands.** Every public skill is available as `/<name>`; the 24 `principle-*` skills stay loadable by ID.
- **OpenCode subagents.** `poteto-agent`, the implementation role agents, the review agents, and the four panel agents are defined in `agents/`.
- **Per-role model routing.** OpenCode's `subagent` tool takes an agent, not a model. Each model role therefore gets its own agent, and the plugin writes the configured model onto that agent.
- **Automatic routing.** The plugin injects a short routing mandate into every model request, so an ordinary task request reaches `poteto-mode` when the work needs it.
- **One installer.** `install.sh` links or copies skills, commands, agents, and the plugin into the global or project OpenCode configuration.

## What pstack does

You give `poteto-mode` a task in plain language. It then:

- reads the task and chooses a workflow that fits;
- learns how the current system works before changing it;
- compares designs when the choice matters;
- favors small, simple changes over extra machinery;
- asks several models to challenge important decisions when useful;
- runs the code and checks real behavior instead of stopping at "the tests pass"; and
- carries the work through review, continuous integration, and a ready-to-merge pull request when asked.

pstack does not ask you to trust an agent on day one. It helps the agent leave evidence you can inspect. Start with supervised work, and let it run more in parallel only after its checks have earned that trust in your own repositories.

## Install

Requirements:

- OpenCode 2.1.3 or later
- `git`
- GitHub CLI (`gh`) if you use the PR workflow
- Bun if you use `watch-pr` or `orch`

Install globally:

```sh
git clone https://github.com/tanabe1478/pstack-opencode.git
cd pstack-opencode
./install.sh
```

The installer links skills, commands, agents, and the plugin into `${OPENCODE_CONFIG_DIR:-${XDG_CONFIG_HOME:-$HOME/.config}/opencode}`. It does not overwrite existing files, and it writes a starter `pstack-models.md` only when one is not already there.

Install into one project instead:

```sh
cd /path/to/project
/path/to/pstack-opencode/install.sh --project
```

This links into `./.opencode/`. Project configuration takes precedence over global configuration.

To copy files instead of linking them:

```sh
./install.sh --copy
```

After installing, restart OpenCode or start a new session.

## Get started

### 1. Set up the models

```text
/setup-pstack
```

Setup lists the models that `opencode models` reports, asks which model each role should use, and writes the result to `~/.config/opencode/pstack-models.md`. It accepts `provider/model` references, optional variants such as `provider/model#high`, and the aliases `inherit-parent` and `auto`.

pstack works without splitting models. Setting the panel roles to different models makes `arena`, `architect`, and `interrogate` more useful, because those workflows compare independent attempts.

### 2. Use poteto-mode

```text
/poteto-mode Add saved filters to search. Keep the design simple, verify it in the real app, and open a pull request.
```

For that feature, `poteto-mode` should first understand how search works today, decide how the data should be represented before writing code, implement the smallest complete version, run the feature the way a user would, review the result, and prepare the pull request.

That is the main workflow. The other skills are there when `poteto-mode` needs them, or when you want to call one directly.

```text
/how How does canceling a run work? Is there an N+1?
/interrogate Review this PR
/tdd Write a test that reproduces this bug first
```

The full command list is in [docs/reference.md](docs/reference.md).

## Useful skills

| Skill | Use it when |
| --- | --- |
| `how` | You want a clear explanation of how part of the system works. |
| `why` | You want evidence for why the system was built that way. |
| `architect` | A change crosses a function or module boundary and the design needs to be settled first. |
| `arena` | You want several complete attempts, followed by a comparison of their best parts. |
| `interrogate` | You want different models to try to break a design or diff. |
| `create-verification-skill` | Your project has no repeatable way for an agent to prove real behavior. |
| `maintain-verification-skill` | The project's verification instructions no longer match the product. |
| `create-formal-verification-skill` | A race, an invariant, or another property needs a proof that tests rarely reach. |
| `maintain-formal-verification-skill` | The code a formal verification covers has changed, and you need to know whether a failure is drift or a bug. |
| `babysit` | A pull request needs CI failures and review comments handled until it is ready. |
| `reflect` | A hard task is finished and its lessons should improve the next run. |
| `correct` | Agents keep making the same mistake in a repository and you want a check that stops it. |
| `poteto-help` | You want to know which skill, playbook, or principle fits a question. |
| `in-your-own-words` | You want the agent to restate your goal and the problem before it starts. |
| `sharpen` | You want a prompt rewritten deeper, not bigger, before you send it. It returns the rewritten prompt and does not do the task. |

## Models and token use

OpenCode's `subagent` tool takes an agent ID, not a model. pstack therefore ships one agent per model role, and the plugin applies the value from `pstack-models.md` to that agent.

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

- `provider/model` is an OpenCode model reference. A variant is appended as `#high`.
- `inherit-parent` or `auto` leaves the agent on the parent session's model.
- Panel values are comma-separated. The first entry maps to `pstack-panel-1`, the fourth to `pstack-panel-4`.
- The four panel agents are shared by `arena`, `architect`, and `interrogate`. pstack uses the first panel role that assigns at least one concrete model, in the order `arena runners`, `architect runners`, `interrogate reviewers`, `arena cross-judge pool`.
- `default effort` applies a variant only when the selected model exposes it.
- `session hook: off` stops automatic routing.

Workflows that run several models in parallel spend tokens on each one. A role set to `inherit-parent` runs on the chat's model. To spend less, assign cheaper models or a shorter panel list, and save `poteto-mode` for work that needs the rigor.

When you edit `pstack-models.md`, the plugin notices the change and applies it on the next prompt. Re-running `/setup-pstack` is the validated way to change it; a value the plugin cannot parse leaves the role on its agent default.

## Automatic routing

The plugin adds a short instruction to the system prompt of every model request. It prompts loading `poteto-mode` when the task:

- touches more than one file, or changes a signature other files call;
- involves a design or architecture choice;
- is a bug whose cause is not yet known, or a performance issue.

Small tasks, such as a contained change to one file with an obvious test, a question, or a one-line edit, proceed directly. Naming a skill yourself, such as `/tdd` or `/how`, takes precedence.

Automatic routing applies to every agent except the pstack delegates, so a subagent does not recurse into the mode.

To turn it off, add this line to `pstack-models.md`:

```text
session hook: off
```

## OpenCode mapping

| Feature | Claude Code version | This port |
| --- | --- | --- |
| Skills | `skills/` | `~/.config/opencode/skills/` |
| Commands | Skills become `/pstack:<name>` | `commands/<name>.md` becomes `/<name>` |
| Subagents | `pstack:poteto-agent` | `poteto-agent` |
| Model selection | `Agent`'s `model` | Fixed per role agent |
| Automatic routing | SessionStart hook | OpenCode plugin's `context` hook |
| Model configuration | `~/.claude/pstack-models.md` | `~/.config/opencode/pstack-models.md` |

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
| `pstack-panel-1` through `pstack-panel-4` | Panels for `arena`, `architect`, and `interrogate` |
| `pstack-swarm-worker` | `swarm` workers |
| `comment-sicko` | Comment-removal review (read-only) |
| `thermo-nuclear-review-subagent` | Bug and security audit (read-only) |
| `thermo-nuclear-code-quality-review-subagent` | Maintainability audit (read-only) |

Read-only agents reject `edit`. Only `poteto-agent` and the implementation role agents can edit files.

## Known limitations

- OpenCode's `subagent` has no model parameter. This port addresses that by splitting agents per role.
- The four panel agents are shared by `arena`, `architect`, and `interrogate`. If you write different lists for the three panel roles, the first role that is not entirely `inherit-parent` wins. Write the same list, or edit the `pstack-panel-*` agents directly.
- OpenCode subagents are one level deep by default. The parent chat that loaded `poteto-mode` owns every spawn.
- OpenCode has no `SessionStart` hook, so the mandate is injected on every request through the `context` hook.

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

## Learn from the original

Lauren's [pstack guide](https://github.com/cursor/plugins/tree/main/pstack/docs/guide) walks through a real task, verification, and longer unattended runs. It uses Cursor's interface, but the ideas are the same; use the `/name` commands in this repository instead.

This repository also keeps:

- [the technical reference](docs/reference.md) for every command, runtime path, and model role;
- [the model sheet template](examples/pstack-models.md);
- [the attribution record](NOTICE.md) for pstack, Claude Code port, and imported skills.

## Contributing

Fixes for the OpenCode port and help bringing over new pstack releases are welcome. Search [GitHub Issues](https://github.com/tanabe1478/pstack-opencode/issues) before opening a new one. For larger behavior changes, explain why the change belongs in this port instead of Lauren's original project. New pstack behavior belongs upstream first whenever possible.

## License

MIT. pstack was created by Lauren Tan. This port builds on Michael Denyer's [pstack-claude](https://github.com/michael-denyer/pstack-claude) and includes attributed MIT-licensed work from Cursor Team Kit and thermos. See [NOTICE.md](NOTICE.md), [LICENSE](LICENSE), [LICENSE-cursor-team-kit](LICENSE-cursor-team-kit), and [LICENSE-thermos](LICENSE-thermos) for details.
