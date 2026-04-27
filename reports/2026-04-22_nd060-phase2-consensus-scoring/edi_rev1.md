---
topic: nD-060 Phase 2 — consensus 채점 인프라 (학습축 자가평가 MVP로 전환)
topicId: topic_087
parentTopicId: topic_083
sessionId: session_081
date: 2026-04-23
revision: 1
grade: A
status: completed
mode: observation
contributing_agents: [ace, arki, fin, riki, dev, vera, editor]
decisions: [D-062]
accessed_assets:
  - file: memory/shared/topic_index.json
    scope: all_topics
  - file: memory/shared/decision_ledger.json
    scope: recent_decisions
  - file: memory/shared/metrics_registry.json
    scope: v2_draft
  - file: memory/shared/evidence_index.json
    scope: open_risks
  - file: memory/roles/*.json
    scope: persona_and_rubric
---

# Executive Summary

Phase 2 원래 설계(consensus 교차채점 인프라)는 **측정→품질 인과 경로 미증명 + Top 0.1% 신뢰 전제 위배**로 **보류**. 대신 **학습축 자가평가 MVP**로 라이트 착륙. 8역할이 본인 signature 지표 28개(즉시 21 / 지연 7)를 스스로 제안, 100점 기준 자가 채점, 3뷰 추이(전체·최근10·최근3) 집계.

**핵심 결정 — D-062**: 자가평가는 외부평가와 공존하도록 설계한다. 자가평가의 편향(기각 민감·발언 축소)은 외부평가(결과품질·판단일치)가 붙으며 자연 상쇄된다. 4축 프레임 전체의 설계 헌장.

consensus 본체는 registry draft 유지로 **복구 가능 상태 동결**. PD-023으로 재개 조건(품질 공백 데이터 관찰) 등록.

---

# Context

- 진입: D-061 Phase 2 Gate Go (session_080) 직후 착수
- 선행: topic_083(D-060 framing) → topic_084(Phase 0) → topic_085(Phase 1) → topic_086(Fin 감사) → **topic_087 (본 세션)**
- 4축 프레임 (Master 정의, 이번 세션 최초 공표):
  - 결과품질축 / 판단일치축 / 실행전환축 / **학습축(본 토픽)**

---

# Agent Contributions

## Ace — 프레이밍 + 궤도 수정

초기 L2 프레이밍에서 3지표 MVP(ace·riki·fin.cfa) 추천. Master "모두의 지표" 신호에 7지표로 확장 → Master 반문으로 드리프트 자각. 자가 드리프트 인정 후 **범위 B(consensus mode 3)** 재권고. Master 근본 질문("측정을 위한 측정 아닌가?") 이후 **자가평가 MVP**로 전면 재프레이밍 수용. 종합권고: 28지표 확정 + D-062 박제 + 구현 PD-023 이연.

## Arki — 구조 설계 (rev1 + rev2)

rev1: 하이브리드(consensus_log.jsonl 분리 + registry hard-ref + validate 자동화). 3지표 scoringMode 분기. scoringLag=3과 큐잉 정합. kpiSummary 블록 신설.

rev2: 범위 B 수용 시 스키마 11지표 수용 유지, 채점 작업만 축소. overlay 레코드 타입(append-only 원칙 유지). rater_bias.json 파생.

자가평가 MVP 전환 후 구조 역할 축소 — 스키마 슬롯만 예약, 실제 구현은 Dev.

## Fin — 비용·자원 감사

Phase 1 절감분(64%)과 채점 오버헤드는 회계 버킷 분리. Rater Sonnet 권고. 외부 평가자 agent (d) 평가 — **기각**. 근거: 같은 베이스 모델이 "외부성" 구조적 보장 실패, 분기 1회 운영이면 agent보다 Master 직접이 비용·신뢰 모두 우위. 

자가평가 MVP 본인 지표 3개(Hidden Cost Hit Rate / Stage-Awareness Clean Rate / Non-Financial Value Coverage). Ace 피드백 수용하여 NFC의 "Master 인용률" → "Ace 종합검토 인용률"로 수정.

## Riki — 리스크 감사 + 자기 부정 감사

rev1: 🔴 R1 self-scoring·🔴 R2 D-059 앵커 무응답 역편향 (Master 철회 지시).

rev2: R1-b 한계 인정 ("내부 3축만으론 담합 탐지 불가, 외부 앵커 필요"). 

Master 근본 질문 응답: **7/8 층 자기 철회**. "측정→품질 인과 경로 약하다", "Master 재질문 > 어떤 내부 채점", "consensus 채점은 N4 증거 장치로 부적합 — 관료제 위험" 인정. (Y) master_feedback_log 확장만 권고.

5개 질문 직답: Q1 No / Q2 No / Q3 No / Q4 Yes (측정을 위한 측정 맞음) / Q5 No.

자가평가 MVP 본인 지표 4개(리스크 적중률 / 침묵 담력 / 목적성 부합도 / 중복 회피율) — Master 예시(반대를 위한 반대 방지) 정확히 반영.

## Dev — 구현 feasibility + 자가 지표 확정

Arki 하이브리드안 실현 가능성: 신규 파일 3종 + 기존 2종 확장. Rater 호출 메커니즘 3선택지 비교 → **선택지 C(다음 세션 큐잉)** 권고. 선택지 B(SDK 직호출) Master 기각. 실측 프로브 선행 권고.

자가평가 MVP 본인 지표 4개 — Master 예시 3개(하드코딩·재수정·효율) 전부 커버:
- 하드코딩 발생률 (역, -15점/건)
- 3회 초과 수정 발생률 (역, -25점/건, 규율 가중)
- 1회 통과율 (선형)
- 런타임 증거 첨부율 (-20점/누락)

## Vera — 자가 지표 확정

Ace 대필 3개 초안 검토, "단일 추천 준수율"은 **지표 아닌 전제**로 제외, 대체 지표(위계 선행 준수율) 제시.

최종 4개 (Rams 원칙 4축):
- 수치 근거 동반율 (즉시)
- 위계 선행 준수율 (즉시)
- 대비 위반 적발율 (WCAG AA, 즉시)
- Editor 재사용률 (지연 3세션)

## Edi — 본 리포트 compile

원문 보존 원칙 준수, 독립 판단 없음. 역할 발언 원형 유지하여 통합.

---

# Decision — D-062

**ID**: D-062
**Date**: 2026-04-23
**Session**: session_081
**Topic**: topic_087
**OwningTopicId**: topic_087
**Axis**: 자기평가-외부평가 공존 원칙 + 학습축 자가평가 MVP 확정

**Decision**:
- Phase 2 consensus 교차채점 본체 **보류** (registry draft 동결, 복구 가능 상태 유지)
- 학습축 계측은 **자가평가 MVP**로 착륙: 8역할 × 2~4 signature 지표 = 28지표, 100점 자가 채점, 3뷰 추이(전체/최근10/최근3)
- **자가평가는 외부평가와 공존하도록 설계** — 자가평가의 편향(기각 민감·발언 축소)은 외부평가(결과품질·판단일치)가 붙으며 자연 상쇄
- 4축 프레임(결과품질/판단일치/실행전환/학습) 전체의 설계 헌장으로 승격

**Rationale**:
- Riki 자기 부정 감사: 측정→품질 인과 경로 공백, 내부 상호채점의 N4 코스프레 위험
- Fin 감사: 외부 agent 기각 (같은 모델 = 외부성 허상), 분기 스팟도 과투자 가능성
- Master 원칙: "실무용 병기 ROI 우선, 측정을 위한 측정 금지"
- Master "Top 0.1% 신뢰" 전제 — 자가평가가 페르소나와 정합

**Rejected Alternatives**:
- consensus mode 3개(L2/ace/riki) 착수 — Riki 자기 철회로 기각
- 외부 평가자 agent (d) — Fin 감사로 기각 (같은 베이스 모델의 외부성 실패)
- Master 분기 스팟 샘플링 (b) — 자가평가+외부평가 공존 설계로 대체

**Value**:
- 라이트 MVP로 학습축 시동, 인프라 과투자 회피
- 미래 결과품질·판단일치 축 붙을 때 편향 자동 상쇄 구조 사전 설계
- N4("나 없이도 돌아가는 팀") 로드맵 정합 — Master 개입 없이 본인 규율 성장

---

# 28 Signature Metrics 최종 확정

| 역할 | 지표 | 채점 |
|---|---|---|
| **Ace** | 오케스트레이션 적중 / 프레이밍 수명 / 종합검토 단일권고 준수 / Master 선택 일치율 | 즉시3·지연1 |
| **Arki** | 구조적 분해 깊이 / 불변성 우선 설계 / 구조 LL 축적률 | 즉시3 |
| **Fin** | Hidden Cost Hit Rate / Stage-Awareness Clean Rate / NFC (Ace 인용률) | 즉시1·지연2 |
| **Riki** | 🔴 리스크 적중률 / 침묵 담력 / 목적성 부합도 / 중복 회피율 | 즉시3·지연1 |
| **Dev** | 하드코딩 발생률 / 3회 초과 수정 / 1회 통과율 / 런타임 증거 첨부율 | 즉시4 |
| **Vera** | 수치 근거 동반율 / 위계 선행 준수율 / 대비 위반 적발율 / Editor 재사용률 | 즉시3·지연1 |
| **Edi** | 역할 원문 보존율 / gap flag 정확도 / revision 순차 준수 | 즉시3 |
| **Nova** | speculative 라벨 규율 / 승격률 / 가정 뒤집기 적중 (집계 단위: 호출 세션) | 즉시1·지연2 |

**집계**: `memory/shared/self_scores.jsonl` (append-only), 3뷰(전체/최근10/최근3), 지연 지표는 채점 완료 시 값 append (pending=NaN, 평균에서 제외).

**Nova 집계 특례**: 호출 세션 기반 (Master 확정).

---

# Unresolved / Pending

- **PD-023 (신규)**: 학습축 자가평가 MVP 구현 — `self_scores.jsonl` 스키마, `self-score-collect` 훅, `compute-growth.ts` 자가평가 분기, 대시보드 역할 카드 8개, 지연 채점 resolver. **Dev 주도**, Grade B 얇은 토픽으로 예약.
- **PD-024 (신규)**: Phase 2 consensus 교차채점 본체 — `resolveCondition: "결과품질축·판단일치축 붙은 후 자가평가 편향이 외부평가에서 체계적으로 드러나면 재개"`. registry draft 유지로 복구 가능.
- 즉시/지연 혼합 지표 집계식 초기 calibration — Dev 구현 시 10세션 baseline 후 조정 (개별 역할 자율).
- Dev·Vera 자가 지표는 본인 확정 완료. Nova 지표는 Ace 대필 — Nova 다음 호출 시 본인 수락·수정 세션 필요.

---

# Master Feedback 반영

- **M1**: "실무용 병기 vs 아트 — 과투자 금지, ROI 우선" (rater 선택지 B 기각 계기)
- **M2**: "모두의 지표 가시화" — 초기엔 Ace가 7지표 확장으로 오독. Master "3/7/11 정확히 이해하자" 개입으로 재정렬 → 최종 "11지표 가시화 + consensus 본체 보류 + 자가평가로 전환"으로 귀결
- **M3**: "자기평가+외부평가 공존" — D-062 원칙 박제
- **M4**: Riki 우려 해소 — "편향·발언수 감소도 나쁘지 않음. 채택률·결과값 붙으면 놓친 리스크가 외부평가에서 나와 상호보완"
- **M5**: Nova 지표 집계 단위 = 호출 세션 기반

---

# Appendix — 폐기 정교화 층 (Riki 자기 철회)

기록 보존 (미래 재검토 근거):
- 담합 탐지 3축 (consistency·raterMean·crossTopicVariance)
- 3단 경보 에스컬레이션
- 2-track 원본/보정 UI
- 동적 calibration 프로토콜
- pair 적대적 프로브 3쌍
- 외부 평가자 agent (d)
- rater_bias.json 파생
- post_hoc_incidents.json 분리

유지: overlay 레코드 타입 + validate 위생 (consensus 재개 시 재활용 가능, 스키마 슬롯만 예약).
