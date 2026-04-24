---
role: arki
session: session_090
topic: pd031-topic082-parallel-integration
topicId: topic_095
grade: A
invocationMode: subagent
subagentIds: ["ae844b15ec6eda182", "afb198c09b2033911", "abc7376a51148552f"]
date: 2026-04-24
---

# Arki — session_090 구조 설계 (3회 호출)

## 1차 호출 (ae844b15ec6eda182) — 강제성 4계층 설계

| 계층 | 수단 | 차단 실패 모드 |
|---|---|---|
| Soft-guide | CLAUDE.md·스킬 | 망각·관성 |
| Schema-contract | invocationMode·agentsCompleted | 사후 감사 누락 |
| Process-gate | /close 검증·stop hook | 세션 단위 게이트 돌파 |
| Structural | 페르소나 분리 로딩 | 인라인 시뮬 물리적 불가 |

비대칭 가동 모델: `alwaysActive: ["ace"]` + `conditionalDispatch: [...]`. Grade S에선 Ace도 서브 강제.

## 2차 호출 (afb198c09b2033911) — Phase 1/2/3 로드맵

**Phase 1 (이번 세션):** Schema + Hook + Structural L1~L3
**Phase 2:** PreToolUse hook (L4) — Phase 1 안정화 후
**Phase 3:** 페르소나 분리 로딩 (L5) — PD로 이관, SDK 조사 선행

롤백: gradeAInlineBlock 배열만 비우면 게이트 무력화. 관찰성은 보존, 강제만 해제.

## 3차 호출 (abc7376a51148552f, Master "메인으로 나와") — 실행 명세

**Section A: 산출물 재정의** → A4 (방어책 Phase 1 + signal registry 스펙만).
**Section B: 9 파일 변경 명세** — turn-types·phase_catalog·dispatch_config·finalize·validate·open·topic_095·signal_registry·role-*.md.
**Section C: Ace 합법 발언 조건 4가지 + 금지 상황 4가지 + Master 직접 호출 프로토콜.**
**Section D: 10개 결정 항목 + 권고값**.

## Findings 박제 (F-001~F-012)

- F-001~F-004: session_090 inline-main 구조 진단
- F-005: Ace-as-relay 위반
- F-006: 자백-내-대책 원칙
- F-007: signal 측정은 schema 인프라에 역의존
- F-008: phase enum 세분화 필요
- F-009: Ace alwaysActive의 relay 유인
- F-010: finalize 저마찰 게이트 정합
- F-011: signal source는 subagent 턴 한정
- F-012: /open hard-prompt로 스킬 dead code화

## Persona Drift (F-013)

Arki 서브 2회 자기소개에서 spec에 없는 "김우진" 자가 생성. Rich Hickey 레퍼런스 무시. role-*.md 4개에 자기소개 제약 추가로 해소.
