# Jobs rev1 (condensed) — Measurement Loop framing

session_192 / topic_165 / Grade S / turn 2

## Why
**자가측정 약속이 한 번도 지켜진 적 없다.** D-092 단순화 순간 약속("점수가 보드에 보임")이 4겹 단절. 단절 복구가 아닌 **D-092 약속 이행**.

## What
Master 보드 열면 11 역할 자가점수 카드 표시.
- role_memory `signatureMetrics` 정의 채워짐
- registry ⟂ aggregate ID 공간 join
- `app/growth.html` 빈 카드 → 실제 점수
- 로컬 preview 동일

## 결정축 (양극단)
- **A 메트릭 ID 정합:** A-1 aggregate(49) SOT, registry 폐기 / A-2 registry SOT, aggregate 재집계
- **B 박제 경로:** B-1 self_scores.jsonl만(현재) / B-2 signatureMetrics sync hook

## Scope
**IN:** 4겹 단절 전수 복구 (입력·schema·렌더·로컬 path)
**OUT:** 메트릭 재설계 / 신뢰도/Goodhart 정책 / 상호채점 부활(D-092 위반) / UX 개선 / 신규 메트릭 / composite·derived 재설계 / **"전수 완벽 복구=목적" 착각**.

## 전제
- 🔴 D-092 약속 / self_scores.jsonl 52 records raw
- 🟡 49 ID 다수 historical / 역할 turn 박제 흐름 작동

## 인지편향
- Sunk cost (49 보존), Compliance overreach (전수 복구=목적), Availability (Arki §1 표 anchoring)

## Focus
- 본질: D-092 약속 이행
- 거절: 재설계·신뢰도·UX 모두 다음 토픽

## executionPlanMode
**plan** — Arki 정식 호출.

## Grade
**S 유지** — cross-layer + D-092 재해석 + 결정축 2.

### selfScores
- focus_sharp: 5 / bloat_idx: 1
