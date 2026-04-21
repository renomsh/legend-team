---
role: fin
session: session_053
topic: topic-centric-architecture
topicId: topic_056
rev: 1
date: 2026-04-21
phase: resource-evaluation
---

# Fin — 자원·비용 방향성 평가

Schedule-on-Demand 준수 (금지어 부재 확인).

## 1. 축별 비용·이득

| 축 | 구현비용 | 운영비용 | 이득강도 |
|---|---|---|---|
| A1 토픽1급 | 낮음 | 낮음 | 강 |
| A2 N:1 단방향 | 매우 낮음 | 낮음 | 중 |
| A3 이중 성장축 | 중 | 중 | 강 |
| A4 점진 이행 | 낮음 | 낮음 | 중 |
| A5 phase×hold | 중 | 낮음 | 중 |
| A6 owningTopicId | 낮음 | 낮음 | 강 |
| A7 자동 로드 | 낮음 | 매우 낮음 | 강 |
| A8 turn-log+brief | 중~상 | 중 | 매우 강 |

## 2. A8 토큰 ROI

- 현재 Master 수동(save01~05): 3~7K tokens + Master 수분 노동/세션
- A8 자동 로드: 800~1500 tokens/세션, Master 설명 0
- **순 절감 2~5K tokens + Master 노동 전부 제거**
- 손익분기 즉시 도달

## 3. 비재무적 자산 보호

- Master 사고 궤적 연속성 (최상위)
- 학습 루프 품질 (PD-015 성장지표 유의미화)
- 역할 진화 (Editor narrative 작성자로 확장)

## 4. 방향성 권고 (ROI 순)

1. A7+A8 묶음 — 즉시 최대 이득
2. A1+A2 — 기반 필수
3. A6 — 저비용 강이득
4. A4 — 이행 안전판
5. A3+A5 — PD-015와 묶어 차기 토픽 가능

## 5. 총평

Big bang 회피 + N:1 단방향 확정 덕에 총비용 낮음·이득 강. **자원 대비 매우 우호적.**
