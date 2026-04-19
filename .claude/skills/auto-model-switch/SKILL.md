---
name: auto-model-switch
description: Use when /open completes grade determination and grade is A, B, or S — recommend switching to Opus 4.7 via /model command. Skip if already on Opus 4.7. Skip for grade C only.
---

# Auto Model Switch

## 개요

기본 모델은 Sonnet. Grade S/A/B 토픽 오픈 시 Opus 4.7(`/model claude-opus-4-7`) 전환을 안내한다. 이미 Opus 4.7 이상이면 안내 생략. 세션당 1회, `/open` grade 판정 직후에만 실행.

## 언제 사용하는가

**사용 조건:**
- `/open` 명령 처리 완료 → grade = **S, A, 또는 B** 판정
- 현재 모델이 Sonnet인 경우만 (Opus 4.7 / Opus 4.7 1M 등 이미 Opus 계열이면 생략)
- 세션 최초 오픈 시 1회만

**사용하지 않는 조건:**
- Grade C → Sonnet 유지, 안내 없음
- 이미 `claude-opus-4-7` 또는 그 변형(1M 컨텍스트 등) 상태 → 안내 없음, 유지
- 세션 중간 토픽 전환 시 → 재안내 없음
- Ace grade 재조정(D-040) 후 → 재안내 없음 (초기 판정 기준 1회)

## 핵심 패턴

### opusplan 패턴

Grade S/A/B 판정 직후 세션 오픈 보고 말미에 아래 블록 추가:

```
> **[auto-model-switch]** Grade {S|A|B} 토픽입니다.
> 현재 Sonnet 상태라면: `/model claude-opus-4-7` 입력 후 세션을 계속하세요.
> 이미 Opus 4.7 계열이면 그대로 유지하세요.
```

**이미 Opus 계열인 경우:**
→ 안내 블록 출력 없음. 현재 모델 유지.

**사용자가 Sonnet 유지 선택 시:**
→ `modelSwitchFailed: true` 를 `current_session.json` notes에 기록 후 Sonnet으로 계속 진행.

### Before / After 비교

| 상태 | 동작 |
|---|---|
| 스킬 없음 + Grade A | 세션 오픈 보고만. 모델 전환 안내 없음. |
| 스킬 있음 + Grade S/A/B + Sonnet | 세션 오픈 보고 말미에 Opus 4.7 전환 안내 블록 추가. |
| 스킬 있음 + Grade S/A/B + 이미 Opus 4.7 | 안내 없음. 현재 모델 유지. |
| 스킬 있음 + Grade C | 안내 없음. Sonnet 유지. |

## 빠른 참조

| Grade | 안내 출력 | 커맨드 |
|---|---|---|
| S | ✅ (Sonnet일 때만) | `/model claude-opus-4-7` |
| A | ✅ (Sonnet일 때만) | `/model claude-opus-4-7` |
| B | ✅ (Sonnet일 때만) | `/model claude-opus-4-7` |
| C | ❌ | — |
| 이미 Opus 4.7 | ❌ (생략) | — |

## 흔한 실수

| 실수 | 수정 |
|---|---|
| `/fast` 커맨드 안내 | `/fast`는 Opus 4.6 빠른 출력 모드. 이 스킬 의도와 다름. `/model claude-opus-4-7` 사용. |
| 이미 Opus 4.7인데 안내 출력 | 현재 모델 확인 후 Opus 계열이면 생략. |
| Grade C에서 안내 출력 | 발동 조건 미충족. 출력 없음. |
| `/model` 명령어를 Claude가 직접 실행 시도 | 불가. 사용자에게 입력 안내만 가능. |
| 안내 블록을 세션 보고 앞에 배치 | 세션 오픈 보고 **말미**에 위치. |
