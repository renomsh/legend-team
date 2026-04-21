---
topic: topic_070
topic_slug: topic-lifecycle-system-impl
title: PD-022 토픽 생명주기 시스템 구현
role: editor
phase: compile
revision: 1
date: 2026-04-21
report_status: final
session_status: closed
---

# PD-022 — 토픽 생명주기 시스템 구현 (D-057)

## 배경
D-056(session_066)에서 확정된 토픽 프레이밍↔구현 관계 + PD resolveCondition + 저마찰 자동 종결 모델을 실제 시스템에 박음. Arki 4-Phase 실행계획(conditional mode)으로 진행.

## 핵심 결정 (D-057)
- **소급 범위 축소**: Master 지침으로 "과거 소급 이유 없음". topic_062/066 2건 한정(자동 종결 회로 검증용 테스트 케이스), 나머지 68개 레거시는 `topicType` undefined 유지.
- **저마찰 dry-run 2단**: auto-close + PD 전이 모두 기본 dry-run, `--apply` 재호출로 적용. 무응답=보류.
- **Ace Step 0 신설**: ace-framing 최상단에 topicType/parentTopicId 판정 (Grade A/S 전체 블록, B/C 1줄 인라인).

## Phase 결과
| Phase | 결과 | 게이트 |
|---|---|---|
| P1 스키마 + 소급 2건 | topic-lifecycle.ts / validate-schema-lifecycle.ts / topic_062·066·063·064·065·067·069·070 링크 완료 | **G1 ✓ drift=0** |
| P2 자동 종결 + PD 전이 | auto-close-topics.ts / resolve-pending-deferrals.ts(stale 리포트) / hook 확장 / /open step 3.6 | **G2 ✓ 단위테스트 C1~C4 4/4** |
| P3 강제 레이어 + Step 0 | reclassify-topic.ts(revision_history) / validate-topic-closure.ts / ace-framing Step 0 / create-topic.ts 확장 | **G3 ✓ 회귀 없음** |
| P4 문서화 | CLAUDE.md Topic Lifecycle System 섹션 / /open 체크리스트 | ✓ |

## Riki 리스크 대응
- **R-1 숨은 framing 쌍**: 소급 범위 축소로 원천 무효화 (Master 판단)
- **R-2 silent 매칭 실패**: resolve-pending-deferrals.ts stale PD 리포트 분리 출력
- **R-3 Grade C topicType 공백**: Ace Step 0에 Grade B/C 1줄 인라인 추가
- **R-4 closed 토픽 수정 무결성**: reclassify-topic.ts가 revision_history.json 자동 append

## 산출물
- 신규: `scripts/lib/topic-lifecycle.ts`, `scripts/auto-close-topics.ts`, `scripts/resolve-pending-deferrals.ts`, `scripts/reclassify-topic.ts`, `scripts/validate-schema-lifecycle.ts`, `scripts/validate-topic-closure.ts`
- 확장: `scripts/create-topic.ts`, `.claude/hooks/session-end-finalize.js`, `.claude/commands/open.md`, `.claude/skills/ace-framing/SKILL.md`, `CLAUDE.md`

## 학습 (Ace)
"소급=관성"으로 오해. 전면 소급→전면 폐기로 양극단 진동. Master는 "2건 테스트 케이스"로 선택적 정보 제공했는데 프레임을 잘못 걸음. feedback_ace_grade_intent_check 연장선.

## PD 상태
- PD-022 → **resolved** (resolvedInSession: session_067)
