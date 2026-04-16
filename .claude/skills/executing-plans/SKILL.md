---
name: executing-plans
description: Use when you have a written implementation plan (from writing-plans skill) and are ready to execute it task by task in the current session
---

# Executing Plans

## 개요

플랜을 로드하고, 비판적으로 검토하고, 태스크를 순서대로 실행한다.

핵심 원칙: **플랜을 정확히 따른다. 막히면 즉시 중단하고 도움을 요청한다.**

## 프로세스

### Step 1: 플랜 로드 및 검토
1. 플랜 파일 읽기
2. 비판적 검토 — 질문이나 우려 사항 있는가?
3. 우려 있으면 → 시작 전 Master에게 확인
4. 없으면 → 실행 시작

### Step 2: 태스크 실행

각 태스크마다:
1. `in_progress` 표시
2. 각 단계를 플랜 그대로 따르기
3. 각 단계의 검증 명령 실행
4. `completed` 표시

### Step 3: 완료

모든 태스크 완료 후:
- verification-before-completion 스킬 기준으로 완료 선언
- 실제 출력 증거 포함

## 중단 조건 (즉시 중단)

- 의존성 누락, 테스트 실패, 지시 불명확
- 플랜에 치명적 공백
- 검증이 반복 실패
- 3번 이상 수정 시도해도 해결 안 됨 → systematic-debugging 스킬 전환

**막혔을 때는 추정하지 말고 중단 후 보고.**

## 주의

- main 브랜치에서 구현 시작 전 Master 명시적 동의 필요
- 플랜 단계를 임의로 건너뛰지 않는다
- 검증 실패를 "나중에 확인"으로 넘기지 않는다

## 연관 스킬

- `writing-plans` — 이 스킬이 실행할 플랜을 생성
- `systematic-debugging` — 막혔을 때 전환
- `verification-before-completion` — 완료 선언 전 증거 확보
- `subagent-driven-development` — 태스크별 서브에이전트 위임 방식
