// Phase 2 — Plugin skill matcher (D-177, topic_190).
// Stage 1: substring/keyword scoring against name·namespace·description.
// Stage 2 (LLM intent classification) intentionally deferred — Phase 2 PoC
// per spec runs on substring scoring only and is gated by Master eval (G2).

import * as fs from "fs";
import * as path from "path";

export interface IndexedSkill {
  name: string;
  namespace: string;
  description: string;
  descriptionHash: string;
  tags: string[];
  trustLevel: "unverified" | "verified" | "blocked";
  source: "marketplace" | "cowork";
  sourcePath: string;
}

export interface SkillIndexFile {
  version: string;
  lastSync: string;
  totalCount: number;
  skills: IndexedSkill[];
}

export interface MatchResult {
  skill: IndexedSkill;
  score: number;
  matchedTerms: string[];
}

const STOPWORDS = new Set([
  // English minimal stopword list — bias toward keeping content words.
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "at",
  "for", "with", "by", "from", "as", "is", "are", "was", "were", "be",
  "been", "being", "have", "has", "had", "do", "does", "did", "will",
  "would", "could", "should", "may", "might", "can", "i", "me", "my",
  "you", "your", "we", "our", "it", "its", "this", "that", "these", "those",
  "what", "which", "who", "how", "when", "where", "why", "if", "so",
  "not", "no", "yes", "please", "give", "make", "use", "using", "want",
  // Korean particles/very common words (heuristic; substring matches descriptions
  // poorly across languages anyway).
  "은", "는", "이", "가", "을", "를", "에", "의", "도", "만", "와", "과",
  "해", "해줘", "해주세요", "주세요", "그", "그리고", "또는", "그래서",
]);

function normalizeText(s: string): string {
  return s.toLowerCase();
}

function tokenize(s: string): string[] {
  // Split on whitespace and ASCII non-word punctuation; keep Hangul syllables together.
  const norm = normalizeText(s);
  const raw = norm.split(/[\s,.;:!?()[\]{}<>"'`/\\|+=*&^%$#@~\-]+/);
  const out: string[] = [];
  for (const tok of raw) {
    if (!tok) continue;
    if (tok.length < 2) continue;
    if (STOPWORDS.has(tok)) continue;
    out.push(tok);
  }
  return out;
}

function scoreSkill(
  promptTokens: string[],
  skill: IndexedSkill,
): { score: number; matchedTerms: string[] } {
  if (promptTokens.length === 0)
    return { score: 0, matchedTerms: [] };
  const name = normalizeText(skill.name);
  const ns = normalizeText(skill.namespace);
  const desc = normalizeText(skill.description);
  let raw = 0;
  const matched = new Set<string>();
  for (const tok of promptTokens) {
    let best = 0;
    if (name.includes(tok)) {
      best = Math.max(best, 3);
    }
    if (ns.includes(tok)) {
      best = Math.max(best, 2);
    }
    if (desc.includes(tok)) {
      best = Math.max(best, 1);
    }
    if (best > 0) {
      raw += best;
      matched.add(tok);
    }
  }
  // Normalize: max possible per token = 3 (name match dominates).
  const score = raw / (3 * promptTokens.length);
  return { score, matchedTerms: [...matched] };
}

export interface MatchOptions {
  topN?: number;
  threshold?: number;
  excludeBlocked?: boolean;
}

export function matchSkills(
  prompt: string,
  index: SkillIndexFile,
  opts: MatchOptions = {},
): MatchResult[] {
  const topN = opts.topN ?? 3;
  const threshold = opts.threshold ?? 0.5;
  const excludeBlocked = opts.excludeBlocked ?? true;

  const promptTokens = tokenize(prompt);
  if (promptTokens.length === 0) return [];

  const scored: MatchResult[] = [];
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

export function loadIndex(indexPath?: string): SkillIndexFile {
  const p =
    indexPath ?? path.join(process.cwd(), "memory/shared/plugin_skill_index.json");
  return JSON.parse(fs.readFileSync(p, "utf-8")) as SkillIndexFile;
}

// CLI dry-run mode: `npx ts-node scripts/lib/skill-matcher.ts "<prompt>"`
async function cli(): Promise<void> {
  const args = process.argv.slice(2);
  let threshold = 0.5;
  let topN = 3;
  const promptParts: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--threshold" && args[i + 1]) {
      threshold = parseFloat(args[++i]!);
    } else if (a === "--top" && args[i + 1]) {
      topN = parseInt(args[++i]!, 10);
    } else {
      if (a !== undefined) promptParts.push(a);
    }
  }
  const prompt = promptParts.join(" ").trim();
  if (!prompt) {
    console.error('Usage: skill-matcher "<prompt>" [--top 3] [--threshold 0.5]');
    process.exit(1);
  }
  const index = loadIndex();
  const results = matchSkills(prompt, index, { topN, threshold });
  console.log(`prompt: ${prompt}`);
  console.log(
    `tokens: [${tokenize(prompt).join(", ")}]  threshold=${threshold}  top=${topN}  indexSize=${index.totalCount}`,
  );
  if (results.length === 0) {
    console.log("(no matches above threshold)");
    return;
  }
  console.log("");
  console.log("| # | Skill | Score | Matched |");
  console.log("|---|---|---|---|");
  results.forEach((r, i) => {
    console.log(
      `| ${i + 1} | ${r.skill.namespace}:${r.skill.name} | ${r.score.toFixed(2)} | ${r.matchedTerms.join(", ")} |`,
    );
  });
}

const isDirect =
  process.argv[1] !== undefined &&
  /skill-matcher\.(ts|js)$/.test(process.argv[1]);
if (isDirect) {
  cli().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
