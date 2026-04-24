---
role: arki
topic: topic_096
session: session_091
rev: 6
date: 2026-04-24
phase: analysis
invocationMode: subagent
mode: schema-impact-only
---

ARKI_WRITE_DONE: reports/2026-04-24_topic096-ace-arki-protocol/arki_rev6_schema_impact.md

# Arki rev6 — Schema Impact Report (양자 충족 baseline의 9 기준이 현 schema에 미치는 영향)

본 문서는 **영향 진단만** 수행합니다. 처방·구현·신규 파일 제안 일체 없음. 각 섹션은 (현재 상태) → (9 기준 충족 시 schema가 받는 영향) 순서로 단정합니다. 변경 불요인 곳은 "변경 없음"을 명시합니다.

---

## 1. Definition Restated (Master 박제 그대로)

**Role differentiation baseline = actual Task/subagent invocation + corresponding physical report artifact.**

### 9 기준 (변형 금지·박제):

1. reports 파일만으로는 역할 분화 인정 불가.
2. plannedSequence 또는 agentsCompleted 문자열만으로는 역할 분화 인정 불가.
3. invocationMode=subagent와 subagentId/agentId가 기록되어야 한다.
4. 해당 role report가 생성되어야 한다.
5. report artifact는 invocation record와 agentId 또는 turnId로 연결되어야 한다.
6. agentsCompleted는 위 두 조건을 모두 만족한 role만 포함한다.
7. legacy sessions는 legacy:true로 유지하고 invocationMode를 추정 백필하지 않는다.
8. session_090은 최초 측정 snapshot으로 유지한다.
9. 앞으로의 baseline은 (c) 기준으로 신규 측정한다.

---

## 2. Schema Impact — turns schema (`scripts/lib/turn-types.ts`)

### 현재 상태 (file: `scripts/lib/turn-types.ts` lines 25-58)

- `InvocationMode` enum 4값 정의: `subagent | inline-main | inline-allowed | master-direct`.
- `Turn` interface 필드:
  - 필수: `role`, `turnIdx`
  - 선택: `phase`, `invocationMode`, `subagentId`, `recallReason`, `splitReason`, `chars`, `segments`
- 주석 (line 50): `invocationMode` Grade A/S에서 필수, legacy(001~089) undefined 허용.
- 주석 (line 52): `subagentId` invocationMode=subagent일 때 required.
- **`reportArtifact` / `reportPath` / `agentId` 필드 부재.**

### 9 기준 충족 시 영향

**기준 3 (invocationMode=subagent + subagentId/agentId 기록):**
- `subagentId`는 이미 존재 — 새 필드 불요. **canonical key 단정: `subagentId`** (Agent 툴이 반환하는 instance id, session_090 turn 5/7/9에 `ae844b15ec6eda182` 형태로 기록됨). 9 기준의 "agentId" 표기는 `subagentId`와 동의어로 흡수 — 별도 `agentId` 필드 신설은 schema 분기만 늘림. `subagentId`로 단일화.
- 단정 — `Turn.subagentId`의 "선택" 표기가 의미적으로 약함. 기준 3은 invocationMode=subagent인 turn에서 subagentId **부재 = 기준 미충족**으로 간주됨. TypeScript 선택 필드 + JSDoc "required" 주석이라는 현 이중 표현은 9 기준 검증 로직 작성 시 **런타임 검증 의존**을 강제함 (컴파일 타임 보장 불가). 영향: 검증 로직이 schema 외부에 존재해야 함을 의미.

**기준 4·5 (report artifact 생성 + invocation record와 link):**
- 현 schema에는 turn → report 연결 필드 **전무**. session_090 turn 5/7/9는 `subagentId`만 가질 뿐, 어떤 reports 파일이 그 turn의 산출물인지 turns schema 내부에서는 추적 불가.
- 기준 5 충족 시 영향: Turn 레코드에 **report 링크 필드 신설 필요** (단정 — 신규 필드 X). 기존 필드로 가능한가? 불가능. `subagentId` ↔ reports/{...}/{role}_rev{n}.md frontmatter간 매핑이 schema에 표현되지 않음. 단, "신규 필드 신설" 자체는 schema 변경의 사실 진술이며, 본 문서에서는 **어느 키가 canonical인가**만 단정 — Turn.subagentId가 source-of-truth, reports frontmatter가 그것을 역참조하는 fan-in 모델이 schema 정합성을 깨지 않음. 반대 방향(report가 source) 시 reports 파일이 임의 생성 가능해 기준 1·2 회귀.

**기준 6 (agentsCompleted = 양자 충족 role만):**
- 현 finalize hook (line 102): `sess.agentsCompleted = turnRoles` — turns의 role을 그대로 복사. invocationMode/subagentId 검사 없음. report artifact 존재 여부 검사 없음. **기준 6 위반 상태가 schema 차원이 아닌 finalize 로직 차원에서 박제됨.**
- 기준 6 충족 시 영향: `turns` 자체는 변경 없음 (turns는 모든 시도의 기록). agentsCompleted 파생 로직만 변경 대상 — 즉 **turn-types.ts에는 영향 없음**, 영향 위치는 finalize hook (대상 4 참조).

### 단정 요약 (turns schema)

- `subagentId` 캐노니컬 — `agentId` 신설 불요.
- `Turn`에 report 링크 필드 부재가 기준 5 충족을 schema 차원에서 표현 불가하게 함. 영향 인정.
- 기준 3·6 충족은 schema가 아닌 검증 로직(hook/script)이 떠안음. turn-types.ts 자체 변경 영향 = 약함, 검증 외부화 영향 = 강함.

---

## 3. Schema Impact — hook point (`.claude/hooks/`, `.claude/settings.json`)

### 현재 상태

- `.claude/hooks/`: `session-end-finalize.js`, `session-end-tokens.js` **2개만**.
- `.claude/settings.json` hooks 섹션: `SessionEnd` 1종만 등록 (`node scripts/auto-push.js`).
- finalize hook에 `auditInlineMainViolations` 함수 (line 55-89) 존재 — Grade A/S에서 inline-main 위반을 `gaps`에 박제. **차단 없음, 사후 박제만**.
- **PreToolUse·PostToolUse·UserPromptSubmit·Notification hook 전무.**

### 9 기준 충족 시 영향

**기준 3 (invocationMode + subagentId 기록 시점):**
- subagentId는 Agent/Task 툴 호출이 반환하는 값. **이 값을 turns에 박제하는 시점은 PostToolUse(Task)가 자연스러움.** 현재는 모든 박제가 SessionEnd 1회에 몰려 있어, 세션 중 자가 박제 경로 부재. session_090에서 subagentId 3건이 존재하는 이유는 **수동 기록** (Main이 Agent 툴 결과를 보고 turns에 직접 push). 자동화 부재가 schema와 별개로 기준 3 위반 위험을 만든다.
- 영향: hook gap = **PostToolUse(Task) hook 부재**가 기준 3 자동 충족을 가로막음. 단정 — 자동 박제 경로 부재는 기준 3을 "기록되어야 한다"의 수동 의존으로 만든다.

**기준 4·5 (report artifact 존재 + link):**
- 현 finalize hook은 reports 파일 존재 여부 검사 안 함. 즉 turns에 invocationMode=subagent + subagentId가 있어도 그에 대응하는 reports 파일이 없으면 schema는 그 불일치를 감지하지 못함.
- 영향: **report-link 검증 시점 부재 = 측정 시점 gap**. 후보 시점:
  - (a) Sub 발언 종료 시점 (Agent 툴 반환 직후, PostToolUse): subagentId와 ARKI_WRITE_DONE 줄을 cross-check. 단 — Agent의 응답 텍스트 검사 책임을 hook이 떠맡아야 함.
  - (b) SessionEnd 시점 (현행 finalize 확장): turns 전체 순회 + reports glob 매칭. session_090에서 사후 검증 가능.
- 단정 — **(b) SessionEnd 시점이 schema 정합성 검증의 자연스러운 위치.** (a)는 실시간성에 비해 hook 복잡도 폭증. 영향: finalize hook 책임 범위가 "agentsCompleted 재생성"에서 "양자 충족 검증 + agentsCompleted 필터링"으로 확장됨.

**기준 6 (agentsCompleted 필터):**
- 현 `ensureEditorInAgents` (line 91-111): turns.role 그대로 복사. 기준 6 충족 시 영향은 동일 함수 내 필터 추가 — schema는 무영향, 함수 의미 변경.

**기준 7 (legacy 백필 금지):**
- finalize hook은 legacy 세션을 전혀 건드리지 않음 (현 시점 hook은 status=closed인 신규 세션만 처리). 기준 7은 hook 차원에선 위반 위험 낮음. 단, 외부 스크립트(예: `compute-dashboard.ts`, `regenerate-context-brief.ts`)가 legacy 세션의 invocationMode를 추정 채움 시 위반 발생 — schema 차원에서는 `legacy: true` 플래그가 그 가드의 유일 신호.

### 단정 요약 (hook point)

- 측정 누락 가능 hook gap = **PostToolUse(Task)** (subagentId 자동 박제 경로 부재).
- 기준 4·5 검증 자연 위치 = **SessionEnd 확장** (현 finalize hook 확장).
- 기준 6 필터링 위치 = 동일 finalize hook 내부 (`ensureEditorInAgents` 의미 변경).
- settings.json은 SessionEnd 1종만 등록 — hook chain entrypoint 단일성은 9 기준 충족에 유리, 단 PostToolUse 미등록은 자동화 한계.

---

## 4. Schema Impact — reports structure (`reports/{date}_{slug}/{role}_rev{n}.md`)

### 현재 상태

- 명명 규칙: `reports/{YYYY-MM-DD}_{topic-slug}/{role}_rev{n}[_suffix].md`.
- frontmatter 필드 (현 토픽 reports 5개 비교):
  - `arki_rev2.md`: role/topic/session/rev/date/phase/invocationMode/parentInstanceId
  - `arki_rev3_regression.md`: role/topic/session/rev/date/phase/invocationMode (parentInstanceId **없음**)
  - `arki_rev4_breakpoint_localization.md`: role/topic/session/rev/date/phase/invocationMode (parentInstanceId **없음**)
  - `arki_rev5_goodstate_verification.md`: role/topic/session/rev/date/phase/invocationMode/mode (parentInstanceId **없음**)
  - `ace_synthesis_rev1.md`: role/topic/session/rev/date/phase/invocationMode/parentInstanceId="synthesis-after-arki-rev3"
- **일관성 결손 명시**: `parentInstanceId` 필드가 rev2/ace_synthesis만 존재, rev3/4/5 부재. 현 schema에는 reports frontmatter 표준이 강제되지 않음.

### 9 기준 충족 시 영향

**기준 4 (report artifact 생성):**
- 영향 = schema 차원 무영향 — frontmatter 없는 .md 파일도 "파일 존재"는 충족. 단 기준 5와 결합 시 변화.

**기준 5 (invocation record와 agentId 또는 turnId로 연결):**
- 현 frontmatter에 **`subagentId` 필드 부재**. `parentInstanceId`가 있는 rev2/ace_synthesis는 가깝지만 — rev2의 `a5eb841cc5684571f` 형식은 turns의 `subagentId` (`ae844b15ec6eda182`)와 **다른 식별자 체계**로 보임 (길이·접두 다름). ace_synthesis의 `parentInstanceId: synthesis-after-arki-rev3`는 자유 텍스트 — 머신 매칭 불가.
- 기준 5 단정: **canonical link key는 frontmatter `subagentId` (turns.subagentId와 동일 값) 또는 `turnId` (turns.turnIdx와 동일 값) 둘 중 하나**. 두 키 모두 부재가 현 결손. 9 기준은 "agentId 또는 turnId"라 둘 중 1개로 충족 가능 — 단정: **`turnId` (=turns.turnIdx) 채택이 schema 영향 최소** (turnIdx는 정수, 매칭 정합성 단순, 동일 subagentId가 여러 turn에 재호출되는 경우에도 turn 단위로 분리 가능).
- 단, 동일 turn 내 다중 reports 산출 (rev1/rev2)은 turnId 1:N 매핑 — 영향: rev 번호와 turn 번호의 의미 분리가 schema 명시 안 됨. 본 토픽 rev2~rev6 모두 단일 세션·다중 turn에서 생성됐으므로, **하나의 turn당 하나의 rev** 가정이 깨짐 (rev3~rev5 모두 동일 subagent 호출일 가능성 vs 별개 호출 — turns에 5건 추가 박제 안 되어 있으면 schema가 그 진실을 표현 못함).
- 단정 — **rev 번호와 turn 번호는 직교 차원**. frontmatter는 `turnId` (또는 `subagentId`) 1개와 `rev` 1개를 각각 가져야 정합. 현 schema 결손 영향 = 강함.

**기준 1 (reports만으론 인정 불가):**
- 현 결손이 기준 1을 자연스레 보호 (frontmatter에 link 키 없으니 reports만으론 양자 충족 표현 불가). 즉 schema 변경 전까지 기준 1 위반 위험은 낮음. 단 변경 후엔 기준 6 필터에서 reports 존재만 보고 통과시키지 않도록 hook 로직이 책임.

### 단정 요약 (reports structure)

- 명명 규칙은 변경 영향 없음 — glob 매칭으로 충분.
- frontmatter에 **link key 부재**가 기준 5 충족을 schema 차원에서 표현 불가하게 함.
- canonical link key 단정: **`turnId`** (구현 단순, 1개로 충분).
- `parentInstanceId` 필드는 일관성 결손 + `subagentId`와 다른 식별자 체계 가능성 — 현 형태로는 기준 5의 canonical key 후보 부적합.

---

## 5. Schema Impact — agentsCompleted semantics (`current_session.json`, `session_index.json`)

### 현재 상태

- 타입: `string[]` (역할명 중복 허용 배열).
- 생성 로직 (finalize hook line 102): `sess.agentsCompleted = turnRoles` (turns.role 1:1 복사).
- 의미: "turn이 기록된 모든 역할의 발언 순서대로의 나열" — invocationMode/subagentId/report 무검사.
- session_090 실측: `["ace","ace","ace","ace","ace","arki","ace","arki","ace","arki","editor"]` (11개) ↔ turns 11개와 길이·순서 정확 일치.
- legacy 세션의 agentsCompleted: turns 부재이므로 finalize hook이 만든 게 아니라 **수동/구버전 로직으로 생성된 잔존 데이터**. 의미가 다름 — 신규 hook 의미 ("turn 박제 결과")와 legacy 의미 ("발언 추정 기록")가 동일 필드명에 공존.

### 9 기준 충족 시 영향

**기준 6 (양자 충족 role만 포함):**
- 의미 변경 = "turn 박제된 모든 role" → "(invocationMode=subagent AND subagentId 존재) AND (대응 reports 파일 존재)인 role만". 결과:
  - session_090 재계산 시: turn 5/7/9 = arki 3회 (subagent + subagentId), 단 reports 매칭은 reports/2026-04-23_pd031-topic082-parallel-integration/ 또는 동등 경로 검증 필요. 만약 매칭 실패하면 arki 0회. **즉 기준 6 적용으로 agentsCompleted 길이가 11 → 0~3개로 축소 가능.**
  - inline-main turn 2/3/6 (ace) = 즉시 제외. inline-allowed turn 0/1/4/8 (ace) = invocationMode!=subagent → 제외. master-direct = 정의상 제외.
- 영향: **agentsCompleted의 정보량이 양적으로 급감**. 기존 dashboard·통계가 agentsCompleted 길이를 "활동량" proxy로 썼다면 의미 변경.

**필터링 로직 위치:**
- 현 finalize hook의 `ensureEditorInAgents`가 자연 위치. 단 — 함수 이름과 책임이 어긋남 (editor 자동 push와 양자 충족 필터가 한 함수에 섞임). 영향: 함수 책임 분리 압력 발생, schema 자체는 무영향.

**시점:**
- SessionEnd 1회. session 중간에 agentsCompleted를 읽는 다른 hook/스크립트가 있다면 **양자 충족 필터링 전 값**을 보게 됨. 현재 finalize 외 agentsCompleted 갱신 주체 없음 — 영향 격리됨.

**기준 7 (legacy 백필 금지) 충돌:**
- legacy 세션의 agentsCompleted는 새 의미를 적용하면 0이 됨 (turns가 없거나 invocationMode가 없으므로 양자 충족 불가). 그러나 기준 7은 백필 금지 — legacy 세션의 agentsCompleted 재계산 자체가 백필.
- 단정: **legacy 세션의 agentsCompleted는 재계산 금지 = 기존 의미 그대로 유지 = "추정 발언 기록"**. 신규 세션부터 새 의미. 동일 필드명에 두 의미 공존이 박제됨. 이 공존을 표현할 schema 신호 = **`legacy: true` 플래그가 의미 분기의 유일한 disambiguator**.

**legacy 세션의 agentsCompleted 해석:**
- session_001~046 (legacy 45개): agentsCompleted가 있어도 "양자 충족 검증 통과" 의미 아님. 기준 1·2에 의해 **분화 인정 불가** 데이터로 취급. 단정 — legacy의 agentsCompleted를 dashboard 통계에 합산하는 모든 코드는 의미 오염을 일으킴. 영향: 합산 로직 점검 필요.

### 단정 요약 (agentsCompleted semantics)

- schema 타입은 `string[]` 그대로 영향 없음 — 의미만 변경.
- 신규 세션: "양자 충족 role의 순서 보존 중복 허용 배열". legacy 세션: "추정 발언 기록 (의미 무효)". `legacy: true`가 의미 분기 신호.
- 필터링 시점·위치 = SessionEnd finalize hook 내부.
- 기준 6 적용 시 agentsCompleted 정보량 급감 (session_090 11 → 0~3).

---

## 6. Schema Impact — legacy session handling

### 현재 상태

- session_index.json 총 88세션 중 `legacy: true` = **45세션** (session_001~046 추정 분포).
- `turns` 배열 보유 = **43세션** (session_047부터). session_047은 D-048 turn 구조 도입 시점과 정합.
- 두 집합의 합 = 88 — 완전 분리 (legacy ↔ withTurns disjoint).
- session_026~036 (rev5 Q4 윈도우 11세션): turns 부재 + invocationMode 부재 + subagentId 부재 (rev5 line 124-140 확정).
- finalize hook의 legacy skip 로직: `runL2Writer` (line 162), `runL3Regenerator` (line 206) 모두 `if (sess.legacy) skip`.

### 9 기준 충족 시 영향

**기준 7 (백필 금지) → schema 영향:**
- 현 schema는 legacy를 단일 boolean (`legacy: true`)로 표현. 기준 7 충족 시 영향 = **무영향** — 이미 충분.
- 단, "legacy 구간에서 turns 배열이 빈 배열인가 부재인가" 명확화 필요. 실측 결과: **부재** (배열 자체가 없음). schema 영향: `Turn[] | undefined` 두 상태로 충분, 빈 배열을 새 의미로 강제할 필요 없음. 단정 — 부재 = legacy. 빈 배열 = 신규 세션이지만 turns 박제 실패 (다른 의미). 두 상태 분리 유지 영향.

**기준 8 (session_090 snapshot 유지) → schema 영향:**
- session_090은 legacy: false (turns 11개 보유), invocationMode 첫 측정 세션. snapshot 유지 = **session_090 entry는 어떤 백필·재계산도 받지 않음**. 영향: finalize hook이 동일 sessionId에 대해 idempotent해야 한다는 제약 — 현 `appendOrUpdateSessionIndex` (line 113)는 `Object.assign(existing, entry)`로 기존 entry를 덮어씀. session_090 재실행 시 snapshot 깨질 위험. 영향: **session_090은 finalize 재실행 차단 필요** (또는 snapshot 별도 immutable 사본 필요). schema 차원에서는 `immutable: true` 또는 `frozenAt` 같은 마커가 자연스러운 방어선.
- ace_synthesis_rev1.md line 76 인용: `immutable: true`, `frozenAt: "2026-04-24"` 필드가 baseline 사본에 박제 제안됨 — 이는 schema 신호의 후보. 본 문서는 신설 권고 안 함, 단 영향만 단정: **현 schema에는 snapshot 보호 신호 부재**.

**dashboard/compute 스크립트 영향:**
- legacy 세션에 turns가 없음 → `compute-dashboard.ts`가 turns를 순회하면 자연 skip. invocationMode 통계는 session_090부터만 누적. 단정 — schema 영향 없음, 단 dashboard 코드가 legacy를 별도로 가시화하는 필드 없음. "측정 부재 구간" 가시화 = 현재 dashboard에 전무. 신설 영향 단정 불가 (구현 영역). 단, **schema 차원에서 legacy 비율을 계산 가능하므로 dashboard가 그것을 노출할 수 있음** — 영향 = 약함.

**"측정 부재 구간" 가시화 필드 필요 여부:**
- 단정 — `legacy: true`가 이미 그 신호. 추가 필드 불요. 단 dashboard가 이를 명시적 panel로 노출하는지가 가시화 충족 여부를 가름. schema 변경 영향 없음, dashboard 구성 영향만 있음.

### 단정 요약 (legacy handling)

- legacy 45 / 신규 turns 43 / disjoint. 현 schema (`legacy: true` boolean)는 기준 7·8 충족에 충분.
- session_090 snapshot 보호 신호 (`immutable`/`frozenAt`)가 현 schema에 부재 — 영향 인정.
- legacy 세션의 turns 배열 = 부재 (빈 배열 아님). 두 상태 의미 분리 유지.
- "측정 부재 구간" 가시화는 schema가 아닌 dashboard 책임.

---

## 7. Schema Impact — regression test requirement (`tests/`)

### 현재 상태

- `tests/fixtures/regression/`: snapshot_1~5.json (5개).
- `tests/fixtures/signature-metrics/`: baseline-10, empty, full-30 (signature 지표 fixture).
- **테스트 실행 코드 부재** — fixtures만 존재. `tests/` 하위에 .test.ts, .spec.ts 같은 실행기 파일 없음 (ls -R 결과).
- `validate-session-turns.ts` (CLAUDE.md 명시) — turns 구조 검증 스크립트 존재. 단 9 기준 검증은 아님 (구조 문법 검증 한정 추정).

### 9 기준 충족 시 영향

**기준 1·2·3 검증 표면 (구현 금지, 테스트 무엇을 검증해야 하는가만 단정):**
- T1. 어떤 세션의 reports 파일만으론 agentsCompleted에 포함되지 않음 (기준 1).
- T2. plannedSequence·agentsCompleted 문자열만 있고 turns invocationMode 부재 시 분화 인정 불가 (기준 2).
- T3. invocationMode=subagent인 turn에 subagentId 부재 시 양자 충족 fail (기준 3).
- T4. invocationMode=subagent + subagentId 있어도 reports 파일 부재 시 양자 충족 fail (기준 4).
- T5. turns의 turnId/subagentId가 reports frontmatter의 동일 키와 매칭돼야 함 (기준 5).
- T6. 위 T3~T5 모두 통과한 role만 agentsCompleted에 포함 (기준 6).
- T7. legacy: true 세션의 invocationMode 추정 백필 시도 시 fail (기준 7).
- T8. session_090 entry 변경 시도 시 fail (기준 8).
- T9. 신규 세션의 baseline 측정 = (c) 기준이 적용된 finalize 결과 일치 (기준 9).

**session_090 snapshot 비교 테스트 vs 미래 신규 측정 테스트 분리:**
- 단정 — **분리 필수**. 이유: session_090은 immutable snapshot (기준 8). snapshot 비교 테스트는 "현 entry == 박제값" 1회성 동등 검사. 미래 신규 측정 테스트는 매 세션 생성·검증되는 동적 검사. 동일 테스트 파일에 섞으면 snapshot 박제 의미 희석.

**백필 금지(7) 위반 감지 테스트 필요 여부:**
- 단정 — **필요**. 이유: legacy 45세션에 invocationMode 채워넣는 외부 스크립트가 추후 등장할 가능성 (예: dashboard 보조용). 정적 검증 = legacy: true 세션의 turns 내 invocationMode 필드 부재 / 모든 turn invocationMode 미정의 보장. 부재가 깨지면 백필 발생 신호.

**현 fixtures와의 정합:**
- snapshot_1~5.json은 9 기준 도입 이전 스키마 시점의 fixture일 가능성 — 영향: 9 기준 검증 테스트는 **신규 fixture 필요**. 기존 fixture 재사용 시 invocationMode/subagentId 필드 부재로 T3·T5 항상 fail이 되어 의미 없음. 단 신규 fixture 생성 자체는 본 문서 처방 영역 아님 — 영향만 단정: **기존 fixture 호환 불가**.

### 단정 요약 (regression test)

- 현재: fixtures만 존재, 9 기준 검증 테스트 부재.
- 검증 표면 = T1~T9 (위 9개).
- session_090 snapshot 테스트 ↔ 신규 측정 테스트 분리 필수.
- 백필 금지(7) 정적 검증 테스트 필요.
- 기존 fixtures 호환 불가, 신규 fixture 필요.

---

## 8. Cross-Cutting Concerns (6 대상 간 의존·충돌·도미노)

### 의존 그래프

```
turns schema (대상 1)
   │
   ├── agentsCompleted semantics (대상 4)  ← turns의 invocationMode/subagentId 의존
   │       │
   │       └── legacy handling (대상 5)    ← legacy: true는 agentsCompleted 의미 분기 신호
   │
   ├── reports structure (대상 3)          ← turnId/subagentId를 frontmatter에 노출
   │       │
   │       └── hook point (대상 2)         ← reports glob 검증을 finalize hook이 수행
   │
   └── regression test (대상 6)            ← 위 5개 모두를 statically/dynamically 검증
```

### 변경 도미노 (한 곳 변경 시 도미노 대상)

**A. turns schema에 link 필드(turnId/subagentId 명문화) 추가 시:**
- → reports frontmatter 표준 변경 (대상 3): 모든 신규 reports에 `turnId` 의무화.
- → finalize hook 로직 (대상 2): turn ↔ reports 매칭 코드 신설.
- → agentsCompleted 필터 로직 (대상 4): 양자 충족 검증에 link 사용.
- → regression test (대상 6): T5 테스트 추가.
- → legacy 세션 (대상 5): 변경 없음 (legacy는 turns 부재로 link도 부재 — 자연 정합).

**B. finalize hook 책임 확장 (대상 2):**
- → agentsCompleted 의미 변경 (대상 4)이 동일 hook 내부에서 일어남.
- → reports 파일 검증을 hook이 수행 (대상 3)이 동일 hook 내부.
- → turns schema 자체 무영향.
- → legacy 세션은 hook이 skip — 무영향.
- → regression test (대상 6): hook 출력 비교 테스트 필요.

**C. legacy 세션 처리 변경 (대상 5):**
- → agentsCompleted 의미 분기 깨짐 (대상 4): legacy 백필 시 의미 오염.
- → regression test (대상 6): T7이 위반 감지.
- → 다른 대상 무영향.

**D. session_090 snapshot 보호 신호 신설 (대상 5):**
- → finalize hook (대상 2): `immutable: true` entry 갱신 차단 로직 필요.
- → regression test (대상 6): T8이 위반 감지.
- → turns/reports/agentsCompleted schema 무영향.

### 충돌 지점

**충돌 1: 기준 6 (양자 충족 필터) ↔ 기존 dashboard 통계 호환**
- agentsCompleted 의미 변경으로 정보량 급감. dashboard가 agentsCompleted 길이를 활동량 proxy로 사용 중이면 통계 단절. 단 — 본 문서는 dashboard 영향만 단정, 처방 안 함.

**충돌 2: 기준 7 (legacy 백필 금지) ↔ "측정 부재 구간 가시화" 욕구**
- 가시화하려면 legacy에 0값/null값을 명시적 채움이 자연스러우나, 그 채움 자체가 백필. 충돌 해소 = **dashboard 표시 시점에만 가상 0값 노출, 파일에는 박제 안 함**. schema 차원의 충돌 아님.

**충돌 3: turn 1개 ↔ reports rev N개 (대상 3 단정에서 식별)**
- 단일 subagent 호출에서 여러 rev이 산출될 경우 turnId 매칭이 1:N. 기준 5는 "agentId 또는 turnId로 연결"만 요구 — 1:N 매칭도 link 충족. 단 frontmatter는 단일 turnId를 가짐 → 동일 turnId 가진 reports N개 = 정상 (rev 번호로 구분). 충돌 아님.

**충돌 4: subagentId 형식 다양성 (대상 3에서 식별)**
- session_090 turns의 subagentId는 17자 hex 형식 (`ae844b15ec6eda182`). 기존 reports의 `parentInstanceId`는 16자 hex (`a5eb841cc5684571f`) 또는 자유 텍스트 (`synthesis-after-arki-rev3`). 동일 식별자 체계 보장 부재 → canonical key 단정 시 turnId 우선이 충돌 회피에 유리.

### 우선순위 (영향 강도 순, 처방 아닌 영향 진단)

1. **대상 4 (agentsCompleted semantics) — 의미 변경 영향 최강**. schema 무변경이지만 모든 통계·dashboard·외부 코드 호환 영향.
2. **대상 3 (reports structure) — link key 부재가 schema 표현력 한계**. frontmatter 표준화 압력.
3. **대상 1 (turns schema) — link 필드 부재** (대상 3과 짝).
4. **대상 2 (hook point) — 검증 책임 확장 필요** (대상 4의 필터 로직 위치).
5. **대상 6 (regression test) — 검증 인프라 부재** (T1~T9 표면 신설 필요).
6. **대상 5 (legacy handling) — 현 schema로 충분, snapshot 보호 신호만 부재**.

---

## 종결

본 문서는 영향 진단만 수행했습니다. 처방 0건. 신규 파일 제안 0건. 코드 작성 0건. 일정·공수 0건. 9 기준은 변형 없이 박제 인용. session_090을 baseline으로 격상하지 않고 snapshot으로만 다뤘습니다.

다음 단계는 Master 결정사항이며 본 보고서 범위 밖입니다.
