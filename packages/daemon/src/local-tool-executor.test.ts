import assert from "node:assert/strict";
import { test } from "node:test";
import { LocalToolExecutor } from "./local-tool-executor.js";
import type { SessionManager } from "./session-manager.js";

test("local tool executor rejects unsupported user-controlled tool names", async () => {
  const executor = new LocalToolExecutor({} as SessionManager, async () => []);

  await assert.rejects(
    executor.execute("constructor", {}),
    /Unsupported forwarded GSD MCP tool: constructor/,
  );
});
