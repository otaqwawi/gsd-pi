#!/usr/bin/env node
'use strict'

const { readFileSync, writeFileSync, readdirSync } = require('fs')
const { join } = require('path')

const ROOT = join(__dirname, '..')
const MODES_SRC = join(ROOT, 'packages/gsd-agent-modes/src')

function walk(dir, fn) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) walk(p, fn)
    else if (e.name.endsWith('.ts')) fn(p)
  }
}

function fix(content) {
  let c = content

  // agent-core relative paths -> package imports
  c = c.replace(/from "(\.\.\/)+gsd-agent-core\/src\/([^"]+)"/g, 'from "@gsd/agent-core"')
  c = c.replace(/from "\.\.\/\.\.\/gsd-agent-core\/src\/([^"]+)"/g, 'from "@gsd/agent-core"')

  // Granular agent-core sub-imports (preserve specific symbols via main export)
  const agentCoreModules = {
    'agent-session.js': '@gsd/agent-core',
    'sdk.js': '@gsd/agent-core',
    'export-html/index.js': '@gsd/agent-core',
    'contextual-tips.js': '@gsd/agent-core',
    'bash-executor.js': '@gsd/agent-core',
    'keybindings.js': '@gsd/pi-coding-agent/core/keybindings.js',
  }
  for (const [mod, pkg] of Object.entries(agentCoreModules)) {
    c = c.replace(new RegExp(`from "@gsd/agent-core"`, 'g'), (match, offset) => {
      // handled below with explicit patterns
      return match
    })
  }

  // Re-apply explicit gsd-agent-core path replacements with correct targets
  c = c.replace(
    /from "(\.\.\/)+gsd-agent-core\/src\/agent-session\.js"/g,
    'from "@gsd/agent-core"',
  )
  c = c.replace(/from "(\.\.\/)+gsd-agent-core\/src\/sdk\.js"/g, 'from "@gsd/agent-core"')
  c = c.replace(
    /from "(\.\.\/)+gsd-agent-core\/src\/export-html\/index\.js"/g,
    'from "@gsd/agent-core"',
  )
  c = c.replace(
    /from "(\.\.\/)+gsd-agent-core\/src\/contextual-tips\.js"/g,
    'from "@gsd/agent-core"',
  )
  c = c.replace(
    /from "(\.\.\/)+gsd-agent-core\/src\/bash-executor\.js"/g,
    'from "@gsd/agent-core"',
  )
  c = c.replace(
    /from "(\.\.\/)+gsd-agent-core\/src\/keybindings\.js"/g,
    'from "@gsd/pi-coding-agent/core/keybindings.js"',
  )

  // Theme moved to pi-coding-agent
  c = c.replace(/from "\.\/theme\/theme\.js"/g, 'from "@gsd/pi-coding-agent/theme/theme.js"')
  c = c.replace(/from "\.\.\/interactive\/theme\/theme\.js"/g, 'from "@gsd/pi-coding-agent/theme/theme.js"')

  // print-mode agent-session
  c = c.replace(/from "\.\/agent-session\.js"/g, 'from "@gsd/agent-core"')

  // config at pi root
  c = c.replace(/from "\.\.\/\.\.\/\.\.\/config\.js"/g, 'from "@gsd/pi-coding-agent/config.js"')
  c = c.replace(/from "\.\.\/config\.js"/g, 'from "@gsd/pi-coding-agent/config.js"')

  // utils under pi
  c = c.replace(/from "\.\.\/\.\.\/\.\.\/utils\//g, 'from "@gsd/pi-coding-agent/utils/')
  c = c.replace(/from "\.\.\/utils\//g, 'from "@gsd/pi-coding-agent/utils/')

  // core paths in main
  c = c.replace(/from "\.\/core\//g, 'from "@gsd/pi-coding-agent/core/')
  c = c.replace(/await import\("\.\/core\//g, 'await import("@gsd/pi-coding-agent/core/')

  // compaction in pi -> agent-core
  c = c.replace(
    /@gsd\/pi-coding-agent\/core\/compaction\//g,
    '@gsd/agent-core/compaction/',
  )

  return c
}

walk(MODES_SRC, (file) => {
  const orig = readFileSync(file, 'utf8')
  const updated = fix(orig)
  if (updated !== orig) writeFileSync(file, updated)
})

console.log('agent-modes import fixes applied')
