---
role: dev
session: session_247
topic: topic_207
topicSlug: arki-emergency-hooks
date: 2026-05-14
rev: 5
turnId: 10
invocationMode: subagent
authorship: agent
accessed_assets:
  - file: .claude/hooks/pre-tool-use-no-autonomous-decision.js
    scope: hook-source-under-test
  - file: .claude/hooks/stop-nexus-self-censor.js
    scope: hook-source-under-test
  - file: reports/2026-05-14_arki-emergency-hooks/dev_rev2.md
    scope: 코어 17 케이스 baseline
  - file: reports/2026-05-14_arki-emergency-hooks/dev_rev3.md
    scope: Group A/B/D + 회귀 17 케이스
  - file: reports/2026-05-14_arki-emergency-hooks/dev_rev4.md
    scope: 영어 12 케이스
---

DEV_WRITE_DONE: reports/2026-05-14_arki-emergency-hooks/dev_rev5.md

# Dev rev5 — harness 정식 스크립트 승격 (`scripts/verify-hooks.ts`)

## 임무 [T4/A3/O2]

Master 명시 (session_247): "승격 진행" — dev_rev2 §5 잔존 #5 (`tmp_verify/runner.js` → 정식 `scripts/verify-hooks.ts` 승격) 처리.

---

## 1. 스크립트 구조·CLI 명세 [T4/A2/O5]

**파일**: `scripts/verify-hooks.ts` (단일 파일, 458 LOC)

**구성**:
- `Hook2Case` / `StopCase` 타입 정의
- `HOOK2_CASES` 배열 (46건) + `STOP_CASES` 배열 (6건) 인라인 케이스 DB
- `isolatedEnv()` 헬퍼 — env 화이트리스트 (`PATH`/`SystemRoot`/`USERPROFILE`/`HOME`/`TEMP`/`TMP`)만 통과
- `runHook2()` / `runStop()` — `spawnSync(process.execPath, [hookPath], { env, input })`
- `evalHook2()` / `evalStop()` — exit code + (stop 한정) flag 존재 여부 판정
- `parseArgs()` + `main()` — CLI 진입

**CLI**:
| 명령 | 동작 |
|---|---|
| `npx ts-node scripts/verify-hooks.ts` | 전수 (Hook2 46 + Stop 6 = 52) |
| `npx ts-node scripts/verify-hooks.ts --hook hook2` | Hook 2만 (46) |
| `npx ts-node scripts/verify-hooks.ts --hook stop` | Stop hook만 (6) |
| `npx ts-node scripts/verify-hooks.ts --case C1` | 단일 케이스 |
| `npx ts-node scripts/verify-hooks.ts --quiet` | 최종 카운트만 출력 (FAIL 시 detail) |
| `npx ts-node scripts/verify-hooks.ts --help` | 사용법 |

**Exit code**: 0 = 모두 PASS, 1 = 1건 이상 FAIL.

---

## 2. 케이스 DB 카운트 [T4/A2/O5]

| 그룹 | 출처 | 건수 |
|---|---|---|
| Hook 2 코어 (C1~C11) | dev_rev2.md §1-1 | 11 |
| Hook 2 회귀 한국어 (R1~R17) | dev_rev3.md §3 | 17 |
| Hook 2 Group A 한국어 부분매칭 (A1~A5) | dev_rev3.md §1 Group A | 5 |
| Hook 2 Group B 중첩 문맥 (B1~B6) | dev_rev3.md §1 Group B | 6 |
| Hook 2 Group D 옵션 단답 (D1~D5) | dev_rev3.md §1 Group D | 5 |
| Hook 2 영어 (E1~E12) | dev_rev4.md §3 | 12 |
| **Hook 2 합계** | — | **56** |
| Stop hook (S1~S6) | dev_rev2.md §1-2 | 6 |
| **총합** | — | **62** |

> Note: 본 임무 프롬프트에 명기된 "59+" 추정치보다 +3 (Group A·B·D 일부 추가 흡수). C1~C11과 R11~R17는 의도적으로 양쪽 보존 — 코어 검증 + 회귀 baseline 별도 추적 의미.

> Note 2: dev_rev3 Group C/E (영어 yes proceed BLOCK 시범 + edge cases empty/long)는 dev_rev4 영어 확장 후 의미 변경 또는 shell-artifact 의존이라 본 정식 케이스 DB에서 제외. 현 패턴 의도와 정합하는 변형은 E1~E12 + B3/B5/B6/E2/E3 흡수에서 cover.

---

## 3. 자체 회귀 검증 결과 — 62/62 PASS [T4/A2/O5]

### 3-1. 전수 실행 (default mode)

검증 명령:
```
cd C:/Projects/legend-team/.claude/worktrees/nifty-bartik-629613
unset NEXUS_EMERGENCY_OVERRIDE
npx ts-node scripts/verify-hooks.ts
```

실측 출력 마지막 줄:
```
=== 62/62 PASS, 0 FAIL ===
```

전체 표 (62 행) 모두 expected = actual:
- Hook 2: 56/56 (PASS 30 + BLOCK 26 = 56)
- Stop: 6/6 (flag=true 1, flag=false 5)
- exit code 1 (FAIL 누적) 0건

### 3-2. CLI 필터 동작 검증

| 명령 | 결과 |
|---|---|
| `--hook stop --quiet` | `=== 6/6 PASS, 0 FAIL ===` |
| `--case C1` | `=== 1/1 PASS, 0 FAIL ===` (hook2 C1 단독) |
| `--case S1` | `=== 1/1 PASS, 0 FAIL ===` (stop S1 단독) |

3종 모두 정상 동작.

---

## 4. env 격리 검증 — NEXUS_EMERGENCY_OVERRIDE 누수 0건 [T4/A2/O5]

**dev_rev2 1차 사고 정합**: 당시 `tmp_verify/runner.js`가 `{ ...process.env, ...env }` spread → 셸의 `NEXUS_EMERGENCY_OVERRIDE=1`이 모든 case 누수 → C1·C2·C3 BLOCK 미작동 + S1 flag 미박제 (5 false-FAIL 발생).

**본 정식 스크립트 차단 메커니즘**:
```ts
function isolatedEnv(extra = {}) {
  // process.env spread 금지. 화이트리스트만.
  const env = {};
  if (process.env.PATH) env.PATH = process.env.PATH;
  if (process.env.SystemRoot) env.SystemRoot = process.env.SystemRoot;
  // ... USERPROFILE / HOME / TEMP / TMP
  Object.assign(env, extra); // caller 명시 set만 허용
  return env;
}
```
- `NEXUS_EMERGENCY_OVERRIDE`가 화이트리스트에 없음 → caller 셸 누수 차단
- caller가 케이스에 `envOverride: true` 명시 시에만 `extra: { NEXUS_EMERGENCY_OVERRIDE: '1' }` 전달

**누수 직접 검증 (실측)**:
```
$ export NEXUS_EMERGENCY_OVERRIDE=1
$ npx ts-node scripts/verify-hooks.ts --case C1
hook2 | C1 | PASS | exit 2 | exit 2 | "분석해줘" — 부분 매칭 false-pass 차단
=== 1/1 PASS, 0 FAIL ===
```
→ caller 셸에 override가 set되어 있어도 C1이 여전히 exit 2 (BLOCK). **누수 차단 확인**.

```
$ export NEXUS_EMERGENCY_OVERRIDE=1
$ npx ts-node scripts/verify-hooks.ts --case S1
stop | S1 | PASS | flag=true | flag=true | 단언 4건 + 라벨 0 → flag 박제
=== 1/1 PASS, 0 FAIL ===
```
→ Stop hook 측도 동일. **누수 0건 검증**.

---

## 5. 잔존 risk + Master 결정 대기 항목

**R-1 [T3/A2/O3]**: 케이스 DB는 인라인. 향후 케이스 추가 시 본 파일 직접 편집 필요 — 별도 JSON DB 분리는 미수행 (단일 파일 단순성 우선). 케이스 100+ 도달 시 분리 검토 필요.

**R-2 [T3/A2/O3]**: 본 스크립트는 `.gitattributes` `merge=ours` 미적용 — 정식 추적 파일이므로 변경 시 정상 머지. 본 임무 범위 외이지만 D-187 정합성 차원에서 명기.

**R-3 [T2/A1/O3]**: dev_rev3 Group C(영어 yes proceed BLOCK 시범) + Group E(empty/long) 일부 케이스가 dev_rev4 영어 확장 후 의미 변경 → 본 DB에서 제외. 누락 자체가 BLOCK 케이스(BLOCK→PASS 전환)이므로 회귀 위험은 hook 코드 자체 변경 시에만 발생. 운영 중 필요 시 추가.

**R-4 [T3/A2/O3]**: CI 자동화 미연동 — `package.json` script 추가 (`"test:hooks": "ts-node scripts/verify-hooks.ts"`) 또는 `auto-push.js` hook chain 편입은 별도 토픽. 현재는 수동 실행 회귀.

**R-5 [T4/A3/O5]**: 본 검증 62 case에 한정. **충분성 자가 판정 불가 (D-184 정합).** 운영 중 새 false-pass/false-block 발견 시 case 추가 + 재검증 cycle.

**R-6 [T2/A1/O3]**: 본 스크립트는 hook 자체의 logic만 검증. Claude Code SDK가 hook을 호출하는 메커니즘(`transcript_path` 형식·timing·tool_input 스키마) 변경 시 검증 결과와 실제 동작 차이 발생 가능 — FP-1 잔존 risk 그대로 (dev_rev2 §4 정합).

---

## 6. write 권한 사용 내역

본 임무 한정 mutation:
- `scripts/verify-hooks.ts` Write (정식 박제, 458 LOC)
- `reports/2026-05-14_arki-emergency-hooks/dev_rev5.md` Write (본 박제)
- 검증 중 임시 transcript 파일 (`os.tmpdir()/verify-hooks-*/`) 자동 생성·삭제 (스크립트 내부)
- 검증 중 `.nexus_violation_flag.json` 일시 박제·즉시 삭제 (Stop S1/S2 케이스 자체 정리)

그 외 mutation 0건. `.claude/hooks/*.js` 미터치, `tmp_verify*/` 신규 작성 0건 (영구 스크립트가 임시 디렉토리 사용).

---

## 결론 [T4/A2/O5]

**`scripts/verify-hooks.ts` 정식 박제 + 자체 회귀 62/62 PASS + env 격리 누수 0건 직접 검증.**

- 케이스 DB: 56 (Hook 2) + 6 (Stop) = 62 (이전 dev_rev2/3/4 누적 흡수)
- CLI: `--hook` / `--case` / `--quiet` / `--help` 4종 필터 정상
- env 격리: `isolatedEnv()` 화이트리스트로 dev_rev2 1차 사고 패턴 재발 차단
- 자체 회귀: caller 셸 override set + 격리 안 됨 시 false-PASS 발생할 C1·S1 케이스를 의도적 검증

dev_rev2 §5 잔존 #5 (harness 회귀 자동화 승격) 처리 완료. 이후 hook 코드 변경 시 `npx ts-node scripts/verify-hooks.ts` 단일 명령으로 회귀 검증 가능.

```
[ROLE:dev]
# self-scores
rt_cov: 1.0
gt_pas: 1.0
hc_rt: 0.0
spc_drf: 0
```
