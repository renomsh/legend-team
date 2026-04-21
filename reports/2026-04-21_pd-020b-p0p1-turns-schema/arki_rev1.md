---
role: arki
session: session_060
topic: pd-020b-p0p1-turns-schema
phase: analysis + execution-plan + post-intervention
rev: 1
---

# Arki — 구조 분석 + 실행계획 + 재검토

## 1. 구조 분석

3층 단방향 파생: L1(turn_log.jsonl, append-only) → L2(session_contributions/, /close 시 1회) → L3(context_brief.md, /close 훅 말미 누적 재생성).

## 2. 결정 축 의견
- 축③ TS + 검증함수 단일원천
- 축④ 토픽 중심 (D-051 N:1 단방향 정면 반영)
- 축⑤ 고정 5섹션 (/open 자동 로드 캐시 친화)

## 3. 추가 의견
- **GA-1**: `TopicIndexEntry` 타입 누락 재발 방지 → `validate-schema-vs-data.ts` 신설 (P1.4 채택)
- **GA-2**: L1 실패 격리 — 단건 무시, 누적 경보 (Riki 안과 병합)

## 4. 실행계획

**P0** — 무결성 검증 (게이트: smoke test → 전수 OK → 불일치 시 재검토 → 백필 → 재검증 pass + session_index 전파)
**P1** — 3층 스키마 정의 (TS 인터페이스 → 검증함수 → 스펙 문서 → drift 감시)

## 5. Post-Intervention 재검토 (원인 분류)

**C1 phase enum drift (11 세션, 30건)**: 역할 발언 시 phase를 catalog 대신 의미론적 이름으로 자유 기재. 매핑 규칙 확정(structural-analysis/cost-evaluation/risk-audit/resource-evaluation/design-spec/design-critique → analysis, decision-refinement/review → synthesis, output → compile, implementation 신설 유지).

**C2 agentsCompleted Set-dedup (4 세션)**: D-048 "중복 허용 배열" 원칙이 turns[]에만 반영되고 agentsCompleted엔 옛 dedup 잔존. session-end-finalize.js에서 turns.role 순서·중복 허용으로 파생하도록 근본 수정.

백필 dry-run → apply → 재검증 13/13 OK.
