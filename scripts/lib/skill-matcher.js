// Phase 2 — Plugin skill matcher (D-177, topic_190).
// CommonJS port of scripts/lib/skill-matcher.ts (Phase A, session_227).
// Threshold A+B correction: lower default threshold (0.22) + token denom cap (5).
// Stage 1: substring/keyword scoring against name·namespace·description.
// Stage 2 (LLM intent classification) intentionally deferred.

"use strict";

const fs = require("fs");
const path = require("path");

/**
 * @typedef {Object} IndexedSkill
 * @property {string} name
 * @property {string} namespace
 * @property {string} description
 * @property {string} descriptionHash
 * @property {string[]} tags
 * @property {"unverified"|"verified"|"blocked"} trustLevel
 * @property {"marketplace"|"cowork"} source
 * @property {string} sourcePath
 */

/**
 * @typedef {Object} SkillIndexFile
 * @property {string} version
 * @property {string} lastSync
 * @property {number} totalCount
 * @property {IndexedSkill[]} skills
 */

/**
 * @typedef {Object} MatchResult
 * @property {IndexedSkill} skill
 * @property {number} score
 * @property {string[]} matchedTerms
 */

/**
 * @typedef {Object} MatchOptions
 * @property {number} [topN]
 * @property {number} [threshold]
 * @property {boolean} [excludeBlocked]
 */

// Threshold-correction constants (Master decision A+B, session_227).
const DEFAULT_THRESHOLD = 0.22;
const TOKEN_DENOM_CAP = 5;
const DEFAULT_TOP_N = 3;

const STOPWORDS = new Set([
  // English minimal stopword list — bias toward keeping content words.
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "at",
  "for", "with", "by", "from", "as", "is", "are", "was", "were", "be",
  "been", "being", "have", "has", "had", "do", "does", "did", "will",
  "would", "could", "should", "may", "might", "can", "i", "me", "my",
  "you", "your", "we", "our", "it", "its", "this", "that", "these", "those",
  "what", "which", "who", "how", "when", "where", "why", "if", "so",
  "not", "no", "yes", "please", "give", "make", "use", "using", "want",
  // Korean particles/very common words (heuristic).
  "은", "는", "이", "가", "을", "를", "에", "의", "도", "만", "와", "과",
  "해", "해줘", "해주세요", "주세요", "그", "그리고", "또는", "그래서",
]);

function normalizeText(s) {
  return String(s).toLowerCase();
}

function tokenize(s) {
  const norm = normalizeText(s);
  const raw = norm.split(/[\s,.;:!?()[\]{}<>"'`/\\|+=*&^%$#@~\-]+/);
  const out = [];
  for (const tok of raw) {
    if (!tok) continue;
    if (tok.length < 2) continue;
    if (STOPWORDS.has(tok)) continue;
    out.push(tok);
  }
  return out;
}

/**
 * Score a single skill against prompt tokens.
 * Per-token best weight: name=3, namespace=2, description=1.
 * Normalizer: max-per-token (3) * min(tokens.length, TOKEN_DENOM_CAP).
 * Cap rationale: long prompts dilute denom; cap prevents under-scoring.
 *
 * @param {string[]} promptTokens
 * @param {IndexedSkill} skill
 * @returns {{score: number, matchedTerms: string[]}}
 */
function scoreSkill(promptTokens, skill) {
  if (promptTokens.length === 0) return { score: 0, matchedTerms: [] };
  const name = normalizeText(skill.name);
  const ns = normalizeText(skill.namespace);
  const desc = normalizeText(skill.description);
  let raw = 0;
  const matched = new Set();
  for (const tok of promptTokens) {
    let best = 0;
    if (name.includes(tok)) best = Math.max(best, 3);
    if (ns.includes(tok)) best = Math.max(best, 2);
    if (desc.includes(tok)) best = Math.max(best, 1);
    if (best > 0) {
      raw += best;
      matched.add(tok);
    }
  }
  const denom = 3 * Math.min(promptTokens.length, TOKEN_DENOM_CAP);
  const score = denom > 0 ? raw / denom : 0;
  return { score, matchedTerms: [...matched] };
}

/**
 * @param {string} prompt
 * @param {SkillIndexFile} index
 * @param {MatchOptions} [opts]
 * @returns {MatchResult[]}
 */
function matchSkills(prompt, index, opts) {
  const o = opts || {};
  const topN = o.topN != null ? o.topN : DEFAULT_TOP_N;
  const threshold = o.threshold != null ? o.threshold : DEFAULT_THRESHOLD;
  const excludeBlocked = o.excludeBlocked != null ? o.excludeBlocked : true;

  const promptTokens = tokenize(prompt);
  if (promptTokens.length === 0) return [];

  const scored = [];
  for (const skill of index.skills) {
    if (excludeBlocked && skill.trustLevel === "blocked") continue;
    const { score, matchedTerms } = scoreSkill(promptTokens, skill);
    if (score >= threshold) {
      scored.push({ skill, score, matchedTerms });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topN);
}

/**
 * @param {string} [indexPath]
 * @returns {SkillIndexFile}
 */
function loadIndex(indexPath) {
  const p = indexPath || path.join(process.cwd(), "memory/shared/plugin_skill_index.json");
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

module.exports = {
  matchSkills,
  scoreSkill,
  tokenize,
  loadIndex,
  DEFAULT_THRESHOLD,
  TOKEN_DENOM_CAP,
  DEFAULT_TOP_N,
};

// CLI dry-run: `node scripts/lib/skill-matcher.js "<prompt>" [--top 3] [--threshold 0.22] [--json]`
function cli() {
  const args = process.argv.slice(2);
  let threshold = DEFAULT_THRESHOLD;
  let topN = DEFAULT_TOP_N;
  let jsonOut = false;
  const promptParts = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--threshold" && args[i + 1] != null) {
      threshold = parseFloat(args[++i]);
    } else if (a === "--top" && args[i + 1] != null) {
      topN = parseInt(args[++i], 10);
    } else if (a === "--prompt" && args[i + 1] != null) {
      promptParts.push(args[++i]);
    } else if (a === "--json") {
      jsonOut = true;
    } else if (a !== undefined) {
      promptParts.push(a);
    }
  }
  const prompt = promptParts.join(" ").trim();
  if (!prompt) {
    console.error('Usage: node skill-matcher.js "<prompt>" [--top 3] [--threshold 0.22] [--json]');
    process.exit(1);
  }
  const index = loadIndex();
  const results = matchSkills(prompt, index, { topN, threshold });

  if (jsonOut) {
    console.log(JSON.stringify({
      prompt,
      tokens: tokenize(prompt),
      threshold,
      topN,
      indexSize: index.totalCount,
      results: results.map(r => ({
        namespace: r.skill.namespace,
        name: r.skill.name,
        score: r.score,
        matchedTerms: r.matchedTerms,
      })),
    }, null, 2));
    return;
  }

  console.log(`prompt: ${prompt}`);
  console.log(`tokens: [${tokenize(prompt).join(", ")}]  threshold=${threshold}  top=${topN}  indexSize=${index.totalCount}`);
  if (results.length === 0) {
    console.log("(no matches above threshold)");
    return;
  }
  console.log("");
  console.log("| # | Skill | Score | Matched |");
  console.log("|---|---|---|---|");
  results.forEach((r, i) => {
    console.log(`| ${i + 1} | ${r.skill.namespace}:${r.skill.name} | ${r.score.toFixed(3)} | ${r.matchedTerms.join(", ")} |`);
  });
}

const invokedPath = process.argv[1];
const isDirect = invokedPath !== undefined && /skill-matcher\.js$/.test(invokedPath);
if (isDirect) {
  try {
    cli();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
