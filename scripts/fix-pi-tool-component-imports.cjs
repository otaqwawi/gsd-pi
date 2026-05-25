#!/usr/bin/env node
'use strict'
const { readFileSync, writeFileSync, readdirSync } = require('fs')
const { join } = require('path')
const ROOT = join(__dirname, '..')
const TOOLS = join(ROOT, 'packages/pi-coding-agent/src/core/tools')
const MODES = '@gsd/agent-modes/modes/interactive/components'

for (const f of readdirSync(TOOLS)) {
  if (!f.endsWith('.ts')) continue
  const p = join(TOOLS, f)
  let c = readFileSync(p, 'utf8')
  const n = c.replace(/\.\.\/\.\.\/modes\/interactive\/components\//g, `${MODES}/`)
  if (n !== c) writeFileSync(p, n)
}

process.stderr.write('fix-pi-tool-component-imports: done\n')
