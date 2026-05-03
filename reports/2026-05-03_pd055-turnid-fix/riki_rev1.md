---
role: riki
session: session_178
topic: topic_154
topicSlug: pd055-turnid-fix
date: 2026-05-03
turnId: 2
rev: 1
invocationMode: subagent
---

# Riki — PD-055 서브에이전트 turnId fix 리스크 감사

## R-2 검증 결과: turnId는 실제로 consume됨 — fix ROI > 0 확인

`session-end-finalize.js` line 469–486을 직접 확인:

```js
const turnIdMatch = fmText.match(/^turnId:\s*(\d+)/m);
const turnId = turnIdMatch ? parseInt(turnIdMatch[1], 10) : null;
if (!role || turnId === null) continue; // 식별 불가 — skip
if (turnId < turns.length) {
  const turnRole = turns[turnId] && turns[turnId].role;
  if (turnRole && turnRole.toLowerCase() !== role) {
    violations.push({ type: 'inline-role-header-mismatch', ... turnId });
  }
}
```

`turnId`를 index로 `turns[turnId].role`에 접근해 교차검증. turnId가 1 틀리면 turns[2]에서 "riki"를 찾아야 하는데 turns[3] (dev)을 조회 → `inline-role-header-mismatch` gap 오탐 발생. **R-2는 실체 리스크였음. Fin 기각 판단 재검토 필요.**

---

### 🔴 R-1. PostToolUse 병렬 fire 시 turns.length race condition — 미검증

**근거:** `post-tool-use-task.js` line 243–244:
```js
const turns = Array.isArray(sess.turns) ? sess.turns : [];
const turnIdx = turns.length;
```
Riki·Dev 병렬 dispatch 완료 → 두 PostToolUse hook이 동시에 `current_session.json` read → 둘 다 `turns.length = N`을 읽음 → 둘 다 `turnIdx = N`으로 push → N, N 중복 기록 → `validate-turns-integrity.ts`가 `turnIdx 중복` ERROR로 처리.

**옵션 (a) 제안의 정정 패치** (line 244의 `turnIdx`를 보고서에 write)는 이 race를 그대로 상속. hook이 "정확한 turnIdx를 알고 있다"는 전제가 병렬 실행에서 틀림.

**파손 범위:** turns[] 중복 기록 → validate-turns-integrity FAIL → session-end-finalize gaps 박제 → 누적 시 경보 증폭.

**완화 조건:** Claude Code Agent 툴의 PostToolUse hook이 실제로 병렬 fire되는지 확인 필요. 단일 스레드 Node.js 프로세스가 hook을 순차 실행한다면 race 미발생. **현재 미검증 상태가 리스크 본체.** 구현 전 Claude Code hook execution model 확인 필수.

---

### 🟡 R-3. 보고서 파일 경로 추출 실패 시 패치 무음 skip

**근거:** `extractReportsPath()`는 `{ROLE}_WRITE_DONE:` 마커가 tool_response 첫 1000자에 없으면 `null` 반환. 서브에이전트가 WRITE_DONE 마커를 누락하거나 응답이 잘린 경우, 패치 대상 파일 경로를 특정할 수 없음.

**파손 범위:** 패치 자체가 silent skip → turnId 오류 보고서가 그대로 잔존 → 하류 gap 계속 발생. 수리됐다고 믿지만 실제로는 아닌 상태.

**완화 조건:** 패치 성공/실패 여부를 `current_session.json.gaps`에 명시 기록해야 탐지 가능. silent pass 기본값은 위험.

---

## 의도적 제외

- Fin이 다룬 "downstream consume 없음 → ROI 0" 리스크 → 코드 확인으로 반증, 제외
- "보고서 파일이 아직 미작성 상태에서 hook 실행" 시나리오 → PostToolUse는 서브에이전트 완료 후 fire되므로 파일 존재 가능성 높음, 확신 부족하여 제외

