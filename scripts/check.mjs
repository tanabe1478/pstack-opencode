#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

const root = new URL("..", import.meta.url).pathname
const errors = []
const warnings = []

function fail(message) {
  errors.push(message)
}

function frontmatter(path) {
  const text = readFileSync(path, "utf8")
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
  if (!match) return undefined
  const data = {}
  for (const line of match[1].split(/\r?\n/)) {
    if (!line || line.startsWith(" ") || line.startsWith("#")) continue
    const colon = line.indexOf(":")
    if (colon < 1) continue
    data[line.slice(0, colon).trim()] = line.slice(colon + 1).trim()
  }
  return data
}

const skillDirs = readdirSync(join(root, "skills")).filter((entry) => {
  return statSync(join(root, "skills", entry)).isDirectory()
})

for (const dir of skillDirs) {
  const path = join(root, "skills", dir, "SKILL.md")
  const data = frontmatter(path)
  if (!data) {
    fail(`${dir}: missing frontmatter`)
    continue
  }
  if (data.name !== dir) fail(`${dir}: frontmatter name is ${data.name ?? "missing"}`)
  if (!data.description) fail(`${dir}: missing description`)
  if (dir.startsWith("principle-") && !readFileSync(path, "utf8").includes("opencode/autoinvoke: false")) {
    fail(`${dir}: principle skill is not hidden from OpenCode autoinvoke`)
  }
}

const publicSkills = skillDirs.filter((dir) => !dir.startsWith("principle-"))
const commands = readdirSync(join(root, "commands"))
  .filter((entry) => entry.endsWith(".md"))
  .map((entry) => entry.slice(0, -3))
  .sort()

for (const skill of publicSkills) {
  if (!commands.includes(skill)) fail(`missing command for ${skill}`)
}
for (const command of commands) {
  if (!publicSkills.includes(command)) fail(`command ${command} has no public skill`)
  const data = frontmatter(join(root, "commands", `${command}.md`))
  if (!data?.description) fail(`command ${command} is missing a description`)
  const text = readFileSync(join(root, "commands", `${command}.md`), "utf8")
  if (!text.includes(`id \`${command}\``)) fail(`command ${command} does not load its skill`)
}

const agents = readdirSync(join(root, "agents"))
  .filter((entry) => entry.endsWith(".md"))
  .map((entry) => entry.slice(0, -3))
  .sort()

const roleAgents = [
  "pstack-feature",
  "pstack-bug-fix",
  "pstack-perf",
  "pstack-hillclimb",
  "pstack-judgment",
  "pstack-strongest",
  "pstack-how-explorer",
  "pstack-how-explainer",
  "pstack-why-investigator",
  "pstack-why-synthesizer",
  "pstack-reflect-tooling",
  "pstack-reflect-judgment",
  "pstack-panel-1",
  "pstack-panel-2",
  "pstack-panel-3",
  "pstack-panel-4",
  "pstack-swarm-worker",
]

for (const agent of [...roleAgents, "poteto-agent", "comment-sicko", "thermo-nuclear-review-subagent", "thermo-nuclear-code-quality-review-subagent"]) {
  if (!agents.includes(agent)) fail(`missing agent ${agent}`)
  const path = join(root, "agents", `${agent}.md`)
  if (!agents.includes(agent)) continue
  const data = frontmatter(path)
  if (!data) fail(`agent ${agent}: missing frontmatter`)
  else {
    // `name` is not a V2 agent field. Its presence routes the whole file
    // through the V1 migration path, where V2 `permissions` are ignored.
    if (data.name) fail(`agent ${agent}: remove the legacy name field`)
    if (data.mode !== "subagent") fail(`agent ${agent}: mode is not subagent`)
    if (!data.description) fail(`agent ${agent}: missing description`)
  }
}

const plugin = readFileSync(join(root, "plugins", "pstack.ts"), "utf8")
for (const agent of roleAgents) {
  if (!plugin.includes(agent)) warnings.push(`plugin does not mention ${agent}`)
}
if (!plugin.includes("session hook")) fail("plugin does not read the session hook setting")
if (!plugin.includes("pstack-models.md")) fail("plugin does not read pstack-models.md")

for (const path of [
  "skills/poteto-mode/references/opencode-tools.md",
  "hooks/session-start.md",
  "examples/pstack-models.md",
  "install.sh",
  "uninstall.sh",
  "LICENSE",
  "NOTICE.md",
]) {
  try {
    statSync(join(root, path))
  } catch {
    fail(`missing ${path}`)
  }
}

for (const warning of warnings) console.warn(`warning: ${warning}`)
if (errors.length) {
  for (const error of errors) console.error(`error: ${error}`)
  process.exit(1)
}
console.log(`ok: ${skillDirs.length} skills, ${publicSkills.length} commands, ${agents.length} agents`)
