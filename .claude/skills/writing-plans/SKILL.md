---
name: writing-plans
description: Use when Arki has completed a structural design and Dev needs a bite-sized implementation plan before touching any code or files
---

# Writing Plans

## 개요

구현 계획은 실행자(Dev 또는 서브에이전트)가 컨텍스트 없이도 따를 수 있어야 한다.

핵심 원칙: **플레이스홀더 금지. 모든 단계는 실제 내용을 포함한다.**

## 전제 조건

- Arki 설계 문서 존재 (`reports/{topic}/arki_rev{n}.md`)
- 구현 범위 확정 (무엇을 만드는가)

## 플랜 저장 경로

```
docs/plans/YYYY-MM-DD-{feature-name}.md
```

## 파일 구조 먼저

태스크 분해 전에 어떤 파일이 생성·수정되는지 먼저 매핑한다:

- 각 파일의 단일 책임 명확히
- 같이 바뀌는 파일은 같이 위치
- 기존 코드베이스가 있으면 기존 패턴 따르기

## 태스크 단위

**각 단계는 하나의 행동 (5~15분):**
- "파일 생성 후 기본 구조 작성" — 하나의 단계
- "스크립트 실행 후 출력 확인" — 하나의 단계
- 단계가 30분 이상이면 더 작게 분해

## 플랜 문서 헤더

```markdown
# {Feature Name} 구현 플랜

**목표:** [한 문장]

**아키텍처:** [Arki 설계 핵심 2~3문장]

**입력/출력:** [무엇을 받아 무엇을 만드는가]

---
```

## 태스크 구조

````markdown
### Task N: {컴포넌트명}

**파일:**
- 생성: `exact/path/to/file.ts`
- 수정: `exact/path/to/existing.ts`

- [ ] **Step 1: [행동 기술]**

```typescript
// 실제 코드 또는 명령
const result = doSomething(input);
```

- [ ] **Step 2: 실행 및 출력 확인**

실행: `ts-node scripts/something.ts`
기대 출력: `처리 완료: N건`

- [ ] **Step 3: 완료 확인**

확인: 출력 파일 존재 + 내용 검증
````

## 플레이스홀더 금지

절대 쓰지 말아야 할 것:
- "TBD", "TODO", "나중에 구현"
- "적절한 에러 처리 추가"
- "위와 유사하게" (코드를 반복하라 — 실행자가 순서 바꿔서 볼 수 있음)
- 실제 코드 없는 "~를 구현한다" 기술

**규칙:** 코드가 바뀌는 단계엔 실제 코드가 있어야 한다.

## 자가 검토

플랜 완성 후:
1. **범위 커버리지** — Arki 설계 각 항목이 태스크에 대응되는가?
2. **플레이스홀더 스캔** — 위 금지 패턴 없는가?
3. **타입 일관성** — Task 3에서 정의한 함수명이 Task 7에서도 동일한가?

문제 발견 시 인라인으로 수정. 별도 검토 불필요.

## 실행 핸드오프

플랜 저장 후:

```
플랜 완료. docs/plans/{파일명}.md 에 저장.

실행 방식:
1. 인라인 실행 — 이 세션에서 executing-plans 스킬로 직접 실행
2. 서브에이전트 실행 — subagent-driven-development 스킬로 태스크별 위임

어떻게 진행할까요?
```
