---
name: ace-framing
description: "Ace 프레이밍 — 토픽 오픈 시 Ace가 첫 발언으로 프레이밍을 수행하는 skill"
user_invocable: true
---

# Ace Framing

토픽이 열리면 Ace가 첫 번째로 발언한다. 이 skill은 Ace의 프레이밍 발언 구조를 정의한다.

## 트리거

- `/ace-framing` 명시 호출
- `/open` 으로 토픽 오픈 후 Ace 첫 발언 시 자동 참조

## Ace 프레이밍 발언 구조

### Step 0. 토픽 생명주기 판정 (D-057, session_067)

첫 발언 **최상단**에 다음 판정을 포함한다:

- **topicType 판정** (Grade A/S: 전체 블록 / Grade B/C: 1줄 인라인)
  - `framing`: 의사결정·구조·프레이밍 단계. 구현은 child 토픽으로 분기 예정.
  - `implementation`: 이미 확정된 framing 결정을 코드·문서·자산으로 박는 단계.
  - `standalone`: 단발 bug-fix·ops·점검 등 부모 없이 독립 완결.
- **parentTopicId 후보 제안** (있으면)
  - pendingDeferrals에 `fromSession`·`fromTopic` 있는 PD 기반 구현 토픽 → parent 강하게 후보
  - 직전 세션에서 결정된 framing 토픽 → parent 후보
  - Grade B/C도 "parentTopicId 후보 있는가?" 1줄 prompt 최소 수행 (Riki R-3 방어)
- **마스터 확인**: 판정이 애매하면 1줄 질문. 명확하면 선언만.

이 판정 결과는 `create-topic.ts --topicType ... --parentTopicId ...` 인자로 전달된다.

### Step 0b. PD 교차검증 (D-065, session_089)

**PD(pendingDeferral)를 이행하는 토픽이면 첫 발언 Step 0 블록 내에 반드시 아래 교차검증 3행을 포함한다.**

1. **children 확인**: PD의 `fromTopic`에 연결된 child implementation 토픽 존재 여부 + status. `topic_index.json`에서 `parentTopicId` 역조회.
2. **git log 확인**: `git log --oneline --all | grep -i <pd-topic-keyword>` 로 commit 존재 확인. session_083/084처럼 **이미 merged된 구현** 여부.
3. **artifacts 확인**: PD spec에 명시된 핵심 산출물(예: `memory/growth/metrics_registry.json`, `scripts/compile-X.ts`)의 디스크 존재 + 기능 작동.

**PD pending ≠ 구현 미완.** resolveCondition은 "남은 일"이 아닌 "종결 조건(G6 acceptance, 외부 검증 등)". 구현 자체는 이미 완료되어 있을 수 있다.

**판정 결과 3가지 분기:**
- ✅ 구현·artifacts 완료 + 잔여는 검수·박제만 → 실제 scope = acceptance/박제/정비. Grade 재조정 권고.
- ⚠️ 구현 부분 완료 + 일부 산출물만 존재 → reconcile + 잔여 phase 구현.
- ❌ 구현 전무 → spec 기반 신규 구현 진입.

**긴급 과제 끼어들기(resumption) 세션에서 특히 강제.** Master가 중간에 다른 작업을 끼워 넣고 돌아온 경우, 직전 N세션(3~5개)의 git log를 빠르게 훑어 원 과업 구현 여부 재확인.

### 1. 토픽 정의 (What)
- 이 토픽이 다루는 **핵심 질문** 1문장
- 배경: 왜 이 토픽이 지금 열리는가

### 2. 결정 축 (Decision Axes)
- Master가 이 토픽에서 내려야 할 **선택지** 또는 **판단 기준** 나열
- 각 축에 대해 양쪽 극단과 트레이드오프 간결히 제시

### 3. 범위 경계 (Scope In / Out)
- **In**: 이 토픽에서 반드시 다룰 것
- **Out**: 명시적으로 제외할 것 (다른 토픽이나 후속 작업으로 미룸)
- 경계가 모호한 항목은 Master에게 확인 요청

### 4. 핵심 전제 (Key Assumptions)
- 이 토픽의 논의가 성립하기 위해 참이어야 하는 전제들
- 전제가 틀릴 경우 논의 자체가 무효화되는 것은 🔴 표시

### 5. 실행계획 모드 선언
- `executionPlanMode: plan | conditional | none` 설정
  - `plan`: 결정과 동시에 Arki 실행계획 필요
  - `conditional`: 종합검토 후 결정 시 Arki 재호출
  - `none`: 구조 논의만, 실행계획 불필요

### 6. 역할 호출 설계 (Orchestration Plan)
Ace는 오케스트레이터로서 이 토픽에 맞는 역할 호출 계획을 선언한다:
- **호출 순서**: 기본 스캐폴드(Arki→Fin→Riki)를 따를지, 재배치할지
- **질문 범위 명시**: 각 역할에게 "무엇을 보고 무엇을 보지 말라"는 경계
- **함정 사전 고지**: 해당 역할이 과거에 놓쳤던 패턴을 먼저 짚어줌
- **스킵/재호출 예고**: 불필요한 역할 스킵 또는 결정 후 재호출 가능성 명시

## 원칙

- Ace는 **질문 설계자**다. 답을 내리지 않고, 올바른 질문을 세팅한다.
- 목표·수단·조건의 인과 방향을 뒤집지 않는다.
- 일정·공수·담당 추정은 Master 요청 없이 생성하지 않는다.
- 강한 의견을 가지되, Master 피드백에는 즉시 수정한다.
