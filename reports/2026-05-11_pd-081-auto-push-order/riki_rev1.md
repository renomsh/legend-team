---
turnId: 3
invocationMode: subagent
role: riki
topic: topic_199
session: session_236
date: 2026-05-11
rev: 1
---

# Riki (turn 1) — R3 risk 점검 + 실측 발화 검증

## 결론 (TL;DR)

**R3 spec 보강 권고 (조건부 수용).** 실측 발화 메커니즘을 R3가 **부분적으로만** 차단한다. 핵심 발화 원인은 Arki가 식별한 "ff-only 분기" 자체가 아니라 **두 commit이 동일 파일을 양쪽 working tree에서 동시 편집한 데서 온 3-way merge 충돌**이었다. R3는 이를 차단하지만, Arki turn 3가 시간 압축 보존(I5)을 위해 유지한 **"2개의 별개 commit" 구조 자체에 잔존 충돌 표면이 남아 있다**. + 신규 risk 2건 적출.

**판정 매트릭스:**

| 항목 | 판정 | 근거 |
|---|---|---|
| 실측 8b40141 메커니즘 차단 | ⚪ **차단** | R3에서 mainRoot working tree가 sync 편집을 받지 않음 → 동일 파일 양쪽 편집 시나리오 소멸 |
| Arki R1 (commit_A·B 사이 crash 자가치유) | ⚠ **약함** | retry 메커니즘 명세 없음. 다음 close 자동 회복 가정은 검증 없음 |
| Arki R2 (원격 main 분기) | ⚠ **fallback 의존** | `--no-ff` 코드가 R3에서도 살아 있어야 — Arki는 dead code화 가능성 시사. 실제 spec 명시 필요 |
| Arki R3 (commit_B empty silent skip) | ⚪ OK | git의 자연스러운 동작 |
| Arki R4 (병렬 워크트리 mainRoot index lock) | 🔴 **부분 해소만** | R3는 mainRoot index 쓰기 자체를 제거 → lock contention은 해소. 단 syncClaudeDir copy 자체의 race는 잔존 |
| Arki R-A (`.claude/` gitignore) | ⚪ **해소** | `.gitignore` 실측: `.claude/worktrees/`, `.claude/scratch/`만 ignore. `.claude/` 본체는 추적 가능 |
| Riki 신규 R-N1 | 🟡 | sync commit이 워크트리 branch에 박힘 — PR 흐름·squash merge 시 .claude/ 변경 history 분기 |
| Riki 신규 R-N2 | 🔴 | I5 (시간 압축 보존) 단언 자체의 실측 부재 — H2/H3 가설 단계 |

---

## Step 1 — 실측 발화 메커니즘 정밀 해부 (commit 8b40141)

### 1.1 git history 실측

```
*   8b40141 merge: resolve session_234 state conflicts — worktree version adopted
|\
| * 0945eab session end: pd-069-parallel-session   ← 워크트리 commit (.claude/ 포함하지 않음)
* eb3aaa9 sync: .claude from worktree claude/relaxed-fermat-7e8973  ← mainRoot sync commit
* 686f4ba session end: auto
```

merge parents: `eb3aaa9 0945eab`. 두 commit이 **별개 base**에서 분기 → ff-only 불가 → `--no-ff` merge → 충돌 발생.

### 1.2 충돌 파일 실측

`git diff eb3aaa9 0945eab --stat`:
- `eb3aaa9` (mainRoot sync): `.claude/settings.json` -4 lines (post-tool-use-skill-index-hash.js hook 제거)
- `0945eab` (워크트리 session end): **`.claude/` 전혀 건드리지 않음.** memory/, logs/, reports/, app/, dist/ 22 files

**.claude/settings.json 충돌? — 의외의 사실:** `0945eab`는 `.claude/settings.json`을 건드리지 않았다. `git show 0945eab -- .claude/settings.json`이 빈 출력. **그러면 충돌이 어디서?**

### 1.3 실제 충돌 메커니즘

`eb3aaa9`가 mainRoot에서 commit되는 동안, `0945eab`가 워크트리에서 commit되었다. 둘 다 별개 base(686f4ba)에서 분기했다. 워크트리 commit은 22개 파일을 변경했지만, 이 파일들이 mainRoot에 **이미 존재**하거나 **mainRoot의 syncClaudeDir 작업 직전 상태**와 달라서 merge 시 **3-way merge가 트리거**되었고, `.claude/settings.json` 외에도 `memory/sessions/current_session.json`, `memory/shared/system_state.json` 등 양쪽이 모두 갱신한 SOT 파일에서 충돌이 발생한 것으로 추정.

**다만 정확한 충돌 파일 목록은 git history에 박제되지 않음** (resolve 후 `--no-ff` merge로 commit). Master가 "worktree version adopted"라고 메시지에 명시한 것이 유일한 증거.

### 1.4 핵심 발화 원인 정리

| 원인 후보 | 검증 |
|---|---|
| ① mainRoot에 별도 sync commit 박힘 (eb3aaa9) | ✅ **실측 확인** — 이게 분기를 만들었다 |
| ② 워크트리 commit과 mainRoot commit 시점 race | ✅ 두 commit이 **1초 차이** (20:33:16 vs 20:33:17) — Arki turn 3 R4 (병렬 index lock)의 실증 |
| ③ syncClaudeDir이 mainRoot 파일을 dirty 만들어 working tree 오염 | ⚠ 가능성. 단, 본 사례에서는 `.claude/settings.json`만 변경 |
| ④ Master 수동 편집 개입 | ❌ commit 시각·메시지로 보아 자동화 |

**결론: ① + ② 동시 작용.** PD-081은 진짜 발화 사례. 이론 표면 아님.

---

## Step 2 — R3가 실측 발화를 차단하는가

### 2.1 차단 메커니즘 검증

R3 적용 시 동일 시나리오:
1. 워크트리 commit_A — memory/, logs/, reports/ (22 files, `.claude/` 제외)
2. syncClaudeDir copy → 워크트리 `git add .claude/` + commit → commit_B (`.claude/settings.json` -4 lines)
3. mainRoot에서 `git merge --ff-only` ← **별도 sync commit 없음**. mainRoot main HEAD는 워크트리 base와 같은 줄.

**판정: ⚪ 차단 성공.** 핵심 원인 ① (mainRoot 분기 commit) 소멸. 원인 ② (race) — mainRoot index 쓰기 자체가 사라져 lock contention 무력화.

### 2.2 잔존 표면

**🟡 잔존:** R3는 syncClaudeDir copy는 유지한다 (mainRoot working dir mirror용). 이때 mainRoot working tree가 dirty 상태가 되고, 이어지는 `git merge --ff-only`가 working tree 변경을 가져온다.

git의 ff-only merge는 working tree에 uncommitted 변경이 있으면 **거부**한다 ("Your local changes would be overwritten"). Arki는 "syncClaudeDir이 만든 dirty가 ff-only로 흡수된다"고 단언했으나 — **이는 git 동작과 충돌**. syncClaudeDir 결과가 워크트리 commit_B와 완전히 동일하면 dirty 자체가 발생하지 않지만, 만약 mainRoot에 다른 클라이언트가 동시 수정했다면 conflict 동일 발생.

**보강 권고:** R3 구현 시 syncClaudeDir 호출 시점을 commit_B 박은 **이후** + merge **이전** 으로 재배치하면 working tree dirty 시간 0. 또는 syncClaudeDir 자체 제거 후 merge가 자연스럽게 mainRoot working dir에 반영하도록 하는 게 더 안전.

---

## Step 3 — Arki turn 3 사전 적출 risk 비판적 재검토

### R1 (commit_A·B 사이 crash → 자가 치유) — ⚠ 약함

**Arki 단언:** "다음 close에서 자가 회복".
**Riki 검증:** 자가 회복 경로 명세 없음. commit_A 박힌 후 commit_B 전에 crash → 다음 close 시 `git status`가 `.claude/`만 변경으로 인식 → 다시 paths에서 `.claude/`만 add → 정상 commit. 이 경로는 그럴듯하나 **실측 부재**.

**mitigation:** R3 구현 후 crash injection 테스트 (commit_A 직후 강제 kill → next close 동작 관찰). fallback: commit_A·B를 단일 transaction으로 묶을 수 없으므로, 최악의 경우 commit_B 누락 → push되지 않음 → 다음 close에서 회복.

### R2 (원격 main 분기) — ⚠ fallback 의존

**Arki 단언:** `--no-ff` 폴백 보존.
**Riki 검증:** 현재 코드(L298~311)는 ff-only 실패 시 `--no-ff` 재시도. R3가 분기 자체를 제거한다고 단언했으나, **외부 origin 분기 (Master 다른 머신에서 작업)**는 R3로 차단 불가. 이때 ff-only 실패 → `--no-ff` merge → 새 충돌 가능.

**mitigation:** L298~311 코드 R3에서도 그대로 유지. Arki spec에 명시 권고.

### R3 (commit_B empty silent skip) — ⚪ OK

git의 자연스러운 동작. `git commit` exit code 1이지만 try/catch로 흡수. 문제 없음.

### R4 (병렬 워크트리 mainRoot index lock) — 🔴 부분 해소

**Arki 단언:** "Master 시간차 운영으로 무력화. PD-079 후속."
**Riki 검증:** 실측 8b40141이 정확히 이 시나리오 (1초 차이 race). Master 운영 패턴 의존 안전성. R3는 mainRoot `git add/commit`을 제거하므로 mainRoot index lock 자체가 사라짐 → **해소 진입**.

**잔존:** syncClaudeDir copy는 여전히 mainRoot 파일시스템에 쓴다. 두 워크트리가 동시에 copy하면 file overwrite race 가능. 단, copy는 atomic per file이고 destination이 같으므로 결과는 last-writer-wins로 수렴 → critical 아님.

**mitigation:** syncClaudeDir copyDir 내부에 file write를 atomic rename으로 변경 권고 (write to tmp, then rename). fallback: 충돌 시 다음 close에서 정상화.

### R-A (`.claude/` gitignore) — ⚪ 해소

**실측:** `.gitignore`에 `.claude/worktrees/`, `.claude/scratch/`만 ignore. `.claude/` 본체와 `.claude/settings.json`, `.claude/hooks/` 등은 추적 정상. commit 가능.

---

## Step 4 — Riki 신규 risk 적출

### 🟡 R-N1. 워크트리 branch에 박힌 sync commit이 미래 PR 흐름을 오염

**근거:** R3는 commit_B (.claude sync)를 워크트리 branch tip에 박는다. 만약 미래에 GitHub PR 흐름 도입·squash merge 정책 채택 시, 워크트리 branch의 모든 commit이 squash되면서 `.claude/` 변경 history가 main 단일 commit에 압축된다. 현재 mainRoot sync commit 구조는 `.claude/` 변경을 독립 commit으로 보존해 `git log .claude/`로 추적 가능했다.

**실패 시 파손:** `.claude/settings.json` 회귀 추적 곤란. 어떤 세션이 어떤 hook 추가/제거를 했는지 history 손실.

**mitigation:** commit_B의 commit message에 `[claude-sync]` 태그 강제 + commit_B를 squash 제외 마커로 표기. 또는 commit_B만 별도 PR로 분리 (현재 자동화 흐름과 정합). fallback: squash 정책 도입 시 재설계.

### 🔴 R-N2. I5 (시간 압축 보존) 단언 자체가 가설 단계 — 실측 없이 채택 시 R3 후 시간 증가 가능

**근거:** Arki turn 3 §A는 `logs/close-timing.log` 부재를 인정하면서도 H2(git index lock 경합 회피) + H3(별개 cwd OS 캐시) 가설로 I5 충족 단언. 단 R3는 **commit 2를 워크트리 cwd 단독에서 실행** — 이는 H2/H3의 "별개 cwd" 전제를 부분만 충족 (두 commit이 같은 워크트리 index에 박힘). 만약 시간 압축 원천이 진짜 H2 (워크트리·mainRoot index 분리)였다면 R3는 압축 효과 일부 손실. 만약 다른 메커니즘 (Master 미식별)이었다면 R3 자체가 무력화.

**실패 시 파손:** R3 채택 후 close 시간이 현재보다 증가 → Master 실측 가설 (sync commit 분리가 시간 단축) 검증 실패 → R3 롤백 필요.

**mitigation:**
1. R3 구현 전 `logs/close-timing.log` **3회 이상 수집** (현재 구조에서). 단계별 ms 측정.
2. R3 구현 후 **동일 3회 수집**. 비교.
3. 압축 효과 50% 이상 손실 시 즉시 롤백. fallback: 원 구조 유지하면서 PD-081 차단 위해 `--no-ff` merge에 의존 (현재 코드 그대로) — 단 충돌 발생 시 Master 수동 개입은 유지됨.

**확신 근거:** Master가 PD-081 등록 시 "시간 압축 때문에 만들었다니까"라고 명시했지만 — **시간 압축 효과의 정량 데이터는 없다.** Master 체감 기반. Arki는 이를 H2/H3로 합리화했으나 검증 0. Riki는 이 단언 자체를 의심한다.

---

## Step 5 — 전제 감사

### I5 단언 — 🔴 약함 (R-N2 동)

H2/H3 가설은 plausible하나 실측 0. Arki 자체도 §A.1에서 "본 분석은 실측 부재 인정"이라고 명문화. 그럼에도 I5 충족을 단언한 것은 **가설을 결론으로 격상한 논리적 비약**.

### I3 (ff-only 100%) — ⚠ 운영 패턴 의존

**Arki 단언:** "Master 운영 패턴으로 외부 분기 무력화."
**Riki 검증:** Master가 미래에 다른 머신·다른 클라이언트에서 main 직접 편집 가능성 0% 단언 불가. Master 운영 실수로 mainRoot에서 hot fix commit 박을 가능성도 있음. 이 경우 ff-only 실패 → `--no-ff` fallback 의존 → 충돌 위험 부활.

**mitigation:** R3 구현 시 ff-only 실패 후 `--no-ff` 코드 (L298~311) **반드시 유지**. Arki spec에 dead code화 가능성 시사한 부분 삭제 권고.

### I2 (working tree clean) — ⚠ syncClaudeDir 동작 미검증

위 Step 2.2 참조. syncClaudeDir이 mainRoot working dir에 변경을 만들면 ff-only가 거부될 수 있다. Arki는 "ff-only가 흡수한다"고 단언했으나 git 동작과 충돌. 보강 필요.

---

## Step 6 — 종합 권고

### R3 spec 보강 의무 항목

1. **syncClaudeDir 호출 시점 재배치** — commit_B 박은 이후, merge 이전. 또는 syncClaudeDir 자체를 merge에 위임.
2. **L298~311 `--no-ff` fallback 유지 명시.** Arki spec의 dead code화 시사 삭제.
3. **`logs/close-timing.log` 실측 수집을 R3 채택 전제로 추가.** 3회 수집 → R3 구현 → 3회 비교. 시간 압축 효과 검증 없이 R3 채택 금지.
4. **R-N1 commit message 정책** — `[claude-sync]` 태그 또는 PR squash 제외 마커.

### Master 의사결정 지원

- R3 자체 구조는 PD-081 핵심 발화를 차단한다. ⚪ 채택 가치 있음.
- 단, Arki turn 3의 자신감 (불변식 6개 모두 ⚪)은 **과도**. I5는 가설, I3는 운영 패턴 의존, I2는 미검증.
- Riki 권고: **R3 채택하되 위 4개 보강 항목 spec에 박제 후 구현.** close-timing.log 실측 데이터 없이 채택은 R-N2 위험.

---

```
[ROLE:riki]
# self-scores
crt_rcl: 0.75
cr_val: Y
prd_rej: N
fp_rt: 0.10
```

RIKI_WRITE_DONE: reports/2026-05-11_pd-081-auto-push-order/riki_rev1.md
