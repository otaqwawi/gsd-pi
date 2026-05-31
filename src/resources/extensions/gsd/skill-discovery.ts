/**
 * GSD Skill Discovery
 *
 * Detects skills installed during auto-mode by comparing the current
 * installed catalog and skill directories against a snapshot taken at auto-mode start.
 *
 * New skills are surfaced via resource reload (see system-context) so they
 * appear in the standard `<available_skills>` catalog.
 */

import { existsSync, readdirSync, readFileSync, type Dirent } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { gsdHome } from "./gsd-home.js";
import { getInstalledSkills, normalizeSkillName } from "./skills.js";

export interface DiscoveredSkill {
  name: string;
  description: string;
  location: string;
}

/** Snapshot of normalized skill names at auto-mode start */
let baselineSkills: Set<string> | null = null;

/**
 * Snapshot the current installed skill catalog. Call at auto-mode start.
 */
export function snapshotSkills(): void {
  baselineSkills = snapshotCurrentSkillNames();
}

/**
 * Clear the snapshot. Call when auto-mode stops.
 */
export function clearSkillSnapshot(): void {
  baselineSkills = null;
}

/**
 * Check if a snapshot is active (auto-mode is running with discovery).
 */
export function hasSkillSnapshot(): boolean {
  return baselineSkills !== null;
}

/**
 * Detect skills installed since the snapshot was taken.
 * Returns skill metadata for any new skills found in the loader catalog or on disk.
 */
export function detectNewSkills(): DiscoveredSkill[] {
  if (!baselineSkills) return [];

  const newSkills: DiscoveredSkill[] = [];
  for (const skill of getCurrentSkillsForDiscovery()) {
    const normalized = normalizeSkillName(skill.name);
    if (baselineSkills.has(normalized)) continue;
    newSkills.push(skill);
  }

  return newSkills;
}

/**
 * Reload the skill catalog when auto-mode detects newly installed skills.
 * Updates the snapshot baseline after reload so detection is one-shot per install.
 */
export async function refreshCatalogForNewSkills(options?: {
  reload?: () => Promise<void>;
  notify?: (message: string, level: "info" | "warning") => void;
}): Promise<DiscoveredSkill[]> {
  const newSkills = detectNewSkills();
  if (newSkills.length === 0) return [];

  if (options?.reload) {
    try {
      await options.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      options.notify?.(`GSD: failed to reload skill catalog: ${message}`, "warning");
      return [];
    }
  }

  snapshotSkills();
  const names = newSkills.map((skill) => skill.name).join(", ");
  options?.notify?.(`GSD: loaded new skills: ${names}`, "info");
  return newSkills;
}

// ─── Internals ────────────────────────────────────────────────────────────────

function skillSearchDirs(): string[] {
  return [
    join(gsdHome(), "agent", "skills"),
    join(homedir(), ".agents", "skills"),
    join(homedir(), ".claude", "skills"),
  ];
}

function snapshotCurrentSkillNames(): Set<string> {
  return new Set(getCurrentSkillsForDiscovery().map(skill => normalizeSkillName(skill.name)));
}

function getCurrentSkillsForDiscovery(): DiscoveredSkill[] {
  const skills = new Map<string, DiscoveredSkill>();
  for (const skill of getInstalledSkills()) {
    const normalized = normalizeSkillName(skill.name);
    skills.set(normalized, {
      name: skill.name,
      description: skill.description || `Skill: ${skill.name}`,
      location: skill.filePath,
    });
  }

  for (const skill of getDiskSkills()) {
    const normalized = normalizeSkillName(skill.name);
    if (!skills.has(normalized)) skills.set(normalized, skill);
  }

  return [...skills.values()];
}

function getDiskSkills(): DiscoveredSkill[] {
  const skills = new Map<string, DiscoveredSkill>();
  for (const dir of skillSearchDirs()) {
    if (!existsSync(dir)) continue;
    let entries: Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
      const skillMdPath = join(dir, entry.name, "SKILL.md");
      if (!existsSync(skillMdPath)) continue;

      const meta = parseSkillFrontmatter(skillMdPath);
      const name = meta?.name || entry.name;
      const normalized = normalizeSkillName(name);
      if (skills.has(normalized)) continue;
      skills.set(normalized, {
        name,
        description: meta?.description || `Skill: ${name}`,
        location: skillMdPath,
      });
    }
  }
  return [...skills.values()];
}

function parseSkillFrontmatter(path: string): { name?: string; description?: string } | null {
  try {
    const content = readFileSync(path, "utf-8");
    if (!content.startsWith("---\n")) return null;
    const endIdx = content.indexOf("\n---", 4);
    if (endIdx === -1) return null;

    const fm = content.slice(4, endIdx);
    const result: { name?: string; description?: string } = {};

    const nameMatch = fm.match(/^name:\s*(.+)$/m);
    if (nameMatch) result.name = nameMatch[1].trim();

    const descMatch = fm.match(/^description:\s*(.+)$/m);
    if (descMatch) result.description = descMatch[1].trim();

    return result;
  } catch {
    return null;
  }
}
