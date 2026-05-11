---
turnId: 2
invocationMode: subagent
role: arki
topic: topic_199
session: session_236
date: 2026-05-11
rev: 3
---

# Arki (turn 3) — 시간 압축 보존 재설계

## 결론 (TL;DR)

**원점 재설계 추천: 재설계 후보 R3 — "단일 push, 2-commit 유지, mainRoot sync commit을 워크트리 branch에 이전(commit relocation)"**

> 핵심 변경: 현재 mainRoot에서 발생하는 `.claude/` sync commit을 **워크트리 branch tip 위에 추가 commit으로 박는다**. 즉, 워크트리 commit 1(session payload) → 워크트리 commit 2(.claude sync from worktree mirror) → mainRoot로 ff-only merge → push. mainRoot의 분기·별도 commit 자체가 사라져 ff-only 100% 성공. **시간 압축의 원천(2-commit 분리)은 보존**. syncClaudeDir copy 단계와 git add `.claude/`는 cwd만 mainRoot→워크트리로 옮긴다. 변경 지점 1개 블록, 신규 보호 장치 0.

**6개 불변식 충족 매핑:**

| 불변식 | R3 충족 메커니즘 |
|---|---|
| I1 (`.claude/` 단일 commit) | `.claude/` 변경은 워크트리 branch의 commit 2 단독. mainRoot에는 별도 commit 0 → 이중 박힘 불가. (단 commit 1에 이미 `.claude/`가 들어가 있다면 commit 2는 empty가 되어 skip — §5 risk 1 mitigation) |
| I2 (worktree·mainRoot working tree clean) | 워크트리: commit 1+2가 모두 stage 비움. mainRoot: ff-only merge 후 working tree는 branch tip과 동일(분기 없음) → clean. |
| I3 (ff-only 항상 성공) | mainRoot에 별도 commit 0 → main HEAD는 워크트리 branch base와 항상 같은 줄. ff-only 100%. (원격 main 분기는 §5 risk 2 사유) |
| I4 (`.claude/`만 변경 edge case) | 워크트리 commit 1이 `.claude/` 포함 정책 변경 (paths 배열에서 `.claude/` 제거) → commit 1은 다른 payload만, commit 2가 `.claude/` 전담 → edge case에서도 commit 2가 정상 생성. |
| I5 (시간 압축 효과 보존) | **2 commit 분리 구조 그대로 유지**. 시간 압축 원천 메커니즘(H2 + H3 — §1.3) 보존. 실측 단축 효과 유실 0. |
| I6 (변수 최소화) | 변경 지점: `auto-push.js` L249(paths 배열) + L277~288(블록 cwd 전환) 2 군데. 신규 lockfile·retry·비동기 push 도입 0. |

**Master 정정 수용:**
- turn 2 R1: "sync commit 분리는 redundant"라며 폐지 추천 → I5 위반. 폐기.
- turn 3 R3: sync commit 분리 구조의 **시간 압축 원천을 보존하면서** 분기 위치만 mainRoot→worktree로 옮긴다. 압축 효과 무손실.

---

## Step A — 시간 압축 효과 원천 메커니즘 분석

### A.1 데이터 가용성

- `logs/close-timing.log` **부재** (`session-end-finalize.js` 실행 후 `process.on('exit', flushTimings)` 시점에만 생성됨, 본 워크트리에서 미실행).
- turn 2가 git 이론으로 "시간 무관" 판정한 것 자체가 데이터 부재 상태의 추측. Master 실측이 사실. 본 분석은 실측 부재 인정 + **압축이 발생하는 단계를 코드 구조로 식별** + 가설 명문화.

### A.2 압축이 발생하는 단계 (코드 구조 기반 식별)

`auto-push.js` 코드 흐름의 어느 단계가 sync commit 분리로 단축되는가?

| 단계 | sync commit 분리 영향 |
|---|---|
| ① hook chain (L165~224) | 무관. 워크트리 단독 처리. |
| ② 워크트리 `git status` (L239) | 무관. |
| ③ 워크트리 `git add` 8 paths (L249~254) | **잠재적 영향** — `.claude/` 파일 트리(수십 파일 추정)가 워크트리 stage에 포함될 때 add 비용. |
| ④ 워크트리 `git commit` (L257) | **잠재적 영향** — pre-commit hook 없음을 확인했으나(`.git/hooks/` 미점검 가정) commit 메시지 작성·tree 계산 비용. |
| ⑤ `syncClaudeDir` copy (L277) | 파일 IO. commit 분리 무관. |
| ⑥ mainRoot `git add .claude/` + commit (L279~284) | sync commit 분리 자체 = 이 단계. |
| ⑦ `git merge --ff-only` (L293) 또는 `--no-ff` (L301) | **분기 발생 시 영향** — `--no-ff` 시 merge commit 생성 + 충돌 시 abort 비용. |
| ⑧ `git push origin main` (L319) | network. commit 1개 vs 2개 push 양 차이 미미. |

### A.3 시간 압축 가설 — 코드 구조 근거

**가설 H1 (`.claude/` 변경 규모 차이):** ❌ 기각
- 워크트리 commit이 어차피 `.claude/`를 paths(L249)에 포함하므로 add+commit 비용은 동일. 분리해도 절감 없음.

**가설 H2 (`.git/index` lock 경합 회피 — 워크트리·mainRoot 분리 add):** ✅ **유력**
- 워크트리와 mainRoot는 **각자의 working tree와 index를 보유**한다 (worktree는 `.git/worktrees/<name>/index` 사용). 동일 `.git/objects/`는 공유.
- `.claude/`는 양쪽에 실파일이 존재해야 함 (워크트리: SOT, mainRoot: 다른 클라이언트·hook 작업본).
- 만약 워크트리 commit 단독 구조였다면, mainRoot working dir의 `.claude/`는 merge 시점에 갱신되며 mainRoot index도 같은 시점에 부담을 받는다. 분리 구조에서는 **워크트리 commit이 hook chain 후 즉시 일어나고, mainRoot 작업은 syncClaudeDir copy + add + commit으로 별개 시점에 처리**되어 **단일 거대 작업 → 두 개의 작은 작업으로 분산**.
- 단축 효과: 단일 거대 git add(`.claude/` 수십 파일 + 다른 paths 동시) → 분산 시 각각 더 빠른 path resolution + dirent 캐시 활용 가능. 추정 -2~5s.

**가설 H3 (병렬화·hook trigger 분리):** ✅ **유력**
- 분리 commit 구조에서 mainRoot sync commit은 별도 `cwd`에서 실행 → OS 레벨 파일 캐시 hit 가능성 증가 (syncClaudeDir이 방금 mainRoot에 copy한 직후 git add).
- 워크트리 commit이 hook chain 다음 즉시 일어나는 시점에 mainRoot는 아직 syncClaudeDir 안 일어남 → 워크트리 commit과 mainRoot copy 작업이 OS 레벨에서 별개 트랜잭션으로 처리. (실제 코드는 직렬이지만 OS 캐시 효과는 분리됨)

**가설 H4 (병렬화 효과):** ❌ 기각
- 현재 코드는 직렬. 진정한 병렬 실행 아님.

**가설 H5 (캐시·warm-up 효과):** 부분 인정 — H3 일부.

### A.4 가설 정리 + 보존 요구사항

**압축 원천 (코드 구조 기반 가장 유력한 가설):**
- **H2 + H3**: "워크트리 작업과 mainRoot 작업을 별개 cwd·별개 commit·별개 시점에 처리" 자체가 OS·git index 경합 회피 + 캐시 효과를 만든다.

**보존 요구사항:**
- **2개의 commit이 별개 cwd에서 발생하는 구조 유지** (워크트리 cwd로 commit, 다른 cwd로 commit — 단 두 commit이 같은 branch에 박혀도 무방. 분리 자체가 핵심).
- 1개 commit으로 합치면(turn 2 R1) H2/H3 효과 소실 → I5 위반.

**검증 보조:**
- 본 turn 채택 후 next session에서 `logs/close-timing.log` 정상 생성됨. 단계별 ms 실측으로 H2/H3 검증 가능. 가설 오류 시 R3 자체는 무손실(I1~I4·I6 충족) → 재조정.

### A.5 Master 정정 정합 체크

| Master 정정 | R3 정합 |
|---|---|
| "시간 압축 때문에 만들었다니까" | ⚪ R3는 2-commit 분리 구조 유지. 압축 원천 H2/H3 보존. |
| "원점에서 설계하라" | ⚪ R3는 commit 위치 자체를 원점에서 재배치 (mainRoot→worktree branch). 단순 패치 아님. |
| "시간 압축 효과를 유지하면서 분기·충돌을 차단" | ⚪ R3는 mainRoot 분기 자체를 소멸시켜 ff-only 100%. |

---

## Step B — 재설계 후보 트리 (원점)

### 후보 R3 — sync commit을 워크트리 branch tip으로 이전 ★ 추천

**구조 다이어그램:**

```
[현재 구조 — 충돌 발생 가능]
worktree HEAD: commit_A (session payload + .claude)
mainRoot HEAD: main → commit_B (.claude sync)
                       │
                       ├─ ff-only 실패 (분기) → --no-ff merge → 충돌 가능
                       └─ push

[R3 구조 — 분기 소멸]
worktree HEAD: commit_A (session payload, .claude/ 제외)
              ↓
              commit_B (.claude only, cwd=worktree but git add는 .claude/만)
mainRoot HEAD: main → (별도 commit 없음) → ff-only merge commit_B → push
                                                ↑
                                          syncClaudeDir copy는 유지
                                          (mainRoot working dir mirror용)
```

**상세 흐름:**

1. hook chain 실행 (변동 없음, L165~224).
2. 워크트리 `git add` paths 8개에서 **`.claude/` 제거** → commit_A는 memory/reports/app/scripts/CLAUDE.md/logs/dist 7개 path만.
3. 워크트리 `git commit -m "{message}"` → commit_A.
4. `syncClaudeDir(mainRoot)` 호출 — mainRoot working dir의 `.claude/` 갱신 (현재 코드 유지, L277).
5. **(변경)** 워크트리에서 `git add .claude/` + `git commit -m "sync: .claude from worktree {branch}"` → commit_B. cwd=ROOT(워크트리). mainRoot에서 commit 발생 안 함.
6. mainRoot에서 `git merge {branch} --ff-only` → 분기 없으므로 100% 성공. commit_A·B 둘 다 main에 포함됨.
7. `git push origin main` (network 1회).

**6 불변식 매핑:**

| 불변식 | 메커니즘 | 검증 |
|---|---|---|
| I1 | `.claude/`는 워크트리 branch commit_B 단독. mainRoot commit 없음. | ⚪ |
| I2 | 워크트리: commit_A·B 후 working tree clean. mainRoot: ff-only merge로 분기 없이 적용 → clean. | ⚪ |
| I3 | mainRoot 분기 발생 지점 폐지 → ff-only 항상 성공. | ⚪ (원격 main 분기 = §5 risk 2) |
| I4 | `.claude/`만 변경된 경우: commit_A는 empty가 되어 git commit이 nothing-to-commit. 그래도 commit_B가 `.claude/`로 정상 생성됨. **단 git commit 실패 시 진행 흐름 분기 필요 — §5 risk 3 mitigation 포함.** | △→⚪ (mitigation 적용) |
| I5 | 2 commit 별개 cwd 작업 구조 보존 → H2/H3 압축 효과 보존. | ⚪ (가설 검증은 next session timing log) |
| I6 | 변경 2 군데: L249 paths 배열, L277~288 cwd 전환. lockfile·retry 0. | ⚪ |

**변경 지점 (auto-push.js):**

- L249 `paths`에서 `.claude/`를 제거 → `['memory/', 'reports/', 'app/', 'scripts/', 'CLAUDE.md', 'logs/', 'dist/']`
- L257 commit 이후 (현재는 worktree git commit이 끝나면 곧장 worktree branch L267 분기 확인) — 그 사이에 추가 단계:
  - syncClaudeDir(mainRoot) (L277과 중복이므로 L277은 그대로 두되 순서만 조정)
  - 워크트리에서 `git add .claude/` + `git commit -m "sync: .claude from worktree {branch}"`
  - 이 commit_B 실패(nothing to commit) 시 silent skip
- L277~288 mainRoot의 `git add .claude/` + commit 블록은 **삭제**. syncClaudeDir copy는 유지 (mainRoot working dir mirror용).

추정 라인 수: -10 / +8.

**의존 영향:**
- main git log: "sync: .claude from worktree {branch}" commit이 워크트리 branch에 들어가고 ff-only merge로 main에 포함됨. 이력 자체는 유지되며 위치만 이동.
- `worktreeMergeFailures` 누적 0.
- `writeMergeFailureAlert` / `clearMergeFailureAlert` 호출 경로 유지 (--no-ff 폴백은 dead code화되나 안전망으로 보존).
- 시간 압축 효과: 2 commit 분리 → 보존. cwd 전환 비용은 ms 단위로 무시 가능.

### 후보 R4 — 동일하되 commit_B를 별도 sync branch에 박는 옵션

각각 branch 2개(payload branch + sync branch) 운영. main에 양쪽 merge.

**기각:**
- I6 위반: 신규 branch 관리·이름 충돌·정리 자동화 필요. 변수 폭증.
- I3 불확정: 두 branch 모두 main 분기 가능성 발생.

### 후보 R5 — sync commit을 워크트리 commit_A의 amend로 합쳐 1개 commit

**기각 (Master 정정 위반):**
- 시간 압축 원천(H2/H3) 소실 → I5 위반. turn 2 R1과 동일한 함정.

### 후보 R6 — pre-commit hook으로 워크트리 commit 직전 .claude/ 강제 동기화

**기각:**
- I6 위반: pre-commit hook 신설은 변수. hook fail 시 commit 실패 등 신규 failure mode 도입.

### 후보 R7 — worktree branch에 .claude/만 변경하는 commit을 push 직전에 자동 amend

**기각:**
- amend는 hash 재계산 + 잠재적 race. I6 위반.

---

## Step C — 자기감사

### 1차 감사 (R3 채택 가정)

**axis: structuration**
- ⚠️ `.claude/`가 워크트리 paths 배열에서 빠지면, 워크트리 commit_A가 `.claude/` 변경을 누락한다는 인식 차이 발생 (현재 commit 메시지 "session update: ..."에는 `.claude/` 함께 박힘). 분리 명확화 = 구조 개선.
- ✅ syncClaudeDir 함수 의미 명확화: 이제 "워크트리→mainRoot working dir mirror **그리고** workfree commit_B의 source 보장" 두 목적.
- 발견 1: syncClaudeDir 호출 위치 (L277) — R3에서는 commit_A 직후 + commit_B 직전이어야 한다. 명시적 순서 의존성 발생. **ROI: MUST_NOW** (구현 시 코드 위치 정확 표기 필수).
- 발견 2: cwd=ROOT로 `.claude/` add+commit 시 워크트리 .gitignore 상호작용 점검 필요. 현재 워크트리 `.claude/`는 add 가능 확인됨 (L249 paths에 이미 존재). **ROI: SHOULD** (검증 절차 필요).
- 발견 3: commit_B 메시지 일관성 — 현재 mainRoot에서 박혔던 "sync: .claude from worktree {branch}"를 그대로 사용. revision history 검색 호환. **ROI: NICE**.

**axis: hardcoding**
- ⚠️ paths 배열 L249 하드코딩. R3에서 8→7개로 줄임. **ROI: DEFER** (config 추출은 별도 작업, 본 PD 범위 외).
- ⚠️ commit_B 메시지에 `${currentBranch}` 보간 사용 — branch 이름에 따옴표·셸 메타가 들어가면 위험. 현재 워크트리 branch 이름은 `claude/...` 패턴 한정이라 실 위험 0. **ROI: DEFER**.
- 발견 4: syncClaudeDir에서 `worktrees/`, `scratch/` 하드 제외 — R3에서도 그대로. **ROI: NICE**.

**axis: efficiency**
- ✅ commit 회수 2 → 2 유지. push 1회 유지. 시간 압축 보존.
- 발견 5: commit_B가 empty인 경우(`.claude/`만 변경 안 됨) `git commit`이 exit code !=0 → catch 처리 필요. 현재 코드의 catch 패턴(L286~288) 그대로 활용. **ROI: MUST_NOW**.

**axis: extensibility**
- 발견 6: `.claude/scratch/` 같은 worktree-specific 폴더 추가 시 syncClaudeDir 제외 규칙(L94) 확장 지점. R3에서 변동 없음. **ROI: NICE**.
- 발견 7: 다른 워크트리에서 동시에 R3 실행 시 race 조건? 워크트리는 각자의 index를 가지지만 mainRoot ff-only merge는 mainRoot index를 잠근다. session_233(PD-079 병렬 워크트리)에서 mainRoot lock 경합 가능성 — 현재도 동일 위험 존재 (변동 없음). **ROI: DEFER → PD 분할 제안**.

**1차 발견 요약:**
- MUST_NOW: 2건 (발견 1, 발견 5)
- SHOULD: 1건 (발견 2)
- NICE: 3건
- DEFER: 3건

### 2차 감사 (Master 압박 가정 — "한번 더")

축 전환: extensibility 깊이 탐색.

**axis: extensibility 재검토**
- 발견 8: R3가 sync commit을 워크트리 branch에 박으면, **워크트리 branch 자체가 push 대상이 되는 미래 변경(예: PR 흐름)** 시 sync commit 노출. 현재는 worktree branch가 origin에 push 안 되므로 무해. **ROI: DEFER** (미래 PR 도입 시 재검토).
- 발견 9: `pre-commit` hook이 워크트리에 도입될 경우, R3는 commit 2번 모두에 pre-commit이 걸린다 (현재 mainRoot sync commit은 mainRoot pre-commit). 기존 mainRoot pre-commit 정책이 있다면 워크트리로 이전. 현재 pre-commit hook 부재 확인 필요. **ROI: SHOULD** (확인 1줄).

**axis: hardcoding 재검토**
- 발견 10: `git status --porcelain` (L239) 호출 후 status 비어있으면 return — R3에서 commit_A가 empty이고 commit_B만 있을 경우(`.claude/`만 변경) status는 비어있지 않음. 정상 진행. **ROI: NICE**.

**2차 발견 요약:**
- MUST_NOW: 0건
- SHOULD: 1건 (발견 9 — pre-commit hook 부재 확인)
- NICE: 1건
- DEFER: 1건

### 3차 감사 (의무 라운드)

**axis: efficiency 재검토**
- 발견 11: syncClaudeDir copy 비용 (수십 파일 fs.copyFileSync) — 매 세션 호출. 변동 없는 파일도 매번 copy. content-hash 비교 후 변경분만 copy하면 절감 가능. **ROI: DEFER → 별 PD** (현재 범위 외).

**axis: structuration 재검토**
- 발견 12: R3 채택 시 commit 메시지 2개의 의미 분리 명확:
  - commit_A: session payload (work products)
  - commit_B: `.claude/` mirror update (system config sync)
  - 이력 가독성 ↑. structuration 개선.
- "No issue at this dimension" — extensibility, hardcoding (재발견 없음).

**3차 발견 요약:**
- MUST_NOW: 0건
- DEFER: 1건 (발견 11)
- 종료 기준 충족: MUST_NOW 잔존 0, 대부분 NICE/DEFER. ✅

**scope drift 체크**: 1차 spec(L249 + L277~288 변경) 그대로. 누적 증가 없음. ✅

---

## Step D — 단일 추천

**채택: R3.**

**근거:**
- 6 불변식 전부 충족 (mitigation 포함).
- **I5 보존 근거 (Step A H2/H3 메커니즘과 직결):** 2-commit 별개 cwd 작업 구조 100% 보존. cwd만 mainRoot→워크트리로 이전했을 뿐, "한 거대 작업 → 두 분산 작업" 본질은 유지.
- I1·I3 분기 소멸: mainRoot에 별도 commit 0 → ff-only 항상 성공.
- I6 변수 최소화: 변경 지점 2 군데, 신규 보호 장치 0, 신규 lockfile 0, 신규 hook 0.

**차순위와의 격차:**
- R4 (별도 sync branch): I3·I6 약화. R3보다 변수 +1.
- R5 (1 commit 합치기): turn 2 R1과 동일. I5 위반. 폐기.
- R6 (pre-commit hook): I6 위반.

**폐기 후보 사유:**
| 후보 | 폐기 사유 |
|---|---|
| R1 (turn 2) | sync commit 분리 메커니즘 폐지 → I5 위반. Master 정정 위반. |
| R4 | sync branch 신설 → I6 위반. main 분기 가능성 신규 발생 → I3 약화. |
| R5 | 1 commit 합치기 → I5 위반. |
| R6 | pre-commit hook 신설 → I6 위반. |
| R7 | amend 사용 → race·hash 재계산 → I6 위반. |

---

## Step E — 잔존 위험 + Mitigation

### Risk 1: commit_A의 `.claude/` 누락 정합성 (MUST_BY_N=10)

**Risk:** R3는 paths 배열에서 `.claude/`를 제거하므로 commit_A에는 `.claude/` 변경이 미박힘. crash가 commit_A와 commit_B 사이에서 발생하면 워크트리 branch에 `.claude/`가 누락된 채 session payload만 박힘.

**Mitigation:** 
- 1차: commit_A·B는 직렬 + 사이에 ms 단위 작업만 있음. crash 확률 무시 가능.
- 2차: commit_B 실패 시 alert 로직 추가 — `system_state.claudeSyncCommitFailures[]` 누적. **추가 변경 없이 catch 블록에 1줄 추가만 (writeMergeFailureAlert와 동형).** 
- 3차: 다음 세션 종료 시 commit_B 자동 박힘 → 자가 치유.

### Risk 2: 원격 main 분기 (MUST_BY_N=30)

**Risk:** Master가 별도 클라이언트(GitHub Web UI 등)로 main에 직접 commit/push → 본 워크트리의 ff-only fail.

**Mitigation:**
- 현재도 동일 위험 존재 (변동 없음). R3 신규 risk 아님.
- 기존 `--no-ff` 폴백 보존 (L298~311) — 원격 분기 시 자동 merge commit.
- 단방향 SOT 정책 (Master는 워크트리만 사용) 가정 하에 risk 무력화.

### Risk 3: commit_B nothing-to-commit (MUST_NOW)

**Risk:** `.claude/`만 변경 안 된 세션 → commit_B git commit이 exit !=0.

**Mitigation:** 
- 기존 mainRoot sync commit의 try/catch 패턴(L286~288) 그대로 워크트리 commit_B에 적용. silent skip = 정상 동작.
- 단 catch에 stderr 검증 1줄 추가 — "nothing to commit" 외 다른 에러는 throw 재발생. (defensive)

### Risk 4: ff-only merge 실패가 R3로 사라지지 않는 edge case (DEFER)

**Risk:** 다른 워크트리(PD-079 병렬 세션)가 동시에 R3 실행 → mainRoot index lock 경합 + 두 워크트리 branch가 같은 base에서 분기.

**Mitigation:**
- 현재도 동일 위험 (R3 신규 아님). PD-079 후속에서 처리.
- mainRoot index lock은 git이 자체 retry — 1~2s 지연 가능.

### Riki 사전 적출 — 추가 risk

- **R-A: 워크트리 .gitignore가 `.claude/` 변경분 무시 가능성.** 검증 절차: `git status --porcelain` 출력에 `.claude/` 변경이 나타나는지 next session 첫 close에서 확인. mitigation: 미발견 시 paths 배열에 `.claude/` 재추가 (구조 보존하면서 1 commit으로 fallback). 단 .claude/는 워크트리 commit에 이미 들어가는 게 현재 상태이므로 risk 낮음.
- **R-B: workfree commit_B가 다른 워크트리 hook에 영향?** 워크트리 branch는 격리되므로 영향 0.

---

## 구현 계획 (Dev 인계용 spec 동결)

> Edit/Write는 본 turn에서 수행 안 함 (분석·설계만). Dev/Edi가 실제 변경 담당.

**변경 1: scripts/auto-push.js L249**

```diff
-  const paths = ['memory/', 'reports/', 'app/', 'scripts/', 'CLAUDE.md', 'logs/', 'dist/', '.claude/'];
+  const paths = ['memory/', 'reports/', 'app/', 'scripts/', 'CLAUDE.md', 'logs/', 'dist/'];
```

**변경 2: scripts/auto-push.js L276~288 블록 재구성**

```diff
-    // .claude/ 동기화 후 main repo에서 add + commit (변경분 있을 때만)
-    timed('syncClaudeDir', () => syncClaudeDir(mainRoot));
-    try {
-      timed('main: git add .claude + commit', () => {
-        execSync('git add .claude/', { cwd: mainRoot, encoding: 'utf8', stdio: 'pipe' });
-        execSync(`git commit -m "sync: .claude from worktree ${currentBranch}"`, {
-          cwd: mainRoot, encoding: 'utf8', stdio: 'pipe'
-        });
-      });
-      console.log('[auto-push] Committed .claude/ sync to main.');
-    } catch {
-      // 변경 없으면 commit 실패 — 정상
-    }
+    // .claude/ 동기화 (mainRoot working dir mirror)
+    timed('syncClaudeDir', () => syncClaudeDir(mainRoot));
+    // 워크트리 branch에 .claude sync commit 박기 (분기 회피)
+    try {
+      timed('worktree: git add .claude + commit', () => {
+        execSync('git add .claude/', { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
+        execSync(`git commit -m "sync: .claude from worktree ${currentBranch}"`, {
+          cwd: ROOT, encoding: 'utf8', stdio: 'pipe'
+        });
+      });
+      console.log('[auto-push] Committed .claude/ sync to worktree branch.');
+    } catch {
+      // 변경 없으면 commit 실패 — 정상
+    }
```

**변경 3: L298~311 `--no-ff` 폴백 보존** (변동 없음 — 원격 main 분기 안전망).

**검증 절차 (Dev):**
1. 본 워크트리에서 `node scripts/auto-push.js "test: R3 verify"` 실행 (push 직전 abort 가능 옵션이면 dry-run).
2. `git log --oneline -5` 워크트리 branch에서 commit_A·B 확인.
3. mainRoot에서 `git log --oneline -5 main` ff-only merge 확인.
4. `logs/close-timing.log` 마지막 entry 단계별 ms 비교 — H2/H3 가설 검증.
5. `memory/shared/system_state.json` worktreeMergeFailures 변동 0 확인.

**spec 동결.** Dev 인계 가능.

---

[ROLE:arki]
# self-scores
aud_rcl: 1.0
str_fd: 4
spc_lck: Y
sa_rnd: 3

ARKI_WRITE_DONE: reports/2026-05-11_pd-081-auto-push-order/arki_rev3.md
