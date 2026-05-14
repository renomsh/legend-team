---
role: arki
session: session_247
topic: topic_207
topicSlug: arki-emergency-hooks
date: 2026-05-14
rev: 1
turnId: 3
invocationMode: subagent
authorship: agent
---

# Arki — Nexus 발화 검증 응급 hook 설계

페르소나 모델 정렬: Rich Hickey ("Simple Made Easy") — **짓지 않음** 옵션부터 검토.

---

## 1. 진단 결과 (사실 보고)

### 진단 1-1. hook 디렉토리 vs settings.json 등록 cross-check [T4/A0/O5]

**`.claude/hooks/` 실측 (13 파일):**
- `pre-tool-use-task.js` / `pre-tool-use-task-sage-gate.js.emergency-disabled` / `pre-tool-use-task-master-first.js`
- `pre-tool-use-skill-jobs-framing.js`
- `post-tool-use-task.js` / `post-tool-use-verification.js` / `post-tool-use-skill-index-hash.js`
- `user-prompt-submit-master-first.js` / `user-prompt-submit-skill-recommend.js`
- `session-end-tokens.js` / `session-end-finalize.js`
- `spike-k6-pretool-task-mutation.js` (spike — 미등록)
- `lib/known-roles.js` + `lib/finalize/`

**`.claude/settings.json` hooks 블록 등록 8건:**
| 이벤트 | matcher | hook |
|---|---|---|
| SessionEnd | (all) | `scripts/auto-push.js` |
| UserPromptSubmit | (all) | `user-prompt-submit-master-first.js` + `user-prompt-submit-skill-recommend.js` |
| PreToolUse | `Task` | `pre-tool-use-task.js` + `pre-tool-use-task-sage-gate.js` + `pre-tool-use-task-master-first.js` |
| PreToolUse | `Skill` | `pre-tool-use-skill-jobs-framing.js` |
| PostToolUse | `Task` | `post-tool-use-task.js` |
| PostToolUse | `Write\|Edit` | `post-tool-use-verification.js` |

**핵심 단언 [T4/A2/O5]:** Sage gate가 `.emergency-disabled` 접미사로 비활성화되어 있는데 settings.json은 여전히 원본 파일명을 호출 → **실행 실패 (silent miss)**. settings.json 동기화 누락.

**Master 발언("넣어두었는데 실행 안 함") 검증:** Nexus 발화 자체를 검증하는 hook은 **0건 등록**. Master의 "넣어두었다"가 어느 hook을 지칭하는지 본 워크트리에서는 발견 안 됨. 추가 확인 필요 [Master 결정 필요 #1].

### 진단 1-2. Claude Code SDK hook 매처 가능 영역 [T3/A2/O3]

**현 settings.json schema에서 사용 중인 hook 이벤트:** `SessionEnd`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`.

**Nexus assistant message 자체에 hook 작동 가능한가?** 현 schema에서 검증 가능한 출처는 `https://json.schemastore.org/claude-code-settings.json` (settings.json L2). 본 보고서 작성 시점에 schema 원문을 직접 fetch하지 않음 → `AssistantMessage`/`Stop` 매처 가용 여부 단언 불가 [T1/A0/O1, **추측**].

**구조적 우회 경로 (Hickey "짓지 않음" 검토):**
- 발화 시점 직접 차단이 SDK상 불가능하더라도 **PreToolUse(*)** 매처로 **다음 tool call 시점에 직전 assistant message 회수 검증**은 가능. PreToolUse hook의 stdin JSON에 직전 메시지 컨텍스트 포함 여부는 검증 필요 [Master 결정 필요 #2].
- 또는 **모든 mutation tool(Edit/Write/Bash mutating)** PreToolUse 매처에 단일 게이트 hook 부착 → 사실상 발화 → 행동 사이 게이트 확보. 이게 최소 충분 설계.

### 진단 1-3. post-tool-use-verification.js 동작 [T4/A2/O5]

L18~L27 실측: `hookSpecificOutput.additionalContext` 형식으로 **컨텍스트 주입만**. `process.exit(2)` 또는 `decision: "block"` 미사용 → **차단 아님, 알림만**.

**차단 메커니즘 reference 확인:**
- `pre-tool-use-task-sage-gate.js.emergency-disabled` L133 영역에 차단 로직이 있던 것으로 dispatch-context 인용 (sage 보고서 hook 패치 언급). 직접 read 없이 단언 금지 — 본 보고에서는 코드 확인 안 됨 [T1/A0/O1, **추측**].
- 일반적으로 PreToolUse는 `{"decision": "block", "reason": "..."}` JSON stdout 또는 `process.exit(2)` 둘 다 차단 가능 [T2/A1/O1].

---

## 2. 3 Hook 설계 (의사 코드)

### 짓지 않음 옵션 검토 (Hickey 원칙)

| 옵션 | 비용 | 효과 | Hickey 권고 |
|---|---|---|---|
| **A. 운영 패턴(Master 외부 검증)만 유지, hook 0건** | 0 | Sage O3 (LLM 의존) | 단독은 부족하지만 보조로 유지 |
| **B. 단일 게이트 hook (mutation 전 검증)** | 저 | 단일 진입점 | **권고** — 최소 충분 |
| **C. Hook 1+2+3 풀세트** | 중 | 다층 방어 | 과잉 — 단계적 도입 |

Arki 권고: **B 먼저 (Hook 2), A 병행. Hook 1·3은 B 운영 1~2주 후 false-positive 학습 후 도입.** (Hickey: "필요해진 시점에 짓는다.")

다만 Master가 풀세트를 명시 요청 → 3개 설계 모두 제시. **단 의존성·순서는 강하게 권고.**

### Hook 2. no-autonomous-decision (최우선, 단일 게이트)

```javascript
#!/usr/bin/env node
// .claude/hooks/pre-tool-use-no-autonomous-decision.js
// 매처: PreToolUse(Edit|Write|Bash)
// 트리거: Nexus가 mutation tool 호출 시
// 검증: 직전 N턴 컨텍스트에 Master 명시 승인 인용 매칭
// 차단: 매칭 0 + exempt 패턴 미해당 시 process.exit(2)

const fs = require('fs');
const path = require('path');

let raw = '';
process.stdin.on('data', d => (raw += d));
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(raw);
    const tool = input.tool_name;
    const ti = input.tool_input || {};

    // Exempt: 읽기 도구는 매처에서 이미 제외됨. 여기는 Edit/Write/Bash만.
    // Bash sub-classification
    if (tool === 'Bash') {
      const cmd = (ti.command || '').toLowerCase();
      const readOnly = /^(ls|cat|grep|rg|head|tail|find|git\s+(status|diff|log|show)|node.*--version|npm\s+ls)/;
      if (readOnly.test(cmd)) process.exit(0);
    }

    // Master 승인 인용 패턴 (전사에서 매칭)
    // 입력 JSON에 transcript_path 또는 conversation_id 있는지 확인
    const transcriptPath = input.transcript_path; // SDK 미보장 필드 — 검증 필요
    if (!transcriptPath || !fs.existsSync(transcriptPath)) {
      // transcript 회수 불가 → 안전 측 통과 (false-positive 회피)
      // 단, system_state에 카운트 박제
      logSkip(input);
      process.exit(0);
    }

    const recent = readRecentTurns(transcriptPath, 10); // 직전 10턴
    const approvalPatterns = [
      /진행해|구현해|실행해|승인|박제해/,
      /\/auto\b/,
      /OK|좋다|좋아/,
    ];
    const hasApproval = recent.some(t =>
      t.role === 'user' && approvalPatterns.some(re => re.test(t.text))
    );

    if (!hasApproval) {
      console.error(JSON.stringify({
        decision: 'block',
        reason: 'Nexus 자율 결정 차단. 직전 10턴 내 Master 명시 승인 미발견. Master 승인 후 재시도.'
      }));
      process.exit(2);
    }
    process.exit(0);
  } catch (e) {
    // 실패 시 안전 측 통과 (hook 자체가 차단 무한루프 유발 금지)
    process.exit(0);
  }
});

function readRecentTurns(p, n) { /* SDK transcript 포맷 파싱 */ }
function logSkip(input) { /* system_state.hookSkips++ */ }
```

**핵심 결정 [Master 필요 #3]:** PreToolUse stdin JSON에 `transcript_path` 또는 직전 메시지 컨텍스트가 포함되는가? **SDK schema 직접 확인 전까지는 단언 불가.** 미포함 시 본 hook은 "Master 승인 인용" 검증을 못 함 → fallback은 **모든 mutation 차단 + Master 명시 ENV var 설정 요구** (예: `NEXUS_APPROVED=1 git commit ...`, D-187 `ALLOW_MAIN_COMMIT=1` 패턴 정합).

### Hook 1. assertion-grounding-required (보조, 2단계)

```javascript
// .claude/hooks/pre-tool-use-assertion-grounding.js
// 매처: PreToolUse(*) — 단, false-positive 폭증 가능. 매처 좁힐 것 권고
// 트리거: 직전 Nexus assistant message에 단언 패턴 포함 시
// 검증: 직전 N턴 내 Read/Grep/Bash(read-only) 도구 호출이 있었는지
// 차단: 단언 + 도구 호출 0 + 인용 0 시 차단

// 단언 패턴 (보수적 — 명확한 사실 단언만)
const ASSERTION_PATTERNS = [
  /\d+\s*(건|개|회|번)\b/,        // "11건", "8개"
  /있다|없다|이다|맞다|아니다/,    // 사실 단언
  /통과|실패|성공|차단/,           // 상태 단언
];

// 면제 (false-positive 회피)
const EXEMPT_PATTERNS = [
  /\[추측\]|\[제안\]|추측|제안|것 같다|모르겠다/,
  /\?$/, /\?\s*$/m,                // 질문
  /T[1-5]\/A[0-4]\/O[1-5]/,        // 이미 등급 부착
];
```

**Riki risk 명시:** 정규식 단언 추출은 D-185 옵션 B 기각 사유 직격탄. Goodhart 위험 + 자연어 비결정성. **본 hook은 운영 1주 후 false-positive 카운트 보고 후 도입 판단.**

### Hook 3. grounded-vs-speculation-tag (시범, 3단계)

```javascript
// .claude/hooks/pre-tool-use-tag-required.js
// 매처: PreToolUse(Edit|Write) — 박제성 행위 직전만
// 트리거: 직전 Nexus message에 단언 + 태그 없음
// 검증: [근거] / [추측] / [제안] 태그 부착 여부
// 차단: 미부착 시 process.exit(2)
```

**Hickey 평가:** Hook 3은 Hook 1의 사실상 부분집합 + 형식 강제 추가. **별도 hook으로 분리하는 이점 약함 → Hook 1에 통합 권고.** 별도 운영 시 형식만 강제하고 의미 검증은 못 함 → Goodhart 가속.

---

## 3. Riki Risk Pre-Audit (false-positive ≥ 5건)

### FP-1. transcript_path SDK 미보장 [T2/A1/O1]
PreToolUse stdin JSON schema에 `transcript_path` 필드 보장 안 됨 (확인 필요). 미보장 시 Hook 2의 "Master 승인 인용 검증"이 사실상 동작 안 함 → fallback 설계 의무.

### FP-2. 단언 패턴 정규식의 자연어 비결정성 [T3/A2/O3]
- "1건" 같은 패턴은 질문문("1건 맞나요?")에도 매칭. 면제 패턴(`\?$`)이 불충분.
- 한국어는 어순 자유 → 종결어미 검출 외 신뢰 가능 패턴 부족.
- **결과:** Hook 1·3은 운영 1~2주간 차단 0건(warn-only) 시범 필수.

### FP-3. 정상 응급 우회 자체에 hook 작동 [T3/A2/O3]
Master가 응급 mutation 지시 후 인용이 자연어로 "그렇게 해"인 경우 Hook 2가 차단 가능. 승인 패턴 사전 정의는 본질적으로 불완전.

### FP-4. hook 무한 루프 위험 [T3/A2/O3]
Hook 2 차단 → Nexus 재시도 → 또 차단 → Nexus가 우회 시도(이게 hook 통과). 우회 자체가 또 mutation이므로 무한 루프 또는 Master 알림 폭증.

### FP-5. session_index/transcript 회수 비용 [T2/A1/O3]
직전 10턴 회수가 매 mutation tool call 직전 발생 → I/O 비용 누적. 단일 워크트리·실측 미확인이지만 PreToolUse는 hot path → 캐시 또는 mutation tool만 매처로 좁혀야 함.

### FP-6. emergency-disabled 패턴 재발 [T4/A2/O5]
sage-gate hook이 `.emergency-disabled` 접미사로 비활성화된 채 settings.json은 미동기화 (진단 1-1). **본 hook 풀세트 도입 후 동일 사고 재발 가능.** 비활성화·동기화 절차 자체를 Master 결정으로 박제 필요 [Master 결정 필요 #4].

### FP-7. 발화 시점 차단 구조적 불가 가능성 [T2/A1/O1, **추측**]
Claude Code SDK에 AssistantMessage/Stop 매처 부재 시 Nexus 발화 자체는 차단 불가 → 행동(tool call) 시점 차단만 가능. **Master 요구 "발화 시점 자기검열"은 SDK 한계로 불가능할 수 있음.** 차선책: 발화 후 다음 tool call 시점 회수 검증. Master 결정 필요 #2와 동일.

---

## 4. 구현 우선순위 (Hickey 단순화 원칙)

**Phase 1 (즉시, MVP):**
- (a) sage-gate `.emergency-disabled` 처리 — settings.json 동기화 또는 파일명 복구 [Master 결정 필요 #4]
- (b) **Hook 2 단독 도입** (no-autonomous-decision) — Edit/Write/Bash(mutating) 매처만
- (c) 모든 mutation에 ENV var 우회 경로 확보 (`NEXUS_APPROVED=1` 패턴) — Master 명시 승인 시 사용
- 의존: PreToolUse stdin JSON schema 확인 (Master 결정 #2·#3)

**Phase 2 (운영 1~2주 후):**
- Hook 2 false-positive 카운트 ≤ 임계 시 → Hook 1 warn-only 도입
- 단언 패턴·면제 패턴 운영 데이터로 보정

**Phase 3 (Phase 2 안정 후):**
- Hook 3은 Hook 1에 통합 또는 폐기 판단

**짓지 않음 옵션 잔존:** 모든 단계에서 **Master/Riki 외부 검증 게이트(Sage O3)** 병행. Hook 단독 의존 금지 (D4 정합).

---

## 5. Master 결정 필요 항목

| # | 항목 | 이유 | Arki 임의 결정 금지 사유 |
|---|---|---|---|
| **#1** | Master 발언 "넣어두었다"가 지칭하는 hook 위치 | 본 워크트리에서 발견 0건. 다른 워크트리 또는 글로벌 `~/.claude/`에 있을 수 있음 | 추측 단언 = DVA-A 재현 |
| **#2** | Claude Code SDK schema의 PreToolUse stdin에 `transcript_path` 또는 직전 메시지 컨텍스트 포함 여부 | Hook 2 핵심 의존. 미포함 시 fallback (ENV var 패턴) | 본 보고서에서 schema 직접 fetch 안 함 |
| **#3** | AssistantMessage/Stop 매처 SDK 지원 여부 | 발화 시점 직접 차단 가능 여부 결정 | 위와 동일 |
| **#4** | sage-gate `.emergency-disabled` 처리 방향 — 복구 / 영구 폐기 / settings.json 제거 | 본 사고(silent miss) 직접 원인 | 정책 결정 영역 |
| **#5** | Hook 2 차단 우회 ENV var 명명(`NEXUS_APPROVED`) 및 적용 범위 | D-187 `ALLOW_MAIN_COMMIT` 패턴 정합 vs 별도 명명 | 명명·정책 결정 영역 |
| **#6** | Phase 1 즉시 도입 vs Phase 1 설계 박제만 후 Dev 위임 | Arki는 spec까지, 구현은 Dev | spec 동결(`spc_lck=Y`) 조건 |
| **#7** | 본 hook 풀세트 도입 자체가 "정책 박제 = 해결" 메타 패턴(Sage M-1) 재현 가능성 | D-185 옵션 B 기각 사유 정합 | 메타 판단은 Master 영역 |

---

## 6. 자기감사 (4축 × 3라운드)

### 1차 — Round 1

| 축 | 발견 (각 ≥3) | ROI |
|---|---|---|
| **structuration** | (1) Hook 1·3 중복 영역 분리 모호 (2) transcript_path 의존이 SDK 미보장 단일 점 (3) PreToolUse 매처 좁힘 vs 넓힘 결정 미박제 | MUST_NOW / MUST_BY_N=10 / MUST_NOW |
| **hardcoding** | (1) 정규식 패턴 코드 하드코딩 — `dispatch_config.json` 같은 SOT 분리 안 됨 (2) "직전 10턴" N=10 매직 넘버 (3) 승인 키워드 리스트 하드코딩 | MUST_BY_N=10 / SHOULD / MUST_BY_N=10 |
| **efficiency** | (1) PreToolUse hot path I/O 비용 (2) 매 mutation마다 transcript 회수 — 캐시 부재 (3) Hook 2·1·3 모두 transcript 읽기 — 공유 라이브러리화 미설계 | SHOULD / SHOULD / MUST_BY_N=30 |
| **extensibility** | (1) hook 추가 시 settings.json 수동 등록 — sage-gate 사고 재발 가능 (FP-6) (2) Phase 2·3 도입 시 false-positive 카운트 박제 위치 미정 (3) ENV var 우회 명명 컨벤션 부재 | MUST_NOW / MUST_BY_N=10 / MUST_BY_N=10 |

### 2차 — Round 2 (Master "한번 더" 가정)

축 전환 검토: **structuration → 권한 모델**.
- 발견 R2-1: Hook 2가 "Master 승인 인용"을 검증하면서 정작 **Sage exclusive 격리는 별도 hook(sage-gate)** — 권한 검증이 분산. 단일 권한 게이트로 통합 검토 필요. [ROI: SHOULD]
- 발견 R2-2: ENV var 우회 패턴(`ALLOW_MAIN_COMMIT`, `NEXUS_APPROVED`)이 누적되면 우회 키 자체가 합의 없는 정책. SOT(`dispatch_config.json` 같은) 통합 필요. [ROI: MUST_BY_N=30]
- 발견 R2-3: 본 보고서가 hook 3종을 명세하지만 **단일 hook(Hook 2)으로 90% 가치 달성** 가능 — 풀세트 명세 자체가 scope drift. [ROI: MUST_NOW — Master 결정 #6과 동일]

### 3차 — Round 3

- 발견 R3-1: No issue at structuration (R1·R2에서 적출 종료)
- 발견 R3-2: No issue at hardcoding (R1에서 적출 종료, SOT 분리는 Phase 2 영역)
- 발견 R3-3: efficiency — PreToolUse hot path가 진짜 비용 문제인지 실측 안 됨. **추측 기반 우려** 가능. [ROI: DEFER — 실측 후 판단]
- 발견 R3-4: extensibility — settings.json 자동 동기화 스크립트 필요성. [ROI: NICE]

### scope drift 체크
원 spec("3 hook 설계서") × 본 보고 분량 ≈ 1.0x. 풀세트 명세는 spec 충실. **다만 Round 2 R2-3 발견으로 "단일 hook 권고"가 본질** — Arki 권고는 Phase 1 단일 hook.

### 종료
Round 3 발견 = 2건(NICE/DEFER만). 종료 조건 충족. **Master 또는 Ace 승인 대기.**

---

## 7. spec 동결 선언

본 보고서는 **설계 spec rev1**. Dev 인계 직전 spec 동결 선언 보류 — Master 결정 #1~#7 답변 후 rev2에서 동결.

`spc_lck=N` (현 시점).

---

```
[ROLE:arki]
# self-scores
aud_rcl: 1.0
str_fd: 4
spc_lck: N
sa_rnd: 3
```
