import { Model, Plugin } from "@opencode/plugin"
import { existsSync, readFileSync, statSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

type ModelRef = {
  providerID: string
  model: string
  variant?: string
}

type Sheet = {
  roles: Map<string, string[]>
  defaultEffort: string
  sessionHook: boolean
}

type Registration = { dispose: () => Promise<void> }

const ROLE_AGENTS: Record<string, string> = {
  "feature, refactoring": "pstack-feature",
  "bug-fix": "pstack-bug-fix",
  "perf-issue": "pstack-perf",
  hillclimb: "pstack-hillclimb",
  "judgment and prose": "pstack-judgment",
  "strongest judgment": "pstack-strongest",
  "how explorer": "pstack-how-explorer",
  "how explainer": "pstack-how-explainer",
  "why investigators": "pstack-why-investigator",
  "why synthesizer": "pstack-why-synthesizer",
  "reflect tooling": "pstack-reflect-tooling",
  "reflect judgment, divergent, synthesizer": "pstack-reflect-judgment",
  "swarm workers": "pstack-swarm-worker",
}

const PANEL_AGENTS = ["pstack-panel-1", "pstack-panel-2", "pstack-panel-3", "pstack-panel-4"]

// The four panel agents are shared by every pstack panel workflow. Use the
// first panel role in this order that assigns at least one concrete model.
const PANEL_ROLES = [
  "arena runners",
  "architect runners",
  "interrogate reviewers",
  "arena cross-judge pool",
]

const SENTINEL_AGENT = "poteto-agent"
const DELEGATE_PREFIXES = ["pstack-", "thermo-nuclear-"]
const DELEGATE_IDS = new Set(["poteto-agent", "comment-sicko"])
const LATE_REGISTRATION_ATTEMPTS = 60
const LATE_REGISTRATION_DELAY = 250

function configDirectory(): string {
  if (process.env.OPENCODE_CONFIG_DIR) return process.env.OPENCODE_CONFIG_DIR
  return join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "opencode")
}

function projectSheet(directory: string): string {
  return join(directory, ".opencode", "pstack-models.md")
}

function globalSheet(): string {
  return join(configDirectory(), "pstack-models.md")
}

function sheetPath(directory: string): string | undefined {
  const project = projectSheet(directory)
  if (existsSync(project)) return project
  const global = globalSheet()
  if (existsSync(global)) return global
  return undefined
}

function readSheet(path: string | undefined): Sheet {
  const sheet: Sheet = { roles: new Map(), defaultEffort: "session", sessionHook: true }
  if (!path) return sheet

  let text: string
  try {
    text = readFileSync(path, "utf8")
  } catch {
    return sheet
  }

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith("#")) continue
    const colon = line.indexOf(":")
    if (colon < 1) continue
    const key = line.slice(0, colon).trim()
    const value = line.slice(colon + 1).trim()
    if (!value) continue

    if (key === "session hook") {
      sheet.sessionHook = value !== "off"
      continue
    }
    if (key === "default effort") {
      sheet.defaultEffort = value
      continue
    }
    if (key in ROLE_AGENTS || PANEL_ROLES.includes(key)) {
      sheet.roles.set(
        key,
        value
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean),
      )
    }
  }
  return sheet
}

function mtime(path: string | undefined): number {
  if (!path) return 0
  try {
    return statSync(path).mtimeMs
  } catch {
    return 0
  }
}

function parseModel(
  value: string,
  defaultEffort: string,
  variants: Map<string, Set<string>>,
): ModelRef | undefined {
  let entry = value.trim()
  if (!entry) return undefined
  if (entry === "inherit-parent" || entry === "auto") return undefined

  let effort: string | undefined
  const at = entry.match(/\s+@([a-z]+)$/i)
  if (at) {
    effort = at[1].toLowerCase()
    entry = entry.slice(0, at.index).trim()
  }

  const hash = entry.indexOf("#")
  const base = hash >= 0 ? entry.slice(0, hash) : entry
  const slash = base.indexOf("/")
  if (slash < 1 || slash === base.length - 1) return undefined

  const providerID = base.slice(0, slash)
  const model = base.slice(slash + 1)
  const key = `${providerID}/${model}`
  const available = variants.get(key)

  let variant = hash >= 0 ? entry.slice(hash + 1) : undefined
  if (!variant && effort && available?.has(effort)) variant = effort
  if (!variant && defaultEffort !== "session" && available?.has(defaultEffort)) variant = defaultEffort

  return { providerID, model, variant }
}

function modelVariants(models: readonly { providerID: string; id: string; variants: readonly { id: string }[] }[]) {
  const map = new Map<string, Set<string>>()
  for (const model of models) {
    map.set(`${model.providerID}/${model.id}`, new Set(model.variants.map((variant) => variant.id)))
  }
  return map
}

function panelModels(sheet: Sheet, variants: Map<string, Set<string>>): (ModelRef | undefined)[] | undefined {
  for (const role of PANEL_ROLES) {
    const values = sheet.roles.get(role)
    if (!values?.length) continue
    const parsed = values.map((value) => parseModel(value, sheet.defaultEffort, variants))
    if (!parsed.some(Boolean)) continue
    return PANEL_AGENTS.map((_, index) => parsed[index])
  }
  return undefined
}

function roleModels(sheet: Sheet, variants: Map<string, Set<string>>): Map<string, ModelRef | undefined> {
  const result = new Map<string, ModelRef | undefined>()
  for (const [role, agent] of Object.entries(ROLE_AGENTS)) {
    const values = sheet.roles.get(role)
    result.set(agent, values?.[0] ? parseModel(values[0], sheet.defaultEffort, variants) : undefined)
  }

  const panels = panelModels(sheet, variants)
  if (panels) {
    PANEL_AGENTS.forEach((agent, index) => result.set(agent, panels[index]))
  }

  return result
}

function isDelegate(agent: string): boolean {
  return DELEGATE_IDS.has(agent) || DELEGATE_PREFIXES.some((prefix) => agent.startsWith(prefix))
}

function fallbackMandate(): string {
  return [
    "<EXTREMELY_IMPORTANT>",
    "You have pstack for OpenCode.",
    "",
    "Load the `poteto-mode` skill with the `skill` tool and follow it when a task touches more than one file, changes a shared signature, involves a design or architecture choice, or is a bug or performance issue whose cause is not yet known.",
    "",
    "For smaller tasks, work directly and verify on the real artifact. When the intent is already specific, load `tdd`, `architect`, `how`, `why`, `arena`, or `interrogate` directly.",
    "",
    "Read `references/opencode-tools.md` from the installed `poteto-mode` skill before dispatching a subagent or choosing a model. `subagent` takes an agent, not a model; the pstack role agents carry the configured models.",
    "</EXTREMELY_IMPORTANT>",
  ].join("\n")
}

function readMandate(): string {
  const local = fileURLToPath(new URL("../hooks/session-start.md", import.meta.url))
  try {
    return readFileSync(local, "utf8")
  } catch {
    return fallbackMandate()
  }
}

export default Plugin.define({
  id: "pstack",
  async setup(ctx) {
    const mandate = readMandate()
    let path = sheetPath(ctx.location.directory)
    let sheet = readSheet(path)
    let stamp = mtime(path)
    let registration: Registration | undefined
    let targets = new Map<string, ModelRef | undefined>()
    let closed = false

    const apply = async () => {
      const models = await ctx.model.list()
      const variants = modelVariants(models.data)
      targets = roleModels(sheet, variants)
      await registration?.dispose()
      registration = await ctx.agent.transform((editor) => {
        for (const [agentID, ref] of targets) {
          const agent = editor.get(agentID)
          if (!agent) continue
          if (!ref) {
            delete agent.model
            continue
          }
          const variant = ref.variant ? `#${ref.variant}` : ""
          try {
            agent.model = Model.Ref.parse(`${ref.providerID}/${ref.model}${variant}`)
          } catch {
            // An unknown provider/model is left on the skill default so a
            // typo in pstack-models.md cannot take the whole plugin down.
          }
        }
      })
    }

    const ensure = async () => {
      if (closed || registration) return
      const agents = await ctx.agent.list()
      if (!agents.data.some((agent) => agent.id === SENTINEL_AGENT)) return
      await apply()
    }

    const refresh = async () => {
      const nextPath = sheetPath(ctx.location.directory)
      const nextStamp = mtime(nextPath)
      if (nextPath === path && nextStamp === stamp) return
      path = nextPath
      stamp = nextStamp
      sheet = readSheet(path)
      if (registration) await apply()
    }

    // OpenCode loads project agent files after user plugin setup. Registering
    // the transform during setup would place it before the config agent
    // transform, so it would only ever see the built-in agents. Wait until the
    // pstack agents are visible, then register last so the transform replays
    // over the complete agent list.
    let attempts = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    const waitForAgents = async () => {
      if (closed || registration) return
      attempts += 1
      try {
        await ensure()
      } catch {
        // The location may still be initializing; retry below.
      }
      if (!closed && !registration && attempts < LATE_REGISTRATION_ATTEMPTS) {
        timer = setTimeout(() => void waitForAgents(), LATE_REGISTRATION_DELAY)
      }
    }
    timer = setTimeout(() => void waitForAgents(), LATE_REGISTRATION_DELAY)

    await ctx.session.hook("prompt", async () => {
      await refresh()
      if (!registration) await ensure()
    })

    await ctx.session.hook("context", (event) => {
      if (isDelegate(event.agent)) return
      if (!sheet.sessionHook) return
      event.system.push({ type: "text", text: mandate })
    })

    return async () => {
      closed = true
      if (timer) clearTimeout(timer)
      await registration?.dispose()
    }
  },
})
