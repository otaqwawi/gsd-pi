#!/usr/bin/env node
/**
 * Re-apply ADR-010 clean seam after vendor-pi.cjs copies upstream source.
 * Deletes GSD-owned paths from pi-coding-agent (already live in gsd-agent-*).
 */
'use strict'

const { existsSync, rmSync, renameSync, mkdirSync, readFileSync, writeFileSync } = require('fs')
const { join } = require('path')

const ROOT = join(__dirname, '..')
const PI = join(ROOT, 'packages/pi-coding-agent')
const PI_SRC = join(PI, 'src')

function del(rel) {
  const p = join(PI_SRC, rel)
  if (existsSync(p)) {
    rmSync(p, { recursive: true, force: true })
    console.log('removed', rel)
  }
}

// Theme at shared path (before modes/ is removed)
const themeSrc = join(PI_SRC, 'modes/interactive/theme')
const themeDest = join(PI_SRC, 'theme')
if (existsSync(themeSrc)) {
  if (existsSync(themeDest)) rmSync(themeDest, { recursive: true, force: true })
  renameSync(themeSrc, themeDest)
  console.log('moved theme to src/theme')
}

// Modes / CLI (in gsd-agent-modes)
del('modes')
del('cli')
del('cli.ts')
del('main.ts')

// Session layer (in gsd-agent-core)
for (const f of [
  'core/agent-session.ts',
  'core/agent-session-runtime.ts',
  'core/agent-session-services.ts',
  'core/sdk.ts',
  'core/compaction-orchestrator.ts',
  'core/compaction',
  'core/export-html',
  'core/contextual-tips.ts',
  'core/image-overflow-recovery.ts',
]) {
  del(f)
}

console.log('Post-vendor GSD seam applied')
