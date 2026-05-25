#!/usr/bin/env node
'use strict'

const { readFileSync, writeFileSync, readdirSync } = require('fs')
const { join, relative, dirname } = require('path')

const ROOT = join(__dirname, '..')
const PI_SRC = join(ROOT, 'packages/pi-coding-agent/src')
const PI_CORE = join(PI_SRC, 'core')

const PI_CORE_MODULES = new Set([
  'auth-storage', 'defaults', 'extensions', 'messages', 'model-registry', 'model-resolver',
  'resource-loader', 'session-manager', 'settings-manager', 'timings', 'tools', 'prompt-templates',
  'skills', 'slash-commands', 'token-telemetry', 'retry-handler', 'event-bus', 'exec',
  'footer-data-provider', 'hooks-runner', 'local-model-check', 'models-json-writer',
  'package-commands', 'package-manager', 'resolve-config-value', 'retryable-error-regex',
  'discovery-cache', 'model-discovery', 'fs-utils', 'constants', 'diagnostics', 'db-snapshot',
])

function walk(dir, fn) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) walk(p, fn)
    else if (e.name.endsWith('.ts')) fn(p)
  }
}

function piRel(fromFile, subpath) {
  const fromDir = dirname(fromFile)
  const target = join(PI_SRC, subpath)
  let rel = relative(fromDir, target).replace(/\\/g, '/')
  if (!rel.startsWith('.')) rel = './' + rel
  return rel
}

function fixContent(file, content) {
  let c = content

  // Normalize bad migration patches
  c = c.replace(/@gsd\/pi-coding-agent\/dist\//g, piRel(file, '').replace(/\.$/, '') + '/')
  c = c.replace(/@gsd\/agent-core\/dist\//g, './')

  // main.ts and modes: config/migrations at pi root
  c = c.replace(/from "\.\/config\.js"/g, `from "${piRel(file, 'config.js')}"`)
  c = c.replace(/from "\.\/migrations\.js"/g, `from "${piRel(file, 'migrations.js')}"`)

  // theme path fixes
  c = c.replace(/modes\/interactive\/theme\//g, piRel(file, 'theme/').replace(/\/$/, '') + '/')
  c = c.replace(/\.\.\/\.\.\/pi-coding-agent\/src\/theme\//g, piRel(file, 'theme/'))

  // export-html in main moved to agent-core
  c = c.replace(
    /from "\.\/export-html\/index\.js"/g,
    `from "${relative(dirname(file), join(ROOT, 'packages/gsd-agent-core/src/export-html/index.js')).replace(/\\/g, '/')}"`,
  )

  // sdk in main/modes -> agent-core
  c = c.replace(
    /from "\.\/sdk\.js"/g,
    `from "${relative(dirname(file), join(ROOT, 'packages/gsd-agent-core/src/sdk.js')).replace(/\\/g, '/')}"`,
  )
  c = c.replace(
    /from "\.\.\/core\/sdk\.js"/g,
    `from "${relative(dirname(file), join(ROOT, 'packages/gsd-agent-core/src/sdk.js')).replace(/\\/g, '/')}"`,
  )

  // agent-session imports in modes
  c = c.replace(
    /from "\.\.\/\.\.\/core\/agent-session\.js"/g,
    `from "${relative(dirname(file), join(ROOT, 'packages/gsd-agent-core/src/agent-session.js')).replace(/\\/g, '/')}"`,
  )
  c = c.replace(
    /from "\.\.\/core\/agent-session\.js"/g,
    `from "${relative(dirname(file), join(ROOT, 'packages/gsd-agent-core/src/agent-session.js')).replace(/\\/g, '/')}"`,
  )

  // keybindings, compaction-orchestrator from agent-core
  for (const mod of ['keybindings', 'compaction-orchestrator', 'contextual-tips', 'blob-store', 'artifact-manager']) {
    const re = new RegExp(`from "\\.\\.\\/core\\/${mod}\\.js"`, 'g')
    c = c.replace(re, `from "${relative(dirname(file), join(ROOT, `packages/gsd-agent-core/src/${mod}.js`)).replace(/\\/g, '/')}"`)
    const re2 = new RegExp(`from "\\.\\/core\\/${mod}\\.js"`, 'g')
    c = c.replace(re2, `from "${relative(dirname(file), join(ROOT, `packages/gsd-agent-core/src/${mod}.js`)).replace(/\\/g, '/')}"`)
  }

  // ./core/X.js -> pi-coding-agent core (when X is upstream module)
  c = c.replace(/from "\.\/core\/([a-z0-9_-]+)\.js"/g, (m, mod) => {
    if (PI_CORE_MODULES.has(mod) || mod.startsWith('tools/')) {
      return `from "${piRel(file, `core/${mod}.js`)}"`
    }
    return m
  })
  c = c.replace(/from "\.\.\/core\/([a-z0-9_-]+)\.js"/g, (m, mod) => {
    if (PI_CORE_MODULES.has(mod)) {
      return `from "${piRel(file, `core/${mod}.js`)}"`
    }
    return m
  })
  c = c.replace(/from "\.\.\/\.\.\/core\/([a-z0-9_-]+)\.js"/g, (m, mod) => {
    if (PI_CORE_MODULES.has(mod)) {
      return `from "${piRel(file, `core/${mod}.js`)}"`
    }
    return m
  })

  // ./core/tools/ -> pi
  c = c.replace(/from "\.\/core\/tools\//g, `from "${piRel(file, 'core/tools/')}`)
  c = c.replace(/from "\.\.\/core\/tools\//g, `from "${piRel(file, 'core/tools/')}`)
  c = c.replace(/from "\.\.\/\.\.\/core\/tools\//g, `from "${piRel(file, 'core/tools/')}`)

  // ./core/extensions -> pi
  c = c.replace(/from "\.\/extensions\//g, `from "${piRel(file, 'core/extensions/')}`)
  c = c.replace(/from "\.\/extensions\.js"/g, `from "${piRel(file, 'core/extensions/index.js')}"`)

  // ./utils/ in agent-core -> pi utils
  c = c.replace(/from "\.\/utils\//g, `from "${piRel(file, 'utils/')}`)

  // agent-core internal: pi core modules referenced as ./module
  if (file.includes('gsd-agent-core')) {
    for (const mod of PI_CORE_MODULES) {
      const re = new RegExp(`from "\\./${mod}\\.js"`, 'g')
      c = c.replace(re, `from "${piRel(file, `core/${mod}.js`)}"`)
      const reIndex = new RegExp(`from "\\./${mod}/`, 'g')
      c = c.replace(reIndex, `from "${piRel(file, `core/${mod}/`)}`)
    }
    // tools subimports
    c = c.replace(/from "\.\/tools\//g, `from "${piRel(file, 'core/tools/')}`)
  }

  // utils path for pi-coding-agent
  c = c.replace(/from "\.\.\/utils\//g, `from "${piRel(file, 'utils/')}`)
  c = c.replace(/from "\.\.\/\.\.\/utils\//g, `from "${piRel(file, 'utils/')}`)

  return c
}

for (const pkg of ['gsd-agent-core', 'gsd-agent-modes']) {
  walk(join(ROOT, 'packages', pkg, 'src'), (file) => {
    const orig = readFileSync(file, 'utf8')
    const fixed = fixContent(file, orig)
    if (fixed !== orig) writeFileSync(file, fixed)
  })
}

// Fix pi-coding-agent remaining theme imports
walk(PI_SRC, (file) => {
  let c = readFileSync(file, 'utf8')
  const n = c.replace(/modes\/interactive\/theme\//g, 'theme/')
  if (n !== c) writeFileSync(file, n)
})

console.log('Import fixes applied')
