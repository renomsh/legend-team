---
role: riki
session: session_153
topic: topic_131
date: 2026-05-01
turnId: 1
invocationMode: subagent
rev: 1
accessed_assets:
  - reports/2026-05-01_big-bang-legend-nexus-p3-1of2/arki_rev1.md
  - memory/roles/personas/role-riki.md
  - .claude/hooks/post-tool-use-task.js
  - .claude/hooks/session-end-finalize.js
---

# Riki — Big Bang Legend Nexus P3 (1/2, s153) 리스크 감사

Riki입니다. Arki 설계안과 현재 hook 코드를 교차 정독한 결과, 확신 있는 리스크 4건을 적출합니다.

---

### 🔴 R-1. Origin Trace 측정값이 측정 대상(echo chamber)을 실제로 측정하지 못하는 구조적 결함

**근거 (Arki §3.1 Origin Trace):**
> "암묵적 자기인용(마커 없이 이전 발언 내용 반복)은 탐지 불가 → Phase A에서는 명시적 마커 기반만 가동."

echo chamber의 핵심 양상은 마커를 붙이지 않고 이전 발언의 논리·결론을 그대로 수용하는 것입니다. 명시적 `[ROLE:xxx]` 마커 카운팅은 "얼마나 자기 역할을 명시적으로 인용했는가"를 측정할 뿐, "얼마나 이전 역할의 결론에 무비판적으로 동조했는가"를 측정하지 않습니다.

**실패 시 파손 범위:**
- NCL Origin Trace 지표가 경보를 내지 않는 echo chamber 세션이 "정상" 분류됨
- D-123 설계 목표(echo chamber 탐지)와 실제 구현 사이의 측정 유효성 gap이 system-level 보증으로 굳어질 위험
- s139 echo chamber 재발 탐지 실패 — Sage가 사후 채점 시 "NCL 경보 없었음"을 정상 근거로 오인할 수 있음

**완화 조건:**
- Phase A 가동 시 "Origin Trace = 명시적 인용만 측정" 한계를 `ncl_violations.jsonl` 스키마 헤더에 명시 (측정 범위 정직 선언)
- D-123 결정문에 "Phase A Origin Trace는 proxy 지표, 암묵적 동조 탐지는 Phase B 후속"을 caveat로 박제
- fallback: Master가 Sage 호출 시 "NCL 경보 없음 = echo chamber 없음"으로 해석하지 않도록 Sage policy에 제약 추가

---

### 🔴 R-2. Influence Score false positive 폭발 시 warn-only NCL이 신뢰를 역으로 잠식

**근거 (Arki §3.1 Influence Score + §5):**
> "false alarm 밀도가 높아 Phase A warn-only에서도 노이즈 문제 발생 우려."
> "mock 테스트에서 30% 초과 시: 해당 항목을 Phase A v0에서 제외"

Influence Score는 Arki 자신이 "threshold 0.7, cross-role only"로 제한하더라도 **단일 토픽 발언 특성상 전문 용어 자연 중첩**이 0.7을 상시 상회할 가능성이 높습니다. warn-only 시스템이 매 세션 flag를 남발하면 Master는 NCL 경보를 "노이즈"로 학습하고 무시하게 됩니다(알람 피로, Goodhart's Law 2차 효과).

**실패 시 파손 범위:**
- NCL 경보 전체의 신뢰도 붕괴 — Origin Trace·Diversity Index의 진짜 경보도 무시될 위험
- ncl_violations.jsonl이 high-noise 데이터로 오염 → Sage 분석 입력값 오염

**완화 조건:**
- Dev 구현 전, 최소 3개의 실제 세션 tool_response로 Influence Score false positive율 사전 측정 필수
- FP율 30% 이상이면 Influence Score를 v0에서 제외 (Arki §5 "중단 조건"과 일치). 이때 v0 README에 "Influence Score는 v0.1 분리" 명시
- fallback: v0 첫 3세션에 dual-log(NCL flag + 실제 echo chamber 여부 Master 수동 기록) 의무화로 calibration

---

### 🟡 R-3. D-131 decision_ledger append-only 정책과 D-108 supersedes 처리 충돌 가능성

**근거 (Arki §1.3, §2.2):**
> "D-108에는 `supersededBy: D-131` 표기. amendment보다 append-only ledger 정책에 충실"

ledger는 append-only 정책입니다. 그런데 D-108 기존 entry에 `supersededBy: D-131`을 **사후 edit**하는 것은 append-only가 아닌 in-place mutation입니다. D-130까지 선례로 쌓인 `supersedes` 체인(D-124→D-120 등)을 보면 모두 **신규 결정의 body에** `supersedes: D-NNN` 기재 방식이었고, 기존 entry에 `supersededBy`를 역방향으로 쓰는 패턴이 실제로 존재하는지 검증이 없습니다.

**실패 시 파손 범위:**
- D-108 entry 사후 mutation → ledger immutability 위반 경보 가능성 (validate-schema-lifecycle.ts)
- D-108이 "C축 미결" 상태로 system_state.pendingDeferrals에 등재되어 있다면, supersededBy 기재만으로는 PD 자동 전이가 발생하지 않음 (resolve-pending-deferrals.ts는 `resolveCondition` 매칭 기반)

**완화 조건:**
- Dev 구현 시 ledger에서 D-108 entry를 in-place edit하지 말고, D-131 body에 `supersedes: "D-108"` 기재 방식 일관 유지
- D-108이 pendingDeferrals에 등재되어 있다면 current_session.json.`pendingDeferralsResolved: ["PD-NNN"]`에 해당 PD ID를 함께 기재하여 applyPendingDeferralsResolved()가 자동 처리하도록 설계
- fallback: Dev가 G1 게이트에서 `grep "supersededBy" decision_ledger.json` 결과 검증 후 진행

---

### 🟡 R-4. session-end-finalize.js NCL 삽입 위치와 기존 `sess` 뮤테이션 흐름의 write race

**근거 (Arki §3.2 SessionEnd 삽입 + 현재 session-end-finalize.js 코드):**

현재 `session-end-finalize.js` main 파이프라인 순서:
```
checkSelfScoreScale → checkCommonPolicyCap → ensureEdiInAgents →
filterAgentsCompleted → validateInlineRoleHeaders → auditRoleImpersonation →
auditEdiLlmInvocation → synthesizeMechanicalEdiReport →
copyEdiReportToSessionContributions → **writeJson(sess)** → appendOrUpdateSessionIndex
→ ... → detectVersionBump → applyVersionBump → escalateAceAcksWithTTL → ...
```

`writeJson(CURRENT_SESSION_PATH, sess)` 호출이 line 1358에 있고, 이후에도 `detectVersionBump(sess)`와 `escalateAceAcksWithTTL(sess)`가 각각 `writeJson`을 다시 호출합니다. 즉 sess 객체 뮤테이션과 파일 write가 여러 곳에 분산되어 있습니다.

Arki가 제안한 `evaluateNclSessionEnd()` 삽입 위치 "ensureEdiInAgents() 이후, session_index 전파 직전"은 현재 코드에서 line 1351~1359 사이입니다. 이 위치에서 `appendNclFlags()`가 ncl_violations.jsonl에 append하면서 동시에 sess.nclSummary 같은 필드를 뮤테이션한다면, 이후 line 1358의 `writeJson(sess)` 호출 전에 다른 함수가 sess를 다시 뮤테이션할 경우 NCL 데이터가 덮어씌워질 위험이 있습니다.

**실패 시 파손 범위:**
- NCL session-level 집계 결과가 sess에 기록되었다가 이후 writeJson에 의해 날아갈 위험 (조용한 데이터 손실)
- 재현 조건: evaluateNclSessionEnd()가 sess.nclSessionFlags 등 필드를 추가한 뒤, ensureEdiInAgents()가 sess.turns를 수정하고 writeJson을 다시 호출하는 경우

**완화 조건:**
- `evaluateNclSessionEnd()`는 sess 객체를 뮤테이션하지 않고 **ncl_violations.jsonl append-only**로만 side-effect를 가져야 함 (sess 직접 쓰기 금지)
- 또는 NCL 삽입 위치를 line 1358의 `writeJson(CURRENT_SESSION_PATH, sess)` **직후**로 배치하여 sess의 최종 상태를 읽은 뒤 NCL 평가 실행
- fallback: Dev 구현 시 evaluateNclSessionEnd() 함수 서명에 `(sess, cwd)` → return value 없이 파일 side-effect만, 명시적 주석 "sess 뮤테이션 금지" 박제

---

## 기각한 리스크 (의도적 제외)

- **ncl_violations.jsonl 동시 쓰기 위험**: PostToolUse hook은 Claude Code가 Task 툴을 순차 실행하므로 실질적 동시 쓰기 가능성 없음. 기각.
- **Influence Score v0.1 분리가 오히려 위험한 경우**: Arki가 이미 v0에서 Origin Trace+Diversity Index만 가동 권고로 리스크를 흡수함. Riki가 별도로 "분리 반대" 주장을 제기할 확신 없음. 기각.
- **D-123 warn-only Goodhart 위험(Arki §5 경고와 중복)**: Fin이 s140에서 이미 다룬 항목. 단, R-2에서 "2차 Goodhart"(알람 피로) 각도는 별개로 적출.
- **turns 0건 Diversity Index division-by-zero**: Arki §6 경계 조건에서 `if (total_turns === 0) return` 가드 명시. Dev 구현 지시 전달됨. Riki 재지적 불필요.

---

RIKI_WRITE_DONE: reports/2026-05-01_big-bang-legend-nexus-p3-1of2/riki_rev1.md

[ROLE:riki]
# self-scores
crt_rcl: Y
cr_val: 4
prd_rej: Y
fp_rt: 0.10
