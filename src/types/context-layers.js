"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.L3_SIZE_LIMIT_BYTES = exports.L3_REQUIRED_SECTIONS = exports.L2_REQUIRED_SECTIONS = void 0;
/** 고정 섹션 — Editor 작성 시 이 순서 강제 */
exports.L2_REQUIRED_SECTIONS = [
    '## Summary', // 1-2줄 세션 요지
    '## Decisions', // 승인된 Master 결정 본문
    '## Key Findings', // Riki/Arki 핵심 발견
    '## Open Issues', // 미해결 이슈 (다음 세션 이월 후보)
    '## Next Action', // Ace nextAction 이월
];
/** 고정 5섹션 — 섹션명/순서 변경 시 /open 로더 깨짐 */
exports.L3_REQUIRED_SECTIONS = [
    '## Current Phase', // 현 phase + hold 여부
    '## Key Anchors', // 토픽 결정의 앵커가 되는 D-NNN 리스트 (본문 인용)
    '## Decisions', // 토픽 결정 누적 요약
    '## Open Issues', // 미해결 이슈
    '## Next Action', // 다음에 할 일 (최신 L2의 nextAction)
];
/** L3 크기 상한 — Fin 비용 의견 반영 */
exports.L3_SIZE_LIMIT_BYTES = 5 * 1024;
//# sourceMappingURL=context-layers.js.map