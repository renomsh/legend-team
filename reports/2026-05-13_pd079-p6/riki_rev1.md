---
turnId: 1
invocationMode: subagent
role: riki
topic: PD-079 P6 비동기 마이그레이션 설계 리스크 감사
date: 2026-05-13
---

# Riki — PD-079 P6 비동기 마이그레이션 리스크 감사

Riki입니다. 점검 대상 파일 4종(`scripts/lib/m-lock.ts`, `m-migration-runner.ts`, `m-migration-log.ts`, `migration-preview.ts`)을 실측 확보 후 발언합니다.

## 사전 정정 — 설계 요약과 실측 불일치

설계 요약 1번 항목 "`m-lock.ts` cross-worktree lock 획득 (대기 가능)"은 **실측과 다릅니다.** [T4 / A2 / O5]

- `m-lock.ts` line 51 `checkMtopicAvailable(mtopicId)` — 이름이 lock이지 실제 동작은 **read-only availability scan**입니다. 파일 line 8-10 자체 주석: *"본 scan은 보조 경보 — 같은 worktree에서 같은 id 재오픈 거부에 주로 사용"*, *"scan 자체는 lock-free (단순 read). TOCTOU race는 hash 접미사가 1차 방어"*. [T4]
- 즉 P6 설계가 가정한 "lock 획득·대기·해제" semantic은 P2 산출물에 **존재하지 않습니다.** P6는 락 메커니즘을 별도로 만들어야 하거나, 락 없이 갈지 명시적 결정이 필요합니다.

이 불일치가 본 감사의 가장 중대한 적출입니다. 아래 R-1·R-3은 이 사실 위에서 재구성합니다.

---

## R-1 race conditions — 자식 process가 m_*·공식 SOT 쓰는 중 Master 동시 작업

**현실성 4 / 심각도 4 = 16 → must-mitigate** [T3 / A2 / O5]

- 자식 process가 `runMigration({mode:'silent-1', dryRun:false})` 실행 중 핵심 쓰기 경로 (`m-migration-runner.ts` line 244-247, 316-318):
  - `decision_ledger.json` push + `atomicWriteJSON`
  - `pending_deferrals.json` push + `atomicWriteJSON`
  - `m_topic_index_{wid}.json` `markMTopicMigrated` (line 143-159)
- 동시 발생 가능 시나리오:
  1. Master가 다른 워크트리에서 `/open mtopic` → 새 mtopic을 `m_topic_index_{wid2}.json`에 쓰는 중, 자식이 같은 파일을 다른 wid로 읽어 in-memory 처리 후 `markMTopicMigrated`로 덮어쓰기. wid가 다르면 파일이 달라 안전하지만, **같은 wid 워크트리에서 새 `/open mtopic`이 발생하면 race.** [T3]
  2. 자식이 `decision_ledger.json` 읽기(`loadOfficialLedgerFile` line 88) → in-memory mutate → `atomicWriteJSON` 사이 (수십 ms~수초). 이 사이에 다른 워크트리의 Edi가 D-NNN 박제를 위해 같은 파일을 read-modify-write 하면 **last-writer-wins lost update.** atomicWriteJSON은 단일 쓰기의 원자성만 보장하지 read-modify-write 트랜잭션을 보장하지 않습니다. [T4]
- `m-lock.ts`는 mtopic 생성/오픈에만 쓰는 availability check이지 SOT write 직렬화 락이 아닙니다. **P6 설계는 SOT write 경쟁을 막을 메커니즘이 없습니다.** [T4]

**mitigation 권고:**
- (a) 공식 SOT(`decision_ledger.json`, `pending_deferrals.json`) write에 별도 file lock (`proper-lockfile` 등 stale detection 포함) 도입. read-modify-write 전체를 락 안에서.
- (b) 또는 자식 process 시작 전 `m_topic_index_*` 모든 파일에 대해 추가 close 발생 차단 sentinel 박제 (e.g., `memory/shared/.migration-in-progress`) — Master 측 `/open`이 sentinel 감지 시 짧게 대기.
- (c) 최소한 race 발생 시 결과 검증 hook (다음 `/open` step 3-c에서 `m_migration_log.json` last entry와 `decision_ledger.json` 마지막 D-NNN id를 cross-check해서 lost update 의심 시 경보).

---

## R-2 로그 누락·관측성 — detached + stdio:ignore

**현실성 4 / 심각도 3 = 12 → must-mitigate** [T3 / A2 / O3]

- `stdio:'ignore'`이면 자식의 stderr·throw가 어디에도 남지 않습니다. [T4]
- `m-migration-runner.ts` line 342-360 catch 블록은 try inner의 단건 throw만 잡습니다. `runMigration` 본체(line 365-401)에서 발생하는 throw(예: `scanClosedMTopics` 자체 실패, `loadOfficialLedger` JSON parse 실패의 경계 외 케이스, `atomicWriteJSON` permission 에러 등)는 잡히지 않고 process exit. **로그 0건, Master 가시성 0.** [T4]
- `appendMigrationLog`(line 64-69)는 read-modify-write이고 `atomicWriteJSON`로 마지막 단계만 원자적. **동시 spawn (예: 같은 워크트리에서 2개 세션이 거의 동시에 /open) 시 줄 인터리브가 아니라 *마지막 writer만 살아남는 lost update.* append-only가 아닙니다.** [T4] — 이는 log 누락보다 더 위험합니다. 로그가 사라집니다.
- `logs/auto-migrate.log`는 설계 요약에 있으나 P5 산출에는 존재하지 않습니다 (실제 로그는 `memory/shared/m_migration_log.json` JSON). 설계 요약 6번 항목이 실측과 다릅니다. [T4]

**mitigation 권고:**
- (a) `stdio:'ignore'` 대신 stderr/stdout을 `logs/auto-migrate.YYYY-MM-DD.log`에 fs.openSync(append) → fd로 redirect. detached + append-mode O_APPEND는 OS 레벨에서 멀티 writer 안전.
- (b) `runMigration` 호출을 자식 entrypoint에서 outer try-catch로 감싸고 throw 시 별도 `logs/auto-migrate.error.log`에 append.
- (c) `appendMigrationLog`를 read-modify-write에서 진짜 append (JSONL `.jsonl` 라인 단위, O_APPEND)로 전환. 다음 `/open` step 3-c 표시 시 마지막 N줄만 tail. **이게 안 되면 동시성 시나리오에서 로그 자체가 증거 능력을 잃습니다.**

---

## R-3 lock 경합 — 위에서 정정한 대로, lock 자체가 없음

**현실성 3 / 심각도 3 = 9 → must-mitigate (경계선)** [T4 / A2 / O5]

- 설계가 가정한 lock semantic이 P2에 없으므로 "lock 대기 timeout", "stale lock 처리"는 점검할 대상이 부재합니다.
- 다만 R-1 mitigation으로 별도 file lock을 도입한다면 동일한 stale·timeout 이슈가 그때 등장합니다. **사전 명시:**
  - timeout 없는 acquire는 좀비 자식 시 무한 대기 → 다음 `/open` 지연 가능 (설계 요약은 max 30s timeout 언급하지만 P5 runner에는 timeout 코드 없음 [T4]).
  - lock 파일 stale 처리는 PID + heartbeat 또는 `proper-lockfile`의 stale detection 옵션 필요.
  - Windows에서 file lock 동작은 POSIX와 다름 — Master 환경 win32 (`<env>` 표기). `fs.openSync` flag, advisory vs mandatory lock 의미 확인 필요.

**mitigation 권고:** R-1과 통합하여 락 도입 시 stale detection + timeout + Windows 호환성 3종을 동시에 처리.

---

## R-4 K-5 자기실현 모순 — D-181 원안 정합성

**현실성 3 / 심각도 4 = 12 → must-mitigate** [T2 / A1 / O3]

- D-181 K-5 mitigation 원안을 본 발언 시점에 직접 읽지 못했습니다 ([T2 한계 명시]). 다만 P5 runner의 코드 주석(line 17 *"silent-1 분기에는 Master UI 호출 코드 부재 (구조적 차단)"*)을 보면 silent-1은 **Master 가시성을 의도적으로 0으로 설계**했습니다. [T4]
- 비동기 spawn + Master UI 호출 0건이면 Master는 **마이그가 실행됐는지, 실패했는지, 성공했는지 자식이 종료할 때까지 알 수 없습니다.** 다음 `/open` step 3-c "최근 마이그" 1줄이 유일한 채널인데, R-2에서 적출했듯 동시성 시 그 로그 자체가 lost update 위험.
- D-181 D4 정합 ("Claude 설득당해도 시스템이 안전") 관점에서 Master가 검증할 trace가 lost update 가능한 단일 JSON 하나라면 **자기 검증 불가능 = D4 위반.** [T3]

**mitigation 권고:**
- (a) `m_migration_log.json`을 JSONL append-only로 전환 (R-2-c와 통합) → tail 신뢰 가능.
- (b) git commit hash를 로그 entry에 포함 (`commitMigrationResult` 결과). 다음 `/open` step 3-c에서 hash 표시 → Master가 `git show` 직접 검증 가능. **append-only 로그 + git hash 이중화로만 K-5 mitigation 성립.**
- (c) 마이그 성공/실패 KPI를 `m_kpi.json`이 아니라 `decision_ledger.json`에 별도 D-NNN로 박제 (주간 단위 aggregate)할지 별도 결정. 현 설계는 KPI가 별도 파일이라 ledger와 분리 — trace 추적 시 두 파일 cross-ref 필요.

---

## 추가 리스크

### R-5 Windows detached unref 동작

**현실성 3 / 심각도 2 = 6 → defer-OK** [T2 / A1 / O1]

- Master 환경 win32. Node.js `child_process.spawn({detached:true, stdio:'ignore'}).unref()`은 Windows에서 부분 동작 — 새 process group 생성은 POSIX 전용. Windows에선 `windowsHide:true`도 같이 줘야 console window 안 뜸. [T2 — 직접 검증 못함]
- Parent /open이 즉시 반환하는지 실제 spawn 테스트 필요. P6 구현 시 검증 게이트.

**defer 사유:** 구현 시점에 실측 가능. 사전에 막을 수 있는 설계 결함은 아님.

### R-6 m_kpi.json 부분 쓰기

**현실성 2 / 심각도 2 = 4 → defer-OK** [T3 / A1 / O3]

- `writeMKPISnapshot`이 `atomicWriteJSON` 쓰면 partial read 위험 0. 부분 쓰기 우려는 read-modify-write race이지 partial write race가 아님. R-1에 흡수됨.

### R-7 Master 의도 정합 — "대기 시간 효율 사용"

**현실성 4 / 심각도 3 = 12 → must-mitigate** [T1 / A0 / O2]

- Master 의도 인용 "두 트랙에서 다른 토픽 다룸, 대기 시간 효율 사용"은 본 점검 요구 문서에 있으나 원 발언 출처 없습니다 [T1 한계 명시 — `feedback_fin_master_capacity_assumption` 메모리 기준 단언 회피].
- **단, 설계상 평가만 한다면:** 비동기 spawn으로 parent /open은 ~10ms 반환되지만, 자식이 백그라운드에서 SOT를 변경한 결과는 **다음 /open까지 Master에게 보이지 않습니다.** 만약 Master가 토픽 A 진행 중 토픽 B의 마이그 결과를 보고 싶어한다면 본 설계는 그 의도와 정합하지 않습니다.
- 의도가 "결과 보고는 다음 /open이면 충분"이라면 정합. **이 전제 자체를 Master에게 확인해야 합니다** (Riki는 추정 단언 회피).

**mitigation 권고:** 구현 전 Master에게 1문항 확인 — "P6 마이그 결과 보고가 *다음 /open*까지 지연되어도 괜찮은지, 아니면 토픽 작업 중 알림이 필요한지".

---

## 종합

- **must-mitigate 5건** (R-1, R-2, R-3, R-4, R-7), **defer-OK 2건** (R-5, R-6).
- 가장 중대한 적출: 설계 요약 1번 항목 (m-lock 대기 가능)이 실측과 다름. P6는 **락 메커니즘을 별도로 추가하거나 락 없이 갈지 결정**부터 해야 합니다.
- 그 다음 중대 적출: `appendMigrationLog`가 read-modify-write이라 동시 spawn 시 **로그 자체가 lost update.** R-2 mitigation (JSONL append-only) 없으면 K-5 mitigation 불성립 → D-181 D4 위반.
- 슬롯 미달 아님 (필터 통과 5건). 다만 R-3은 "lock이 없다"는 사실 정정에 가까운 메타 적출.

본 감사는 P5 산출(`runMigration`) 실측을 기반으로 했고, m_kpi 작성 함수(`writeMKPISnapshot`, `commitMigrationResult`)는 grep으로 발견되지 않아 P6 신규 구현 대상으로 간주했습니다 [T4 — Grep 결과]. 이 두 함수의 실제 구현이 등장하면 R-2·R-6 재평가 필요.

[ROLE:riki]
# self-scores
crt_rcl: 0.8
cr_val: Y
prd_rej: N
fp_rt: 0.1
