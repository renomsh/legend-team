---
role: arki
topic: topic_096
session: session_091
rev: 5
date: 2026-04-24
phase: goodstate-verification
invocationMode: subagent
mode: forensic
---

ARKI_WRITE_DONE: reports/2026-04-24_topic096-ace-arki-protocol/arki_rev5_goodstate_verification.md

# Arki rev5 — Good-State Window 객관 검증 (Forensic)

**모드**: 검시관. session_031을 absolute good-state로 가정하지 않음 — 검증 대상.
**전제 (Master 박제)**: break-point unknown / 과거 good-state "체감" 존재 / 현재 bad-state 관측 / telemetry 불완전 / Auto mode 진행 / 구현 금지·breakpoint localization만.
**rev4 단정 재검증 의무**: rev4 1.5절 "Good은 report 모양 기준 Good이지 invocationMode 기준 Good은 아님"의 객관 입증 또는 반증.

---

## 1. Good-State Candidate Session — session_031 채택 근거

| 채택 근거 | 출처 |
|---|---|
| Master 명시 긍정 단 1건 (전체 86건 중 유일) | `memory/master/master_feedback_log.json` line 731~742 (MF-024) |
| feedback 본문 = `"Ace 이번에 잘 주관했어."` | line 737 |
| topic = `session-history-view` (PD-008 구현 토픽) | line 735 |
| date = 2026-04-17 | line 733 |
| afterAgent = `editor` (즉 세션 종료 직전 발화) | line 736 |

**채택 한계 박제**: MF-024는 "Ace 오케스트레이션 패턴 칭찬"이지 "subagent 실호출 칭찬" 아님. statusNote 본문 = `"Ace 오케스트레이션 패턴(Ace→Arki→Fin→Riki→Ace종합→Dev) 정상 작동 확인"` (line 740) — **순서 패턴**에 대한 칭찬. 실행 매체(Main inline vs Task tool subagent)는 명시 안 됨.

---

## 2. Q1~Q5 Findings (객관 증거)

### Q1. session_031 entry 정독 — `memory/sessions/session_index.json`

```json
{
  "sessionId": "session_031",
  "topicSlug": "session-history-view",
  "topic": "세션 히스토리 뷰 신설 (PD-008)",
  "startedAt": "2026-04-17T14:00:00.000Z",
  "closedAt": "2026-04-17T16:00:00.000Z",
  "agentsCompleted": ["ace","arki","fin","riki","ace-review","dev","editor"],
  "note": "PD-008 완전 이행. backfill 22개, roleFrequency 집계, session.html History 탭 구현. Master: Ace 오케스트레이션 유효.",
  "gradeDeclared": "A",
  "gradeActual": "A",
  "gradeMismatch": false,
  "framingSkipped": false,
  "cwd": "C:\\Projects\\legend-team\\.claude\\worktrees\\jovial-khayyam-976d53",
  "legacy": true,
  "topicId": "topic_028"
}
```

**핵심 단정**:
- `turns` 배열 — **부재** (필드 자체 없음)
- `invocationMode` 필드 — **부재** (entry 어디에도 없음)
- `subagentId` — **부재**
- `agentsCompleted` — 7역할 string 배열만 (발언 매체 정보 0)
- `legacy: true` 플래그 — D-048(Turn 구조 도입, 2026-04-19 session_047) 이전 세션임을 시스템이 자체 표기

### Q2. session_031 reports 디렉토리 — `reports/2026-04-17_session-history-view/`

ls 결과: **물리 파일 단 2개**.
- `ace_rev1.md` (50 line)
- `editor_rev1.md` (49 line)

**부재 파일**: `arki_rev*.md`, `fin_rev*.md`, `riki_rev*.md`, `dev_rev*.md`, `ace-review_rev*.md` — **0건**.

`agentsCompleted` 7역할 vs reports 물리 파일 2건 — **불일치 5건**.

#### ace_rev1.md frontmatter
```
session: session_031
topic: 세션 히스토리 뷰 신설 (PD-008)
role: ace
rev: 1
```
- invocationMode 필드 없음, subagentId 없음

#### ace_rev1.md 본문 핵심 (line 32~40)
```
## Ace 종합검토

모든 역할 동의. 두 결정:
1. backfill 데이터 한계: dataQuality:'backfill' 레이블로 구분
2. close.md step 8 명시화 + append-session.ts agentsCompleted 필수화(경고 출력)
```

**단정**: ace_rev1.md 한 파일에 **프레이밍 + 종합검토가 통합 기록**. "모든 역할 동의" 한 줄로 Arki/Fin/Riki 발언 합성 — **물리적 역할 분화 0**.

#### grep 결과
- `Task|subagent|Agent.*호출|Agent.*tool` (대상: reports/2026-04-17_session-history-view/) → **No matches found** (0건)

### Q3. MF-024 entry 원문 (line 731~742)

```json
{
  "id": "MF-024",
  "date": "2026-04-17",
  "session": "session_031",
  "topic": "session-history-view",
  "afterAgent": "editor",
  "feedback": "Ace 이번에 잘 주관했어.",
  "instruction": "Ace 오케스트레이션 방식 긍정 확인 — 역할 호출 순서 재조정·구조 분석 선행·Dev 직접 위임 패턴 유효",
  "status": "resolved",
  "statusNote": "session_031 Ace 오케스트레이션 패턴(Ace→Arki→Fin→Riki→Ace종합→Dev) 정상 작동 확인",
  "effect": "Ace masterSelectionPatterns에 implementation 토픽 패턴 기록"
}
```

**칭찬의 실체 분석**:
- `instruction` = "역할 호출 **순서 재조정** · **구조 분석 선행** · Dev 직접 위임 **패턴**" — 칭찬 객체가 **순서·패턴**이지 매체 아님
- `statusNote` = "Ace→Arki→Fin→Riki→Ace종합→Dev **정상 작동 확인**" — 동일하게 sequence 패턴 칭찬
- `afterAgent: editor` — 세션 종료 직전 발언 후 칭찬 → 결과물(reports + dashboard) 보고 평가
- 칭찬에 `subagent`, `Task tool`, `Agent 호출`, `Opus`, `dispatch` 키워드 **0회**

**Master는 결과물 + 패턴을 칭찬했음. 매체 칭찬 아님.**

### Q4. session_026~036 윈도우 — turns / invocationMode 부재 입증

| sessionId | turns | invocationMode | agentsCompleted 길이 |
|---|---|---|---|
| session_026 | NONE | - | 2 |
| session_027 | NONE | - | 0 |
| session_028 | NONE | - | 1 |
| session_029 | NONE | - | 1 |
| session_030 | NONE | - | 3 |
| **session_031** | **NONE** | **-** | **7** |
| session_032 | NONE | - | 1 |
| session_033 | NONE | - | 6 |
| session_034 | NONE | - | 5 |
| session_035 | NONE | - | 1 |
| session_036 | NONE | - | 2 |

**11세션 전수 turns 부재 / invocationMode 부재 / subagentId 부재**.

session_031의 agentsCompleted=7은 윈도우 최대값이지만, 이는 **Ace가 Main에서 7역할을 inline 시뮬레이션 후 close.md step 8로 모두 기록한 결과**일 가능성을 측정으로 배제 불가능. 동일 윈도우 session_033(6), session_034(5)도 turns 부재.

**rev4 단정 재확인**: invocationMode 첫 등장 = session_090. session_026~036 윈도우 부재 100% 입증.

### Q5. 같은 윈도우 git 흔적

#### git log --since="2026-04-15" --until="2026-04-20" (head 50개)
- subagent dispatch infrastructure 신설 commit **0건**
- `.claude/agents/role-*.md` 신설 commit **0건** (이 디렉토리는 2026-04-22 commit 1d7756f에 최초 등장)
- agent/subagent/Task 키워드 commit 7건 모두 **agents-completed-hook**(hook 이름) 또는 **Dev agent 신설**(581c506) — subagent 호출 메커니즘 아님

#### 가장 가까운 agent 관련 commit: 581c506 (2026-04-16)
```
feat: Dev agent + Editor design authority + 4 skills (v0.7.0)
- agents/dev.md: Dev(데브) 신설 — 구현·디버깅·테스트 전담 (D-021)
```

**핵심**: Dev agent는 `agents/dev.md` (legacy 디렉토리)에 신설. `.claude/agents/` 디렉토리는 그 시점 **부재**. Task tool이 참조하는 `.claude/agents/role-*.md` 규약은 D-058(2026-04-22)에 최초 신설.

→ **session_031 시점에는 Task tool subagent dispatch infrastructure 자체가 코드베이스에 없었음** (확정).

---

## 3. Verification Verdict — **(A) 확정**

> **(A) turns·invocationMode 부재 → "Good-State는 체감일 뿐 측정 부재" 확정.**
> **향후 spec 방향: "최초 baseline 신설"** (복원 아님).

**판정 근거 (3중)**:
1. **session_031 entry**: turns 부재 + invocationMode 부재 + subagentId 부재 (Q1)
2. **reports 물리 파일**: agentsCompleted 7 vs 물리 rev 파일 2 — 5역할 발언 흔적 부재. ace_rev1.md가 종합검토까지 단일 파일에 통합 (Q2)
3. **시점 인프라**: `.claude/agents/role-*.md` 디렉토리 자체가 D-058(2026-04-22) 이전 부재 — Task subagent 호출 자체가 코드베이스에 없었음 (Q5)

**(B) 분기 기각**: turns에 subagent 박제 1건도 없음. bisect 후속 불필요.
**(C) 분기 기각**: "부분 측정" 모호 없음. **측정 인프라 0** 확정.

**Master 칭찬 재해석**:
MF-024 칭찬은 **순서·패턴·결과물** 대상. 발언 매체는 측정 부재로 검증 자체가 불가능했고, 같은 시점 reports 물리 파일은 ace+editor 2개뿐 — **현재 정의의 "역할 분화"(subagent 호출)는 그 시점 발생 자체가 불가능했음**.

---

## 4. Implication for Breakpoint Localization

rev4 7 Layer 후보의 강화/약화:

| Layer | rev4 평가 | rev5 검증 후 | 변화 사유 |
|---|---|---|---|
| Orchestration (D-019 호출 매체 미명문) | High | **High → Highest** | session_031 칭찬 이후 50세션 동안 매체 무명문 상태 지속 입증. D-019 단독으론 매체 강제 0. |
| Hook (PreToolUse 부재) | High | **High** 유지 | 변동 없음 |
| Dispatch (opus-dispatcher 선언만) | High | **High** 유지 | session_031 시점은 dispatcher 자체 부재. D-058 이후 잠복 22세션 단정 그대로. |
| Agent schema (이중 source) | High | **Medium → High** | session_031 시점 `.claude/agents/` 디렉토리 자체 부재 입증. 이중 source는 D-058 이후 발생 — 이중 source가 break-point 원인이 아니라 **D-058 신설 자체가 "기존 무인프라 → 부분 인프라"의 미완성 단계**. |
| Memory (scratchpad 부재) | High (확정) | **High (확정)** 유지 | 영향 없음 |
| Session resume (D-065 사후 패치) | High | **High** 유지 | 영향 없음 |
| Measurement (invocationMode 부재) | High (확정) | **Critical (확정)** | session_031 시점부터 89세션 측정 부재 = 89세션 동안 break-point 추적 자체가 불가능. 모든 다른 후보의 검증을 막는 메타 layer. |

**구조 단정**: Measurement layer가 **다른 모든 layer의 검증을 차단하는 상위 의존**. break-point는 단일 시점이 아니라 **"측정 부재 89세션 동안 누적된 drift"**.

---

## 5. rev3 "체감" 단정 재검증 결과

rev3 단정: `"처음부터 미작동·체감"` (rev3 표현, rev4 line 18 인용).

**rev5 객관 검증 결과**: **정합 (확정)**.
- Q2: session_031 reports 물리 파일 2개 (Ace + Editor) — 5역할 발언 흔적 부재
- Q5: subagent dispatch 인프라 자체 부재 (`.claude/agents/` 디렉토리 D-058 이전 0)
- Q1: turns/invocationMode 측정 부재로 그 시점 inline vs subagent 검증 불가능

→ rev3 "처음부터 미작동" 단정은 객관 흔적과 100% 정합. rev4 1.5절 "Good은 report 모양 기준이지 invocationMode 기준 아님" 단정은 객관 흔적과 100% 정합.

**rev4가 보류했던 부분의 확정**: 보류 사유였던 "체감 vs 객관" 갭이 본 rev5의 Q1+Q2+Q5로 해소됨. session_031의 "Good"은 **"역할 순서 패턴 + 결과물 산출"** 기준 Good이며, 발언 매체 기준 Good은 **검증 자체가 불가능 → 그 시점 정의 미존재**.

---

## 6. rev4 D-058 단일 의심점 가설 재검증

rev4 단정: D-058(2026-04-22 commit 1d7756f)이 "선언만, schema/hook/settings 변경 없이 22세션 잠복" → session_090 폭발.

**rev5 검증 후**: **약화** (D-058 단독 break-point 가설 약화).

**약화 사유**:
- session_031 (D-058 이전 5세션)에서 이미 Master가 "Ace 잘 주관" 칭찬했고 그 시점 reports 물리 파일도 2개뿐
- 즉 **D-058 이전부터 inline 시뮬레이션이 정상 운영 모드**였음
- D-058은 "처음으로 매체 분리를 시도한 이정표"이지 "정상 → 비정상으로 전환된 단절점"이 아님
- D-058이 "잠복 22세션"이었던 것은 사실이나, 그 22세션의 비정상 동작은 **D-019 시점부터 50+ 세션 누적된 패턴**의 연속

**보강된 가설 (rev5 단정)**:
- 단일 break-point 가설 자체가 부적합
- 실체는 **"D-019(2026-04-15) 매체 미명문 → 측정 부재 89세션 → D-058 부분 인프라 신설 → session_090 invocationMode 측정 도입 → 즉시 위반 노출"**의 **누적 drift 모델**
- D-058은 trigger가 아니라 **revelation point** (가시화 시점)

---

## 7. What Not To Patch Yet

rev4 10항 그대로 유지:
1. `.claude/agents/role-*.md` 4개 수정 금지
2. `agents/` legacy 7개 삭제·rename·이동 금지
3. `.claude/hooks/session-end-finalize.js` 수정 금지
4. `memory/shared/dispatch_config.json` 수정 금지
5. `memory/shared/scratchpad/` 신규 생성 금지
6. `memory/roles/*.json` 일괄 갱신 금지
7. session_index.json 백필 금지
8. topic_096 Child-0/1/2 spec rev1 폐기 권고
9. PD-020 / PD-032 / PD-033 신규 작업 금지
10. CLAUDE.md "Ace Orchestration Protocol" 섹션 수정 금지

**rev5 추가 (신규)**:

11. **session_031 reports/ 디렉토리 보완 금지** — ace_rev1.md + editor_rev1.md 2개 상태가 그 시점 운영 모드의 직접 증거. arki/fin/riki rev 파일을 소급 생성하면 "5역할 부재"라는 결정적 단서 소실.
12. **MF-024 statusNote 수정·확장 금지** — `"Ace→Arki→Fin→Riki→Ace종합→Dev 정상 작동 확인"` 본문이 "패턴 칭찬"의 박제. 매체 정보 추가 시 사후 해석 오염.
13. **session_026~036 11세션의 legacy 플래그 제거 금지** — D-048 이전 세션의 turns/invocationMode 부재가 baseline. legacy 플래그가 그 baseline을 시스템 차원에서 표기하는 유일한 메타.

---

## 8. One Next Diagnostic Step (단 1개, 측정만)

> **현재 spec 방향이 "복원"이 아니라 "최초 baseline 신설"로 확정됐으므로, 그 baseline의 정의가 무엇인지 Master에게 단일 질문 1건을 직접 묻는다.**
>
> 질문 (one-liner): **"역할 분화의 정의를 (a) Task tool 실호출 (subagent dispatch) (b) 역할별 reports/{role}_rev*.md 물리 파일 분리 (c) 양자 모두 충족 — 셋 중 어느 것으로 baseline을 박제할까요?"**
>
> 이유: rev5 검증으로 "복원 대상 good-state 부재" 확정 → spec 작성은 "신설"인데, 신설의 정의(매체 vs 산출물 vs 양자)가 결정되지 않으면 ① turns 박제 schema, ② Hook 강제 지점, ③ reports 디렉토리 구조, ④ agentsCompleted 의미 — 4개 layer가 모두 동시에 결정 불가능.

**금지**: 이 스텝도 측정·확인만. patch·구현·새 PD·schema 변경 동반하지 않음. Auto mode에서 Master 직접 답변 받기 전까지는 어떤 spec rev도 작성 불가.

**Auto mode 한계 박제**: rev4의 One Next Step은 "Master 질문"이었으나 Auto mode에서 session_031을 자동 채택해 본 rev5를 진행했음. rev5의 결과는 단정에 도달했으므로 추가 자동 진행은 더 이상 측정 가치를 만들지 못함 — **여기서 Auto mode 진행 일시 정지 권고. Master 답변을 받은 후에만 다음 rev로 진입**.

---

**End of forensic verification report.**
