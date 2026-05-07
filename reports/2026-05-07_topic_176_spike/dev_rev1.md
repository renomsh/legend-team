---
turnId: 5
invocationMode: subagent
role: dev
phase: spike
topic: topic_176
session: session_206
date: 2026-05-07
---

# Dev — Spike R-6 결과 (PostToolUse Task race 검증)

DEV_WRITE_DONE: reports/2026-05-07_topic_176_spike/dev_rev1.md

## 1. 무엇을 만들었는지

1. **`scripts/spike-r6-task-race.ts`** — 5 시나리오 통합 spike runner. `child_process.spawn`으로 실제 `post-tool-use-task.js`를 외부 프로세스로 다회 동시 호출, turns[] 변화·중복 turnIdx·lost write·timing overlap 측정. 백업/원복 자동.
2. **`.claude/hooks/post-tool-use-task.js`** — `SPIKE-R6 START/END` 마커 사이 임시 박제 추가. `SPIKE_R6_LOG` 환경변수 설정 시 hook-entry, turns-read-before, turns-read-after, turns-write-before, turns-write-after 5 시점 timestamp(`process.hrtime.bigint`) + pid를 JSONL append. 미설정 시 no-op (운영 영향 0).
3. **결과 산출물** — `reports/2026-05-07_topic_176_spike/spike_results.json` (5 시나리오 raw + verdict) + `timing.jsonl` (S5 raw timing).

## 2. 어떻게 실행하는지

```
npx ts-node scripts/spike-r6-task-race.ts
```

D2 정합: 외부 라이브러리 description 신뢰 금지 — stdlib(`child_process`, `fs`)만 사용. ts-node 직접 실행 검증 완료(첫 시도 TS18048 4건 + TS2345 1건 → non-null assertion 패치 후 통과).

하드코딩 회피: 모든 경로는 `process.cwd()` 기반. config 외부화는 향후 옵션이지만 현재 spike에선 cwd 기반이 충분.

## 3. 5 시나리오 실행 결과 (raw)

| ID | 시나리오 | concurrent | expected | observed | lost | dup | overlaps | race |
|---|---|---|---|---|---|---|---|---|
| S1 | 2개 동시 dispatch | 2 | 2 | 2 | 0 | 0 | 0 | **N** |
| S2 | 5개 동시 dispatch | 5 | 5 | 5 | 0 | 0 | 0 | **N** |
| S3 | 계단식 5회 (100ms 간격) | 5 | 5 | 5 | 0 | 0 | 0 | **N** |
| S4 | **적대적 10개 동시** | 10 | 10 | **5** | **5** | 0 | **7** | **Y** |
| S5 | hook 5개 + 외부 write 병렬 | 5 | 5 | **4** | **1** | 0 | 1 | **Y** |

**판정 임계 (5건 중 1건 이상 양성): 양성 2건 → POSITIVE.**

### S4 raw evidence (적대적 10 동시)
- pids: `18120,16180,22920,13552,24432,12528,6036,13700,20708,7264`
- 모든 10 프로세스 exit code 0 (즉, 각 hook은 "성공" 보고)
- start times (ms relative): `0, 10, 20, 33, 47, 62, 78, 95, 111, 128`
- end times: `185, 185, 190, 185, 210, 211, 247, 246, 261, 278`
- 시작 0~128ms 사이 10개 spawn, 종료 185~278ms — **모두 시간상 겹침** (read-write 구간 7쌍 overlap 검출)
- 결과: turns[] +5 (10 중 5 lost) — last-writer-wins로 중간 write 5건 덮어씀
- duplicate turnIdx 0인 이유: read-modify-write이므로 같은 turnIdx를 두 프로세스가 쓰면 두 번째가 첫 번째를 덮어씀 (eviction이지 duplication 아님)

### S5 raw evidence (외부 write 충돌)
- hook 5개 + 외부 프로세스 5ms 간격 20회 touch write 동시 실행
- 결과: 5개 hook 중 4개만 turns[] 반영 — 외부 write가 hook의 write 직후 stale read 기반으로 덮어쓴 것

## 4. 종합 판정

**판정: POSITIVE — race 실재. lock 필요.**

### 의미
- S1·S2·S3 음성은 "낮은 동시성에선 OS 스케줄러 운에 의존" 의미. **안전 보장 없음**.
- S4·S5 양성은 "동시성이 일정 이상이거나 외부 write 동시 발생 시 데이터 손실 발생"을 직접 증거화.
- 본 spike는 외부 process spawn으로 lower-bound. Claude Code 본체가 PostToolUse hook spawn을 자연 직렬화하더라도, **외부 프로세스 동시 write(S5)** 만으로 race 발생 → 자연 직렬화 가설 자체가 안전성을 보장하지 않음.

### G안 영향
- G안 핵심 가정 ("Task 병렬 호출 시 자연 직렬화") **반증됨**. 자연 직렬화에 의존한 lock-free 설계 불가.
- 권고: G안 채택 보류 → **lock 필수** 또는 **append-only JSONL** 구조로 변경. 둘 중 후자가 D4(코드 박제) 정합도 높음.

### 권고
1. **즉시(이 세션 안에서 안전 확보)**: turns push를 `current_session.json` read-modify-write에서 `turns_append.jsonl` append-only로 분리. session-end-finalize.js가 종료 시 jsonl → turns[] 합산.
2. **단기(다음 세션)**: file lock 도입(proper-lockfile은 D2로 검증 필요 → 직접 검증 spike 별도). 단 lock은 deadlock·stale lock 위험 → append-only가 우선.
3. **N=1 영속**: 본 결과는 1회 실행. 재현성 위해 5회 반복 + S4 동시성 20·50까지 sweep 가능. 단 verdict 뒤집힐 가능성 낮음 (양성 결정적 메커니즘).

## 5. 임시 박제 제거 절차

`SPIKE-R6 START` ~ `SPIKE-R6 END` 마커 사이 코드 3블록 + `spikeLog()` 호출 5곳 제거:
- `.claude/hooks/post-tool-use-task.js`:
  - L290~308 `spikeLog()` 함수 정의 블록
  - L312 (hook-entry), L327 (turns-read-before), L329 (turns-read-after), L348 (turns-write-before), L350·L354 (turns-write-after) — 총 5 호출
- 운영 영향 0 (env var 없으면 no-op) — 즉시 제거 안 해도 무방. 다만 D3(저장소 오염 전제)·코드 청결 정책상 spike 종료 후 다음 세션에서 정리 PR 분리 권고.

또한 `current_session.spike-backup.json`은 spike runner가 자동 원복했으나 백업 파일은 남음. `memory/sessions/current_session.spike-backup.json` 제거 필요.

## selfScores

```
[ROLE:dev]
# self-scores
rt_cov: 1.0
gt_pas: 1.0
hc_rt: 0
spc_drf: 0
build_ok: Y
runtime_ok: Y
hc_avoid: Y
ci_pass: Y
```

selfScores: `{"build_ok":"Y","runtime_ok":"Y","hc_avoid":"Y","ci_pass":"Y"}`
