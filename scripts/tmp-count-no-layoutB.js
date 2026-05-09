// Run buildIndex equivalent without Layout B to measure exact contribution.
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");

const HOME = os.homedir();
const MARKETPLACE_ROOT = path.join(HOME, ".claude", "plugins", "marketplaces");
const COWORK_ROOT = path.join(
  HOME, "AppData", "Roaming", "Claude", "local-agent-mode-sessions"
);

function safeStat(p) { try { return fs.statSync(p); } catch { return null; } }
function listDirs(p) {
  try { return fs.readdirSync(p, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name); } catch { return []; }
}
function parseFm(content) {
  if (!content.startsWith("---")) return {};
  const end = content.indexOf("\n---", 3);
  if (end < 0) return {};
  const block = content.slice(3, end);
  const out = {};
  let cur = null, buf = [];
  const flush = () => { if (cur) out[cur] = buf.join(" ").trim().replace(/^["']|["']$/g, ""); };
  for (const raw of block.split(/\r?\n/)) {
    const line = raw.replace(/^﻿/, "");
    if (!line.trim()) continue;
    const m = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (m && !line.startsWith(" ") && !line.startsWith("\t")) { flush(); cur = m[1]; buf = m[2] ? [m[2]] : []; }
    else if (cur) buf.push(line.trim());
  }
  flush();
  return out;
}
function readSkill(p) {
  try {
    const fm = parseFm(fs.readFileSync(p, "utf-8"));
    if (!fm.name || !fm.description) return null;
    return fm;
  } catch { return null; }
}

function collectMarket() {
  const out = [];
  if (!safeStat(MARKETPLACE_ROOT)) return out;
  for (const mp of listDirs(MARKETPLACE_ROOT)) {
    for (const sub of ["plugins", "external_plugins"]) {
      const root = path.join(MARKETPLACE_ROOT, mp, sub);
      if (!safeStat(root)) continue;
      for (const pn of listDirs(root)) {
        const sd = path.join(root, pn, "skills");
        if (!safeStat(sd)) continue;
        for (const skd of listDirs(sd)) {
          const md = path.join(sd, skd, "SKILL.md");
          if (!safeStat(md)) continue;
          const fm = readSkill(md);
          if (!fm) continue;
          out.push({ namespace: pn, name: fm.name, sourcePath: md });
        }
      }
    }
  }
  return out;
}

function collectCoworkLayoutAOnly() {
  const out = [];
  if (!safeStat(COWORK_ROOT)) return out;
  for (const sd of listDirs(COWORK_ROOT)) {
    const sr = path.join(COWORK_ROOT, sd);
    for (const sub of listDirs(sr)) {
      const rpm = path.join(sr, sub, "rpm");
      if (!safeStat(rpm)) continue;
      const map = new Map();
      const mp = path.join(rpm, "manifest.json");
      if (safeStat(mp)) {
        try {
          const j = JSON.parse(fs.readFileSync(mp, "utf-8"));
          for (const p of j.plugins || []) if (p.id && p.name) map.set(p.id, p.name);
        } catch {}
      }
      for (const pid of listDirs(rpm)) {
        if (!pid.startsWith("plugin_")) continue;
        const skd = path.join(rpm, pid, "skills");
        if (!safeStat(skd)) continue;
        const ns = map.get(pid) || pid;
        for (const sk of listDirs(skd)) {
          const md = path.join(skd, sk, "SKILL.md");
          if (!safeStat(md)) continue;
          const fm = readSkill(md);
          if (!fm) continue;
          out.push({ namespace: ns, name: fm.name, sourcePath: md });
        }
      }
    }
  }
  return out;
}

function dedupe(es) {
  const seen = new Set(), out = [];
  for (const e of es) { const k = e.namespace + ":" + e.name; if (seen.has(k)) continue; seen.add(k); out.push(e); }
  return out;
}

const m = collectMarket();
const c = collectCoworkLayoutAOnly();
const all = dedupe([...m, ...c]);
console.log("WITHOUT Layout B:");
console.log("  marketplace:", m.length);
console.log("  cowork (Layout A only):", c.length);
console.log("  total after dedupe:", all.length);
