---
name: writing-skills
description: Use when creating a new skill, editing an existing skill, or verifying a skill works before deploying it to .claude/skills/
---

# Writing Skills

## 개요

**스킬 제작은 TDD(테스트 주도 개발)를 프로세스 문서에 적용한 것이다.**

핵심 원칙: 스킬 없이 에이전트가 실패하는 것을 먼저 확인하지 않으면, 그 스킬이 옳은 것을 가르치는지 알 수 없다.

스킬 위치: `.claude/skills/<skill-name>/SKILL.md`

## 스킬이란?

- **스킬은**: 재사용 가능한 기법, 패턴, 프로세스, 참조 가이드
- **스킬이 아닌 것**: 한 번 문제를 해결한 경험 기록, 프로젝트 고유 규칙(CLAUDE.md에)

## 언제 만드는가

**만들어야 할 때:**
- 직관적으로 명확하지 않은 기법
- 여러 토픽에 걸쳐 반복 참조될 패턴
- 레전드팀 전체에 적용 가능한 프로세스

**만들지 말아야 할 때:**
- 일회성 해결책
- CLAUDE.md에 이미 있는 규칙
- 자동화로 강제 가능한 것 (문서가 아닌 스크립트로)

## RED-GREEN-REFACTOR 사이클

| TDD 개념 | 스킬 제작 |
|---|---|
| 테스트 케이스 | 스킬 없이 실행하는 압력 시나리오 |
| 코드 | SKILL.md 문서 |
| RED (실패) | 스킬 없이 에이전트가 규칙을 어기는 것 확인 |
| GREEN (통과) | 스킬 있을 때 에이전트가 준수하는 것 확인 |
| REFACTOR | 새 합리화 발견 → 명시적 반박 추가 → 재검증 |

**철칙: 실패 케이스를 먼저 확인하지 않으면 스킬을 작성하지 않는다.**

## SKILL.md 구조

**Frontmatter:**
- `name`: 영문 소문자, 숫자, 하이픈만 사용
- `description`: "Use when..."으로 시작. 트리거 조건만 기술. 워크플로우 요약 금지. 최대 500자.

```markdown
---
name: skill-name
description: Use when [구체적 트리거 조건과 증상]
---

# Skill Name

## 개요
핵심 원칙 1~2문장.

## 언제 사용하는가
증상 목록 / 사용하지 말아야 할 때

## 핵심 패턴
Before/After 비교 또는 단계별 프로세스

## 빠른 참조
테이블 또는 불릿

## 흔한 실수
무엇이 잘못되는가 + 수정 방법
```

## Description 작성 원칙 (CSO)

**description은 "언제 사용하는가"만 기술한다. 워크플로우 요약 금지.**

이유: 워크플로우를 description에 요약하면 Claude가 SKILL.md 본문을 읽지 않고 description만 따른다. 스킬 본문이 무용화된다.

```yaml
# ❌ 나쁜 예: 워크플로우 요약
description: Use when creating skills - run baseline, write SKILL.md, test, refactor

# ✅ 좋은 예: 트리거 조건만
description: Use when creating a new skill or editing an existing skill before deploying
```

## 검증 게이트

각 스킬 배포 전 필수 확인:

**RED 단계:**
- [ ] 스킬 없이 시나리오 실행 → 실패 패턴 문서화
- [ ] 에이전트가 사용하는 합리화 문구 기록

**GREEN 단계:**
- [ ] SKILL.md 작성 (실패 패턴 직접 반박)
- [ ] 스킬 있을 때 시나리오 재실행 → 준수 확인

**REFACTOR 단계:**
- [ ] 새 합리화 발견 시 명시적 반박 추가
- [ ] 합리화 테이블 구축
- [ ] 재검증 통과 확인

**배포:**
- [ ] `.claude/skills/` 경로에 저장
- [ ] Claude Code 재시작 또는 세션 신규 시작으로 인식 확인

## 철칙

```
실패 케이스 확인 없이 스킬을 배포하지 않는다.
```

예외 없음:
- "단순한 추가라서" → 검증
- "명백히 맞는 내용이라서" → 검증
- "지금은 시간이 없어서" → 배포도 없음

## 흔한 합리화 테이블

| 변명 | 현실 |
|---|---|
| "명백히 맞는 스킬이야" | 당신에게 명백한 것 ≠ 에이전트에게 명백한 것. 검증하라. |
| "레퍼런스 문서라 테스트 불필요" | 레퍼런스도 공백과 불명확한 구간이 있다. |
| "나중에 문제 생기면 수정" | 문제 = 에이전트가 스킬을 쓸 수 없음. 배포 전 검증. |
| "배치로 여러 개 만들면 효율적" | 검증 없는 스킬 더미는 부채다. 하나씩 완성 후 배포. |
