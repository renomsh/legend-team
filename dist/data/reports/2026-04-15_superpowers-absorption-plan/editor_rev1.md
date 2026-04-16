---
title: Superpowers 흡수 실행계획 — 실행계획 역할 귀속 결정
topic: topic_015
session: session_018
date: 2026-04-15
mode: observation
agentsSpoken: [ace, arki, fin, riki, ace-synthesis, editor]
novaInvoked: false
masterDecisions: [D-016, D-017, D-018, D-019]
status: completed
---

# Superpowers 흡수 실행계획 — 실행계획 역할 귀속 결정

## 1. 배경

topic_014(session_017)에서 Superpowers v5.0.7 플러그인은 미설치로 결정되고, brainstorming 3번(정교화 질문)·7번(자가 검토)만 자작 skill로 흡수하기로 했다. 이 과정에서 드러난 **"실행 계획 작성 역할 공백"**이 topic_015로 이연됐다. 현재 6역할(Ace/Arki/Fin/Riki/Editor/Nova) 중 결정 이후 "단계·선후·검증 기준"을 명시적으로 담당하는 역할이 없어, topic_004·topic_012·topic_014 모두 같은 이연 패턴을 반복하고 있었다.

Master가 3안을 제시: (1) Ace 통합 (2) Arki 통합 (3) 별도 역할 신설.

## 2. 역할 발언 요약

### Ace (프레이밍)
Arki 통합을 추천. 근거: 실행계획은 구조 문제의 연장이며 의존성·선후·병목은 Arki의 본업 언어. Ace는 이미 판단·종합 과부하, 별도 역할 신설은 Arki와 80% 겹침. topic_010 역할 재정의와 정합.

### Arki (구조 설계)
통합 수용. 단 2가지 경계 조건:
- ① **Fin 경계**: 시간·담당·공수는 Arki 범위 밖. 구조적 실행계획까지만.
- ② **발동 게이트**: Ace 자동 포함 반대. 검토형 토픽에 실행계획을 습관적으로 붙이면 역순 오류 재발.

확장 구조: 구조분석 / 의존성 / 설계판단 / **실행계획** 4섹션.

### Fin (자원·리턴)
- 한계 비용 거의 0 (CLAUDE.md·스키마 경미 수정). 자본 지출이 아니라 회계 재분류.
- 진짜 리턴은 "Master 주의력 회수". 레전드팀에서 가장 비싼 자원.
- 비재무적 자산(학습 루프·역할 진화) 영향 양호.
- 오염 감시 포인트: 첫 실행계획 산출 후 Fin 1회 감사.
- 결론: **가라.**

### Riki (리스크, 2건만)
- **R-1**: Arki 경계 ② `conditional` 모드가 죽은 조항 될 위험. Observation Mode는 역할별 1회 발언 전제라 재호출 구조 부재.
- **R-2**: "구조적 실행계획"의 시간축 오염 재발 위험. Fin 감사 기준이 미정.
- 완화책: 둘 다 **액션형 강제**(템플릿 필드, 금지어 리스트).

### Ace 종합검토
- Arki·Fin 전면 채택.
- **R-1 재해석**: 템플릿 강제가 아니라 Ace 오케스트레이션 학습화. `masterSelectionPatterns`에 역할 호출 패턴 누적 → 점진적 자동화. Editor가 백업 게이트.
- **R-2 강화**: 금지어 리스트 v0 구체화(절대시간·인력배정·공수단위).
- **Ace 오케스트레이터 선언** 추가 — 순서·횟수·재호출은 Ace 판단, 1회 순환은 초기 스캐폴드.

### Master 개입 (3회)
1. **3안의 의미 재명확화**: "skill 생성이 아니라 실행계획 역할 공백에 대한 3안" — Ace 1차 답변 오독을 교정.
2. **오케스트레이션 원칙 선언**: "초기엔 수동이지만 향후 학습화. Ace가 적재적소 판단. 1회 순환은 의미 없음."
3. **일정 수립 원칙 추가**: "일정은 Master가 필요를 제시했을 경우에만. 비현실적 계획은 의미 없음."

## 3. Master 결정 (4건 일괄 승인)

| ID | 내용 |
|---|---|
| **D-016** | Arki 확장 — "구조적 실행계획" 4번째 섹션. Ace가 `executionPlanMode: plan/conditional/none` 판정. |
| **D-017** | Schedule-on-Demand 원칙 — 일정·공수·담당은 Master 요청 시에만. 자동 생성 금지. |
| **D-018** | Arki 실행계획 오염 금지어 v0 — 3카테고리(절대시간·인력배정·공수단위). Fin 1회 감사. |
| **D-019** | Ace 오케스트레이터 선언 — 순서·횟수·재호출은 Ace 판단. `masterSelectionPatterns`에 누적 → 점진 자동화. Editor 백업 게이트. |

## 4. 파일 반영

- `CLAUDE.md` — Speaking order 설명 갱신, Ace Orchestration Protocol 섹션 추가, Schedule-on-Demand Principle 섹션 추가, 금지어 리스트 v0 명시
- `memory/shared/decision_ledger.json` — D-016~D-019 추가
- `memory/shared/topic_index.json` — topic_015 in-progress 엔트리 추가 (세션 종료 시 completed 전환)
- `memory/sessions/current_session.json` — session_018 open→closed
- `memory/sessions/session_index.json` — session_018 엔트리 추가
- `memory/MEMORY.md` — `feedback_schedule_on_demand_only.md` 추가

## 5. 후속 과제 (topic_015에서 이연된 재이연)

- `ace-framing` 자작 skill 실제 구현 (brainstorming 3번·7번 흡수) — 다음 토픽
- Arki 실행계획 첫 산출 시 Fin 1회 오염 감사 실행
- `masterSelectionPatterns` 스키마에 `roleCallPatterns` 필드 추가 (topic type → 호출 이력)
- Observation Mode 정의 갱신: "순차 발언"이 아니라 "Ace 조율 하의 단계적 발언"
