---
role: zero
session: session_244
topic: topic_197
turnId: 9
invocationMode: subagent
date: 2026-05-13
scope: PD-079 / D-181 m* 시스템 Phase 1~5 in-scope 23 파일
---

# Zero — D.Condense 정제 보고 (session_244)

## TL;DR

본 세션 23 in-scope 파일에 대해 3 영역(tech-debt · security-review · simplify) 점검.
**must-fix 0건** · **should-fix 2건** · **defer-OK 5건**. in-scope 파일 type 에러 0. P6/P7 진입 가능.

압축 자체는 본 보고서가 신규 보고서이므로 N/A (Phase A 압축 대상은 다른 역할의 rev 파일). 본 세션 산출물 quality grade: **B+ (양호, 일부 리팩 부채 명시)**.

## 점검 결과 (severity · 영역 · 위치 · 발견 · 권고)

### 🟡 should-fix (2건 — PD 분리 권고)

| # | 영역 | 위치 | finding | 권고 |
|---|---|---|---|---|
| S1 | simplify | `scripts/g3-verify.ts`, `g4-verify.ts`, `g5-verify.ts` | 동일 패턴 4중복: `interface GateResult`, `const results`, `function record(id, pass, detail)`, `function snapshotFile()` — 3 파일 모두 verbatim. g5만 `snapshot`(별칭) 1곳. | PD 분리: `scripts/lib/gate-runner.ts` 추출 → 3 파일에서 import. 본 세션은 Phase 게이트 통과 코드라 즉시 리팩하면 게이트 재검증 비용 발생. **defer to next session.** |
| S2 | tech-debt | `scripts/lib/m-decision-write.ts` `MDecisionDraft` (공식 9 필드 옵셔널화) + `scripts/lib/m-migration-runner.ts` `processMTopic` export 승격 | dev 보고에서 명시한 의도적 API 표면 확장(검증 위해). 공식 SOT 승격 시 옵셔널 필드 복원 필요. 현재 마이그 runner의 `convertMDToOfficial`이 `'confirmed'` 고정 + `'legacy-ambiguous'` fallback으로 정합성 누수 의심. | mD→D 변환 시 `status`/`scopeCheck` fallback 명문화 — `m_migration_log` details에 fallback 사용 여부 기록. **PD 분리 처리.** |

### 🟢 defer-OK (5건 — 현재 합리적, 박제 불요)

| # | 영역 | 위치 | finding | 판단 |
|---|---|---|---|---|
| D1 | simplify | `safeReadJson<T>` 중복 정의: `m-id-generator.ts`, `m-lock.ts`, `migration-preview.ts`, `m-migration-runner.ts` (4곳) | 모두 동일한 5줄 try/catch 패턴. `scripts/lib/utils.ts`에 비슷한 `readJson()`이 있으나 default 인자 시그니처 다름. | 4중복이지만 각 5줄·외부 의존 0. 추상화 시 import 그래프만 늘어남. **그대로 둠.** |
| D2 | tech-debt | `m-decision-write.ts:107` `appendMDecision` CLI block, `m-pd-write.ts:127` 동일 패턴, `m-namespace-paths.ts:38`, `m-worktree-id.ts:38`, `atomic-write.ts:47`, `m-config.ts:55`, `similarity.ts:51`, `m-id-generator.ts:73`, `m-lock.ts:86`, `m-migration-log.ts:78`, `m-schema-validator.ts:179`, `migration-preview.ts` 부재, `m-migration-runner.ts:314`, `m-cross-check.ts` 부재 — 12개 lib 모듈 중 10개에 `if (require.main === module)` CLI smoke block. | 각 모듈 단독 실행 검증 자산. 게이트 검증·디버깅에 사용. | **그대로 둠** — debt 아님, 운영 자산. |
| D3 | security | `m-worktree-id.ts:22` `execFileSync('git', ['rev-parse', '--show-toplevel'])` | git 호출은 인자 배열 분리 → shell injection 방지 OK. wid가 후속 path 컴포넌트로 사용되지만 git toplevel 반환값은 신뢰 가능(공격자 통제 영역 아님). | **안전.** |
| D4 | security | `create-mtopic.ts:78` `slugify(title)` — title은 외부 입력. slugify는 `[^a-z0-9가-힣\s-]` 제거 + slice(0,50) | path traversal 가능 문자(`.`, `/`, `\`) 제거됨. trim + space→`-`. | **안전.** path 컴포넌트로 안전 사용. |
| D5 | simplify | `scripts/g3-verify.ts:195` `execSync(\`npx ts-node scripts/create-mtopic.ts "G3-5 schema compat test" g3-5-test A\`)` — title은 literal이지만 백틱 안. | 게이트용 고정 문자열. 외부 입력 미포함. | **안전.** 단 패턴상 cmd injection 우려 0(고정 literal). |

## 영역별 정량 요약

| 영역 | 발견 | 즉시 fix | PD 분리 | defer |
|---|---|---|---|---|
| tech-debt | 2 | 0 | 1 (S2) | 1 (D2) |
| security-review | 3 | 0 | 0 | 3 (D3·D4·D5) |
| simplify | 2 | 0 | 1 (S1) | 1 (D1) |
| **합계** | **7** | **0** | **2** | **5** |

- hardcoded secret/credential: **0건**
- 절대 경로 (`C:\`, `/Users/`, `/home/`): **0건** (in-scope)
- path traversal 가능 외부 입력: **0건** (slugify 정상)
- shell injection 가능 execSync: **0건** (execFileSync 인자 분리 + execSync는 고정 literal)

## 검증

- in-scope 23 파일 type-check: 통과 (`npx tsc --noEmit` 결과 in-scope 파일 에러 0)
- 기존 out-of-scope 파일(`verify-growth-phase0/1.ts` 등) type 에러는 본 세션 무관
- 산출물 quality grade: **B+ (양호, 일부 리팩 부채 명시)**

## 다음 세션 진입 가능성

P6/P7 진입 가능. **즉시 fix 0건** 이므로 본 세션 산출물은 그대로 박제. S1·S2는 별도 PD 등록 후 처리.

## Self-exclusion 의무 준수

- 메타-자산(violation flag·audit trail·self-scores log) 정제 대상 0건.
- decision_ledger SOT는 read만 (m-cross-check, migration-preview, m-migration-runner). 본 페르소나 직접 write 0.

```
[ROLE:zero]
# self-scores
ref_cnt: 7
hc_found: 0
cln_rt: 1.0
```
