---
topic: 성장지표 정의 프레임 확정 + Board 계측 구조 설계 (PD-015)
topic_id: topic_083
session: session_077
revision: 1
date: 2026-04-22
status: design-frozen
contributing_agents: [ace, nova, arki, fin, riki, edi]
mode: observation
grade: A
framing_level: 2
decision: D-060
accessed_assets:
  - file: topic_index.json
    scope: all_topics
  - file: decision_ledger.json
    scope: all_topics
  - file: system_state.json
    scope: fast_path
  - file: master_feedback_log.json
    scope: pending
---

# Growth Metrics Frame + Board 계측 구조 설계

## Executive Summary

- **Objective**: 레전드팀 8역할의 성장을 정의하고 Board 실시간 계측 구조 수립. 학습누적 → 적중률 → 자율성 인과체인 기반. Nova N4 비전("나 없이도 사고하는 팀") 진척도 가시화.
- **Scope**: 프레임·스키마·데이터 계약까지. **구현(UI·렌더·파이프라인)은 child 토픽 분기**.
- **Outcome**: D-060 확정. Phase 0~4 분해, 9개 Phase 0 deliverables, 10+ 구조적 개선사항 내재화.

## Context

PD-015는 session_036 legend-team-upgrade-v2 3부작 중 마지막 미결(PD-013 페르소나·PD-014 스킬 매핑 기완료). 본 토픽은 parent를 연결하지 않고 **standalone**으로 진행 — 변경 축 발생 가능성 대비(Master 판단).

topic_082(대시보드 개편)은 본 토픽 선행 완료 후 재개(Option A). Growth Board 메인 페이지(안 β)가 topic_082 IA 기반이 됨.

## Agent Contributions

### Ace (프레이밍 + 종합 + 최종 조정)

- topicType: `framing`, parentTopicId: null
- Grade A → L2 풀 프레이밍, Observation Mode
- 6개 결정축 제시: A1(인과체인) / A2(지표 구조) / A3(측정 가능/불가) / A4(시간 축) / A5(적중률 조작화) / A6(Board IA)
- Master 결정 반영 및 의견 요청 답변:
  - A1 = C 하이브리드 (효율성 검토 후 가능 시)
  - A2 = 옵션 3 (공통 3층 + 역할별 signature 1개)
  - A5 = C (hitRateRubric 활성화, D-041)
  - A6 = 안 β (Growth Board 메인, Topic/Session 별도)
- 오케스트레이션 루프 재정의: Ace가 재호출 자동 집행, 루프 상한 2회, Master 1줄 요약 알림
- Nova 배치: Ace 프레이밍 직후, Arki/Fin/Riki 앞 (Master 지시 수용)
- 1차 종합 → Arki 재호출 1회 (L3 보강·교차채점·레짐 마커·태깅 분리)
- Arki 자기감사 2회 수용 → Phase 0 삽입

### Nova (투기적 확장안, 오픈 스코프)

- N-1 Master 성장 지표 → 축소 수용(개입 태깅만)
- N-2 Dissensus Index → 수용
- N-3 Cross-Role Borrowing → Phase 2
- N-4 Anti-Portfolio → 수용(태깅자 분리 조건)
- N-5 Retroactive Re-Labeling → Phase 2 보류
- N-6 B 메타인지 → 기각, session_100 재검토 트리거
- N-7 Live Stream 메인 → Phase 2 옵션
- N-8 System Self-Portrait 인덱스 → 수용
- N-9, N-10 → Master 기각

### Arki (구조 설계 + 자기감사 2회)

**원안**:
- 의존 그래프: 원천(session_index·decision_ledger·master_feedback_log·turn_log·token_log·evidence_index) → 집계(`derived/growth_metrics.json`) → 뷰(Growth Board)
- 공통 3층 조작화 + signature 8종 스키마
- 신규 파일: `hit_rate_rubric.json`, `intervention_log.json`, `regime_markers.json`
- /close 훅 체인에 `compute-growth.ts` 추가

**1차 자기감사 (역할 확장성 축)**:
- 개선 A. Plugin-style Metric Registry (역할 1:1 하드코딩 해소)
- 개선 B. Multi-scale Windows (20/100/500)
- 개선 C. Rubric Versioning
- 개선 D. Percentile 정규화
- 개선 E. Regime Auto-Detection Proxy
→ Phase 0 삽입 결정

**2차 자기감사 (시간 축)**:
- 개선 F. 🔴 지연 채점 (Temporal Coupling — hindsight 가치 보존)
- 개선 G. 🔴 Data Provenance Chain (각 데이터 포인트에 rubric/classifier version 태깅)
- 개선 H. 🔴 Metric QA Layer (classifier accuracy 주기 샘플 감사)
- 개선 I. Incremental Aggregation
- 개선 J. Regime Transition Zone
- 개선 K. Golden Snapshot Regression (Phase 2+)
- 개선 L. Coverage Markers (Phase 2+)
→ F·G·H·I·J를 Phase 0 추가 포함

**실행계획 (Phase 분해)**:

```
Phase 0: Registry + Versioning + Multi-scale + Provenance + QA 스키마
  ↓ G0 (Ace·Arki 합의)
Phase 1: 자동집계 MVP (registry-driven)
  ↓ G1 (growth_metrics.json 생성 + 훅 1회 통과)
Phase 2: 교차채점·Dissensus·AntiPortfolio·Golden Test·Coverage
  ↓ G2 (최근 5세션 후향 집계)
Phase 3: Growth Board UI (child 토픽, Vera+Dev)
Phase 4: Fin 측정 오버헤드 재감사 (10세션 후)
```

**남은 불확실성**:
- AI 모델 업그레이드(Sonnet 5·Opus 5)는 **레짐 변경**으로 처리
- Master calibration 변화는 **레짐 마커 타입**으로 등재

### Fin (비용·자원 감사)

- 구조 자체 승인 (비재무적 자산 가치: Nova N4 가시화·역할 정체성 강화)
- **3개 수정 요구**: (1) Master 개입 태깅은 자동 분류 없이 금지, (2) N-4 태깅은 Ace 대행(Master 부담 제거), (3) Phase 1 완료 후 측정 오버헤드 gate 필수
- 기회비용: topic_082 지연 아님(순서 정렬), topic_044·012 영향 없음

### Riki (적대적 감사)

- 🔴 R-1: 자율성 지표 해석 불가능성 (N-10 기각 후 L3 단일축 구멍) → Arki 재호출에서 `silent_approval` 분류로 해소
- 🔴 R-2: hitRateRubric 채점자 편향 (자기채점 구조) → 교차 채점 매트릭스로 해소
- 🟡 R-3: 20-window 레짐 혼합 → 레짐 마커로 해소
- 🟡 R-4: Anti-Portfolio 태깅자 편향 → 태깅 주체 분리로 해소

### Edi (본 문서)

- Ace 종합 + Arki 실행계획 + Phase 0 추가분 통합 컴파일
- Gap 플래그: Phase 3 child 토픽 분기 타이밍 Master 미회신(저마찰 원칙: 무응답=승인 → topic_082 재개 시 병합 기본값)

## Integrated Recommendation (D-060 상세)

### 결정 내용
성장지표 정의 프레임 + Board 계측 구조 확정:

1. **인과체인 (A1=C)**: 학습누적 → 적중률 → 자율성 하이브리드
2. **지표 구조 (A2=옵션 3)**: 공통 3층 + 역할별 signature 1개
   - 공통: L1 `cumulativeLearning`, L2 `hitRate`, L3 `autonomy` = 1 − (directive+corrective)/masterTurns
   - signature 8종 (registry 기반 declarative):
     | 역할 | 지표 | 채점 주체 |
     |---|---|---|
     | Ace | orchestrationHitRate (lag=3) | arki+fin+riki consensus |
     | Arki | structuralLifespan (lag=10) | automatic (재설계 감지) |
     | Fin | costForecastAccuracy | automatic (token_log) |
     | Riki | riskF1 (recall+precision) | ace+arki consensus |
     | Dev | firstPassRate | automatic (수정 사이클) |
     | Vera | masterRevisionInv | automatic |
     | Edi | gapFlagAccuracy | ace |
     | Nova | promotionRate | automatic (master promotion 태그) |
3. **적중률 조작화 (A5=C)**: hitRateRubric(D-041) 활성화 + 교차 채점 매트릭스
4. **Board IA (A6=안 β)**: Growth Board = 메인 페이지, Topic/Session = 별도 페이지
5. **시간축**: 지연 채점(lag 필드) + data provenance chain(rubricVersion·classifierVersion·regimeId per datapoint)
6. **확장성**: metrics_registry.json plugin 구조, multi-scale windows(20/100/500), rubric versioning, percentile 정규화
7. **QA**: N=10 세션마다 classifier 정확도 샘플 감사(`derived/metric_health.json`)
8. **레짐**: discrete marker + transition zone(3세션), auto-detection proxy는 Phase 4
9. **Anti-Portfolio**: decision_ledger.rejectedAlternatives[], 태깅자 ≠ 기각자

### 폐기·보류
- Nova N-6(B 메타인지 재검토)은 session_100 트리거로 연기
- Nova N-9(측정 시간 잠식)·N-10(Master 지침 공백) — Master 기각
- Nova N-3(Cross-Role Borrowing)·N-5(Retro Re-Label) — Phase 2

### 운영 규칙
- Phase 1 완료 후 **Fin 측정 오버헤드 재감사 gate** 필수
- **Phase 3 child 토픽 분기 타이밍**: topic_082 재개 시 병합 (기본값, Master 무응답)
- **session_100 A1 재검토 트리거** 자동 알림 설치(Phase 1)

### owningTopicId
`topic_083`. **scopeCheck**: 구조·스키마·데이터 계약까지만. 구현은 child 토픽.

## Unresolved Questions

- (결과 관찰 대기) AI 모델 업그레이드 시 레짐 마커 자동 등록 정확성 — Phase 4 검증
- (결과 관찰 대기) Master calibration 변화 포착 가능성 — 별도 marker 타입 효용
- (미확정) Phase 3 child 토픽 분기 타이밍 Master 명시 확인 시점

## Appendices

### A. Phase 0 Deliverables (9종)
1. `memory/shared/metrics_registry.json`
2. `memory/shared/hit_rate_rubric.json` (version·effectiveFrom 포함)
3. `memory/shared/intervention_classifier.json`
4. `memory/shared/regime_markers.json` (현재까지 D-xxx 백필)
5. `derived/metric_health.json` 스키마
6. Multi-scale window 스키마 (20/100/500)
7. Provenance chain 필드 정의
8. scoringLag 필드 정의
9. Incremental aggregation 알고리즘 설계

### B. Nova 제안 처리 전체표

| Nova | 판정 | 처리 Phase |
|---|---|---|
| N-1 Master 성장 지표 | 축소 수용 | Phase 1 (silent_approval 분류에 흡수) |
| N-2 Dissensus Index | 수용 | Phase 2 |
| N-3 Cross-Role Borrowing | Phase 2 보류 | Phase 2 |
| N-4 Anti-Portfolio | 수용 | Phase 2 |
| N-5 Retroactive Re-Labeling | Phase 2 보류 | Phase 2+ |
| N-6 B 메타인지 | 기각 | session_100 재검토 |
| N-7 Live Stream | Phase 2 옵션 | Phase 3 UI 스코프 |
| N-8 System Self-Portrait | 수용 (안 β 동형) | Phase 3 |
| N-9 측정 시간 잠식 | Master 기각 | — |
| N-10 Master 지침 공백 | Master 기각 | — |

### C. 본 세션 오케스트레이션 실적
- 루프 사용: Arki 재호출 1/2 + Arki 실행계획 2/2 = 2/2 (상한 도달)
- Master 개입: 1줄 요약 1회, 구조 질문 2회 ("최선 맞아?" × 2), 최종 승인 1회
- Nova 배치 재조정: Master가 Ace 종합 뒤 → 프레이밍 뒤 앞당김 지시
- 피드백 박제: `feedback_nova_auto_recommend_on_expansion.md` 갱신, `feedback_arki_self_audit_on_pressure.md` 신설
