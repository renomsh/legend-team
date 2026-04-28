---
role: arki
turnId: 1
invocationMode: subagent
topic: PD-052 역할 사칭 사후 차단 hook 구현
topicId: topic_128
sessionId: session_134
date: 2026-04-28
grade: B
executionPlanMode: plan
---

ARKI_WRITE_DONE: reports/2026-04-28_pd052-role-impersonation-post-hook/arki_rev1.md

## Arki — 구조적 실행계획

구조 설계자 Arki입니다.

실제 코드를 읽었습니다. 아래는 파일 분석 후 작성한 실행계획입니다.

---

### 코드 현황 요약 (파일 분석 결과)

**post-tool-use-task.js** 현재 turns[] push 구조:
```js
const newTurn = {
  role,      // extractRole()로 추출
  turnIdx,   // turns.length 기반 0-index
};
// selfScores 있으면 추가
turns.push(newTurn);
```
현재 `source` 필드 없음. `extractRole()`은 `## ROLE:` 마커 → subagent_type → description 첫 단어 순으로 식별.

**session-end-finalize.js** 기존 turns[] 관련 처리:
- `ensureEdiInAgents(sess)` — turns에서 role 추출, edi 없으면 push
- `filterAgentsCompletedByDualSatisfaction(sess)` — turns[].role에서 agentsCompleted 재생성
- `validateInlineRoleHeaders(sess)` — reports/*.md frontmatter의 role ↔ turns[turnId].role 비교
- `checkSelfScoreScale(sess)` — turns[].selfScores 값 범위 검증
- `appendOrUpdateSessionIndex(sess)` — turns[] 전파

**auditRoleImpersonation()** 는 현재 없음. Ace 프레이밍이 신규 함수로 추가를 결정.

**validate-session-turns.ts** 검증 대상 필드:
- `role` (필수), `turnIdx` (필수), `phase` (선택), `recallReason` (선택), `chars`/`segments` (선택)
- `source` 필드는 현재 Turn 타입에 없음 → 추가 시 검증 로직 영향 없음 (unknown 필드 무시)

---

### 섹션 1. 의존 그래프

```
Phase 1: source 마킹
    post-tool-use-task.js: turns[].source = "agent" 추가
         │
         ▼
Phase 2: auditRoleImpersonation() 구현
    session-end-finalize.js: 함수 인라인 추가
    → Phase 1 완료 후 turns[].source 필드 존재 전제
         │
         ▼
Phase 3: violations[] 스키마 + 경보 출력
    session-end-finalize.js: violations[] → sess.gaps 박제 + log 출력
    → Phase 2 완료 후 함수 내부에 통합 구현
         │
         ▼
Phase 4: dry-run 검증
    → Phase 1~3 완료 후 실제 세션 데이터로 검증
```

**병렬 가능 여부:**
- Phase 1과 Phase 2~3 초안 작성은 병렬 가능 (Phase 2는 source 필드 유무를 조건 분기로 처리 가능).
- Phase 4는 Phase 1~3 모두 완료 후에만 실행 가능.

---

### 섹션 2. Phase별 상세

#### Phase 1: post-tool-use-task.js에 `source: "agent"` 마킹 추가

**입력 (전제 조건):**
- `post-tool-use-task.js`가 Task/Agent 툴 완료 시 turns[] push를 정상 수행하고 있음 (현재 확인됨).
- 추가 위치: `newTurn` 객체 생성 직후, `turns.push(newTurn)` 이전.

**구현 내용:**
- 파일: `.claude/hooks/post-tool-use-task.js`
- 변경 함수: main IIFE 내 newTurn 생성 블록 (line 241-244)
- 변경 내용:
  ```js
  const newTurn = {
    role,
    turnIdx,
    source: 'agent',   // ← 추가. Agent 툴 경유 turn임을 명시
  };
  ```
- `source` 값은 `"agent"` 하드코딩. 이 hook은 Agent/Task 툴 PostToolUse에서만 발동하므로 조건 분기 불필요.

**검증 게이트 G1:**
- PASS 기준: `current_session.json.turns[*].source === "agent"` 확인 (신규 push된 turn에 한함).
- 기존 세션에 source 없는 turns[]가 있어도 오류 없이 통과할 것 (Phase 2의 null-safe 처리로 커버).

**롤백:**
- `source: 'agent'` 라인 1줄 제거. 기존 turns 필드 구조에 영향 없음.

---

#### Phase 2: `auditRoleImpersonation()` 함수 구현

**입력 (전제 조건):**
- Phase 1 완료 후 신규 turns에 `source` 필드 존재.
- `session-end-finalize.js`의 `validateInlineRoleHeaders()` 패턴 참조 (violations 수집 → gaps 박제).

**구현 내용:**
- 파일: `.claude/hooks/session-end-finalize.js`
- 추가 위치: `validateInlineRoleHeaders()` 함수 이후, main execution block(`(async()=>{...})()`) 이전.
- 함수 시그니처: `function auditRoleImpersonation(sess) { ... }`
- 로직:
  1. `sess.turns[]` 순회
  2. `turn.source`가 `null` 또는 `undefined`인 경우 → `"impersonation-suspect"` violations 항목 생성
  3. violations[]를 `sess.violations`에 저장 + `sess.gaps[]`에도 박제 (기존 gaps 패턴 재사용)
  4. violations 수 > 0이면 `log()` 경보 출력 (warn-only, 차단 없음)

**검증 게이트 G2:**
- PASS 기준: source=null/undefined인 turn에 대해 violations 항목 1건씩 생성됨.
- source="agent"인 turn은 violations 대상 아님.
- legacy=true 세션은 skip.

**롤백:**
- `auditRoleImpersonation(sess)` 함수 전체 제거 + main execution block에서 호출 라인 제거.

---

#### Phase 3: violations[] 스키마 + 경보 출력

**입력 (전제 조건):**
- Phase 2 auditRoleImpersonation() 내부에서 violations[] 구성.
- `current_session.json`에 `violations` 필드 추가 (기존 gaps와 별도 필드로 분리).

**구현 내용:**
- violations[]는 `sess.violations`에 저장 (session-level, gap과 별도).
- 동시에 `sess.gaps[]`에도 동일 항목을 push (기존 gaps 패턴 — Edi/Riki가 gaps를 보는 경로 재활용).
- 경보 log 형식: `⚠ impersonation-suspect ${N}건 → violations + gaps 박제`
- main execution block에 `auditRoleImpersonation(sess);` 호출 추가 위치: `validateInlineRoleHeaders(sess)` 바로 다음.
- `writeJson(CURRENT_SESSION_PATH, sess)` 호출은 이미 line 745에 있으므로 별도 추가 불필요 (auditRoleImpersonation 내에서 sess 변경만 하면 됨).

**검증 게이트 G3:**
- PASS 기준: 세션 종료 후 `current_session.json.violations[]`에 항목 있고, `current_session.json.gaps[]`에도 동일 내용 박제됨.
- log 출력에 `⚠` 포함.

**롤백:**
- violations 필드 기록 코드 + gaps push 코드 제거. `sess.violations = []` 코드 제거.

---

#### Phase 4: dry-run 검증

**입력 (전제 조건):**
- Phase 1~3 모두 완료.
- 테스트용 세션 데이터: source 없는 turn이 1개 이상 포함된 `current_session.json`.

**구현 내용:**
- `FINALIZE_CWD` 환경변수 + 테스트용 session JSON으로 `session-end-finalize.js` 수동 실행.
- 또는 실제 세션 종료 후 `current_session.json` 결과 확인.

**검증 게이트 G4 (최종 통과 기준):**
- G1~G3 모두 PASS.
- source 있는 turn → violations 미생성.
- source 없는 turn → violations 생성 + gaps 박제.
- legacy 세션 → auditRoleImpersonation skip (log 출력).
- 기존 `validateInlineRoleHeaders`, `checkSelfScoreScale` 등 다른 함수 동작 영향 없음.

**롤백:**
- Phase 1~3 롤백 합산. 이전 버전으로 복구 가능 (각 Phase 단독 롤백 가능).

---

### 섹션 3. `source` 필드 영향 분석

#### 3-1. post-tool-use-task.js 기존 코드 호환성

현재 `newTurn` 객체는 `role`, `turnIdx`, 조건부 `selfScores`만 포함. `source: "agent"` 추가는 단순 필드 추가이며:
- `turns.push(newTurn)` 로직 변경 없음.
- `turn_log.jsonl` append (`writeTurnLogEntry`) — extra 객체 전달 구조. `source` 필드는 extra에 포함하지 않으므로 영향 없음. (필요 시 `extra.source`로 전달 가능하나 현재 Ace 결정 범위 밖.)
- `missing-report gap` 기록 로직 (line 282~312) — `role` 체크만 사용. `source` 무관.

**결론: 호환성 문제 없음.**

#### 3-2. session-end-finalize.js 기존 turns[] 처리 영향

- `ensureEdiInAgents(sess)` — `t.role` 만 사용. source 무관.
- `filterAgentsCompletedByDualSatisfaction(sess)` — `t.role` 만 사용. source 무관.
- `validateInlineRoleHeaders(sess)` — `turns[turnId].role`만 참조. source 무관.
- `checkSelfScoreScale(sess)` — `turn.selfScores` 만 검사. source 무관.
- `appendOrUpdateSessionIndex(sess)` — `sess.turns`를 통째로 전파. source 필드도 함께 전파됨 → **session_index.json의 각 turn에 `source: "agent"` 필드 추가됨.** 구조적으로 허용 (JSON 유연성). 향후 조회 시 source 기반 필터링 가능해짐.

**결론: 기존 처리 로직 영향 없음. session_index 전파 시 source 필드 자연 포함.**

#### 3-3. validate-session-turns.ts 영향

현재 검증 대상 필드: `role`, `turnIdx`, `phase`, `recallReason`, `chars`, `segments`.
`source` 필드는 Turn 타입(`scripts/lib/turn-types.ts`)에 현재 없음.

두 가지 처리 옵션:
- **옵션 A (권장)**: `turn-types.ts`의 `Turn` 인터페이스에 `source?: "agent" | string` 추가. validate-session-turns.ts는 알 수 없는 필드를 ERROR 처리하지 않으므로 타입 추가만으로 충분.
- **옵션 B**: 타입 변경 없이 방치. JS 런타임에서 unknown 필드는 무시됨. 단, TypeScript 타입 엄격도에 따라 컴파일 경고 가능.

**권고: 옵션 A (turn-types.ts에 `source?: string` 추가). 1줄 변경, validate 로직 변경 없음.**

---

### 섹션 4. violations[] 스키마 설계

```json
{
  "violations": [
    {
      "type": "impersonation-suspect",
      "turnIdx": 0,
      "role": "ace",
      "source": null,
      "detected": "2026-04-28T17:30:00.000Z",
      "message": "turn[0] role=ace: source 필드 없음 — Agent 툴 미경유 직접 발언 의심"
    }
  ]
}
```

**필드 설명:**

| 필드 | 타입 | 설명 |
|---|---|---|
| `type` | string | 항상 `"impersonation-suspect"` (PD-052 전용 violation 타입) |
| `turnIdx` | number | 위반 의심 turns[]의 index |
| `role` | string | 위반 의심 turn의 role |
| `source` | string \| null | 실제 source 값 (null 또는 undefined이면 이 violations 생성됨) |
| `detected` | ISO 8601 string | 검출 시각 (`new Date().toISOString()`) |
| `message` | string | 사람이 읽을 수 있는 설명 |

**gaps 박제 형식 (기존 패턴 재사용):**
```json
{
  "type": "impersonation-suspect",
  "turnIdx": 0,
  "role": "ace",
  "source": null,
  "detectedAt": "2026-04-28T17:30:00.000Z",
  "note": "source 필드 없음 — Agent 툴 미경유 직접 발언 의심 (PD-052)"
}
```
※ gaps 항목은 기존 `detectedAt` + `note` 필드 관례 사용 (missing-report gap 패턴 참조).

---

### 섹션 5. 전제 조건 + 중단 조건

#### 전제 조건

1. **post-tool-use-task.js가 실제로 발동 중임.** Agent 툴 호출 시 PostToolUse hook이 `current_session.json.turns[]`에 push하고 있어야 함. 발동 안 되면 turns[]가 비어 source 필드 추가 의미 없음.
2. **turns[]의 role 추출이 정상 작동 중임.** `extractRole()`이 null 반환하면 turn push가 skip됨 — source 기반 감사의 전제 붕괴. Phase 1 전에 현 세션 turns[]에 실제 role이 박혀 있는지 확인 필요.
3. **session-end-finalize.js가 `sess.status === 'closed'`일 때만 실행됨.** auditRoleImpersonation은 세션 종료 시 일괄 실행이므로 실시간 차단은 설계 범위 밖.
4. **D-G 조건 (Transition Checkpoint 정책): PD-052 resolved 이후 활성화.** 현 토픽이 PD-052를 구현하는 토픽 자체이므로, Phase 4 검증 후 resolved 처리.

#### 중단 조건 (발견 시 Ace에 즉시 보고)

1. **post-tool-use-task.js의 PostToolUse hook이 현재 발동 안 되는 것으로 확인될 때.** Phase 1 구현 후 turns[]에 source 필드가 생기지 않으면 훅 설정 문제 먼저 해결 필요.
2. **`session-end-finalize.js`의 `validateInlineRoleHeaders()`와 로직 중복이 심각할 때.** 현재 `validateInlineRoleHeaders`는 reports/*.md 기반, `auditRoleImpersonation`은 turns[].source 기반으로 다른 축 — 중복 아님. 그러나 두 함수가 동일 violations 항목을 이중 생성하는 구조가 되면 중단 후 통합 설계 논의 필요.
3. **turns[].source 기반 감사가 오탐률이 높아 noise로 판단될 때.** 예: legacy 세션 데이터 마이그레이션 전에 source 없는 turn이 정상 처리된 것까지 impersonation-suspect로 잡히는 경우 → legacy 가드 강화 또는 기준 날짜 컷오프 추가 검토.
4. **`turn-types.ts` 타입 변경이 다른 스크립트에 컴파일 에러를 유발할 때.** 빌드 실패 시 타입 추가 방식 재검토.

---

### 설계 옵션 요약 (섹션 3-3 관련)

| 옵션 | 내용 | 장 | 단 |
|---|---|---|---|
| **A (권고)** | turn-types.ts에 `source?: string` 추가 | 타입 안정, IDE 자동완성 | 1줄 파일 변경 추가 |
| **B** | 타입 변경 없이 JS 런타임 의존 | 변경 최소화 | TS strict mode에서 경고 가능 |

**권고: 옵션 A.** Phase 2와 함께 turn-types.ts 1줄 수정 포함.

---

```yaml
# self-scores
aud_rcl: N
str_fd: 2
spc_lck: N
sa_rnd: 1
```
