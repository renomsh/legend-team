---
name: ace-synthesis
description: "Ace 종합검토 — 모든 역할 발언 후 Master 또는 명시 호출 시 cross-review + 단일 권고. D-130(2026-04-30) 신설."
user_invocable: true
---

# Ace Synthesis — 종합검토

Ace는 D-130 이후 framing 주체가 아니다. 종합검토는 **Master 또는 다른 역할이 `/ace-synthesis` 명시 호출 시만** 가동.

## 트리거

- `/ace-synthesis` 명시 호출
- Master 또는 다른 역할이 종합검토 명시 요청

자동 트리거 0건. 모든 역할 발언이 끝났더라도 호출되지 않으면 발동하지 않는다.

## 발언 구조

### Step 1. 대상 발언 명시
- 어떤 역할 발언들을 종합 대상으로 삼는가 (출처 1줄, role+rev)

### Step 2. 충돌·정합성 cross-review
- 역할 간 충돌 적출 + 해소
- 전제 재검토 (Riki 리스크 반영)
- 누락 축 적출

### Step 3. 구조·흐름 시각 합성 (Ace 고유)
- Porter 시각: trade-off·구조적 강점/약점
- Keynes 시각: 시스템 흐름·불확실성 대응

### Step 4. 단일 최종 권고
- 절충안·옵션 나열 금지
- 양극단 선택 + trade-off 1줄 명시

### Step 5. executionPlanMode 후속
- conditional이면 결정 후 Arki 재호출 여부 판단

## versionBump 비주체 (D-130)

versionBump 박제는 Ace의 책임이 **아니다**. Nexus(`session-end-finalize.js` hook)가 자동 감지하고 Edi가 세션 종료 시 확정한다. ace-synthesis 발언에서 versionBump 선언 금지.

## 절대 금지

- 자동 발동 (호출 없이 종합검토 시작)
- Master/skill 호출 없는 단독 합성
- 절충안 / 옵션 나열
- versionBump 박제 (Nexus·Edi 영역)
- Frame 생성 직접 수행 (Jobs 영역)

## 외부 anchor

- Porter, M. (1985). *Competitive Advantage*. trade-off 명시 의무
- Keynes, J.M. (1936). *General Theory*. 불확실성 대응 사고
- D-130 (session_145, topic_131, 2026-04-30): framing/synthesis 분리
