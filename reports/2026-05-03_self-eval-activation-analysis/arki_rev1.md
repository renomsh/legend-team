---
role: arki
session: session_179
topic: topic_155
topicSlug: self-eval-activation-analysis
turnId: 0
invocationMode: subagent
date: 2026-05-03
rev: 1
---

ARKI_WRITE_DONE: reports/2026-05-03_self-eval-activation-analysis/arki_rev1.md

# Arki — 셀프 평가 미가동 원인 분석

## 1. 데이터 축: selfScores 실제 기록 여부

**최근 리포트 파일 스캔 결과:**

- `reports/2026-05-03_pd055-turnid-mismatch-fix/dev_rev1.md` 말미 → `[ROLE:dev]\n# self-scores` 블록 **존재** ✓
- `reports/2026-05-03_pd055-turnid-mismatch-fix/edi_rev1.md` 말미 → `[ROLE:edi]\n# self-scores` 블록 **존재** ✓
- `reports/2026-05-03_pd055-turnid-fix/riki_rev1.md` 말미 → **없음** (transcript에만 존재)

**self_scores.jsonl 커버리지:**
- 총 레코드: 52건
- 마지막 sessionId: `session_129` (2026-04-28)
- session_130 ~ session_179: **0건** — 완전 공백 (49+ 세션 연속 누락)

**`memory/growth/signature_metrics_aggregate.json`:**
- `computedAt: 2026-05-03T13:49:56.437Z` — 최근 실행
- `recordCount: 52` — session_129까지만 집계
- mean 값은 2건 이상 있는 지표만 유효값 보유

**판정: ⚠️ 갭** — 리포트 파일에는 블록 있음. `self_scores.jsonl`은 49세션 적재 중단.

---

## 2. 파이프라인 축: 집계 로직 존재 여부

**파이프라인 단계 (auto-push.js hook chain):**
```
[A] pre-tool-use-task.js   → _common.md inject (self-scores 출력 지시 포함)
[B] post-tool-use-task.js  → extractSelfScores(tool_response) → turns[].selfScores
[C] finalize-self-scores.ts → turns[].selfScores → self_scores.jsonl
[D] compute-signature-metrics.ts → self_scores.jsonl → signature_metrics_aggregate.json
[E] growth.html            → signature_metrics_aggregate.json 렌더
```

**각 단계 점검:**

| 단계 | 코드 존재 | 실제 작동 |
|------|----------|----------|
| [A] _common.md inject | ✅ | ✅ (pre-tool-use-task.js v3 확인) |
| [B] extractSelfScores | ✅ 존재 | ❌ **null 반환** (핵심 결함) |
| [C] finalize-self-scores.ts | ✅ | ⚠️ 입력 없어서 0건 |
| [D] compute-signature-metrics.ts | ✅ | ⚠️ 52건만 처리 |
| [E] growth.html 렌더 | ✅ | ⚠️ 구 데이터만 표시 |
| feature_flags.json | signatureMetricsEnabled: true | ✅ |

---

## 3. 대시보드 축: 표시 로직 확인

`app/growth.html`은 다음을 로드:
1. `data/memory/growth/metrics_registry.json` — 지표 정의
2. `data/memory/growth/signature_metrics_aggregate.json` — 집계값
3. `data/memory/shared/feature_flags.json` — feature flag

**현 상태:** feature flag ON, 집계 파일 존재, 52건 기준 mean값 존재.
대시보드는 session_129 이전 데이터를 "정상 표시"하고 있음.
**문제는 "점수가 없음"이 아니라 "49세션치 최신 데이터가 없음".**

---

## 4. hook 축: 자동 실행 체인 확인

**auto-push.js hook chain 확인:**
```js
'npx ts-node scripts/finalize-self-scores.ts'  // 3번째 스텝
```
- `--transcript` 인자 없음 → `current_session.json.turns[].selfScores`만 읽음
- turns[].selfScores가 비어있으면 → 0건 기록
- transcript 파일(`.claude/projects/.../*.jsonl`)은 pipeline에서 미사용

**session-end-tokens.js:** transcript를 token 집계용으로만 사용, selfScores 파싱 없음.

---

## 5. 근본 원인 진단 (4축 교차)

### 직접 원인: extractSelfScores content array \n 이스케이프 문제

**실증 경로:**

1. **transcript 확인** (`94d58746...jsonl`, session_178):
   - `[ROLE:riki]\n# self-scores\ncrt_rcl: Y\ncr_val: 3\nprd_rej: Y\nfp_rt: 0.10` — transcript에 **존재**
   - 위치: `toolUseResult.content[0].text` 내부 (content array 객체)

2. **PostToolUse hook 입력 형식 (핵심):**
   - Claude Code PostToolUse hook의 `tool_response` = content block array
   - 형식: `[{"type":"text","text":"RIKI_WRITE_DONE:...\n[ROLE:riki]\n# self-scores\n..."}]`

3. **extractSelfScores 처리 경로:**
   ```js
   if (typeof toolResponse === 'object') {
     text = toolResponse.content   // undefined (array엔 .content 없음)
          || toolResponse.result   // undefined
          || toolResponse.text     // undefined
          || JSON.stringify(toolResponse);  // ← 여기로 fallback
   }
   ```
   `JSON.stringify([{"type":"text","text":"...\n# self-scores\n..."}])`  
   → `'[{"type":"text","text":"...\\n# self-scores\\ncrt_rcl: Y\\n..."}]'`  
   `indexOf('# self-scores')` → **찾음** (# 문자는 JSON 이스케이프 없음)  
   `text.slice(idx + ...).split(/\r?\n/)` → **\n이 \\n으로 이스케이프** → split 불발  
   → 한 줄로 합쳐진 `"crt_rcl: Y\\ncr_val: 3\\n..."` → key:value 파서 실패  
   → `Object.keys(scores).length === 0` → **null 반환**

4. **extractReportsPath가 작동하는 이유:**
   - JSON.stringify 결과에서 `RIKI_WRITE_DONE: /c/...` 패턴 찾음
   - 경로에는 이스케이프 필요 문자 없음 → 정규식 매칭 성공
   - 이것이 "frontmatter 패치는 작동하지만 selfScores는 null"의 비대칭 원인

5. **D-106 fix 효과 미달:**
   - D-106 (session_137): `_common.md`에 "채팅 응답에 반드시 포함" 지시 추가
   - 서브에이전트는 **실제로 준수** — tool_response에 블록 포함
   - 그러나 hook의 content array 처리 버그로 파싱 실패
   - **지시 준수 → 파싱 버그 → 적재 0건** 패턴

### 타임라인 정리

| 세션 | 상태 | 이유 |
|------|------|------|
| session_101, session_129 | ✅ 적재 성공 | v2 hook 시기: inject 작았고 tool_response가 string 형식 |
| session_130+ | ❌ 적재 0건 | v3 hook + inject 비대: 서브에이전트가 Write 활용 → tool_response가 content array 형식으로 전환 |
| session_138+ (D-106 이후) | ❌ 여전히 0건 | D-106은 content array 파싱 버그를 고치지 않음 |

### 추가 결함: finalize-self-scores.ts transcript 미활용

- session-end-tokens.js는 transcript를 찾아서 읽음 (hook-diagnostics.log 확인)
- transcript에는 selfScores 블록이 존재 (session_178: 11건 grep 확인)
- 그러나 finalize-self-scores.ts는 `--transcript` 없이 호출 → transcript 미파싱
- **두 번째 수정 기회가 auto-push.js에 있음**

---

## 6. 구조적 실행 방향 제안

### 설계 옵션 3개

**옵션 A — extractSelfScores content array 처리 수정** (권고)
- 위치: `.claude/hooks/post-tool-use-task.js` `extractSelfScores()` 함수
- 수정: `typeof toolResponse === 'object'` 분기에 Array 처리 추가
  ```js
  if (Array.isArray(toolResponse)) {
    text = toolResponse
      .filter(item => item.type === 'text')
      .map(item => item.text || '')
      .join('\n');
  } else if (typeof toolResponse === 'object') {
    text = toolResponse.content || toolResponse.result || toolResponse.text || JSON.stringify(toolResponse);
  }
  ```
- 코드 변경: 5줄 추가
- mitigation: 기존 동작 유지(string/object 경로 불변), Array만 새 경로 추가
- fallback: 파싱 실패 시 기존대로 null → gap 기록

**옵션 B — finalize-self-scores.ts에 transcript 스캔 추가**
- auto-push.js에서 `--transcript {resolvedPath}` 인자 추가
- finalize-self-scores.ts가 transcript의 [ROLE:x] + # self-scores 블록 파싱
- 단점: transcript 경로 resolve 로직 중복, session-end-tokens.js 의존
- fallback: transcript 없으면 turns[] 경로 그대로

**옵션 C — 보고서 파일 스캔 (D-106 이전 Riki R-1 기각 이력)**
- reports/{slug}/*.md 파일에서 frontmatter `role:` + `# self-scores` 블록 파싱
- 이전 분석(session_137)에서 `parseYamlBlocks`가 frontmatter role 미인식으로 기각됨
- 수정하면 가능하나 복잡도 증가

### 권고: 옵션 A 우선, 옵션 B 보완

**실행 순서:**
1. **G1** (옵션 A): `extractSelfScores`에 Array 처리 추가 + 단위 테스트
2. **G2** (검증): 다음 Grade A/S 세션에서 turns[].selfScores 적재 확인
3. **G3** (선택): 옵션 B로 기존 49세션 소급 (transcript 아직 존재하면)

**의존 그래프:**
```
G1 완료 → G2 자연 검증 → G3 소급 여부 판단
```

**롤백:** G1 변경 전 `post-tool-use-task.js` 백업. 실패 시 기존 파일 복원.

**중단 조건:** G1 후에도 turns[].selfScores = {} 이면 → transcript 직접 디버깅 필요 (옵션 B로 전환).

---

## 자기감사 (1차)

### structuration
- 의존 그래프 명확: A→B→C→D→E 단방향 파이프라인. 분리 양호.
- `MUST_NOW`: extractSelfScores Array 처리 결함 즉시 수정.

### hardcoding
- extractSelfScores 내 `'# self-scores'` 리터럴: 변경 가능성 낮음, SHOULD 수준.
- `'text'` 타입 필터: content block spec 변경 가능성 있음, `MUST_BY_N=10` 대비.

### efficiency
- JSON.stringify(array) 후 indexOf 방식: 불필요한 직렬화. 옵션 A 적용 시 제거됨.
- `MUST_NOW` 수준 (파싱 실패 원인이므로).

### extensibility
- Array 처리 추가 후: 향후 multi-content-block 형식 대응 가능.
- 현재 구조는 string/object/array 3 케이스로 완전 커버 가능.
- No issue at this dimension (구조적 확장 불필요).

**판정: 1차 감사 결론 — 결함 명확, 수정 범위 좁음. 추가 라운드 불필요.**

---

[ROLE:arki]
# self-scores
aud_rcl: Y
str_fd: 3
spc_lck: N
sa_rnd: 1
