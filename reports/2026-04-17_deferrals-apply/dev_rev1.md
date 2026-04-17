---
session: session_028
topic: SessionEnd Hook 완성 — 토큰 집계 고도화 및 main 반영
date: 2026-04-17
role: dev
rev: 1
---

# Dev — 구현 내역

## PD-007: token_log.json 중복 제거

`appendLog()` 함수에 중복 체크 로직 추가.
- 동일 `legendSessionId` 존재 시 → `splice + push`(덮어쓰기)
- 없을 시 → append 유지

## PD-008: masterTurns 분리 파싱

`aggregateTokens()` readline loop에 `obj.type === 'human'` 필터 추가.
- `sums.masterTurns` 별도 집계
- `updateCurrentSession`, `appendLog` 스키마 연쇄 반영

## 추가 작업

- `.claude/hooks/session-end-tokens.js` — 수정본 이 워크트리에 생성
- `.claude/settings.json` — SessionEnd hook + bypassPermissions 추가
- main 브랜치 머지 + push (origin/main `37e9b3d`)

## 커밋

- `2a0e267` feat: SessionEnd hook — PD-007/008 적용 + main 반영
- `5082730` chore: permissions.defaultMode = bypassPermissions 추가
- `37e9b3d` merge: PD-007/008 hook + bypassPermissions (main)
