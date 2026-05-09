---
role: zero
session: session_220
topic: topic_186
date: 2026-05-09
turnId: 2
invocationMode: subagent
---

# Zero D.Condense — PD-071 Nexus Direct Turns Insert

대상: `session-end-finalize.js` `ensureNexusTurnIfDirectWork()` (1197-1218행)

---

## A. Cut (tech-debt)

### 점검 결과

**`writeJson(CURRENT_SESSION_PATH, sess)` 중복 호출 위험 — 경미한 부채.**

`ensureNexusTurnIfDirectWork`는 1216행에서 `writeJson`을 직접 호출한다. 그런데 main()의 1864행에서 `writeJson(CURRENT_SESSION_PATH, sess)`를 다시 한 번 호출한다 (전체 sess 직렬화). 즉 삽입 케이스에서 같은 파일에 2회 write가 발생.

- **위험도**: 낮음. 두 번째 호출이 최종 상태를 덮어쓰므로 데이터 손실은 없다.
- **부채 성격**: 중간 write가 crash 시 부분 상태를 남길 수 있다. (TOCTOU 아님, 단순 중복)
- **판단**: 제거 가능. `ensureNexusTurnIfDirectWork` 내부 `writeJson` 제거하고 in-memory 변경만 수행하면 main()의 1864행 write가 최종 박제를 담당한다. 단, 현재 동작은 correct하므로 즉시 cut 아님 — 리팩토링 리포트 항목으로 기록.

**legacy 가드 범위 확인**

`sess.legacy === true` 체크가 1198행에 존재. 기존 레거시 세션 오염 방지 완비.

**`joinOrphanPendingTurns` 이후 위치 타당성**

`joinOrphanPendingTurns`가 먼저 실행되어 pending_turns를 turns[]에 흡수한 뒤, 그 결과가 비어있는 경우에만 `ensureNexusTurnIfDirectWork`가 삽입한다. 순서 올바름. 역순이면 orphan pending이 있는 세션에 nexus direct turn이 잘못 삽입된다.

**삭제 목록**: 없음. 리팩토링 후보(중복 writeJson)만 기록.

---

## B. Refine (simplify)

### 함수 구조

```js
// 현재 (22줄)
function ensureNexusTurnIfDirectWork(sess) {
  if (sess.legacy === true) { ... return; }
  const turns = Array.isArray(sess.turns) ? sess.turns : [];
  if (turns.length > 0) { ... return; }
  const nexusTurn = { role:'nexus', turnIdx:0, source:'direct', phase:'execution',
    _autoInserted:true, _ref:'PD-071' };
  sess.turns = [nexusTurn];
  writeJson(CURRENT_SESSION_PATH, sess);  // ← 중복 write (위 Cut 참조)
  log('...');
}
```

**3줄 패턴 중복**: 없음. 이 함수는 1회 사용 목적의 단일 책임 함수.

**조기 추상화**: 없음.

**정제 판단**: "그대로 둔다" — 22줄, 명확한 단일 책임. 억지 단축 불필요.

---

## C. Audit (security-review)

### 대상: `ensureNexusTurnIfDirectWork` 및 삽입 turn 객체

| 위치 | 유형 | 내용 |
|---|---|---|
| 없음 | — | — |

하드코딩된 secret / credential / 절대 경로 **0건**.

**`source:'direct'` → `auditRoleImpersonation` false positive 분석:**

`auditRoleImpersonation`(1067-1088행)은 `turn.source === 'agent'`인 경우만 정상으로 보고, 나머지를 `legacyUnmarkedCount++`로 처리한다. 삽입된 nexus turn은 `source:'direct'`이므로 `legacyUnmarkedCount`에 포함되어 `"legacy-unmarked turns 1건"` 로그가 출력된다.

- **위험도**: 낮음. violations는 생성되지 않는다 (Phase 1 배포 전 legacy-unmarked 처리 — violations 미생성 분기).
- **오탐 방향**: turns[]가 비어있는 순수 Nexus 직접 작업 세션이 아닌데 turns[]가 비어있는 경우 — 예를 들어 Agent 툴을 사용했으나 pending_turns write에 실패한 세션. 이 경우 nexus direct turn이 잘못 삽입된다.
  - `joinOrphanPendingTurns`는 `turnPushMode !== 'nexus'` 이면 skip하므로, hook 모드 세션(`turnPushMode` 미설정 또는 다른 값)에서 Agent 실패가 발생하면 orphan recovery도 안 되고 nexus turn이 삽입된다.
  - **실제 발생 가능성**: 낮음. hook 모드 세션은 turns[]를 PostToolUse에서 직접 push하므로 비어있기 어렵다.
- **결론**: 보안 취약점 아님. false positive 가능성 이론적으로 존재하나 운영 영향 낮음. 추적 필요 시 `_autoInserted: true` 마킹이 이미 삽입 출처를 구분한다.

**총 Audit 건수**: 0건 (CRITICAL/WARN 없음).

---

## 종합

| 영역 | 결과 |
|---|---|
| tech-debt | 중복 writeJson 리팩토링 후보 1건 (non-blocking) |
| security-review | 하드코딩 0건. source:'direct' → legacy-unmarked 로그 출력은 known behavior, violations 0건 |
| simplify | 정제 대상 없음. 함수 구조 적절 |

**D.Condense Phase A 대상 역할 보고서**: session_220 내 이전 역할 보고서 없음 (Zero가 첫 번째 역할). Phase A skip.
