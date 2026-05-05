---
role: edi
session: session_195
topic: PD-065 signatureMetrics 잔재 위생
topicId: topic_168
grade: B
turnId: 4
invocationMode: subagent
date: 2026-05-05
accessed_assets:
  - memory/shared/topic_index.json
  - memory/sessions/current_session.json
  - memory/roles/personas/role-vera.md
  - memory/growth/phase_dod.json
  - memory/growth/composite_inputs.json
  - memory/growth/rollback_playbook.md
  - memory/specs/page-checklist/growth.md
  - scripts/seed-signature-metrics.ts
---

# Edi 보고서 — PD-065 signatureMetrics 잔재 위생

## Executive Summary

Arki·Riki 분석 기반으로 수정 대상 6개 파일에 대한 교정을 완료했다. 런타임 하드 참조 4개(app/growth.html, feature_flags.json, compile-metrics-registry.ts, test-p0b-smoke.ts)는 이번 범위 외로 보존했으며, 역사 기록 41개도 전량 보존했다. seed-signature-metrics.ts 재실행 리스크(R-1)는 deprecated 주석 1줄 추가로 완화했다.

---

## 결정 흐름 표

| 순서 | 역할 | 핵심 결정 |
|---|---|---|
| turn 0 | Arki | 130+건 스캔 → 수정 불가 4개 / 보존 41개 / 수정 대상 5개 / 별도 결정 유보 1개 식별 |
| turn 1 | Riki | Arki 판단 전부 검증·지지. seed-signature-metrics.ts deprecated 주석(R-1) 추가 권고로 수정 대상 6개로 확장 |
| turn 2 | Edi | 6개 파일 수정 적용 + 보고서 작성 |
| turn 3 | Zero | 발언 condensed 처리 (zero_rev*.md 미발견 gap 기록됨) |

---

## 역할별 기여 통합

### Arki
- 스캔 범위: 50개 파일, 약 130+건 (reports 디렉터리 70건 포함)
- 수정 불가 4개: 런타임 하드 참조 (feature_flags.json 키, app/growth.html, compile-metrics-registry.ts L93-94, test-p0b-smoke.ts)
- 보존 필수 41개: 세션 보고서·topic 메타·decision_ledger·session_index — 역사 왜곡 방지
- 별도 결정 유보: seed-signature-metrics.ts (구 스키마 write, deprecated 선언 부재)
- 수정 대상 5개 우선순위 분류 (MUST_NOW 2 / SHOULD 2 / NICE 1)

### Riki
- Arki "수정 불가" 4개 직접 확인 — 모두 정확, 뒤집을 항목 없음
- R-1 (seed-signature-metrics.ts 재실행 리스크): 재실행 시 metrics 키 누락 → metrics_registry.json 0건 → growth 대시보드 빈 화면. deprecated 주석 1줄로 완화 가능
- R-2·R-3: 실재 파손 경로 없음, 패스
- 최종 수정 대상 6개로 확정

---

## 수정 완료 (6개 파일)

| # | 파일 | 우선순위 | 변경 내용 |
|---|---|---|---|
| 1 | `memory/roles/personas/role-vera.md` | MUST_NOW | L8: `signatureMetrics` → `metrics(구 signatureMetrics, D-092)` |
| 2 | `memory/growth/phase_dod.json` | MUST_NOW | P1 outputs: `signatureMetrics 8역할` → `metrics 8역할 (구 signatureMetrics, D-092)` |
| 3 | `memory/growth/composite_inputs.json` | SHOULD | `_comment`: `signatureMetrics 배열에는 미포함` → `metrics 배열에는 미포함(surface 노출 X, 구 signatureMetrics)` |
| 4 | `memory/growth/rollback_playbook.md` | SHOULD | Step 2(a) 코멘트에 "signatureMetricsEnabled/signatureMetricsCardsVisible는 feature_flags.json 런타임 키 — app/growth.html 직접 참조 + test-p0b-smoke.ts assert 대상. rename 불가 (별도 토픽 필요)" 명시 |
| 5 | `memory/specs/page-checklist/growth.md` | NICE | signatureMetricsEnabled 항목에 "(feature_flags.json 런타임 키 — app/growth.html 직접 참조, rename 불가)" 보강 |
| 6 | `scripts/seed-signature-metrics.ts` | SHOULD | 파일 최상단 deprecated 주석 추가: `// DEPRECATED (D-092 이후): 재실행 금지. 재초기화 필요 시 memory/roles/{role}_memory.json의 metrics 키 직접 편집.` |

---

## 보존 (수정 없음)

- **역사 기록**: 세션 보고서·session_index·decision_ledger·topic 메타 — 41개 전량 보존
- **런타임 참조 4개** (이번 범위 외):
  - `app/growth.html` — signatureMetricsEnabled 직접 조회
  - `memory/shared/feature_flags.json` — signatureMetricsEnabled/signatureMetricsCardsVisible 런타임 키
  - `scripts/compile-metrics-registry.ts` L93-94 — dead-key migration warn 안전망
  - `scripts/test-p0b-smoke.ts` — signatureMetricsEnabled === true 직접 assert

---

## 미결 사항 / Gap

- **signatureMetricsEnabled 런타임 키 rename**: app/growth.html + feature_flags.json + test-p0b-smoke.ts 동시 변경 필요. 별도 토픽 필요 시 Master 판단.
- **current_session.json gaps 기존 항목 2건**: edi turn2 + zero turn3 reports 미발견 — 본 보고서 작성으로 edi gap 해소. zero_rev*.md는 미발견 상태 유지.
- **versionBumpSuggested 부재**: current_session.json에 versionBumpSuggested 필드 없음 → versionBump 확정 step 생략 (케이스 1 적용, "변경 없음 — bump 0" 처리는 아님 — hook이 세션 종료 시 파일 변경 감지 후 박제 예정).

---

## versionBump 확정

`current_session.json.versionBumpSuggested` 부재 — 세션 종료 시 `session-end-finalize.js`가 자동 감지 예정. 현재 시점 Edi 확정 생략 (D-131 케이스 1). 변경 파일 6건(모두 memory/ 또는 scripts/ 내 non-hook, non-policy 파일)이므로 자동 감지 시 capacity(+0.01) 예상.

---

## 인계 메모

- PD-065 수정 작업 완료. 이번 세션에서 수정된 6개 파일 외 런타임 키 rename은 별도 토픽 필요
- 차기 세션 시작점: signatureMetricsEnabled rename 별도 토픽 오픈 여부 Master 판단
- zero_rev*.md 미발견 gap은 이번 세션에서 해소되지 않음 — 차기 세션 확인 필요

---

## 세션 종결 readiness 평가

| 항목 | 상태 | 비고 |
|---|---|---|
| 빌드 통과 | 미확인 | 이번 수정은 md/json/ts 주석·설명만 — 기능 변경 없음 |
| 경보 없음 | 해당 없음 | 런타임 변경 0 |
| Master 미결 질문 | 없음 | 런타임 키 rename은 별도 토픽, 이번 범위 외 |

auto-close 기준 충족 판단: **충족** — 구현 검증(주석·설명 교정) 완료, 경보 없음, Master 미결 질문 없음.

---

[ROLE:edi]
# self-scores
gp_acc: 0.80
scc: Y
cs_cnt: 3
art_cmp: 0.67
gap_fc: 1
