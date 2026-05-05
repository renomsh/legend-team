---
role: riki
topic: close.md 토큰 최적화 G3/G4 리스크 감사
date: 2026-05-05
session: session_197
turnId: 1
invocationMode: subagent
---

# Riki — G3/G4 리스크 감사

Riki입니다.

## 감사 범위

- **G3**: `master_feedback_log.json` Step 6 — 전문 Read 금지 + `apply-feedback.ts` CLI 위임
- **G4**: `{role}_memory.json` Step 7 — 전문 Read 금지, `lessonLog[]` append-only Edit 원칙

---

## G3 리스크 감사

### 🔴 R-1. apply-feedback.ts 인수 누락 시 Step 6 완전 스킵

**근거 (코드 직접 확인):**
```typescript
// apply-feedback.ts L22-25
if (!topicId || !phase || !feedback || !directive) {
  console.error('Usage: ts-node scripts/apply-feedback.ts ...');
  process.exit(1);
}
```
4개 인수(topicId, phase, feedback, directive) 중 하나라도 누락 시 `process.exit(1)` — 스크립트 전체 중단. LLM이 Bash로 CLI를 호출할 때 `feedback` 또는 `directive` 인수에 복잡한 자연어(공백·특수문자 포함)를 넘기면 shell 파싱 오류로 인수가 잘못 분리될 수 있다.

**실패 파손 범위:** Master 피드백이 `master_feedback_log.json`에 기록되지 않은 채 세션 종료. 전문 Read 금지 정책으로 LLM이 기록 여부를 확인할 수 없으면 누락 감지 경로도 차단됨.

**완화 조건:**
1. escape hatch: 스크립트 실패 시 LLM이 직접 JSON append 허용하는 조건을 close.md에 명시 (Arki 이미 제안)
2. 추가 강화: CLI 호출 후 exit code 검사 → 0이 아니면 escape hatch 자동 발동 지시를 close.md에 박을 것

---

### 🟡 R-2. apply-feedback.ts는 global log만 기록, topic-level 기록 포함

**근거:**
```typescript
// apply-feedback.ts L29-39
const topicFeedbackPath = path.join(topicDir, 'topics', topicId, 'master_feedback.json');
const globalLogPath = path.join(ROOT, 'memory', 'master', 'master_feedback_log.json');
```
스크립트는 **두 곳**에 기록한다 — topic-level `master_feedback.json` + global `master_feedback_log.json`. Arki의 제안("apply-feedback.ts CLI 위임")은 이 두 곳 모두 올바르게 처리하지만, close.md 지시에 `topicId`를 명시적으로 넘기도록 강제하지 않으면 topic-level 기록이 누락될 수 있다.

**실패 파손 범위:** topic-level `master_feedback.json`에 피드백 미기록 → topic 종결 검증(`validate-topic-closure.ts`)에서 gap 발생 가능.

**완화 조건:** close.md G3 지시에 "현재 topicId를 첫 번째 인수로 반드시 전달" 명시. escape hatch에도 동일 경고 포함.

---

### 🟢 R-3. status 필드 처리 (기각)

apply-feedback.ts는 신규 entry의 status를 `'applied'`로 고정한다. CLAUDE.md §Asset Protocols는 status ∈ {pending, in-progress, resolved}를 명시하나, 세션 종료 시점 Step 6에서 기록되는 피드백은 이미 적용 완료 상태가 맞으므로 `'applied'` 고정은 정책과 불일치처럼 보이지만 — close 시점에 기록하는 피드백의 의미상 문제 없다. 의사결정에 영향 없음 → 기각.

---

## G4 리스크 감사

### 🔴 R-4. lessonLog 필드 미존재 역할 파일에서 append-only Edit 실패

**근거 (파일 직접 확인):**
`riki_memory.json` — `lessonLog` 필드 없음 (grep 결과: no match).
`vera_memory.json` — `lessonLog_session032`, `lessonLog_session046` 등 **분리된 키** 구조 (비표준).
`sage_memory.json`, `zero_memory.json` — `lessonLog` 없음.

"lessonLog[] append-only Edit 원칙"을 박제할 경우, 필드가 없는 역할 파일에서 LLM이 append-only Edit을 시도하면:
- 경로 `memory/roles/riki_memory.json` → `lessonLog` 배열 없음 → Edit 실패 또는 잘못된 위치에 임시 키 생성

**실패 파손 범위:** 일부 역할의 lesson이 기록 안 되거나, 파일 구조가 오염됨(비표준 키 추가). 전문 Read 금지 정책 하에서는 LLM이 필드 존재 여부를 사전 확인할 수 없어 blind append 실패.

**완화 조건:**
1. G4 박제 전에 모든 역할 파일에 `lessonLog: []` 필드를 사전 초기화 (one-time migration)
2. escape hatch: 필드 미존재 시 전문 Read 허용 → 필드 추가 후 append
3. vera처럼 비표준 구조인 파일은 정규화 후 박제

---

### 🟡 R-5. 전문 Read 금지 + 중복 lesson 방지 불가

**근거:** lessonLog에 이미 동일 세션 lesson이 있는지 확인하려면 Read가 필요하다. 전문 Read 금지 + append-only 조합에서 LLM은 중복 여부를 알 수 없다.

**실패 파손 범위:** 같은 세션에서 재시도 시 동일 lesson 중복 append 가능. 데이터 오염이지만 검색·사용에는 영향 경미.

**완화 조건:** 중복은 허용 residual risk로 처리 가능. lessonLog는 append-only 기록용이므로 중복이 존재해도 결정적 손상은 아님. escape hatch 조건에 "lesson 확인 목적 Read" 추가.

---

### 🟢 R-6. 역할 메모리 전문 토큰 절감 효과 의문 (기각)

"~6K tokens/세션" 절감을 G4 목적으로 제시했으나, lessonLog 외 다른 필드(topicsHandled, selfAuditProtocol 등) 읽기가 필요한 시나리오에서 escape hatch가 빈번히 발동되면 실제 절감 효과가 줄어들 수 있다 — 그러나 이는 운용 효율 문제이지 정책 정합성 리스크가 아님. 의사결정에 영향 없음 → 기각.

---

## 기각된 리스크 목록

| 리스크 | 기각 이유 |
|---|---|
| R-3 (apply-feedback.ts status 불일치) | close 시점 기록의 의미상 맞음, 실질 영향 없음 |
| R-6 (G4 토큰 절감 효과 의문) | 운용 효율 문제, 정책 정합성 리스크 아님 |

---

## 최종 판정

**G3: 조건부 박제 권고**
- escape hatch 명시 + exit code 검사 지시 추가 조건으로 박제 권고
- R-1(🔴)은 escape hatch로 완화 가능하므로 구조 자체는 안전

**G4: 박제 전 사전 작업 필수**
- `lessonLog: []` 미존재 역할 파일 일괄 초기화 선행 없이 박제 시 R-4(🔴) 즉시 발동
- 초기화 완료 후 박제 권고. vera 비표준 구조 정규화도 병행 필요

---

[ROLE:riki]
# self-scores
crt_rcl: 0.80
cr_val: Y
prd_rej: Y
fp_rt: 0.33
