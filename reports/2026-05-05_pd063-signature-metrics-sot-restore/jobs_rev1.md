# Jobs — Measurement Loop framing

session_192 / topic_165 / Grade S / turnIdx 2

## Step 1. 본질 (Why)
**자가측정의 약속이 한 번도 지켜진 적 없다.** D-092에서 상호채점을 버리고 자가측정으로 단순화한 순간 Master에게 한 약속 — "역할들의 점수가 보드에 보일 것이다" — 가 4겹에서 끊긴 채 방치됐음. 단절 복구가 아니라 **D-092 약속 이행**.

## Step 2. 결과물 (What)
**Master가 보드를 열었을 때 11 역할 자가점수가 카드로 보인다.**
- 11 role_memory `signatureMetrics` 정의 채워짐
- registry ⟂ aggregate 같은 metric ID 공간 join
- `app/growth.html` 빈 카드 → 실제 점수
- 로컬 dev preview에서 동일 카드

## Step 3. 결정축 (양극단만, 정밀 trade-off는 Ace)
**축 A — 메트릭 ID 정합:**
- 1: aggregate(49)를 SOT, registry 폐기
- 2: registry SOT 유지, aggregate를 registry ID로 재집계
- trade-off: historical 점수 보존 vs schema 단일성

**축 B — 박제 경로:**
- 1: self_scores.jsonl만 박제 (현재)
- 2: role_memory.signatureMetrics를 hook이 자동 동기화
- trade-off: 박제 부담 vs 정의 단일출처

## Step 4. Scope In / Out
**IN:** 4겹 단절 전수 복구 (입력·schema·렌더·로컬 path)
**OUT (saying no):**
- 메트릭 정의 재설계
- 신뢰도/Goodhart 정책
- 상호채점 부분 부활 (D-092 위반)
- 대시보드 UX 개선
- 신규 메트릭 추가
- composite/derived 재설계
- **가장 중요한 OUT: "전수 완벽 복구가 곧 목적"이라는 착각.** Master가 보드에서 점수 본다 = 성공.

## Step 5. 전제
- 🔴 D-092가 "자가측정 → 보드 시각화" 약속 (Master 확정)
- 🔴 self_scores.jsonl 52 records 의미 있는 raw
- 🟡 49 metric ID 중 다수 historical 잔재 (지금 결정 안 함)
- 🟡 역할 서브가 turn마다 self-score 박제 흐름 작동 중

## Step 6. 인지편향
- **Sunk cost** — 49건 보존 충동, ID 정합 안 되면 자산 아닌 노이즈
- **Compliance overreach** — Master 정정 직후 "전수 복구 = 목적" 미끄러짐. Step 4 OUT 1번이 차단
- **Availability** — Arki §1 표(소비단 누락) anchoring 위험. framing은 표 너머로

## Step 7. Focus
- **본질:** D-092 자가측정 약속 이행
- **거절:** 메트릭 재설계·신뢰도·UX 전부 다음 토픽
- **다음 액션:** Ace 구조·흐름 판정 → 결정축 A·B Master 결정 → Arki 4겹 phase 분해

## Step 8. executionPlanMode
**`plan`** — 4겹 의존 그래프 명확(입력→schema→렌더→path), Arki 실행계획 정식 호출.

## Step 9. Grade 적합성
**Grade S 유지.** A 강등 시 cross-layer 통합 시야 상실 위험. 4겹 cross-layer + D-092 재해석 + 결정축 2개 → S 적정.

---
### selfScores
- focus_sharp: 5 / bloat_idx: 1
