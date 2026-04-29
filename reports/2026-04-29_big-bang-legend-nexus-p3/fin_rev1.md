---
role: fin
session: session_140
topic: topic_131
date: 2026-04-29
turnId: 6
invocationMode: subagent
rev: 1
---

# Fin — Big Bang Legend Nexus P3 비용·자산 검토 (s140)

## 결론

⚠ **조건부 진행**. 본 세션 박제 4건(D-115·D-116·D-117·D-118)은 **비용 < 가치 명확**, 진행 권고. 보류 2건(D-119·D-120) 중 **D-120 enforcement 통합안은 NCL 토큰 비용 ↑↑** — 단순화 1건 권고. Goodhart 리스크 1건 명시.

---

## 0. Arki rev3 실행계획 오염 감사

✅ **Clean** — Phase 표(P1~P5), 게이트(G1~G4), 컴포넌트 표 모두 금지어 0건. 절대 시간(`D+N일`/`N주차`) 0건, 인력 배정(`담당자:`/특정 이름) 0건, 공수 단위(`N시간`/`공수`) 0건. 구조적 선후 표현(`P2→P3`, `G2 통과 후`)만 사용. 통과.

---

## 1. 비용 항목 시뮬레이션 (방향성)

| 항목 | 현재(s140 시점) | P4 진입 후 | 누적성 | 비고 |
|---|---|---|---|---|
| **NCL 영수증 토큰** (D-115) | 0 | M↑ | ✅ 누적 | 매 발언당 4항목 append. 발언 자체 비용 대비 ~5-10% 추가 추정 (영수증=메타데이터, 발언 본문 대비 작음) |
| **self-scores YAML** (D-116) | L (현재 운영중) | L | 변화 없음 | 이미 박제된 비용, 추가 부담 0 |
| **hook chain latency** (D-115 NCL append + D-118 first-speaker) | L | L↑ | 비누적 | append 1회/발언, 동기 수행 시 ms 단위. 페르소나 응답 시간 대비 무시 가능 |
| **Sage 호출** (D-117 P4) | 0 | M | 세션당 1회 | 1 세션 × 1 페르소나 호출 비용. dispatch_config 모델 가격 영향 받음 |
| **Master 판독 시간** (D-118 first-speaker) | M (현재) | M | 비누적 | first-speaker 강제로 Master 인지부하 ↓ 가능성 (프레이밍 시작점 일관) |
| **D-120 enforcement (통합안)** | 0 | **H↑↑** | ✅ 누적 | "위반 발화 → NCL violation flag + Master 통보 + 다음 게이트" — **매 발언당 위반 판정 비용** + Master 통보 컨텍스트 재주입. PD-052 동형으로 미정착 시 cost sunk |
| **개발 비용 P2~P5** | — | 방향성: 5단계 누적 | — | 공수 추정 금지 (Schedule-on-Demand). Phase별 검증 게이트 통과 시 다음 진행 — 이게 비용 통제 메커니즘 |

**역전 구간**: D-120 enforcement만 단독으로 비용 ≈ 가치 경계선. 나머지 5건은 모두 비용 < 가치 명확.

---

## 2. 비재무 자산 가치 (가치 측면)

| 자산 | 가치 평가 | 누적성 |
|---|---|---|
| 학습 루프 폐쇄성 (자가→외부 채점) | H | ✅ — Sage가 매 세션 채점 누적 시 페르소나 진화 데이터셋 형성 |
| echo chamber 차단 (R-1 mitigation) | H | ✅ — 1회 차단 효과는 향후 모든 세션에서 재발 비용 절감 |
| Master 의사결정 권한 보존 | H | 비누적 — 본 시스템 prime principle, 훼손 시 시스템 정체성 붕괴 |
| 페르소나 진화 데이터 (NCL 영수증) | M↑ | ✅ — 100세션 누적 후 패턴 분석 가능. 단기엔 raw data 더미 |
| Riki adversarial 작동 증명 | H (s140 실증) | ✅ — 본 세션 Riki R-5/R-7이 D-119/D-120 보류 유도 = 메커니즘 작동 증명 |

---

## 3. ROI 판정

### ✅ 진행 권고 (비용 < 가치)
- **D-115** NCL 4항목 — 토큰 비용 M↑ vs 학습 루프 폐쇄성 H. 누적 가치 명확
- **D-116** self-scores YAML 병행 — 추가 비용 0, 외부 채점과 cross-check 가치
- **D-117** 5 Phase 순서 — 게이트 기반 비용 통제 내재
- **D-118** Star + Nexus first-speaker — Master 인지부하 ↓ 직접 효과

### ⚠ 옵션 단순화 권고 (비용 ≈ 가치)
- **D-120 enforcement 통합안** — anchor 의무 hook + violation flag + Master 통보 + 게이트 **4-in-1 통합은 과투자**.
  - **권고**: 단계 분리. Phase A(NCL `violation` flag append-only, Master는 대시보드에서 사후 열람)만 P2 박제. Phase B(실시간 Master 통보 + 게이트 차단)는 P4에서 violation 누적 패턴 본 후 결정.
  - 근거: PD-052 동형 — 사칭 차단 hook이 미정착 잔존 중. **enforcement 메커니즘 1회 시도 실패 비용**(개발 + 디버깅 + 잔존 PD)이 누적되면 본 시스템 메타 신뢰 저하. 작게 시작.

### ❌ 재설계 권고
- 없음. D-119는 Ace 권고대로 양립 박제(수단/결과 매핑) 후 P2에서 결정 — Fin도 동의. 매핑 1턴 비용 < supersede 잘못 박제 시 revision_history rollback 비용.

---

## 4. 캐비엇 (Fin 고유 리스크)

### 🟡 Goodhart's Law — NCL 4항목 측정 가능화
NCL Origin Trace / Influence Score / Diversity Index / Anchor가 정량 가능해지면, **페르소나가 지표 최적화 발화로 편향**될 가능성. 예: Anchor 점수 올리려고 외부 인용 cosmetic 추가, Diversity 올리려고 무관 관점 강제 삽입.
- **외부 anchor**: Goodhart "When a measure becomes a target, it ceases to be a good measure" (1975, Bank of England 통화정책 비판). Sage 채점이 dispatch 가중치에 자동 반영 금지(C-4 제약)는 정확한 mitigation. 유지 필수.
- 추가 권고: NCL 4항목은 **Sage가 정성 해석**, 페르소나에게 raw 점수 노출 금지. Influence Score를 "0.85" 수치로 페르소나에게 보여주면 다음 발언이 그 수치 최적화로 흐름.

### 🟡 측정 비용이 발화를 왜곡
NCL append가 동기 수행 시 페르소나가 "영수증에 박제될 것"을 의식하며 발화 → 실험적·탐색적 발언 위축. 비용은 토큰이 아닌 **다양성 손실**.
- 완화: NCL append를 발화 후 비동기 처리로 분리, 페르소나 자체는 영수증 내용 모름.

---

## Master 결정 요청 (Fin 추가)

1. D-120 enforcement **단계 분리** 동의 (Phase A append-only → Phase B 게이트)?
2. NCL 4항목 페르소나 노출 차단 정책을 D-115에 부속 조건으로 박제할지? (Goodhart mitigation)

---

```
[ROLE:fin]
# self-scores
cst_acc: 0.75
roi_dl: 4
rdn_cal: Y
cst_alt: Y
```
