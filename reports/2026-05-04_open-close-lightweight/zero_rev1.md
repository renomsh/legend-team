---
role: zero
session: session_182
topic: topic_157
topicSlug: open-close-lightweight
turnId: 4
invocationMode: subagent
date: 2026-05-04
rev: 1
---

ZERO_WRITE_DONE: reports/2026-05-04_open-close-lightweight/zero_rev1.md

# Zero — Audit: ace_memory.json 학습 이력 섹션 실호출 여부 검사

---

## TL;DR

**`ace_memory.json`의 학습 이력 섹션 5개(`topicsHandled` / `masterSelectionPatterns` / `learningLoop` / `lessonLog` / `sessionLearnings`) 전량이 사실상 dead data다.**

- 어떤 hook / script / skill 코드도 이 섹션들을 programmatic하게 read하지 않는다.
- `ace-learning-loop` skill은 session_019(1건)에서만 invoke 기록이 있다. session_182 현재 기준 163개 세션 전 단독 호출.
- 마지막 실질 업데이트: `validationLog` 2026-04-17 / `lessonLog` 2026-04-22 / `sessionLearnings` 2026-04-24. 이후 약 25개 세션(~session_155+) 동안 무갱신.
- `topic_load_manifest.json`이 `ace_memory`를 `loadMemory`로 지정하나, 이 manifest를 실제 consume하는 코드가 hook/script 어디에도 없음 — 명세 문서일 뿐 기계 실행 없음.

**판정: Cut 검토 대상. 단, persona definition(scope / ownerOf / skills / gradeCProtocol)은 `pre-tool-use-task.js`가 `role-ace.md` 경로로 inject하므로 보존 대상.**

---

## Audit — memory/roles/ace_memory.json

### C. Audit (security-review)

정제 대상 파일 내 hardcoded secret/credential/절대경로 탐색.

| 위치 | 유형 | 내용 |
|---|---|---|
| ace_memory.json 전체 | 경로 참조 | `reports/2026-04-*/` 경로 다수 — 절대 경로 아님, 상대 경로. 이슈 없음 |
| `dispatcherPattern.skill` | 내부 경로 | `.claude/skills/opus-dispatcher/SKILL.md` — skill 경로 참조. 파일 존재 여부 별도. |
| `dispatcherPattern.agentFiles` | 내부 경로 | `.claude/agents/role-ace.md` 외 3건 — 실제 파일 경로. |

총 0건. 보안 이슈 없음.

---

### A. Cut — 학습 이력 섹션 (dead data 판정 근거)

#### 조사 결과 요약

**Q1: 위 항목들을 실제로 읽거나 참조하는 코드/hook/skill이 있는가?**

없음.

- `.claude/hooks/` 전 파일(`pre-tool-use-task.js`, `session-end-finalize.js`, `post-tool-use-task.js` 등) — `ace_memory`, `topicsHandled`, `lessonLog`, `validationLog`, `learningLoop`, `sessionLearnings` 키워드 0건
- `scripts/` — `migrate-editor-*.ts` 3건에서 ace_memory.json 파일 경로만 참조(파일 목록 나열용), 내용 parse 없음
- `dispatch_config.json` — `ace_reject_window_turns` 등 3개 ace 관련 키가 있으나 학습 이력 섹션과 무관

**Q2: `ace-learning-loop` skill이 실제로 호출되고 있는가?**

마지막 호출: session_019 (1건, session_index.json 전수 검색 결과).
현재 session_182. **163개 세션 동안 재호출 기록 없음.**

skill SKILL.md에는 "Master 피드백 수령 시 / 기각·예상외 결정 시" trigger가 명시되어 있으나, 실제 invoke 증거가 없다. 명세(skill 파일)만 존재, 실행 경로 단절.

**Q3: `topicsHandled`, `lessonLog`, `validationLog` 등이 자동으로 업데이트되고 있는가, 아니면 수동 박제인가?**

수동 박제. 업데이트 자동화 코드 없음.

마지막 업데이트 날짜:
- `validationLog` (최신 항목): 2026-04-17
- `lessonLog` (최신 항목): 2026-04-22
- `sessionLearnings` (최신 항목): 2026-04-24
- `topicsHandled` (최신 항목): 2026-04-28
- `masterSelectionPatterns.decisions` (최신 항목): 2026-04-22 (session_088)
- `lastUpdated` 필드: 2026-04-30

이후 약 25개 세션(session_155~session_182 기간) 동안 전 항목 무갱신.

**Q4: 이 데이터들이 실질적으로 Ace 발언 품질에 영향을 주고 있는가 (참조 증거)?**

없음.

`topic_load_manifest.json`은 8개 topicType에 걸쳐 `ace_memory`를 `loadMemory`로 지정하나:
- 이 manifest를 parse해서 실제 파일을 load하는 코드가 hook/script 어디에도 없음
- `pre-tool-use-task.js`는 `memory/roles/policies/role-ace.md`와 `memory/roles/personas/role-ace.md` 경로를 inject함 — `ace_memory.json` 직접 inject 없음
- 즉, LLM이 ace_memory.json 내용을 읽으려면 직접 Read 도구를 호출해야 하고, 그 호출 근거는 없음

---

### B. Refine — 섹션별 처분 판단

```
### Refine — ace_memory.json 섹션별

Before (현행 5개 학습 이력 섹션):
  topicsHandled[]        — 14건 / 마지막 2026-04-28
  masterSelectionPatterns — decisions(2건) + rejectionPatterns(3건) + lessonLog(3건)
  learningLoop           — validationLog(10건) / 마지막 2026-04-17
  lessonLog[]            — 10건 / 마지막 2026-04-22
  sessionLearnings[]     — 2건 / 마지막 2026-04-24

After (권고):
  보존 대상:
    - scope (ownerOf / notOwnerOf)
    - roleRedefinition
    - gradeCProtocol
    - skills (ace-synthesis, ace-learning-loop 정의)
    - applicableTopicTypes
    - dispatcherPattern (pendingValidation 필드 제거 — P4 완료 여부 불명)
    - collaborativeThinkingDeclaration

  Cut 검토:
    - topicsHandled[] — 14건 전량: hook/code read 0, 수동 박제, 25세션+ 무갱신
    - masterSelectionPatterns.decisions[] — 2건: 동일 조건
    - masterSelectionPatterns.rejectionPatterns[] — 3건: 동일 조건
    - masterSelectionPatterns.lessonLog[] — 3건: 동일 조건
    - learningLoop.validationLog[] — 10건: 동일 조건
    - lessonLog[] — 10건: 동일 조건
    - sessionLearnings[] — 2건: 동일 조건

근거:
  - hook read: 0건 (전수 검색)
  - skill invoke: 1건 (session_019, 163세션 전)
  - 자동 갱신: 없음
  - LLM 직접 read: 근거 없음 (topic_load_manifest loadMemory = dead spec)
  - 25개 세션+ 무갱신 = stale 확정
```

**처분 옵션:**

| 옵션 | 내용 | 비용 |
|---|---|---|
| **Cut** | 7개 학습 이력 섹션 전량 삭제. ace_memory.json ~400 lines → ~50 lines | 파일 1건 edit |
| **Archive** | 별도 `ace_memory_archive_20260430.json`으로 이전, ace_memory.json에서 제거 | 파일 1건 생성 + 1건 edit |
| **Skip** | 그대로 유지 | 0 |

**Zero 판단: Archive.** 과거 학습 이력은 completly dead data이나 수동 박제 비용이 투입된 의미 있는 레코드. 즉시 삭제보다 archive 이전 후 ace_memory.json 정제. Master 승인 후 적용.

---

## 정제 범위 확인 (self-exclusion 점검)

메타-자산(self-scores log, audit trail, violation flag) 해당 여부:
- `ace_memory.json`은 역할 학습 이력 — 시스템 메타-자산 아님. 정제 대상 적합.
- `learningLoop.validationLog` 등은 Ace 판단 패턴 기록 — persona 학습 데이터. 메타-자산 아님. 정제 대상 적합.

Self-exclusion 위반 없음.

---

[ROLE:zero]
# self-scores
ref_cnt: 7
hc_found: 0
cln_rt: 1.0
