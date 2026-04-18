---
session: session_038
topic: 전역스킬, 역할별 스킬 매핑
topicSlug: global-skill-role-mapping
date: 2026-04-19
grade: A
agents: [Ace, Arki, Fin, Vera, Riki, Editor]
decisions: [D-042]
resolvedDeferrals: [PD-014]
newDeferrals: [PD-017]
version: v1.11
---

# 전역스킬, 역할별 스킬 매핑 — session_038

## 결정 요약

| ID | 축 | 결정 |
|---|---|---|
| D-042 | 역할별 스킬 매핑 + 전역 스킬 + 버전 정책 | 8개 역할 skills 필드 신설. auto-model-switch 전역 설계. 마일스톤형 버전 정책 확정. |

## 전역 스킬

| 스킬 | 트리거 | 소스 | 상태 |
|---|---|---|---|
| `auto-model-switch` | Grade A/S → /fast(Opus 4.6), Grade B/C → Sonnet 유지. 세션당 1회. | opusplan 패턴 (Anthropic 공식 언급) | 설계 완료, 구현 PD-017 |

## 역할별 핵심 스킬

| 역할 | core 스킬 | 주요 방법론 |
|---|---|---|
| Ace | ace-framing, ace-learning-loop, writing-plans | 결정 축 2극단, Scope In/Out, 역할 호출 설계 |
| Arki | engineering:architecture, system-design, tech-debt | ADR, C4 Model, D2(via Dev) |
| Fin | finance:financial-statements, variance-analysis | EBITDA Decomposition, DCF, Scenario Table |
| Riki | operations:risk-assessment | 🔴/🟡 + 실패모드 + 완화조건 |
| Nova | product-management:product-brainstorming | 침묵 원칙 (발언=건강 이상 신호) |
| Dev | systematic-debugging, verification-before-completion, subagent-driven-development | 읽기>쓰기, tsc+런타임 2개 검증 |
| Vera | design:design-system, design-critique, design-handoff | Rams 원칙, 수치 근거, 단일 추천 |
| Editor | web-artifacts-builder, doc-coauthoring | validate-output.ts, Strunk&White |

## 버전 정책 확정

| 변경 규모 | 버전 변화 |
|---|---|
| 역할 정의·구조·핵심 프로토콜 변경 | +0.1 |
| 스킬 매핑·도구 추가·메모리 필드 확장 | +0.01 |
| 버그 수정·데이터 소급 처리 | +0.001 |

**버전 이력 소급 정정**
- session_037 (페르소나 전면 재정의): v1.01 → **v1.1**
- session_038 (스킬 매핑): **v1.11**

## 이연 과제

| ID | 항목 |
|---|---|
| PD-017 (신규) | auto-model-switch 스킬 파일 생성. writing-skills 스킬로 구현. |
| PD-014 | resolved ✅ |
