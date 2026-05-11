---
turnId: 1
invocationMode: subagent
role: arki
topic: topic_199
session: session_236
date: 2026-05-11
---

# Arki (turn 2) — PD-081 원점 재설계

## 결론 (TL;DR)

**원점 재설계 추천: 재설계 후보 R1 — "단일 commit, 단일 push, mainRoot 단방향 mirror"**

> 핵심 변경: `.claude/` 박힘 위치를 **워크트리 commit 단독**으로 단일화. mainRoot sync commit(L279~284) **폐지**. mainRoot의 `.claude/` 실파일은 copy로 유지하되 **mainRoot working tree dirty를 commit 후 즉시 `git checkout HEAD -- .claude/`로 clean화** → mainRoot에는 branch 분기 자체가 없어 ff-only가 **항상 성공**. merge commit도 사라짐.

**6개 불변식 충족 매핑:**

| 불변식 | R1 충족 메커니즘 |
|---|---|
| I1 (`.claude/` 단일 commit) | 워크트리 commit 단독. mainRoot sync commit 폐지. |
| I2 (워크트리 working tree clean) | 워크트리 commit이 `.claude/` 포함하므로 push 후 clean. (현재 코드도 이미 clean) |
| I3 (ff-only 항상 성공) | mainRoot에 별도 commit 없음 → main HEAD는 항상 워크트리 branch base와 동일 줄 위. ff-only 100%. |
| I4 (`.claude/`만 변경 edge case) | 워크트리 commit이 그대로 `.claude/` 박음 → "Nothing to commit" 발생 안 함. |
| I5 (시간 단축 보존) | commit 1회 + merge 1회(ff) + push 1회. 현재와 동일 또는 더 적음(--no-ff 사라짐). |
| I6 (변수 최소화) | 신규 lockfile·retry·비동기 push 도입 0. 변경 지점 `auto-push.js` L277~288 블록 1개. |

**Master 정정 수용:** turn 1의 L249 1라인 패치는 충돌 표면만 닫고 dirty 잔존·merge commit 누적·edge case 미해결. 폐기. R1은 **2단 commit 구조 자체를 폐지**하여 충돌이 구조적으로 발생할 수 없음.

---

## 1. 현재 구조의 설계 의도 분해

### 1.1 `auto-push.js` 전체 재독 결과 (L1~338)

**핵심 구조 5단:**

1. **L165~224 `runHookChain`** — tokens·finalize·self-scores·signature·dashboard·prime-directive → `syncHookDiagnosticsFromMain` → `build.js`. **단일 워크트리 내부에서 완결.**
2. **L239~262 워크트리 git add + commit** — paths 배열(`memory/`, `reports/`, `app/`, `scripts/`, `CLAUDE.md`, `logs/`, `dist/`, `.claude/`) 8개 디렉토리/파일을 한 commit에 박음.
3. **L277 `syncClaudeDir`** — 워크트리의 `.claude/` 파일 트리 → mainRoot의 `.claude/`로 **파일 복사** (`worktrees/`, `scratch/` 제외).
4. **L279~284 mainRoot에서 별도 commit** — `git add .claude/` + `git commit -m "sync: .claude from worktree {branch}"`. **변경분 없으면 catch로 silent skip.**
5. **L293·L301 merge → L319 push** — `--ff-only` 시도, 실패 시 `--no-ff -m "merge: {branch}"`. 마지막 `git push origin main` 1회.

### 1.2 설계자 의도 추정 (왜 이렇게 만들어졌나)

**Q1: 왜 워크트리 commit + mainRoot sync commit 2단인가?**

추정 의도:
- **워크트리 격리 보존** — `.claude/`는 메인 슬래시 커맨드·hook·skill의 SOT. 워크트리 branch에 박아도 mainRoot의 작업 시점 파일은 동기화되어야 메인 클라이언트(다른 세션·hook)가 최신 슬래시 커맨드를 본다.
- **2단의 본질적 이유는 "mainRoot working dir 갱신" 1개뿐.** commit이 2번 필요한 구조적 이유는 없다. mainRoot working dir 동기화는 단순 파일 copy로 충분하고, "main branch에도 `.claude/` 이력을 박는다"는 결정이 commit으로 격상된 것.
- **session_233(PD-079) 병행 워크트리 도입 이전**에 설계됨. 단일 워크트리 가정 하에서는 워크트리 branch 단독 commit만으로 main branch에 merge 시 같은 SHA가 들어가므로 2단은 redundant.

**Q2: 왜 `syncClaudeDir`은 copy 방식인가?**

- worktree → main 단방향. main에 다른 워크트리의 `.claude/`가 덮어쓰여지지 않도록 `worktrees/`, `scratch/` 제외(L94). 단방향 mirror 의도 명확.
- copy 자체는 idempotent하고 git 의존성 없음. 안전한 선택.

**Q3: 왜 push가 mainRoot에서만 일어나는가?**

- worktree branch는 임시 작업 branch(예: `claude/goofy-colden-422c8a`). origin에 push해도 의미 없음 (PR 흐름 없음).
- main만 origin과 sync하는 단일 publish point 정책.

**Q4: 시간 단축 효과(체감 10분)는 어디서?**

세션 종료 시 hook chain(tokens·finalize·dashboard·build)이 직렬로 돌고 그 후 commit·merge·push까지 묶여 동작. 이 일괄 처리가 "한 번 종료하면 끝"이라는 체감 단축의 출처. **commit이 1회냐 2회냐는 무관**(둘 다 ms 단위). 즉 sync commit 폐지는 시간 단축 효과 무관.

**Q5: 각 단계의 본질 문제**

| 단계 | 본질 문제 |
|---|---|
| ① hook chain | 세션 메타·아티팩트 박제 (commit 전 필수 산출물 생성) |
| ② 워크트리 commit | 세션 작업 결과 박제 (crash 시 worktree branch에 보존) |
| ③ syncClaudeDir | mainRoot working dir의 `.claude/` 최신화 (다른 클라이언트·hook용) |
| ④ mainRoot sync commit | **불필요** — 단순 working dir 동기화면 충분한데 commit으로 격상됨 |
| ⑤ merge → push | main branch에 단일 publish |

**판정:** 단계 ④가 분기·충돌의 유일한 원인이자 본질 없는 redundancy. ③에서 working dir만 최신화하고 commit은 ②에 일임하면 분기 자체가 사라진다.

---

## 2. 6개 불변식 정의 (원점 기준)

- **I1:** `.claude/` 변경은 단 하나의 commit에만 박힌다.
- **I2:** push 후 워크트리 working tree clean (dirty 잔존 0).
- **I3:** ff-only 항상 성공하거나 구조적 이유 명시.
- **I4:** `.claude/`만 변경된 edge case에서도 push 정상 동작.
- **I5:** 시간 단축 효과 보존 (체감 10분 손실 0).
- **I6:** 변수 최소화 (lockfile·retry·비동기 push 등 도입 0).

---

## 3. 재설계 후보 트리

### 후보 R1 — 워크트리 commit이 `.claude/` 단일 소유, mainRoot는 working dir mirror만 ★ 추천

**구조:**
- 워크트리 commit에 `.claude/` 그대로 포함 (현재 L249 유지).
- mainRoot sync는 **파일 copy까지만**. `git add .claude/` + commit 폐지.
- copy 직후 mainRoot의 `.claude/` working dir이 dirty 상태가 되므로, **merge 직전에 `git checkout HEAD -- .claude/`로 mainRoot working tree 초기화** → 그 후 ff-only merge가 워크트리 branch SHA를 그대로 가져오며 `.claude/` 파일도 함께 들어옴.

**의존 그래프 변화:**

```
[현재]  worktree-commit(.claude+others) ─┐
                                          ├→ ff-only 실패 → --no-ff merge → push
        mainRoot-commit(.claude)        ─┘                  (충돌 가능)

[R1]    worktree-commit(.claude+others) ──→ mainRoot checkout HEAD -- .claude/ (dirty 제거)
                                          └→ ff-only merge (항상 성공) → push
```

**불변식 매핑:**

| 불변식 | 충족 메커니즘 | 검증 |
|---|---|---|
| I1 | mainRoot commit 없음 → `.claude/`는 워크트리 commit 단독 | ⚪ |
| I2 | 워크트리 commit이 `.claude/` 박음 → push 후 워크트리 clean | ⚪ |
| I3 | mainRoot에 별도 commit 없음 → main HEAD는 항상 worktree base 줄 위 → ff-only 100% | ⚪ (단 git pull/원격 변경 시 예외 — §5 risk 2 참조) |
| I4 | `.claude/`만 변경된 경우 워크트리 commit이 정상 생성 (다른 paths는 변경 0이어도 `.claude/` 변경분만으로 commit) | ⚪ |
| I5 | commit 2회 → 1회, merge --no-ff 폐지로 시간 ≤ 현재 | ⚪ |
| I6 | 변경 지점: L277~288 블록만 (sync commit 폐지 + checkout 1줄 추가). 신규 보호장치 0. | ⚪ |

**변경 지점:**
- `scripts/auto-push.js` L279~288 — `git add .claude/ + commit` try 블록 **삭제**.
- 같은 위치에 1줄 추가: `execSync('git checkout HEAD -- .claude/', { cwd: mainRoot, stdio: 'pipe' });`
- L292 `--ff-only` 블록은 그대로 유지. L298~311 `--no-ff` 폴백은 **dead code화**(이론상 도달 안 함) 되나 안전망으로 유지 가능.
- 추정 라인 수: -10 / +1.

**의존 영향:**
- `syncClaudeDir` 함수 자체는 유지 (mainRoot working dir mirror 목적 보존).
- `writeMergeFailureAlert` / `clearMergeFailureAlert` 호출 경로 그대로.
- main git log: "sync: .claude from worktree {branch}" commit 사라짐. main 이력에는 워크트리 branch의 session update commit과 merge commit(현재 `--no-ff` 시) 또는 ff fast-forward만 남음. 깔끔.
- `memory/shared/system_state.json` worktreeMergeFailures 누적 0 (구조적 충돌 발생 불가).

**시간 단축 효과 출처 양립성:**
- hook chain 변경 0. commit 1회 + merge 1회(ff) + push 1회 = 현재보다 commit 1회·`--no-ff` 0회 적음 → 동일 또는 단축. ⚪

**전제 조건:**
- mainRoot의 main branch가 워크트리 branch의 base이고, 그 사이 외부 원격 push로 인한 진척이 없음.
- 운영 패턴: Master 단일 워크트리·매 세션 종료 시 push 1회 → 외부 원격 진척 0.

**중단 조건:**
- 외부에서 main에 push가 들어와 mainRoot가 갈라진 경우 ff-only 실패 → 기존 `--no-ff` 폴백 경로로 자동 진입. 단, 이때 `.claude/`는 워크트리 commit 단독이므로 mainRoot 외부 commit과 `.claude/` 경로가 충돌할 가능성은 외부 push가 `.claude/`를 건드린 경우뿐 → 운영상 0.

---

### 후보 R2 — mainRoot가 `.claude/` 단일 소유, 워크트리는 외부 처리

**구조:**
- 워크트리 commit의 paths 배열에서 `.claude/` 제거 (turn 1의 옵션 B와 동일 기점).
- 추가로 워크트리 working tree dirty 잔존 해소를 위해 push 후 `git checkout HEAD -- .claude/` 워크트리에서 실행.
- 단, 워크트리 working dir의 `.claude/`는 mainRoot sync commit이 박은 SHA 기준으로 reset되어야 함 → fetch/pull 흐름 필요.

**불변식 매핑:**

| 불변식 | 충족 여부 |
|---|---|
| I1 | ⚪ mainRoot commit 단독 |
| I2 | △ `git checkout` 워크트리 reset 후 동작은 가능하나 워크트리 branch가 `.claude/` 이력을 영영 갖지 못함 → branch 단독 push가 필요해지면 누락 |
| I3 | ⚪ ff-only 항상 성공 (워크트리 변경분에는 `.claude/` 0, mainRoot 변경분에만 `.claude/` 있음 → 분기 base는 같음) |
| I4 | ✕ `.claude/`만 변경된 세션은 워크트리 commit "Nothing to commit"이 되고 mainRoot commit만 만들어지면 merge가 ff-fast-forward 대신 mainRoot-only commit이 됨. 정상 동작은 하나 워크트리 branch 입장에서 "빈 세션" 형상 → revision history 일관성 손실 |
| I5 | ⚪ |
| I6 | △ 워크트리 reset 추가 → 변경 지점 2개소 |

**판정:** I2/I4가 약함. R1보다 부적합.

---

### 후보 R3 — 워크트리에서 직접 push, mainRoot 경유 폐지

**구조:**
- 워크트리 branch를 origin에 직접 push (`git push origin {branch}`).
- mainRoot의 main과의 sync는 별도 워크플로(PR or `git pull` on main).

**불변식 매핑:**

| 불변식 | 충족 여부 |
|---|---|
| I1 | ⚪ |
| I2 | ⚪ |
| I3 | n/a (merge 자체가 사라짐) |
| I4 | ⚪ |
| I5 | ✕ mainRoot main 동기화 별도 단계 필요 → Master 수동 개입 또는 추가 hook → 체감 10분 손실 |
| I6 | ✕ Master 운영 패턴 변경(단일 publish point가 main → branch로 이동). 다른 시스템·hook 영향 큼 |

**판정:** I5·I6 위반. Scope Out("PD-079 재설계" 침범 우려). 폐기.

---

### 후보 R4 — 워크트리 commit과 mainRoot commit을 동일 SHA로 묶기 (cherry-pick 방식)

**구조:** 워크트리 commit을 만든 후 mainRoot에서 `cherry-pick`으로 동일 commit을 가져오고 merge 폐지.

**불변식 매핑:**
- I1 ✕ (cherry-pick은 동일 변경분을 다른 SHA로 박음 → 사실상 2개 commit).
- 변수 증가(cherry-pick 충돌 처리 신규).
- I6 ✕.

**판정:** 폐기.

---

### 후보 R5 — `.claude/`를 별도 git submodule 또는 별도 repo로 분리

**구조:** `.claude/`를 sub-repo로 빼서 워크트리·mainRoot 모두 같은 SOT를 가리키게 함.

**불변식 매핑:**
- I1·I3 ⚪ but I6 ✕ (Scope Out "gitignore 분리" 정신과 유사한 대규모 변경. 변수 폭증).

**판정:** Scope Out 명시 침범. 폐기.

---

## 4. 최종 단일 추천: R1

### 4.1 추천 사유

- **6개 불변식 모두 ⚪.** R2는 I2·I4 약함, R3~R5는 Scope Out 또는 I5/I6 위반.
- **변경 지점 최소** — `auto-push.js` 한 함수 내부 -10/+1 라인.
- **신규 보호장치 0** — lockfile·retry·비동기 push 도입 없음 (I6).
- **운영 패턴 보존** — 단일 워크트리·매 세션 push 1회·main 단일 publish point 그대로.
- **부산물 정리** — main git log에서 "sync: .claude" commit과 `--no-ff` merge commit이 사라져 이력이 깔끔.

### 4.2 차순위와의 격차

R2 대비:
- I4 충족(빈 워크트리 commit 형상 회피).
- 워크트리 branch에 `.claude/` 이력 보존(향후 branch 단독 push 필요 시 자연 대응).
- 변경 지점도 더 적음(R2는 워크트리 reset 추가 필요).

### 4.3 R1 적용 의사 코드 (변경 지점 명시 — 실제 수정은 Dev 단계)

```javascript
// scripts/auto-push.js  L276~288 부근

// .claude/ 동기화 후 main repo working dir만 최신화 (commit은 워크트리 단독)
timed('syncClaudeDir', () => syncClaudeDir(mainRoot));

// mainRoot working tree의 .claude/ dirty 제거 — merge가 워크트리 SHA 그대로 가져옴
try {
  timed('main: reset .claude working tree', () => {
    execSync('git checkout HEAD -- .claude/', { cwd: mainRoot, encoding: 'utf8', stdio: 'pipe' });
  });
} catch (e) {
  // .claude/ 이력이 mainRoot에 아직 없는 첫 회 등: 무시
  console.log('[auto-push] .claude reset skipped (no prior HEAD entry).');
}

// L290~ 이후 merge 로직 그대로
```

**삭제 대상:** L278~288 `try { timed('main: git add .claude + commit', ...) } catch {}` 블록.

---

## 5. 잔존 위험 (Riki 점검 전 자가 적출)

| # | 위험 | 가능성 | 영향 | mitigation | fallback |
|---|---|---|---|---|---|
| R1-1 | mainRoot `.claude/` working tree가 syncClaudeDir copy 직후 reset됨 → 다른 클라이언트(예: mainRoot에서 직접 슬래시 커맨드 실행)가 reset 직후·merge 직전 1~10ms 윈도우에서 구버전 `.claude/`를 읽을 수 있음 | 극히 낮음 (mainRoot에서 동시 hook 실행 패턴 없음, 단일 워크트리 운영) | 슬래시 커맨드 1회 실행 실패 가능 (재시도로 즉시 회복) | 동시 실행 시나리오 부재 확인 (운영 패턴 ⚪) | merge 후 mainRoot working tree는 정상 갱신 — 재시도로 회복 |
| R1-2 | 외부에서 origin/main에 별도 push가 들어온 후 본 세션 종료 시 ff-only 실패 → `--no-ff` 폴백 진입 | 운영상 0 (Master 단일 클라이언트) but 이론상 가능 | merge commit 생성 (현재와 동일 동작) | 운영 패턴 단일 클라이언트 보장 | 현재 `--no-ff` 폴백 경로 그대로 유지 → 동작 동등 |
| R1-3 | 워크트리 commit이 "Nothing to commit"이 되는 새 edge case (모든 paths 변경 0) | 매우 낮음 (`.claude/`·`memory/` 중 하나라도 변경되면 commit 발생, 세션 종료 시 finalize hook이 `current_session.json` 갱신 → `memory/` 변경 보장) | push skip (현재와 동일) | finalize hook이 항상 `memory/shared/current_session.json` touch → commit 0 시나리오 부재 | "No changes to push" 정상 로그 |
| R1-4 | mainRoot working tree에 사용자가 직접 수정한 `.claude/` 파일이 있는 경우 reset으로 손실 | 운영상 0 (`.claude/` 수정은 워크트리에서만) | 수동 수정분 손실 | 워크트리 단독 수정 패턴 명시 (CLAUDE.md 또는 운영 메모) | reset 전 `git status .claude/`로 dirty 감지 시 경고만 출력(SHOULD, NICE 라벨) |
| R1-5 | 첫 회(`.claude/`가 main branch에 아직 없는 신규 repo)에 `git checkout HEAD -- .claude/` 실패 | 0 (현 repo는 이미 `.claude/` 이력 있음) | 첫 회 1회 skip | try/catch로 silent skip | merge가 워크트리 branch의 `.claude/` 신규 도입 commit 그대로 가져옴 |

**R1-2 잔존:** `--no-ff` 폴백 dead code화에도 불구하고 안전망으로 유지 권고. Riki가 별도 판정.

---

## 6. 자기감사 3라운드

### 6.1 1차 감사

| 축 | 발견 | ROI |
|---|---|---|
| structuration | R1 변경 지점 1함수 내부 1블록 → 구조 분리·의존 명확 | No issue at this dimension (이미 분리됨) |
| structuration | `--no-ff` 폴백 dead code 잔존 — 의도 명확화 주석 필요 | SHOULD |
| structuration | `syncClaudeDir`과 `checkout` 의존 순서 (copy → reset) 명문화 안 됨 | MUST_NOW |
| hardcoding | `git checkout HEAD -- .claude/` 경로가 magic string → `.claude/` 폴더명이 코드에 박혀 있음 (현재도 동일) | DEFER (현재 코드도 동일, scope 외) |
| hardcoding | `paths` 배열(L249) 그대로 유지 — 정책 SOT 아님 | DEFER (PD-079 분리 scope) |
| hardcoding | `worktrees`, `scratch` 제외 리스트(L94) 그대로 | DEFER |
| efficiency | commit 2→1로 줄어듦. `--no-ff` 사라짐 → 시간 단축(현재 timing 대비 200~500ms 추정) | NICE |
| efficiency | `git checkout` 추가로 ~50ms 소요 — 순감소 (-200ms 추정) | NICE |
| efficiency | `syncClaudeDir` copy 자체는 변경 0 → 중복 없음 | No issue at this dimension |
| extensibility | 향후 다중 워크트리 병행 시 mainRoot reset이 race 가능 — 그러나 Scope Out(보호장치 도입 0). 인지만 박제 | DEFER (PD 분리 권고) |
| extensibility | `.claude/` 외 다른 폴더가 같은 2단 commit 패턴을 가질 가능성 — 현재 코드에는 없음 | No issue at this dimension |
| extensibility | merge 실패 alert(`writeMergeFailureAlert`) 경로 그대로 → R1 적용 후에도 보호망 보존 | No issue at this dimension |

**1차 결과: 발견 11개 / MUST_NOW 1 / SHOULD 1 / NICE 2 / DEFER 4 / No issue 3.**

### 6.2 2차 감사 (1차 MUST_NOW·SHOULD 해소 후)

1차 MUST_NOW("의존 순서 명문화") → §4.3 코드 의사 블록에 "copy → reset → merge" 주석으로 명시. 해소.
1차 SHOULD("폴백 dead code 주석") → §4 4.1·§5 R1-2에 명문화. 해소.

| 축 | 발견 | ROI |
|---|---|---|
| structuration | reset 실패 시 silent skip — 첫 회 외 다른 실패 원인(권한·lock)도 silent → 진단 어려움 | SHOULD |
| structuration | `--no-ff` 폴백이 dead code인지 안전망인지 코드 주석으로 구분 필요 | NICE |
| structuration | timed() label "main: reset .claude working tree" 표기 일관성 OK | No issue at this dimension |
| hardcoding | 변경 지점 1곳만 — 신규 hardcoding 도입 0 | No issue at this dimension |
| hardcoding | `git checkout HEAD` ref가 명시적 → 안전 | No issue at this dimension |
| hardcoding | catch fallback message 문구만 추가 — 정책 영향 0 | No issue at this dimension |
| efficiency | reset이 매 세션 실행되나 mainRoot가 clean이면 no-op → 비용 무시 | No issue at this dimension |
| efficiency | `--no-ff` 폴백 진입률 0 → 평균 latency 단축 | No issue at this dimension |
| efficiency | hook chain·build.js 영향 0 → 시간 단축 효과 보존 | No issue at this dimension |
| extensibility | reset 후 mainRoot working dir 상태 invariant(== HEAD) 명문화 가치 | NICE |
| extensibility | 향후 `.claude/` 외 폴더도 같은 패턴 필요 시 함수 추출 가능 — 현재는 1회 사용이므로 인라인 OK | No issue at this dimension |
| extensibility | system_state.worktreeMergeFailures 잔여 entry 청소 책임 — 이미 clearMergeFailureAlert 있음 | No issue at this dimension |

**2차 결과: 발견 12개 / MUST_NOW 0 / SHOULD 1 / NICE 2 / DEFER 0 / No issue 9.**

### 6.3 3차 감사 (2차 SHOULD 해소 후)

2차 SHOULD("reset 실패 silent 진단") → R1-1 fallback 항에 "재시도로 회복" 명시 + 진단 로그는 catch 안의 console.log로 1회 출력(이미 §4.3 의사 코드에 포함). NICE 2건은 보류 가능.

| 축 | 발견 | ROI |
|---|---|---|
| structuration | No issue at this dimension | — |
| hardcoding | No issue at this dimension | — |
| efficiency | No issue at this dimension | — |
| extensibility | NICE 2건 (working dir invariant 명문화, polish) — 본 PD 종결과 무관 | NICE (DEFER 가능) |

**3차 결과: 발견 1개 / 모두 NICE/DEFER. 종료 기준(Nth차 발견 ≤ 1 + 모든 발견 NICE/DEFER) 충족.**

### 6.4 종료 선언 + Ace 승인 요청

- Master 또는 Ace 승인 시 spec 동결 — Dev 인계 가능 (`spc_lck = Y`).
- scope drift 체크: 본 turn 2의 spec 범위는 turn 1 대비 1.5배(L249 1라인 → L277~288 블록 + 1라인 추가). N배 초과 없음 → drift 0.

---

## 7. Dev 인계 spec (R1 단일)

| 항목 | 값 |
|---|---|
| 파일 | `scripts/auto-push.js` |
| 함수 | `autoPush()` |
| 변경 범위 | L276~288 부근 1블록 |
| 삭제 | L278~288 `try { timed('main: git add .claude + commit', ...) } catch {}` 블록 (mainRoot의 `git add .claude/ + commit` 전체) |
| 추가 | `syncClaudeDir(mainRoot)` 호출 직후, `git merge` 시도 직전에 1줄: `execSync('git checkout HEAD -- .claude/', { cwd: mainRoot, encoding: 'utf8', stdio: 'pipe' })`. try/catch silent skip + 1줄 console.log |
| 유지 | L292·L298 `--ff-only`·`--no-ff` 폴백 블록 그대로 (안전망) |
| 영향 외 | `syncClaudeDir` 함수 본체, hook chain, paths 배열(L249), `writeMergeFailureAlert`, push 로직 |
| 검증 | 1) Dev가 `scripts/auto-push.js` 수정 후 dry-run (commit·push 직전 단계까지) 2) 워크트리 commit 1회·main commit 0회·merge ff·push 1회 흐름 확인 3) mainRoot `git status` 깨끗 4) 다음 세션 종료 시 충돌 0 실측 |
| 게이트 | G1: 수정 후 `node scripts/auto-push.js` test 실행(test 모드 추가 권고하나 scope 외이므로 실 세션 종료로 검증 가능). G2: main git log에 "sync: .claude" commit 신규 0 / merge commit `--no-ff` 신규 0 |
| 롤백 | 삭제한 try 블록을 그대로 복원 + 추가한 checkout 1줄 제거. revert로 1 commit 회수. |
| 중단 조건 | G1에서 ff-only가 외부 origin push로 실패하는 경우 — 운영 패턴 점검 후 재시도 또는 PD 분리 |

---

## 8. 추천 단일성 재확인

- 후보 R1만이 6개 불변식 전체 ⚪.
- 변수 최소 + 시간 단축 보존 + 운영 패턴 보존.
- 추천 사유 + 차순위 격차 명시 완료(§4.2).
- 자기감사 3라운드 종료 기준 충족(§6.3).

**Spec 동결 후보 (Master/Ace 승인 대기).** Riki risk 점검 권고.

---

[ROLE:arki]
# self-scores
aud_rcl: 1.0
str_fd: 4
spc_lck: Y
sa_rnd: 3
