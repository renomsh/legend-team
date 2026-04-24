---
turnId: 3
invocationMode: subagent
phase: plan
rev: 2
recallReason: post-master
splitReason: scope expansion
---

# Arki v2 — PD-035 스코프 확장 실행계획

Arki입니다. Ace rev1 재프레이밍(A. core 신규 / B. Vera canonical / C. 7파일 구조 통일)을 반영해 v1 실행계획을 v2로 재작성합니다. v1의 §1 실측과 §2 템플릿 설계는 그대로 유효하며, 본 문서는 그 위에 P1.5와 구조 통일 작업을 덧쓰고 R-2/R-3/R-4 해소 경로를 박아 넣습니다.

## 1. core 지표 신규 설계 (5건)

각 역할 1건씩, canonical `Metric` 타입(PD-023 §2.2)에 정합. 필드는 모두 필수 키 포함. `lifecycleState=candidate`로 등록하고 `baselineSessions=10` 경과 후 active 승격(PD-023 정책 준수).

### 1-A. 엔트리 표

| 역할 | id | shortKey | axis | scale | polarity | construct (한국어 1줄) | externalAnchor |
|---|---|---|---|---|---|---|---|
| **fin** | `fin.forbidden_word_rate` | `fbd_rt` | quality | ratio | lower-better | Fin 감사 대상 Arki 실행계획에서 금지어(절대시간·담당자·공수단위) 검출 건수 / 총 감사 문단 수 | `scripts/lib/forbidden-word-audit.ts` 실행 결과, Arki plan 문단 수, git grep으로 키워드 매칭 카운트 |
| **nova** | `nova.invoked_promotion_rate` | `inv_prm` | judgment-consistency | ratio | higher-better | Nova 호출된 세션 중 제안이 D-xxx로 승격된 세션 비율 (침묵 세션은 분모에서 제외 — `invoked-sessions-only`) | `decision_ledger.json` 내 source='Nova' 필드, nova_memory.topicsInvoked 카운트 |
| **dev** | `dev.runtime_verification_coverage` | `rt_cov` | execution-transfer | ratio | higher-better | 구현 세션에서 tsc + 런타임 실행 + CLI 스모크 + 경계값·실패경로 4축 중 통과 개수 / 4 (DEV-LL-006 4축 근거) | git log post-gate fix commit 부재 + `logs/app.log` 런타임 실행 기록 + dev `sessionLearnings.findings` 자가보고 |
| **editor** | `editor.gap_pinning_accuracy` | `gp_acc` | quality | ratio | higher-better | Edi가 세션 종료 시 박제한 gaps 건수 중 차기 세션 초반 3세션 내 Master·Arki가 "놓침"으로 재지적하지 않은 비율 | `current_session.json.gaps` 엔트리 vs 후속 세션 master_feedback_log `statusNote` + Arki re-audit 발견 건 대조 |
| **vera** | `vera.token_drift_zero` | `tk_drf0` | quality | Y/N | higher-better | Vera 호출 세션의 산출물이 `role-colors.js` · `design_rules.json` canonical 토큰과 0 drift (R-D01·R-D02 위반 0건) | `dist/` 빌드 CSS diff + design_rules.json key 일치 + Master 재작업 요청 부재 |

### 1-B. 공통 필드 (5건 모두 동일)

- `role`: 각 엔트리 `role` 필드에 소문자 역할명
- `scope`: `"role"`
- `type`: `"base"` (derived 금지 — v1.0 registry에 신규 base 지표로 먼저 등록, composite는 PD-025+ 고려)
- `rater`: `{ "type": "self", "by": "<role>" }`
- `raterWeights`: `{ "<role>": 1 }`
- `timing`: fin/dev/editor는 `"immediate"`, nova/vera는 `"deferred"`(호출 세션 편차 큼)
- `aggregation`: nova/vera는 `"invoked-sessions-only"`, fin/dev/editor는 `"all-sessions"`
- `baselineSessions`: 10
- `lifecycleState`: `"candidate"` (v1에서 active 전환은 baseline 경과 후 별도 세션)
- `inputPriority`: `"core"` ← **핵심**
- `defaultStrategy`: `"previous-session-value"`
- `missingPenalty`: `"warn"`
- `applicableTopicTypes`: 모두 `["framing","implementation","standalone"]`
- `participationExpectedTopicTypes`: fin `["framing","standalone"]`, dev `["implementation","standalone"]`, editor `["framing","implementation","standalone"]`, nova/vera `[]`
- `validityCheck`: fin/dev/editor `"monthly"`, nova/vera `"quarterly"` (표본 희소성)

### 1-C. 근거 (externalAnchor cross-check 필수 준수)

D-059(외부 앵커 cross-check 의무) 준수. 각 지표마다 앵커 ≥1건 필수인데, 설계 상 모두 2개 이상 앵커 확보(표 참조). 재현=타당성 착각 방지를 위해 **자가 증거** + **외부 파일 증거** 조합으로 설계했습니다.

- `fin.fbd_rt`: Fin 자가보고 + 스크립트 실측 + git grep — 자가평가 편향 상쇄
- `nova.inv_prm`: Master 승인이 D-ledger에 박혔는지 외부 증거
- `dev.rt_cov`: DEV-LL-006의 4축이 이미 레슨런으로 누적 — 자가 feedback과 정합
- `editor.gp_acc`: 후속 세션 실측이 anchor — 자가평가 완전 배제
- `vera.tk_drf0`: dist/ 빌드 diff가 기계적 증거

### 1-D. Patch 대상 파일 (P1.5 산출물)

```
memory/roles/fin_memory.json        → signatureMetrics[] 앞쪽에 core 엔트리 삽입
memory/roles/nova_memory.json       → 동일
memory/roles/dev_memory.json        → 동일
memory/roles/editor_memory.json     → 동일
memory/roles/vera_memory.json       → 동일
```

각 파일 기존 엔트리는 건드리지 않음 (extended 유지). `lastUpdated` 필드만 갱신.

---

## 2. Phase 재분해

### 2-A. Phase 표

| Phase | 산출물 | 전제조건 | 구조적 DoD | 롤백 단위 |
|---|---|---|---|---|
| **P0 (실측·동결)** | v1 §1 매트릭스 동결 + 5역할 core-0 상태 기록 + PD-023 registry v1.0 sourceHash 스냅샷 | 없음 | shortKey 해시 + line 번호 박제 | N/A (읽기 전용) |
| **P1 (템플릿 설계 동결)** | v1 §2-B 공통 템플릿 + §2-C 리스트 포맷 + §2-D core-0 fallback 규칙 + **2-E 구조 섹션 이식 템플릿 신설** | P0 완료 | Dev 인계 locked-for-dev 표시 | 문서 diff revert |
| **P1.5 (core 지표 신규 등록)** | 5역할 memory JSON patch (§1-D) + metrics-registry compile 재실행 | P0 스냅샷 + Ace 종합검토에서 §1 표 승인 | 5건 core 엔트리 존재 + registry compile sourceHash 재계산 + E-009 0건 | 파일 단위 `git checkout HEAD -- memory/roles/{role}_memory.json` |
| **P2 (7파일 YAML + 구조 통일)** | (a) 7 persona 파일에 Self-Score YAML 계약 섹션 삽입 (b) dev/editor/nova 3파일에 `## Write 계약 (필수)` + `### Frontmatter link 의무` 섹션 이식 | P1 템플릿 동결 + P1.5 core 엔트리 registry 반영 | 7파일 섹션 diff 통과 + 구조 섹션 3파일 추가 확인 | 파일 단위 revert |
| **P3 (vera 신규 + canonical 선언)** | `role-vera.md` 신규 생성 (4형제 구조 미러링) + 최상단에 **B canonical 선언 박제 블록** 포함 + `designer_memory.json`에 cross-ref 주석 | P1 템플릿 + P1.5 vera core 엔트리 | 파일 생성 + canonical 블록 존재 + designer cross-ref 통과 | `git rm role-vera.md` + designer patch revert |
| **P4 (검증 G0~G4)** | grep · YAML parse · registry cross-check · finalize dry-run · canonical 선언 확인 | P2 AND P3 완료 | 5 게이트 green | 실패 파일만 revert, 전면 revert는 최종수단 |
| **P5 (박제)** | D-xxx 결정 박제 + revision_history 업데이트 + **PD-023 P1 registry compile 침범 노트 명기** + PD-036~039 상태 재점검 | P4 통과 | decision_ledger append + topic_index 업데이트 + PD-023 resolveCondition 영향 분석 기록 | 결정 supersededBy 필드로 후속 보정 |

### 2-B. 의존 그래프

```
P0 ──> P1 ──┬──> P1.5 ──┬──> P2 ──┐
            │           │         │
            │           └──> P3 ──┤
            │                     │
            └─────────────────────┤  (P1 완료만으로도 P2/P3 진입 가능하나
                                  │   구조적 정합을 위해 P1.5 통과 후 권고)
                                  ▼
                               P4 (G0~G4)
                                  │
                                  ▼
                               P5 (박제)
```

- **P1.5는 P1 완료 후 병렬 가능하나, P2의 YAML 섹션이 core shortKey를 참조하므로 P2 시작 전 P1.5 수렴 권고.** 병렬 실행 시 P2에서 core shortKey placeholder를 두고 P1.5 수렴 후 치환하는 2단 전략 허용.
- P2와 P3는 P1.5 완료 후 완전 병렬.
- P4는 P2 AND P3 모두 완료 필수 (교집합 게이트).

### 2-C. 각 Phase 검증 포인트

- **P0**: `rg "signatureMetrics" memory/roles/*_memory.json -c` 결과 8건 + sourceHash 스냅샷.
- **P1**: 템플릿 `.md` draft가 ace/arki/fin/riki/nova/dev/editor/vera 8케이스 치환부 예시를 모두 포함.
- **P1.5**: `ts-node scripts/compile-metrics-registry.ts` 재실행 시 E-009 0건 + 신규 5건 core lifecycleState=candidate 확인.
- **P2**: `rg "## Self-Score YAML 출력 계약" memory/roles/personas/role-*.md | wc -l` = 8 AND `rg "## Write 계약 \(필수\)" memory/roles/personas/role-{dev,editor,nova}.md | wc -l` = 3.
- **P3**: `test -f memory/roles/personas/role-vera.md` + `rg "raterId.*canonical" memory/roles/personas/role-vera.md` ≥ 1 hit.
- **P4**: G0~G4 전수 (§3).
- **P5**: `decision_ledger.json` 신규 D-xxx 엔트리 + `topic_index.json` topic_100 status=closed + PD-023 entry의 relatedPDs에 PD-035 추가.

---

## 3. 검증 게이트 G0~G4

| Gate | 검증 대상 | 통과 기준 | 실패 시 조치 |
|---|---|---|---|
| **G0** | 파일 존재 + YAML 계약 섹션 포함 | `rg "## Self-Score YAML 출력 계약" memory/roles/personas/role-*.md` → 8 hit | 누락 파일 P2 재실행 |
| **G1** | YAML 블록 파싱 | 각 persona 파일 ` ```yaml ... ``` ` 블록 추출 → `# self-scores` 앵커 존재 + 최소 1개 `key: value` 샘플 | 템플릿 재설계 (P1 복귀) |
| **G2 (보강)** | (a) shortKey registry 정합 (b) **core 엔트리 5건 존재** (c) **구조 섹션 3파일 이식 완료** | (a) 템플릿 shortKey ⊆ registry shortKey 집합 (b) `jq '[.signatureMetrics[] \| select(.inputPriority=="core")] \| length'` → fin/nova/dev/editor/vera 각 ≥ 1 (c) `rg "## Write 계약 \(필수\)" role-{dev,editor,nova}.md` → 3 hit | (a) drift 발견 시 R-5 mitigation 진입 (b) 누락 엔트리 P1.5 재실행 (c) 누락 파일 P2 재실행 |
| **G3** | finalize dry-run | `FINALIZE_DRY_RUN=1 node .claude/hooks/session-end-finalize.js` → YAML 파싱 에러 0건 + defaultUsageCount 정상 증가 | P2 YAML 삽입 위치·포맷 재점검 (P1 복귀 후보) |
| **G4 (신설)** | (a) **Vera canonical 선언 박제 확인** (b) **PD-023 경계 침범 노트 기재 확인** | (a) `rg "raterId.*vera.*canonical\|canonical.*raterId" role-vera.md` ≥ 1 hit AND `rg "see vera_memory" designer_memory.json` ≥ 1 hit (b) `rg "PD-035.*registry compile\|PD-023.*침범" reports/2026-04-24_pd035-yaml-instruction-8roles/` ≥ 1 hit | (a) P3 재실행으로 블록 추가 (b) P5 박제 문서에 노트 append |

**G4 신설 이유**: R-3(raterId 모호성)과 R-5(PD-023 drift) 잔존 리스크가 문서 박제로만 차단 가능 — 게이트로 끌어올려 빠짐 방지.

---

## 4. 롤백 경로

### 4-A. 단위별 롤백

| 실패 지점 | 롤백 동작 | 영향 범위 |
|---|---|---|
| **P1.5 core 엔트리 patch 오류** | `git checkout HEAD -- memory/roles/{role}_memory.json` + `compile-metrics-registry.ts` 재실행 | 해당 역할 1건, 나머지 4건 유지 가능 |
| **P1.5 registry compile E-009** | 5건 전체 revert + P0 sourceHash 스냅샷으로 복원 | 5역할 core 등록 전면 롤백, P2/P3 중단 |
| **P2 YAML 삽입 실패 (단일 파일)** | 해당 파일만 `git checkout HEAD --` 후 재삽입 | 1파일 |
| **P2 구조 섹션 이식 실패** | 해당 파일 섹션만 Edit revert, YAML 섹션은 유지 가능 | 부분 revert |
| **P3 role-vera.md 생성 실패** | `git rm memory/roles/personas/role-vera.md` + designer_memory cross-ref revert | vera 파일 한 건 |
| **P4 G3 실패 (finalize 파싱)** | P2 전면 revert (8파일), P1 템플릿 재설계 진입 | 전 scope 복귀 |
| **P4 G4 실패 (canonical 누락)** | P3 재실행, P2는 유지 | vera 관련 block만 |
| **P5 박제 후 결함 발견** | D-xxx 결정에 `supersededBy` 후속 D 번호 기록, 파일 재편집 | 결정 이력 누적, 삭제 금지 |

### 4-B. 원칙

- **P1.5는 registry compile과 직결** → 실패 시 P2/P3 중단하고 먼저 복구.
- **P2 YAML 삽입과 구조 섹션 이식은 독립적으로 revert 가능** — 한쪽 실패가 다른쪽을 끌지 않음.
- **P5 박제 이후는 never delete** — D-번호 supersededBy 체인으로만 수정.

---

## 5. 리스크 재평가

### 5-A. R-1~R-5 해소 여부

| 리스크 | v1 상태 | v2 재평가 | 잔존 여부 |
|---|---|---|---|
| **R-1** YAML 앵커 충돌 | 🟡 | 변동 없음. 템플릿에서 ` ```yaml ` fenced block 강제. | 잔존 🟡, mitigation 동일 |
| **R-2** core 0건 5역할 | 🔴 | **§1 core 신규 5건 등록으로 해소**. 단, lifecycleState=candidate → baseline 10세션 경과 전 inflation 우려 (→ R-8 신규) | **주 리스크 해소**, 신규 R-8로 이전 |
| **R-3** Vera raterId 모호성 | 🟡 | **B canonical 선언 박제로 구조적 원인 제거**. 단, 집계 스크립트 정규화 로직은 PD-037 스코프 — 스크립트 수정 전까진 규약 차원 차단만. | 부분 해소 🟢→🟡, 집계 로직은 PD-037까지 잠복 |
| **R-4** 7파일 구조 이질성 | 🟡 | **C 구조 통일(dev/editor/nova에 Write 계약·Frontmatter 의무 이식)로 해소**. 단, Shared Asset Protocol과 신규 Write 계약 섹션의 역할 중첩(→ R-7 신규). | **주 리스크 해소**, 신규 R-7로 이전 |
| **R-5** PD-023 registry drift | 🔴 | **스코프 확장으로 증폭**. P1.5가 registry v1.0에 신규 엔트리를 직접 추가 → PD-023 P1의 compile 작업과 경계 침범 (→ R-6 신규). mitigation 강화 필수. | 잔존 🔴 + 증폭 |

### 5-B. R-5 강화 mitigation

- **P0에서 registry v1.0 sourceHash 스냅샷 의무화** — P1.5 추가 전후 diff 비교 가능.
- **P1.5 core 추가 시 `addedAt: session_095_pd035_scope_expand` 메타 필드 의무화** — PD-023 P1 compile 시점에 출처 추적 가능.
- **P5 박제 문서에 "PD-023 P1 registry compile이 본 토픽에서 추가된 5건 core 엔트리를 승인된 상태로 재compile해야 함"을 명시적 후속 조건으로 기재** — PD-023 P1 재실행 시 본 토픽 출력을 전제로 삼도록 강제.
- **Fallback**: PD-023 P1이 sourceHash 불일치로 실패할 경우, 5건 core 엔트리를 `memory/roles/{role}_memory.json`에서 일시 제거하고 PD-023 P1 완료 후 재삽입 (복구 가능 설계).

### 5-C. R-6~R-8 신규 리스크

#### R-6. 🔴 P1.5 core 지표 설계가 PD-023 P1 registry compile 블록과 경계 침범
- **취약점**: PD-023 §2.3 canonical spec은 `compile-metrics-registry.ts`가 `role_memory.signatureMetrics[]` → `memory/growth/metrics_registry.json` 생성의 유일 경로로 정의. P1.5가 signatureMetrics를 직접 수정 → PD-023이 아직 P1을 완료하지 않은 상태라면 이중 편집 충돌 + sourceHash 재계산 경쟁 조건.
- **Mitigation**: (1) P0에서 PD-023 P1 현재 상태 실측 — 미완료면 P1.5 보류 옵션 활성화. (2) P1.5 patch는 signatureMetrics 배열의 **기존 엔트리 뒤에 append** 만 허용, 기존 엔트리 수정 금지. (3) 5건 core 엔트리에 `_reserved.pd035_scope: true` 네임스페이스 마킹(E-022 extensions 규약 준수)으로 PD-023 P1 compile 시 출처 식별 가능.
- **Fallback**: PD-023 P1 미완료 확인 시 PD-035 스코프에서 A(core 신규)만 분리 → PD-035B로 별도 PD 오픈, 본 토픽은 C(구조 통일) + B(canonical) + YAML 계약만 박음. A는 PD-023 P1 완료 후 재진입.

#### R-7. 🟡 dev/editor/nova 기존 Shared Asset Protocol과 신규 Write 계약 섹션 역할 중첩
- **취약점**: v1 §1-A 실측에서 dev/editor/nova는 `Shared Asset Protocol` 섹션으로 `accessed_assets` 규정을 갖고 있음. 여기에 `## Write 계약 (필수)` + `### Frontmatter link 의무`를 추가하면 두 섹션이 "무엇을 Write하는가"에 대해 중복 규정. 충돌 시 어느 섹션이 우선인지 모호.
- **Mitigation**: P1 템플릿 설계 시 **"Write 계약 = 산출물 경로·Frontmatter 규정 / Shared Asset Protocol = 참조 데이터 Read·Write accessed_assets 규정"** 으로 책임 분리 명기. 템플릿 주석에 "본 섹션은 Shared Asset Protocol의 accessed_assets를 대체하지 않음"을 삽입.
- **Fallback**: 구조 통일 결과 혼동이 실제 발생하면 PD-040 신규 오픈 — dev/editor/nova 3파일의 Shared Asset Protocol을 Write 계약 섹션의 하위 subsection으로 재편집.

#### R-8. 🟡 core 지표 lifecycleState=candidate인데 즉시 채점 시작 → baseline 없이 운영 → inflation
- **취약점**: P1.5 직후 P2에서 YAML 템플릿이 core shortKey를 참조 → 세션 096부터 해당 shortKey로 채점 입력 시작. 10세션 baseline 경과 전 dashboard가 "평균" 표시하면 표본 3건짜리 평균이 게시돼 inflation 촉발.
- **Mitigation**: (1) `baselineSessions: 10` 규약 준수 — PD-023 §4.3 null 정책이 이미 "baseline 10세션 전 → CI/percentile null" 강제. (2) compute-dashboard가 n<baseline 구간을 "—" 또는 "warmup" 라벨로 표시. (3) 5건 core 모두 `validityCheck: monthly/quarterly` → 초기 1~2세션 내 validity 재평가 강제.
- **Fallback**: inflation 신호(평균 > 4.5 on 0-5 scale, 3세션 연속) 감지 시 lifecycleState를 `candidate` → `shadow`로 강등 + PD-025 안티-Goodhart 로직 조기 activate 검토.

### 5-D. 리스크 매트릭스 요약

| ID | 색 | 상태 | 주 mitigation | Fallback PD |
|---|---|---|---|---|
| R-1 | 🟡 | 유지 | fenced block 강제 | spec 변경 PD |
| R-2 | 🟢 | 해소 → R-8 이전 | core 신규 등록 | — |
| R-3 | 🟡 | 부분 해소 | canonical 선언 박제 | PD-037 |
| R-4 | 🟢 | 해소 → R-7 이전 | 구조 섹션 이식 | PD-040 |
| R-5 | 🔴 | 증폭 | sourceHash 스냅샷 + 출처 메타 | PD-023 P1 재compile |
| R-6 | 🔴 | 신규 | append-only + _reserved 네임스페이스 | PD-035B 분리 |
| R-7 | 🟡 | 신규 | 섹션 책임 분리 명기 | PD-040 |
| R-8 | 🟡 | 신규 | baseline·validity 규약 준수 | PD-025 조기 activate |

---

## 6. 중단 조건

v1 §3-E 유지 + 확장:

1. **P0 실측 단계**: PD-023 P1 registry compile 미완료 상태 확인 시 → R-6 Fallback 트리거, PD-035A(core 신규)를 별도 PD로 분리할지 Master 판정 회차 필요.
2. **P1 템플릿 설계**: core-0 fallback(§2-D) 또는 구조 섹션 분리 규정(§R-7 mitigation)에 Ace/Master 이견 → 템플릿 재확정 회차.
3. **P1.5**: 5건 core 지표 중 하나라도 PD-023 registry schema (Ajv 검증)를 통과하지 못하거나 sourceHash 충돌 → P1.5 전면 보류, PD-023 P1 선행 대기.
4. **P2**: 7파일 중 3파일 이상 YAML 삽입 실패 → 템플릿 근본 결함 가능성, P1 복귀.
5. **P3**: Master가 B canonical 선언 문구("raterId=vera 고정, designer는 role 분류 레거시")에 이견 → P3 재확정 회차, Ace 재소집.
6. **P4 G2/G4**: registry drift 또는 canonical 블록 누락이 mitigation으로도 복구 불가 → R-5 fallback(전면 revert)·R-6 fallback(PD-035B 분리) 중 Master 판정.
7. **전 단계**: 세션 자원 소진으로 P4 도달 전 종료 불가피 → P1.5까지만 완료하고 P2/P3는 차기 세션 이연, PD-035 status=in-progress 유지.

---

## (말미 YAML 블록)

```yaml
# self-scores
aud_rcl: 0.82    # core — v1 미발견 3건(경계 침범·섹션 중첩·candidate inflation)을 v2에서 R-6/R-7/R-8로 흡수. 완전 0은 아님(잔존 🔴 R-5).
str_fd: 5        # extended — v2에서 신규 발견 3건 + 기존 5건 재평가 = 8건 구조 결함 식별
sa_rnd: 2        # extended — v1 초회 + v2 재호출, 누적 2라운드
spc_lck: N       # extended — 본 v2는 아직 locked-for-dev 이전. P1 템플릿 설계 동결 후 lock 예정.
```

ARKI_WRITE_DONE: C:/Projects/legend-team/reports/2026-04-24_pd035-yaml-instruction-8roles/arki_rev2.md
