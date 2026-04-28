---
role: ace
turnId: 3
invocationMode: subagent
topic: PD-052 역할 사칭 사후 차단 hook 구현
topicId: topic_128
sessionId: session_134
date: 2026-04-28
grade: B
executionPlanMode: plan
---

ACE_WRITE_DONE: reports/2026-04-28_pd052-role-impersonation-post-hook/ace_rev1.md

## Ace — 종합검토

Ace입니다.

Arki 실행계획과 Riki 리스크를 교차 검토했습니다. 두 역할 간 충돌은 없으며, R-1은 설계 변경으로 흡수 가능합니다.

---

### 1. R-1 흡수 — Phase 2+3 로직 수정 지시

**현행 Arki 설계의 결함:**
`source === null/undefined` → `impersonation-suspect` 직등치. Phase 1 배포 이전 turns를 전부 경보 대상으로 만든다.

**수정 지시 (Dev에게):**

`auditRoleImpersonation(sess)` 로직을 다음으로 교체:

```
turns 순회:
  - source === "agent" → 정상. violations 대상 아님.
  - source === null/undefined → "impersonation-unknown-legacy" 마킹. violations 비생성.
    (단, 같은 source=null turn이 role=ace/arki/riki/... 외 알 수 없는 역할이면 → "impersonation-suspect"로 격상 가능)
  
경보 기준(violations 생성 조건):
  source === "agent"인 turn에서 role이 예상 범위 밖인 경우만 violations 생성.
  → 현재는 role 변조 탐지 로직이 없으므로, Phase 1~3는 "source 없는 turn을 legacy로 분류"까지만.
  → 실제 violations 생성은 향후 role 변조 탐지 로직 추가 시로 유보.
```

**결론:** Phase 2+3의 auditRoleImpersonation()은 현재 세션에서 violations를 생성하지 않는다. 대신 source=null turns를 `legacy-unmarked`로 분류하고, 해당 건수만 log 출력. gaps에도 박제하지 않는다 (false-positive 원천 차단).

이 변경으로 R-1 완전 흡수됩니다.

---

### 2. R-2 판단 — turnIdx 갭 감지 추가 여부

**결론: Phase 5로 신설. 단, 현 세션에서는 구현 제외.**

이유:
- turnIdx 갭 감지는 "누락 감지"이며, "source 마킹 기반 탐지"와 관심사가 다릅니다.
- PD-033(마커 의무)가 전제로 명시되어 있고, 현재 hook이 이미 role 추출 실패 시 `missing-report gap`을 박제합니다.
- 중복 탐지보다 단순 전제 명시가 낫습니다.

**Dev 지시:**
- Phase 2+3 구현 시 코드 주석에 "PD-033 준수를 전제. ## ROLE: 마커 없는 Agent 호출은 turn push 자체가 skip됨. turnIdx 갭 감지는 Phase 5 후속 작업."을 명시.
- Phase 5는 PD-052 resolved 이후 별도 토픽에서 다룬다.

---

### 3. 구현 준비 판단

**Dev 직행 가능합니다.**

추가 확인 사항 없음. 구현 순서:

1. **Phase 1** — `post-tool-use-task.js` newTurn에 `source: 'agent'` 추가 (1줄)
2. **Phase 2+3** — `session-end-finalize.js`에 `auditRoleImpersonation(sess)` 추가 (수정된 로직으로). violations는 현재 생성 안 함. source=null turns를 legacy-unmarked로 분류 + 건수 log만.
3. **Phase 4** — `turn-types.ts`에 `source?: string` 추가 + dry-run 검증.

**검증 기준 (Dev가 Phase 4에서 확인):**
- `current_session.json`의 신규 turns에 `source: "agent"` 필드 존재.
- `auditRoleImpersonation()` 실행 후 violations[] 비어 있음.
- source=null turns에 대해 log에 `legacy-unmarked N건` 출력.
- 기존 `validateInlineRoleHeaders`, `checkSelfScoreScale` 동작 이상 없음.

---

### 4. versionBump 선언

```
versionBump: +0.01
reason: PD-052 역할 사칭 사후 탐지 인프라 신설 (source 마킹 + auditRoleImpersonation 함수). 역할 추적 역량 확장.
```

---

### 5. Master 확인 사항

**없음. Dev 직행.**

R-1 흡수 후 설계는 안전합니다. warn-only, false-positive 없음, 기존 hook 영향 없음.

---

```yaml
# self-scores
rfrm_trg: Y
ctx_car: 1.00
orc_hit: 0.90
mst_fr: 0.90
ang_nov: 1
```
