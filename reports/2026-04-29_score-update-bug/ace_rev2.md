---
sessionId: session_137
topicId: topic_126
role: ace
rev: 2
date: 2026-04-29
turnId: 3
invocationMode: subagent
---

ACE_WRITE_DONE: reports/2026-04-29_score-update-bug/ace_rev2.md

# Ace 종합검토 — session_137

## 종합 판정

Dev·Riki 발언을 교차검증했습니다. 결론은 명확합니다.

---

## 1. 단일 최적 수정 방향: **Option B**

**Option A (파일 스캔 + frontmatter 파싱)** 는 기각합니다.

이유:
- R-1이 치명적입니다. `parseYamlBlocks`는 `[ROLE:xxx]` 인라인 마커 전용이고, 실제 파일에는 frontmatter `role:` 형식만 존재합니다. Option A를 구현해도 역할 식별이 0건으로 끝납니다.
- 파서를 수정하면 중복 집계(R-2)·병합 SOT 충돌(R-3) 두 문제가 동시에 추가됩니다.
- 파일 스캔 경로는 "도착 보장"이 없습니다. 서브에이전트가 파일에 쓰지 않는 경우 또는 경로가 달라지는 경우 조용히 0건이 됩니다.

**Option B가 최적인 이유**:
- 수정 범위가 가장 작습니다: **페르소나 지시 1개 수정**.
- `parseYamlBlocks` 재사용 가능 — 파서 수정 불필요.
- transcript 또는 tool_response에 `[ROLE:xxx]` 마커가 붙으면 기존 경로가 완전히 살아납니다.
- R-2·R-3 없음. 단일 경로 유지.

**구체적 수정 내용 (Dev 구현 범위)**:

`memory/roles/policies/_common.md`의 Self-Score YAML 출력 계약 섹션에 다음 지시를 추가:

```
# self-scores 블록 직전에 반드시 [ROLE:{역할명}] 마커를 출력:
  [ROLE:ace]
  # self-scores
  rfrm_trg: Y
  ...
```

그리고 `post-tool-use-task.js`의 `extractSelfScores`가 tool_response에서 `[ROLE:xxx]` 마커도 함께 파싱하도록 수정 (현재 `# self-scores` 블록만 파싱, 역할 연결 없음):

현재 `extractSelfScores`는 역할을 구분하지 않고 `{ key: value }` flat bag만 반환합니다. `extractRole`이 별도로 role을 식별합니다. 두 함수가 조합되면 `turns[role].selfScores`에 정상 적재됩니다.

**단, 현재 `extractSelfScores`는 tool_response 전체 텍스트에서 `# self-scores` 블록을 찾습니다. tool_response가 짧은 마커만 반환하면 블록 자체가 없어 null입니다.**

따라서 수정 방향은 두 축:

1. **_common.md 지시 추가**: `# self-scores` 블록을 서브에이전트 채팅 응답(tool_response)에 포함하도록 명시. 현재 지시는 "발언 본문 말미에 포함"인데, Write 툴로 파일에만 저장하고 채팅 응답에서 생략하는 행동을 야기합니다. **"파일과 채팅 응답 양쪽에 모두 포함"** 명시 필요.

2. **_common.md에 `[ROLE:{역할명}]` 마커 의무화**: `# self-scores` 블록 직전에 반드시 `[ROLE:ace]` 형식 마커 출력 지시 추가. `parseYamlBlocks`가 역할을 식별할 수 있습니다.

이것이 핵심입니다. 파일 수정은 `_common.md` 한 곳, 코드 수정 없음.

---

## 2. R-2·R-3 처리 방향

**R-2 (중복 집계)**: `scripts/lib/self-scores-writer.ts`의 `appendScore`가 중복 방지 로직을 갖추고 있는지 Dev가 확인합니다. 없으면 finalize 진입 시 `sessionId` 기준 스킵 처리를 추가합니다. Option B 수정 이후 파일 스캔 경로가 없으므로 R-2 위험은 현재보다 줄어듭니다.

**R-3 (병합 SOT)**: Option B 채택으로 파일 스캔 경로 자체가 없어집니다. `turns[].selfScores`가 단일 경로가 되며 R-3는 해소됩니다.

---

## 3. versionBump 선언

```yaml
versionBump:
  delta: +0.01
  reason: "self-score 파이프라인 [B] 결함 진단 완료 + 수정 방향 확정 (페르소나 지시 수정 단일 경로). 구조 변경 아님, 역량 확장."
```

구현(Dev의 `_common.md` 수정)이 완료되면 +0.01 적용됩니다. 현 세션은 진단+방향 확정까지. 실제 파일 수정 완료 후 versionBump 인정.

---

## 4. Decision 박제

**D-xxx 필요합니다.** 내용:

> **D-[다음번호]**: self-score 파이프라인 수정 방향 — Option B 채택. `_common.md`에 두 지시 추가: (1) `# self-scores` 블록을 파일+채팅 응답 양쪽 출력 의무화, (2) 블록 직전 `[ROLE:{역할명}]` 마커 출력 의무화. 파일 스캔 경로(Option A) 기각.

Edi가 세션 종료 시 decision_ledger에 박제합니다.

---

## 5. Edi 호출 여부

**이번 세션 Edi 호출 불필요합니다.**

이유: 종합검토까지 완료됐으나 **구현(Dev의 `_common.md` 수정)이 아직 진행되지 않았습니다.** 지금 Edi를 호출하면 미완성 세션을 닫는 것이 됩니다.

**Master에게 확인 요청**: Dev가 `_common.md` 수정을 지금 이 세션에서 진행할까요? 수정 완료 후 Edi → 세션 종료 순서로 가겠습니다.

수정 범위:
- `memory/roles/policies/_common.md` — Self-Score YAML 출력 계약 섹션에 2개 지시 추가
- 코드 수정 없음

---

```yaml
# self-scores
rfrm_trg: Y
ctx_car: 0.95
orc_hit: 0.90
mst_fr: 0.85
ang_nov: 1
```
