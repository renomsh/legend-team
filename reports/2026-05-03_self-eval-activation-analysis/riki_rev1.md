---
role: riki
session: session_179
topic: topic_155
topicSlug: self-eval-activation-analysis
turnId: 1
invocationMode: subagent
date: 2026-05-03
rev: 1
---

RIKI_WRITE_DONE: reports/2026-05-03_self-eval-activation-analysis/riki_rev1.md

# Riki — 리스크 감사

## Arki 진단 정확성 검증 (코드 직접 확인)

### 1. extractSelfScores Array 분기 부재 — 확인

`post-tool-use-task.js` line 159-161 실제 코드:
```js
else if (typeof toolResponse === 'object') {
  text = toolResponse.content || toolResponse.result || toolResponse.text || JSON.stringify(toolResponse);
}
```

`Array.isArray` 분기 없음. **확인됨.**

### 2. 실제 tool_result 형식 직접 검증

session_178 transcript (`21f17a4a-...jsonl`) tool_result #10(Arki 서브에이전트 응답) 직접 확인:

```
toolResponse typeof: object
toolResponse is array: true
```

raw text 내 실제 값:
```
# self-scores idx in raw text: 3310
raw tail: "# self-scores\naud_rcl: Y\nstr_fd: 3\nspc_lck: N\nsa_rnd: 1"
```

JSON.stringify 후 상태:
```
# self-scores\naud_rcl: Y\nstr_fd: 3\nspc_lck: N\nsa_rnd: 1
```
→ `\n`이 `\\n` 이스케이프됨 → `split(/\r?\n/)` 1줄로 처리 → 파싱 0건.

**Arki 진단 전체 정확. 추측 없음. 원문 근거 실증.**

---

## 확인된 리스크

### 🟡 R-1. transcript 소급 경로에서 `[ROLE:]` 마커 미인식 가능성

**실증 지점:**

transcript(`21f17a4a-...jsonl`) 분석 결과, assistant 타입 메시지의 content block 내 tool_result는
`string` 또는 `Array` 두 형식이 혼재:

- tool_result #1 (Read 툴 응답): `tc typeof: string`
- tool_result #10 (Agent/Task 응답): `tc typeof: object, is array: true`

그리고 오늘 현재 transcript에서 `[ROLE:]` 마커는 **0건** (검색 결과):
```
ROLE marker lines: 0
```
transcript의 `assistant` 타입 메시지들은 서브에이전트 응답이 아니라 Main 본체 발언이다.
서브에이전트 응답은 `user` 타입 메시지의 `tool_result` content로만 존재한다.

**실패 시 파손 범위:**
Arki가 제안한 옵션 B(finalize-self-scores.ts에 transcript 스캔 추가)를 구현하면,
`parseYamlBlocks(text)`가 transcript 전체 raw text를 입력받는다.
그런데 transcript jsonl에서 `[ROLE:]` 마커가 직접 보이지 않는 이유:
- transcript의 tool_result content가 `[{"type":"text","text":"...[ROLE:arki]\\n# self-scores\\n..."}]` 형식으로 저장됨
- 이 JSON string을 `fs.readFileSync` 후 `text.split(\n)` 하면 `[ROLE:arki]\\n# self-scores\\n` 형태로 남음
- `parseYamlBlocks`의 `line.match(/^\[ROLE:(\w+)\]$/)` → 매칭 실패 (이스케이프된 `\\n`으로 연결된 한 줄)

**완화 조건:**
옵션 A(extractSelfScores Array 수정)만 적용할 경우 이 리스크는 무관.
옵션 B를 추가 구현할 때는 transcript에서 tool_result content를 JSON.parse 후 `.text` 필드 추출 과정 필요 — raw text 직접 grep 방식으로는 동일 이스케이프 문제 재현.

---

### 🟡 R-2. 옵션 A 수정 후 "다음 세션 자연 검증"이 유일한 게이트 — 실패 무음화 위험

**실증 지점:**

현재 `extractSelfScores` 실패 시 동작:
```js
const selfScores = extractSelfScores(input.tool_response || input.toolResponse);
if (selfScores) {
  newTurn.selfScores = selfScores;
  log(`selfScores 추출: role=${role} keys=[${Object.keys(selfScores).join(',')}]`);
}
```
성공하면 log, 실패하면 **무음**. `null` 반환 시 turns에 selfScores 없이 push.

옵션 A 수정 후에도, 새 Array 분기가 올바른 text를 뽑더라도 `# self-scores` 블록이
서브에이전트 발언 구조 변화로 마커 위치가 달라지면 파싱 실패가 무음으로 지속된다.

49세션이 무음으로 누락된 현재와 동일한 패턴이 재현 가능.

**실패 시 파손 범위:**
수정 후에도 파싱 실패가 있으면 `growth.html`은 계속 구 데이터 표시.
Master가 직접 `self_scores.jsonl` 건수를 확인하지 않으면 감지 불가.

**완화 조건:**
수정 후 즉시 단위 테스트 1건만 추가하면 충분:
```js
// 입력: [{"type":"text","text":"[ROLE:riki]\n# self-scores\ncrt_rcl: Y\n"}]
// 기대: { crt_rcl: 'Y' }
```
`npx jest extractSelfScores` 또는 단발 node 스크립트로 충분. "다음 세션 자연 검증"에만 의존하면
수정 실수 감지에 1+ 세션이 소요됨.

---

## 기각 목록 (의도적 제외)

- **content array ↔ string 혼재로 기존 string 경로 파손 가능성**: Array 분기를 별도 if 블록으로 앞에 두면 기존 string 경로는 else if로 유지 — 파손 없음. 기각.
- **소급 49세션치 데이터 정합성 문제**: self_scores.jsonl에 잘못된 데이터가 들어갈 위험은 옵션 B(transcript 소급)를 하지 않으면 무관. 현재 권고는 옵션 A 단독. 기각.
- **`extractReportsPath`도 동일 수정 필요**: 동 함수는 `\n` split 불필요(경로 단일 토큰). 기각.

---

## 수정 승인 여부

**옵션 A(Array 분기 추가) — 승인.** 리스크 R-1, R-2 모두 옵션 B 미적용 시 무관하거나 단위 테스트 1건으로 완화 가능.

**조건부 추가 요청:**
수정 후 `extractSelfScores` 단위 검증 스크립트 1건 실행 결과를 Master에게 출력할 것.
"다음 세션 자연 검증"만으로는 R-2 완화 불충분.

[ROLE:riki]
# self-scores
crt_rcl: Y
cr_val: 4
prd_rej: Y
fp_rt: 0.00
