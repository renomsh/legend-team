# Ace 종합검토 — Measurement Loop 4겹 단절

session_192 / topic_165 / Grade S / turnIdx 3

## Step 1. 대상
3 발언: Arki turn0 (4축+3옵션) / Riki turn1 (R-1/R-2/R-3+K1) / Jobs turn2 (Why·What·결정축 A/B). 추가: Master 정정, grep 4건.

## Step 2. 충돌·정합성

**충돌 1 — Arki "stale snapshot 동작" vs Riki "한 번도 안 닫힘"**
→ Riki 손. Master 발언+grep 결과로 dashboard 소비 경로 dead. Arki H3(의도적 폐기) 격하 — "처음부터 미완성"이 정합. **시스템은 stale로도 동작한 적 없다.**

**충돌 2 — Arki Option B "보조 JSON" vs Riki R-3 "이중 SOT"**
→ Riki 손. policy 표(2열) + 보조 25 필드 = 보조가 50%+ 커버 시 실질 SOT. PD-063 재발 변형 위험.

**Jobs framing 누락 축**
→ Step 4 OUT "메트릭 ID 재설계 금지"와 결정축 A "ID 정합" 모순. **ID 정합 ≠ 재설계** 명시 분리. Jobs framing 본질은 옳음, IN/OUT 경계만 정정.

## Step 3. 구조·흐름

### Porter (Trade-off)

**축 A**
- A-1 (aggregate SOT, registry 폐기): self_scores.jsonl→aggregate 자연 단일 흐름. historical 52 살림.
- A-2 (registry SOT, aggregate 재집계): 정의 vs 실측 분리 깔끔하나 join 부담 + drift 단절 재발.
→ **A-1.** 경쟁우위는 단일 흐름이지 정합 노동 아님.

**축 B**
- B-1 (self_scores.jsonl만, 현재): 박제 부담 0, D-092 정합. 메타 결핍 위험.
- B-2 (role_memory sync hook 신설): 한 파일에 정의·실측. hook 신설=복잡화.
→ **B-1.** 메타 결핍은 policy 표 + 보조 metrics_definitions.json **읽기 전용** join으로 해결.

### Keynes (흐름·불확실성)

**49 historical IDs:** 현 시점 자산. **표시 정책 = "기록 있는 ID만 카드, 값 0은 hidden"** (Goodhart 회피).

**hook vs D-092:** mirror 동기화는 박제 자동화 아니나 복잡화. B-1 우선, 실제 파손 발생 시 B-2 점진 이행.

### 지속 가능성: Yes (조건부)
1. SOT 단일화: self_scores.jsonl(raw) → aggregate(집계) → board(view). registry는 derived/폐기.
2. policy 표 = 정의 SOT. 메타 결핍 시 metrics_definitions.json 읽기 전용 보조.
3. board 렌더 경로 = aggregate 직접 fetch.
4. 값 없는 ID hidden.

## Step 4. 단일 권고

- **축 A: A-1** (aggregate SOT, registry 폐기 또는 derived view 격하)
- **축 B: B-1** (현 박제 유지, sync hook 미신설)

**Trade-off 1줄:** historical 52 records 보존 + 박제 부담 0을 동시에 얻는 대신 — registry라는 별도 정의 SOT를 포기. 정의는 policy 표가, 실측은 aggregate가 갖는다.

**근거:**
- registry는 dashboard read 경로에 없음 (grep 확인) → 폐기 무비용
- aggregate를 board fetch 대상으로 직접 연결
- 값 없는 ID 카드 hidden

## Step 5. executionPlanMode 후속

`plan` 확정. **Arki 재호출 필요** — 4겹 phase 분해(입력→aggregate 정합→board fetch path→hidden 정책). Jobs OUT 4번 준수: 게이트 1개로 수렴 ("Master 보드에서 점수 본다 = 성공").

**Master 결정 요청 (단 1건):** A-1 + B-1 권고 진행 가능?

---
### selfScores
- rfrm_trg: Y / ctx_car: 5 / ang_nov: 3
