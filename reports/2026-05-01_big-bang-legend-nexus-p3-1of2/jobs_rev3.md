---
role: jobs
session: session_153
topic: topic_131
date: 2026-05-01
turnId: 19
invocationMode: subagent
rev: 3
accessed_assets:
  - memory/shared/decision_ledger.json
  - memory/shared/topic_index.json
  - reports/2026-05-01_big-bang-legend-nexus-p3-1of2/jobs_rev1.md
  - reports/2026-05-01_big-bang-legend-nexus-p3-1of2/jobs_rev2.md
  - reports/2026-05-01_big-bang-legend-nexus-p3-1of2/ace_rev1.md
  - reports/2026-05-01_big-bang-legend-nexus-p3-1of2/riki_rev1.md
---

# Jobs rev3 — NCL 학습축 reframe 재평가

## 0. 자기감사 (anchoring 차단 선언)

이전에 (α) 전면 폐기를 권고했다는 사실은 **본 판단에서 무관**합니다. Master의 reframe 질문은 "안전망이 아니라 학습축으로 봐도 같은 결론인가?"입니다. 새 framing에서 처음부터 다시 봅니다. (α') 고집은 sunk cost anchoring 그 자체이므로 자기 권고에서 배제합니다.

---

## 1. 결론 (먼저)

**(α') NCL 폐기 유지.** 학습 framing에서도 부적합합니다. 학습 트랙은 B(기존 자산) + C(Master 결정 패턴)로 신규 설계해야 합니다.

근거 한 줄: **학습축 framing에서도 NCL 4항목이 측정하는 신호의 99%는 기존 자산이 더 정확하게, 더 싸게, Goodhart trap 없이 제공합니다.**

---

## 2. 4항목 학습 데이터 가치 재평가

### 2.1 Origin Trace (자기인용 비율)

- **학습 framing 가치**: "어떤 페르소나가 어떤 출처를 인용하는가" 패턴 학습
- **기존 자산 대체**: 페르소나 발언의 frontmatter `accessed_assets` + reports 본문 인용 grep으로 100% 추출 가능. NCL은 전처리 단계 자동화일 뿐
- **추가 signal**: 거의 0
- **판정**: 기존 자산 + 1회성 추출 스크립트로 완전 대체. NCL 인프라 불필요

### 2.2 Influence Score (직전 출력 유사도)

- **학습 framing 가치**: 페르소나 간 micro-interaction 학습
- **본질적 결함**: 코사인 유사도/임베딩 거리는 **표면 형식 유사도**일 뿐, "독립 사고인지 echo인지"는 의미론적 판단 — 기계 측정 불가능
- **noise 비율 추정**: 70% 이상. 같은 토픽의 합리적 동의도 high similarity. 다른 표현의 echo도 low similarity
- **판정**: signal < noise. 학습 데이터로 입력하면 모델이 잘못된 패턴 학습

### 2.3 Diversity Index (역할 발언 분포)

- **학습 framing 가치**: Grade·topic별 적정 발언 분포 학습
- **기존 자산 대체**: `current_session.json.turns[]` + `topic_index.json.grade` 결합으로 분포 100% 산출. `compute-dashboard.ts`가 이미 일부 계산
- **추가 signal**: 0
- **판정**: 완전 중복. 별도 인프라 정당화 불가

### 2.4 Anchor vs Synth (외부 anchor 비율)

- **학습 framing 가치**: 외부 anchor가 결정 품질에 결정적이었던 토픽 패턴 학습
- **본질적 결함**: 분류기 자체가 미작성(D-123에서 분기). 분류기 정확도 검증 없이는 학습 데이터로 사용 불가
- **개념적 가치**: 4항목 중 유일하게 학습 의미 있음 — 단, 별도 토픽(topic_135)에서 anchor 필수 hook으로 이미 분리됨. NCL 인프라에 종속될 이유 없음
- **판정**: 가치는 인정하되 NCL과 분리. 독립 트랙

---

## 3. Q1~Q4 답변

### Q1. NCL이 B+C보다 우월한 signal?
**아니요.** 4항목 중 3개(Origin/Diversity/부분적 Anchor)는 기존 자산 재가공으로 동등한 signal 추출 가능. Influence Score는 noise > signal. 신규 인프라(11건 결정 + hook + jsonl 스토리지)를 정당화할 incremental signal 없습니다.

### Q2. 학습 framing에서 Goodhart 회피?
**아니요.** "측정이 평가가 아니라 입력"이라는 구분은 이론적입니다. 실무에서 측정값이 dashboard에 노출되고 회고 자료가 되는 순간, 페르소나가 "내 Influence Score 낮추기"를 학습합니다. 학습 데이터 자체가 페르소나 행동의 함수이므로 측정-반응 루프 동일하게 발생. Goodhart's Law(1975)는 framing과 무관하게 작동합니다.

### Q3. 시점 부적합이 학습 framing에서도 valid?
**Valid합니다.** Ace 비판의 핵심은 "현 NCL 설계 = Master anchor 추적용"이라는 origin입니다. 학습 framing으로 재배치해도 측정 대상(자기인용/유사도/분포/anchor)은 동일 — 즉 **여전히 Master anchor 시대의 측정 도구를 Nexus 시대 학습에 차용**하는 카테고리 오류입니다. 망치를 페인트칠 도구로 재정의해도 망치는 망치입니다.

### Q4. Sunk cost vs 진짜 학습 가치
NCL 11건 박제는 본 판단에서 0의 가중치를 둡니다. 학습축으로서의 데이터 모델 자체 가치만 보면: **4항목 설계는 "echo chamber 사후 채점" 목적에 최적화되어 있어 학습축으로 재배치 시에도 측정 대상이 학습 가치 있는 패턴과 mismatch.** 진짜 학습축 설계라면 Master 결정 사례·역할 호출 순서·결정-결과 correlation 같은 outcome-anchored 데이터부터 시작해야 합니다.

---

## 4. (β')·(γ') 기각 이유

### (β') NCL 4항목 그대로 학습축 재배치
- D-115/D-123 deprecate 철회 = 인프라 11건 박제 부활
- 측정 대상 mismatch (Q3) 미해결
- Goodhart trap 미해결 (Q2)
- 기각

### (γ') 부분 흡수 (Anchor vs Synth만 살림)
- Anchor 항목은 이미 topic_135로 독립 분리 권고됨 (s142 Edi 인계)
- "NCL 부분 흡수"라는 framing 자체가 sunk cost anchoring — 독립 토픽으로 처리하면 NCL 명명 불필요
- Anchor 가치 인정 ≠ NCL 부분 살림. 분리 처리가 깔끔
- 기각

---

## 5. 단일 권고

### 학습 트랙 신규 설계 (NCL과 분리)

| 학습 데이터 소스 | 위치 | 가치 |
|---|---|---|
| Master 결정 패턴 | `master_feedback_log.json` + `decision_ledger.json` | outcome-anchored, 가장 신뢰 |
| 역할 호출 시퀀스 | `current_session.json.turns[]` + `session_index.json` | 이미 존재, Ace masterSelectionPatterns 누적 중 |
| 결정-결과 correlation | `topic_index.json` status + revision_history | 어떤 framing이 성공했는지 retrospective |
| 외부 anchor 활용 패턴 | topic_135(분리) | 독립 트랙, NCL과 무관 |

### NCL 처리
- D-115/D-123 deprecate 유지
- D-122/D-124/D-126/D-127/D-128은 인프라 자산이므로 학습축 신규 설계에 활용 가능 (페르소나 정의·Sage 격리 등은 학습축과 무관하게 유지)
- jsonl 스토리지·violation hook 설계는 폐기

---

## 6. 강한 의견 (한 줄)

**학습은 outcome에서 시작합니다. 페르소나 micro-interaction을 측정해서 학습하려는 시도는, 결정 결과를 보지 않고 회의록 어조만 분석하는 것과 같습니다.**

---

JOBS_WRITE_DONE: reports/2026-05-01_big-bang-legend-nexus-p3-1of2/jobs_rev3.md

[ROLE:jobs]
# self-scores
fr_qual: 5
br_acc: 0.9
sc_clr: Y
bias_id: 3
focus_no: 4
