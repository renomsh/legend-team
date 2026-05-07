---
turnId: 2
invocationMode: subagent
session: session_207
topic: topic_176
role: arki
phase: design + execution-plan (rev2, Case B 한정)
executionPlanMode: plan
date: 2026-05-07
---

# Arki rev2 — topic_176 / Case B 한정 append-only turns push plan

Arki입니다. session_207 Master 정정으로 본 plan은 **Case B 한정** — 단일 Claude Code 프로세스 + 같은 세션 내 Task 도구 병렬 dispatch 영역만 다룹니다. Case A(별도 세션·별도 프로세스 + 공유 SOT race)는 PD-065로 분리되어 본 plan scope OUT.

---

## 1. Scope 명시 (최우선)

### 1.1 In scope (Case B)
- 같은 세션 내 단일 Claude Code 프로세스에서 Task 도구로 child agent 병렬 dispatch 시 발생하는 `current_session.json.turns` push race.
- 해소 메커니즘: append-only JSONL(`memory/sessions/turns_append_{sessionId}.jsonl`) → finalize 합산 → `current_session.json.turns[]` 산출.
- 영향 hook 2개: `post-tool-use-task.js`(Task 종료 시 jsonl 1줄 append) + `session-end-finalize.js`(jsonl read → merge → current_session.json write).
- Riki rev2 항목 중 **Case B 영역만 반영**: R-D-22(finalize 합산 중 동시 append) / R-D-23(찢어진 line / 부분 write) / R-D-32(D-166 결정문 ambiguity 재해석).

### 1.2 Out of scope (Case A → PD-065 의존)
다음 항목은 본 plan에서 다루지 않으며, PD-065 신규 토픽에서 별도 설계:

| 항목 | 영역 | 근거 |
|---|---|---|
| `mtopic_NNN` namespace 도입 | Case A | 별도 프로세스 충돌은 turns push race가 아닌 공유 SOT race |
| `mtopic_counter.json` 발급 | Case A | counter는 read-modify-write 단일 파일 — append-only로 우회 불가 (Riki R-D-24) |
| session_id 강제 격리 가드 | Case A | 다중 Claude Code 인스턴스 동시 기동 (Riki R-D-29) |
| `topic_index.json`·`decision_ledger.json`·`system_state.json` 보호 | Case A | 공유 SOT race (Riki R-D-25 외부 프로세스 충돌 포함) |
| 외부 프로세스(VSCode·git·av) 충돌 | Case A | 동일 file에 대한 외부 프로세스 write — 본질적으로 다중 프로세스 모델 |

### 1.3 D-166 / D-167 재해석
- **D-166 G안 채택**: 본 plan은 D-166의 핵심을 "단일 프로세스 + Task 병렬 + append-only turns push"로 좁게 재해석. lock 폐기 = `current_session.json.turns` push lock만 폐기. FINALIZE lock·MTOPIC_ISSUE lock 등 다른 영역은 본 plan 미터치.
- **D-167 mtopic_NNN namespace**: 본 plan과 독립. Case A 영역으로 PD-065에서 처리. 본 plan은 D-167 의존 없음 — `topic_NNN` 단일 namespace만 가정.
- **rev1 Phase 재평가**: rev1 P0(grep 조사)·P3(lock 인프라)·P4(mtopic_counter·hook 분기)·P5(mtopic_001 발급) 모두 Case A 의존. 본 plan에서는 폐기 또는 PD-065 입력으로 재분류 (§5 표).

---

## 2. Case B 본질 race 정의

### 2.1 spike 결과 잔존 race (Riki rev2 + spike_results 교차)
session_206 spike S1~S5 중:
- **S4(적대적 동시 push)**: 10 dispatch → 5 lost write, 동일 turnIdx 5/6 중복. 본 plan scope **잔존 — append-only로 해소**.
- **S5(외부 프로세스의 topic_index write 충돌)**: 사실상 Case A — 본 plan scope 제외, PD-065 의존.
- S1~S3: spike 결과 미관측 또는 Case A 성격이 강하므로 본 plan 본질 race로 채택하지 않음.

따라서 본 plan이 풀어야 할 race = **S4 단일**.

### 2.2 append-only가 S4를 푸는 메커니즘 명세
- 단일 프로세스 + 같은 세션 내 다중 Task: 모든 hook은 같은 OS 프로세스 컨텍스트가 아니라(child process) 동일 worktree 파일 시스템을 공유. POSIX `O_APPEND + write(2)` ≤ PIPE_BUF 시 atomic. Windows `FILE_APPEND_DATA` flag 시스템 레벨 atomic.
- **D2 prime directive 박제**: `fs.appendFile` description만 신뢰하지 않음. byte-level append atomicity는 (a) line 크기 ≤ PIPE_BUF (POSIX 기본 4KB) (b) Node.js 내부가 `O_APPEND`/`FILE_APPEND_DATA` 사용 가정에 의존. 두 가정 모두 실측 spike로 검증 의무 (§5 P1 게이트).
- line 크기 가정 검증: Turn 1건 평균 byte size 측정 후 PIPE_BUF 대비 마진 박제. 1KB 이상이면 fail-soft 로직(R-D-23 mitigation) 강제.

### 2.3 Riki R-D 정밀 위치 매핑

| Riki ID | 본 plan 반영 | 위치 |
|---|---|---|
| R-D-22 (finalize 합산 중 동시 append) | §4 finalize 변경 / §6 잔존 위험 | `session-end-finalize.js` jsonl read → merge → current_session.json write 구간. 6 hook chain의 finalize 단계 진입 후. |
| R-D-23 (찢어진 line / 부분 write) | §4 finalize parse fail-soft | `session-end-finalize.js` `JSON.parse(line)` throw catch 박스. line 단위 skip + gap 기록. |
| R-D-32 (D-166 ambiguity) | §1.3 / §8 결정 의무 | D-166 결정문에 "Case B 한정" scope 명시 박제. |

R-D-24·25·26·29·30·31은 모두 Case A 또는 Case A 정합 항목으로 분류 — **PD-065에서 처리, 본 plan 미반영**.

---

## 3. 자료 구조 (Case B 한정)

### 3.1 신규 / 변경 / 미터치
```
memory/sessions/
├── current_session.json                     (변경: turns[] 직접 write 폐기, finalize 산출만)
├── turns_append_{sessionId}.jsonl           (신규, 세션별 분리)
└── archive/{sessionId}.jsonl                (신규, 세션 종료 후 archive 이동)
```

**미터치 (본 plan scope 명시 OUT)**: `topic_index.json`·`decision_ledger.json`·`mtopic_counter.json`(생성 자체가 PD-065 영역)·`system_state.json`. 본 plan은 이들 파일에 대한 read·write 변경 0.

### 3.2 jsonl line schema (최소)
```json
{"sessionId":"session_207","role":"arki","turnIdx":null,"phase":"...","ts":"2026-05-07T...","hrtime":"...","selfScores":{...},"reportsPath":"...","chars":...}
```
- `sessionId` 필드 의무 — 세션별 파일 분리에도 불구하고 다중 source dedupe 시 안전 가드.
- `turnIdx`는 **null로 박제** — finalize 단계에서만 부여 (Riki R-D-26 Case A 분류 대상이지만 본 plan에서도 동일 정책 채택해야 race 회피). race 부활 차단.
- `hrtime`은 정렬 tiebreak용 보조 필드. 단 본 plan scope에서 정렬 기준 박제는 **선언만 + 검증은 PD-065 의존**으로 남김 (§6).

### 3.3 세션별 파일 분리 효과
- finalize 시점 read 대상 = 자기 세션 jsonl 1개. 무한 누적 회피 (Riki R-D-28 일부 예방).
- 다중 인스턴스 동시 기동 시 다른 세션 jsonl과 격리 (Riki R-D-29 부분 예방). 단 다중 인스턴스 가드 자체는 Case A 영역이므로 본 plan은 file naming convention만 박제, 강제 가드는 PD-065에 위임.

---

## 4. hook 변경 (Case B 한정)

### 4.1 `post-tool-use-task.js` — Task 종료 hook
- 현재 read-modify-write(`current_session.json.turns` 직접 push) **제거**.
- 대체: `turns_append_{sessionId}.jsonl`에 1줄 append (`fs.appendFileSync` 또는 동기 stream). line은 `\n` 종결.
- 실패 시 silent pass(`process.exit(0)`) 폐기 — stderr 1줄 명시 + finalize에서 알 수 있도록 sentinel 라인 기록 시도(best-effort).
- SPIKE-R6 마커(290~307줄 + 311·345·348·369·372·375 호출 6건)는 **본 작업과 분리**된 cleanup. P5 cleanup phase에서 별도 처리 (PD 자동 resolved 대상).

### 4.2 `session-end-finalize.js` — 세션 종료 finalize hook
- 신규 단계: jsonl read → line by line `JSON.parse` → 파싱 성공 line만 turn 객체로 수집 → `current_session.json.turns[]` 머지(append) → write.
- **fail-soft 의무 (R-D-23)**: parse 실패 line은 skip + `current_session.json.gaps`에 `{type:'jsonl-corrupt-line', sessionId, lineNo, rawSnippet:line.slice(0,80)}` 기록. finalize 자체는 진행.
- finalize 종료 후 jsonl을 `archive/{sessionId}.jsonl`로 rename(이동). 다음 세션은 새 파일.
- **R-D-22 mitigation**: 본 plan에서는 "finalize 진입 시점 = hook chain 6단계 중 1단계 시작 후 = 그 이후 추가 Task dispatch 없음" 가정에 의존. 가정 검증 의무는 §6 잔존 위험 + §5 GATE β 의무.

### 4.3 D2 정합 — fs.appendFile 거짓 description 방어
- 본 plan은 `fs.appendFileSync`의 atomicity description을 **조건부**로 신뢰: line < 1KB(여유 마진) + Windows/POSIX 동작 spike 의무 검증 (§5 P1 게이트).
- 실측 결과 atomic 가정이 깨지면 fail-soft skip만으로 부족 — checksum·rename·temp file 패턴 도입을 **본 plan rev3에서 재설계** (현재 plan은 atomic 가정 + fail-soft만으로 진행).

### 4.4 SPIKE-R6 cleanup (별도 phase)
- 본 plan 핵심 변경과 무관하지만 spike 마커가 jsonl 동작 측정에도 재활용 가능 → P1 게이트 통과 후 cleanup. PD 항목(decision_ledger 2525·2578 + current_session 30) resolved 처리.

---

## 5. Phase 분해 (rev1 P0~P6 → Case B 한정 단순화)

### 5.1 rev1 Phase 재분류

| rev1 Phase | rev1 작업 | rev2 처리 | 사유 |
|---|---|---|---|
| P0 (grep 조사) | mtopic 분기 위치 식별 | **PD-065 입력으로 이전** | mtopic_NNN 자체가 Case A 영역. Dev grep 산출(34 entries / needs-branch 19)은 PD-065 신규 토픽에서 그대로 활용. |
| P1 (spike scope) | race 시나리오 N=5 | **rev2 P1로 단순화** | S4 단일 시나리오 + appendFile atomicity 검증으로 축소. |
| P2 (spike 실행) | 시나리오 실행 | **rev2 P2** | 동일. 단 출력 시나리오는 §5.2의 2건. |
| GATE α (race 판정) | 양성/음성 분기 | **rev2 GATE α 유지** | 본 plan은 spike 결과 양성 가정(session_206 결과)으로 P3 진입. 단 atomic spike는 별도 게이트. |
| P3 (lock 인프라) | proper-lockfile + 4영역 lock | **폐기** | D-168 lock 인프라 삭제됨. 본 plan은 lock 미사용. |
| P4 (counter+fallback+grep 분기) | mtopic 인프라 | **PD-065로 이전** | Case A 영역 전체. |
| GATE β (pre-issue dry-run) | mtopic 발급 직전 검증 | **PD-065로 이전** | 발급 자체가 Case A. |
| P5 (mtopic_001 발급) | D-day | **PD-065로 이전** | counter Case A. |
| P6 (운영 모니터) | lock contention 등 | **rev2 P5로 재정의** | lock 모니터는 폐기. jsonl 사이즈·gap·finalize duration 모니터로 변경. |

**Case A 이전 Phase 합계: 4건** (rev1 P0·P4·GATE β·P5).

### 5.2 rev2 Phase (Case B 한정)

| Phase | 입력 | 작업 | 산출 (검증 가능) |
|---|---|---|---|
| **P1 — appendFile atomic spike** | 본 plan §2.2·§4.3 | OS별(Windows + POSIX) line 크기별(0.5KB·1KB·5KB) 동시 append 1만 회 → 찢어진 line 빈도 + 평균 line 크기 측정 | `reports/.../appendfile_atomic_spike.json` (찢어짐 빈도 + Turn 평균 byte size) |
| **GATE α' — atomic 가정 판정** | P1 결과 | 찢어짐 빈도 < 0.01% + Turn 평균 < 1KB → 통과. 이상 → plan 정지·재설계 | Master 승인 박제 |
| **P2 — hook 구현 (post-tool-use-task)** | P1 통과 | jsonl append 로직 + sessionId 필드 + 실패 시 stderr 명시 + sentinel 시도 박제 | unit test (정상/실패 케이스) |
| **P3 — hook 구현 (session-end-finalize)** | P2 + 본 plan §4.2 | jsonl read+merge+gap fail-soft+archive 이동 박제 | unit test (정상·corrupt line·empty jsonl·archive) |
| **GATE β' — finalize 동시성 검증** | P2+P3 | finalize 진행 중 의도적 추가 append → 가정(추가 Task 없음) 위반 시 동작 확인 | dry-run report. 가정 위반 시 R-D-22 발생 — 위반 빈도 < 0.1%면 잔존 위험 수용, 아니면 plan 보강 |
| **P4 — current_session.turns[] 직접 write 폐기 박제** | P2+P3 통과 | post-tool-use-task의 read-modify-write 코드 path 제거 | code review + smoke test |
| **P5 — 운영 모니터** | P4 | dashboard에 jsonl size·corrupt-line count·finalize duration 패널 추가 | `compute-dashboard.ts` 변경 + 1주기 데이터 |

병렬 가능: P2 ∥ P3 (의존 없음). 그 외 직렬.

### 5.3 게이트·롤백·전제·중단 조건

#### 검증 게이트
- **GATE α'** (atomic 가정): 위 §5.2 표 임계.
- **GATE β'** (동시성): finalize 진입 후 추가 append 빈도 측정. 가정 깨지면 본 plan rev3 (§4.3 라인).

#### 롤백
| Phase | 롤백 가능성 | 절차 |
|---|---|---|
| P1 | 완전 가역 | spike 산출 archive |
| P2·P3 | 가역 | git revert + 기존 read-modify-write 복귀 |
| P4 | 가역 | direct write 코드 path 복원 |
| P5 | 가역 | dashboard 패널 제거 |
| **archive 이동** | **준-가역** | jsonl archive 후에는 jsonl 원본 삭제 — 단 archive 보관본 read 가능 |

본 plan은 mtopic_NNN처럼 비가역 D-day 게이트 0건. 모두 회수 가능.

#### 전제 (깨지면 plan 무효)
1. fs.appendFile atomic 가정 (P1 spike로 검증).
2. finalize 진입 후 추가 Task dispatch 빈도 < 0.1% (GATE β'로 검증).
3. 6 hook chain 무수정 — auto-push.js 체인 4단계 변경 없음.
4. 단일 프로세스 가정 — 다중 인스턴스 동시 기동은 Case A·PD-065 의존. 본 plan은 sessionId 필드 박제만 수행, 강제 가드 미수행.
5. D1~D4 정합 — 모델 자율 판단 의존 0, 코드 박제 100%.

#### 중단 조건
- P1 spike에서 찢어짐 빈도 임계 초과 → plan 정지, atomic 가정 폐기 후 rev3 재설계 (checksum line·rename pattern 등).
- GATE β'에서 finalize 진입 후 추가 append 빈도 ≥ 0.1% → R-D-22가 trivial 한 잔존 위험 → plan 보강 필요.
- 운영 P5에서 corrupt-line count 1주기 ≥ 1% → fail-soft만으로 부족 입증, rev3 재설계.

---

## 6. 잔존 위험 명시 (Case B 한정)

### 6.1 R-D-22 (finalize 합산 중 동시 append)
- **본 plan 가정**: hook chain 6단계 중 finalize 단계 진입 = 사실상 PostToolUse 발동 종료 시점 이후. 그 이후 추가 Task dispatch는 없거나 미세.
- **검증 방법**: GATE β' — finalize 진행 중 추가 append 빈도 측정. < 0.1%면 잔존 위험 수용, ≥ 0.1%면 mitigation 박제 (rename atomic 패턴 등).
- **Case A 위임**: 다중 인스턴스 finalize 중첩은 Case A — PD-065 의존.

### 6.2 R-D-23 (찢어진 line / 부분 write)
- **mitigation 박제**: §4.2 fail-soft skip + gap 기록. finalize 자체는 진행.
- **critical 영향 없음 입증**: 잘린 line = 최대 1건 turn 손실. session_index 전파에서 해당 turn 부재 — 사후 dashboard "missing turn" 카운터로 가시화. critical/생산성 직격 아님.
- **단 빈도 임계 초과 시 (P5 모니터 1% 이상)**: rev3 재설계.

### 6.3 R-D-32 (D-166 ambiguity)
- **해소**: 본 plan 자체가 D-166의 Case B 한정 scope 명시. §1·§8 결정 의무 박제로 ambiguity 제거.

### 6.4 본 plan이 다루지 않는 위험 (재확인)
- R-D-24 mtopic_counter race → PD-065
- R-D-25 외부 프로세스 충돌 → PD-065
- R-D-26 정렬 기준 박제 → 본 plan은 jsonl entry에 turnIdx null + finalize 부여만 박제. 정렬 알고리즘 SOT 박제는 PD-065에서 다중 인스턴스 컨텍스트와 함께 결정.
- R-D-29 session_id 격리 강제 → PD-065 (본 plan은 file naming convention만)
- R-D-30 atomic 가정 근거 부재 → 본 plan은 P1 spike로 검증 의무화. 검증 결과 자체가 D2 정합.
- R-D-31 silent failure 누적 → 본 plan §4.1 stderr 명시 + P5 dashboard로 부분 mitigation. 완전 해소는 PD-065에서 gaps_append.jsonl 패턴.

---

## 7. 자가감사 (4축, 1차 + 2차)

### 7.1 1차 감사 (4축 × 최소 3지점)

#### structuration
- (1) Case B / Case A scope 분리 박제 — §1.1·§1.2 표로 명시. **OK**
- (2) 자료 구조(§3) — 신규 / 변경 / 미터치 3분류 명확. **OK**
- (3) jsonl entry schema에 turnIdx null + finalize 부여 정책이 §3.2와 §6.4에 분산 — 단일 절로 통합 권고. → **MUST_NOW: §3.2에 정렬·turnIdx 부여 정책 한 절로 통합 (rev3 시점)**

#### hardcoding
- (1) line 크기 임계 1KB·찢어짐 빈도 0.01% — §5.2·§5.3 임계. spike 측정 결과 기반 미설정 — **MUST_BY_N=10: P1 spike 결과 후 임계 박제**
- (2) finalize 진입 후 추가 append 빈도 임계 0.1% — 임의 설정 — **SHOULD: 운영 데이터 1주기 후 재조정**
- (3) sessionId 필드 의무는 §3.2에 박제, schema validator 미박제 → **MUST_BY_N=10: turn-types.ts에 jsonl entry 타입 export + validator**

#### efficiency
- (1) jsonl 세션별 분리 + archive — 무한 누적 회피 자체 OK. **OK**
- (2) finalize jsonl read는 line by line stream 가능 / 전체 read 둘 다 허용 — §4.2는 line by line 명시. **OK**
- (3) GATE β' 검증을 매 세션 수행하면 비용 ↑ — **NICE: 초기 1주기만 측정 후 모니터 패널만 유지**

#### extensibility
- (1) gaps_append.jsonl 패턴은 본 plan 미박제 (Case A 영역 일부 + 별도 PD) — 현재 단일 jsonl만 → **DEFER**
- (2) Case A·PD-065 진입 시 본 plan jsonl을 그대로 활용할 수 있는지 — sessionId 필드 의무 박제로 가능. **OK**
- (3) 정렬 기준 변경 시 finalize 단일 모듈만 수정 — extensibility OK. **OK**

**1차 발견 요약**: MUST_NOW 1건 (rev3 시점 통합), MUST_BY_N=10 2건, SHOULD 1건, NICE 1건, DEFER 1건.

### 7.2 2차 감사 (Master "한번 더" 압박 시뮬레이션)

축 전환: **거버넌스 / 검증 회수 / 메타 안전 (D1~D4)**

#### 거버넌스
- GATE α'·GATE β' 판정 주체 미명시 → **MUST_NOW: 판정=Master + 박제=Edi 명시 (§5.2 표 footnote)**
- D-166 보강 박제 책임자 미명시 (Edi 세션 종료 시) → **MUST_NOW: §8 결정 의무 항목에 박제 책임자 = Edi 명시**

#### 검증 회수
- spike 결과 Riki cross-review 의무 미명시 → **MUST_NOW: GATE α' 통과 직전 Riki 의무 호출 (적대적 sample 재검증)**
- finalize 동시성 검증(GATE β')은 P2+P3 후 1회만 — 운영 1주기 모니터(P5)와 분리 → **SHOULD: P5 모니터 데이터를 GATE β' 임계 재조정 입력으로 재투입**

#### 메타 안전 (D1~D4)
- D2 (도구 설명 거짓): fs.appendFile atomic을 P1 spike로 검증 — 본 plan 자체가 D2 정합. **OK**
- D3 (저장소 오염 전제): 본 plan은 jsonl 단일 파일 단언. fail-soft skip + gap 기록으로 일부 mitigation. **단 jsonl 자체가 손상되어 finalize 머지 결과를 신뢰할 수 있는가?** → cross-check 메커니즘 부재 → **MUST_BY_N=30: finalize 산출 turns[]를 reports/{role}_rev*.md frontmatter turnId와 cross-check하는 validator 박제 (Arki full-system view 메모리)**
- D1 (적대적 컨텍스트 전제): jsonl line은 외부에서 임의 박제 가능 (worktree 내 누구든 file write). finalize는 line 내용을 trust — **MUST_NOW: jsonl line에 hook 작성 sentinel(예: `__hook_origin: "post-tool-use-task"`) 박제 후 finalize에서 검증. 외부 박제 line은 skip + gap 기록**
- D4 (모델 자율 판단 무력화): finalize 머지 로직은 코드 박제, 모델 판단 0. **OK**

**2차 발견 요약**: MUST_NOW 4건 (거버넌스 2 + 검증 회수 1 + D1 sentinel 1), MUST_BY_N=30 1건 (D3 cross-check), SHOULD 1건. 실질 결함 5건 — 압박 가치 입증.

### 7.3 spec 동결
- 1차 + 2차 합산 MUST_NOW 5건 미반영 상태 (§3.2 통합·§5.2 판정주체·§8 박제책임자·Riki cross-review·D1 sentinel) → **spc_lck = N**
- rev2는 MUST_NOW 5건을 본문 통합하지 않은 채 박제(감사 가시성 우선). rev3에서 통합 후 동결 가능.

---

## 8. 결론 — Master 결정 필요 항목 (3건)

1. **본 plan(Case B 한정) P1 spike 진입 가능 여부?** — appendFile atomic spike 박제 + GATE α' 임계 검증 시작.
2. **`turns_append_{sessionId}.jsonl` 세션별 분리 박제 여부?** — file naming convention + archive 정책 (§3.1·§4.2).
3. **D-166 / D-167 결정문 보강 박제 (Edi 책임)?** — D-166 scope = "Case B 한정 turns push" 명시 / D-167 mtopic_NNN = PD-065 영역 명시. 본 plan rev2가 그 근거.

박제 후 rev3에서 자가감사 MUST_NOW 5건 통합 + spc_lck=Y 진행 의도.

---

[ROLE:arki]
# self-scores
aud_rcl: 1.0
str_fd: 4
spc_lck: N
sa_rnd: 2
