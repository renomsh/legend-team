"use strict";
// Phase B (G2) one-shot dry-run harness.
// Loads samples + index, runs matcher, computes fitness per row.

const fs = require("fs");
const path = require("path");
const { matchSkills, loadIndex, DEFAULT_THRESHOLD } = require("./skill-matcher.js");

const samplesPath = path.join(__dirname, "skill-matcher-g2-samples.json");
const samples = JSON.parse(fs.readFileSync(samplesPath, "utf-8"));
const index = loadIndex();

const rows = [];
let fitCount = 0;
let top1Hits = 0;
let groundTruthCount = 0;
let fpCount = 0;
let nsSet = new Set();

for (const s of samples.samples) {
  // Use threshold=0 to capture top scores even for null-truth rows; we'll evaluate threshold logic ourselves.
  const all = matchSkills(s.prompt, index, { topN: 5, threshold: 0 });
  const top = all[0];
  const top1Id = top ? `${top.skill.namespace}:${top.skill.name}` : null;
  const top1Score = top ? top.score : 0;

  // Ground-truth specific score lookup
  let gtScore = null;
  if (s.groundTruth) {
    const gtTokens = s.groundTruth.split(":");
    const gtNs = gtTokens[0];
    const gtName = gtTokens[1];
    const found = all.find(r => r.skill.namespace === gtNs && r.skill.name === gtName);
    gtScore = found ? found.score : 0;
  }

  // Fitness evaluation
  let fit = false;
  let reason = "";
  if (s.groundTruth === null) {
    // null truth: no skill should pass threshold
    const anyAbove = all.some(r => r.score >= DEFAULT_THRESHOLD);
    if (anyAbove) {
      fit = false;
      reason = `false-positive: ${top1Id} score ${top1Score.toFixed(3)} >= ${DEFAULT_THRESHOLD}`;
      fpCount++;
    } else {
      fit = true;
      reason = "no-match (correct)";
    }
  } else {
    groundTruthCount++;
    const top1Match = top1Id === s.groundTruth;
    const thresholdPass = gtScore >= DEFAULT_THRESHOLD;
    if (top1Match) top1Hits++;
    if (top1Match && thresholdPass) {
      fit = true;
      reason = "top1+threshold";
    } else if (!top1Match && thresholdPass) {
      fit = false;
      reason = `top1 wrong: got ${top1Id} (${top1Score.toFixed(3)}), gt score ${gtScore.toFixed(3)}`;
    } else if (top1Match && !thresholdPass) {
      fit = false;
      reason = `top1 correct but below threshold (${gtScore.toFixed(3)})`;
    } else {
      fit = false;
      reason = `top1 wrong + below threshold: got ${top1Id} (${top1Score.toFixed(3)}), gt score ${gtScore.toFixed(3)}`;
    }
  }

  if (fit) fitCount++;
  if (top && top.skill.namespace) nsSet.add(top.skill.namespace);

  rows.push({
    id: s.id,
    domain: s.domain,
    prompt: s.prompt,
    groundTruth: s.groundTruth,
    top1: top1Id,
    top1Score: top1Score,
    gtScore: gtScore,
    fit,
    reason,
  });
}

const totalGt = groundTruthCount;
const top1Acc = totalGt > 0 ? top1Hits / totalGt : 0;
const fitRate = fitCount / samples.samples.length;
const gtNamespaces = new Set(samples.samples.filter(s => s.groundTruth).map(s => s.groundTruth.split(":")[0]));
const nsDiv = gtNamespaces.size / 32;

console.log(JSON.stringify({
  threshold: DEFAULT_THRESHOLD,
  total: samples.samples.length,
  fit: fitCount,
  fitRate: fitRate,
  top1Hits,
  top1Acc,
  fpCount,
  gtNamespacesCount: gtNamespaces.size,
  nsDiv,
  gateG2: fitCount >= 14 ? "PASS" : "FAIL",
  rows,
}, null, 2));
