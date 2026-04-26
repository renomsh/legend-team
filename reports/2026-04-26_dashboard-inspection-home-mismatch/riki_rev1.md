---
role: riki
topic: topic_110
session: session_107
phase: analysis
rev: 1
---

# Riki — Q1=a/Q2=a/Q3=b 신규 리스크 감사 (topic_110)

R1~R5 (Arki) 외 신규 리스크만. R6~R9 박제.

## R6. Q1=a 정본 강등 부수효과

- **fail**: D-094/D-097 derived 강등으로 ledger 위계 평면성 깨짐. 미래 토픽에서 LLM 또는 Master가 derived ledger를 정본처럼 인용 → 잘못된 의사결정 회귀. session_104의 D-094 근거 결정 체인 소급 재해석 시 invalidate 범위 미정의.
- **mit**: D-094/D-097 본문 상단에 `STATUS: derived from ia-spec.md (downgraded by D-100)` 1줄 inline 박제. 별도 등급 필드 도입 금지. topic_110 ledger에 "소급 invalidation 범위 = 없음. 과거 결정은 그 시점 정본 기준으로 유효" 명문화.
- **fb**: derived 강등을 토픽 단위 격리. topic_110 내부에서만 ia-spec 정본 취급, D-094/D-097 글로벌 그대로 두되 topic_110 게이트 평가에서만 비참조.

## R7. Q2=a + 3세션 원칙 부하 초과

- **fail**: Phase A 정본화 + Phase B 5페이지 report + Phase C 재구현 + People 신규 + VR baseline 재lock = 5작업. 1세션당 1.67작업. People은 page-checklist도 새로 만들어야 하는 독립 워크아이템. Phase C에서 People이 spec/구현 동시 미완 → 종료 조건 미달.
- **mit**: People을 Phase A 산출물 명시 포함. Phase A 종료 조건 = "기존 5페이지 정합 + People page-checklist.md 신규". Phase B는 6페이지 report. People 구현은 Phase C 범위.
- **fb**: People 신규 구현을 topic_110에서 분리해 follow-up topic_111 예고 박제(분화 금지 위반 아닌 "예고된 후속"). topic_110 scope = 5페이지 + People spec까지만.

## R8. Q3=b endogeneity

- **fail**: Phase B 실측 분포로 임계 lock = 임계가 현재 구현 수준 anchored. spec이 구현에 자기조정되는 역방향. 5페이지 평균 30%면 임계가 30% 근처 lock → ia-spec 의미 점진 공동화. R3 회피하려고 도입된 b안이 의미 공동화로 우회.
- **mit**: 임계 lock 시 두 값 동시 박제 — (i) 실측 기반 "달성 가능선", (ii) ia-spec 직독 기반 "이상선". Phase C enforcement는 (i)으로 PASS 판정, ledger에 (ii)와의 gap 명시 → 다음 토픽 backlog 자동 승계.
- **fb**: 5페이지 중 최저 사용률 페이지를 floor로 lock하지 않고 중앙값 또는 상위 2번째를 floor로. race-to-bottom 차단.

## R9. Phase B→C 전환 게이트 미정의

- **fail**: 임계는 Phase C 직전 lock, Phase B 종료 조건 자체가 미정의. report만 한다면 어느 시점에 끝나는가? Phase B 무한 연장 → 토픽 stall.
- **mit**: G0.5 spec에 Phase B exit criterion 명시 — "5페이지 + People = 6페이지 report 산출 + 임계 후보 (i)(ii) 박제 + Master Q-A 1회 통과". 산출물 박스.
- **fb**: Phase B 2세션 hard cap. 미달 시 자동 (ii) 단일값 lock 후 Phase C 진입. 정체 시 안전한 default = spec-strict.

## 패스한 surface

- surface 4 (D-099/VR baseline 비대칭): 운영 detail, 신규 리스크 약함
- surface 6 (People spec source 부재): R7로 흡수

## 자가검토

R8 mit "이상선/달성가능선 동시 박제"가 race-to-bottom 막는지 약함 — Master가 (i)만 보고 (ii) 무시 시 mit 공동화 위험. 구조적 강제력 자신 부족.
