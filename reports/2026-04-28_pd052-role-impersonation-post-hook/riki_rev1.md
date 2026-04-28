---
role: riki
turnId: 2
invocationMode: subagent
topic: PD-052 역할 사칭 사후 차단 hook 구현
topicId: topic_128
sessionId: session_134
date: 2026-04-28
grade: B
---

RIKI_WRITE_DONE: reports/2026-04-28_pd052-role-impersonation-post-hook/riki_rev1.md

## Riki — 리스크 감사

리스크 감사자 Riki입니다.

코드를 직접 읽었습니다. 확신 있는 리스크 2건만 제기합니다.

---

### 🔴 R-1. source 필드 부재 = "사칭 의심" 등치 — 레거시 turns가 전부 violations로 박제됨

**원문 인용 (Arki Phase 2 로직):**
> "turn.source가 null 또는 undefined인 경우 → impersonation-suspect violations 항목 생성"

**실패 지점:**
현재 `current_session.json.turns[0]`, `turns[1]` 모두 source 필드 없음 (코드 확인됨: line 241-244, source 없이 push). Phase 1이 배포되면 그 시점 이후 turns만 `source: "agent"`를 갖는다. 그러나 **같은 세션 내에서** Phase 1 배포 전에 push된 turns — 즉 이번 세션 자체의 ace turn(0), arki turn(1) — 은 source=undefined다.

세션 종료 시 `auditRoleImpersonation()`이 실행되면 이 2건이 즉시 `impersonation-suspect`로 gaps에 박제된다. 정상 발언임에도 사칭 경보 발생.

**파손 범위:**
- 최초 배포 세션(session_134 포함)의 모든 gaps에 false-positive가 박제됨.
- 운영자가 gaps 리스트를 보면 "사칭 발생?" 오인 가능.
- validate-session-turns.ts가 gaps 기반 경보를 강화하면 연쇄 오경보.

**완화 조건:**
- Arki 실행계획에 "source=null/undefined → impersonation-suspect" 로직이 기술되어 있으나 같은 세션 내 레거시 turns에 대한 예외 처리가 빠져 있음.
- **mitigation**: auditRoleImpersonation() 내에서 source가 없는 turn에 대해 `impersonation-suspect`가 아닌 `impersonation-unknown-legacy`로 분리 마킹. violations 경보는 `source: "agent"`인 turns에서 **role 변조**가 탐지될 때로 한정.
- **fallback**: Phase 1 배포 이전 세션을 `legacy: true`로 소급 마킹 가능. 기존 `legacy === true` 가드(post-tool-use-task.js line 228-231)와 동일 패턴.

---

### 🟡 R-2. extractRole() null 반환 시 turn push skip → audit 사각지대

**원문 인용 (post-tool-use-task.js line 233-237):**
```js
const role = extractRole(input.tool_input || input.toolInput);
if (!role) {
  log('role 추출 실패, silent pass');
  process.exit(0);
}
```

**실패 지점:**
`## ROLE:` 마커가 없거나 subagent_type이 비어 있으면 role 추출 실패 → `process.exit(0)` → **turn이 아예 push되지 않음**. source 기반 audit은 "push된 turn에 source가 있는가"를 검사하지, "push되어야 할 turn이 누락됐는가"를 검사하지 않는다.

즉 사칭 주체가 `## ROLE:` 마커를 누락하면: turn push skip → audit 대상 없음 → violations 0건 → 경보 없음.

**파손 범위:**
- 사칭 탐지의 핵심 가정("모든 Agent 호출은 turn push를 남긴다")이 깨짐.
- warn-only 방식이므로 blocking은 애초에 없지만, 탐지 자체도 무력화됨.
- 이 리스크는 PD-033(Agent dispatch 마커 의무) 미준수 시 실현됨.

**완화 조건:**
- **mitigation**: `session-end-finalize.js`에서 `sess.turns`의 연속 turnIdx 갭을 검사하는 별도 함수 추가 (예: "turnIdx 0→1→3이면 2번 누락"). 누락 감지 시 `missing-turn-gap` gaps 항목 박제.
- **fallback**: PD-033 준수를 전제 조건으로 명시. `## ROLE:` 마커 없는 Agent 호출은 PreToolUse 단계에서 이미 거부 가능 (별도 토픽 범위).

---

### 기각한 리스크

- **session_index.json에 source 필드 전파** (Arki 3-2에서 다룸): JSON 구조에 허용 범위, 실질 파손 없음 → 기각.
- **warn-only가 실효성 없다는 우려**: Ace가 명시적으로 warn-only를 채택한 결정. 반대 의견이 아닌 곁가지 → 기각.
- **violations와 gaps 중복 박제 혼란**: validateInlineRoleHeaders가 동일 패턴을 이미 사용 중(line 506-510). 일관된 관행. → 기각.

---

```yaml
# self-scores
crt_rcl: Y
cr_val: 4
prd_rej: Y
fp_rt: 0.10
```
