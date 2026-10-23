# NOTICE for the skills distribution

This notice covers the contents of `skills/` when they are copied or linked without the rest of the OpenCode port. The same MIT terms apply to the full repository; see [NOTICE.md](NOTICE.md) for provenance of the plugin, commands, agents, and tooling.

## Upstream sources

| Included work | Upstream | Copyright | License |
| --- | --- | --- | --- |
| pstack-derived skills, principles, playbooks, scripts, and `poteto-agent` guidance | [cursor/plugins/pstack](https://github.com/cursor/plugins/tree/e46364b8be46000b7df0f260550cd712afbb8d36/pstack), with later additions from [3fe2823](https://github.com/cursor/plugins/tree/3fe2823ce17c1656c222d4b7c59d3f82fbf20143/pstack), [4612556](https://github.com/cursor/plugins/tree/4612556/pstack), [7314f72](https://github.com/cursor/plugins/tree/7314f72/pstack), [e8d856f](https://github.com/cursor/plugins/tree/e8d856f/pstack), [23e4138](https://github.com/cursor/plugins/tree/23e4138/pstack), [e43c7ee](https://github.com/cursor/plugins/tree/e43c7ee/pstack), [2cbf585](https://github.com/cursor/plugins/tree/2cbf585/pstack), [997ffc7](https://github.com/cursor/plugins/tree/997ffc7/pstack), [99743e9](https://github.com/cursor/plugins/tree/99743e9/pstack), and [7b353f7](https://github.com/cursor/plugins/tree/7b353f7/pstack) | (c) 2026 Lauren Tan | [MIT](LICENSE) |
| `deslop`, `make-pr-easy-to-review`, `fix-ci`, `fix-merge-conflicts`, `get-pr-comments`, and `what-did-i-get-done` | [cursor/plugins/cursor-team-kit](https://github.com/cursor/plugins/tree/e46364b8be46000b7df0f260550cd712afbb8d36/cursor-team-kit) | (c) 2026 Cursor | [MIT](LICENSE-cursor-team-kit) |
| `thermos`, `thermo-nuclear-review`, and `thermo-nuclear-code-quality-review` | [cursor/plugins/thermos](https://github.com/cursor/plugins/tree/118e73b0e196e4d49d5aade7ce6dd8985a621f68/thermos) | (c) 2026 Cursor | [MIT](LICENSE-thermos) |
| Claude Code adaptations, including the `babysit` skill and the OpenCode-facing structure this distribution follows | [michael-denyer/pstack-claude](https://github.com/michael-denyer/pstack-claude/tree/356c6e0f978df729eb16f227d795f34d221c5aad) | (c) 2026 Michael Denyer | [MIT](LICENSE) |

## Changes in this distribution

The OpenCode port changes runtime names, tool calls, slash commands, agent names, model references, and supporting prose to match OpenCode. It also adds `skills/poteto-mode/references/opencode-tools.md` and hides the `principle-*` skills from automatic invocation.

The OpenCode port's modifications and additions are released under the same [MIT license](LICENSE). Upstream copyright notices in source files are preserved.
