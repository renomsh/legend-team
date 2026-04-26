---
role: ace
topic: topic_110
session: session_107
phase: framing+synthesis
rev: 1
---

# Ace — Framing + 종합검토 (topic_110)

## Framing (재정정)

session_104~106 박제 D-094/D-097/ia-spec.md §5/Vera wireframe 모두 **Home = Hero KPI 3 + 5 인덱스 카드 + Recent band**로 일관. 모호함 없음. 현 `app/index.html`은 spec 0건 적용 상태(AGENTS 8 + TOPICS 리스트, 이전 프로토타입 잔류).

**메타 결함**: G1~G5 게이트는 코드 형식 + 런타임 동작만 검증. "spec대로 만들어졌는가"는 한 번도 검증한 적 없음. Master P-3 채택.

## Master 결정 (3건)

- **Q1=a**: 정본 = ia-spec.md + dashboard-upgrade.html canonical + page-checklist/. D-094/D-097 derived 강등.
- **Q2=a**: People 페이지 신규 — 본 토픽 scope 포함.
- **Q3=b**: canonical 사용률 임계 = Phase B report mode 실측 후 Phase C 직전 lock.

## 종합검토

| 결정 | 보강 |
|---|---|
| Q1=a | **R6 mit**: D-094/D-097 본문 STATUS 1줄 inline. 별도 필드 신설 금지. 소급 invalidation 범위 = 없음. |
| Q2=a | **R7 mit**: People을 Phase A 산출물 포함(page-checklist 박제). 구현은 Phase C. fallback(topic_111 분리)은 Phase C 부하 보고 재판단. |
| Q3=b | **R8 mit 보강**: 임계 2개 동시 박제 — (i) 달성가능선=enforcement, (ii) ia-spec 직독 이상선=backlog. (ii) 미달분 자동 follow-up topic 예고. |
| Phase B exit | **R9 mit**: 6페이지 report + 임계 (i)(ii) 박제 + Master Q-A 1회 통과. fallback: 2세션 hard cap, 미달 시 (ii) 단일값 강제 lock 후 Phase C. |

9 리스크 통합 (Arki R1~R5 + Riki R6~R9). 중복 0.

## D-100 박제 (Dev 작업 4·5에서 처리)

G0.5 spec 정합 게이트 도입 + 정본 3종 + Phase A→B→C + R6~R9 mitigation 일괄.

## Master Q5=a / Q6=a

Phase A까지 박제 후 close. Records 통합 파일 유지(R6 컨벤션 침습 최소화).
