---
role: dev
session: session_247
topic: topic_207
topicSlug: arki-emergency-hooks
date: 2026-05-14
rev: 2
turnId: 6
invocationMode: subagent
authorship: agent
accessed_assets:
  - file: .claude/hooks/pre-tool-use-no-autonomous-decision.js
    scope: hook-source
  - file: .claude/hooks/stop-nexus-self-censor.js
    scope: hook-source
  - file: reports/2026-05-14_arki-emergency-hooks/dev_rev1.md
    scope: prior-rev-FP-analysis
---

# Dev — Hook 검증 결과 (rev2 산출 + 실증)

## 0. 본 dispatch 임무

Master 명시 (session_247): "Dev 재호출해서 산출 완성해. 그리고 훅 작동 검증 해" [T4/A2/O2]

이전 dispatch에서 hook 2종 작성 후 검증 미실행 + dev_rev2.md 박제 누락. 본 rev2가 그 gap을 정정.

## 1. 검증 결과 표 (전체 17/17 PASS)

### 1-1. Hook 2 (pre-tool-use-no-autonomous-decision.js) — 11/11 PASS

| # | 입력 user msg | tool/path | 기대 | 실측 | 결과 | exit |
|---|---|---|---|---|---|---|
| C1 | "분석해줘" | Edit on memory/shared/test.json | BLOCK | BLOCK | **PASS** | 2 |
| C2 | "왜 진행해야 하는지 설명" | Edit on memory/shared/test.json | BLOCK | BLOCK | **PASS** | 2 |
| C3 | "안 진행해" | Edit on memory/shared/test.json | BLOCK | BLOCK | **PASS** | 2 |
| C4 | "진행해" (단독) | Edit on memory/shared/test.json | PASS | PASS | **PASS** | 0 |
| C5 | "구현해줘" (단독) | Edit on memory/shared/test.json | PASS | PASS | **PASS** | 0 |
| C6 | "예" (단독) | Edit | PASS | PASS | **PASS** | 0 |
| C7 | "1" (단독) | Edit | PASS | PASS | **PASS** | 0 |
| C8 | (irrelevant) | Bash "ls -la" | PASS | PASS | **PASS** | 0 |
| C9 | (irrelevant) | Edit on tmp_foo.txt | PASS | PASS | **PASS** | 0 |
| C10 | (no transcript) | Edit on memory/foo.json | PASS-silent | PASS-silent | **PASS** | 0 |
| C11 | (irrelevant) + ENV override | Edit on memory/shared/test.json | PASS | PASS | **PASS** | 0 |

### 1-2. Stop Hook (stop-nexus-self-censor.js) — 6/6 PASS

| # | 직전 assistant 텍스트 요약 | 기대 | 실측 | 결과 |
|---|---|---|---|---|
| S1 | 단언 4건+(`3건`/`2건`/`결정`/`권고`/`확실`/`정확`/`보장`/`승인`) + 라벨 0 | flag 박제 | flag 박제 | **PASS** |
| S2 | 단언 + `[근거: ...]` 라벨 다수 | 사전 flag 클리어 | 사전 flag 클리어 | **PASS** |
| S3 | "네" (1자) | exempt (too-short) | exempt | **PASS** |
| S4 | 코드 블록만 (스트립 후 < 50자) | exempt (code-only) | exempt | **PASS** |
| S5 | 의문문만 (5라인) | exempt (questions-only) | exempt | **PASS** |
| S6 | 단언 4건 + ENV override | pass-no-flag | pass-no-flag | **PASS** |

[T4/A2/O5] — 모든 결과는 `tmp_verify/runner.js` 실행 출력 직접 캡처. 검증 명령:
```
unset NEXUS_EMERGENCY_OVERRIDE; node tmp_verify/runner.js
```
출력: `PASS: 17/17`

## 2. FAIL 케이스 분석

본 검증 cycle에서 FAIL 0건. 단, 1차 실행에서 5건 FAIL 발생 → **harness 결함** (env propagation 누수, hook 결함 아님). 정정 내역:

- 1차: `runner.js`가 `{ ...process.env, ...env }`로 spawn → 셸 `NEXUS_EMERGENCY_OVERRIDE=1`이 모든 case에 누수 → C1·C2·C3 BLOCK 미작동 + S1 flag 미박제 + S2 flag 잔존.
- 정정: `runner.js`에 inherited env에서 `NEXUS_EMERGENCY_OVERRIDE` 명시 삭제 후 caller env로만 set.
- 2차: 17/17 PASS.

[T4/A2/O3] — harness 자체의 false-FAIL 사고. dev rev1 메모리 교훈("Master 좌절 시 즉시 원복")과 별개로 본 cycle에서 즉시 식별·정정.

## 3. APPROVAL_PATTERNS 정정 근거 (Nexus FP-2 패턴 vs 본인 좁힌 패턴 diff)

### 3-1. 이전 Nexus 패턴 (FP-2 false-pass 발생)

```js
// substring 매칭 — 단어 경계 무시
const APPROVAL_PATTERNS = [
  /해줘/,        // "분석해줘" 매칭 → false-pass
  /진행해/,      // "왜 진행해야" 매칭 → false-pass
  /구현해/,
  /예/,          // 어디든 "예" 등장 시 → false-pass
  // ...
];
```

**문제 3종**:
- (a) 일반 한국어 빈출 어미 substring → 일상 발화에서도 무차별 매칭
- (b) 의문문 검출 무 → "왜 진행해?"도 통과
- (c) 부정문 검출 무 → "안 진행해"도 통과

### 3-2. 본인 (rev2) 좁힌 패턴 — 4-layer defense

**Layer 1**: Group 분리
- `APPROVAL_PATTERNS_STANDALONE` — `^\s*X\s*$` 단독 라인만 (예/네/응/OK/a-c/1-9/계속/고고)
- `APPROVAL_PATTERNS_VERB` — 어미 + 후행 정확 매칭

**Layer 2**: Lookbehind 단어 경계
```js
/(?<![가-힣A-Za-z])진행해(?:\s*줘|\s*주세요|\s*라|\s*요)?(?=[\s.!,]|$)/
```
→ "분석해줘"의 경우 `진행해`가 없으므로 매칭 0. "분석해줘"의 `해줘`도 더 이상 단독 패턴 아님.

**Layer 3**: 부정어 라인 단위 검사 (`matchVerbApproval`)
```js
const before = line.slice(Math.max(0, matchStart - 12), matchStart);
if (NEGATION_TOKENS.some(t => before.includes(t))) continue;
```
→ "안 진행해"는 매칭 위치 직전 12자 안에 `안 ` 검출 → 거부.

**Layer 4**: 의문문 라인 거부 (`QUESTION_INDICATORS`)
```js
if (QUESTION_INDICATORS.some(p => p.test(line))) continue;
```
→ "왜 진행해야 하는지 설명"의 라인은 `(^|\s)왜\s/` 매칭 → 라인 전체 스킵.

### 3-3. C1·C2·C3 차단 메커니즘 매핑

| Case | 차단 layer | 매커니즘 |
|---|---|---|
| C1 "분석해줘" | Layer 1+2 | `해줘` 단독 패턴 제거 + `진행해/구현해/...` lookbehind 단어 경계로 `분석해`에 매칭 안 함 |
| C2 "왜 진행해야..." | Layer 4 | `왜` 의문 indicator → 라인 스킵 |
| C3 "안 진행해" | Layer 3 | `진행해` 매칭 위치 직전 `안 ` → 거부 |

[T4/A2/O5] — 정정 근거는 hook 소스 L36~75 + harness 실측 동시 검증.

## 4. 잔존 risk (Riki FP-1~7 중 미해결)

| FP | 항목 | 본 rev2 처리 | 잔존 risk |
|---|---|---|---|
| FP-1 | transcript_path SDK 미보장 | C10에서 silent pass 검증 (PASS) | sage가 보고에서 SDK 보장 확인했으나 실 환경 변동 시 hook 무력화 가능. fail-safe 작동은 확인 [T4/A2/O5] |
| FP-2 | 정규식 자연어 false-pass | C1~C3 BLOCK + C4~C7 PASS 검증 (PASS) | 본 7개 case 외 패턴은 미검증. 향후 신규 false-pass 발견 시 패턴 추가 필요 [T2/A1/O3] |
| FP-3 | 응급 우회 차단 | C11·S6 ENV override 검증 (PASS) | 잔존 0 |
| FP-4 | flag 박제·클리어 race | S1 박제 + S2 사전flag→클리어 검증 (PASS) | 동시 mutation tool 호출 시 flag 일관성 미검증. 단일 thread 가정 (Claude Code SDK 보장) [T2/A1/O3] |
| FP-5 | 면제 경로 누락 | C8(Bash readonly)·C9(tmp_)·C10(no transcript) 검증 (PASS) | 미검증 면제 경로: logs/, current_session.json — 코드는 등록되어 있으나 case 미작성 [T3/A1/O3] |
| FP-6 | Stop hook 단언 패턴 over/under | S1 4건 검출 + S5 의문문 면제 검증 (PASS) | "확실/정확/보장/결정/선택/권고/채택/승인" 외 단언어 미검출 가능 [T2/A1/O3] |
| FP-7 | exempt heuristic 우회 | S3·S4·S5 면제 + S1 단언 모드 분리 검증 (PASS) | 짧은 코드 + 단언 혼합 시 (e.g. 99자 + 단언 1건) 면제 경계 boundary 미검증 [T2/A1/O3] |

**총평**: FP-1·FP-3·FP-4 잔존 risk 0~경. FP-2·FP-5·FP-6·FP-7는 개별 case 검증 외 추가 sample 필요 (별도 PD 후보).

## 5. Master 추가 결정 대기 항목

본 dev rev2 임무 외 — Nexus 처리 / 별도 PD 등록 후보:

1. **sage-gate 복원** — 이전 dispatch에서 `pre-tool-use-task-sage-gate.js` L133-140 패치는 D-073/D-105 정합. 추가 복원 필요 시 별도 토픽 [T2/A1/O3]
2. **decision_ledger 마이그 원복** — 이전 dispatch 완료. 현 rev2에서는 미터치 (확인 안 함) [T2/A1/O3]
3. **pending_deferrals 13건 점검** — sage turn 0 §축 2 발견. 별도 토픽 (resolveCondition 명기 11/13 누락) [T3/A1/O3]
4. **FP-2 패턴 확장** — 본 검증 7 case 외 false-pass 발견 시 `APPROVAL_PATTERNS_VERB` 어휘 추가 운영 [추측]
5. **harness 회귀 자동화** — `tmp_verify/runner.js`를 정식 `scripts/verify-hooks.ts`로 승격할지 Master 결정 대기 [제안]

## 6. 자기 한계 명시

- 본 rev2 검증은 17 case에 한정. **충분성 자가 판정 불가** (D-184 정합) [T4/A3/O5]
- 1차 실행 5 FAIL 발생 후 harness 결함 식별 — Riki/Master 외부 검증 없었으면 hook 결함으로 오판할 수 있었음. **자가 검증 한계 실증** [T4/A2/O3]
- write 권한 범위 준수: `.claude/hooks/*.js` 미터치, `tmp_verify/` 작성·검증 후 정리 예정, `reports/2026-05-14_arki-emergency-hooks/dev_rev2.md` 본 박제

## 7. 검증 명령 재현

```bash
cd C:/Projects/legend-team/.claude/worktrees/nifty-bartik-629613
unset NEXUS_EMERGENCY_OVERRIDE
node tmp_verify/runner.js
# Expected: PASS: 17/17
```

실행 출력은 `logs/no-autonomous-decision.log` + `logs/nexus-self-censor.log`에도 시계열 기록됨 (검증 cycle 후).

---

```
[ROLE:dev]
# self-scores
rt_cov: 1.0
gt_pas: 1.0
hc_rt: 0.0
spc_drf: 0
```

DEV_WRITE_DONE: reports/2026-05-14_arki-emergency-hooks/dev_rev2.md
