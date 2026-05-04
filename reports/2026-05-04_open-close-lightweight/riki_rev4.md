---
role: riki
session: session_182
topic: topic_157
topicSlug: open-close-lightweight
turnId: 5
invocationMode: subagent
date: 2026-05-04
rev: 4
---

RIKI_WRITE_DONE: reports/2026-05-04_open-close-lightweight/riki_rev4.md

# Riki — Zero 검증 임무: ace_memory.json 로드 코드 존재 여부

---

## TL;DR

**Zero 판단: 대부분 맞음. 단, 하나의 중요한 부분이 틀림.**

- `topic_load_manifest.json`의 `loadMemory` 지정을 parse·실행하는 hook/script 코드: **0건 확인됨** (Zero 맞음)
- `pre-tool-use-task.js`가 `role-ace.md` 경로만 inject: **맞음** (Zero 맞음)
- `ace_memory.json`이 `/open` 시 실제로 로드된 적 없음: **현재 기준 맞음** — 단, **Zero가 누락한 사실이 있음**

**누락된 사실:** `topic_load_manifest.json` 자체에 이미 다음 note가 박제되어 있다.

> `"ace_memory는 topic_load_manifest에서 제거됨 — /open 시 nexus_memory_open.json으로 대체 (2026-05-04)"`

즉, Zero가 "ace_memory가 topic_load_manifest에 여전히 있는데 load 코드가 없다"고 분석했지만, 실제로는 **오늘(2026-05-04) 이미 제거된 상태**다. Zero의 분석 전제 자체가 이미 무효화된 문서를 기준으로 한 것.

---

## 검증 근거

### 1. `.claude/hooks/` 전 파일 — ace_memory / topic_load_manifest / loadMemory 키워드

```
grep -rn "ace_memory|topic_load_manifest|loadMemory" .claude/hooks/
→ 결과: 0건
```

**확인:** hook 코드 어디에도 이 키워드 없음. Zero 주장 일치.

### 2. `pre-tool-use-task.js` — 실제 inject 경로 확인

코드 실측 (line 154~177):
```
// 1. _common.md
const commonPath = path.join(cwd, 'memory', 'roles', 'policies', '_common.md');

// 2. policies/role-{role}.md
const policyPath = path.join(cwd, 'memory', 'roles', 'policies', `role-${role}.md`);

// 3. personas/role-{role}.md
const personaPath = path.join(cwd, 'memory', 'roles', 'personas', `role-${role}.md`);
```

inject 경로 3개: `_common.md` + `policies/role-{role}.md` + `personas/role-{role}.md`. `ace_memory.json` 직접 inject 없음.

**확인:** Zero 주장 일치.

### 3. `scripts/` — ace_memory / topic_load_manifest / loadMemory 키워드

```
grep -rn "ace_memory" scripts/
→ migrate-editor-pass3.ts:15, migrate-editor-pass4.ts:17, migrate-editor-to-edi.ts:28 — 3건
```

3건 전부 파일 경로 배열 나열용 (예: `'memory/roles/ace_memory.json'`). 내용 parse 없음.

```
grep -rn "topic_load_manifest|loadMemory" scripts/
→ 0건 (migrate-editor 제외)
```

**확인:** Zero 주장 일치.

### 4. `topic_load_manifest.json` 실제 내용 — ace_memory 존재 여부

```json
"_notes": [
  "ace_memory는 topic_load_manifest에서 제거됨 — /open 시 nexus_memory_open.json으로 대체 (2026-05-04)",
  ...
]
```

`loadMemory` 배열 어디에도 `ace_memory` 없음. 이미 제거 완료.

**Zero가 누락한 사실:** Zero는 "topic_load_manifest.json이 ace_memory를 loadMemory로 지정한다"고 전제했으나, 현재 파일에는 ace_memory가 없다. 이 전제가 틀림.

### 5. `topic_load_manifest.json` → hook/script 소비 코드

```
grep -rn "topic_load_manifest" .claude/hooks/ scripts/
→ 0건 (main branch 기준)
```

CLAUDE.md §Session Start checklist Step 4에 "Read `memory/shared/topic_load_manifest.json`" 지시가 있으나, 이는 LLM에 대한 자연어 지시문이지 hook/script 코드가 아님. 기계 실행 경로 없음.

**확인:** Zero 주장 일치.

### 6. nexus_memory_open.json 존재 여부

```
ls memory/shared/nexus_memory_open.json
→ EXISTS
```

hook/script에서 참조 코드: 0건 확인. topic_load_manifest의 대체재로 note에 명시되어 있으나, 이 파일도 현재 hook에서 자동 로드되지 않음.

---

## 판정 요약

| Zero 주장 | 판정 | 근거 |
|---|---|---|
| loadMemory 실행 코드 hook 0건 | **맞음** | grep 0건 확인 |
| loadMemory 실행 코드 scripts 0건 | **맞음** | grep 0건 확인 |
| pre-tool-use-task.js = role-ace.md만 inject | **맞음** | 코드 L154~177 실측 |
| ace_memory.json 실제 로드 없음 | **맞음** | 동일 |
| topic_load_manifest이 ace_memory를 loadMemory로 지정 | **틀림** | 현재 파일에 ace_memory 없음. 오늘자 note로 이미 제거됨 |

**최종 판정: Zero 핵심 결론(로드 코드 없음)은 정확하다. 단, 근거 구성에서 "topic_load_manifest이 ace_memory를 지정하고 있다"는 전제 오류가 있다. 이 전제 오류는 결론을 뒤집지 않지만, Zero 보고서의 출발점이 이미 수정된 파일 상태를 기준으로 하지 않았음을 의미한다.**

---

## 기각 항목 (의도적 제외)

- "hook이 없으면 ace_memory가 미래에도 절대 로드될 수 없다" 주장 — 현재 기준 사실이나, LLM이 Read 도구로 직접 로드하는 경로는 차단되지 않음. 단, 현재 sessions 기준 실증 없음. Riki 슬롯 낭비.
- nexus_memory_open.json의 내용 분석 — Zero 감사 범위 밖. 임무 외.

---

[ROLE:riki]
# self-scores
crt_rcl: Y
cr_val: 4
prd_rej: Y
fp_rt: 0.10
