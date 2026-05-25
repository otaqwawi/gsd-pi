#!/usr/bin/env node
'use strict'

const { readFileSync, writeFileSync, readdirSync } = require('fs')
const { join } = require('path')

const ROOT = join(__dirname, '..')
const PI = join(ROOT, 'packages/pi-coding-agent/src')

const AGENT_CORE_IMPORTS = {
  './agent-session.js': '@gsd/agent-core',
  '../agent-session.js': '@gsd/agent-core',
  './bash-executor.js': '@gsd/agent-core',
  '../bash-executor.js': '@gsd/agent-core',
  './fallback-resolver.js': '@gsd/agent-core',
  '../fallback-resolver.js': '@gsd/agent-core',
  './compaction/index.js': '@gsd/agent-core',
  '../compaction/index.js': '@gsd/agent-core',
  './keybindings.js': '@gsd/agent-core',
  '../keybindings.js': '@gsd/agent-core',
  './contextual-tips.js': '@gsd/agent-core',
  '../contextual-tips.js': '@gsd/agent-core',
  './blob-store.js': '@gsd/agent-core',
  '../blob-store.js': '@gsd/agent-core',
  './artifact-manager.js': '@gsd/agent-core',
  '../artifact-manager.js': '@gsd/agent-core',
  './system-prompt.js': '@gsd/agent-core',
  '../system-prompt.js': '@gsd/agent-core',
  './lifecycle-hooks.js': '@gsd/agent-core',
  '../lifecycle-hooks.js': '@gsd/agent-core',
  './sdk.js': '@gsd/agent-core',
  '../sdk.js': '@gsd/agent-core',
}

const AGENT_MODES_IMPORTS = {
  '../cli/args.js': '@gsd/agent-modes',
  '../../cli/args.js': '@gsd/agent-modes',
  '../modes/interactive/controllers/chat-controller.js': '@gsd/agent-modes',
}

function walk(dir, fn) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) walk(p, fn)
    else if (e.name.endsWith('.ts')) fn(p)
  }
}

function fixFile(file) {
  let c = readFileSync(file, 'utf8')
  const orig = c

  for (const [from, pkg] of Object.entries({ ...AGENT_CORE_IMPORTS, ...AGENT_MODES_IMPORTS })) {
    c = c.replaceAll(`from "${from}"`, `from "${pkg}"`)
  }

  c = c.replace('from "../../../config.js"', 'from "../../config.js"')

  if (c !== orig) writeFileSync(file, c)
}

walk(PI, fixFile)

// Trim core/index.ts to remove agent-core re-exports
writeFileSync(join(PI, 'core/index.ts'), `/**
 * Core modules shared between all run modes.
 */

export { createEventBus, type EventBus, type EventBusController } from "./event-bus.js";
export {
\tcreateHooksRunner,
\tisProjectHooksTrusted,
\ttype HookInvocation,
\ttype HookName,
\ttype HookScope,
\ttype HookStdoutResult,
\ttype HooksRunner,
\ttype HooksRunnerOptions,
} from "./hooks-runner.js";

export {
\ttype AgentEndEvent,
\ttype AgentStartEvent,
\ttype AgentToolResult,
\ttype AgentToolUpdateCallback,
\ttype BeforeAgentStartEvent,
\ttype ContextEvent,
\tdiscoverAndLoadExtensions,
\ttype ExecOptions,
\ttype ExecResult,
\ttype Extension,
\ttype ExtensionAPI,
\ttype ExtensionManifest,
\ttype ExtensionCommandContext,
\ttype ExtensionContext,
\ttype ExtensionError,
\ttype ExtensionEvent,
\ttype ExtensionFactory,
\ttype ExtensionFlag,
\ttype ExtensionHandler,
\tExtensionRunner,
\ttype ExtensionShortcut,
\ttype ExtensionUIContext,
\ttype LoadExtensionsResult,
\ttype MessageRenderer,
\ttype RegisteredCommand,
\ttype SessionBeforeCompactEvent,
\ttype SessionBeforeForkEvent,
\ttype SessionBeforeSwitchEvent,
\ttype SessionBeforeTreeEvent,
\ttype SessionCompactEvent,
\ttype SessionForkEvent,
\ttype SessionShutdownEvent,
\ttype SessionStartEvent,
\ttype SessionSwitchEvent,
\ttype SessionTreeEvent,
\ttype ToolCallEvent,
\treadManifest,
\treadManifestFromEntryPath,
\ttype SortResult,
\ttype SortWarning,
\tsortExtensionPaths,
\ttype ToolDefinition,
\ttype ToolRenderResultOptions,
\ttype ToolResultEvent,
\ttype TurnEndEvent,
\ttype TurnStartEvent,
\twrapToolsWithExtensions,
} from "./extensions/index.js";
`)

console.log('Fixed pi-coding-agent imports to @gsd/agent-core')
