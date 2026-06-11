import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  BROWSER_CONTRACT_TOOL_NAMES,
  BROWSER_EVIDENCE_SIGNAL_TOOL_NAMES,
  browserEvidenceSignalToolPattern,
  hasBrowserContractPrefix,
  isBrowserContractToolName,
} from "../../shared/browser-contract.ts";
import { MANAGED_GSD_BROWSER_TOOL_NAMES } from "../../browser-tools/engine/managed-gsd-browser.ts";
import { RUN_UAT_BROWSER_TOOL_NAMES } from "../unit-registry.ts";
import { isUatBrowserToolName } from "../uat-policy.ts";
import { BROWSER_REQUIREMENT_RE, BROWSER_RUNTIME_RE } from "../browser-evidence.ts";

describe("Browser Automation Contract parity", () => {
  it("run-uat presentation derives from the contract vocabulary", () => {
    assert.deepEqual([...RUN_UAT_BROWSER_TOOL_NAMES], [...BROWSER_CONTRACT_TOOL_NAMES]);
  });

  it("the managed gsd-browser adapter covers the contract vocabulary exactly", () => {
    assert.deepEqual([...MANAGED_GSD_BROWSER_TOOL_NAMES], [...BROWSER_CONTRACT_TOOL_NAMES]);
  });

  it("every contract name satisfies the UAT browser-tool predicate, bare and MCP-prefixed", () => {
    for (const name of BROWSER_CONTRACT_TOOL_NAMES) {
      assert.equal(isUatBrowserToolName(name), true, name);
      assert.equal(isUatBrowserToolName(`mcp__gsd-browser__${name}`), true, `mcp__gsd-browser__${name}`);
    }
  });

  it("contract names are canonical browser_* names with no duplicates", () => {
    assert.equal(new Set(BROWSER_CONTRACT_TOOL_NAMES).size, BROWSER_CONTRACT_TOOL_NAMES.length);
    for (const name of BROWSER_CONTRACT_TOOL_NAMES) {
      assert.equal(hasBrowserContractPrefix(name), true, name);
      assert.equal(isBrowserContractToolName(name), true, name);
    }
    assert.equal(isBrowserContractToolName("browser_not_a_real_tool"), false);
    assert.equal(hasBrowserContractPrefix("gsd_uat_exec"), false);
  });

  it("evidence-signal names stay a subset of the contract and drive the detection regexes", () => {
    for (const name of BROWSER_EVIDENCE_SIGNAL_TOOL_NAMES) {
      assert.equal(isBrowserContractToolName(name), true, name);
      assert.match(name, new RegExp(`^${browserEvidenceSignalToolPattern()}$`));
      assert.match(`Verified via ${name} call`, BROWSER_REQUIREMENT_RE);
      assert.match(`Verified via ${name} call`, BROWSER_RUNTIME_RE);
    }
  });
});
