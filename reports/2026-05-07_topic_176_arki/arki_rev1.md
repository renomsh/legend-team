---
turnId: 4
invocationMode: subagent
session: session_206
topic: topic_176
role: arki
phase: design + execution-plan
executionPlanMode: plan
date: 2026-05-07
---

# Arki — topic_176 / G안 multi-topic namespace 설계 + 실행계획

Arki입니다. Master 확정 7건 + Riki R-D 7 critical을 입력으로, **짓지 않음 옵션도 살아 있는** plan을 박제합니다.

---

## 1. 설계 개요

### 1.1 결정의 본질
- **G안의 비가역성 재정의**: mtopic_001 첫 발급 = D-day. 그 전까지는 모든 게이트가 가역.
- **race 가설은 미증명** (R-D-3): spike scope 보강 후 결과로 G안 채택 자체가 재검증.
- **인라인 enforcement 원칙** (D-143): file-lock·N=1 fallback·grep 분기 모두 hook 본체에 박제. config 의존 0.
- **준-비가역 게이트는 단 하나**: mtopic_counter.json 첫 write. 그 외 Phase는 모두 회수 가능.

### 1.2 분기 결정 (Master 추가 명시 필요 — Phase 2 게이트에서 판정)
세 분기를 평가:

| 분기 | 정의 | 장점 | 단점 |
|---|---|---|---|
| **C-1 (atomic, spike-after)** | spike → 결과 양성 시 lock+counter+grep 동시 박제 | race 증명 후 도입. 단일 PR. | 부분 이득 차단 (R-9 grep은 spike 무관) |
| **C-2 (단계, spike-after)** ★ | spike → 양성 시 단계별 박제(lock → counter+fallback → grep 분기) | 각 게이트 회수 가능. R-D-21 합성 패키지 해체. | 도입 윈도우 길어짐 (R-D-15 노출 ↑) |
| **C-3 (단계, spike-before 부분)** | R-9 grep은 spike 무관 → 선행 박제. lock·counter는 spike-after. | spike 음성도 R-9 잔여 가치. | grep 분기 자체가 mtopic_ 시그너처 가정 → spike 음성 시 dead code |

**권고: C-2** — Riki R-D-21(합성 패키지 가림) 해체 효과가 R-D-15(부분 도입 노출) 비용을 상회. 단, **R-9 grep만큼은 C-3 부분 채택**(Phase 0에서 *조사만* 수행, 분기 코드는 Phase 4에서 박제 — dead code 방지).

> **Master 결정 필요 1건**: C-2 권고 수락? 또는 C-1/C-3로 선회?

### 1.3 짓지 않음 옵션 (Rich Hickey 의무)
- **N=1 영속화**: spike 음성 + R-D-19 미해결 → G안 철회, 직렬 1세션 유지. 비용=병렬 기회 상실. 이득=race 0, lock 코드 0, mtopic 평면 0.
- **본 plan은 N=1을 기본 fallback으로 박제** (Phase 2 게이트 음성 시 자동 진입).

---

## 2. 명세

### 2.1 자료 구조

```
memory/shared/
├── topic_index.json           (기존, ^topic_\d+$ 만)
├── mtopic_counter.json        (신규, Phase 3에서 생성)
│   {"next": 1, "lastIssuedAt": null, "lastIssuedBy": null}
├── mtopic_index.json          (신규, mtopic 전용 평면)
│   { mtopic_001: {...}, ... }
└── parallel_lock.json         (신규, file-lock 메타 — proper-lockfile이 .lock 디렉토리 생성)
```

- `mtopic_index.json` 평면 분리 → topic_index.json 무수정 → 기존 ^topic_\d+ hardcode 100% 안전 (R-9 mitigation 1차).
- D-NNN 단일 귀속: decision_ledger entry는 `topicId | mtopicId` 중 하나만 채움 (FK 분리, R-10 (a)).

### 2.2 lock 보호 영역 (R-4·R-5 mitigation 정밀화)

| 영역 | lock key | 보호 대상 |
|---|---|---|
| TURNS_PUSH | `current_session.turns` | `current_session.json` write |
| FINALIZE | `session.finalize` | finalize 자식 spawn 직전 → 완료까지 |
| MTOPIC_ISSUE | `mtopic.counter` | mtopic_counter.json read+inc+write **원자** |
| TOPIC_INDEX | `topic_index` | topic_index.json write (기존 동작 보호 강화) |

- **R-D-1 mitigation**: mtopic_counter.json 자체가 `MTOPIC_ISSUE` lock 대상. lock 박제 **전** 발급 절대 금지(Phase 3 게이트로 강제).
- stale lock TTL=30초, 강제 청소 스크립트 `scripts/cleanup-stale-locks.ts` (R-D-6 mitigation).

### 2.3 hook 라우팅 분기 (인라인, D-143 정합)

`pre-tool-use-task.js` 컨텍스트 주입 부:
```
const TOPIC_RE  = /^topic_\d+$/;
const MTOPIC_RE = /^mtopic_\d+$/;
const id = ctx.topicId || ctx.mtopicId;
if (MTOPIC_RE.test(id)) loadFrom('mtopic_index.json');
else if (TOPIC_RE.test(id)) loadFrom('topic_index.json');
else throw new Error(`unknown id shape: ${id}`); // fail-loud
```

- config 미참조. enforcement_note 인라인 주석 박제 (R-NEW-2 mitigation).

### 2.4 N=1 fallback (R-D-10 mitigation)
`memory/shared/parallel_mode.json`:
```
{"mode": "N1" | "GA", "lockEvidenceDate": null, "spikeReportPath": null}
```
- 기본값 `N1`. Phase 2 spike 양성 + Master 승인 시에만 `GA` 전환.
- hook은 매 호출 시 mode read → `N1`이면 Task 동시 dispatch 거부 (직렬 강제).

---

## 3. 구조적 실행계획

> Schedule-on-Demand 준수 — 일정·공수·담당 0건. 선후·게이트만.

### 3.1 Phase 분해

| Phase | 입력 | 작업 | 산출 (검증 가능) |
|---|---|---|---|
| **P0 — 조사** | 현 코드 | R-9 grep 전수 조사 (`^topic_\d+`·`topic_\d+` 매칭 위치 목록) | `reports/.../grep_topic_hardcode.json` |
| **P1 — spike scope 박제** | Riki R-D-18 | spike 시나리오 명세 (아래 §3.3) | `spike_scenarios.md` (Master 승인) |
| **P2 — spike 실행** | P1 산출 | Dev가 시나리오 N개 실행, race log 캡처 | `spike_results.json` (양성/음성 + raw evidence) |
| **GATE α — race 판정** | P2 결과 | 양성 → P3 진입. 음성 → N=1 영속화(plan 종료) | Master 승인 박제 |
| **P3 — lock 인프라** | proper-lockfile 도입 | `scripts/lib/parallel-lock.ts` + 4영역 wrapper 박제 | unit test 통과 + stale 청소 스크립트 |
| **P4 — counter+fallback+grep 분기** | P3 + P0 | mtopic_counter, mtopic_index, parallel_mode, hook 분기 박제 | hook smoke test, fail-loud 동작 확인 |
| **GATE β — pre-issue 검증** | P3+P4 | mtopic_001 발급 직전 dry-run (counter inc 없이 lock·grep·fallback 흐름만) | dry-run report Master 승인 |
| **P5 — mtopic_001 발급** | GATE β 통과 | 첫 mtopic 실발급 (D-day, 준-비가역) | mtopic_counter.json `next: 2` |
| **P6 — 운영 모니터** | P5 | lock contention·stale·fail-loud 카운터 1주기 누적 | `reports/.../mtopic_runtime_obs.md` |

### 3.2 의존 그래프

```
P0 ─┐
    ├─→ P1 → P2 → GATE α ─양성→ P3 → P4 → GATE β → P5 → P6
    │                    └─음성→ N=1 영속화 (plan 종료, P3~P6 미실행)
    └─→ (P0 산출은 P4 grep 분기 박제에 사용; spike 음성이어도 조사 자체 가치 잔존)
```

병렬 가능: P0 ∥ P1. 그 외 모두 직렬.

### 3.3 검증 게이트

#### GATE α — race 판정 (R-D-18·R-D-19 보강)
spike scope **시나리오 N=5 의무**:

| ID | 시나리오 | 의도 |
|---|---|---|
| S1 | Task 2개 동시 dispatch, turns push 충돌 | R-4 기본 케이스 |
| S2 | Task 5개 동시 dispatch, finalize 자식 spawn 중첩 | R-5 부하 케이스 |
| S3 | 6 hook chain 중간(session-end-finalize) Task 호출 | R-D-19 chain 간섭 |
| S4 | 의도적 race 유발 — 동일 turn idx로 2개 동시 push | 적대적 케이스 |
| S5 | hook 실행 중 외부 프로세스의 topic_index.json write | 외부 충돌 |

판정: S1~S5 중 **2건 이상 race 관측** 시 양성. 1건 이하 시 음성(N=1 영속). 결과는 `spike_results.json`에 raw + 판정 기록.

#### GATE β — pre-issue dry-run
- counter inc 없이 발급 흐름만 시뮬레이션. lock 획득/해제·grep 분기·fallback 모드 read 모두 정상 동작 확인.
- 실패 시 P5 진입 금지(준-비가역 발급 차단).

### 3.4 롤백 경로

| Phase | 롤백 가능성 | 절차 |
|---|---|---|
| P0 | 완전 가역 | 산출 파일 삭제 |
| P1 | 완전 가역 | 명세 폐기 |
| P2 | 완전 가역 | spike 코드 archive 이동 |
| P3 | 가역 (R-D-6) | parallel-lock.ts 제거 + `.lock` 디렉토리 stale 청소 스크립트 실행 |
| P4 | 가역 (R-D-7) | hook 분기 git revert + mtopic_*.json 미생성 상태 유지 |
| GATE β | 가역 | dry-run 실패 시 P5 미진입 |
| **P5** | **준-비가역** | mtopic_001 발급 후 D-NNN·세션 로그 영구 잔존. 철회 시 `mtopic_001 = abandoned` 명시 박제만 가능 (재사용 금지) |
| P6 | 가역 | 모니터 중단, 데이터 archive |

### 3.5 전제 (깨지면 plan 무효)

1. **D-143 정합** 유지 — 인라인 enforcement, config 의존 없음.
2. **6 hook chain 무수정** — auto-push.js 체인 4단계 + sage-gate + master-first 변경 없음.
3. **proper-lockfile**(또는 동급) Windows·POSIX 양쪽 동작 확인됨.
4. **Anthropic 하네스가 Task 병렬 dispatch 시 동일 `current_session.json`을 공유** — 이 가정 자체가 spike S1~S5의 검증 대상.
5. **D1~D4 Prime Directive** — 모델 자율 판단 의존 0, 코드 박제 100%.

### 3.6 중단 조건

- spike 결과 양성이지만 R-D-19(hook chain 간섭) 시나리오 S3에서 보호 불가 입증 → plan 정지, 재설계.
- P3에서 proper-lockfile이 Windows에서 stale 처리 실패 → lock 라이브러리 교체 후 P3 재진입.
- P4 fail-loud가 기존 토픽 호출에서 false positive → grep 분기 로직 재설계 (mtopic_ 시그너처 강화).
- P5 진입 후 24시간 내 lock contention 임계 초과 → mode `N1`로 강제 회귀(P5는 잔존, 신규 mtopic 발급만 정지).

---

## 4. 자가감사

### 4.1 1차 감사 (4축 × 최소 3지점)

#### structuration
- (1) `mtopic_index.json` 평면 분리는 topic_index.json 무수정 보장 — **OK**
- (2) lock 4영역 분리는 contention 도메인 명확 — **OK**
- (3) parallel_mode.json이 hook·plan·spike 3곳에서 read — 단일 출처 OK, 그러나 mode 전환 책임 주체 미명시 → **MUST_NOW: §2.4에 "Master 명시 승인만" 박제**

#### hardcoding
- (1) TOPIC_RE / MTOPIC_RE 정규식 인라인 — 의도된 인라인(D-143). 단 hook·script 양쪽 중복 위험 → **MUST_BY_N=10: `scripts/lib/topic-id.ts` 단일 정규식 export**
- (2) lock TTL=30초 hardcode — 운영 데이터 없음. spike에서 측정 후 결정 → **SHOULD: P2 spike에서 lock hold time 측정 추가**
- (3) spike 시나리오 N=5는 §3.3 hardcode — 명세 자체가 박제 산출물이므로 의도적 — **OK**

#### efficiency
- (1) lock 4영역이 모두 동일 파일 시스템 lock — 충분, 분산 lock 불필요 — **OK**
- (2) GATE α 판정 임계 "2건 이상" — 임의 선정. 1건이어도 race는 race → **MUST_NOW: §3.3 임계를 "1건 이상 race 관측" 으로 강화**
- (3) P0 grep 조사가 P4까지 stale 가능 → **NICE: P4 진입 직전 재조사 의무화**

#### extensibility
- (1) mtopic 외 신규 namespace 추가 시 (예: rtopic_) hook 분기 if-chain 증가 → **DEFER: 현재 mtopic 단일, 추상화 과투자**
- (2) lock 라이브러리 교체 가능성 → wrapper `parallel-lock.ts` 1단 추상화 충분 — **OK**
- (3) parallel_mode 추가 모드(예: N=2 제한) 확장 → enum string으로 처리 가능 — **OK**

**1차 발견 요약**: MUST_NOW 2건, MUST_BY_N=10 1건, SHOULD 1건, NICE 1건, DEFER 1건.

### 4.2 2차 감사 (압박 가정 — Master "한번 더" 시뮬레이션)

축 전환: **거버넌스 / 검증 회수 / 메타 안전**

#### 거버넌스
- GATE α 판정 주체 미명시 → **MUST_NOW: 판정=Master, 박제=Edi 명시**
- mtopic_001 발급 권한자 미명시 → **MUST_NOW: P5 진입은 Master 승인 필수, hook이 차단**

#### 검증 회수
- spike 결과를 Riki가 cross-review 하지 않으면 거짓 양성/음성 고착 위험 → **MUST_NOW: GATE α 전 Riki 의무 호출**
- dry-run(GATE β)이 P5 직전 1회뿐 — counter inc 누락 검증 부족 → **SHOULD: dry-run 시 lock contention 강제 유발 케이스 1건 포함**

#### 메타 안전 (D1~D4)
- D2 (도구 설명 거짓) — proper-lockfile description만 신뢰하지 않음, P3 unit test가 실제 race 차단 검증해야 → **MUST_NOW: P3 unit test에 의도적 동시 호출 케이스 의무**
- D3 (저장소 오염) — mtopic_counter.json 단일 파일 단언 위험 → **MUST_BY_N=30: counter를 decision_ledger와 cross-check 하는 validator 추가** (Arki full-system view 메모리 준수)
- D4 (모델 자율 판단 무력화) — N=1 fallback 전환이 모델 판단이면 D4 위반. hook이 mode read 후 차단하므로 코드 enforcement OK — **OK**

**2차 발견 요약**: MUST_NOW 4건, MUST_BY_N=30 1건, SHOULD 1건. 실질 결함 5건 (Master 압박 시뮬레이션 가치 입증).

### 4.3 spec 동결
- 1차+2차 합산 MUST_NOW 6건 미반영 상태 → **spc_lck = N**
- 본 rev1은 MUST_NOW 6건을 §2~§3 본문에 반영하지 **않은 채** 박제(감사 가시성 우선). rev2에서 통합 후 동결 가능.

---

## 결론 (Master 확인 필요)

1. **분기 C-2 (단계, spike-after) + R-9 부분 선행(P0 조사만)** 권고 — 수락?
2. GATE α 임계: spike 시나리오 1건 이상 race → 양성. 동의?
3. mtopic_001 발급(P5 진입) = Master 명시 승인 필수. 동의?
4. rev2에서 MUST_NOW 6건 통합 후 spc_lck=Y 박제 진행해도 되는지?

다음 호출자(Riki R-D 후속 또는 Dev spike 명세) 시점에 본 plan + Master 응답 합산 후 rev2 박제.

---

[ROLE:arki]
# self-scores
aud_rcl: 1.0
str_fd: 5
spc_lck: N
sa_rnd: 2

```json
{"aud_rcl": 1.0, "str_fd": 5, "spc_lck": "N", "sa_rnd": 2}
```
