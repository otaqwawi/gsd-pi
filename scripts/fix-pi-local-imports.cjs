#!/usr/bin/env node
/** Revert pi-coding-agent imports for modules that stayed in pi-coding-agent (not agent-core). */
'use strict'

const { readFileSync, writeFileSync, readdirSync } = require('fs')
const { join } = require('path')

const ROOT = join(__dirname, '..')
const PI = join(ROOT, 'packages/pi-coding-agent/src')

const LOCAL = {
  'FallbackResolver': './fallback-resolver.js',
  'prepareLifecycleHooks': './lifecycle-hooks.js',
  'runLifecycleHooks': './lifecycle-hooks.js',
  'readManifestRuntimeDeps': './lifecycle-hooks.js',
  'collectRuntimeDependencies': './lifecycle-hooks.js',
  'verifyRuntimeDependencies': './lifecycle-hooks.js',
  'resolveLocalSourcePath': './lifecycle-hooks.js',
  'BlobStore': './blob-store.js',
  'externalizeImageData': './blob-store.js',
  'isBlobRef': './blob-store.js',
  'resolveImageData': './blob-store.js',
  'ArtifactManager': './artifact-manager.js',
  'KeybindingsManager': './keybindings.js',
  'AppAction': './keybindings.js',
  'KeyAction': './keybindings.js',
  'KeybindingsConfig': './keybindings.js',
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

  for (const [symbol, localPath] of Object.entries(LOCAL)) {
    const rel = file.startsWith(join(PI, 'core/extensions'))
      ? localPath.replace('./', '../')
      : file.startsWith(join(PI, 'core/tools'))
        ? localPath.replace('./', '../')
        : localPath

    c = c.replace(
      new RegExp(`import\\s*\\{([^}]*\\b${symbol}\\b[^}]*)\\}\\s*from\\s*"@gsd/agent-core"`, 'g'),
      (m, inner) => `import {${inner}} from "${rel}"`,
    )
    c = c.replace(
      new RegExp(`import\\s*type\\s*\\{([^}]*\\b${symbol}\\b[^}]*)\\}\\s*from\\s*"@gsd/agent-core"`, 'g'),
      (m, inner) => `import type {${inner}} from "${rel}"`,
    )
    c = c.replace(
      new RegExp(`export\\s*type\\s*\\{([^}]*\\b${symbol}\\b[^}]*)\\}\\s*from\\s*"@gsd/agent-core"`, 'g'),
      (m, inner) => `export type {${inner}} from "${rel}"`,
    )
  }

  if (c !== orig) writeFileSync(file, c)
}

walk(PI, fixFile)
process.stderr.write('fix-pi-local-imports: done\n')
