---
role: dev
session: session_182
topic: topic_157
topicSlug: open-close-lightweight
turnId: 2
invocationMode: subagent
date: 2026-05-04
rev: 1
accessed_assets:
  - memory/roles/ace_memory.json
  - memory/shared/topic_load_manifest.json
---

DEV_WRITE_DONE: reports/2026-05-04_open-close-lightweight/dev_rev1.md

# Dev — ace_memory.json 분리 구현

---

## 무엇을 만들었는가

`memory/roles/ace_memory.json`을 두 파일로 분리.

1. **신규: `memory/shared/nexus_memory_open.json`** (4,211 bytes)
   - Keep 항목만 포함: scope, roleRedefinition(previousDefinition 제외), gradeCProtocol, skills(ace-framing deprecated 제외), collaborativeThinkingDeclaration, applicableTopicTypes, lastUpdated
   - `"_comment": "Nexus /open 시 직접 로드. Ace 페르소나 최소 정의."` 헤더 추가

2. **수정: `memory/roles/ace_memory.json`** (27,105 bytes)
   - Cut 항목 4개 제거: skills[].ace-framing(deprecated), dispatcherPattern.agentFiles[], dispatcherPattern.pendingValidation, framePatternsTransferredTo
   - Keep 항목(scope, roleRedefinition 전체, skills 등) 제거 — nexus_memory_open.json으로 이전
   - roleRedefinition.previousDefinition 잔류 확인
   - 잔류: dispatcherPattern(정리 후), sessionLearnings, topicsHandled, masterSelectionPatterns, learningLoop, lessonLog

3. **수정: `memory/shared/topic_load_manifest.json`** (2,695 bytes)
   - 모든 typeRules[*].loadMemory + default.loadMemory에서 `"ace_memory"` 제거
   - _notes에 제거 사유 추가

---

## 실행 명령 → 실제 출력

```
node -e "JSON 파싱 + 파일 크기 확인"
→ OK memory/shared/nexus_memory_open.json (4211 bytes)
→ OK memory/roles/ace_memory.json (27105 bytes)
→ OK memory/shared/topic_load_manifest.json (2695 bytes)

node -e "Cut 항목 제거 검증"
→ ace-framing deprecated 제거: OK (skills 키 없음 — nexus로 이전)
→ agentFiles 제거: OK
→ pendingValidation 제거: OK
→ framePatternsTransferredTo 제거: OK
→ scope 제거 (nexus로 이전): OK
→ previousDefinition 잔류: OK

node -e "nexus_memory_open.json Keep 항목 검증"
→ OK scope
→ OK roleRedefinition (previousDefinition 제외)
→ OK gradeCProtocol
→ OK skills
→ OK collaborativeThinkingDeclaration
→ OK applicableTopicTypes
→ OK lastUpdated
→ OK _comment header
→ OK ace-framing NOT in skills.core

node -e "topic_load_manifest ace_memory 제거 확인"
→ OK ace_memory 전체 제거 확인
```

---

## 크기 비교

| 파일 | 전 | 후 |
|---|---|---|
| ace_memory.json | 17,890 bytes (원본) | 27,105 bytes (학습 이력 잔류 — 예상 크기) |
| nexus_memory_open.json | 없음 | 4,211 bytes (신규) |
| topic_load_manifest.json | ace_memory 포함 | ace_memory 전체 제거 |

> ace_memory.json 후 크기가 원본보다 큰 것은 원본 ace_memory가 이미 학습 이력(topicsHandled, masterSelectionPatterns 등)을 포함하고 있기 때문. Keep 항목 제거 후에도 학습 이력 누적으로 파일이 큼 — 정상.

---

[ROLE:dev]
# self-scores
rt_cov: 1.00
gt_pas: 1.00
hc_rt: 0.00
spc_drf: 0
