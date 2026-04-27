#!/usr/bin/env ts-node
/**
 * backfill-from-notes.ts
 * session_index.json의 각 세션 note 텍스트를 파싱하여
 * 누락된 역할(특히 Nova)을 agentsCompleted에 보강한다.
 *
 * 부정 문맥 제외: "미호출", "안 채택", "미참여", "Nova 없음"
 *
 * 사용법: ts-node scripts/backfill-from-notes.ts [--dry-run]
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');
const SESSION_INDEX_PATH = path.join(ROOT, 'memory', 'sessions', 'session_index.json');

// 한글 패턴 제거 — "아키"가 "아키텍처"로 오인되는 등 false positive 발생.
// note는 영문 역할명을 일관되게 사용하므로 영문 word boundary로 충분.
const ROLE_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  { name: 'ace', regex: /\bAce\b/ },
  { name: 'arki', regex: /\bArki\b/ },
  { name: 'fin', regex: /\bFin\b/ },
  { name: 'riki', regex: /\bRiki\b/ },
  { name: 'nova', regex: /\bNova\b/ },
  { name: 'edi', regex: /\b(Edi|Editor)\b/ },
  { name: 'vera', regex: /\bVera\b/ },
  { name: 'dev', regex: /\bDev\b/ },
];

// 부정 문맥: "Nova 미호출", "Arki 안 채택" 등
function isNegated(note: string, role: string): boolean {
  const lower = note.toLowerCase();
  const idx = lower.indexOf(role.toLowerCase());
  if (idx < 0) return false;
  // role 등장 위치 ±15자 내 부정어 검색
  const window = note.slice(Math.max(0, idx - 15), Math.min(note.length, idx + role.length + 15));
  return /미호출|안\s*채택|미참여|없음|제외|미사용/.test(window);
}

interface SessionEntry {
  sessionId: string;
  topicSlug: string;
  note?: string;
  agentsCompleted?: string[];
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  if (dryRun) console.log('🔍 Dry-run 모드\n');

  const data = JSON.parse(fs.readFileSync(SESSION_INDEX_PATH, 'utf8')) as { sessions: SessionEntry[]; lastUpdated: string };

  let updated = 0;
  for (const s of data.sessions) {
    if (!s.note) continue;
    const detected: string[] = [];
    for (const { name, regex } of ROLE_PATTERNS) {
      if (regex.test(s.note) && !isNegated(s.note, name)) {
        detected.push(name);
      }
    }
    if (detected.length === 0) continue;

    // 기존 agentsCompleted (case 정규화)와 병합
    const existing = new Set((s.agentsCompleted ?? []).map(r => r.toLowerCase()));
    const added = detected.filter(r => !existing.has(r));
    if (added.length === 0) continue;

    const merged = Array.from(new Set([...(s.agentsCompleted ?? []).map(r => r.toLowerCase()), ...detected]));
    console.log(`✅ ${s.sessionId}: +[${added.join(', ')}] → [${merged.join(', ')}]`);
    if (!dryRun) s.agentsCompleted = merged;
    updated++;
  }

  if (!dryRun) {
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(SESSION_INDEX_PATH, JSON.stringify(data, null, 2), 'utf8');
    JSON.parse(fs.readFileSync(SESSION_INDEX_PATH, 'utf8'));
    console.log(`\n✅ ${updated}개 세션 업데이트`);
  } else {
    console.log(`\n🔍 ${updated}개 세션 업데이트 예정`);
  }
}

main();
