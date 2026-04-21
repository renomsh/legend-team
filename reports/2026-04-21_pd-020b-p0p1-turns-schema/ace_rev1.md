---
role: ace
session: session_060
topic: pd-020b-p0p1-turns-schema
phase: framing + synthesis
rev: 1
---

# Ace — 프레이밍 + 종합검토

## 1. 프레이밍 (L2)

**핵심 질문**: PD-020b Context 3층 구현 전, turns[] 무결성 확보 + 3층 스키마 확정.

**결정 축 5개** — Master 2개 확정(전수 13개 / Arki 재검토), 나머지 3개는 Arki/Fin 합의:
- P1 스키마 형식 → TS + 전용 검증함수 (JSON schema 생략)
- turn_log 위치 → `topics/{id}/turn_log.jsonl` (D-051 토픽 중심)
- context_brief → 고정 5섹션 + 5KB 상한

**executionPlanMode**: plan — Arki 1차 발언에 Phase 분해 포함.

**역할 호출**: Ace → Arki → Fin → Riki → Ace(종합) → Editor. Nova 스킵.

## 2. 종합검토

### P0 결과
13세션 전수 검증 — 초기 FAIL 11건 → 원인 2분류(phase drift, agentsCompleted Set-dedup) → 루트 수정 + 백필 → 재검증 13/13 OK. 중단 조건(5건) 초과했으나 원인이 2개로 수렴해 본 세션 내 해결 가능 판단. session-end-finalize.js를 **turns=단일원천, agentsCompleted=파생** 구조로 재설계 — 재발 차단.

### P1 결과
- `src/types/context-layers.ts` — L1/L2/L3 인터페이스 + 필수 섹션 상수 + 크기 상한
- `scripts/lib/validate-context-layers.ts` — throws-on-invalid
- `docs/context-layers-spec.md` — 파생 체인·실패 격리·nextAction·RK-4 L1 소급 방침
- `scripts/validate-schema-vs-data.ts` — drift baseline 0

### Key Decision 제안 (D-054)
**phase_catalog v1.1 + agentsCompleted 파생 구조**: turns[]를 단일 원천으로 확정. agentsCompleted는 session-end-finalize에서 turns.role 순서·중복 허용으로 자동 재생성. D-048 "중복 허용 배열" 원칙의 실질 보장.

## 3. nextAction

session_061 착수 — P2 L1 writer, P3 session-contribution-writer 훅, P4 regenerate-context-brief 훅, P5 /close 훅 체인 편입 + session_060 L1 소급 backfill.
