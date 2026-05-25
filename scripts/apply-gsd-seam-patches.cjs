#!/usr/bin/env node
/**
 * apply-gsd-seam-patches.cjs — re-apply ADR-010 seam patches after git checkout of pi-coding-agent.
 */
'use strict'

const { execSync } = require('child_process')
const { join } = require('path')

const ROOT = join(__dirname, '..')

const steps = [
  'node scripts/post-vendor-gsd-seam.cjs',
  'node scripts/trim-pi-coding-agent-index.cjs',
  'node scripts/fix-pi-theme-paths.cjs',
  'node scripts/fix-pi-coding-agent-imports.cjs',
  'node scripts/fix-agent-modes-imports.cjs',
]

for (const step of steps) {
  execSync(step, { cwd: ROOT, stdio: 'inherit' })
}

process.stderr.write('apply-gsd-seam-patches: done\n')
