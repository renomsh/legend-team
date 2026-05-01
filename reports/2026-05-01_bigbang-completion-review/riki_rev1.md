---
role: riki
session: session_160
topic: topic_141
topicSlug: bigbang-completion-review
date: 2026-05-01
turnId: 2
invocationMode: subagent
rev: 1
---

# Riki — 리스크 감사

## 감사 대상

Arki가 진단한 Edi LLM 미호출 패턴 + 권고 3건의 실효성 검증.

---

### 🔴 R-1. dispatch_config.json에 edi rule 추가는 현재 hook 구조에서 아무 효과 없음

**원문 근거 (pre-tool-use-task.js):**
```
// pre-tool-use-task.js는 dispatch_config를 전혀 read하지 않음
// dispatch_config 참조 코드: 0건
```

`pre-tool-use-task.js` 전체에 `dispatch_config` 참조가 **없다**. 이 hook은 STDIN으로 받은 Task 툴 input을 가로채 persona/컨텍스트를 inject할 뿐 — dispatch_config 기반 호출 강제 로직이 없다.

**실패 시 파손 범위:** Arki 권고 1(dispatch_config에 edi rule 추가)을 구현해도 실제 Edi 호출 강제 효과는 0. 개발 공수 소모 + "구현된 것처럼 보이는 부재" 위험. 대시보드에 dispatch_config edi rule이 존재하지만 실제 동작 없는 ghost rule로 전락.

**완화 조건:** dispatch_config를 실제로 read·enforce하는 hook(pre-tool-use-task.js 또는 신규 hook)을 먼저 구현해야만 edi rule 추가가 의미를 가진다. 순서 역전이 핵심 리스크.

---

### 🔴 R-2. CLAUDE.md 텍스트 재기술은 행동 강제력 없음 — `feedback_text_vs_action_asymmetry.md` 직접 적용

**원문 근거 (feedback_text_vs_action_asymmetry.md):**
> "CLAUDE.md에 원칙 문장을 추가하는 것은 skill 체크리스트/hook보다 행동 강제력이 약하다. 실제 행동이 바뀌려면 체크리스트 기반 skill 파일 또는 hook으로 만들어야 한다."
> "문서는 읽히지만 체크리스트는 실행된다."

CLAUDE.md Edi Protocol에 "Agent 툴 호출 필수"를 추가해도, 현재 session-end-finalize.js의 `auditEdiLlmInvocation`이 탐지 후 경보를 발령하는 수준에서 행동이 바뀌지 않는다. session_159가 증거다 — D-066 + feedback(grade_a_subagent_enforcement)이 이미 문서에 존재하지만 위반이 발생했다.

**실패 시 파손 범위:** edi-llm-skipped gap이 계속 누적된다. 경보 피로(alert fatigue) 위험 — 고빈도 high-severity 경보는 결국 무시된다. 실질적 예방 효과 0.

**완화 조건:** hook 또는 skill 체크리스트로 강제해야 한다. pre-tool-use-task.js가 Edi role 발동 시 `source: 'agent'` 검증 후 차단 or 경고 inject, 또는 Session End 체크리스트 skill에 "Edi LLM 호출 확인" 단계 추가.

---

### 🟡 R-3. session_159 versionBumpSuggested 미이월 — 실질 영향은 제한적

**실측 결과:**
- `current_session.json` (session_160): `versionBumpSuggested: undefined`
- `session_index.json`의 session_159: `versionBumpSuggested` 필드 자체 없음, `gaps` 필드도 없음

session_159에서 versionBumpSuggested가 `confirmedBy: null` 상태로 이월됐다는 Ace 진단은 **현재 파일 기준 미확인**. session_159 session_index 항목에 해당 필드가 없으므로 미이월(생성 실패) 또는 애초에 생성 안 된 상태다.

**실패 시 파손 범위:** versionBump 미확정 자체는 project_charter.json 버전 미갱신으로 이어지지만, 대시보드 표시·기능 동작에는 영향 없다. 주요 위험은 BigBang 완료 선언 이후 `v?.?.?` 버전이 갱신되지 않아 체인지로그·외부 참조 시 혼선 가능성.

**완화 조건:** Edi가 현재 세션 종료 시 versionBump를 명시적으로 확정(+0.1 or skip 선언)하고 project_charter.json에 직접 박제하면 이월 gap 해소. 추적 불필요 — 원샷 처리 가능.

---

### 패스 항목

- **Session End 체크리스트 Edi 호출 단계 누락 위치**: `checklistDeltaCheck` 함수(line 390~414)는 Step 2(decision_ledger), Step 3(topic_index), Step 4(current_session closed), Step 7(role_memory mtime)만 검증. Edi 호출 여부는 별도 `auditEdiLlmInvocation`에서 처리 — 체크리스트 "단계 누락"이 아니라 **별도 감사 경로가 있음**. 이 구조 자체는 리스크 아님.
- **agentsCompleted와 turns.source 불일치**: Arki 가설 H-2. session_159 `edi_auto_rev1.md`가 실제로 `auto-compiled: true`로 확인되므로 오탐 아님 — 실제 미호출 확인. 가설 H-2는 별도 리스크 없음, H-1로 흡수.

---

## 종합 판정

**진짜 리스크는 2건 (R-1, R-2)이고 동일한 근본 원인**: "코드 강제 없는 문서 규칙". Arki 권고 3건 중 2건(dispatch_config rule 추가, CLAUDE.md 재기술)은 현재 hook 구조에서 **무효**다. 유일하게 실효성 있는 조치는 session-end-finalize.js의 경보를 차단형으로 올리거나, pre-tool-use-task.js가 Edi 서브에이전트 호출 시 source 검증을 inject하는 것이다.

R-3는 현재 세션 Edi 호출 시 원샷 해소 가능 — 블로커 아님.

---

[ROLE:riki]
# self-scores
crt_rcl: Y
cr_val: 4
prd_rej: Y
fp_rt: 0.10
