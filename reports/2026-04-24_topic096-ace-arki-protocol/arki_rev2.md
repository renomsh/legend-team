---
role: arki
topic: topic_096
session: session_091
rev: 2
date: 2026-04-24
phase: analysis+execution-plan
invocationMode: subagent
parentInstanceId: a5eb841cc5684571f
---

# Arki rev2 — topic_096 구조 설계 (진단 종료, 단독 설계 주도)

## Section A. 설계 원칙 4개 (Master 신호 흡수)

**P1. 포장 금지 — 작동 검증 시나리오 의무화.**
모든 신규 메커니즘 spec에는 (a) 정확한 trigger 시점, (b) 재현 가능한 차단/허용 시나리오, (c) 실패 시 가시화 경로 3개를 명시. 시나리오 없는 메커니즘은 본 토픽에서 채택 금지. D-066이 실패한 정확한 이유 — "감사 박제만 있고 행위 차단 없음" — 를 동일하게 반복하지 않기 위함.

**P2. Main 자기규율 마찰 ≠ Master 마찰.**
"저마찰 원칙"(F-066, session_066)은 Master에게 가해지는 확인 게이트·승인 요구를 가리킨다. Main이 자기 호출 직전에 받는 hook 차단은 Master에게 마찰 0. D-066은 두 마찰을 혼동해 hard-gate를 회피했다. 본 설계는 분리.

**P3. 기억 누적이 우선 가치.**
Master 한탄 "지식 축적도 안되는 거" — 이것이 본 토픽 핵심 결손. 따라서 (b) 세션 단절 해결은 단순 stateless 보완이 아닌 **cross-instance learning의 1차 수단**으로 격상. scratchpad는 부가 기능이 아닌 A2 실체 그 자체.

**P4. 단일 원천(SSOT).**
모든 룰은 `memory/shared/dispatch_config.json` 하나에 박힘. hook은 config를 읽기만 함. 스킬 문서·CLAUDE.md·코드에 룰 분산 금지. config 1행 변경으로 행위 변경. 변경 시 자동 검증 게이트 1개 필수.

---

## Section B. (a) Hard Pre-Gate 구조

### B-1. Hook 종류·등록 위치·trigger 시점
- 종류: `PreToolUse` (settings.json 미등록 상태)
- 등록: `.claude/settings.json` `hooks.PreToolUse` 배열
- Trigger: Main 도구 호출 직후·실행 직전. stdout `{"decision":"block","reason":"..."}` 반환 시 차단 + Main에 reason system-reminder 주입
- Match: `tool_name = Task`만 통과

### B-2. Hook 책임 (`.claude/hooks/pretool-role-gate.js`)
1. tool_name != Task → pass
2. current_session.json gradeDeclared 추출. A/S 아니면 pass
3. dispatch_config.json gradeAInlineBlock/gradeSInlineBlock read
4. tool_input.subagent_type/description으로 역할 추론
5. 정상 Task 호출은 통과. 진짜 차단 대상은 "Task 안 쓰고 인라인" 시점 → B-3 보완

### B-3. 보조 메커니즘 — UserPromptSubmit hook
PreToolUse는 도구 호출만 잡음. Main이 도구 안 쓰고 페르소나 인라인하면 못 잡음.

→ `UserPromptSubmit` hook으로 매 사용자 턴 직후, current_session.json 평가. Grade A/S + 다음 발언 예정 역할 in Block list → system-reminder 강제 주입: "다음 역할 발언은 Task 툴 호출 필수. 인라인 시 finalize에서 violation 박제."

차단은 아니지만 사후 감사보다 한 단계 앞.

**한계 단정**: SDK상 Main의 자연어 출력 자체는 차단 불가. 본 메커니즘은 (a) Task 잘못된 호출 하드 차단 + (b) 매 prompt 시작 강제 지시 주입.

### B-4. block 매트릭스
기존 gradeAInlineBlock/gradeSInlineBlock 그대로. hook은 phase 보지 않음 (사후 기록 필드). 역할 단위 차단만.

### B-5. block 실패 시 fallback (Master 가시화 3중)
1. PreToolUse 차단 → Main 즉시 system-reminder, 다음 턴 Task 재시도
2. UserPromptSubmit 강제 지시 → Master 응답에 "Arki 호출하겠습니다" 자연 등장
3. session-end-finalize gaps 박제 유지. 단 박제 빈도 = hard-gate 효율 지표

### B-6. Ace 화이트리스트
Grade A: alwaysActive ace 유지, framing/synthesis/dispatch phase inline 허용
Grade S: Ace도 Block. 단 master-direct phase는 매트릭스 무관 허용. config `gradeSInlineAllow.master-direct: true` 명시

### B-7. 검증 시나리오 (재현 절차)
```
1. 신규 토픽 grade S로 open
2. Master "아키 의견 줘" → master-direct phase 통과
3. Master "이번엔 Riki 시각으로 답해"
4. Main이 Task 없이 "Riki: ..." 인라인 시도
5. UserPromptSubmit hook이 step 3 직후 system-reminder 주입
6. Main이 Task 호출 전환 → 통과
7. 무시하고 인라인 강행 → finalize gaps 박제
8. 다음 세션 /open 시 Master에 violation 카운트 노출
```

### B-8. 포장 detector 자가감사
**위험**: UserPromptSubmit 메시지 잦으면 Main이 "강제 지시" 무시 시작 → D-066 회귀
**차단**: hook 자가검증. 같은 세션 동일 역할 강제 지시 ≥ 3 → 톤 격상 + escalation 모드 진입 (PreToolUse가 비-Task 도구 호출까지 차단). 강화 모드 토픽 종료 시 reset

---

## Section C. (b)+A2 Scratchpad 구조

### C-1. 경로·스키마
경로: `memory/shared/scratchpad/{topicId}/{role}.json`
토픽 단위 디렉토리, 역할 단위 파일. race 회피.

스키마:
```json
{
  "topicId": "topic_096",
  "role": "arki",
  "createdAt": "...",
  "lastUpdatedAt": "...",
  "instances": [
    {
      "instanceId": "a5eb841cc5684571f",
      "sessionId": "session_091",
      "calledAt": "...",
      "phase": "analysis",
      "findings": [
        { "id": "F-001", "claim": "...", "evidence": "...", "confidence": "high" }
      ],
      "openQuestions": [],
      "decisionsHandedOff": []
    }
  ],
  "consolidatedView": {
    "currentClaim": "",
    "supersededFindingIds": []
  }
}
```

### C-2. F-NNN ID 발급자 + 충돌 방지
발급: `scripts/lib/scratchpad-writer.ts` helper.
1. 파일 read
2. instances.findings flatten
3. 최대 NNN +1
4. atomic write (write-atomic.ts 재사용)

충돌: 동일 토픽 동일 역할 동시 호출 = 시스템상 불가(Main 직렬 dispatch). 다른 역할은 파일 분리. atomic write로 부분 쓰기 방지.

### C-3. Sub append 절차
서브 발언 후 추가 의무:
- `npx ts-node scripts/append-scratchpad.ts <topicId> <role> <findingsJsonPath>` 호출
- 또는 직접 Edit/Write (helper 권장)

Sub Write 권한 단정: Section G 외부 의존.

### C-4. Main 호출 직전 주입
Main이 Task 호출 시 prompt 상단 prepend (`scripts/build-subagent-prompt.ts` 자동화):
```
**스크래치패드 (이전 instance 기록)**
파일: memory/shared/scratchpad/{topicId}/{role}.json
이전 instance 수: N
직전 instance findings:
- F-001: ...
- F-002: ...

본 호출에서 너는 위 findings를 인용/반박/확장할 수 있다.
새 finding은 F-{N+1}부터. 발언 후 append 의무.
```

### C-5. Lifecycle
| 시점 | 동작 |
|---|---|
| 토픽 open Grade A/S | scratchpad 디렉토리 + 빈 파일 4개 seed (ace/arki/fin/riki) |
| 토픽 open Grade B/C | 미생성. helper read 시 빈 객체 반환 |
| 매 sub 호출 | read → prepend → 발언 → append |
| 토픽 close | scratchpad-archive/{topicId}/ 이동, live purge |

archive 영구 보존, live는 활성 토픽만 → context 오염 방지.

### C-6. 검증 시나리오
```
1. Grade A 토픽 open → scratchpad/{topicId}/arki.json 빈 파일 생성
2. Arki 1회차 Task 호출 → prompt 상단 "이전 instance 수: 0" 주입
3. Arki 발언 완료 → append-scratchpad, F-001 기록
4. Arki 2회차 호출 → prompt 상단 F-001 인용 확인
5. Arki 2회차 발언 본문이 F-001 명시 인용 → 누적 작동 증명
6. Arki 3회차 호출 → F-001, F-002 모두 인용
7. 토픽 close → archive 이동
```

PD-033 충족 측정: archive scratchpad 내 instances.length ≥ 2 && 후속 instance가 이전 finding ID 본문 인용 → resolved

### C-7. 포장 detector — selective load
**위험**: scratchpad 비대화 시 매 호출 prompt N개 finding 전부 주입 → 토큰 폭증·context 오염
**차단**: prepend selective load:
- 직전 instance: 전체 인용
- 그 이전: consolidatedView.currentClaim + superseded ID만
- 최대 prepend 토큰: 2000 (config `contextLayers.scratchpadMaxTokens`)
- 초과 시 가장 오래된 instance부터 본문 제거, ID·claim만 남김

룰 자체 dispatch_config에 박힘.

---

## Section D. dispatch_config 확장

```json
{
  "_version": "1.2.0",
  "hardGate": {
    "enabled": true,
    "preToolUseHook": ".claude/hooks/pretool-role-gate.js",
    "userPromptSubmitHook": ".claude/hooks/userprompt-role-reminder.js",
    "escalationThreshold": 3,
    "escalationMode": "block-non-task-tools"
  },
  "scratchpad": {
    "enabled": true,
    "basePath": "memory/shared/scratchpad",
    "archivePath": "memory/shared/scratchpad-archive",
    "appliesToGrades": ["A", "S"],
    "seedRoles": ["ace", "arki", "fin", "riki"],
    "scratchpadMaxTokens": 2000,
    "selectiveLoad": {
      "latestInstanceFull": true,
      "olderInstancesClaimOnly": true
    }
  },
  "gradeSInlineAllow": {
    "master-direct": true
  }
}
```

기존 필드 충돌 0:
- gradeAInlineBlock/gradeSInlineBlock 그대로 (hook read)
- gradePolicies 무관
- guardrails.maxSubRecallsPerSession와 hardGate.escalationThreshold 독립
- contextLayers 옆 scratchpad 추가, dynamic 예산에서 scratchpadMaxTokens 차감 (5000+2000=7000, 30000 budget 내 여유)

---

## Section E. Child 토픽 spec 2개

### Child-1: hard-pregate-role-enforcement
- topic_id 후보: topic_097
- slug: hard-pregate-role-enforcement
- grade: **B** (spec 좁고 확정, Dev 직행)
- topicType: implementation
- parentTopicId: topic_096
- resolveCondition: "Grade A 신규 테스트 토픽에서 Main 인라인 시도 시 PreToolUse 또는 UserPromptSubmit hook이 system-reminder 주입을 1회 이상 트리거하고, 시나리오 B-7 8단계 전부 재현 가능"

Phase:
- Phase 1: dispatch_config v1.2 hardGate 필드 + JSON schema 검증
- Phase 2: pretool-role-gate.js + 단위 테스트
- Phase 3: userprompt-role-reminder.js + current_session.json 상태 평가
- Phase 4: settings.json hooks 등록
- Phase 5: B-7 시나리오 재현 (G1)
- Phase 6: 운영 후 escalation 발동 측정 (G2)

### Child-2: scratchpad-cross-instance-memory
- topic_id 후보: topic_098
- slug: scratchpad-cross-instance-memory
- grade: **A** (스키마+다중 helper+lifecycle 통합 결정 필요)
- topicType: implementation
- parentTopicId: topic_096
- resolveCondition: "Grade A 토픽 1개에서 Arki 3회 호출, 3회차 발언 본문이 1·2회차 F-NNN 명시 인용. archive 디렉토리에 instances.length ≥ 2 scratchpad 1개 이상 존재"

Phase:
- Phase 1: scratchpad JSON schema + scripts/lib/scratchpad-types.ts
- Phase 2: scratchpad-writer.ts (atomic, F-NNN 발급) + 단위 테스트
- Phase 3: append-scratchpad.ts CLI + build-subagent-prompt.ts
- Phase 4: 4개 role-*.md Write 계약에 append 의무 + Main Task 호출 룰
- Phase 5: open/close 스킬 seed/archive 단계
- Phase 6: C-6 시나리오 재현 + selective load 1회 발동 (G3)
- Phase 7: PD-033 자동 매칭 확인 (lifecycle 도구 연동)

---

## Section F. 자가감사

**Q1. 사후 감사+박제 변질 위험은? 차단?**
위험 지점: B-3 UserPromptSubmit. 지시 주입일 뿐 진짜 차단 아님 → 무시 시 D-066 패턴.
차단: B-8 escalation. 같은 세션 3회 무시 → PreToolUse 강화로 비-Task 도구까지 차단. 다음 턴 응답 진행하려면 무조건 Task 필요. 사후 박제 아닌 행위 강제. finalize gaps 박제는 효율 지표화 — 박제 0 정상, ≥1이면 hook 디버그.

**Q2. scratchpad가 evidence_index 식 사후 ledger 변질 위험? 차단?**
위험: sub가 Write 계약 지키되 append 잊음 → helper만 ledger, 본문 미참조.
차단 1: build-subagent-prompt가 호출 직전 자동 prepend — sub는 이전 finding 안 볼 방법 없음
차단 2: sub 응답 첫 줄에 ARKI_WRITE_DONE + SCRATCHPAD_APPEND_DONE: F-NNN 두 줄 강제. 누락 시 Main 즉시 재호출
차단 3: Child-2 resolveCondition이 "본문 인용" 명시 — append만으로 PD resolved 안 됨

**Q3. D-066 박제 패턴 아니라는 증거?**
(1) Master 직접 검증 시나리오: B-7 8단계, C-6 7단계 — Master 직접 토픽 1개 열어 재현 가능. D-066은 시나리오 없이 감사 룰만.
(2) SSOT + hook 행위 차단: dispatch_config 1행 끄면 시스템 비활성. 룰 분산 0. D-066은 CLAUDE.md/스킬/hook 3곳 분산.
(3) escalation 백스톱: 지시 무시 시 진짜 차단으로 격상. D-066은 백스톱 없음.

---

## Section G. 미해결·외부 의존

1. PreToolUse hook 정확한 trigger 시점·input 스키마 dry-run — Child-1 Phase 2 첫 작업
2. Sub의 Write 권한 단정 — 현행 role-arki.md Write 계약 작동 → 권한 있음 가정. scratchpad는 atomic write helper 강제
3. C2 (`agents/*.md` legacy) 폐기 — **본 토픽 out**. Child-3로 미루되 본 결정 후 Master 판단으로 open

---

## Section H. Ace에게

- A1 페르소나 통합: framing 단정 유지 (Hybrid 4계층). 변경 없음
- A2 cross-instance memory: 강하게 채택 + scratchpad 단일 수단 통합 권고. "기억의 상주" 추상 표현 폐기, "scratchpad-mediated"로 명문화
- A3 페르소나 분리: 본 토픽 out, Child-3 후속. 미룸
- A4 hard-gate vs soft-audit: hard-gate 권고 유지 + 보조 메커니즘 B-3 결합 명문화. PreToolUse 단독 인라인 차단 불가 SDK 한계 솔직히 표시
- A5 SSOT 위치: dispatch_config 단정 유지. 변경 없음

추가 권고:
- 본 토픽은 결정만, 구현은 Child-1·2 위임. session_091은 spec 확정 + Child 2개 open 권고로 종료
- Child-1=B, Child-2=A 분리 이유: hard-gate spec 좁고 명확, scratchpad 통합 표면 넓음
