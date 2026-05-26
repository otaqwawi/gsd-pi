/**
 * Golden B — every registered GSD workflow tool must sanitize to Claude /
 * Cloud Code Assist input_schema without forbidden JSON Schema keywords.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { convertTools } from "../../../../../packages/pi-ai/src/providers/google-shared.ts";
import { registerDbTools } from "../bootstrap/db-tools.ts";
import { registerExecTools } from "../bootstrap/exec-tools.ts";
import { registerMemoryTools } from "../bootstrap/memory-tools.ts";

const FORBIDDEN_KEY_RE = /\b(anyOf|oneOf|allOf|patternProperties|\$ref)\b/;
const ALLOWED_ROOT_KEYS = new Set(["type", "properties", "required"]);

function makeMockPi() {
  const tools: Array<{ name: string; description: string; parameters: unknown }> = [];
  return {
    registerTool: (tool: { name: string; description: string; parameters: unknown }) => {
      tools.push(tool);
    },
    tools,
  };
}

function collectForbiddenPaths(value: unknown, path = "$"): string[] {
  if (value === null || typeof value !== "object") return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectForbiddenPaths(item, `${path}[${index}]`));
  }

  const violations: string[] = [];
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_KEY_RE.test(key)) {
      violations.push(`${path}.${key}`);
    }
    violations.push(...collectForbiddenPaths(nested, `${path}.${key}`));
  }
  return violations;
}

function assertClaudeSchemaRoot(schema: Record<string, unknown>, toolName: string): void {
  const rootKeys = Object.keys(schema);
  for (const key of rootKeys) {
    assert.ok(
      ALLOWED_ROOT_KEYS.has(key),
      `${toolName}: unexpected root key "${key}" on Claude input_schema`,
    );
  }
  assert.strictEqual(schema.type, "object", `${toolName}: root type must be object`);
  assert.ok(schema.properties && typeof schema.properties === "object", `${toolName}: root properties required`);
}

const pi = makeMockPi();
registerDbTools(pi as never);
registerMemoryTools(pi as never);
registerExecTools(pi as never);

const seenNames = new Set<string>();
for (const tool of pi.tools) {
  if (seenNames.has(tool.name)) continue;
  seenNames.add(tool.name);

  test(`claude schema golden: ${tool.name}`, () => {
    const converted = convertTools(
      [{ name: tool.name, description: tool.description, parameters: tool.parameters as never }],
      true,
    );
    assert.ok(converted, `${tool.name}: convertTools returned undefined`);
    const decl = converted[0]?.functionDeclarations?.[0] as Record<string, unknown> | undefined;
    assert.ok(decl?.parameters, `${tool.name}: missing parameters on declaration`);

    const schema = decl.parameters as Record<string, unknown>;
    assertClaudeSchemaRoot(schema, tool.name);

    const violations = collectForbiddenPaths(schema);
    assert.deepEqual(
      violations,
      [],
      `${tool.name}: forbidden schema keywords at ${violations.join(", ")}`,
    );
  });
}

test("claude schema golden: walks all registered db/memory/exec tools", () => {
  assert.ok(pi.tools.length >= 10, "expected bootstrap tool registration surface");
});
