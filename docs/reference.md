# pstack for OpenCode reference

## Commands

Every public skill is a slash command. The 24 `principle-*` skills are hidden from the automatic skill list but remain loadable by ID.

| Command | Use it when |
| --- | --- |
| `/architect` | Sketch types, signatures, and module structure before code, then stay in the loop while implementation fills in. Use for /architect, 'architect this', 'design this', or non-trivial work where jumping to code would lock in the wrong shape. |
| `/arena` | Spawn N parallel candidates at the same task, pick a base, graft the strongest parts of the losers into it. Use for /arena, 'arena this', 'throw it in the arena', or when one attempt at a non-trivial artifact would lock in the wrong shape. |
| `/automate-me` | Use for "automate me", "create/update/refresh my -mode skill", "turn/capture my preferences or working style into a skill", or wanting agents to follow how the user works. Drafts or revises a personal -mode skill via plugin-dev:skill-development + unslop, optionally pulling fresh evidence from recent transcripts. |
| `/babysit` | Watch an open PR - fix failing CI, handle the straightforward review comments, and drive it to a mergeable state. Claude Code analog of Cursor's built-in /babysit. Use after opening a PR when the user wants the agent to shepherd it without re-prompting. |
| `/benchmark-checklist` | Vet a perf measurement (limiter, tuning, limits, errors, repeatability, relevance, and whether the work happened) before you report or act on it. Use when you run a benchmark or report a speedup or regression you measured. |
| `/blast-radius` | Find what a change could break somewhere else before it ships, beyond the diff, and prove the one fact it's safe because of by running real code instead of writing it up. Use for 'blast radius of X', 'what could this break', reviewing a small diff you don't trust, or a brief that asserts something about existing code ('make X public', 'X already handles Y') before you design against that assertion. |
| `/bro` | Restate the last message in plain human language, with no jargon. Use for /bro or when asked to say it plainly. |
| `/correct` | Find the mistakes agents keep repeating in this repo and make each one impossible. Try architecture first, then types, then a lint whose error names the fix, then a test, and write docs last. Prove each check fails on a real past mistake. Repeat this each time the operator corrects you. Use for /correct. |
| `/create-formal-verification-skill` | Generate a project-local skill that formally verifies the code where a bug costs the most and tests reach the least, in any language, with whichever verification tool fits. Use for /create-formal-verification-skill, "model-check this race", "prove this invariant", or when concurrency, retries, state machines, parsers, or unsafe code need more than tests. |
| `/create-verification-skill` | Generate a project-local verification skill that drives your app the way a user does - any language, framework, or platform. Use for /create-verification-skill, "make a control skill for this repo", "make a driver skill for this repo", or when a project has no scripted way to prove UI/CLI/service behavior. |
| `/deslop` | Remove AI-generated code slop and clean up code style |
| `/figure-it-out` | Design an auditable playbook when no narrower one fits: a large migration, an ambitious multi-part change, or work a human reviews after stepping away. Scales rigor to the task, runs a hypothesis loop, and logs decisions. Use for /figure-it-out or 'figure it out'. |
| `/fix-ci` | Find failing PR checks, inspect logs or external check links, and apply focused fixes |
| `/fix-merge-conflicts` | Resolve merge conflicts non-interactively, validate build and tests, and finalize conflict resolution |
| `/get-pr-comments` | Fetch and summarize review comments from the active pull request |
| `/how` | Use for "how does X work", code walkthroughs before changing something, and placement / ownership / layering questions ("where should this live", "which package owns this", "is this the right layer"). Explains subsystem architecture, runtime flow, onboarding mental models. Use why for motivation. |
| `/in-your-own-words` | Restate in your own words what you think the user's goals are and what problem they're trying to solve. Use for /in-your-own-words. |
| `/interrogate` | Use for "interrogate", "adversarial review", "multi-model review", "challenge this", "stress test this code", "find blind spots", or "tear this apart". Multiple LLM reviewers challenge changes from independent angles. |
| `/ketchup` | Catch the user up on what changed in this chat since their last message, in plain words and small visuals. List every item waiting on them with what they need to decide it from the reply alone. Use for /ketchup. |
| `/maintain-formal-verification-skill` | Bring a project's formal verification back in line with the code after the code changes: find the commits that touched verified code, update the model, harness, or properties to describe the code as it is now, rerun, and say whether each failure is drift in the verification or a bug in the code. Use for /maintain-formal-verification-skill, "is the model still true to the code", or after merges and refactors that touched verified code without rechecking it. |
| `/maintain-verification-skill` | Periodic pass that keeps a project's verification skill and feature map honest: parallel source readers per feature, one live session driving every feature, at most one PR of proven corrections. Use for /maintain-verification-skill or "audit the verify skill". |
| `/make-pr-easy-to-review` | Prepare PRs for review by cleaning noisy history, improving PR descriptions, and adding reviewer guidance without changing code behavior. Use for "make this easy to review", "tidy this PR", "clean up commits", or "annotate the diff". |
| `/no-comments` | Spawn the comment-sicko subagent, fix accepted findings, and offer encodings for claimed constraints. |
| `/poteto-help` | Guides users through pstack setup, /poteto-mode, and picking the skill, playbook, or principle for a task. Type /poteto-help with a question. |
| `/poteto-mode` | poteto's agent style for concise, detailed responses, deliberate subagents, unslopped prose, simple code, and verified work. Use for poteto, /poteto-mode, or requests to work in this style. |
| `/recall` | Reconstruct your recent working context from your own chat history, live state, and the shared record (user reports, prior fixes, incidents), then hand back a tight current-state brief. Use for 'recall my work on X', 'catch me up', 'what have I been working on', 'where did I leave off', before starting or resuming work, and before telling the user that something was never recorded. |
| `/reflect` | Spawn three parallel review subagents over the active transcript, surface learnings, and route each to a concrete edit on an existing skill. Use when the user says reflect. |
| `/setup-pstack` | Configure which models pstack uses per role. Detects available models and writes the current runtime's override sheet. Use for /setup-pstack, "configure pstack models", changing pstack's model choices, or turning the SessionStart hook on or off. |
| `/sharpen` | Sharpen a task before starting: the expert approach, what the user is really after, and the right level of specification. Use for /sharpen. |
| `/show-me-your-work` | Keep a reviewable decision trail for long-running or unattended work: a TSV log with one row per decision (what, why, evidence, result). Local by default; commit it when a reviewer needs the trail to trust the result. Use for /show-me-your-work, autonomous or multi-phase runs, or work a human reviews after stepping away. |
| `/swarm` | Fan out N parallel workers, drain them, and return one report. Use for /swarm, 'swarm this', or parallel coverage, races, gauntlets, and exploration. |
| `/tdd` | Use only when the user explicitly asks for TDD, a failing test, or a regression test, OR when the bug has an obvious cheap local test target. Skip when the test path is unclear, expensive, integration-heavy, or not requested. |
| `/teach` | Explain a body of work plainly so a person actually understands it. Runs the `how` and `why` skills and weaves what they find into one clear explanation. Use for 'teach me this', 'help me really understand X', 'explain this change or subsystem to me'. |
| `/technical-writing` | Layered technical-writing standard: Diátaxis structure, Google developer style sentences, STE instruction rules, Global English syntax. Use for /technical-writing or when writing or reviewing docs, RFCs, readmes, PR descriptions, or commit messages. |
| `/thermo-nuclear-code-quality-review` | Run an extremely strict maintainability review for abstraction quality, giant files, and spaghetti-condition growth. Use for a thermo-nuclear code quality review, thermonuclear review, deep code quality audit, or especially harsh maintainability review. |
| `/thermo-nuclear-review` | Comprehensive security and correctness audit of a branch's changes. Use for thermo nuclear, thermonuclear, or deep review requests, or branch/PR diff audits focused on bugs, breaking changes, security issues, devex regressions, and feature-gate leaks. |
| `/thermos` | Launch both thermo-nuclear review subagents in parallel, then synthesize their findings. Use for thermos, double thermo review, or combined bug/security and code-quality branch audits. |
| `/typescript-best-practices` | TypeScript best practices. Use when reading or editing any .ts or .tsx file. |
| `/unslop` | Cut AI tells from any writing. |
| `/what-did-i-get-done` | Summarize authored commits over a user-specified time period into a concise update |
| `/why` | Use for 'why does X work this way', 'why we picked Y', design rationale, regressions, postmortems, or data-backed thresholds. Discovers available MCPs and queries each evidence category (source control, issue tracker, long-form docs, real-time chat, infrastructure observability, error tracking, product analytics warehouse) in parallel, then returns a cited read on decisions and tradeoffs. Use how for runtime behavior. |

## Runtime

- OpenCode 2.1.3 or later.
- Skills: `~/.config/opencode/skills/` or `.opencode/skills/`.
- Commands: `~/.config/opencode/commands/` or `.opencode/commands/`.
- Agents: `~/.config/opencode/agents/` or `.opencode/agents/`.
- Plugin: `~/.config/opencode/plugins/pstack.ts` or `.opencode/plugins/pstack.ts`.
- Model sheet: `~/.config/opencode/pstack-models.md`, or `.opencode/pstack-models.md` per project.

## Model roles

See [the OpenCode mapping](../skills/poteto-mode/references/opencode-tools.md#role-agents).
