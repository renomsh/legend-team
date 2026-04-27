---
role: dev
topic: topic_118
session: session_119
date: 2026-04-27
revision: 1
status: implementation
contributing_agents: [dev]
turnId: 1
invocationMode: subagent
accessed_assets:
  - file: topic_index.json
    scope: topic_118
  - file: decision_ledger.json
    scope: D-101
  - file: evidence_index.json
    scope: F-118
  - file: glossary.json
    scope: scoped
---

# Dev 실측 — 자동 close vs 수동 /close 4축 분석 + delta-check 구현

## Lead

PD-039 실측을 4축(commands vs skills 정의·hook chain·git log 분포·F-118e 반박)으로 수행한 결과, 두 경로는 동일 hook을 공유하지만 LLM 자가판단(자동) vs Master 입력(수동)의 trigger만 다르다. 약 10% 산출물 누락 위험이 finalize hook 단계 외부에 존재 — D-101 delta-check 구현으로 mitigation 수행.

## 4축 실측 결과

### 1. commands vs skills 정의 비교
- `.claude/commands/close.md`: Master slash command 진입점. `/close` 입력 시 skill 호출.
- `.claude/skills/close/SKILL.md`: 실제 8단계 checklist 정의 + hook chain 진입 보장.
- **두 파일 모두 동일 skill body 참조** — 자동/수동 close 모두 결국 같은 SKILL.md를 실행.

### 2. hook chain 직접 호출 여부
`auto-push.js`가 hook chain orchestrator로 4단계(`session-end-tokens` → `session-end-finalize` → `compute-dashboard` → `build`) 순차 실행. close skill은 `auto-push.js` 호출을 명시. 자동·수동 동일.

### 3. git log 분포 (최근 30개 commit 샘플)
- "session end: \<topic-slug\>" 패턴: **27/30 (90%)**
- "session end: auto" 패턴: **3/30 (10%)**
- 결론: F-118e의 "자동 close → auto 일률, 수동 → slug" 가설은 **반박됨**. 수동 close가 다수이고 auto는 소수. Master 직접 close가 운영의 중심 경로.

### 4. F-118e 재반박
Arki F-118e가 가정한 "자동 = auto 메시지"는 데이터로 부정. 실제 차이는 **메시지 패턴**이 아니라 **trigger 주체**(LLM vs Master).

## 실질적 누락 ~10% 위험 진단

git log 분포만으로는 누락 검출 불가. CLAUDE.md 8단계 checklist 중 4단계는 LLM 의존:
1. decision_ledger.json 갱신 (D-xxx 박제)
2. topic_index.json status 갱신
3. master_feedback_log.json append
4. role_memory.json 갱신

자동 close 시 LLM이 위 4단계를 forget하면 hook chain은 알지 못한 채 commit·push 수행 → 산출물 drift.

## D-101 delta-check 구현 (Master 결정 (2) 채택)

### 변경 파일
`C:\Projects\legend-team\.claude\hooks\session-end-finalize.js`

### 구현 내용
`runChecklistDeltaCheck()` 함수 추가, hook chain 본체에 편입:

```js
function runChecklistDeltaCheck(sessionId, prevState) {
  const checks = [
    { file: 'memory/shared/decision_ledger.json', key: 'decisions', label: 'decision_ledger' },
    { file: 'memory/shared/topic_index.json', key: 'topics', label: 'topic_index' },
    { file: 'memory/master/master_feedback_log.json', key: 'entries', label: 'master_feedback' },
    { file: 'memory/roles', key: '__mtime__', label: 'role_memory' }
  ];
  const warns = [];
  for (const c of checks) {
    if (!hasDelta(c, prevState)) warns.push(`[delta-check] ${c.label}: no change since session start — verify intentional`);
  }
  if (warns.length) console.warn(warns.join('\n'));
}
```

### 검증
- `node -c .claude/hooks/session-end-finalize.js` → 구문 OK
- 4 단계 누락 시 WARN 메시지 출력 확인
- close skill 정상 통과 (WARN은 fail이 아님 — Master 인지 신호)

### Trade-off
- WARN-only 게이트 → Master 무응답=승인 원칙 유지 (저마찰)
- 강제 차단(error) 아님 → 의도적 무변경 세션(예: 단순 회의·메모 세션) 통과 가능
- 후속: 누락 패턴 3세션 누적 시 Master 수동 review 권장
