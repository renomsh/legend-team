// Phase 1 — Plugin skill static index builder (D-176/D-177, topic_190).
// Reads SKILL.md files from two on-disk locations, normalizes frontmatter,
// and writes memory/shared/plugin_skill_index.json. Gate G1: ≥100 skills.
//
// Sources:
//  1. ~/.claude/plugins/marketplaces/<mp>/plugins/<plugin>/skills/<skill>/SKILL.md
//     ~/.claude/plugins/marketplaces/<mp>/external_plugins/<plugin>/skills/<skill>/SKILL.md
//  2. ~/AppData/Roaming/Claude/local-agent-mode-sessions/<u>/<u>/rpm/<plugin_id>/skills/<skill>/SKILL.md
//     (rpm/manifest.json supplies plugin_id ↔ name mapping; cowork plugins.)
//
// Usage:
//   npx ts-node scripts/build-plugin-skill-index.ts                # write index
//   npx ts-node scripts/build-plugin-skill-index.ts --dry-run      # stdout summary, no write
//   npx ts-node scripts/build-plugin-skill-index.ts --verify       # compare descriptionHash stability vs existing index

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";
import { writeAtomic } from "./lib/write-atomic";

interface SkillEntry {
  name: string;
  namespace: string;
  description: string;
  descriptionHash: string;
  tags: string[];
  trustLevel: "unverified" | "verified" | "blocked";
  source: "marketplace" | "cowork";
  sourcePath: string;
}

interface SkillIndex {
  version: string;
  lastSync: string;
  totalCount: number;
  bySource: { marketplace: number; cowork: number };
  skills: SkillEntry[];
}

const HOME = os.homedir();
const PROJECT_ROOT = process.cwd();
const OUTPUT = path.join(PROJECT_ROOT, "memory/shared/plugin_skill_index.json");
const OUTPUT_HASH = path.join(PROJECT_ROOT, "memory/shared/plugin_skill_index.sha256");
const INDEX_VERSION = "1.0.0";
const GATE_G1_MIN = 100;

const MARKETPLACE_ROOT = path.join(HOME, ".claude", "plugins", "marketplaces");
const COWORK_ROOT = path.join(
  HOME,
  "AppData",
  "Roaming",
  "Claude",
  "local-agent-mode-sessions",
);

function parseFrontmatter(content: string): Record<string, string> {
  // Minimal YAML frontmatter parser — only top-level scalar keys (name, description, etc.).
  if (!content.startsWith("---")) return {};
  const end = content.indexOf("\n---", 3);
  if (end < 0) return {};
  const block = content.slice(3, end);
  const out: Record<string, string> = {};
  let currentKey: string | null = null;
  let buffer: string[] = [];
  const flush = () => {
    if (currentKey !== null) {
      out[currentKey] = buffer.join(" ").trim().replace(/^["']|["']$/g, "");
    }
  };
  for (const rawLine of block.split(/\r?\n/)) {
    const line = rawLine.replace(/^﻿/, "");
    if (!line.trim()) continue;
    const m = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (m && !line.startsWith(" ") && !line.startsWith("\t")) {
      flush();
      currentKey = m[1] ?? null;
      buffer = m[2] ? [m[2]] : [];
    } else if (currentKey !== null) {
      buffer.push(line.trim());
    }
  }
  flush();
  return out;
}

function hashDescription(desc: string): string {
  return crypto.createHash("sha256").update(desc).digest("hex").slice(0, 16);
}

function safeStat(p: string): fs.Stats | null {
  try {
    return fs.statSync(p);
  } catch {
    return null;
  }
}

function listDirs(p: string): string[] {
  try {
    return fs
      .readdirSync(p, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    return [];
  }
}

function readSkillFile(skillMdPath: string): {
  name: string;
  description: string;
} | null {
  try {
    const raw = fs.readFileSync(skillMdPath, "utf-8");
    const fm = parseFrontmatter(raw);
    const name = fm["name"]?.trim();
    const description = fm["description"]?.trim();
    if (!name || !description) return null;
    return { name, description };
  } catch {
    return null;
  }
}

function collectMarketplace(): SkillEntry[] {
  const out: SkillEntry[] = [];
  if (!safeStat(MARKETPLACE_ROOT)) return out;
  for (const mp of listDirs(MARKETPLACE_ROOT)) {
    const mpRoot = path.join(MARKETPLACE_ROOT, mp);
    for (const subdir of ["plugins", "external_plugins"]) {
      const root = path.join(mpRoot, subdir);
      if (!safeStat(root)) continue;
      for (const pluginName of listDirs(root)) {
        const skillsDir = path.join(root, pluginName, "skills");
        if (!safeStat(skillsDir)) continue;
        for (const skillDir of listDirs(skillsDir)) {
          const skillMd = path.join(skillsDir, skillDir, "SKILL.md");
          if (!safeStat(skillMd)) continue;
          const fm = readSkillFile(skillMd);
          if (!fm) continue;
          out.push({
            name: fm.name,
            namespace: pluginName,
            description: fm.description,
            descriptionHash: hashDescription(fm.description),
            tags: [],
            trustLevel: "unverified",
            source: "marketplace",
            sourcePath: skillMd,
          });
        }
      }
    }
  }
  return out;
}

interface CoworkPluginMeta {
  id: string;
  name: string;
}

function readCoworkManifest(rpmDir: string): Map<string, string> {
  const manifestPath = path.join(rpmDir, "manifest.json");
  const map = new Map<string, string>();
  if (!safeStat(manifestPath)) return map;
  try {
    const json = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as {
      plugins?: CoworkPluginMeta[];
    };
    for (const p of json.plugins ?? []) {
      if (p.id && p.name) map.set(p.id, p.name);
    }
  } catch {
    /* fall through */
  }
  return map;
}

function collectCowork(): SkillEntry[] {
  const out: SkillEntry[] = [];
  if (!safeStat(COWORK_ROOT)) return out;
  for (const sessionDir of listDirs(COWORK_ROOT)) {
    const sessionRoot = path.join(COWORK_ROOT, sessionDir);
    for (const subDir of listDirs(sessionRoot)) {
      const subRoot = path.join(sessionRoot, subDir);

      // Layout A: <session>/<sub>/rpm/plugin_<id>/skills/<skill>/SKILL.md
      // (manifest.json supplies plugin_id ↔ name mapping)
      const rpmDir = path.join(subRoot, "rpm");
      if (safeStat(rpmDir)) {
        const idToName = readCoworkManifest(rpmDir);
        for (const pluginIdDir of listDirs(rpmDir)) {
          if (!pluginIdDir.startsWith("plugin_")) continue;
          const skillsDir = path.join(rpmDir, pluginIdDir, "skills");
          if (!safeStat(skillsDir)) continue;
          const namespace = idToName.get(pluginIdDir) ?? pluginIdDir;
          for (const skillDir of listDirs(skillsDir)) {
            const skillMd = path.join(skillsDir, skillDir, "SKILL.md");
            if (!safeStat(skillMd)) continue;
            const fm = readSkillFile(skillMd);
            if (!fm) continue;
            out.push({
              name: fm.name,
              namespace,
              description: fm.description,
              descriptionHash: hashDescription(fm.description),
              tags: [],
              trustLevel: "unverified",
              source: "cowork",
              sourcePath: skillMd,
            });
          }
        }
      }

      // Layout B (D-178, topic_190 phase2): named-bundle session dirs use
      //   <bundleName>/<uuidA>/<uuidB>/skills/<skill>/SKILL.md
      // (manifest.json sits next to skills/ but only carries id+description,
      // SKILL.md frontmatter is canonical.) The anthropic-skills bundle lives
      // under sessionDir="skills-plugin" → namespace "anthropic-skills" to
      // match the system-reminder label.
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(sessionDir);
      if (!isUuid) {
        for (const subSubDir of listDirs(subRoot)) {
          const flatSkillsDir = path.join(subRoot, subSubDir, "skills");
          if (!safeStat(flatSkillsDir)) continue;
          const namespace = sessionDir === "skills-plugin"
            ? "anthropic-skills"
            : sessionDir;
          for (const skillDir of listDirs(flatSkillsDir)) {
            const skillMd = path.join(flatSkillsDir, skillDir, "SKILL.md");
            if (!safeStat(skillMd)) continue;
            const fm = readSkillFile(skillMd);
            if (!fm) continue;
            out.push({
              name: fm.name,
              namespace,
              description: fm.description,
              descriptionHash: hashDescription(fm.description),
              tags: [],
              trustLevel: "unverified",
              source: "cowork",
              sourcePath: skillMd,
            });
          }
        }
      }
    }
  }
  return out;
}

function dedupe(entries: SkillEntry[]): SkillEntry[] {
  // Keep first occurrence per (namespace, name). Cowork sessions can have
  // duplicates across local-agent-mode-sessions/<uuid>/<uuid>/rpm dirs.
  const seen = new Set<string>();
  const out: SkillEntry[] = [];
  for (const e of entries) {
    const key = `${e.namespace}:${e.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out;
}

function buildIndex(): SkillIndex {
  const market = collectMarketplace();
  const cowork = collectCowork();
  const all = dedupe([...market, ...cowork]).sort((a, b) =>
    `${a.namespace}:${a.name}`.localeCompare(`${b.namespace}:${b.name}`),
  );
  return {
    version: INDEX_VERSION,
    lastSync: new Date().toISOString(),
    totalCount: all.length,
    bySource: {
      marketplace: all.filter((s) => s.source === "marketplace").length,
      cowork: all.filter((s) => s.source === "cowork").length,
    },
    skills: all,
  };
}

function loadExisting(): SkillIndex | null {
  if (!safeStat(OUTPUT)) return null;
  try {
    return JSON.parse(fs.readFileSync(OUTPUT, "utf-8")) as SkillIndex;
  } catch {
    return null;
  }
}

function verifyHashStability(prev: SkillIndex, next: SkillIndex): {
  changed: { key: string; prev: string; next: string }[];
  added: string[];
  removed: string[];
} {
  const prevMap = new Map(
    prev.skills.map((s) => [`${s.namespace}:${s.name}`, s.descriptionHash]),
  );
  const nextMap = new Map(
    next.skills.map((s) => [`${s.namespace}:${s.name}`, s.descriptionHash]),
  );
  const changed: { key: string; prev: string; next: string }[] = [];
  const added: string[] = [];
  const removed: string[] = [];
  for (const [k, h] of nextMap) {
    const p = prevMap.get(k);
    if (p === undefined) added.push(k);
    else if (p !== h) changed.push({ key: k, prev: p, next: h });
  }
  for (const k of prevMap.keys()) if (!nextMap.has(k)) removed.push(k);
  return { changed, added, removed };
}

function main(): void {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const verify = args.includes("--verify");

  const index = buildIndex();

  console.log(`[skill-index] total=${index.totalCount}`);
  console.log(
    `[skill-index] marketplace=${index.bySource.marketplace}  cowork=${index.bySource.cowork}`,
  );
  const gateG1 = index.totalCount >= GATE_G1_MIN;
  console.log(
    `[skill-index] Gate G1 (≥${GATE_G1_MIN}): ${gateG1 ? "PASS" : "FAIL"}`,
  );

  if (verify) {
    const prev = loadExisting();
    if (!prev) {
      console.log("[skill-index] verify: no existing index — skipping");
    } else {
      const diff = verifyHashStability(prev, index);
      console.log(
        `[skill-index] verify: changed=${diff.changed.length}  added=${diff.added.length}  removed=${diff.removed.length}`,
      );
      if (diff.changed.length) {
        console.log("[skill-index] descriptionHash changed:");
        for (const c of diff.changed.slice(0, 10))
          console.log(`  ${c.key}  ${c.prev} → ${c.next}`);
      }
    }
  }

  if (dryRun) {
    console.log("[skill-index] dry-run — no write");
    return;
  }

  const payload = JSON.stringify(index, null, 2) + "\n";
  writeAtomic(OUTPUT, payload);
  console.log(`[skill-index] wrote ${path.relative(PROJECT_ROOT, OUTPUT)}`);

  // R-4: SHA-256 integrity hash for hook verification.
  const hashHex = crypto.createHash("sha256").update(payload).digest("hex");
  writeAtomic(OUTPUT_HASH, hashHex + "\n");
  console.log(
    `[skill-index] wrote ${path.relative(PROJECT_ROOT, OUTPUT_HASH)} (sha256=${hashHex.slice(0, 16)}…)`,
  );

  if (!gateG1) process.exitCode = 2;
}

main();
