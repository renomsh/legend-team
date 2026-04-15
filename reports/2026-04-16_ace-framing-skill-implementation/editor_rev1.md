---
topic: ace-framing 자작 skill 실제 구현
topicId: topic_016
session: session_019
date: 2026-04-16
mode: observation
agents: [ace, arki, riki, ace-synthesis]
novaInvoked: false
status: closed
---

# ace-framing 자작 skill 실제 구현 — 최종 보고서

## 1. 토픽 개요

**배경**: topic_014(Superpowers 검토)에서 brainstorming 3·7번 해체·흡수 → ace-framing skill 신설 결정. topic_015(흡수 실행계획)에서 Arki 실행계획 통합·오케스트레이터 선언 완료. 이번 세션은 실제 구현.

**목표**: `ace-framing` skill 파일 신규 작성 + CLAUDE.md 4건 업데이트로 brainstorming 완전 흡수.

---

## 2. 구현 산출물

### 신규 파일

**`.claude/commands/ace-framing.md`**
- 발동 조건 3개 (OR): Master 직접 호출 / 목적·제약·성공기준 2개 이상 불명확 / 범위 초과 가능성
- 정교화 질문 프로토콜 (brainstorming 3번 흡수): 1문1답, 객관식 우선, 목적·제약·성공기준 축, 범위 초과 분해 플래그
- 추천 근거 필수화 (4번 벤치마킹): 추천 + 이유 + 기각 이유 3-line 구조
- 프레이밍 자가검토 4항목 (7번 흡수): 전제 누락·결정축 모순·범위 적정성·모호성

### CLAUDE.md 변경 4건

| # | 변경 | 위치 |
|---|---|---|
| 1 | Session Start 2번에 `git log --oneline -10` 추가, 기존 번호 재배열 | Session Protocol |
| 2 | Ace Speaking order에 추천 근거 필수화 명시 | Default Mode |
| 3 | **역할 공통 자가검토 프로토콜** 신설 (4항목 + 걸린 항목만 노출 규칙) | Ace 종합검토 Protocol 앞 |
| 4 | Editor 명시적 리뷰 게이트 추가 | Editor Protocol |

---

## 3. Master 개입 요약

| 회차 | 내용 | 결과 |
|---|---|---|
| 1 | Q1: self-review 전 역할 필요 여부 | 역할 공통 프로토콜로 격상 |
| 2 | Q2: 디자인 전담 역할 신설 의견 (보고서·HTML·차트) | Editor 업그레이드로 수렴, **별도 토픽 이연** |
| 3 | Q3: 벤치마킹 4건 모두 이번에 적용 | scope 확장 반영, 전부 구현 |
| 4 | R-1·R-2 Ace·Arki 의견 요청 | A안(CLAUDE.md 직접 기술 + 걸린 항목만 노출), 현행 유지 확정 |
| 5 | Arki 구현 전 최종 점검 요청 | 발동 조건·삽입 위치 2건 해소 후 구현 진행 |

---

## 4. 이연 항목

| 항목 | 이유 |
|---|---|
| Editor 디자인 역량 업그레이드 (보고서·HTML·차트 시각화) | scope 분리. ace-framing 완성 후 별도 토픽 |
| ace-framing 압력 테스트 (Phase 3) | Master 승인 후 별도 세션 |
| 나머지 13 skill 해체·흡수 재평가 | ace-framing 운용 결과 확인 후 순차 진행 |

---

## 5. 레슨런

### L-1. "이미 있다"와 "품질이 동등하다"는 다르다
기능 존재 여부와 품질 동등성은 별개 판단. brainstorming 1·4·5·8번을 "이미 있음"으로 넘겼으나 벤치마킹 재검토에서 4건 모두 보강 여지 발견.

### L-2. self-review는 역할 전용이 아닌 공통 게이트
원본에서 "spec" 단계에만 있던 self-review를 전 역할 공통으로 격상하는 것이 레전드팀 구조에 더 적합. 역할별 발언 품질 게이트로 작동.

### L-3. 텍스트 원칙 → skill 파일로만 행동이 바뀐다
(feedback_text_vs_action_asymmetry 재확인) CLAUDE.md에 추천 근거 필수화를 한 줄 추가하는 것 외에, skill 파일에도 명시해야 실제 행동 변화가 생긴다.

---

## 6. 산출물 목록

- `reports/2026-04-16_ace-framing-skill-implementation/ace_rev1.md`
- `reports/2026-04-16_ace-framing-skill-implementation/arki_rev1.md`
- `reports/2026-04-16_ace-framing-skill-implementation/riki_rev1.md`
- `reports/2026-04-16_ace-framing-skill-implementation/editor_rev1.md` (본 파일)
- `.claude/commands/ace-framing.md` (신규 구현)
- `CLAUDE.md` (4건 업데이트)

---

**작성자**: Editor (기록자)
**승인**: Master (2026-04-16)
