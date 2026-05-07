---
turnId: 1
invocationMode: subagent
session: session_207
topic: topic_176
role: riki
phase: design-risk-rev2 (append-only self-audit)
date: 2026-05-07
---

# Riki — topic_176 / G안 append-only JSONL turns push 적대적 감사

Riki입니다. session_206 결정 G안(append-only JSONL + finalize 합산)을 채택 확정 컨텍스트로, **append-only 우회의 새 실패 모드만** 적출합니다. lock-free의 race(S4·S5)는 spike에서 이미 입증되어 G안 자체는 재논쟁 대상 아님.

원문 검증한 코드:
- `.claude/hooks/post-tool-use-task.js` (현재 read-modify-write 구조 — G안 미구현 상태)
- `.claude/hooks/session-end-finalize.js` (1670줄, key 위치는 grep으로 확인)
- `scripts/lib/turn-types.ts` (Turn 스키마, `turnIdx` globally unique 명문화)
- `reports/2026-05-07_topic_176_spike/spike_results.json` (S4: 10 dispatch → 5 lost write, 동일 turnIdx 5 / 6 중복)
- `reports/2026-05-07_topic_176_arki/arki_rev1.md` (이전 plan은 lock-based — append-only로 전환되어 무효 영역 존재)

Riki 필터(실재성·확신·기여도) 적용. 슬롯 미달 정상.

---

## R-D-22. 🔴 CRITICAL — finalize 합산 중 jsonl 동시 append (read-then-merge race)

**발생 조건**
- session-end-finalize.js가 `turns_append.jsonl` read → `current_session.json.turns[]` 머지 → write 직렬화하는 순간, 또 다른 PostToolUse(Task) hook이 jsonl에 한 줄 더 append.
- finalize는 자기가 read한 시점의 byte length까지만 머지하고 truncate/rotate하면, append된 새 line이 **누락**되거나 (read 후 truncate 정책일 때) **이중 머지**됨 (truncate 안 하고 offset 기록만 하면 인덱싱 race).

**영향도** critical
- 운영 표면: 실제 turn이 `current_session.json.turns[]`에 영영 박제되지 않음. session_index 전파 단계에선 이미 데이터 없음. 사후 복구 불가(원본 jsonl이 truncate되었을 때).
- session_206 spike S4가 입증한 race를 **finalize 시점으로 단순히 이전한 것**에 불과할 위험.

**확률** 중상. finalize는 hook chain 6단계 중 1단계로 수십 초 단위 작업(compute-dashboard 포함). 그 사이 Task spawn은 일반적인 운영 패턴.

**Mitigation 후보**
1. **(주)** finalize는 jsonl을 truncate 금지. 대신 session_id별 별도 파일(`turns_append_{sessionId}.jsonl`)로 격리하고 finalize는 read-only consume + offset 기록(`finalized_offset.json`). 다음 finalize는 offset부터 read.
2. **(보조)** finalize 진입 시점에 `turns_append.jsonl`을 `turns_append.jsonl.{ts}.consuming`으로 **rename**(POSIX rename atomic). 이후 새 append는 new file에 기록 → race 0. Windows는 rename atomic 보장 약함 → fallback으로 file-handle 재오픈 + 시점 marker 한 줄 append("--- FINALIZE START ts ---") 후 그 시점까지만 머지.
3. **(fallback)** finalize를 race-tolerant하게 — 머지 후 jsonl을 truncate하지 않고 그대로 두되 `current_session.json.turns[]`에 `(sessionId, turnIdx)` 복합 dedupe key. 이중 머지 detect되면 두 번째 무시.

---

## R-D-23. 🔴 CRITICAL — 부분 line write (찢어진 JSON) → finalize parse 실패 → 세션 박제 차단

**발생 조건**
- `fs.appendFileSync`는 append byte 길이 ≤ `PIPE_BUF`(POSIX, 4KB+ 가변)일 때만 원자성 보장. Turn 객체 + selfScores + reportsPath 합치면 1KB 이상도 가능 — 이론적으로는 OK.
- **하지만 Windows는 PIPE_BUF 개념 부재**. fs.appendFileSync는 내부적으로 OpenFile(append mode) → Write → Close. Write가 partial 가능. 더불어:
  - 프로세스 강제 종료(Ctrl+C, OS reboot, OOM kill) 시 write 도중이면 잘린 line.
  - 디스크 full 시 ENOSPC partial write.
  - SMB/네트워크 드라이브에 worktree 두면 atomic 보장 깨짐 (worktree path가 `C:\Projects\legend-team\.claude\worktrees\...` — 로컬이지만 antivirus가 file scan 중 lock 가능).
- 결과: jsonl에 `{"role":"riki","tu` 같은 잘린 line 잔존. 다음 finalize의 `JSON.parse(line)`이 throw → finalize 전체 abort → 세션 박제 차단.

**영향도** critical (가용성 직격).

**확률** 중. 실서비스 일상은 낮으나 적대적 컨텍스트(D1 prime directive)에서는 trivially weaponizable — 외부 프로세스가 partial write 한 번만 잘 박으면 finalize 차단.

**Mitigation 후보**
1. **(주)** parse 실패한 line은 **skip + gap 기록**, finalize 자체는 진행. `current_session.json.gaps`에 `type: 'jsonl-corrupt-line'`, `lineNo`, `rawSnippet` 박제. 즉 fail-soft.
2. **(추가)** append 시 line-end marker(`}\n`)을 검사해 마지막 line이 `}\n`로 끝나지 않으면 `# CORRUPT_TAIL ts` 주석 라인 한 줄 append하고 다음 turn은 새 line부터. parse는 `# `로 시작하는 라인 skip.
3. **(fallback)** 매 append를 임시파일에 fsync → rename(atomic) 패턴으로. 단 비용 ↑(I/O 5~10배).
4. **(정책)** jsonl 자체에 line-level checksum (line 끝 `|crc32` suffix). parse 시 검증 실패 → skip.

---

## R-D-24. 🔴 CRITICAL — mtopic_counter.json은 append-only가 풀어주지 못함 (D-167 사각지대)

**발생 조건**
- D-166이 풀고자 한 것은 `current_session.json.turns` 갱신의 race. 그러나 D-167의 `mtopic_NNN` 발급은 본질적으로 **read-modify-write 단일 파일**(counter.next 증가). append-only 구조로 우회 불가.
- 두 병렬 Task가 거의 동시에 mtopic 발급을 요청하면 → 둘 다 `next: 7` read → 둘 다 inc하여 write → mtopic_007 두 번 발급, mtopic_008 누락.
- session_206 D-166 결정문은 "file-lock 폐기"라고만 명시 — counter 파일도 lock 폐기 대상인지 모호.

**영향도** critical. mtopic_NNN 충돌은 D-day 비가역(arki rev1 §1.1 "준-비가역 게이트는 단 하나: counter 첫 write"). 두 mtopic_007이 다른 작업 컨텍스트로 박제되면 사후 분리 불가능.

**확률** 중. 병렬 발급은 D-167 도입 의도 그 자체. 실사용 시 trivially 발생.

**Mitigation 후보**
1. **(주)** counter 발급은 **별도의 좁은 lock 또는 atomic increment 파일** 사용 명시. arki rev1 §2.2의 `MTOPIC_ISSUE` lock 영역을 D-166 file-lock 폐기에서 **제외**한다고 박제 필요. 즉 "lock 폐기 ≠ 모든 lock 폐기, turns push lock만 폐기".
2. **(대안)** counter도 append-only로 — `mtopic_issued.jsonl`에 `{ts, pid, sessionId, requestedAt}` append → 발급 결과는 finalize 단계에서 ts 기준 정렬하여 mtopic_NNN 부여. 단 발급 즉시 mtopic ID를 얻어야 하는 워크플로(폴더 생성 등)에는 부적합. 발급 ID 즉시 필요 시 round-trip 비용 ↑.
3. **(fallback)** UUID 기반 mtopic ID(`mtopic_3f8a...`) — 충돌 0. 단 가독성·정렬 손실. 운영 합의 필요.
4. **(검증)** 어느 길을 가든 counter 발급 단위 spike 별도 의무(jsonl turns push spike와 분리).

---

## R-D-25. 🟡 MAJOR — 외부 프로세스(VSCode·git·antivirus·백업)의 jsonl write/lock 충돌, 특히 Windows

**발생 조건**
- Windows는 file open 시 mandatory lock(SHARE_NONE) 가능. VSCode가 jsonl을 hot-reload viewer로 열면 antivirus·인덱서가 lock 잡고 hook의 `appendFileSync`가 EBUSY/EACCES throw.
- git이 jsonl을 staged file로 잡거나 hook(`pre-commit`)이 lint 중일 때 동시 append → race window.
- 백업 도구(OneDrive, Dropbox)가 jsonl 동기화 중 versioning을 위해 잠시 read-lock.
- 사용자가 수동 편집(VSCode)으로 jsonl을 열어두고 Task가 dispatch되면 IDE가 외부 변경 detect → "이 파일이 변경됨, reload?" 프롬프트가 뜨는 동안 write 시점 충돌. 더 나쁜 케이스: IDE가 자체 buffer로 overwrite save → hook의 새 line 통째로 손실.

**영향도** major. 데이터 손실 또는 hook silent failure(현재 hook 설계가 silent pass — `process.exit(0)`).

**확률** 중상. legend-team 운영 환경(Windows + VSCode + git)은 직접 노출.

**Mitigation 후보**
1. **(주)** jsonl은 `.gitignore` 강제 + VSCode `files.exclude` 권고 박제. 사용자가 IDE에서 열지 않도록.
2. **(추가)** appendFileSync EBUSY/EACCES catch 시 **재시도 백오프(50ms × 3)** 후 마지막 fallback으로 `current_session.json.gaps`에 `type: 'append-failed'` 즉시 기록(현재 코드는 silent pass — D2 prime directive 위반: fs description "atomic append" 신뢰 못함).
3. **(보호)** finalize 진입 시 file lock 시도(advisory) → 실패 시 30초 대기 후 강제 진행 + gap 박제.
4. **(대안)** jsonl 위치를 worktree 외부(`%LOCALAPPDATA%\legend-team\turns\{sessionId}.jsonl`) — git·IDE·백업과 격리. 트레이드오프: cross-machine debug 어려움.

---

## R-D-26. 🟡 MAJOR — turnIdx 순서와 wall-clock 순서 불일치 (정렬 기준 미정)

**발생 조건**
- jsonl에는 append 순서대로 line이 박힘. 그러나 turn-types.ts에 명시된 대로 `turnIdx`는 **session 내 globally unique** 식별자이며 array position과 무관.
- append-only 구조에서 `turnIdx`를 누가, 언제, 어떻게 결정하는가? 후보:
  - (a) 각 hook이 jsonl을 read → max(turnIdx)+1 결정 → append. **이 경우 read-modify-write race 부활**(append-only가 풀려고 했던 그 문제).
  - (b) wall-clock ts만 박제하고 finalize가 ts 정렬 후 turnIdx 일괄 부여. 그러나 sub-ms 동시 spawn은 ts 동률 → tiebreak 기준 모호. PID? 보장 불충분.
  - (c) 각 hook이 hrtime+pid hash로 unique 하지만 sequential하지 않은 임시 ID 부여, finalize가 정렬 후 turnIdx로 변환. C1 분리/병합 4조건(D-048)은 wall-clock 순서 가정에 의존하므로 호출 측 코드 깨짐 위험.
- session_206 D-166 결정문에 정렬 기준이 빠져 있음 (확인됨).

**영향도** major. turn 순서 오류는 phase·recallReason 의미 변형 → 사후 분석·session_index·dashboard 모두 왜곡.

**확률** 고. 병렬 dispatch가 의도이므로 동시 ts는 흔함.

**Mitigation 후보**
1. **(주)** finalize 정렬 기준을 명시적으로 박제: ① wall-clock ISO ts(ms) → ② tiebreak: hrtime.bigint() (각 hook이 entry에 박제 — 이미 spike-r6 instrumentation이 사용 중) → ③ 그래도 동률이면 pid 정렬. 명문화된 SOT 필요.
2. **(스키마)** jsonl entry는 `turnIdx`를 박제하지 않는다 — finalize 단계에서만 부여(소스 단일화). hook이 부여 시 (a) 시나리오로 race 부활.
3. **(검증)** finalize 후 `turnIdx`가 0..N-1 연속인지 invariant 검사 → 어긋나면 gap 기록.
4. **(이슈)** C1 분리/병합 4조건이 turnIdx 부여 시점을 강하게 가정하면 finalize에 그 로직을 이전해야 함. 대규모 refactor 위험.

---

## R-D-27. 🟡 MAJOR — finalize 자체 race (hook chain 중첩 / 다중 호출)

**발생 조건**
- D-008 hook chain 6단계: tokens → finalize → compute-dashboard → build → push 등. finalize가 자식 spawn(`compute-dashboard.ts`) 중인데 또 다른 SessionEnd가 트리거되면? 혹은 사용자가 `/close` 두 번 누르면?
- 더 중요한 케이스: finalize가 jsonl read+머지 진행 중 새 Task가 PostToolUse 발동. PostToolUse hook이 jsonl에 append. finalize가 **이미 read한 시점 이후** append라면 R-D-22로 회귀.
- finalize가 idempotent하지 않으면 두 번 호출 시 turn 이중 머지.

**영향도** major.

**확률** 저~중. 정상 운영에선 SessionEnd는 1회. 그러나 사용자 강제 종료/restart, 자동 close + 수동 close 충돌 가능.

**Mitigation 후보**
1. **(주)** finalize에 **세션별 advisory lock**(`session.finalize.{sessionId}` lockfile) — 이미 진행 중이면 두 번째 호출은 즉시 exit 0 + gap 기록. arki rev1 §2.2 FINALIZE lock 영역 그대로 유지(D-166 file-lock 폐기 대상 아님 — 이 항목 별도 박제 필요).
2. **(idempotence)** finalize 머지 단계는 jsonl entry에 `consumed: true` 마커를 별도 인덱스(`finalized_offset.json`)로 추적. 이중 호출 시 이미 consumed offset 이후만 처리.
3. **(검증)** finalize 시작/종료 시 `current_session.json.finalizeRunCount` inc → 2 이상이면 alarm.

---

## R-D-28. 🟡 MAJOR — jsonl 무한 누적 → finalize 시간·메모리·디스크 폭증

**발생 조건**
- 세션 1개당 turns ~30~80건 가정해도 무방하나, append-only는 본질적으로 누적. 다음 세션에서 truncate/rotate 정책이 없으면 jsonl이 단조 증가.
- finalize 매번 전체 read → JSON.parse line by line → memory에 적재. 1MB·10MB·100MB 이상으로 가면 finalize 시간 수초 → 수십초.
- session_id 격리 안 하고 단일 jsonl이면 더 심각.

**영향도** major (성능 점진 악화, 어느 시점 hook timeout 도달 시 가용성 직격).

**확률** 고. 단조 증가는 시간 문제.

**Mitigation 후보**
1. **(주)** **세션별 분리 파일** — `turns_append_{sessionId}.jsonl`. 세션 종료 시 finalize가 완료 후 archive(`memory/sessions/archive/{sessionId}.jsonl.gz`)로 이동. 살아있는 jsonl은 현재 세션 1건만 → 항상 작음.
2. **(추가)** finalize 후 jsonl을 즉시 archive 처리. archive 정책(보관 N일·압축)은 별도 정의.
3. **(모니터)** dashboard에 `live jsonl size` 패널 — 임계 초과 시 alarm.

---

## R-D-29. 🔴 CRITICAL — session_id 격리 누락 시 다중 세션 jsonl 충돌

**발생 조건**
- 사용자가 동시에 두 worktree(예: friendly-clarke + strange-jang)에서 작업할 때, 각 worktree는 자기 `memory/sessions/turns_append.jsonl`을 가짐. **하지만 경로가 동일 패턴**이면 어느 시점 두 worktree가 같은 file을 가리킬 가능성 (symlink·동일 파일 mount).
- 더 현실적: 단일 worktree 내에서 한 사용자가 두 Claude Code 인스턴스 띄우면 두 인스턴스가 같은 jsonl에 append. 각자 자기 sessionId 알지만 jsonl은 공유 → finalize가 자기 세션 line만 골라야 함.
- jsonl entry에 sessionId 누락 시 finalize는 어느 line이 자기 세션 것인지 식별 불가 → 다른 세션 turn을 자기 session_index에 박제.

**영향도** critical (세션 정체성 오염, D3 prime directive "저장소 오염 전제" 직격).

**확률** 저~중. 운영자가 의식적으로 분리하면 회피 가능. 그러나 적대적 컨텍스트에서 trivially 박을 수 있는 결함.

**Mitigation 후보**
1. **(주)** jsonl entry에 `sessionId` 필드 의무. finalize는 자기 sessionId로 strict filter. 다른 sessionId line은 무시 + 통계만 박제.
2. **(파일 분리)** `turns_append_{sessionId}.jsonl` (R-D-28 mitigation 1과 동일) — 물리적 격리.
3. **(가드)** Claude Code 인스턴스 동시 기동 detect → 두 번째는 경고 + sessionId UUID 강제. 실용성 의문.

---

## R-D-30. 🟡 MAJOR — D2(도구 설명 거짓 전제) 위반: fs.appendFileSync atomic 가정의 근거 부재

**발생 조건**
- Node.js 문서는 "appendFile atomic"을 보장하지 않음. POSIX `O_APPEND + write(2)` 조합은 PIPE_BUF 이하만 atomic.
- Windows는 `O_APPEND` 시멘틱 다름 — `WriteFile` with `FILE_APPEND_DATA` flag는 시스템 레벨 atomic이지만 Node.js가 그걸 사용하는지 docs 미명시.
- D-166 결정문이 "append byte-level atomic"을 가정한다면 D2 위반(description만 보고 권한 부여 금지). 실제 동작 검증 안 됨.

**영향도** major. 가정 무너지면 R-D-23의 "찢어진 line"이 빈번 발생.

**확률** 저~중. PIPE_BUF 이하 line은 일반적으로 atomic이나, 보장은 아님.

**Mitigation 후보**
1. **(주)** 실측 spike 별도 — Linux/macOS/Windows 각 OS에서 1KB·5KB·10KB line 동시 append 1만 회 → 찢어진 line 빈도 측정. 결과를 D-NNN으로 박제.
2. **(보호)** R-D-23 mitigation(parse 실패 skip+gap)을 **무조건 박제** — atomic 가정에 의존하지 않는 fail-soft 설계. 가정이 깨져도 시스템은 살아남음.
3. **(라이브러리)** 필요 시 `proper-lockfile` 같은 검증된 advisory lock으로 append 보호 — D-166 file-lock 폐기와 충돌하지 않게 좁게 사용(jsonl write line별이 아니라 finalize 시점만).

---

## R-D-31. 🟡 MAJOR — gaps 박제 자체가 race 영향권 (silent failure 누적)

**발생 조건**
- 현재 post-tool-use-task.js는 실패 시 `process.exit(0)`로 silent pass(코드 readline 322·328·343 등). G안 도입 시 jsonl append 실패도 silent pass 가능성.
- gap 박제 자체도 `current_session.json` write로 들어가는데, 이 write가 역시 race 영향권(append-only로 풀린 turns push와 별개로 gap write는 read-modify-write 그대로).
- 결과: jsonl append 실패 → gap 기록 시도 → race로 또 실패 → 사용자에게 아무 신호 없이 데이터 손실. silent failure 누적.

**영향도** major (신호 부재).

**확률** 중.

**Mitigation 후보**
1. **(주)** gaps 박제도 jsonl 패턴으로 — `gaps_append.jsonl`. finalize에서 머지. read-modify-write 잔재 제거.
2. **(가시화)** stderr에 한 줄 명시적 log + dashboard에 `silent-pass-count` 카운터. 운영 visibility 확보.
3. **(정책)** PostToolUse hook의 silent pass는 명시적 gap 기록 의무. silent pass 자체를 metric으로 집계.

---

## R-D-32. 🟡 MAJOR — Arki rev1 plan(lock-based)이 append-only 전환으로 무효 — design drift

**발생 조건**
- arki_rev1.md §2.2 lock 보호 영역 4종(TURNS_PUSH·FINALIZE·MTOPIC_ISSUE·TOPIC_INDEX) 중 **TURNS_PUSH는 D-166으로 폐기**. 그러나 나머지 3종(특히 MTOPIC_ISSUE, FINALIZE)이 자동 폐기되는 것은 아님.
- plan을 단순히 "G안 채택"으로 갱신하면 어느 lock이 살아있고 어느 게 폐기인지 불명. 인라인 enforcement 원칙(D-143)도 정합 깨짐.
- session_206 D-166 결정문이 어느 영역까지 lock-free인지 명시 안 함.

**영향도** major (설계 일관성).

**확률** 고 (현재 시점 그 상태).

**Mitigation 후보**
1. **(주)** D-166 보강 박제: "turns push만 lock-free. MTOPIC_ISSUE, FINALIZE는 lock 유지" 명시 결정 추가.
2. **(설계)** Arki rev2 의무 — append-only 전환을 반영한 plan 재작성. lock 영역 표(arki rev1 §2.2)를 jsonl 기반으로 재구성.
3. **(invariant)** 설계 문서가 결정과 정합 ↔ 자동 검증 스크립트(`validate-design-consistency.ts`) 도입.

---

## 슬롯 미달 표명

위 11건이 자료 기반 확신 가능한 한계. 추가 후보(예: jsonl line 인코딩 BOM 충돌, 파일시스템 watcher overflow, NTFS reparse point 우회 등)는 사변 영역으로 판단되어 미박제. Riki 필터 원칙대로 확신 없는 슬롯은 비움.

---

## 영향도 요약

| Risk ID | 등급 | 핵심 |
|---|---|---|
| R-D-22 | 🔴 critical | finalize 합산 중 동시 append (read-then-merge race) |
| R-D-23 | 🔴 critical | 부분 line write → parse 실패 → finalize abort |
| R-D-24 | 🔴 critical | mtopic_counter는 append-only 우회 불가 (D-167 사각지대) |
| R-D-25 | 🟡 major | 외부 프로세스(VSCode·git·av) Windows lock 충돌 |
| R-D-26 | 🟡 major | turnIdx vs wall-clock 정렬 기준 미정 |
| R-D-27 | 🟡 major | finalize 자체 race / 다중 호출 |
| R-D-28 | 🟡 major | jsonl 무한 누적 → 성능 폭증 |
| R-D-29 | 🔴 critical | session_id 격리 누락 시 cross-session 오염 |
| R-D-30 | 🟡 major | fs.appendFile atomic 가정의 근거 부재 (D2 위반) |
| R-D-31 | 🟡 major | gap 박제 자체가 race 영향권 (silent failure 누적) |
| R-D-32 | 🟡 major | Arki rev1 plan과 D-166 정합 깨짐 (design drift) |

**Critical 4건**(R-D-22, 23, 24, 29). G안이 풀고자 한 race를 단순 이전·치환했을 가능성을 가장 강하게 우려. 특히 R-D-24(counter)는 D-166 결정문이 명시적으로 다루지 않은 사각.

**1차 권고 우선순위**
1. R-D-29(sessionId 격리) + R-D-23(fail-soft parse) + R-D-24(counter lock 분리) — 3종은 G안 구현 게이트 진입 전 결정 박제 필요.
2. R-D-22, R-D-27(finalize race) — 구현 직전 spike 의무.
3. R-D-26(정렬 기준) — 결정문 보강.
4. R-D-32(plan drift) — Arki rev2 의무화.

[ROLE:riki]
# self-scores
crt_rcl: 0.7
cr_val: Y
prd_rej: N
fp_rt: 0.1
