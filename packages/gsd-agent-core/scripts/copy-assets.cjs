#!/usr/bin/env node
const { mkdirSync, cpSync, copyFileSync, readdirSync } = require('fs');
const { join } = require('path');

function safeCpSync(src, dest, options) {
  try {
    cpSync(src, dest, options);
  } catch {
    if (options && options.recursive) {
      copyDirRecursive(src, dest, options && options.filter);
    } else {
      copyFileSync(src, dest);
    }
  }
}

function copyDirRecursive(src, dest, filter) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (filter && !filter(srcPath)) continue;
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath, filter);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

mkdirSync('dist/export-html/vendor', { recursive: true });
for (const file of ['template.html', 'template.css', 'template.js']) {
  safeCpSync(join('src/export-html', file), join('dist/export-html', file));
}
safeCpSync('src/export-html/vendor', 'dist/export-html/vendor', { recursive: true });
