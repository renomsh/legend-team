---
name: subagent-driven-development
description: Use when executing an implementation plan with independent tasks that benefit from isolated context per task — Dev dispatches a fresh subagent per task rather than accumulating context
---

# Subagent-Driven Development

## 개요

태스크별로 격리된 서브에이전트를 디스패치한다. 컨텍스트 오염 없이 빠르게 반복한다.

핵심 원칙: **태스크당 서브에이전트 하나. 컨텍스트는 Dev가 직접 구성해서 전달한다.**

## 언제 사용하는가

**사용:**
- 구현 플랜의 태스크들이 서로 독립적일 때
- 컨텍스트 누적으로 품질이 떨어질 것이 예상될 때
- 같은 세션에서 연속 실행할 때

**사용하지 말 것:**
- 태스크가 이전 결과에 의존할 때 (순차 실행)
- 플랜이 없을 때 (writing-plans 먼저)

## 프로세스

### 1. 플랜 로드 및 태스크 추출
플랜 파일을 읽고 모든 태스크를 전문(full text)으로 추출한다.
서브에이전트가 파일을 직접 읽게 하지 않는다 — Dev가 컨텍스트를 구성해서 전달한다.

### 2. 태스크당 서브에이전트 디스패치

각 태스크에 대해:

```
에이전트 지시 구조:
- 목표: [단일 태스크 전문]
- 컨텍스트: [필요한 파일 경로, 관련 결정, 기존 코드]
- 출력 형식: [완료 선언 + 실행 증거]
- 범위 경계: [이 태스크만. 다른 파일 수정 금지]
```

### 3. 결과 검토 및 다음 태스크

서브에이전트 완료 후:
- 실제 출력 증거 확인
- 다음 태스크 디스패치 또는 에러 처리

에이전트 상태별 처리:
- **완료** → 다음 태스크
- **완료(우려 있음)** → 우려 내용 확인 후 판단
- **컨텍스트 필요** → 추가 정보 제공 후 재디스패치
- **차단됨** → systematic-debugging 스킬로 전환 또는 Master에게 에스컬레이션

### 4. 전체 완료

모든 태스크 완료 후:
- verification-before-completion 스킬로 전체 검증
- 결과 보고

## 레전드팀 적용 예시

| 상황 | 구성 |
|---|---|
| 데이터 파이프라인 5단계 | 각 단계 독립 → 태스크별 서브에이전트 |
| 복수 memory 파일 업데이트 | 파일 간 의존 없음 → 병렬 가능 |
| DB 매핑 배치 처리 | 배치 단위 독립 → 서브에이전트 |
| Arki 설계 → Dev 구현 | 순차 (설계 완료 후 구현) |

## 주의

- 서브에이전트에게 이 세션 히스토리를 상속시키지 않는다
- 병렬 서브에이전트가 같은 파일에 쓰는 경우 순차로 전환
- 머지 책임은 Dev에게 있다

## 연관 스킬

- `writing-plans` — 이 스킬이 실행할 플랜을 생성
- `executing-plans` — 서브에이전트 없이 인라인 실행
- `systematic-debugging` — 서브에이전트 차단 시 전환
- `dispatching-parallel-agents` — 독립 도메인 병렬 실행 기준
