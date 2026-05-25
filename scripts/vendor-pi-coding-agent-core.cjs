#!/usr/bin/env node
/** vendor-pi-coding-agent-core.cjs — sync pi-coding-agent core/utils from upstream v0.75.5. */
'use strict'

const { cpSync, existsSync, readFileSync, writeFileSync, readdirSync, rmSync } = require('fs')
const { join } = require('path')
const { execSync } = require('child_process')

const ROOT = join(__dirname, '..')
const UP = join(ROOT, '.cache/pi-upstream/packages/coding-agent/src')
const CORE = join(ROOT, 'packages/pi-coding-agent/src/core')
const UTILS = join(ROOT, 'packages/pi-coding-agent/src/utils')

const PROTECTED = new Set([
  'fallback-resolver.ts',
  'lifecycle-hooks.ts',
  'blob-store.ts',
  'artifact-manager.ts',
  'model-discovery.ts',
  'models-json-writer.ts',
  'package-commands.ts',
  'db-snapshot.ts',
  'capability-patches.ts',
  'gsd-seam-types.ts',
  'session-cwd.ts',
])

function backupProtected() {
  const out = {}
  for (const f of PROTECTED) {
    const p = join(CORE, f)
    if (existsSync(p)) out[f] = readFileSync(p, 'utf8')
  }
  return out
}

function restoreProtected(backups) {
  for (const [f, content] of Object.entries(backups)) {
    writeFileSync(join(CORE, f), content)
  }
}

const backups = backupProtected()
rmSync(CORE, { recursive: true, force: true })
cpSync(join(UP, 'core'), CORE, { recursive: true })
rmSync(UTILS, { recursive: true, force: true })
cpSync(join(UP, 'utils'), UTILS, { recursive: true })

restoreProtected(backups)

// Remove seam-migrated modules from pi-coding-agent core
for (const f of [
  'agent-session.ts',
  'agent-session-services.ts',
  'agent-session-runtime.ts',
  'sdk.ts',
  'compaction-orchestrator.ts',
  'contextual-tips.ts',
  'image-overflow-recovery.ts',
]) {
  const p = join(CORE, f)
  if (existsSync(p)) rmSync(p)
}
const compactionDir = join(CORE, 'compaction')
const exportHtmlDir = join(CORE, 'export-html')
if (existsSync(compactionDir)) rmSync(compactionDir, { recursive: true })
if (existsSync(exportHtmlDir)) rmSync(exportHtmlDir, { recursive: true })

execSync('node scripts/normalize-pi-imports.cjs', { cwd: ROOT, stdio: 'inherit' })
execSync('node scripts/fix-pi-local-imports.cjs', { cwd: ROOT, stdio: 'inherit' })
execSync('node scripts/fix-pi-tool-component-imports.cjs', { cwd: ROOT, stdio: 'inherit' })
execSync('node scripts/generate-pi-coding-agent-index.cjs', { cwd: ROOT, stdio: 'inherit' })

// Theme lives at src/theme after seam
const walkFixTheme = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) walkFixTheme(p)
    else if (e.name.endsWith('.ts')) {
      let c = readFileSync(p, 'utf8')
      const n = c
        .replaceAll('../../modes/interactive/theme/theme.js', '../../theme/theme.js')
        .replaceAll('../modes/interactive/theme/theme.js', '../theme/theme.js')
      if (n !== c) writeFileSync(p, n)
    }
  }
}
walkFixTheme(CORE)

process.stderr.write('vendor-pi-coding-agent-core: done\n')
