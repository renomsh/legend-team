---
turnId: 1
invocationMode: subagent
role: arki
topic: topic_199
session: session_236
date: 2026-05-11
---

# Arki (turn 1) — PD-081 구조 설계

## 결론 (TL;DR)

**추천 옵션: B'** — `.claude/` 박힘을 **mainRoot sync commit 단독**으로 단일화. 워크트리 commit의 stage 경로 리스트에서 `.claude/` 만 제거. 변경 지점은 `auto-push.js` 한 줄(L249 paths 배열). 충돌 윈도우가 **논리적으로 닫힘**(같은 파일이 양쪽 commit에 동시 박힐 수 없음). 시간 단축 효과는 무관(commit 횟수·push 횟수 변동 없음). 변수 최소·risk 최소.

**잔존 🔴 전제 판정: ⚪ 해소** — `.claude/`가 워크트리 commit과 mainRoot sync commit 양쪽에 박히는 것이 분기→ff 실패→`--no-ff` 3-way merge에서 충돌이 발생할 수 있는 **유일한 구조적 뿌리**임을 코드 재검증으로 확인.

---

## 1. 현재 플로우 정밀 재검증

`scripts/auto-push.js` 직접 읽음. Nexus 5단계 요약과 실제 코드 매핑.

| Nexus 단계 | 실제 코드 (auto-push.js) | 사실성 |
|---|---|---|
| ① 훅 체인 | L184~222 `runHookChain` — tokens·finalize·self-scores·signature·dashboard·prime-directive·build | ⚪ 사실 |
| ② 워크트리 commit (모든 경로 포함, push 안 함) | L249 `paths = ['memory/','reports/','app/','scripts/','CLAUDE.md','logs/','dist/','.claude/']` → L250~254 `git add` 루프 → L257 `git commit` | ⚪ 사실 |
| ③ mainRoot로 `.claude/` 복사 + 별도 commit | L277 `syncClaudeDir(mainRoot)` (worktrees/, scratch/ 제외) → L279~284 `git add .claude/` + `git commit "sync: .claude from worktree {branch}"` (변경분 없으면 catch로 silent fail) | ⚪ 사실 |
| ④ mainRoot에서 merge | L293 `--ff-only` 시도 → 실패 시 L301 `--no-ff -m "merge: {branch}"` | ⚪ 사실 |
| ⑤ push 1회 | L319 `git push origin main` (worktree 경로) / L329 (main 직접 경로) | ⚪ 사실 |

**Nexus 요약은 정확.** "중간 push"는 없음. push는 1회뿐.

### 분기·충돌의 구조적 원인 정밀 적출

`--no-ff` 3-way merge에서 충돌이 발생하려면 **양쪽 branch가 동일 경로 동일 라인에서 갈라진 base 기준으로 서로 다른 수정**이 있어야 한다. 본 플로우에서 그 조건이 성립하는 경로는 다음과 같이 분석된다.

**워크트리 commit에 포함되는 경로 (L249):**
- `memory/`, `reports/`, `app/`, `scripts/`, `CLAUDE.md`, `logs/`, `dist/`, **`.claude/`**

**mainRoot sync commit에 포함되는 경로 (L280):**
- **`.claude/`** 단독 (단, `worktrees/`·`scratch/` 제외 — L94)

**겹치는 경로: `.claude/` 단 하나.** 그리고 mainRoot sync commit의 base는 mainRoot의 main HEAD(워크트리 branch와 이미 분기됨)이고, 워크트리 commit의 base는 워크트리 branch HEAD(과거 main HEAD에서 출발). 두 commit이 모두 `.claude/{같은파일}`을 다른 내용으로 수정하면 3-way merge에서 충돌.

> 워크트리 branch가 main에서 갈라진 이후 main에 별도 진척이 있었다면 `--ff-only` 자체가 불가능 → 항상 `--no-ff` 진입. session_233 PD-079 병행 worktree 시기에 빈도 증가했을 가능성. 단, **단일 worktree 운영에서도** mainRoot sync commit이 만들어지는 순간 main이 워크트리 branch와 갈라지므로 ff-only는 거의 항상 실패한다 (`.claude/` 변경이 매 세션 발생한다는 Master 확정 전제 ⚪ 하에서).

**즉, 분기는 sync commit이 만들어지는 순간 100% 발생하고, 충돌은 `.claude/` 이중 박힘 + 양쪽 변경이 다를 때 발생.** sync 직전 워크트리 commit이 mainRoot 입장에서 보면 미반영 상태이고, 그 다음 sync commit이 mainRoot에서 동일 경로를 새 base로 또 박는 구조. 같은 worktree 안에서 `.claude/` 파일이 양쪽 commit에 다른 SHA로 들어갈 경로가 있다(예: hook이 mainRoot에 직접 쓰는 `logs/hook-diagnostics.log`는 이미 별도 처리되어 있지만 — L149~163 — `.claude/` 하위에 main과 worktree 모두에서 쓰여지는 파일이 존재하면 같은 패턴이 재현됨).

**다른 분기 원인 탐색:**
- `syncHookDiagnosticsFromMain` (L149) — main → worktree 단방향 복사, 워크트리 commit 단계에 포함. mainRoot commit과 무관. ✗ 분기 원인 아님.
- 훅 체인 부산물(dashboard 산출 등) — 워크트리 내에서만 쓰여지고 워크트리 commit에 박힘. ✗ 분기 원인 아님.
- `memory/shared/system_state.json` worktreeMergeFailures 기록 — mainRoot에서 직접 수정(L124) 가능하나 sync commit 이후·merge 실패 후에만 일어남. 본 충돌 사이클의 원인 아닌 결과. ✗ 분기 원인 아님.

**판정: `.claude/` 이중 박힘이 분기·충돌의 유일한 구조적 뿌리. 잔존 🔴 → ⚪ 해소.**

---

## 2. 옵션 트리

Jobs 결정 주축(`.claude/` 박힘 위치 단일화)에 따라 옵션을 매핑한다.

### 옵션 A — 워크트리 commit 단독 (mainRoot sync commit 폐지)

- **구조 변경**: `auto-push.js` L277 `syncClaudeDir` 호출 유지(파일 복사는 필요), L279~284 `git add .claude/ + commit` 블록 삭제. mainRoot에서 commit이 만들어지지 않으므로 ff-only 가능.
- **의존 영향**: mainRoot의 main HEAD는 워크트리 branch와 항상 같은 줄 위에 있게 됨(워크트리 commit 1회만이 새 base). `.claude/` 실 파일은 sync copy로 mainRoot에 반영되지만 commit으로 박히는 위치는 워크트리 branch 단독. main 입장에서는 `git merge --ff-only`로 워크트리 branch SHA를 그대로 가져감.
- **시간 단축 보존**: ⚪ 보존 (commit·push 횟수 변동 없음, sync 파일 복사 비용만 잔존)
- **충돌 윈도우**: ⚪ 닫힘 (mainRoot에 별도 commit 없음 → 분기 자체가 발생하지 않음)
- **전제 조건**: 워크트리 branch에 `.claude/` 변경분이 올바르게 staged. 현재 코드 L250 루프가 이미 그렇게 함.
- **중단 조건**: 워크트리 branch가 main과 무관한 비표준 base에서 출발한 경우 ff-only 실패 → 기존 `--no-ff` 폴백 경로 그대로 작동.
- **risk**: mainRoot 디스크상 `.claude/` 사본과 commit된 worktree 버전이 일치하지 않을 수 있음(작업 트리 차이). 단, 본 시스템에서 mainRoot의 `.claude/`는 다른 워크트리·다른 클라이언트가 참조하지 않으므로 실해 없음. **mitigation**: sync copy는 그대로 유지하여 mainRoot 작업 트리 파일 시스템 상태는 최신으로 보존. **fallback**: 만약 mainRoot의 working tree에 `.claude/` 미커밋 변경이 잔존하여 merge 시 working tree dirty 에러가 나면 → merge 직전 `git checkout -- .claude/` 한 줄 추가로 해소(현재 코드에서는 sync copy가 이 dirty를 만든다).
- **risk 2 (🟡)**: sync copy 후 commit 안 함 → mainRoot working tree에 untracked/dirty `.claude/`가 영구 잔존. 다음 세션 push에서 `git status`에 노이즈. **mitigation**: sync 직후 `git checkout -- .claude/`로 worktree branch에 박힌 버전으로 reset(merge가 그 버전을 가져오므로 동일). 또는 sync copy 자체를 제거(워크트리 commit이 merge로 mainRoot에 들어가면 어차피 파일도 같이 들어옴).

### 옵션 B — mainRoot sync commit 단독 (워크트리 commit에서 `.claude/` 제외) ← **추천**

- **구조 변경**: `auto-push.js` L249 `paths` 배열에서 `.claude/`만 제거. L277~285 sync 블록은 그대로 유지. 워크트리 branch에는 `.claude/`가 박히지 않고 mainRoot main branch에만 sync commit으로 박힘.
- **의존 영향**: 워크트리 branch에 `.claude/` 변경 흔적이 사라짐 → 워크트리 git log 조회 시 `.claude/` 이력 부재. 단, 본 프로젝트에서 `.claude/` history는 main에서만 추적해도 충분(슬래시 커맨드·hook은 main 기준으로 운영).
- **시간 단축 보존**: ⚪ 보존
- **충돌 윈도우**: ⚪ 닫힘 (워크트리 commit과 mainRoot commit이 disjoint 경로 집합을 다룸 → `.claude/` 겹침 0)
- **전제 조건**: `.claude/` 변경은 매 세션 발생(⚪ Master 확정). mainRoot working tree에 sync copy가 정상 도달.
- **중단 조건**: `.claude/` 외 경로에 mainRoot가 직접 수정한 흔적이 있으면 또 다른 겹침 발생(현재 코드 기준 없음 — L149 hook-diagnostics는 main → worktree 단방향이며 워크트리 commit 단독 포함).
- **risk (🟡)**: 워크트리 branch 단독 push가 필요한 시나리오(예: PR 검토용)에서 `.claude/`가 누락됨. **mitigation**: 현재 플로우는 worktree branch를 직접 push하지 않음(merge 후 main만 push). 영향 0. **fallback**: 만약 worktree branch 단독 push가 필요해지면 그 시점에 임시 commit 추가하면 됨. PD로 분리하여 사후 처리.
- **risk 2 (🟢)**: revision history 일관성. 워크트리에서 `.claude/`를 변경했으나 그 변경의 author/timestamp가 mainRoot sync commit("sync: .claude from worktree {branch}")으로 집계됨. 현재도 이미 그러함(이중 박힘이지만 main 입장에서는 sync commit이 SOT). 변화 없음.

### 옵션 C — 순서 변경 (PD 원문 (c): session_end 먼저, `.claude` sync 나중)

- **구조 변경**: 현재 순서는 ② 워크트리 commit (`.claude/` 포함) → ③ mainRoot sync commit → ④ merge. PD-081 본문의 (c)는 이 순서 자체를 바꾸자는 제안. 그러나 코드 상으로는 워크트리 commit이 항상 mainRoot sync commit보다 먼저이며, 그 후 merge가 일어남. "순서 변경"의 구체 의미가 불명확.
  - 해석 1: mainRoot sync commit을 워크트리 commit **이전에** 만든다 → mainRoot working tree에 `.claude/`가 동기화되어 있지 않은 시점이라 무의미.
  - 해석 2: merge를 sync commit 이전에 한다(ff merge로 mainRoot에 워크트리 branch 통째로 옮긴 다음 그 위에 sync commit) → sync commit이 단독으로 main 위에 올라감 = 결과적으로 옵션 A와 동치(mainRoot sync commit이 워크트리 branch 위 새 commit이 됨, ff merge 가능). 단, 워크트리 commit에 이미 `.claude/`가 박혀 있으므로 sync commit은 거의 항상 "변경 없음" → silent skip (L287 catch).
- **시간 단축 보존**: ⚪ 보존
- **충돌 윈도우**: ⚪ 해석 2 기준 닫힘 (sync commit이 main HEAD 위에 단독으로 올라감 → 3-way merge 자체가 사라짐)
- **risk**: 해석 모호성으로 인한 구현 차이 위험. **mitigation**: 선택 시 Master에게 해석 확정 요청. **추천 등급 낮음** — 옵션 A/B와 본질적으로 동등하거나 그 부분집합인데, 의미 모호로 인한 인지 비용 추가.

### 옵션 D — 중간 구조 유지 + 보호 장치 (lockfile·retry 등)

- **Scope Out (Jobs)에 명시적 금지** — 평가 생략. 변수 증가, 본질 해결 못함.

### 옵션 E — `.gitattributes` merge driver

- **PD 본문에 제외 명시.** 평가 생략.

### 옵션 비교 매트릭스

| 옵션 | 변경 지점 | 충돌 윈도우 | 시간 보존 | 변수 증가 | 추천 등급 |
|---|---|---|---|---|---|
| A (워크트리 단독) | L279~285 삭제 + working tree 정리 한 줄 추가 | 닫힘 | ⚪ | 소 | 2순위 |
| **B (mainRoot sync 단독)** | **L249에서 `.claude/` 한 토큰 제거** | **닫힘** | **⚪** | **최소** | **1순위 ★** |
| C (순서 변경) | 해석 확정 후 결정 | 닫힘(해석 2) | ⚪ | 중(모호성) | 3순위 |
| D (보호 장치) | 다중 | 좁힘만 | 손실 가능 | 대 | 제외 (Scope Out) |
| E (merge driver) | `.gitattributes` | 부분만 | ⚪ | 중 | 제외 (PD 본문) |

### B 추천 근거

1. **변경 가장 적음** — 한 줄 토큰 하나 제거. 코드 정독 시 누구나 의도 파악 가능.
2. **불변식 명확화** — "`.claude/`는 mainRoot에서만 박힌다"는 불변식이 코드로 강제됨. 향후 다른 누군가가 paths 배열에 다시 추가하지 않는 한 충돌 재발 0.
3. **시간 효과 출처에 무영향** — Jobs 부축(시간 단축이 어디서 오는가) 측면에서 본 옵션은 commit·push 횟수·hook 체인 모두 그대로 → 시간 효과 보존 보장.
4. **mainRoot working tree 일관성** — 옵션 A는 sync copy로 dirty 상태가 잔존하나, 옵션 B는 sync commit이 그것을 해소.
5. **PR/diff 가시성** — main의 git log에서 `.claude/` 변경이 "sync:" prefix로 깔끔히 식별 가능. 워크트리 branch에 노이즈 없음.

---

## 3. 유효 스킬 트리 추천 (실행 X — 추천만)

후속 구현 토픽에서 활용할 스킬 트리. **본 세션에서는 호출하지 않음.**

```
[구현 토픽 진입 시점]
├── writing-plans  (Arki rev1 → Dev용 bite-sized plan 변환)
│   └── 산출: plan.md (Phase·게이트·롤백)
│
├── [Dev 발화 시점]
│   ├── subagent-driven-development  (옵션 B는 단일 라인 변경이라 overkill — skip 권고)
│   │   └── 또는 단일 Dev 실행
│   │
│   └── executing-plans  (plan.md 기반 task-by-task 실행)
│
├── [구현 직후]
│   └── verification-before-completion  ★ 의무
│       ├── 1. `node scripts/auto-push.js` 실제 실행 (dry-run 또는 테스트 branch)
│       ├── 2. mainRoot의 git log에 "sync: .claude" commit 존재 확인
│       ├── 3. 워크트리 branch git log에 `.claude/` 변경 부재 확인
│       └── 4. merge가 --ff-only로 통과하는지 확인
│
└── [예상치 못한 동작 발견 시]
    └── systematic-debugging  (재현·격리·진단·수정 4단계)
```

**핵심 트리거 포인트:**
- writing-plans: Arki rev1 종료 직후 (Dev 호출 직전)
- verification-before-completion: 코드 수정 후 "완료" 선언 전 **반드시** (메모리 피드백: dev_verify_and_callable)
- systematic-debugging: 검증 단계에서 예상 외 결과 발생 시

**skip 권고:**
- subagent-driven-development: 옵션 B는 단일 라인 변경. 컨텍스트 격리 이득 < 오버헤드.
- dispatching-parallel-agents: 본 토픽은 단일 의존 체인 — 병렬 분기 없음.

---

## 4. 잔존 🔴 전제 판정

**Jobs framing 단계의 잔존 🔴: "`.claude/` 이중 박힘이 분기·충돌의 유일한 뿌리"**

→ **⚪ 해소.** 본 보고서 §1 정밀 재검증에서:
- 워크트리 commit과 mainRoot sync commit 사이 겹치는 경로는 `.claude/` 단 하나임을 코드로 확인 (L249 vs L280)
- 다른 분기 후보(hook-diagnostics, dashboard 산출, system_state) 모두 단방향 또는 결과적 기록으로 분기 원인 아님을 확인
- 따라서 충돌은 `.claude/` 박힘 위치를 단일화하면 **논리적으로 0**

**잔존 가설 없음.** 옵션 B 채택 시 충돌 재발 0 단언 가능.

---

## 자기감사 (mandatoryRounds: 3)

### 1차 — 발견 4개

- **[structuration / MUST_NOW]** 옵션 B의 "단일 라인 변경"이라는 표현은 정확히는 paths 배열 1토큰 제거 + 검증 1줄. spec 동결 단계에서 "L249 paths 배열에서 `.claude/` 문자열 제거. 다른 라인 변경 0"로 명문화 필요.
- **[hardcoding / SHOULD]** paths 배열 자체가 하드코딩. 향후 동기화 경로 정책이 바뀌면 또 손대야 함. 본 토픽 Scope Out(전체 리팩토링 금지) — DEFER.
- **[efficiency / NICE]** 옵션 B 채택 시 워크트리 commit이 `.claude/` 없이 진행되므로 stage 비용 미세 감소. 측정 가치 낮음 — NICE.
- **[extensibility / MUST_BY_N=10]** mainRoot sync 시 제외 디렉토리(`worktrees/`, `scratch/`) 리스트(L94)가 코드 인라인. 향후 추가 제외 필요 시 코드 수정. dispatch_config.json으로 빼는 것이 정도. 본 토픽 Scope Out — DEFER.

### 2차 — 발견 2개

- **[structuration / MUST_NOW]** 옵션 A vs B 의사결정에서 mainRoot working tree dirty 잔존 문제(옵션 A risk)를 Master가 충분히 인지하도록 spec에 명시. 한 줄짜리 차이지만 운영 체감에 영향.
- **[extensibility / NICE]** 추후 `.claude/scratch/` 외에 `.claude/worktrees/`도 sync 제외인데, 향후 `.claude/` 하위에 worktree-specific 디렉토리 추가 시 새로 제외 규칙 박아야 함. 본 토픽 무관 — DEFER.

### 3차 — 발견 1개

- **[hardcoding / DEFER]** "session-end-tokens.js" 등 hook 파일 경로가 L184~202 문자열 하드코딩. 본 토픽 무관.

**종료 기준 충족**: 3차 발견 1개, 모두 DEFER 또는 토픽 무관. Master 또는 Ace 승인 후 spec 동결 가능.

**Scope drift 체크**: 본 rev1 누적 spec은 토픽 원래 정의(옵션 설계 + 추천) 범위 내. drift 없음.

---

## Spec 동결 선언

- **추천 옵션: B** — `scripts/auto-push.js` L249 paths 배열에서 `'.claude/'` 토큰 제거.
- **변경 라인 수**: 1 (제거) + 0 (추가). 다른 모든 코드 불변.
- **검증 게이트**: `node scripts/auto-push.js` 실행 → main git log에 `sync: .claude` commit 존재 + worktree branch git log에 `.claude/` 변경 부재 + merge `--ff-only` 통과.
- **롤백**: paths 배열에 `'.claude/'` 토큰 재추가 (1라인 revert).
- **중단 조건**: 검증 단계에서 mainRoot에 `.claude/`가 sync 안 됨 또는 worktree branch에 의도치 않은 `.claude/` 변경 잔존 → 즉시 rollback 후 Master 보고.

`spc_lck = Y` — Dev 인계 가능 상태.

---

ARKI_WRITE_DONE: reports/2026-05-11_pd-081-auto-push-order/arki_rev1.md

[ROLE:arki]
# self-scores
aud_rcl: 1.0
str_fd: 3
spc_lck: Y
sa_rnd: 3
