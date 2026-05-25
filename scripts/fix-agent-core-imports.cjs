#!/usr/bin/env node
/** Rewrite gsd-agent-core imports that target pi-coding-agent core modules. */
'use strict'

const { readFileSync, writeFileSync, readdirSync } = require('fs')
const { join } = require('path')

const ROOT = join(__dirname, '..')
const SRC = join(ROOT, 'packages/gsd-agent-core/src')
const PI = '@gsd/pi-coding-agent'

const REWRITES = [
  [/from "\.\.\/config\.js"/g, `from "${PI}/config.js"`],
  [/from "\.\.\/utils\/([^"]+)\.js"/g, `from "${PI}/utils/$1.js"`],
  [/from "\.\/auth-guidance\.js"/g, `from "${PI}/core/auth-guidance.js"`],
  [/from "\.\/auth-storage\.js"/g, `from "${PI}/core/auth-storage.js"`],
  [/from "\.\/defaults\.js"/g, `from "${PI}/core/defaults.js"`],
  [/from "\.\/extensions\/([^"]+)\.js"/g, `from "${PI}/core/extensions/$1.js"`],
  [/from "\.\/extensions\/index\.js"/g, `from "${PI}/core/extensions/index.js"`],
  [/from "\.\/messages\.js"/g, `from "${PI}/core/messages.js"`],
  [/from "\.\/model-registry\.js"/g, `from "${PI}/core/model-registry.js"`],
  [/from "\.\/model-resolver\.js"/g, `from "${PI}/core/model-resolver.js"`],
  [/from "\.\/resource-loader\.js"/g, `from "${PI}/core/resource-loader.js"`],
  [/from "\.\/session-manager\.js"/g, `from "${PI}/core/session-manager.js"`],
  [/from "\.\/settings-manager\.js"/g, `from "${PI}/core/settings-manager.js"`],
  [/from "\.\/telemetry\.js"/g, `from "${PI}/core/telemetry.js"`],
  [/from "\.\/timings\.js"/g, `from "${PI}/core/timings.js"`],
  [/from "\.\/prompt-templates\.js"/g, `from "${PI}/core/prompt-templates.js"`],
  [/from "\.\/skills\.js"/g, `from "${PI}/core/skills.js"`],
  [/from "\.\/slash-commands\.js"/g, `from "${PI}/core/slash-commands.js"`],
  [/from "\.\/source-info\.js"/g, `from "${PI}/core/source-info.js"`],
  [/from "\.\/tools\/([^"]+)\.js"/g, `from "${PI}/core/tools/$1.js"`],
  [/from "\.\.\/messages\.js"/g, `from "${PI}/core/messages.js"`],
  [/from "\.\.\/session-manager\.js"/g, `from "${PI}/core/session-manager.js"`],
  [/from "\.\.\/extensions\/([^"]+)\.js"/g, `from "${PI}/core/extensions/$1.js"`],
  [/from "\.\.\/\.\.\/config\.js"/g, `from "${PI}/config.js"`],
  [/from "\.\.\/\.\.\/utils\/([^"]+)\.js"/g, `from "${PI}/utils/$1.js"`],
]

function walk(dir, fn) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) walk(p, fn)
    else if (e.name.endsWith('.ts') && !e.name.endsWith('.test.ts')) fn(p)
  }
}

walk(SRC, (file) => {
  let c = readFileSync(file, 'utf8')
  const orig = c
  for (const [re, rep] of REWRITES) c = c.replace(re, rep)
  if (c !== orig) writeFileSync(file, c)
})

process.stderr.write('fix-agent-core-imports: done\n')
