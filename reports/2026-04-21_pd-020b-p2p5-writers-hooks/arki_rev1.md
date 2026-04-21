---
topic: topic_064
topic_slug: pd-020b-p2p5-writers-hooks
role: arki
phase: analysis
revision: 1
date: 2026-04-21
report_status: approved
session_status: closed
accessed_assets:
  - scripts/lib/validate-context-layers.ts
  - src/types/context-layers.ts
  - memory/shared/phase_catalog.json
---

# Arki — 구조설계 검증 (P2~P5)

## 선결 자산 확인 (P0+P1 산출물)

- **Type 단일원천:** `src/types/context-layers.ts` — L1/L2/L3 타입
- **검증 함수:** `scripts/lib/validate-context-layers.ts`
- writer는 타입 import만, 자체 스키마 재정의 금지 (D-054 단일원천 원칙)

## 의존 그래프

```
P2 L1 writer (turn_log.jsonl append)
  └─ caller: Claude Code (역할 발언 직후, C1 turn push)

P3 L2 writer (session_contributions/{sessionId}.md)
  ├─ input: turn_log.jsonl + session_index 메타
  └─ caller: /close 훅

P4 L3 regenerator (context_brief.md)
  ├─ input: session_contributions/*.md 전체
  └─ caller: /close 훅 (L2 직후)

P5 훅 체인 편입
  └─ finalize → [NEW] L2-writer → [NEW] L3-regenerator → compute → build → push

P2b session_060 L1 backfill (1회성)
```

## 검증 게이트

| Phase | Gate |
|---|---|
| P2 | validate-l1-entries 통과 |
| P2b | fabrication 없음 — turns[] 데이터만, gist에 [backfill] 명시 |
| P3 | L2 md 인용 turnIdx가 turn_log에 존재 |
| P4 | 동일 입력 2회 실행 → 동일 출력 (멱등) |
| P5 | 훅 순서 보존, 실패 시 build/push 차단 안 함 (체인 유지) |

## 리스크

- **R1 (중):** legacy 세션 L2 없음 → skip 조건 명시 (`legacy:true` 시 skip)
- **R2 (중):** hold 토픽 L3 재생성 — hold 무관 항상 수행, /open 로더가 필터링
- **R3 (저):** L2 성공 후 L3 실패 → L3 재실행으로 복구 가능 (트랜잭션 불필요)
