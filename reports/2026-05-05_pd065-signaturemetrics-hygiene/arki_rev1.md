---
title: "PD-065 signatureMetrics 잔재 위생 — Arki 구조 분석"
role: arki
topicId: topic_168
date: 2026-05-05
turnId: 0
invocationMode: subagent
grade: B
---

# Arki — PD-065 signatureMetrics 잔재 위생 구조 분석

## 0. 전수 스캔 결과

ripgrep 전수 스캔: **50개 파일**, **총 등장 횟수 약 130+건** (reports 디렉터리 70건 포함)

---

## 1. 파일 유형별 분류 및 수정 판단

### 카테고리 A — 런타임 참조 (수정 불가 / 별도 검토 필요)

| 파일 경로 | 유형 | 등장 횟수 | 수정 여부 | 근거 |
|---|---|---|---|---|
| `app/growth.html` | 런타임 UI 코드 | 1 | **수정 불가** | `flags?.flags?.signatureMetricsEnabled` — feature_flags.json 키를 직접 조회하는 런타임 분기. 키 이름 변경 시 feature flag 체크 깨짐 |
| `memory/shared/feature_flags.json` | 런타임 설정 JSON | 2 | **수정 불가** | `signatureMetricsEnabled`, `signatureMetricsCardsVisible` — app/growth.html이 이 키를 직접 읽음. 키 변경 시 UI 파탄 |
| `scripts/compile-metrics-registry.ts` | 런타임 스크립트 | 4 | **수정 불가 (주석만 해당 없음)** | L93-94: `mem.signatureMetrics` 참조 — dead-key migration warn 로직. 이 코드는 역할 메모리에 `signatureMetrics`가 남아있을 경우 경고를 발행하는 안전망. 제거 시 마이그레이션 감지 불가. L3/L88/L115는 주석 — 수정 가능(하단 카테고리 C 참조) |
| `scripts/test-p0b-smoke.ts` | 테스트 스크립트 | 1 | **수정 불가** | `ff.flags.signatureMetricsEnabled === true` — feature_flags.json 키 존재를 직접 assert. 키 변경 시 테스트 깨짐 |
| `scripts/seed-signature-metrics.ts` | 레거시 bootstrap 스크립트 | 1 | **조건부 — 스크립트 용도 재검토 필요** | `mem.signatureMetrics = metrics` — 구 스키마를 직접 write. 이 스크립트 자체가 "한번 실행 후 폐기" 목적이므로 스크립트 전체를 deprecated 표시하거나 아카이브하는 별도 결정 필요 |

---

### 카테고리 B — 역사 기록 / 세션 보고서 (보존 필수)

과거 사실을 기록한 문서. 수정 시 역사 왜곡.

| 파일 경로 | 유형 | 등장 횟수 | 수정 여부 |
|---|---|---|---|
| `topics/topic_165/session_contributions/session_192_arki.md` | 세션 역할 발언 원문 | 다수 | **보존** |
| `topics/topic_165/session_contributions/session_192_arki_rev2.md` | 세션 역할 발언 원문 | 다수 | **보존** |
| `topics/topic_165/session_contributions/session_192_jobs.md` | 세션 역할 발언 원문 | 2 | **보존** |
| `topics/topic_165/session_contributions/session_192_riki.md` | 세션 역할 발언 원문 | 다수 | **보존** |
| `topics/topic_165/session_contributions/session_192_edi_report.md` | 세션 Edi 최종 보고서 | 다수 | **보존** |
| `topics/topic_164/session_contributions/session_191.md` | 세션 원문 | 다수 | **보존** |
| `topics/topic_164/session_contributions/session_191_edi_report.md` | 세션 Edi 최종 보고서 | 다수 | **보존** |
| `topics/topic_133/session_contributions/session_148_edi_report.md` | 세션 Edi 최종 보고서 | 다수 | **보존** |
| `memory/sessions/session_index.json` | 세션 인덱스 역사 기록 | 다수 | **보존** |
| `reports/2026-05-05_pd063-signature-metrics-sot-restore/` (전체 6파일) | 세션 보고서 | 총 27건 | **보존** |
| `reports/2026-05-05_pd062-selfscore-weight-sot/arki_rev1.md` | 세션 보고서 | 2 | **보존** |
| `reports/2026-05-05_self-score-table-format-unify/edi_rev1.md` | 세션 보고서 | 4 | **보존** |
| `reports/2026-04-28_pd033-agent-continuity-design/arki_rev2.md` | 세션 보고서 | 8 | **보존** |
| `reports/2026-04-30_pd053-10roles-3axes-master-review/edi_rev1.md` | 세션 보고서 | 2 | **보존** |
| `reports/2026-04-24_pd035-yaml-instruction-8roles/` (전체 5파일) | 세션 보고서 | 총 17건 | **보존** |
| `reports/2026-04-24_pd023-self-scores-mvp-impl/arki_rev1.md` | 세션 보고서 | 2 | **보존** |
| `reports/2026-04-23_pd023-self-scores-thin-impl/arki_rev1.md` | 세션 보고서 | 3 | **보존** |
| `reports/2026-04-23_pd023-dev-impl-p0a-p3/dev_rev1.md` | 세션 보고서 | 2 | **보존** |
| `reports/2026-05-03_self-eval-activation-analysis/arki_rev1.md` | 세션 보고서 | 1 | **보존** |
| `memory/shared/decision_ledger.json` | 결정 원장 (역사 박제) | 2 | **보존** | 
| `topics/topic_165/agenda.md` | 토픽 어젠다 (역사 기록) | 1 | **보존** |
| `topics/topic_165/topic_meta.json` | 토픽 메타 (역사 기록) | 1 | **보존** |
| `topics/topic_164/` 관련 | 토픽 역사 기록 | - | **보존** |

> **보존 이유**: `decision_ledger.json`의 경우 "17 파일 signatureMetrics historical 문자열 미정리"라는 문장 자체가 PD-064 박제 내용 — 이를 수정하면 PD-064 기원 기록이 지워짐.

---

### 카테고리 C — 정책/가이드라인 문서 (수정 대상)

현행 정책을 기술하는 문서로, 구 명칭이 오해를 유발할 수 있는 위치.

| 파일 경로 | 유형 | 등장 횟수 | 수정 여부 | 변경 내용 |
|---|---|---|---|---|
| `memory/roles/personas/role-vera.md` | 역할 정책 문서 | 1 | **수정 대상** | L8: `signatureMetrics는 모두 vera 사용` → `self-score YAML reports frontmatter는 모두 vera 사용` (signatureMetrics 제거 또는 `metrics(구 signatureMetrics)`로 대체) |
| `memory/specs/page-checklist/growth.md` | 페이지 체크리스트 (운영 spec) | 1 | **수정 대상** | L60: `signatureMetricsEnabled` flag 설명 — 이 키는 실제로 존재하는 런타임 키이므로 키 이름 자체는 유지, 단 설명 텍스트에 "(feature_flags.json key — 런타임 분기용)" 주석 보강 권장 |
| `memory/growth/composite_inputs.json` | 성장 데이터 설정 | 1 | **수정 대상 (낮음)** | `_comment` 필드: `signatureMetrics 배열에는 미포함` → `metrics 배열에는 미포함 (구 signatureMetrics)` — _comment만이므로 런타임 영향 0 |
| `memory/growth/rollback_playbook.md` | 운영 롤백 플레이북 | 1 | **수정 대상** | L44: `"signatureMetricsEnabled": false` — 이건 실제 feature_flags.json 키를 예시로 보여주는 것이므로 **키 이름 유지** (런타임 연동 키). 단 코멘트에 "feature_flags.json 런타임 키" 명시 |
| `memory/growth/phase_dod.json` | 성장 Phase DoD | 1 | **수정 대상** | L34: `memory/roles/{role}_memory.json signatureMetrics 8역할` → `memory/roles/{role}_memory.json metrics 8역할 (구 signatureMetrics, D-092 이후 metrics로 통일)` |
| `scripts/compile-metrics-registry.ts` | 스크립트 주석 (코드 아님) | 주석 3건 | **부분 수정 가능** | L3, L88, L115의 주석 내 `signatureMetrics` 설명은 역사 맥락 보존 필요 — `(이전 signatureMetrics)` 표기 방식 유지 권장. L92-94의 런타임 warn 로직은 **수정 불가** |

---

### 카테고리 D — 현재 세션 메타 (수정 불필요)

| 파일 경로 | 유형 | 수정 여부 |
|---|---|---|
| `memory/sessions/current_session.json` | 현재 세션 상태 | 세션 종료 후 자동 정리됨 |
| `memory/shared/topic_index.json` | 토픽 인덱스 — PD-065 제목 필드 | 보존 (PD-065 토픽 제목이 signatureMetrics 포함) |
| `topics/topic_168/topic_meta.json` | 현재 토픽 메타 | 보존 |
| `topics/topic_168/context_brief.md` | 현재 토픽 컨텍스트 | 보존 |
| `topics/topic_168/agenda.md` | 현재 토픽 어젠다 | 보존 |
| `memory/shared/system_state.json` | 시스템 상태 (PD-065 item 기록) | 보존 |

---

## 2. 수정 대상 요약 (실제 작업 대상)

**수정 가능 파일: 5개** (전체 50개 중 10%)

| # | 파일 | 변경 규모 | 우선순위 |
|---|---|---|---|
| 1 | `memory/roles/personas/role-vera.md` | 1줄 텍스트 수정 | MUST_NOW |
| 2 | `memory/growth/phase_dod.json` | 1줄 텍스트 수정 | MUST_NOW |
| 3 | `memory/growth/composite_inputs.json` | `_comment` 1줄 수정 | SHOULD |
| 4 | `memory/growth/rollback_playbook.md` | 코멘트 보강 1줄 | SHOULD |
| 5 | `memory/specs/page-checklist/growth.md` | 설명 텍스트 보강 1줄 | NICE |

**보존 파일: 41개** (세션 보고서 21개 + 역사 기록 20개)  
**수정 불가 파일: 4개** (런타임 참조 — `app/growth.html`, `feature_flags.json`, `compile-metrics-registry.ts` L93-94, `test-p0b-smoke.ts`)  
**별도 결정 필요: 1개** (`scripts/seed-signature-metrics.ts` — 스크립트 아카이브 여부)

---

## 3. 구조적 리스크 및 의존성

### R-1 (주의): feature_flags.json 키 동결
`signatureMetricsEnabled` / `signatureMetricsCardsVisible` 두 키는 app/growth.html과 test-p0b-smoke.ts가 하드 참조. **이 키 이름은 이번 위생 작업 범위 외**. 명칭 변경 원한다면 별도 토픽 필요 (app 코드 + 테스트 + flag 동시 변경).

### R-2 (낮음): compile-metrics-registry.ts L92-94 dead-key warn
역할 메모리에 `signatureMetrics` 키가 남아있을 경우 경고를 발행하는 안전망 코드. 이 코드를 제거하면 마이그레이션 누락 감지 불가. 현재 모든 역할 메모리는 `metrics` 키를 사용 중이므로 warn은 실행되지 않으나, 향후 실수 방어용으로 유지 권장.

### R-3 (낮음): seed-signature-metrics.ts 용도 불명확
이 스크립트는 구 스키마(`signatureMetrics`)를 write하는 one-time bootstrap 목적. D-092 이후 실질적으로 deprecated이나 명시적 폐기 선언이 없음. 이번 작업에서 파일 헤더에 `// DEPRECATED: D-092 이후 사용 금지. metrics 키 사용.` 주석 추가 권장.

### 경계 조건
- `feature_flags.json` 키를 rename하면 growth.html feature flag 체크 + smoke test 동시 깨짐 → 이번 위생 범위 아님
- session 보고서/decision_ledger 수정 시 역사 기록 왜곡 → 절대 보존

---

## 4. 자기감사 (1차)

### 1차 감사 — 발견 0개 / 각 축 3지점 검사

**structuration**
- 런타임 참조 vs 역사 기록 vs 정책 문서 3분류 명확히 구분됨 ✓
- 수정/보존/불가 3층 판단 기준 일관됨 ✓
- feature_flags.json 키 의존 체인 (flags → app.html → test) 완전히 추적됨 ✓

**hardcoding**
- 분류 판단 기준이 파일 경로 패턴이 아닌 "런타임 참조 여부" 기준 — 재현 가능 ✓
- 예외(seed-signature-metrics.ts)는 별도 결정 대상으로 명시 ✓
- feature_flags 키 이름 동결 이유 코드 레벨까지 추적됨 ✓

**efficiency**
- 50개 파일 중 실제 수정 대상 5개 (10%) — 과잉 수정 없음 ✓
- 역사 기록 보존 판단이 일관된 규칙 적용됨 ✓
- 별도 토픽 필요 항목 1건 명시 분리됨 ✓

**extensibility**
- 향후 feature_flags 키 rename 필요 시 별도 토픽 트리거 조건 명시됨 ✓
- 카테고리 분류 체계(A/B/C/D)는 다음 위생 작업에 재사용 가능 ✓
- seed-signature-metrics.ts deprecated 처리 옵션 명시됨 ✓

→ No issue at this dimension (4축 모두 구조 건전)

---

[ROLE:arki]
# self-scores
str_fd: 2
aud_rcl: 0.80
spc_lck: N
sa_rnd: 1
