---
role: arki
session: session_173
topic: topic_150
topicId: topic_150
turnId: 6
phase: execution-planning
rev: 2
recallReason: post-master-decision
invocationMode: subagent
---

# Arki — Zero 정리 실행계획 (rev2 / post-master-decision)

Arki입니다. Master 6건 결정(A1~A6) 후 재호출. 본 세션 정리 실행까지 진행. 6 항목 × 7 영역 + 통합 의존 그래프 + 통합 검증 게이트 + 자기감사. 일정·공수·담당 산정 0건(Schedule-on-Demand).

---

## 0. 사전 정합성 점검 (전체 시야)

본 계획이 건드리는 SOT 파일군:
- 정체성·정책: `memory/roles/personas/role-zero.md`, `memory/roles/policies/role-zero.md`
- 자기 상태: `memory/roles/zero_memory.json`
- 트리거 정책: `memory/shared/dispatch_config.json`
- 결정 박제: `memory/shared/decision_ledger.json` (D-125 statusNote, D-XXX 신규 SOP, D-110·D-119·D-127 chain 정합)
- 시스템 게이트웨이: `memory/shared/system_state.json` (PD-058·PD-059·PD-060 신규)
- 메모리 라우팅: `memory/shared/topic_load_manifest.json`
- canonical 본문: `CLAUDE.md` (Zero 라인 표기 단순화)

영향 받지 않는(by-design) 영역:
- `.claude/skills/*` Zero 전용 skill 부재 — 정합 (내부 흡수)
- `.claude/agents/*` 디렉터리 비어있음 — 정합
- `.claude/hooks/*` excludedAssets enforce 코드 0건 — A1 통합 후에도 신설 X (Master 명시)
- viewer SOT(tokens.css·role-colors.js) — Zero 색상 박제 정합, 본 토픽 범위 밖
- `memory/growth/metrics_registry.json` — Zero 3 지표 박제 정합, 미변경

---

## A1. self-exclusion 압축 통합

### A1.1 변경 대상 파일 목록

| # | 절대 경로 | 변경 종류 |
|---|---|---|
| 1 | `C:/Projects/legend-team/memory/roles/personas/role-zero.md` | edit (SOT — 본문 단축 + self-exclusion 일반 원칙 1줄 박제) |
| 2 | `C:/Projects/legend-team/memory/roles/policies/role-zero.md` | edit (prose 참조형 단축 — "persona SOT 참조" 표기) |
| 3 | `C:/Projects/legend-team/memory/roles/zero_memory.json` | edit (`policy.excludedAssets` 키 제거) |
| 4 | `C:/Projects/legend-team/memory/shared/dispatch_config.json` | edit (`rules.zero` sparse 유지 — 현재 excludedAssets 이미 부재, 정합 확인만) |

### A1.2 변경 전후 diff 요약

**(1) personas/role-zero.md — SOT (단축 후 강화)**
- L29 삭제: `- violation flag 직접 read 후 자기검열 우회 (D-125 정합 — \`dispatch_config.zero.excludedAssets\`로 차단)`
- L37-40 단축: 현 4줄 (scope_areas / excludedAssets / session_isolation 박제) → 2줄 (`scope_areas`·`session_isolation`만, `excludedAssets`는 self-exclusion 일반 원칙 1줄로 대체)
- 신규 1줄 (호출 규칙 또는 원칙 섹션 말미): `**Self-exclusion 일반 원칙 (D-XXX 통합 박제):** 메타-자산(violation flag·audit trail·self-scores log 등 시스템 자기 점검용 산출물)을 정제 대상으로 삼지 않는다. 미래 재도입 시 0-cost 활성. enforce 코드 부재 — Zero 자율 판단 의무.`

**(2) policies/role-zero.md — prose 참조형**
- L9 변경: `\`dispatch_config.json\` \`rules.zero.excludedAssets\` 준수 (violation flag direct read 차단)` → `Self-exclusion 일반 원칙은 \`memory/roles/personas/role-zero.md\` SOT 참조 (D-XXX 통합).`
- L49 단축: `violation flag (\`excludedAssets\`) direct read 금지` → `Self-exclusion 의무 (persona SOT D-XXX)`
- L68 변경: `\`dispatch_config.json\` \`rules.zero.excludedAssets\` 확인 후 해당 경로 Read 금지` → `Self-exclusion: persona SOT 참조하여 메타-자산 Read 회피`

**(3) zero_memory.json — 키 제거**
- L35-37 삭제: `"excludedAssets": ["memory/shared/violations/*"]`
- 정합 표기: `policy.introducedBy`에 `(D-XXX 통합으로 excludedAssets 키 SOT=persona로 이전)` 추가

**(4) dispatch_config.json `rules.zero` — sparse 확인**
- 현재 `excludedAssets` 키 이미 부재(D-133 재구성 결과). 변경 없음. 정합 확인만.
- 단 `comment` 또는 `lastUpdatedBy`에 본 토픽 흔적 1줄 추가 가능 (선택).

### A1.3 의존 그래프

A1 내부: (1) persona SOT 박제 → (2) policy 참조형 단축 → (3) memory 키 제거.
A1 → A4: A1이 SOT 박제 시 D-XXX 표기를 사용 — A4(D-110→D-119→D-127 chain 단순화)와 표기 일관성 필요.

### A1.4 검증 게이트

- **G-A1.1**: `grep -rn "excludedAssets" C:/Projects/legend-team/memory/roles/ C:/Projects/legend-team/memory/shared/dispatch_config.json` 결과 — persona SOT 1줄 + dispatch_config 0건 (정상). 4중 → 1중 통합 확인.
- **G-A1.2**: `node -e "const j=require('./memory/roles/zero_memory.json'); console.log(j.policy.excludedAssets===undefined)"` → `true`.
- **G-A1.3**: 페르소나 호출 dry-run (선택) — 다음 Zero 호출 시 prompt에 self-exclusion 일반 원칙 prepend 확인.

### A1.5 롤백 절차

`git diff HEAD~1 -- memory/roles/personas/role-zero.md memory/roles/policies/role-zero.md memory/roles/zero_memory.json` 확인 후 `git checkout HEAD~1 -- <위 3파일>`. dispatch_config 미변경이라 영향 없음.

### A1.6 전제

- self-exclusion 일반 원칙 1줄 표현이 D-XXX(A5 SOP) 결정과 표기 충돌 없음.
- `memory/shared/violations/`·`ncl_violations.jsonl` 부재 상태 유지(Dev V1~V5에서 검증됨).
- enforce hook 신설 X — Master 명시.

### A1.7 중단 조건

- persona SOT 단축 후 prompt prepend 결과 hook v3 truncation 발생 시 즉시 중단.
- self-exclusion 표현이 Zero 호출 사고(메타-자산 정제 시도)와 충돌 가능성 1건이라도 감지 시 중단·재설계.

---

## A2. D-125 statusNote 추가 (NCL dead pointer)

### A2.1 변경 대상 파일 목록

| # | 절대 경로 | 변경 종류 |
|---|---|---|
| 1 | `C:/Projects/legend-team/memory/shared/decision_ledger.json` | edit (D-125 객체에 `statusNote` 필드 추가) |

### A2.2 변경 전후 diff 요약

D-125 객체 (L2093-2102) 끝에 추가:
```json
"statusNote": "D-133(2026-05-01) NCL 전면 폐기 후 본문 'memory/shared/ncl_violations.jsonl' 명시는 dead pointer. 보호 대상 부재. self-exclusion 일반 원칙은 D-XXX(session_173) Zero persona SOT로 이전. 본 결정 본문 보존(D-134 정신).",
"amendedBy": "D-XXX"
```

### A2.3 의존 그래프

A2 ← A5: D-XXX(A5 SOP) ID 확정 후 A2의 `amendedBy` 기록. A5 선행.

### A2.4 검증 게이트

- **G-A2.1**: `node -e "const j=require('./memory/shared/decision_ledger.json'); const d=j.decisions.find(x=>x.id==='D-125'); console.log(!!d.statusNote && d.amendedBy==='D-XXX')"` → `true` (XXX 자리 실제 ID 치환).
- **G-A2.2**: JSON parse OK 확인.

### A2.5 롤백 절차

`git checkout HEAD~1 -- memory/shared/decision_ledger.json`. 단 다른 변경 동시 진행 시 부분 revert 필요.

### A2.6 전제

- decision_ledger 본문 보존 원칙(D-134) 유지.
- A5 D-XXX ID 발번 후 A2 적용.

### A2.7 중단 조건

- JSON schema validate 실패 시 중단.
- D-125 본문 텍스트 직접 수정 시도 감지 시 중단(본문 보존 의무).

---

## A3. topic_load_manifest.json zero 키워드 등록

### A3.1 변경 대상 파일 목록

| # | 절대 경로 | 변경 종류 |
|---|---|---|
| 1 | `C:/Projects/legend-team/memory/shared/topic_load_manifest.json` | edit (typeRules 신규 또는 기존 type에 zero 매핑 추가) |

### A3.2 변경 전후 diff 요약

옵션 A (신규 type 추가, 권고):
```json
{
  "type": "refinement",
  "description": "산출물 정제·tech-debt·simplify·security-review 토픽",
  "keywords": ["정제", "tech-debt", "기술부채", "simplify", "security-review", "하드코딩", "리팩터", "다이어트", "zero"],
  "loadMemory": ["ace_memory", "zero_memory"]
}
```
삽입 위치: `meta-review` 직전 또는 직후 (의미상 인접).

옵션 B (기존 meta-review에 추가, 비권고): 키워드 list에 `"정제", "tech-debt"` 등만 추가. zero_memory loadMemory 누락.

### A3.3 의존 그래프

A3 독립. 선후 의존 없음.

### A3.4 검증 게이트

- **G-A3.1**: `node -e "const j=require('./memory/shared/topic_load_manifest.json'); console.log(j.typeRules.some(r=>r.type==='refinement'))"` → `true`.
- **G-A3.2**: 다음 정제 토픽 `/open` 시 zero_memory 자동 로드 확인 (런타임 dry-run).
- **G-A3.3**: 첫 매칭 규칙 정합 — 기존 `meta-review` 키워드(역할/세션/점검)와 충돌 시 우선순위 점검.

### A3.5 롤백 절차

`git checkout HEAD~1 -- memory/shared/topic_load_manifest.json`.

### A3.6 전제

- typeRules `_matchRule`("첫 매칭") 의미가 변경되지 않음.
- zero_memory.json 존재 확인됨 (이미 박제).

### A3.7 중단 조건

- 다른 type 키워드와 conflict로 기존 토픽 분류 변경 발생 시 중단·키워드 재설계.

---

## A4. D-110→D-119→D-127 chain 표기 단순화

### A4.1 변경 대상 파일 목록

| # | 절대 경로 | 변경 종류 |
|---|---|---|
| 1 | `C:/Projects/legend-team/CLAUDE.md` | edit (Zero 라인 L24 chain 표기 단순화) |

### A4.2 변경 전후 diff 요약

**Before (L24):**
```
- **Zero (D-127, 2026-04-29 / D-119 본문 박제 / D-133 갱신 2026-05-01):** 정제 페르소나 — 산출물 레이어, 3 영역 한정 ...
```

**After:**
```
- **Zero (D-127 supersede D-119 supersede D-110, 2026-04-29 / D-133 NCL 폐기 갱신 2026-05-01):** 정제 페르소나 — 산출물 레이어, 3 영역 한정 ...
```

근거: D-127이 D-119 본문을 박제 완료한 supersede 결정. chain 명시로 의미 단순화 + decision_ledger SOT 정합.

### A4.3 의존 그래프

A4 독립. 단 표기 형식은 A1 신규 D-XXX 표기와 일관 유지 권고.

### A4.4 검증 게이트

- **G-A4.1**: `grep -n "D-127.*D-119.*D-133" C:/Projects/legend-team/CLAUDE.md` → 1건 매칭.
- **G-A4.2**: decision_ledger.json D-127·D-119·D-110 객체의 `supersedes` / `supersededBy` 필드 cross-check (이미 박제됨, 변경 X).

### A4.5 롤백 절차

`git checkout HEAD~1 -- CLAUDE.md`.

### A4.6 전제

- CLAUDE.md 다른 라인의 chain 표기 형식과 일관성 유지(다른 결정도 supersede chain 박제 시 동일 형식 권고).
- D-134 "박제 본문 보존" 정신 정합 — 본 변경은 표기 단순화이지 본문 변경 아님.

### A4.7 중단 조건

- chain 표기가 LLM 컨텍스트 prepend 시 truncation 위험 발생 시 중단.

---

## A5. 신규 페르소나 도입 12-axes 인벤토리 점검 SOP 박제

### A5.1 변경 대상 파일 목록

| # | 절대 경로 | 변경 종류 |
|---|---|---|
| 1 | `C:/Projects/legend-team/memory/shared/decision_ledger.json` | append (D-XXX 신규 결정) |

### A5.2 변경 전후 diff 요약

decision_ledger.json `decisions[]` 말미에 append (D-145 다음):
```json
{
  "id": "D-XXX",
  "date": "2026-05-02",
  "session": "session_173",
  "topic": "topic_150",
  "topicSlug": "zero-logic-inefficiency-audit",
  "owningTopicId": "topic_150",
  "scopeCheck": "Zero footprint 점검에서 도출된 신규 페르소나 도입 SOP — Sage·Jobs·향후 N번째 페르소나 동일 적용",
  "axis": "신규 페르소나 도입 12-axes 인벤토리 점검 SOP",
  "summary": "신규 페르소나 도입 시 다음 12 axes 전수 점검 의무. (1) CLAUDE.md 역할 분리 라인 + 페르소나 정의 라인 (2) memory/roles/personas/role-{r}.md (3) memory/roles/policies/role-{r}.md (4) memory/roles/{r}_memory.json (5) memory/shared/dispatch_config.json rules.{r} (6) .claude/skills/{r}-* 또는 내부 흡수 명문화 (7) .claude/hooks/post-tool-use-task.js + pre-tool-use-task-sage-gate.js KNOWN_ROLES 배열 (8) scripts/ alias 매핑(있다면) (9) memory/growth/metrics_registry.json {r}.* 지표 (10) memory/shared/role_registry.json roles 배열 (11) memory/shared/role_palette.json + app/css/tokens.css --c-{r} + app/js/role-colors.js (12) memory/shared/topic_load_manifest.json typeRules 키워드+loadMemory.",
  "decision": "신규 페르소나 도입 또는 기존 페르소나 정체성 갱신 시 12 axes 전수 점검을 SOP로 박제. 누락 1건 = drift. 점검 시점: 도입 결정 박제 직전 + 도입 N세션 후 footprint 검진 1회. footprint 검진 첫 케이스 스터디 = topic_150(Zero).",
  "value": "Sage·Jobs·Zero 도입 시 발견된 SOT 분열(role_registry/palette vs tokens.css)·manifest 결손·hook KNOWN_ROLES 비대칭 등 사고 패턴의 재발 방지. 다축 교차 검증 의무(메모리: arki_full_system_view).",
  "caveats": [
    "viewer SOT 분열(role_palette.json vs tokens.css) 본질 진단은 별도 토픽(B1)에서 처리",
    "12 axes는 운영 누적에 따라 갱신 가능 — 본 SOP는 v1 기준선"
  ],
  "status": "active"
}
```

### A5.3 의존 그래프

A5 → A2 (A5 D-XXX ID 확정 후 A2 statusNote의 amendedBy 기록).
A5 → A1 (A1 self-exclusion 일반 원칙의 "D-XXX 통합 박제" 표기 정합).
A5 → A6 (A6 PD resolveCondition에 D-XXX 참조 가능).

### A5.4 검증 게이트

- **G-A5.1**: `node -e "const j=require('./memory/shared/decision_ledger.json'); console.log(j.decisions.some(d=>d.id==='D-XXX' && d.axis.includes('12-axes')))"` → `true`.
- **G-A5.2**: 12 axes 표가 본 세션 채팅 표 + Arki rev1 §1 인벤토리와 1:1 매핑.
- **G-A5.3**: JSON parse OK + status='active' 확인.

### A5.5 롤백 절차

`git checkout HEAD~1 -- memory/shared/decision_ledger.json`.

### A5.6 전제

- D-XXX ID 발번 — 마지막 D-145 이후 다음 번호(D-146 추정).
- 12 axes 표가 운영 누적과 정합(본 토픽 검증).

### A5.7 중단 조건

- 12 axes 중 1건이라도 본 토픽 검증과 불일치 발견 시 중단·재정의.

---

## A6. DEFER 3건 재검토 트리거 PD 박제

### A6.1 변경 대상 파일 목록

| # | 절대 경로 | 변경 종류 |
|---|---|---|
| 1 | `C:/Projects/legend-team/memory/shared/system_state.json` | append (PD-058·PD-059·PD-060 신규) |

### A6.2 변경 전후 diff 요약

`pendingDeferrals[]` 배열 말미(또는 적절한 위치)에 append 3건:

```json
{
  "id": "PD-058",
  "fromSession": "session_173",
  "fromTopic": "topic_150 (zero-logic-inefficiency-audit)",
  "item": "C3 — scope_areas 4중 박제(persona/policy/memory/dispatch_config) prose 참조형 단축. 운영 효익 낮음으로 본 토픽 DEFER. Jobs B3 권고: 신규 페르소나 N번째 도입 시 또는 1년 내 SOP 갱신 시 재검토.",
  "status": "pending",
  "resolveCondition": "신규 페르소나 N번째 도입 OR 2027-05-02 도래 OR Master 명시 재오픈",
  "dependsOn": [],
  "relatedDecisions": ["D-XXX"],
  "relatedTopic": "topic_150"
},
{
  "id": "PD-059",
  "fromSession": "session_173",
  "fromTopic": "topic_150 (zero-logic-inefficiency-audit)",
  "item": "C6 — KNOWN_ROLES 배열 hook 2개(post-tool-use-task.js + pre-tool-use-task-sage-gate.js) 중복 박제. 공통 모듈 추출. ROI 낮음으로 본 토픽 DEFER. Jobs 권고: hook 신설·개편 토픽 발생 시 또는 1년 내 재검토.",
  "status": "pending",
  "resolveCondition": "hook 신설·개편 토픽 발생 OR 2027-05-02 도래 OR Master 명시 재오픈",
  "dependsOn": [],
  "relatedDecisions": ["D-XXX"],
  "relatedTopic": "topic_150"
},
{
  "id": "PD-060",
  "fromSession": "session_173",
  "fromTopic": "topic_150 (zero-logic-inefficiency-audit)",
  "item": "C7 — dispatch_config.rules.zero.internal_tools 배열(['Cut','Refine','Audit']) 코드 read 0건. 정보적 의의만. 저비용으로 본 토픽 DEFER. Jobs 권고: dispatch_config 표준화 토픽 발생 시 또는 1년 내 재검토.",
  "status": "pending",
  "resolveCondition": "dispatch_config 표준화 토픽 발생 OR 2027-05-02 도래 OR Master 명시 재오픈",
  "dependsOn": [],
  "relatedDecisions": ["D-XXX"],
  "relatedTopic": "topic_150"
}
```

### A6.3 의존 그래프

A6 → A5 (D-XXX ID 확정 후 PD relatedDecisions 기록).

### A6.4 검증 게이트

- **G-A6.1**: `node -e "const j=require('./memory/shared/system_state.json'); const ids=j.pendingDeferrals.map(p=>p.id); console.log(['PD-058','PD-059','PD-060'].every(id=>ids.includes(id)))"` → `true`.
- **G-A6.2**: 각 PD `resolveCondition` non-empty + `status: pending`.
- **G-A6.3**: JSON parse OK.

### A6.5 롤백 절차

`git checkout HEAD~1 -- memory/shared/system_state.json`.

### A6.6 전제

- PD ID 발번 — PD-057 이후 PD-058·059·060 (현 ledger 최대 PD-057 확인됨).
- "1년 내" 표현이 Schedule-on-Demand 오염 금지어("D+N일·N주차" 등)에 해당하지 않음 확인 — `2027-05-02 도래`는 절대 시간이지만 PD resolveCondition은 일정 산정이 아닌 "재검토 트리거"로서 허용 (관례: PD-057 등 기존 PD에 동일 패턴 부재 — 본 토픽 신규 패턴 도입). 대안: "Master 명시 재오픈"만 단독 사용.

### A6.7 중단 조건

- "2027-05-02 도래"가 일정 오염으로 판정될 경우 즉시 중단·`Master 명시 재오픈`만으로 단순화.

---

## 통합 의존 그래프

```
A5 (D-XXX SOP 박제)
 ├─→ A2 (D-125 statusNote.amendedBy = D-XXX)
 ├─→ A1 (persona SOT의 self-exclusion 일반 원칙 표기에 D-XXX 참조)
 └─→ A6 (PD 3건 relatedDecisions = D-XXX)

A1 (self-exclusion 압축 통합)
 └─→ (A1.1 → A1.2 → A1.3 내부 순서)

A4 (CLAUDE.md chain 단순화)  [독립]
A3 (manifest zero 키워드)     [독립]
```

**실행 권장 순서:**
1. A5 (D-XXX 발번·박제) — 후행 항목들의 참조 ID 확정
2. A1 (persona SOT 박제 → policy 단축 → memory 키 제거) — 본 토픽 핵심 정합
3. A2 (D-125 statusNote 추가) — A5 의존
4. A6 (PD 3건 박제) — A5 의존
5. A4 (CLAUDE.md 표기 단순화) — 독립
6. A3 (manifest 키워드 추가) — 독립

A4·A3은 1~4와 병렬 가능.

---

## 통합 검증 게이트

전체 6 항목 변경 후 일괄 실행:

| # | 게이트 | 명령/확인 |
|---|---|---|
| G1 | self-exclusion 4중 → 1중 | `grep -rn "excludedAssets" memory/roles/ memory/shared/dispatch_config.json` 결과 = persona SOT 1줄 |
| G2 | zero_memory 키 제거 | `node -e "console.log(require('./memory/roles/zero_memory.json').policy.excludedAssets)"` → `undefined` |
| G3 | D-125 statusNote 박제 | `node -e "const d=require('./memory/shared/decision_ledger.json').decisions.find(x=>x.id==='D-125'); console.log(!!d.statusNote)"` → `true` |
| G4 | D-XXX SOP 박제 | `node -e "console.log(require('./memory/shared/decision_ledger.json').decisions.some(d=>d.axis.includes('12-axes')))"` → `true` |
| G5 | manifest refinement 신설 | `node -e "console.log(require('./memory/shared/topic_load_manifest.json').typeRules.some(r=>r.type==='refinement'))"` → `true` |
| G6 | PD 3건 박제 | `node -e "const ids=require('./memory/shared/system_state.json').pendingDeferrals.map(p=>p.id); console.log(['PD-058','PD-059','PD-060'].every(id=>ids.includes(id)))"` → `true` |
| G7 | CLAUDE.md chain 단순화 | `grep -n "D-127 supersede D-119 supersede D-110" CLAUDE.md` → 1건 |
| G8 | dashboard build 회귀 | `node scripts/build.js` 정상 종료(exit 0) — viewer SOT 미변경 확인 |
| G9 | session_index turn 박제 | finalize.js 후 turns[6].role='arki' + recallReason='post-master-decision' 정합 |
| G10 | JSON schema 정합 | 4 JSON 파일(decision_ledger·system_state·topic_load_manifest·zero_memory) parse OK |

---

## 통합 롤백 절차

전체 revert: `git diff --stat HEAD~1` 확인 후 `git checkout HEAD~1 -- <변경 파일 7건>`. 부분 revert는 항목별 §롤백 절차 참조.

---

## 핵심 리스크 + Mitigation + Fallback

### R-1 🔴 D-XXX ID 충돌
**리스크:** 본 계획 실행 중 다른 세션에서 D-146·147 발번 시 충돌.
**Mitigation:** 실행 직전 `decision_ledger.json` 마지막 ID 재확인 후 발번. 본 세션 단일 트랜잭션으로 일괄 실행.
**Fallback:** 충돌 감지 시 즉시 다음 ID로 재발번 + 본 보고서 D-XXX 참조 일괄 치환.

### R-2 🟡 self-exclusion 일반 원칙 enforce 부재 회귀
**리스크:** A1 통합 후 enforce 코드 0건 상태에서 Zero 호출 사고로 메타-자산(future Sage log·audit trail) 정제 시도 발생.
**Mitigation:** persona SOT에 "enforce 코드 부재 — Zero 자율 판단 의무" 명문화. 미래 메타-자산 도입 시점에 enforce 신설 검토(premature optimization 회피, Keynes 적응적 보존).
**Fallback:** 사고 1건 발생 시 즉시 enforce hook 신설 토픽 오픈 + Zero 호출 동결.

### R-3 🟡 manifest refinement 첫 매칭 충돌
**리스크:** A3 신설 type이 기존 `meta-review` 키워드(역할/세션/점검)와 토픽 분류 충돌.
**Mitigation:** typeRules 순서에서 `refinement`를 `meta-review` 직전 배치 + 키워드 우선순위 명시. 기존 토픽 재분류 발생 여부 dry-run.
**Fallback:** 충돌 감지 시 키워드에서 일반 단어("정제") 제거하고 `tech-debt`·`simplify` 등 specific 키워드만 유지.

### R-4 🟡 PD-058 "2027-05-02" 일정 오염 의심
**리스크:** Schedule-on-Demand 원칙(D-017) 오염 금지어 "MM/DD" 패턴 위반 가능성.
**Mitigation:** "1년 후 도래"는 일정 산정이 아닌 재검토 트리거. 단 보수적 해석 시 Master 검토 필요.
**Fallback:** 오염 판정 시 `resolveCondition`을 `Master 명시 재오픈 OR 신규 페르소나 N번째 도입` 단독으로 단순화.

### R-5 🟢 CLAUDE.md chain 표기 prepend truncation
**리스크:** chain 표기 길이 증가로 hook v3 컨텍스트 prepend 시 truncation.
**Mitigation:** 변경 전후 라인 길이 차이 ~30자, 영향 negligible.
**Fallback:** 길이 우려 시 `D-127(D-110→D-119 supersede)`로 더 단축.

---

## 자기감사 (1차 — 의무 라운드 1/1)

본 토픽은 **실행계획** 박제 (재호출, post-master-decision). 자기감사 4축 각 최소 3지점:

### 축 1: structuration (구조 분리·의존 명확성)
- ✅ 6 항목 × 7 영역 표 통일.
- ✅ 의존 그래프 명시 (A5→A1·A2·A6, A3·A4 독립).
- ✅ 통합 검증 게이트 10건 + 항목별 게이트 분리.
- 발견: **No issue at this dimension** (실행계획 분해 정합).

### 축 2: hardcoding (하드코딩 경로·값·설정)
- ⚠ A6 PD-058~060의 `2027-05-02` 절대 시간 하드코딩 — Schedule-on-Demand 의심(R-4 박제). ROI 라벨: **MUST_NOW** — Master 검토 1건.
- ✅ 절대 경로 표기는 Windows `C:/Projects/legend-team/` 일관 — 본 시스템 표준.
- ✅ D-XXX placeholder 사용 — 발번 후 일괄 치환 의무 명문화(R-1).
- 발견 1건 (R-4 박제됨, MUST_NOW).

### 축 3: efficiency (중복 제거·알고리즘 선택)
- ✅ self-exclusion 4중 → 1중 통합(A1) — 핵심 효율 개선.
- ✅ chain 표기 단순화(A4) — 의미 압축.
- ⚠ A6 PD 3건 본문이 Jobs 권고와 textually 유사 — 변형 표현 가능하나 ROI 낮음. 라벨: **DEFER**.
- 발견 1건 (DEFER).

### 축 4: extensibility (확장 지점·확장 방식)
- ✅ A5 SOP가 신규 페르소나 N번째 도입 시 일반화 박제 — 확장성 자체가 결과물.
- ✅ A6 PD resolveCondition이 미래 트리거 박제 — 후속 토픽 분리 정합.
- ✅ self-exclusion 일반 원칙(A1)이 미래 메타-자산 보호 일반화.
- 발견: **No issue at this dimension**.

### 자기감사 종료 기준
- 1차 발견 2건 (1 MUST_NOW + 1 DEFER). MUST_NOW 1건은 R-4로 박제·Fallback 명시.
- 본 보고서는 식별→정리 1세션 완결 권고에 정합 (Master 결정 정합).
- 추가 라운드 불요 (Nth차 발견 1개 이하 + 모든 발견 NICE/DEFER 또는 mitigation 박제).

### scope drift 체크
- 본 토픽 원래 정의: "Zero footprint 비효율 정리" (식별 + 정리 실행).
- 본 보고서 scope: 6 항목(A1~A6) 모두 Master 결정 항목 직접 매핑. drift 0.

---

## spec 동결 선언

본 보고서로 **Zero 정리 실행계획 spec 동결** 선언. Dev 인계 또는 Edi 직접 박제 진행 가능. 추가 변경은 Master 명시 또는 R-1~R-5 trigger 발동 시만.

---

## 외부 anchor

- **Hickey, R. (2011).** *Simple Made Easy.* Strange Loop conference talk. — "Complect의 회피"가 본 계획의 self-exclusion 단일 SOT 통합 근거. 4중 박제는 complect, 1중은 simple.
- **Keynes, J. M. (1936).** *General Theory of Employment, Interest and Money.* Macmillan. — Uncertainty 하 적응적 보존 — A1 self-exclusion 일반 원칙 보존(미래 메타-자산 0-cost 활성).

---

ARKI_WRITE_DONE: C:/Projects/legend-team/reports/2026-05-02_zero-logic-inefficiency-audit/arki_rev2.md

[ROLE:arki]
# self-scores
aud_rcl: Y
str_fd: 2
spc_lck: Y
sa_rnd: 1
