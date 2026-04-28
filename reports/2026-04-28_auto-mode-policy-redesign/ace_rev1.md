---
role: ace
topic: topic_130
session: session_136
date: 2026-04-28
---

# Ace 프레이밍 — auto mode 정책 변경

## Topic Type
`standalone` — Claude Code permission mode와 레전드팀 orchestrationMode는 제어 대상이 다른 독립 작업.

## 핵심 질문
1. Claude Code 5개 permission mode를 레전드팀 정책에 매핑할 것인가?
2. 각 모드에서 CLAUDE.md가 어떤 행동 계약을 명시해야 하는가?

## 결정 축
- 축 1 — 모드 명칭: 레전드팀 전용 명칭 재명명 (B 권고)
- 축 2 — 매핑 구조: permission mode와 orchestrationMode 독립 레이어 분리 (B 권고)
- 축 3 — CLAUDE.md 기술: `Permission Mode` 별도 섹션 신설 (B 권고)

## 결과 — 토픽 진행 중 Master 진단 변경

Master가 권한 건너뛰기 동작 이슈를 디버깅하려고 본 토픽을 열었으나, 작업 중 다음을 확인:

1. **topic_128/129에서 추가된 Task 훅 인터셉트 제거 요청** — `PreToolUse(Task)` / `PostToolUse(Task)` 훅이 Agent 호출 인터셉트
2. **1차 조치**: settings.json에서 두 훅 등록 제거 → 페르소나 주입까지 사라짐
3. **2차 조치 (Master 정정)**: 훅은 유지, `pre-tool-use-task.js`의 `permissionDecision: 'allow'` + `permissionDecisionReason` 필드만 제거. 페르소나·컨텍스트 주입은 유지

## 미해결 / 후속

- 권한 건너뛰기 모드에서 권한 묻는 현상이 `permissionDecision` 제거로 해소되는지 검증 미실행 (Claude Code 재시작 + 실제 케이스 발생 시 확인)
- 본래 토픽 목표(5개 mode를 레전드팀 정책으로 재설계)는 미진행 — Master 판단으로 보류
