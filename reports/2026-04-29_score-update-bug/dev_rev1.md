---
sessionId: session_137
topicId: topic_126
role: dev
rev: 1
date: 2026-04-29
turnId: 1
invocationMode: subagent
accessed_assets:
  - file: memory/roles/policies/_common.md
    scope: self-scores 출력 계약
  - file: memory/roles/policies/role-ace.md
    scope: self-scores 지표 키
  - file: memory/growth/self_scores.jsonl
    scope: 최근 적재 데이터
  - file: .claude/hooks/post-tool-use-task.js
    scope: extractSelfScores 함수
  - file: scripts/finalize-self-scores.ts
    scope: 파싱·적재 로직
  - file: scripts/auto-push.js
    scope: hook chain 호출 순서
---

DEV_WRITE_DONE: reports/2026-04-29_score-update-bug/dev_rev1.md

# Dev 점검 보고 — self-score 파이프라인 (session_137)

## 점검 1. inject 내용 — 서브에이전트에 self-scores 출력 지시가 포함되는가?

**확인 경로**: `memory/roles/policies/_common.md`

파일 존재 확인. 31-37번째 줄에 명확한 계약 포함:

```
## Self-Score YAML 출력 계약 (PD-023 §5.1 준수, PD-035 박제)
발언 본문 말미에 다음 YAML 블록 포함 필수:
  # self-scores
  <key1>: <value>
```

`pre-tool-use-task.js v3`이 `buildPersonaLayer`에서 `_common.md` + `role-{r}.md` + `personas/role-{r}.md` 순서로 concat하여 inject. pre-tool-use-task.log에서 `phase: "mutate-v3-persona"` 정상 확인.

**판정: ✅ 정상** — inject 내용에 self-scores 출력 지시 존재.

---

## 점검 2. 최근 서브에이전트 report에 `# self-scores` 블록이 실제 존재하는가?

**확인 경로**: `reports/` 디렉토리 Grep

전체 reports/*.md 중 `# self-scores` 포함 파일: **73개**.

session_134 (2026-04-28, v3-persona) 보고서 샘플:
- `reports/2026-04-28_version-upgrade-criteria-redesign/ace_rev1.md` — 포함 ✓
- `reports/2026-04-28_version-upgrade-criteria-redesign/arki_rev1.md` — 포함 ✓
- `reports/2026-04-28_version-upgrade-criteria-redesign/riki_rev1.md` — 포함 ✓

session_130 dev_rev2 말미:
```yaml
# self-scores
rt_cov: 0.92
gt_pas: 1.0
hc_rt: 1.0
spc_drf: 0.95
```

**판정: ✅ 정상** — 보고서 파일에 `# self-scores` 블록 실제 존재.

---

## 점검 3. `memory/growth/self_scores.jsonl` 실데이터

```
총 레코드: 52건
마지막 sessionId: session_129
마지막 ts: 2026-04-28T08:09:12.332Z
```

session_130 ~ session_137 (현재 세션): **레코드 0건**.

`npx ts-node scripts/finalize-self-scores.ts` 직접 실행 결과:
```
[finalize-self-scores]
  session:        session_137
  topicType:      standalone
  recordsWritten: 0
  defaultsUsed:   0
  orphans:        0
```

**판정: ⚠️ 갭** — session_129 이후 적재 중단. 7세션 연속 0건.

---

## 점검 4. hook chain 호출 경로

`scripts/auto-push.js` line 75:
```js
const steps = [
  'node .claude/hooks/session-end-tokens.js',
  'node .claude/hooks/session-end-finalize.js',
  'npx ts-node scripts/finalize-self-scores.ts',   // ← 3번째
  'npx ts-node scripts/compute-signature-metrics.ts',
  'npx ts-node scripts/compute-dashboard.ts',
  'node scripts/build.js',
];
```

`finalize-self-scores.ts`는 hook chain에 정상 연결. `--transcript` 인자 없이 호출되므로 `current_session.json.turns[].selfScores`만 읽는다.

**판정: ✅ 연결됨** — 단, 입력 소스가 비어있으면 0건 출력.

---

## 종합 판정: 파이프라인 어느 단계에서 끊겼는가?

```
[A] inject: ✅ _common.md에 self-scores 출력 지시 포함, v3 정상 inject
[B] 서브에이전트 tool_response → post-tool-use → turns[].selfScores: ❌ 결함 (핵심)
[C] finalize-self-scores.ts → self_scores.jsonl: ✅ 스크립트 존재·연결
[D] compute-dashboard → growth: ✅ 정상 (단, 입력 없으면 산출 없음)
```

### 실제 결함 위치: **[B] — post-tool-use-task.js extractSelfScores**

**근본 원인 (실증)**:

`extractSelfScores(toolResponse)` 함수는 `tool_response`에서 `# self-scores` 텍스트를 찾는다. 이 함수는 다음을 가정한다:

> 서브에이전트의 `tool_response`가 발언 전문(# self-scores 블록 포함)을 담은 PLAIN TEXT다.

**실제 동작**:
- 서브에이전트는 Write 툴로 파일에 전문을 저장하고, **채팅 응답에는 짧은 요약/마커만 반환**한다.
- `tool_response` = `"DEV_IMPL_DONE: reports/..."` 또는 짧은 최종 메시지.
- `# self-scores` 블록은 **파일에만** 존재, tool_response에 없다.
- `extractSelfScores(tool_response)` → `null` → `turns[].selfScores = {}`.

**session_129가 예외적으로 작동한 이유**:
- session_129 실행 시각: UTC 07:37-08:07 (KST 16:37-17:07)
- extractSelfScores 기능 추가: b45b144 (KST 14:40) ← session_129 실행 전
- session_129 inject 크기: arki=4217자, riki=226자 (v2 초기값)
- inject가 작을 때 서브에이전트가 full text를 직접 응답으로 반환했을 가능성. session_130+는 inject 크기가 8000-46000자로 증가 → 서브에이전트가 Write 툴 활용 패턴으로 전환.

**추가 확인**: `extractReportsPath`도 동일 원인으로 실패 (session_index의 모든 최근 세션에서 `reportPath: undefined`).

### 수정 방향 (Dev 판단)

파이프라인을 tool_response 의존에서 **파일 스캔 의존**으로 전환:

**Option A**: `finalize-self-scores.ts`에 reports/ 디렉토리 스캔 추가
- `reports/{slug}/*.md` 파일에서 frontmatter `role`과 `# self-scores` 블록을 읽어 roleScores 합산
- 현재 transcript 파서(`parseYamlBlocks`)를 확장 — `[ROLE:xxx]` 마커 대신 frontmatter `role:` 필드로 역할 식별
- auto-push 호출 시 `--reports-dir {reportPath}` 인자 추가

**Option B**: post-tool-use hook에서 파일 읽기
- `extractReportsPath`로 파일 경로 추출 후 실제 파일 읽어 self-scores 추출
- 단점: WRITE_DONE 마커 없는 역할(Ace, Arki 등)에서 경로 추출 불가

**권고**: Option A. finalize-self-scores.ts 단일 수정으로 전 역할 커버 가능.

---

```yaml
# self-scores
rt_cov: 0.90
gt_pas: 0.90
hc_rt: 0.00
spc_drf: 0
```
