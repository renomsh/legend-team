---
name: dispatching-parallel-agents
description: Use when Ace identifies 2+ independent role tasks or investigations that have no shared state or sequential dependency between them
---

# Dispatching Parallel Agents

## 개요

독립적인 태스크는 순차 실행이 낭비다. 격리된 컨텍스트로 병렬 실행하면 속도와 품질이 동시에 오른다.

핵심 원칙: **독립 도메인당 에이전트 하나. 컨텍스트는 직접 구성해서 전달한다.**

## 언제 사용하는가

**사용:**
- 2개 이상의 독립적 조사/태스크가 동시에 필요할 때
- 각 태스크가 서로의 결과 없이도 진행 가능할 때
- 순차 실행이 시간 낭비임이 명확할 때

**사용하지 말 것:**
- 태스크 간 공유 상태가 있을 때 (한 결과가 다른 태스크의 입력)
- 에이전트가 같은 파일을 동시에 수정할 가능성이 있을 때
- 하나의 결과가 다른 것을 무효화할 수 있을 때

## Ace 오케스트레이션 연동 (D-019)

Ace가 역할 호출 설계 시 병렬 디스패치 판단 기준:

```
독립성 확인:
  태스크 A의 완료가 태스크 B의 시작을 기다려야 하는가?
  → YES: 순차
  → NO: 병렬 후보

공유 상태 확인:
  두 태스크가 같은 파일/메모리/결정에 쓰기(write)하는가?
  → YES: 순차 또는 분리 후 머지
  → NO: 병렬 실행
```

## 실행 패턴

### 1. 독립 도메인 식별

태스크를 도메인별로 그룹화:
- 도메인 A: [무엇을 조사/수행하는가]
- 도메인 B: [무엇을 조사/수행하는가]

A와 B가 서로의 결과에 무관하면 병렬 가능.

### 2. 격리된 컨텍스트 구성

각 에이전트는 **이 세션의 히스토리를 상속받지 않는다.**
에이전트에게 필요한 것만 직접 구성해서 전달한다:

```
에이전트 지시 구조:
- 목표: [단일 명확한 목표]
- 컨텍스트: [필요한 파일, 결정, 배경만]
- 출력 형식: [어떤 형태로 결과를 돌려보낼 것인가]
- 범위 경계: [하지 말아야 할 것]
```

### 3. 결과 수집 및 머지

모든 에이전트 완료 후 Ace가:
- 각 결과를 독립적으로 검토
- 충돌 여부 확인
- 통합 판단 후 Master에게 보고

## 레전드팀 적용 예시

| 상황 | 병렬 구성 |
|---|---|
| Arki 구조분석 + Fin 비용평가 | 독립 → 동시 디스패치 가능 |
| 복수 파일 수복 작업 | 파일 간 의존 없으면 병렬 |
| 복수 role memory 업데이트 | 서로 다른 파일 → 병렬 가능 |
| Ace 종합 후 Editor 작성 | Ace 결과가 Editor 입력 → 순차 |

## 주의

에이전트는 서로의 컨텍스트를 모른다. 머지 책임은 전적으로 Ace에게 있다.
병렬 실행 중 한 에이전트가 실패해도 다른 에이전트는 계속 진행한다 — Ace가 결과 수집 시 실패 감지 후 재디스패치.

---

## Nexus Turn Push 프로토콜 (D-169 / Arki rev4 §4, session_209 P4)

`turnPushMode = "nexus"` 일 때 Nexus(Main Claude)가 직접 `current_session.json.turns[]`를 push한다.  
hook의 ③ turns[] 직접 write는 skip — hook은 `pending_turns_{sessionId}.jsonl`에만 append(`__hook_origin` sentinel 포함).

### Nexus push 흐름

```
parallel dispatch (N개 Agent 툴 동시 호출)
  ↓ (모든 결과 수신 후)
for each toolResult in results:
  1. agentId = toolResult.agentId
  2. pending_turns 파일에서 agentId 매칭 entry 조회
     └─ entry 있음: selfScores = entry.selfScores, __hook_origin 검증
     └─ entry 없음: selfScores = extractSelfScores(toolResult.content)  [옵션 B fallback]
  3. sort_key 계산: dispatch_order (dispatch 호출 순서 인덱스)
  4. turns[] push: { role, turnIdx, source:"agent", selfScores?, sort_key }
  5. writeJson(current_session.json)  ← 단일 스레드 순차 write
```

### sort_key 정책

- `parallel_turn_sort_key = "dispatch_order"` (dispatch_config.json 박제 — P7 확정, 현재 default)
- dispatch_order: Nexus가 Agent 툴을 호출한 순서 인덱스 (0-based)
- turn_log.jsonl append도 Nexus가 turnIdx 부여 후 직접 처리

### __hook_origin 검증

Nexus join 시 `entry.__hook_origin !== "post-tool-use-task"` → skip + `gaps[]` 박제 (D1 sentinel, Arki rev4 §5.3).

### Nexus push 헬퍼

```typescript
import { pushTurnsFromPending } from 'scripts/lib/nexus-turn-push';

// N개 병렬 dispatch 완료 후:
const dispatches = [
  { role: 'arki', dispatchOrder: 0, toolResult: arkiResult },
  { role: 'jobs', dispatchOrder: 1, toolResult: jobsResult },
];
await pushTurnsFromPending(dispatches, sessionPath?, cwd?);
```

### 단일 스레드 보장

Nexus는 단일 스레드 — `pushTurnsFromPending`은 순차 push (race 없음).  
hook 병렬 write race(SPIKE-R6 양성)는 nexus 모드에서 구조적으로 제거됨.

---

## Nexus 발언자 분배 인터페이스 (D-169 P9 / Arki rev4 §2.1 잔여)

### phase_enum SOT

`dispatch_config.json.phase_enum.values` = `["framing", "blind-parallel", "open", "debate", "synthesis"]`

phase에 따른 Nexus dispatch 분기:

| phase | 발언자 분배 방식 | pre-tool-use-task 동작 |
|---|---|---|
| `framing` | Jobs 단독 or Jobs+Nexus 질의 | role_domain_template 주입 (blind 아님) |
| `blind-parallel` | N개 역할 동시 dispatch (Agent 툴 병렬 호출) | **prepend 차단** (격리 실행) |
| `open` | 순차/자유 발언, 기존 발언 공개 | 정상 prepend |
| `debate` | N round, Nexus 자율 분배 | 정상 prepend (debate 맥락 포함) |
| `synthesis` | Edi 단일 호출 | 정상 prepend |

### debate phase 진입 패턴

```typescript
// current_session.json에 debate_state 초기화 (Nexus 직접)
sess.debate_state = {
  round_idx: 0,
  last_progress_ts: new Date().toISOString(),
  divergence_signal: null,
  positions: {},
  convergence_summary: null,
};
// 라운드마다 debate_state.round_idx++ 업데이트
// end_policy: "nexus_judge_then_master_query"
//   → Nexus가 수렴 판단 후 convergence_summary 박제 → Master에 질의 (continue/종료)
```

### blind-parallel dispatch 패턴

```typescript
// 1. phase 설정
sess.phase = 'blind-parallel';
sess.operationMode = 'blind-parallel';

// 2. 병렬 dispatch (동시 호출)
const [arkiResult, rikiResult, finResult] = await Promise.all([
  agent({ role: 'arki', dispatchOrder: 0, ... }),
  agent({ role: 'riki', dispatchOrder: 1, ... }),
  agent({ role: 'fin',  dispatchOrder: 2, ... }),
]);

// 3. turns[] push (pushTurnsFromPending)
await pushTurnsFromPending(dispatches, sessionPath);

// 4. phase 전환 (공개)
sess.phase = 'open';
```

### debate_state 스키마

`dispatch_config.json.debate_state_schema.fields` 참조.

- `round_idx`: 현재 라운드 (0-based). Nexus가 dispatch 전 +1.
- `last_progress_ts`: 가장 최근 진전 시각. Nexus가 수렴 판단 기준으로 사용.
- `divergence_signal`: 발산 감지 시 true → `end_policy` 즉시 실행.
- `convergence_summary`: Nexus 수렴 판정 요약 → Master 질의 본문.
