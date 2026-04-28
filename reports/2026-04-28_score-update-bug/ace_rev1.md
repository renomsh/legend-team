---
session: session_128
topic: topic_126
role: ace
rev: 1
date: 2026-04-28
---

## Ace 프레이밍 — growth 자기 점수 미갱신

### topicType: standalone
parentTopicId: null

### 파이프라인 진단 (초기)

```
[A] 서브에이전트 출력에 # self-scores 블록 포함  ← 의심 결함
[B] PostToolUse hook → turns[].selfScores         의심
[C] session-end-finalize.js → self_scores.jsonl   ★ 확정 결함 (코드 부재로 오진)
[D] compute-dashboard → growth                    정상
```

※ [C] 진단은 오류 — Arki가 수정. 실제 담당은 finalize-self-scores.ts (auto-push.js line 75 연결).

### 결정 축
- 실패 지점: [A] (서브에이전트 미출력) or [B] (hook 파싱 실패)
- 수정 범위: [A]∨[B] 해결 + [C'] 검증

### 핵심 전제
- 🔴 페르소나 파일이 서브에이전트에 실제로 전달됨 — **미충족 확인됨** (.claude/agents/ 비어있음)

### executionPlanMode: plan

### 역할 호출 설계
Arki → Riki → Dev (Fin 제외, Nova 제외)

# self-scores
rfrm_trg: N
ctx_car: 0.85
orc_hit: 0.80
mst_fr: 0.75
ang_nov: 3
