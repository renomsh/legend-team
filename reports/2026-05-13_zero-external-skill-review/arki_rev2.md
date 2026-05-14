---
role: arki
turnId: 3
phase: post-framing
sessionId: session_246
topicId: topic_206
date: 2026-05-13
invocationMode: subagent
---

# Arki rev2 — Zero 3영역 × 3모드 9 매트릭스 + 실측 1건 설계

Arki입니다. Jobs framing(9 매트릭스 본질화)과 Master 추가 결정(실측 1건 포함)을 반영하여, 가설 매트릭스 + 실측 케이스 후보를 함께 제출합니다.

## 0. 용어 정의 (모드)

| 모드 | 정의 | 호출 경로 |
|---|---|---|
| **M1 흡수** | Zero 내부 Cut/Refine/Audit 도구만 사용. 외부 skill 미호출 | 현행 D-127 결정 상태 |
| **M2 Zero 재량** | Zero가 영역·케이스 판단으로 외부 skill(`engineering:tech-debt`/`simplify`/`engineering:code-review`) 선택적 호출 | dispatch_config rules.zero.internal_tools 외 허용 추가 |
| **M3 Hook 자동** | Zero dispatch 시 hook이 외부 skill을 자동 병발 + 결과 병합 | pre/post-tool-use-task hook 신설 필요 |

추정 근거는 외부 skill **description 문구**와 Zero spec 두 SOT뿐입니다. description은 D2(거짓 전제) 적용 — 실 동작과 다를 수 있음을 명시 [T1/A1/O1].

---

## Part 1. 9 매트릭스 가설

### 표기

- 품질: 1(매우낮음) ~ 5(매우높음). 척도는 *추정* — 실측 1건으로 1칸만 검증.
- legend-team 컨텍스트 적응도: high / mid / low
- D2 신뢰 경계 노출: 자체통제 / 부분노출 / 전면노출
- 운영 부담: low / mid / high

### tech-debt 영역

| 모드 | 품질 추정 | 컨텍스트 적응도 | D2 노출 | 운영 부담 | 사유 |
|---|---|---|---|---|---|
| M1 흡수 | **3** | high | 자체통제 | low | legend-team 폐기 흔적(NCL·D-110 등) 인지 가능. 다만 *일반화된* tech-debt 패턴 풀(stale TODO 식별 등)이 좁을 가능성. [T1/A1/O1] |
| M2 Zero 재량 | **3.5** | high→mid | 부분노출 | mid | 영역별 선택 호출. Zero가 메타-자산 self-exclusion 사전 필터 수행 후 외부 skill 위임 가능. 단 Zero 자기평가 편향(B5) 위험. [T1/A1/O1] |
| M3 Hook 자동 | **3** | mid | 전면노출 | high | 외부 skill 일괄 호출 → legend-team 메타-자산(decision_ledger·violation_log)도 외부 분석 대상에 포함될 위험. self-exclusion enforce hook 추가 필요. [T2/A1/O1] |

**잠정 우위 (tech-debt)**: M2 ≥ M1 > M3. 단 격차 작음, B3(availability) 자기검열 — 실측 없이는 동률 가능.

### security-review 영역

| 모드 | 품질 추정 | 컨텍스트 적응도 | D2 노출 | 운영 부담 | 사유 |
|---|---|---|---|---|---|
| M1 흡수 | **2.5** | high | 자체통제 | low | Audit 도구가 "하드코딩 secrets·credentials·절대 경로" 카운트 한정. 정적 시그니처 협소. injection·N+1·SSRF 등 패턴 약함. [T2/A1/O3] (role-zero.md L17·47) |
| M2 Zero 재량 | **4** | high | 부분노출 | mid | `engineering:code-review` description상 "N+1 query·injection risks·error handling gaps" 명시 — Zero Audit과 거의 비중첩. 보완 우위 가설 가장 강함. Riki R-3 적출과 정합. [T2/A1/O3] |
| M3 Hook 자동 | **3.5** | mid | 전면노출 | high | 자동 병발 시 false positive 폭발 위험 (외부 skill이 legend-team test 코드·의도적 더미 secret를 secret로 오탐할 가능성). [T1/A1/O1] |

**잠정 우위 (security-review)**: **M2 > M3 > M1**. 본 영역이 모드 전환의 가장 강한 근거.

### simplify 영역

| 모드 | 품질 추정 | 컨텍스트 적응도 | D2 노출 | 운영 부담 | 사유 |
|---|---|---|---|---|---|
| M1 흡수 | **3.5** | high | 자체통제 | low | "3줄 패턴 함수화 vs 인라인" 판단은 코드베이스 컨벤션·재사용 빈도 컨텍스트 의존도 높음 — 내재화 우위. [T2/A1/O3] |
| M2 Zero 재량 | **3** | high→mid | 부분노출 | mid | 외부 skill `simplify` description 미상세. 범용 refactor 패턴(naming·extract method)은 중첩 — 추가 가치 한정 가설. [T1/A1/O1] |
| M3 Hook 자동 | **2.5** | low | 전면노출 | high | 일관성 강제로 legend-team 의도적 비대칭(예: 페르소나별 spec 구조 차이) 과잉 정규화 위험. [T1/A1/O1] |

**잠정 우위 (simplify)**: M1 ≥ M2 > M3. M1 유지가 안전.

---

## Part 2. 영역×모드 잠정 우위 가설 (정리)

| 영역 | 잠정 최적 | 사유 1줄 | 확신도 |
|---|---|---|---|
| **tech-debt** | M1 또는 M2 (동률 가설) | 컨텍스트 적응도 우위 vs 패턴 풀 확장의 trade-off, 격차 작음 | 낮음 [T1] |
| **security-review** | **M2 (선택적 외부 보완)** | Audit의 시그니처 협소함 + `engineering:code-review` 패턴 비중첩 | 중간 [T2] |
| **simplify** | M1 유지 | 코드베이스 컨벤션·자기 spec 구조 의존성 | 중간 [T2] |

**현 시점 권고 매핑**: `{tech-debt: M1 (잠정), security-review: M2 (보완 도입 후보), simplify: M1}` [T2/A1/O3]

**B3 자기검열 적용**: 위 매핑은 M1을 2/3 영역에서 유지하는 결론으로 *status quo 편향 잔재* 가능성. security-review만 M2 후보로 분리한 것이 최소한의 zero-base 평가 결과. 실측 없이 더 강한 단언 금지.

---

## Part 3. 실측 케이스 후보

### 공통 제약 (self-exclusion + 메타 자산 회피)

**제외 대상** (D-146): `memory/shared/decision_ledger.json`, `pending_deferrals.json`, `violation_*`, `audit_*`, self-scores log, current_session.json, dispatch_config.json 메타 영역.
**제외 대상** (실행 위험): `auto-push.js`의 git push 부분, hook 실행 부분, build.js 파괴적 경로.

### 후보 1 — **scripts/lib/topic-status.ts (100줄, tech-debt 영역)** ⭐ 추천

| 항목 | 내용 |
|---|---|
| **input** | `scripts/lib/topic-status.ts` 전체 (100줄, read-only 분석) |
| **영역** | tech-debt |
| **M1 경로** | Zero Cut 도구로 적용: stale import·dead code·미사용 export·중복 정의 카운트 + legend-team 컨텍스트(D-F 토픽 상태 SOT 정책)와 정합성 체크 |
| **M2 경로** | Zero가 외부 `engineering:tech-debt` skill 호출. description상 "tech debt audit, categorize, prioritize". Zero가 결과를 받아 legend-team 메타-자산 self-exclusion 필터 적용 후 정제 |
| **M3 경로** | Hook이 dispatch 시 외부 skill 강제 병발. 결과 자동 병합. self-exclusion enforce 추가 hook 필요 |
| **비교 메트릭** | ① 적출 건수 ② 적출 정확도 (legend-team 컨텍스트 적합 / 부적합 분류) ③ false positive 수 ④ 회피 적출 건수 (메타-자산 self-exclusion 위반 발생 여부) ⑤ 출력 토큰 수 |
| **세션내 실행 가능성** | **가능** — read-only 분석. 100줄 규모로 토큰 부담 낮음. self-exclusion 위반 위험 낮음(scripts/lib는 도구 코드, 메타 자산 아님) |
| **추천 우선순위** | **1순위** |

**왜 1순위인가**: ① 규모 작음(100줄) → 세션 내 M1·M2 둘 다 실행 가능 ② tech-debt 영역(매트릭스 가장 불확실 — M1/M2 동률 가설 검증) ③ self-exclusion 위반 위험 낮음 ④ topic-status.ts는 D-F·D-104-s130 박제 SOT 갱신 헬퍼로 legend-team 컨텍스트 적응도 비교에 좋은 표본.

### 후보 2 — **memory/shared/dispatch_config.json (152줄, security-review 영역)**

| 항목 | 내용 |
|---|---|
| **input** | `memory/shared/dispatch_config.json` 전체 (read-only) |
| **영역** | security-review (하드코딩 경로·credential 카운트) |
| **M1 경로** | Zero Audit: 하드코딩 경로(`memory/sessions`·`pending_turns_*` 패턴) 카운트 + 적정성 평가 |
| **M2 경로** | Zero가 `engineering:code-review` 호출. description상 보안 패턴 매칭 |
| **M3 경로** | (skip — 적용 어려움, hook 미설계) |
| **비교 메트릭** | 적출 secret/path 카운트, false positive (path_policy 필드는 의도적 SOT — 오탐 가능) |
| **세션내 실행 가능성** | **부분 제약** — dispatch_config는 *메타 자산 경계* 위. self-exclusion D-146 자율 판단 의무 발동. Zero가 직접 분석 회피 의무 발동 가능 → 본 후보 자체가 self-exclusion 테스트 케이스로도 작동 |
| **추천 우선순위** | 3순위 (B5 위험 + self-exclusion 충돌 가능) |

### 후보 3 — **scripts/lib/turn-types.ts (130줄, simplify 영역)**

| 항목 | 내용 |
|---|---|
| **input** | `scripts/lib/turn-types.ts` 전체 (read-only) |
| **영역** | simplify |
| **M1 경로** | Zero Refine: 타입 정의 중복·과잉 추상화·인라인 가능 패턴 적출 |
| **M2 경로** | Zero가 `simplify` skill 호출 |
| **M3 경로** | Hook 자동 병발 |
| **비교 메트릭** | refactor 제안 건수, legend-team turn-push 컨텍스트(D-048) 인지 여부, 정제 후 줄 수 감소·증가 |
| **세션내 실행 가능성** | 가능 — read-only |
| **추천 우선순위** | 2순위 |

---

## 추천 1건: **후보 1 (topic-status.ts × tech-debt)**

**사유 3가지**:
1. **매트릭스 가장 불확실한 영역 검증** — tech-debt M1/M2 동률 가설. 실측 1건이 매트릭스 9칸 중 결정력 가장 큰 칸 변경 가능.
2. **self-exclusion 위반 위험 최저** — `scripts/lib`는 도구 코드, 메타 자산 아님. B5 자기평가 편향 회피 가능.
3. **규모·범위 적정** — 100줄로 M1·M2 둘 다 세션 내 실행 가능. M3는 hook 설계 부재로 본 실측에서 제외 — 후속 PD로 분리.

**실측 한계** (정직 박제):
- M3 (Hook 자동)은 hook 미구현 → 본 실측에서 검증 불가. tech-debt 영역 M1 vs M2 비교까지만.
- 외부 skill 실제 동작은 description만 보고 추정 — D2(거짓 전제) 잔존. 실측 결과도 *외부 skill 한 번의 응답*에 의존.
- 단일 케이스 → 9 매트릭스 전체 일반화 불가. **결정력은 1칸 보강**으로 한정.

**Mitigation**: 본 실측 결과는 (1) tech-debt M1 vs M2 비교 (2) 외부 skill 응답 품질의 1차 직접 관찰 (3) self-exclusion 회피 작동 검증 — 3가지에 한정 사용. 9 매트릭스 전체 결정은 K1(메트릭 가설) baseline 누적 후 별도 결정.

**Fallback**: 후보 1 실행 중 토큰 부담 발생 시 후보 3(turn-types.ts)으로 축소. 외부 skill 호출 실패 시 M1만 단독 기록하고 "외부 skill 호출 실패 = D2 행위 검증 실패" 사실 박제.

---

## Part 4. 다음 주자 권고

| # | 역할 | 임무 |
|---|---|---|
| 1 | **Riki** | (a) 9 매트릭스 추정치 적대 감사 — 특히 security-review M2 추정 4점이 description 의존(D2) 위험 (b) 후보 1 추천 사유 적출 — "tech-debt 불확실성 검증"이 진짜 결정력인가, 아니면 단지 안전한 자기검열인가 (c) 후보 1 실측 결과 해석 가이드: 어떤 결과가 매핑을 뒤집고, 어떤 결과가 단순 noise인지 사전 정의 |
| 2 | **Master 결정** | 후보 1·2·3 중 채택 + 세션 내 실측 진행 여부 |
| 3 | **(Master 승인 시) Zero 호출** | M1 (Cut/Audit) 직접 실행 + M2 외부 `engineering:tech-debt` skill 호출. 결과 병기 기록 |
| 4 | **Ace 종합검토** (`/ace-synthesis` 명시 호출 시) | 실측 1건 + 9 매트릭스 가설 결합 → 영역별 모드 매핑 권고 |
| 5 | **Edi** | D-127 명분 정정 + 결정 박제 (D-NNN 또는 D-127 amendment) |

**executionPlanMode 갱신 권고**: Jobs `conditional` 유지. 실측 후 Ace 종합검토 시점에 plan 모드 분기.

---

## 자기감사 (1차)

| 축 | 발견 | ROI |
|---|---|---|
| structuration | 매트릭스 표가 영역×모드 2축으로 분리, 추가 축(예: 호출 빈도) 미반영. 본 토픽 범위상 의도적 OUT(Jobs scope) — 결함 아님 | DEFER |
| hardcoding | 후보 1·2·3 경로는 실측 진행 전 변경 없음 — 하드코딩 발생 0 | No issue |
| efficiency | 9 매트릭스 9칸 모두 동일 깊이 분석은 과잉 — security-review·tech-debt에 집중, simplify는 얕게. 의도적 비대칭 | NICE |
| extensibility | M3(Hook 자동)는 본 실측에서 제외 → 후속 PD로 분리. 확장 경로 보존 | No issue |

**자기감사 2차 — 축 전환** (Master 압박 가정한 자율 수행):
- B3 잔재: tech-debt 영역에서 M1/M2 "동률 가설" 단언이 status quo 안전망. Riki가 적출하면 수용.
- 9 매트릭스 전 칸 추정 근거가 **외부 skill description 문구** 또는 **Zero spec 문구** — T1~T2 범위 단언만, T3+ 단언 없음. D2 정합. 추가 단언 강화 자제.

종료 기준 충족 (발견 0 critical + 모두 NICE/DEFER).

---

## Self-Score

```
[ROLE:arki]
# self-scores
aud_rcl: 0.50
str_fd: 0
spc_lck: N
sa_rnd: 2
```

ARKI_WRITE_DONE: reports/2026-05-13_zero-external-skill-review/arki_rev2.md
