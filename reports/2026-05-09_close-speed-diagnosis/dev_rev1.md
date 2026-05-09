---
role: dev
session: session_228
topic: topic_191
topicSlug: close-speed-diagnosis
date: 2026-05-10
rev: 1
---

# Dev — Close 속도 원인 파악 + 1차 조치

## ① 진단 (추정, 측정 미실시)

`/close` 체인: `auto-push.js → runHookChain → 6 preSteps → build.js → git stage/commit/merge/push`.

병목 후보 Top 3:
1. **`npx ts-node` 4회 cold start (8~20s 추정)** — finalize-self-scores · compute-signature-metrics · compute-dashboard · validate-prime-directive 직렬. Windows에서 단발 부팅 2~5s/회.
2. **`build.js` dist 전량 재복사 (3~10s 추정)** — `fs.rmSync` 후 reports 13MB/763개 + memory 2.3MB/98개 동기 `copyFileSync`. incremental 없음.
3. **`compute-dashboard.ts` JSON IO (1~3s 추정)** — session_index 384KB + dashboard_data 462KB + decision_ledger 220KB 등 직렬 read/write.

**측정 인프라 부재 확인** — 단계별 timing 로그 어디에도 없음.

## ② 조치

### 조치 1 — 단계별 timing 계측 (`scripts/auto-push.js`)
- `timed(label, fn)` 헬퍼 + `process.on('exit', flushTimings)` 추가.
- 6 preSteps + syncHookDiagnostics + build.js + runHookChain(total) + git status/add/commit + syncClaudeDir + main add+commit + git merge ff/no-ff + git push (worktree/직접) 전부 wrapping.
- 출력: 콘솔 `[auto-push:timing] {label}: {ms}ms` + `logs/close-timing.log` 에 JSON 라인 누적.
- 검증: `node --check` 통과. 실제 측정치는 본 close 1회 실행으로 확보 예정.

### 조치 2 — Zero invocation gate (`scripts/check-zero-trigger.js`, 신규)
- git status + diff vs HEAD에서 in-scope(scripts/.ts·.js, .claude/hooks·skills·commands, app/.tsx, CLAUDE.md, package.json, tsconfig*) 변경 카운트.
- JSON 출력: `recommend_zero` / `in_scope_count` / `in_scope_files` / `skip_reason`.
- `.claude/commands/close.md` step 1.5 에 게이트 추가 (Grade S/A/B 한정). `recommend_zero=false`면 skip + gaps 박제 후 Edi 직행.
- 본 세션 실행 결과 `recommend_zero=true` (in-scope 2건) — 정상.

## ③ 미해결 / Master 방향 전환

- Master 피드백 — "Zero 살리고 close 줄이기" → Zero gate 롤백 여부 미결.
- 추가 후보 (보고만, 미실행): ts-node 4회 → 통합 진입점 / build.js incremental copy / git push 백그라운드.
- 다음 세션 액션: `logs/close-timing.log` 1차 측정값 분석 → 진짜 병목 확정 → 단축안 1개 적용.

## ④ 변경 파일

- `scripts/auto-push.js` (timing 계측, +60 LOC)
- `scripts/check-zero-trigger.js` (신규)
- `.claude/commands/close.md` step 1.5 (gate 1줄 추가)

```
[ROLE:dev]
# self-scores
files_chg: 3
syntax_ok: 1
verify: 1
hc_found: 0
```
