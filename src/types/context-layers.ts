/**
 * context-layers.ts
 * PD-020b P1 (session_060) — Context 3층 누적 스키마 정의.
 *
 * L1 turn_log.jsonl       — 토픽 단위 append-only raw turn stream
 * L2 session_contributions — 세션 단위 Editor 요약 (Markdown + frontmatter)
 * L3 context_brief.md      — 토픽 현재 상태 압축 (L2 누적 파생)
 *
 * 원칙:
 *  - L1은 turn 발언 직후 append (D-048 C1, 세션 종료 대기 없음)
 *  - L2는 /close 시점 1회 생성 (L1 + Ace 종합검토 + Master 결정 병합)
 *  - L3은 /close 훅 체인 마지막에서 L2 누적 재생성 (단방향 파생)
 *  - turns[]가 단일 원천. agentsCompleted는 turns.role에서 파생
 */

import type { PhaseId, RecallReason } from '../../scripts/lib/turn-types';

// ──────────────────────────────────────────
// L1 — turn_log.jsonl entry
// ──────────────────────────────────────────
/**
 * topics/{topicId}/turn_log.jsonl 한 줄에 대응.
 * turn 발언 직후 append. 세션 경계는 sessionId로 구분.
 */
export interface TurnLogEntry {
  /** ISO 8601 발언 시각 */
  ts: string;
  /** D-051 N:1 단방향 — 귀속 토픽 */
  topicId: string;
  /** 발언이 속한 세션 */
  sessionId: string;
  /** turns[] 내 0-based 인덱스 */
  turnIdx: number;
  /** 발언 역할 */
  role: string;
  /** phase_catalog enum */
  phase?: PhaseId;
  /** 재호출 사유 (있을 때만) */
  recallReason?: RecallReason;
  splitReason?: string;
  /** 발언 규모 (선택) */
  chars?: number;
  segments?: number;
  /** 발언 요지 1~2줄 (선택, L2 파생용 시드) */
  gist?: string;
}

// ──────────────────────────────────────────
// L2 — session_contributions/{sessionId}.md
// ──────────────────────────────────────────
/**
 * 토픽 관점에서 해당 세션이 기여한 바 요약.
 * 파일 위치: topics/{topicId}/session_contributions/{sessionId}.md
 * Markdown frontmatter + 고정 섹션.
 */
export interface SessionContributionFrontmatter {
  sessionId: string;
  topicId: string;
  startedAt: string;
  closedAt: string;
  grade: 'S' | 'A' | 'B' | 'C';
  gradeActual?: 'S' | 'A' | 'B' | 'C' | null;
  /** turns[]에서 파생 */
  rolesInOrder: string[];
  turnsCount: number;
  /** Master가 본 세션에서 승인한 결정 id 리스트 */
  decisionIds: string[];
  /** Ace 종합검토 출력의 nextAction 필드 (RK 보강) */
  nextAction: string;
  /** L1 쓰기 실패 건수 (누적 0 이상) */
  l1WriteFailures?: number;
}

/** 고정 섹션 — Editor 작성 시 이 순서 강제 */
export const L2_REQUIRED_SECTIONS = [
  '## Summary',          // 1-2줄 세션 요지
  '## Decisions',        // 승인된 Master 결정 본문
  '## Key Findings',     // Riki/Arki 핵심 발견
  '## Open Issues',      // 미해결 이슈 (다음 세션 이월 후보)
  '## Next Action',      // Ace nextAction 이월
] as const;

// ──────────────────────────────────────────
// L3 — context_brief.md
// ──────────────────────────────────────────
/**
 * 토픽 현재 상태 압축. /open step 3.5에서 자동 로드.
 * 파일 위치: topics/{topicId}/context_brief.md
 * 크기 상한: 5KB. 초과 시 Editor가 요약 압축 (L3 재생성 훅).
 */
export interface ContextBriefFrontmatter {
  topicId: string;
  topicTitle: string;
  phase: 'framing' | 'design' | 'implementation' | 'validated';
  hold: null | { heldAt: string; heldAtPhase: string; reason: string };
  grade: 'S' | 'A' | 'B' | 'C';
  /** 파생된 세션 수 */
  sessionCount: number;
  /** 마지막 파생 시각 */
  lastUpdated: string;
  /** byte 크기 (write 시 자동 계산) */
  sizeBytes: number;
}

/** 고정 5섹션 — 섹션명/순서 변경 시 /open 로더 깨짐 */
export const L3_REQUIRED_SECTIONS = [
  '## Current Phase',    // 현 phase + hold 여부
  '## Key Anchors',      // 토픽 결정의 앵커가 되는 D-NNN 리스트 (본문 인용)
  '## Decisions',        // 토픽 결정 누적 요약
  '## Open Issues',      // 미해결 이슈
  '## Next Action',      // 다음에 할 일 (최신 L2의 nextAction)
] as const;

/** L3 크기 상한 — Fin 비용 의견 반영 */
export const L3_SIZE_LIMIT_BYTES = 5 * 1024;
