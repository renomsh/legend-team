---
topic: PD-020a 스키마 + phase×hold 기반 구현
sessionId: session_054
grade: A
date: 2026-04-21
status: open
decision: D-052
parentDecision: D-051
relatedDeferrals: [PD-020b, PD-020c]
---

# D-052 — 토픽 중심 스키마 v1 (phase×hold 직교화 + 단일원천 강제)

## 1. 결정 요약

D-051에서 합의한 N:1 단방향 + phase×hold 직교화를 5개 파일 스키마로 구체화. **단일원천·확장성·디버깅 가능성**을 1회성 구현비용보다 우선. 미러·중복·추측 백필을 전면 금지.

## 2. 핵심 5축

| # | 결정 |
|---|---|
| 1 | `topic_meta.sessions[]` **삭제** — 단일원천 = `session_index.topicId` |
| 2 | `topic_index` 미러(phase, hold) **삭제** — 단일원천 = `topic_meta` |
| 3 | `hold = HoldState \| null` 객체 표현, `hold === null` ⇔ active. `hold.reason`은 catalog enum |
| 4 | `phase_catalog.json` + `hold_reasons_catalog.json` 단일원천. `aliases` · `deprecated` · `schemaVersion` 필드 필수 |
| 5 | 마이그레이션 = `phase: null, hold: null, legacy: true`. **추측 백필 금지** |

## 3. 부속 결정

- `phaseHistory[]` **인라인 유지** — phase 전환은 토픽 평생 4~5건. JSONL 분리는 과잉 추상화로 거부.
- `validate-topic-schema.ts`에 `assertPhase` / `assertHold` type guard **export 필수**. 모든 reader는 raw 접근 금지.
- legacy 플래그 의미 명문화: `legacy:true ⇒ phase·hold 항상 null 보장`.

## 4. antiPatterns (미래 회귀 차단)

향후 토픽·세션이 다음 패턴을 부활시키면 본 결정 위반:

1. `topic_meta.sessions[]` 부활 — N:1 단방향(D-051) 위반
2. `topic_index`에 phase/hold 미러 추가 — 단일원천 위반
3. topic→sessions 캐시 파일 신설 — read-time aggregation 원칙 위반

> 정식 `antiPatterns: string[]` 필드의 decision_ledger 도입은 **PD-020c** 스코프 (owningTopicId·scopeCheck와 함께).

## 5. 스코프 경계

**In:** topic_meta·topic_index·current_session·session_index·decision_ledger 5개 파일 스키마, catalog 2개 신설, validator·writer 갱신, 56토픽·52세션 마이그레이션.

**Out (이연):**
- Context 3층 누적 (turn_log/contributions/brief) → **PD-020b**
- decision_ledger.owningTopicId·scopeCheck·antiPatterns 필드 → **PD-020c**
- topic_lifecycle_rules.json (maxSessions/lastActivity) → **PD-020c**
- phase 전이 그래프·hold expectedResume → **PD-020c**
- compute-dashboard.ts 갱신 (Master 확정 B6) → 별도 후속

## 6. Riki 보강 (전건 흡수)

- **RK-1:** catalog `aliases`/`deprecated`/`schemaVersion` 필수 필드.
- **RK-2:** type guard export + legacy 의미 명문화.
- **RK-3:** antiPatterns 본문 텍스트 명시 (필드화는 PD-020c).

## 7. 비채택

- `phase_events.jsonl` 별도 파일 (R5) — phase 전환 빈도(토픽당 4건)에 비해 파일 lifecycle 비용 과다.
- decision_ledger 스키마 변경 본 세션 진행 — 스코프(PD-020c) 침범.
- 대시보드 토픽 KPI 신규 패널 — Master B6 확정.
- 절충안 — 단일원천 부분적용은 가치 0.

## 8. 종결 조건

P5(verify) 통과 = 본 결정 이행 완료. PD-020a status → resolved. PD-020b 진행 가능 신호.
