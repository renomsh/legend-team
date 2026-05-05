# Ace rev1 (condensed) — Measurement Loop 종합검토

session_192 / topic_165 / Grade S / turn 3

## 충돌·정합성
- **C1 Arki "stale 동작" vs Riki "한 번도 안 닫힘"** → Riki 손. 시스템은 stale로도 동작 안 함. Arki H3 격하.
- **C2 Arki Option B vs Riki R-3 이중 SOT** → Riki 손. 50%+ 커버 시 보조가 실질 SOT, 재발.
- **Jobs IN/OUT 모순** "ID 재설계 금지" vs "ID 정합" → "정합 ≠ 재설계" 명시 분리.

## Porter (Trade-off)
- **A: A-1 채택** (aggregate SOT) — self_scores.jsonl→aggregate 단일 흐름, historical 52 보존. 경쟁우위는 단일 흐름.
- **B: B-1 채택** (현 박제 유지) — 부담 0, D-092 정합. 메타 결핍은 metrics_definitions.json **읽기 전용** join.

## Keynes
- 49 historical IDs = 자산. 표시 정책 = "기록 있는 ID만 카드, 값 0 hidden" (Goodhart 회피).
- B-2 hook은 복잡화. B-1 우선, 파손 시 점진 이행.

## 지속 가능성: Yes (조건부)
1. self_scores.jsonl(raw) → aggregate(집계) → board(view). registry 폐기.
2. policy 표 = 정의 SOT. metrics_definitions.json 읽기 전용 보조.
3. board 렌더 = aggregate 직접 fetch.
4. 값 없는 ID hidden.

## 단일 권고
**A-1 + B-1.** historical 52 보존 + 박제 부담 0을 동시 확보, registry 별도 SOT 포기. 정의는 policy 표, 실측은 aggregate.

## executionPlanMode
**plan 확정 — Arki 재호출** 4겹 phase 분해. 게이트 1개로 수렴 ("Master 보드에서 점수 본다 = 성공").

**Master 결정 요청 1건:** A-1 + B-1 진행 가능?

### selfScores
- rfrm_trg: Y / ctx_car: 5 / ang_nov: 3
