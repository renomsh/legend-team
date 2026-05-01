---
role: arki
session: session_163
topic: topic_141
topicSlug: bigbang-completion-review
date: 2026-05-01
rev: 2
turnId: 1
invocationMode: subagent
accessed_assets:
  - .claude/hooks/session-end-finalize.js
  - .claude/hooks/pre-tool-use-task.js
  - .claude/hooks/post-tool-use-task.js
  - memory/shared/dispatch_config.json
  - memory/sessions/session_index.json (session_160, session_161)
  - memory/sessions/current_session.json
---

## Arki

### 1. turns 중복 기록 패턴 — 실제 코드 분석

#### 1-1. 실측 데이터 확인

session_160 turns:
```
turn 0: ace  source=agent  phase=framing
turn 1: arki source=agent  phase=analysis
turn 2: riki source=agent  phase=risk-audit
turn 3: ace  source=agent  phase=synthesis
turn 4: dev  source=agent  phase=implementation
turn 5: edi  source=agent  phase=compile
turn 6: edi  source=agent  (phase 없음)
```

session_161 turns:
```
turn 0: ace  source=N/A   phase=framing  chars=1800  reportPath=...ace_rev3.md
turn 1: ace  source=agent (phase 없음)
turn 2: dev  source=agent  phase=implementation
turn 3: dev  source=agent  (phase 없음)
turn 4: edi  source=agent  phase=compile
```

#### 1-2. 중복 발생 경로 식별

**경로 A — session_160 edi 이중 기록 (turn 5, turn 6)**

두 개 모두 `source=agent`. 즉 두 번 Agent 툴이 실제로 호출됨. turn 5는 `phase=compile` 박제, turn 6은 phase 없음. `ensureEdiInAgents()`는 edi가 없을 때만 push하므로 이 중복은 hook 기인이 아님. **Nexus가 Edi를 두 번 Agent 툴로 호출한 것**이 원인. post-tool-use-task.js는 Agent 툴 완료마다 무조건 push(dedup 없음) → turn 5, turn 6 이중 박제.

**경로 B — session_161 ace 이중 기록 (turn 0, turn 1), dev 이중 기록 (turn 2, turn 3)**

- turn 0(ace): `source=N/A`, `phase=framing`, `chars=1800`, `reportPath=...` → **post-tool-use-task.js가 박제한 turn이 아님**. source 필드가 없고 chars·reportPath가 있는 구조는 post-tool-use-task.js 출력 스키마와 불일치. Nexus 또는 다른 경로가 current_session.json.turns에 직접 인라인 push한 결과.
- turn 1(ace): `source=agent` → post-tool-use-task.js가 Agent 툴 완료 후 정상 박제.

**결론: 두 가지 별개 경로**

| 타입 | 세션 | 경로 | 메커니즘 |
|---|---|---|---|
| Agent 이중 호출 | session_160 edi | A | Nexus가 Edi를 Agent 툴로 2회 호출 → post-tool-use-task 2회 push |
| Inline 선기록 + Agent 후기록 | session_161 ace, dev | B | Nexus가 subagent 호출 전 current_session.turns에 직접 push → post-tool-use-task가 Agent 완료 후 재push |

#### 1-3. post-tool-use-task.js 중복 방지 로직 부재 확인

post-tool-use-task.js line 243–258:
```js
const turns = Array.isArray(sess.turns) ? sess.turns : [];
const turnIdx = turns.length;
const newTurn = { role, turnIdx, source: 'agent' };
// ...
turns.push(newTurn);
sess.turns = turns;
```

**dedup 로직 없음**. 동일 역할이 이미 존재해도 무조건 append. `turnIdx`는 배열 길이 기반 순번 자동 부여.

#### 1-4. enforceEdiAgentSource에서 중복 turns의 영향

`enforceEdiAgentSource` (line 984–1019):
```js
const hasEdiAgentTurn = turns.some(t => t && t.role === 'edi' && t.source === 'agent');
```

**직접 영향 없음**. `some()`은 1건만 있어도 true 반환. edi 중복 turn은 false negative를 유발하지 않는다.

`auditEdiLlmInvocation` (line 852–969):
```js
const llmEdiTurn = turns.some(t => t && t.role === 'edi' && t.source === 'agent');
```

동일하게 `some()` 사용 → 중복이 false positive/negative를 유발하지 않음.

**그러나 간접 영향 존재:**

1. **runChecklistDeltaCheck** (line 348–413) — `speakingRoles = [...new Set(turns.map(t => t.role)...)]` : Set 사용으로 중복 역할은 1건으로 압축됨 → 영향 없음.
2. **filterAgentsCompletedByDualSatisfaction** (line 77–87) — `turns.map(t => t.role)` : 중복 허용 배열 생성됨 → `agentsCompleted`에 동일 역할이 2회 들어감. 이는 D-048 "중복 허용 배열" 설계 의도이므로 의도적 동작.
3. **buildSessionLayer** (pre-tool-use-task.js, line 242–289) — 같은 역할이 복수 turn에 존재 시 seenRoles map에 `role_turnN` 키로 저장 → 복수 turn이 모두 inject됨. **동일 역할 발언이 2회 inject**될 수 있음.

#### 1-5. buildSessionLayer 영향 — 실질적 문제

pre-tool-use-task.js line 259–286:
```js
const seenRoles = new Map(); // role -> { turnIdx, reportFile }
for (const t of turns) {
  const role = t.role || '?';
  const turnIdx = t.turnIdx ?? '?';
  const reportFile = findLatestReport(cwd, reportPath, role);
  if (reportFile) {
    // 동일 역할 복수 발언 시 모두 포함 (rev 번호로 구분됨)
    seenRoles.set(`${role}_turn${turnIdx}`, { role, turnIdx, reportFile });
  }
}
```

주석이 "동일 역할 복수 발언 시 모두 포함"이라 명시. 설계 의도는 재호출(recallReason: post-intervention) 시 두 발언을 모두 inject하는 것. **그러나 Inline 선기록(turn 0, source=N/A)과 Agent 후기록(turn 1, source=agent)이 같은 역할이면 동일 보고서 파일을 두 번 inject**하게 됨. `findLatestReport`는 `{role}_rev*.md` 중 mtime 최신 1건을 반환 → 두 turn 모두 동일 파일을 가리킴 → 중복 inject.

---

### 2. dispatch_config.json Edi rule 현황

#### 2-1. 실측 확인

`dispatch_config.json`의 `rules` 키:
- `jobs` 존재
- `sage` 존재
- `zero` 존재
- **`edi` 없음 — 확인됨**

#### 2-2. pre-tool-use-task.js의 dispatch_config read 여부

pre-tool-use-task.js 전체 코드 검토 결과: **dispatch_config.json을 read하는 코드 없음**. hook은 다음 파일만 read:
- `memory/sessions/current_session.json`
- `memory/shared/topic_index.json`
- `memory/roles/policies/_common.md`
- `memory/roles/policies/role-{role}.md`
- `memory/roles/personas/role-{role}.md`
- topic_contributions 및 reports 파일들

dispatch_config.json은 `pre-tool-use-task-sage-gate.js`만 read (`rules.sage.session_isolation` 체크용).

**ghost rule 위험 현황**: dispatch_config에 edi rule을 추가해도 현재 어떤 hook도 이를 read·enforce하지 않음. Jobs의 "현재 조치 불가" 판단이 정확하다.

---

### 3. 구조적 판정

#### 3-1. turns 중복 패턴의 실제 영향 범위

| 영향 대상 | 타입 B (inline + agent) | 타입 A (agent 이중 호출) | 심각도 |
|---|---|---|---|
| enforceEdiAgentSource | 영향 없음 (some() 충분) | 영향 없음 | 낮음 |
| auditEdiLlmInvocation | 영향 없음 | 영향 없음 | 낮음 |
| buildSessionLayer inject 중복 | 동일 파일 2회 inject 가능 | 동일 파일 2회 inject 가능 | 중간 |
| agentsCompleted 중복 | 중복 허용 설계 — 무해 | 중복 허용 설계 — 무해 | 낮음 |
| D4 prime directive 감사 신뢰성 | inline turn은 source 없음 → auditRoleImpersonation이 legacy-unmarked 처리 | 정상 | 중간 |

**핵심 판정**: enforceEdiAgentSource / auditEdiLlmInvocation의 Edi 탐지 신뢰성에는 현재 직접 영향 없음. 그러나 다음 두 가지가 실질 문제:

1. **타입 B (inline 선기록)**: source=N/A turn이 turns[]에 존재 → auditRoleImpersonation이 이를 legacy-unmarked로 분류하고 warnings만 출력. 이 패턴이 반복되면 D4 감사에서 Agent 미경유 발언을 합법화하는 것처럼 보일 수 있음.

2. **buildSessionLayer 중복 inject**: 토큰 낭비 + 같은 보고서가 2회 나타나 다음 서브에이전트 혼란 유발 가능 (주석에는 의도적이라 했지만, 타입 B의 inline turn은 실제 subagent 발언이 아님).

#### 3-2. 타입 B 발생 원인 — 가장 유력한 가설

Nexus(Main 컨텍스트)가 역할 발언을 요약·정리한 후 `current_session.turns`에 직접 편집(Edit 툴)으로 push하고, 이후 Agent 툴로 서브에이전트도 호출 → post-tool-use-task가 Agent 완료 후 추가 push. 이를 검증하려면 session_161의 해당 transcript를 확인해야 하지만 현재 접근 불가. 그러나 구조적으로 이 경로가 유일하게 설명 가능.

#### 3-3. 해소 방안 구조적 실현 가능성

**타입 A (Agent 이중 호출)**: 방지하려면 post-tool-use-task.js에 역할·세션 기반 dedup 로직 추가. 단, D-048 "중복 허용 배열" 정책과 충돌. 재호출(recallReason)은 정당한 복수 turn이므로 **역할 + 세션 기반 단순 dedup은 부적절**. 대신 timestamp 기반 인접 중복 감지(동일 역할, 세션 내 1분 이내 2회 push → warning)가 더 적합.

**타입 B (inline + agent)**: 근본 해소는 Nexus가 inline push 중단. hook으로는 source=N/A turn을 감지하여 경고 발령(현재 auditRoleImpersonation이 이미 "legacy-unmarked"로 처리). buildSessionLayer에서 source=N/A turn 중 이미 같은 역할 source=agent turn이 동일 세션에 있으면 inject 생략하는 필터 추가가 적합.

---

### 4. 구조적 실행계획

`executionPlanMode: conditional` — turns 중복 패턴이 실질 문제(Jobs 판단: turns 중복 = 감사 신뢰성 직결)임을 확인. 실행계획 포함.

#### Phase 0: 전제 확인

현재 상태:
- turns 중복은 enforceEdiAgentSource 탐지 정합성에 직접 영향 없음 — 확인됨
- 타입 B(source=N/A + agent 이중 박제)가 D4 감사 신뢰성에 간접 영향
- buildSessionLayer가 동일 파일을 2회 inject할 수 있음 — 토큰 낭비 및 혼란

#### Phase 1: buildSessionLayer inline turn 필터링

**변경 파일**: `.claude/hooks/pre-tool-use-task.js`

```
buildSessionLayer() 내 entries 수집 시:
  - 같은 역할에 source=agent turn AND source=N/A turn이 공존하면
    source=N/A turn은 inject에서 제외
  - 필터 조건: agentTurnRoles = Set(turns where source=agent mapping role)
    entries에서 source=N/A turn은 agentTurnRoles에 같은 role이 있으면 skip
```

검증 게이트 G1: session_163 종료 후 pre-tool-use-task.log에 session layer inject 중복 없음 확인.

**의존**: 없음 (pre-tool-use-task.js 단독 변경)

**롤백**: 필터 로직 제거 → 원래 동작 복구. 세션 데이터에 영향 없음.

#### Phase 2: post-tool-use-task.js 인접 중복 경고

**변경 파일**: `.claude/hooks/post-tool-use-task.js`

```
turn push 전:
  최근 N=2 turns 내 동일 role이 source=agent로 이미 있으면
  current_session.gaps에 'duplicate-agent-turn' 경고 박제
  (push 자체는 허용 — D-048 중복 허용 정책 유지)
```

검증 게이트 G2: session 종료 시 gaps에 duplicate-agent-turn 없음 확인.

**의존**: G1 완료 후 진행 권장 (로그 노이즈 분리)

**롤백**: 경고 로직 제거. 세션 데이터는 gaps 항목만 추가되므로 무해.

#### 의존 그래프

```
Phase 1 (pre-tool-use-task 필터) ──→ G1 검증
                                      ↓
Phase 2 (post-tool-use-task 경고) ──→ G2 검증
                                      ↓
                               topic_141 close 판정
```

#### 전제 조건

- Phase 1: pre-tool-use-task.js의 buildSessionLayer 함수 변경 범위 = 15줄 이내
- Phase 2: post-tool-use-task.js의 turn push 직전 중복 감지 로직 = 10줄 이내

#### 중단 조건

- Phase 1 변경이 buildSessionLayer의 정당한 재호출 turn까지 제외하면 즉시 중단. 재호출 turn(recallReason 있는 것)은 보존되어야 함.
- dispatch_config Edi rule 추가는 현재 hook 미구현 상태에서 Phase 3으로 적용 불가 — 이번 세션 범위 밖 (Jobs scope out 확인).

---

### 자기감사 (1차)

**structuration**: Phase 1/2 분리 타당. buildSessionLayer와 post-tool-use-task는 SRP 관점 별개 파일. 의존 그래프 선후 명확.

**hardcoding**: Phase 1 필터 조건에 N=2 같은 하드코딩 없음. 소스 기반 필터.

**efficiency**: Phase 1은 `Set` 구성 1회 → O(n) 스캔으로 충분. 불필요한 중복 없음.

**extensibility**: dispatch_config Edi rule 추가는 별도 Phase — enforce hook 구현 후 순서대로 진행 가능 구조.

결함 발견 1건: Phase 2의 "최근 N=2 turns" 기준이 모호. 정확한 기준은 "동일 세션 내 같은 역할 source=agent turn 이미 존재하면" — N 기준 제거하고 세션 전체 스캔으로 수정 필요.

→ **Phase 2 수정**: `const recentAgentTurnRoles = new Set(turns.filter(t => t.source === 'agent').map(t => t.role)); if (recentAgentTurnRoles.has(role)) { /* warning */ }`

이 경우 재호출(recallReason: post-intervention) 시 2번째 ace turn도 경고 발령됨. **재호출은 정당** — 재호출 turn은 경고 제외 필요.

수정: `recentAgentTurnRoles`에 `recallReason` 없는 agent turn만 포함. recallReason 있는 turn은 의도적 복수 발언 → dedup 대상 아님.

결함 발견 2건. 자기감사 1라운드 완료.

---

ARKI_WRITE_DONE: reports/2026-05-01_bigbang-completion-review/arki_rev2.md

[ROLE:arki]
# self-scores
aud_rcl: Y
str_fd: 2
spc_lck: N
sa_rnd: 1
