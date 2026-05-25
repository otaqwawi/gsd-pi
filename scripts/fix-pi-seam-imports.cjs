#!/usr/bin/env node
'use strict'

const { readFileSync, writeFileSync, readdirSync } = require('fs')
const { join } = require('path')

const ROOT = join(__dirname, '..')
const PI_SRC = join(ROOT, 'packages/pi-coding-agent/src')

function walk(dir, fn) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) walk(p, fn)
    else if (e.name.endsWith('.ts')) fn(p)
  }
}

function fixPiInternal(content) {
  return content
    .replace(/from "\.\.\/\.\.\/pi-coding-agent\/src\/core\//g, 'from "./')
    .replace(/from "\.\.\/\.\.\/pi-coding-agent\/src\/utils\//g, 'from "../utils/')
    .replace(/from "\.\.\/\.\.\/pi-coding-agent\/src\/config\.js"/g, 'from "../config.js"')
    .replace(/from "\.\.\/\.\.\/pi-coding-agent\/src\/theme\//g, 'from "../theme/')
    .replace(/from "\.\.\/\.\.\/pi-coding-agent\/src\/migrations\.js"/g, 'from "../migrations.js"')
}

function fixAgentPackage(content) {
  let c = content

  // Corrupted migration paths
  c = c.replace(/core\/extensionstypes\.js/g, 'core/extensions/types.js')
  c = c.replace(/core\/toolstool-compatibility-registry\.js/g, 'core/tools/tool-compatibility-registry.js')
  c = c.replace(/core\/toolstruncate\.js/g, 'core/tools/truncate.js')
  c = c.replace(/themetheme\.js/g, 'theme/theme.js')
  c = c.replace(/extensionsindex\.js/g, 'extensions/index.js')

  // Relative pi-coding-agent/src imports -> package subpaths
  c = c.replace(/from "(\.\.\/)+pi-coding-agent\/src\/([^"]+)"/g, 'from "@gsd/pi-coding-agent/$2"')
  c = c.replace(/from "\.\/(\.\.\/)+pi-coding-agent\/src\/([^"]+)"/g, 'from "@gsd/pi-coding-agent/$2"')

  // export-html used wrong depth
  c = c.replace(
    /from "\.\.\/\.\.\/\.\.\/pi-coding-agent\/src\//g,
    'from "@gsd/pi-coding-agent/',
  )

  return c
}

walk(PI_SRC, (file) => {
  const orig = readFileSync(file, 'utf8')
  const fixed = fixPiInternal(orig)
  if (fixed !== orig) writeFileSync(file, fixed)
})

for (const pkg of ['gsd-agent-core', 'gsd-agent-modes']) {
  walk(join(ROOT, 'packages', pkg, 'src'), (file) => {
    const orig = readFileSync(file, 'utf8')
    const fixed = fixAgentPackage(orig)
    if (fixed !== orig) writeFileSync(file, fixed)
  })
}

console.log('Pi seam import fixes applied')
