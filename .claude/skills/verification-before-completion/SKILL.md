---
name: verification-before-completion
description: Use when about to claim a task is done, fixed, or complete — before any session-end checklist, commit, or "완료" declaration
---

# Verification Before Completion

## 개요

완료 선언 전 실증 증거 없는 주장은 거짓이다.

핵심 원칙: **증거 먼저, 주장은 그 다음.**

## 철칙

```
실증 없이 완료 선언하지 않는다.
```

해당하는 모든 상황:
- "완료했습니다" 선언 전
- 세션 종료 체크리스트 실행 전
- git commit/push 전
- Master에게 결과 보고 전

## 검증 프로세스

1. **실행** — 해당 산출물을 실제로 실행/호출/열어본다
2. **출력 확인** — 기대 결과와 실제 결과를 대조한다
3. **증거 기록** — 확인한 출력을 보고에 포함한다
4. **그 다음 선언** — 증거가 있을 때만 "완료" 선언

## 레전드팀 적용 지점

| 상황 | 검증 내용 |
|---|---|
| Skill 배포 | Claude Code에서 호출 시 정상 작동하는가 |
| 세션 종료 | 체크리스트 각 항목이 실제 파일로 존재하는가 |
| 리포트 작성 | frontmatter 필드가 validate-output.ts 기준 통과하는가 |
| memory 저장 | JSON 파일이 파싱 오류 없이 읽히는가 |
| git push | auto-push.js 실행 후 원격 반영 확인 |

## 흔한 합리화

| 변명 | 현실 |
|---|---|
| "방금 작성했으니 맞을 거야" | 작성 ≠ 작동. 확인하라. |
| "이전에 같은 방식으로 했으니까" | 이번 케이스를 검증하라. |
| "빠르게 진행해야 해서" | 완료 선언 취소가 더 느리다. |
| "명백히 맞는 내용이라서" | 명백함은 검증을 면제하지 않는다. |

## 완료 선언 형식

증거를 포함한 완료 선언:

```
✅ [항목명] 완료
확인: [실행 명령 또는 확인 방법] → [실제 출력 결과]
```

증거 없는 완료 선언은 완료가 아니다.
