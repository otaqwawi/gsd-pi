#!/usr/bin/env node
'use strict'

const { readFileSync, writeFileSync, readdirSync } = require('fs')
const { join } = require('path')

const ROOT = join(__dirname, '..')
const THEME = join(ROOT, 'packages/pi-coding-agent/src/theme')

function walk(dir, fn) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) walk(p, fn)
    else if (e.name.endsWith('.ts')) fn(p)
  }
}

walk(THEME, (file) => {
  let c = readFileSync(file, 'utf8')
  const orig = c
  c = c.replaceAll('@earendil-works/pi-tui', '@gsd/pi-tui')
  c = c.replace(/\.\.\/\.\.\/\.\.\/config\.js/g, '../config.js')
  c = c.replace(/\.\.\/\.\.\/\.\.\/core\//g, '../core/')
  c = c.replace(/\.\.\/\.\.\/\.\.\/utils\//g, '../utils/')
  if (c !== orig) writeFileSync(file, c)
})

process.stderr.write('fix-pi-theme-paths: done\n')
