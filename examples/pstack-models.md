# pstack model configuration

Per-role model overrides for pstack on OpenCode. Each pstack SKILL.md names its defaults in a Models section; the values here override those defaults. Delete a line to fall back to the skill default. A value of `inherit-parent` or `auto` runs that role on the parent session's model. A model is an OpenCode reference, `provider/model`, optionally with a variant as `provider/model#high`. A list runs one panel agent per entry. The first panel role with a concrete model, in the order `arena runners`, `architect runners`, `interrogate reviewers`, `arena cross-judge pool`, supplies the four shared `pstack-panel-*` agents. `default effort` is `session` or a variant ID; it applies only when the selected model exposes that variant.

feature, refactoring: inherit-parent
bug-fix: inherit-parent
perf-issue: inherit-parent
hillclimb: inherit-parent
judgment and prose: inherit-parent
strongest judgment: inherit-parent
how explorer: inherit-parent
how explainer: inherit-parent
why investigators: inherit-parent
why synthesizer: inherit-parent
reflect tooling: inherit-parent
reflect judgment, divergent, synthesizer: inherit-parent
arena runners: inherit-parent, inherit-parent, inherit-parent, inherit-parent
arena cross-judge pool: inherit-parent, inherit-parent, inherit-parent, inherit-parent
swarm workers: inherit-parent
architect runners: inherit-parent, inherit-parent, inherit-parent, inherit-parent
interrogate reviewers: inherit-parent, inherit-parent, inherit-parent, inherit-parent

default effort: session
session hook: on
