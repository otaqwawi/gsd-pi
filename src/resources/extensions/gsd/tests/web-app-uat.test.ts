import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  buildWebAppUatGuidanceBlock,
  detectWebApp,
  findPlaywrightTestScript,
  hasPlaywrightTestDependency,
} from "../web-app-uat.ts";

function scaffoldProject(root: string, pkg: Record<string, unknown>): void {
  writeFileSync(join(root, "package.json"), JSON.stringify(pkg, null, 2));
}

describe("web-app-uat guidance", () => {
  test("returns null for non-web projects", () => {
    const root = mkdtempSync(join(tmpdir(), "gsd-web-uat-"));
    try {
      writeFileSync(join(root, "README.md"), "# CLI tool\n");
      assert.equal(detectWebApp(root), false);
      assert.equal(buildWebAppUatGuidanceBlock(root), null);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("returns guidance for react/vite web apps", () => {
    const root = mkdtempSync(join(tmpdir(), "gsd-web-uat-"));
    try {
      scaffoldProject(root, {
        dependencies: { react: "19.0.0", "react-dom": "19.0.0" },
        devDependencies: { vite: "6.0.0" },
        scripts: { dev: "vite" },
      });
      assert.equal(detectWebApp(root), true);
      const block = buildWebAppUatGuidanceBlock(root);
      assert.ok(block);
      assert.match(block!, /browser-executable/);
      assert.match(block!, /Playwright scaffolding/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("detects existing Playwright and npm script", () => {
    const root = mkdtempSync(join(tmpdir(), "gsd-web-uat-"));
    try {
      scaffoldProject(root, {
        dependencies: { next: "15.0.0" },
        devDependencies: { "@playwright/test": "1.60.0", playwright: "1.60.0" },
        scripts: { "test:e2e": "playwright test" },
      });
      assert.equal(hasPlaywrightTestDependency(root), true);
      assert.equal(findPlaywrightTestScript(root), "npm run test:e2e");
      const block = buildWebAppUatGuidanceBlock(root);
      assert.ok(block);
      assert.match(block!, /dependency detected/);
      assert.match(block!, /npm run test:e2e/);
      assert.doesNotMatch(block!, /Playwright scaffolding/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("detects static sites via index.html", () => {
    const root = mkdtempSync(join(tmpdir(), "gsd-web-uat-"));
    try {
      mkdirSync(join(root, "public"), { recursive: true });
      writeFileSync(join(root, "public", "index.html"), "<html></html>");
      assert.equal(detectWebApp(root), true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
