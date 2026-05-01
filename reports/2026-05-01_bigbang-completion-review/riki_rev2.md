---
role: riki
session: session_163
topic: topic_141
topicSlug: bigbang-completion-review
date: 2026-05-01
rev: 2
turnId: 2
invocationMode: subagent
accessed_assets:
  - reports/2026-05-01_bigbang-completion-review/arki_rev2.md
  - .claude/hooks/pre-tool-use-task.js (buildSessionLayer 실측)
  - .claude/hooks/post-tool-use-task.js (turn push 로직 실측)
  - memory/sessions/current_session.json (session_163 turns 실측)
---

## Riki

코드 실측 후 발언한다. Arki 발언 인용 기반, 실제 hook 코드 교차 검증 완료.

---

### 🟡 R-1. Phase 1 전제 오류 — "source=N/A = Nexus inline 기록" 가정이 과도하게 단순함

**원문 인용 (Arki sec 3.2):**
> "Nexus(Main 컨텍스트)가 역할 발언을 요약·정리한 후 current_session.turns에 직접 편집(Edit 툴)으로 push하고..."

**실제 코드 교차 확인:**
post-tool-use-task.js line 248: `source: 'agent'` 를 **무조건** 박제한다. source=N/A turn이 post-tool-use-task를 경유할 수 없다. 즉 source=N/A turn은 hook 외부 경로 — 구체적으로는 Edit 툴 직접 write 또는 Bash write — 로만 생성된다.

**그러나 문제는 여기에 있다**: Phase 1 필터 로직이 `source=N/A + 같은 역할 source=agent turn 공존 시 inject 제외`를 제안하는데, source=N/A turn이 **발언 내용이 있는 경우**도 있다. 예: session_161 turn 0(ace, source=N/A)는 `chars=1800`, `reportPath=...ace_rev3.md` 필드가 있다. 이 보고서는 실제 내용을 담고 있으며, Arki는 "동일 보고서 파일 2회 inject"가 문제라고 했다.

**핵심 점검**: `findLatestReport`는 `{role}_rev*.md` 중 mtime 최신 1건을 반환한다. source=N/A turn과 source=agent turn이 **서로 다른 rev를 가리킬 수 있는가?** 가능하다. inline 기록 시점(rev1 작성)과 Agent 호출 완료 시점(rev2 작성)이 다를 경우, `findLatestReport`는 두 turn 모두에 대해 **mtime 최신 = rev2** 를 반환한다. 결국 두 turn이 동일 파일(rev2)을 가리키므로 Arki 판단대로 중복 inject이다.

**실제 위험**: Phase 1 필터(`agentTurnRoles` 기반)는 정당한 재호출 케이스와 타입 B inline 오기록을 구분 못한다. Arki가 "recallReason 있는 inline turn은 예외"를 제안했는데, 실제 코드를 보면 post-tool-use-task.js의 `writeTurnLogEntry`에 recallReason 파싱이 있지만(line 135), **session_163 current_session.json의 실측 turns[]에는 recallReason 필드가 없다**. recallReason은 tool_response 내 extra 필드로 넘어오는데, 현재 post-tool-use-task.js에서 tool_response에서 recallReason을 추출하는 코드가 없다.

**결론**: "recallReason이 inline turn에 박제되는 경우가 실제로 있는가" — **없다.** post-tool-use-task.js 코드에 recallReason 추출 로직 자체가 없다. Phase 1의 recallReason 예외 처리는 현재 코드 기반에서는 사문이다.

**완화 조건**: Phase 1 구현 시 recallReason 예외를 turns[].recallReason 필드 체크로 설계하되, 이 필드가 현재 박제되지 않음을 인지하고 "없으면 예외 없는 것"으로 처리. 구현은 단순화: `source=N/A AND 같은 역할 source=agent turn 존재 → inject 제외` (recallReason 조건 제거). 재호출(D-048 규약상 turns에 recallReason 있어야 하나 실제 미박제)은 별도 이슈로 추적.

---

### 🔴 R-2. buildSessionLayer 실제 코드 동작이 Arki 분석과 다름 — 중복 inject 문제가 이미 부분 해결됨

**원문 인용 (Arki sec 1-5):**
> "같은 역할이 복수 turn에 존재 시 seenRoles map에 role_turnN 키로 저장 → 복수 turn이 모두 inject됨"

**실제 코드 (pre-tool-use-task.js line 252–273) 실측:**

```js
const seenRoles = new Map(); // role -> { turnIdx, reportFile }
for (const t of turns) {
  seenRoles.set(`${role}_turn${turnIdx}`, { role, turnIdx, reportFile });
}
// turn 순서대로 정렬하여 inject
const entries = [];
for (const t of turns) {
  const key = `${role}_turn${turnIdx}`;
  if (seenRoles.has(key)) {
    entries.push({ ...seenRoles.get(key) });
    seenRoles.delete(key); // 중복 방지
  }
}
```

주석은 "동일 역할 복수 발언 시 모두 포함"이라 하나, 실제 동작은 **`role_turnN` key로 중복 방지를 한다** (`seenRoles.delete(key)`). 즉 동일 role이라도 turnIdx가 다르면 별개 key(`ace_turn0`, `ace_turn1`)로 관리되어 **둘 다 inject된다**. Arki 판단은 정확하다.

**그러나 이것이 R-2로 등재되는 이유**: 동일 key가 존재할 경우(`source=N/A turn과 source=agent turn이 같은 turnIdx를 가지면`) seenRoles.delete 후 두 번째 push가 없어 문제 없다. 그런데 **실제로는 turnIdx가 다르다** — source=N/A turn은 Edit 직접 push이므로 turnIdx를 직접 박제하고, source=agent turn은 post-tool-use-task가 `turns.length` 기준으로 자동 부여한다. 따라서 두 turn은 항상 다른 turnIdx를 가지며 둘 다 inject된다.

**파손 범위**: findLatestReport는 mtime 최신 1건만 반환 → 두 turn 모두 동일 파일 가리킴 → inject 중복. 토큰 낭비 + 다음 서브에이전트에게 동일 보고서가 2회 나타남.

**완화 조건**: Arki Phase 1 필터가 source=N/A turn을 inject에서 제외하면 이 문제는 해소된다. Phase 1이 R-2 위험을 직접 해소하는 구조이므로 추가 대응 불필요. **Phase 1 구현 검증 게이트(G1)에 "동일 보고서 2회 inject 없음" 확인 항목 추가 권고**.

---

### 🟡 R-3. Phase 2 false positive — 정당한 Arki 재소집이 `duplicate-agent-turn` 경고로 잡힘

**전제**: Phase 2는 "동일 세션 내 같은 역할 source=agent turn이 이미 있으면 duplicate-agent-turn gap 박제"다.

**문제**: D-019 / CLAUDE.md Nexus 오케스트레이션 프로토콜에 따르면 "Arki를 결정 이후 실행계획 재소집"이 정규 패턴이다. 이 경우 arki source=agent turn이 2건이 된다. Arki가 자기감사에서 이미 지적했으나(line 257–259), "recallReason 없는 agent turn만 포함"으로 수정 방안을 제안했다.

**핵심 리스크**: recallReason이 현재 post-tool-use-task.js에 추출 로직이 없다(R-1에서 확인). 따라서 Arki 수정안도 현재 코드 기반에서는 사문이다. Phase 2를 그대로 구현하면 **모든 정당한 재소집이 duplicate-agent-turn 경고로 기록**된다.

**파손 범위**: gaps에 false positive 누적 → session-end-finalize.js가 gaps를 경보로 처리하면 오탐 경보 → 향후 감사 신뢰성 저하.

**완화 조건**: Phase 2 구현 시 post-tool-use-task.js에 recallReason 추출 로직을 함께 추가하거나, 또는 Phase 2를 "warn-only + 검증자가 수동 확인" 레벨로 명시하여 자동 경보 연동 금지. 후자가 더 안전하다 — recallReason 추출은 별도 결정(새 D-xxx) 필요.

---

### 패스 항목 (확신 없어 제외)

- **타입 A와 타입 B 혼재 케이스**: Phase 1이 source=N/A turn을 제외하면, 타입 A(Agent 이중 호출)는 두 turn 모두 source=agent이므로 Phase 1 필터 적용 안 됨. Phase 2 경고가 잡는 구조. 혼재 케이스 특이 동작 없음 — 패스.

- **topic_141 close 조건**: Phase 1 + Phase 2 G1/G2 충분 여부는 Ace 판단 영역. Riki는 위 3건 리스크만 지적. 잔존 항목 추가 발굴 없음.

---

[ROLE:riki]
# self-scores
crt_rcl: Y
cr_val: 4
prd_rej: Y
fp_rt: 0.10
