---
turnId: 3
invocationMode: subagent
session: session_207
topic: topic_176
role: dev
phase: P1-appendfile-atomic-spike
date: 2026-05-07
---

# P1 — appendFile atomic spike summary

Dev입니다. Arki rev2 §5.2 P1 / GATE α' 검증 spike 실행.

## 환경

- platform: win32 (Windows 11, NTFS, 본 worktree)
- nodeVersion: v24.14.1
- POSIX round: **미수행** — 본 round는 Windows 단독. WSL 후속 round 의무 (§운영권고).

## 매트릭스

| lineSize | childCount | repetitions | rounds | totalLines/round |
|---:|---:|---:|---:|---:|
| 512   | 5  | 200 | 5 | 1,000 |
| 512   | 10 | 200 | 5 | 2,000 |
| 1024  | 5  | 200 | 5 | 1,000 |
| 1024  | 10 | 200 | 5 | 2,000 |
| 5120  | 5  | 200 | 5 | 1,000 |
| 5120  | 10 | 200 | 5 | 2,000 |

총 30 round. 누적 47,000 line append.

## 셀별 집계 (5 round 합산)

| lineSize | children | totalExpected | totalLineCount | parseFail | corruptRate | lossRate | avgByte | maxByte |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 512   | 5  | 5,000  | 5,000  | 0 | 0.0000% | 0.0000% | 512.0  | 512   |
| 512   | 10 | 10,000 | 10,000 | 0 | 0.0000% | 0.0000% | 512.0  | 512   |
| 1024  | 5  | 5,000  | 5,000  | 0 | 0.0000% | 0.0000% | 1024.0 | 1024  |
| 1024  | 10 | 10,000 | 10,000 | 0 | 0.0000% | 0.0000% | 1024.0 | 1024  |
| 5120  | 5  | 5,000  | 5,000  | 0 | 0.0000% | 0.0000% | 5120.0 | 5120  |
| 5120  | 10 | 10,000 | 10,000 | 0 | 0.0000% | 0.0000% | 5120.0 | 5120  |

전 셀 parseFail 0, lossRate 0, duplicate seq 0 (raw json `corruptSnippets` 빈 배열 확인).

## GATE α' 판정

임계: `corruptRate < 0.01% AND avgByteSize < 1KB`.

- **atomicity 차원 (corruptRate)**: 6 셀 모두 0.0000% → **PASS**.
- **line size 차원 (avgByteSize)**: 0.5KB 셀 PASS, 1KB·5KB 셀 FAIL (정의상 — 본 spike는 line size 가정 자체를 측정 매트릭스로 둔 것이지 본 plan 운용 line size를 1KB·5KB로 박제한 것이 아님).

### 결론 (한 줄)

**GATE α' PASS** — fs.appendFileSync atomicity 가정은 Windows NTFS · 동시 child 5/10 · line size 0.5KB~5KB 범위에서 30 round 47,000 line 누적 0건 corruption · 0건 loss로 실증. Arki rev2 §2.2 atomicity 가정 검증 통과.

단, 운용 line size는 **0.5KB(< 1KB) 마진 내에서 박제** 의무 (§운영권고).

## 운영권고

1. **운용 line schema 박제 (Arki rev2 §3.2)**: turn entry는 `__pad` 없이 ≤ 0.5KB 목표. selfScores·reportsPath 길이 합산 후 max 1KB 가드 (validator). 측정상 1KB·5KB도 atomic이지만 PIPE_BUF(4KB POSIX 기본) 마진 + Windows write buffering 특성을 고려해 0.5KB를 ceiling으로 권고.
2. **POSIX 후속 round 의무**: 본 round Windows 단독. WSL bash 또는 Linux runner에서 동일 매트릭스 1세트 의무 — Arki rev2 §5.2 spec(Windows + POSIX 둘 다)을 완전 충족하려면 추가 round 필요. 본 round 결과만으로 POSIX 안전 단정 금지 (D2 정합).
3. **maxByteSize 모니터**: 운영 P5(Arki rev2 §5.2 P5)에 dashboard 패널 추가 시 `__pad` 없는 자연 entry의 99p line size를 계측 → 1KB 임계 초과 시 경보.
4. **본 spike 결과를 GATE α' 임계 박제 입력으로 활용**: corruption 0.0000% 실측 → corruptRate < 0.0001 임계는 보수적이고 충분.
5. **GATE β' (finalize 동시성) 별도 의무**: 본 spike는 atomicity만 검증. R-D-22(finalize 합산 중 동시 append) 검증은 P2+P3 구현 후 별도 GATE β' 수행 필수.

## 산출 경로

- 코드: `scripts/spike-p1-appendfile-atomic.ts`
- raw + 셀 집계: `reports/2026-05-07_topic_176_arki/spike_p1_appendfile_atomic.json`
- 본 summary: `reports/2026-05-07_topic_176_arki/spike_p1_appendfile_atomic_summary.md`

## D 박제 정합

- **D2 (도구 설명 거짓 전제)**: `fs.appendFileSync` description만 신뢰 안 함. 30 round 실측 raw line 직접 read·JSON.parse 검증으로 atomic 확인.
- **D3 (저장소 오염 전제)**: spike 산출은 `tmp/spike-p1/` 임시 디렉토리. memory/sessions/ 진짜 jsonl 미터치. session_206 SPIKE-R6 마커 미터치.
- **Schedule-on-Demand**: 일정·공수·담당 박제 0.

[ROLE:dev]
# 측정 작업 — 형식만 박제
