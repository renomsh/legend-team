---
role: zero
session: session_245
topic: topic_197
turnId: 4
invocationMode: subagent
date: 2026-05-13
scope: PD-079 / D-181 Phase 6+7 코드 박제 (11 파일)
---

# Zero — D.Condense 정제 보고 (session_245)

## TL;DR [T4 / A2 / O3]

본 세션 11 파일(신규 6 / 수정 5) 3 영역 점검. **must-fix 0건** · **should-fix 1건 (P5 누적 S1 6중복 격상)** · **defer-OK 6건**. apply smoke PASS·G6 9/9·G7 5/5 PASS. 본 세션 종결 readiness **PASS**. P6/P7 박제 진행 가능.

산출물 quality grade: **B+ (양호, P5 누적 simplify 부채 1건만 잔여, 본 세션 신규 부채 0)**.

## 세션 요약

P6 (자동 마이그 통합 + git commit + KPI) + P7 (e2e dry-run + 회귀 게이트) 코드 박제. D-191 발급(sha 35443a49), Master 동기 결정 5건(Q1A·Q1B·Q3·Q4·m_kpi-merge=ours) 반영. G6 9/9 PASS, G7 5/5 PASS, apply smoke PASS (migrated=1, commitSha 박제, KPI write, cleanup OK).

## 변경 파일 요약 (11건)

| # | 파일 | 종류 | 역할 |
|---|---|---|---|
| 1 | `scripts/migration-commit.ts` | 신규 | `migrate:` 커밋 + commitSha back-fill |
| 2 | `scripts/lib/auto-migrate-on-open.ts` | 신규 | `/open` step 7-c entry point |
| 3 | `scripts/lib/m-kpi.ts` | 신규 | KPI 3종 (orphan·exec rate·accuracy proxy) |
| 4 | `scripts/g6-verify.ts` | 신규 | G6 게이트 9종 |
| 5 | `scripts/g7-verify.ts` | 신규 | G7 e2e 게이트 5종 |
| 6 | `scripts/g6-apply-smoke.ts` | 신규 | apply 경로 1-shot 실측 |
| 7 | `.gitattributes` | 수정 | `m_migration_log.json`·`m_kpi.json` `merge=ours` 추가 |
| 8 | `memory/shared/m_config.json` | 수정 | `autoMigrate.timeoutMs`·`kpi.accuracySampleSize` 추가 |
| 9 | `scripts/lib/m-migration-log.ts` | 수정 | `commitSha` 필드 추가 |
| 10 | `.claude/commands/open.md` | 수정 | step 7-c "m* 자동 마이그" inject |
| 11 | `.claude/commands/open-mtopic.md` | 수정 | Phase 5/6 placeholder 제거 |
| 12 | `CLAUDE.md` | 수정 | D-191 + m* 절 추가 |

(실제 변경 12건 — 작업 컨텍스트의 "11건"은 `CLAUDE.md` 누락. 본 보고서 기준 12로 계상.)

## D.Condense 점검 (3 영역)

### 🟡 should-fix (1건 — PD 분리 권고, 본 세션 종결 비차단)

| # | 영역 | 위치 | finding | 권고 |
|---|---|---|---|---|
| S1' | simplify | `scripts/g3-verify.ts` · `g4-verify.ts` · `g5-verify.ts` · `g6-verify.ts` · `g7-verify.ts` · `g6-apply-smoke.ts` (6 파일) | 동일 패턴 6중복: `interface GateResult { id; pass; detail }` · `const results: GateResult[]` · `function record(id, pass, detail)` + `console.log` 포맷 · summary 출력 + `process.exit(1)`. 본 세션 P6/P7에서 3 파일(g6·g7·g6-apply-smoke)이 추가되며 4중복 → 6중복으로 격상. | PD 분리: `scripts/lib/gate-runner.ts` 추출 (`createGateRunner()` factory 반환 `{record, summary}` 패턴). 6 파일 일괄 마이그 후 게이트 재검증. 본 세션은 P6/P7 통과 코드라 즉시 리팩 시 6 게이트 재실행 비용. **defer to next session (별도 PD).** [T4 / A1 / O3] |

### 🟢 defer-OK (6건 — 현재 합리적, 박제 불요)

| # | 영역 | 위치 | finding | 판단 |
|---|---|---|---|---|
| D1' | simplify | `snap()`·`restore()` 패턴 2중복: `g7-verify.ts:38-47` · `g6-apply-smoke.ts:28-35` | 각 8줄. fs.existsSync + readFileSync / writeFileSync + unlinkSync. 신규 시점 2중복. | 2중복은 추상화 미달 임계. gate-runner 추출 시 함께 묶을 후보. **gate-runner PD와 통합 처리 권고.** [T4 / A1 / O3] |
| D2' | tech-debt | `processMTopic` export (`m-migration-runner.ts` from P5) | g5-verify·g7-verify가 직접 import해 게이트 검증. 의도적 API 표면 확장(전 세션 dev 보고에서 명시). | 검증 자산. P8 SOT 승격 시 private 환원 후보. **현재 합리적.** [T3 / A1 / O3] |
| D3' | tech-debt | `m-migration-runner::convertMDToOfficial` fallback (`authority:'team'` 고정, `scopeCheck:'legacy-ambiguous'` 고정) | 변환 실패 시 fallback 값이 m_migration_log entry details에 미기록. | 이전 세션 should-fix S2와 동일. 본 세션 변경 0. **gate-runner PD와 동일 PD 또는 별도 PD.** [T3 / A1 / O3] |
| D4' | security | `m-kpi.ts:58` `execSync('git worktree list --porcelain', {stdio: ['ignore','pipe','pipe']})` | shell=false 미명시. 단 인자에 외부 입력 없는 고정 literal. `git worktree list` 출력의 path basename만 신뢰 영역에서 사용. | shell injection 면역. spawnSync로 마이그 가능하나 동등 효과. **안전.** [T4 / A1 / O3] |
| D5' | security | `migration-commit.ts:48` `gitCmd()` — 모든 git 호출 spawnSync + 인자 배열 | shell injection 차단 OK. commit msg는 backtick template literal이지만 외부 입력 sanitize됨(숫자만). | **안전. Riki R-2 권고 정합.** [T4 / A1 / O3] |
| D6' | simplify | `m-kpi.ts::computeAccuracyProxy` 변수 `exceeded`/`counted` 명명 | 주석 145행 "similarity ≥ threshold against OTHER decisions = potential dedupe miss" 명시. 의도 명확. | 명명은 주석으로 보강됨. **그대로 둠.** [T3 / A1 / O3] |

### 영역별 정량 요약

| 영역 | 발견 | must-fix | PD 분리 | defer |
|---|---|---|---|---|
| tech-debt | 2 | 0 | 0 | 2 (D2'·D3') |
| security-review | 2 | 0 | 0 | 2 (D4'·D5') |
| simplify | 3 | 0 | 1 (S1') | 2 (D1'·D6') |
| **합계** | **7** | **0** | **1** | **6** |

- hardcoded secret/credential: **0건** [T4]
- 절대 경로 (`C:\`, `/Users/`, `/home/`): **0건** (11 in-scope 파일 grep 검증) [T4]
- shell injection 가능 execSync/spawnSync: **0건** (모든 git 호출 인자 배열 또는 고정 literal) [T4]
- 동적 import 경로 하드코딩 (`'./m-kpi'` 모듈명만): **안전** — path 변수 외부 입력 미관여 [T4]

## 즉시 fix 권고

**0건**. 본 세션 종결 차단 사유 없음.

## 세션 종결 readiness

**PASS** [T4 / A2 / O3]
- 신규 must-fix 0
- G6 9/9 + G7 5/5 + apply smoke PASS 검증 완료 (Master 입력 확인)
- D-191 박제 sha 35443a49 ledger 반영
- in-scope 11 파일 type 안정 (Phase 게이트 자체가 type-check 포함)

## 다음 세션 후보 (별도 PD 등록 권고)

| PD 후보 | 내용 | 우선순위 |
|---|---|---|
| PD-NEW-A | `scripts/lib/gate-runner.ts` 추출 (S1' + D1' 통합) — 6 게이트 파일 + snap/restore 헬퍼 | 중 (P8 진입 전 권고) |
| PD-NEW-B | `convertMDToOfficial` fallback 명문화 + m_migration_log details 기록 (D3' = 이전 S2 잔여) | 저 (apply 정합성 누수 미실측) |

## Self-exclusion 의무 준수

- 메타-자산(violation flag·audit trail·self-scores log) 정제 대상 0건. [T4]
- decision_ledger·topic_index SOT는 read만 (migration-commit·m-kpi). 본 페르소나 직접 write 0. [T4]
- D-146 self-exclusion SOT 정합. [T3]

```
[ROLE:zero]
# self-scores
ref_cnt: 7
hc_found: 0
cln_rt: 1.0
```

ZERO_WRITE_DONE: reports/2026-05-13_pd-069-parallel-session/condensed.md
