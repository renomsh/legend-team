/**
 * m-cross-check.ts — PD-079 / D-181 Phase 4
 *
 * mD ↔ 공식 D dedupe 후보 식별. 본 모듈은 read-only.
 *
 * 구조적 분리(Riki R-2): 입력 타입을 DecisionLedgerEntry[]로 제약 →
 * mD↔mD 비교 시그니처상 차단. 런타임 가드는 'mD-' prefix skip로 보강.
 *
 * 직교 시그널: ID 매칭(D-NNN/PD-NNN) → 무조건 preview/dedupe 강제.
 * 유사도: cosine ≥ dedupeThreshold → auto-dedupe / ≥ previewThreshold → preview.
 */

import type { DecisionLedgerEntry } from '../../src/types/index';
import type { MDecisionLedgerEntry } from './m-types';
import { similarity } from './similarity';
import { getMConfig } from './m-config';

export type CrossCheckReason = 'id-match' | 'similarity';
export type RecommendedAction = 'auto-dedupe' | 'preview' | 'new-d';

export interface CrossCheckCandidate {
  officialId: string;
  score: number;
  reason: CrossCheckReason;
}

export interface CrossCheckResult {
  candidates: CrossCheckCandidate[];
  recommendedAction: RecommendedAction;
}

const TOP_K = 5;

/**
 * mD entry와 공식 ledger entries 비교.
 * mD↔mD 차단: entries 중 id가 'mD-' prefix면 skip.
 */
export function crossCheckMD(
  mEntry: MDecisionLedgerEntry,
  officialEntries: DecisionLedgerEntry[]
): CrossCheckResult {
  const cfg = getMConfig();
  const idDecisionRe = new RegExp(cfg.idPatterns.decision, 'g');
  const idPdRe = new RegExp(cfg.idPatterns.pendingDeferral, 'g');

  // mD axis/summary에서 ID 추출
  const meta = mEntry as unknown as { summary?: string; decision?: string };
  const haystack = `${mEntry.axis ?? ''} ${meta.summary ?? ''} ${meta.decision ?? ''}`;
  const idMatches = new Set<string>();
  for (const m of haystack.matchAll(idDecisionRe)) idMatches.add(m[0]);
  for (const m of haystack.matchAll(idPdRe)) idMatches.add(m[0]);

  const candidates: CrossCheckCandidate[] = [];

  for (const off of officialEntries) {
    // mD↔mD 런타임 가드: 'mD-' prefix는 공식 D 아님
    if (typeof off?.id === 'string' && off.id.startsWith('mD-')) continue;
    if (!off || typeof off.id !== 'string') continue;

    // 1) ID 매칭 (직교 시그널)
    if (idMatches.has(off.id)) {
      candidates.push({
        officialId: off.id,
        score: 1.0,
        reason: 'id-match',
      });
      continue;
    }

    // 2) 유사도 (axis 기준)
    const score = similarity(mEntry.axis ?? '', off.axis ?? '');
    if (score >= cfg.similarity.previewThreshold) {
      candidates.push({
        officialId: off.id,
        score,
        reason: 'similarity',
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  const top = candidates.slice(0, TOP_K);

  let recommendedAction: RecommendedAction = 'new-d';
  const best = top[0];
  if (best) {
    if (best.reason === 'id-match') {
      // ID 매칭은 preview 강제 (자동 dedupe 위험 — Riki R-2)
      recommendedAction = 'preview';
    } else if (best.score >= cfg.similarity.dedupeThreshold) {
      recommendedAction = 'auto-dedupe';
    } else {
      recommendedAction = 'preview';
    }
  }

  return { candidates: top, recommendedAction };
}
