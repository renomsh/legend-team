---
role: zero
turnId: 7
invocationMode: subagent
session: session_168
topic: topic_145
topicSlug: pd056-ackedbutunresolved-impl
date: 2026-05-02
rev: 2
scope: Edi rev1 박제 자산 7건 정제 점검 — tech-debt / security-review / simplify
accessed_assets:
  - file: reports/2026-05-02_pd056-ackedbutunresolved-impl/edi_rev1.md
  - file: memory/shared/decision_ledger.json
  - file: memory/shared/topic_index.json
  - file: memory/shared/system_state.json
  - file: memory/shared/evidence_index.json
  - file: memory/master/master_feedback_log.json
  - file: memory/sessions/current_session.json
  - file: memory/shared/project_charter.json
---

제로입니다. Edi rev1 박제 자산 7건을 3 영역(tech-debt / security-review / simplify) 한정으로 실측 점검했습니다. 단호한 cut/refine 결정만 박제합니다. 회색 영역 거부.

---

## §1. Cut (tech-debt)

### 1-1. D-145 entry — `axis` + `summary` + `decision` 3 필드 중복

**실측**:
- `axis` (89자): "Jobs↔Ace 호출 분리 원칙 + skill Step 0/0b 1줄 위임 + Nexus topicType 판정 SOT + history forbid 표현 정정"
- `summary` (421자): (a)~(d) 4 책임 압축 본문
- `decision` (118자): "Jobs↔Ace↔Nexus 호출 분리. Step 0/0b는 Nexus 영역으로 이전, jobs/ace skill 본문은 옵션 B 1줄 위임으로 보존. CLAUDE.md가 Nexus topicType 판정 SOT."

**판정**: **그대로 둔다.**

- ledger 기존 entry(D-141·143·144) 모두 `axis` + `summary` 2 필드 패턴 사용. D-145는 `decision` 필드를 추가로 박제했으나, 이는 기존 패턴 위반이 아닌 정보 보강(axis = 압축 라벨, decision = 1줄 결론, summary = 풀 본문). dead text 아님.
- 단, `axis`에 (d) "history forbid 표현 정정"이 포함됐으나 `summary` (d)와는 미세 표현 차이("28 불변 anchoring 오류"). axis는 라벨 문자열, summary는 본문이므로 의도적 분리. 정합.

### 1-2. D-145 `axis` 4 책임 — 분할 vs 단일 entry

**Ace synthesis 권고에 따라 단일 entry 압축됨.** Zero rev1 §1에서 "axisLen 89자는 가독성 임계 내 → 그대로 둔다" 박제 완료.

본 rev2 시점 재검토: 89자 axis는 Master 메모리 `simple_growth_not_measurement` 정합. 4 책임 추적 비용 < 분할로 인한 결정 부채. **그대로 둔다.**

### 1-3. master_feedback_log F-session_168 entry — 진행상황 잡음

**실측**:
```json
{
  "id": "F-session_168",
  "session": "session_168",
  "topic": "topic_145",
  "feedback": "Master 결정 10건 압축: (1) spec 5건→실측 6건으로 진행 (2) caveats string[] 통일 ... (10) Zero 정제 2건 인라인 적용",
  "status": "resolved",
  "statusNote": "본 세션 결정 10건 모두 inline 결정 + 산출물 박제 완료"
}
```

**판정**: **그대로 둔다.**

- feedbackLog 직전 entry(`MF-AUTO-session_164-edi`)는 자동 생성 alert 패턴, F-session_168은 Master 결정 압축 패턴. 패턴 정당하게 분리.
- 10건 결정 본문은 `current_session.masterDecisions[0].decisions` 배열과 100% 동일 — 단, 두 위치 박제는 SOT 분산 위험. 단일 출처는 `current_session` (휘발성), `master_feedback_log`는 영구 보관 mirror. **D-F (Topic Status SOT) 정책과 같은 패턴: 영구 mirror 박제는 정당.**

### 1-4. system_state.recentDecisions[0] — 문자열 vs 객체 형식 불일치 ⚠️

**실측**:
```js
recentDecisions: [
  "D-145",                          // ← 문자열 형식
  {id:"D-144", date:"...", axis:..., summary:...},  // ← 객체 형식
  {id:"D-143", ...},
  {id:"D-142", ...},
  {id:"D-141", ...}
]
```

**판정**: **합친다 (Refine — Master 결정 필요).**

D-145만 prepend 시 문자열로 박제됐고, 기존 4 entry는 객체. consume 측(`compute-dashboard.ts` 등)이 `typeof === 'string' ? lookupById : entry` 분기 강제됨. 비대칭은 dashboard 코드 1곳에서 이미 처리 중일 가능성, but **SOT 일관성 위배.** 

권고: D-145 entry도 객체 형식(`{id, date, axis, summary}`)으로 정정. cap 5 정합 유지.

이는 **§2 Refine으로 이전.**

### 1-5. current_session.notes — 잔재 placeholder 의심

**실측 notes 3 entry**:
1. "PD-056 child 토픽 — topic_144(Legend Nexus 표면 정체성) framing 후속 implementation"
2. "5건 caveats(D-130/132/133/141/143) acked/resolved 분류 Master 결정 동반"
3. "caveatsMeta 집계 함수 + dashboard 패널 신설 본체 구현"

**판정**: **합친다 / 정정 필요 (Refine).**

- entry 2의 `caveats(D-130/132/133/141/143)` — **잘못된 ID**. 본 세션 실측 caveats는 D-137·138·141·142·143·144 (6건). open 시점 잔재 추정.
- 본 세션 종결 시점 oneLineSummary(`current_session.oneLineSummary`)와 outcome(`topic_index.topic_145.outcome`)에 정확값 박제됨 → notes는 historical 잔재.
- **권고: notes entry 2를 정정** ("6건 caveats(D-137·138·141·142·143·144)") **또는 통째 삭제** (oneLineSummary로 대체됨).

### 1-6. evidence_index ID 순서 anomaly

**실측 ID 시퀀스**: E-001 ~ E-014, **E-017, E-016, E-015,** E-018, E-019, E-020

E-015·016·017이 역순으로 박제됨. count 20으로 정합하지만 시각적 sequence 위배. 본 토픽 scope 외 기존 잔재 — **그대로 둔다 (별도 정제 PD 후보).**

### Cut 결과
- **지운다 (확정)**: 0건
- **정정 권고 (notes)**: 1건 → §2 Refine

---

## §2. Refine (simplify)

### 2-1. system_state.recentDecisions D-145 형식 정정

**before**:
```js
recentDecisions: ["D-145", {id:"D-144", ...}, ...]
```

**after**:
```js
recentDecisions: [
  {id:"D-145", date:"2026-05-02", axis:"Jobs↔Ace 호출 분리 원칙 + skill Step 0/0b 1줄 위임 + Nexus topicType 판정 SOT + history forbid 표현 정정", summary:"(a) Step 0... (d) history forbid..."},
  {id:"D-144", ...},
  ...
]
```

**근거**: 기존 4 entry 모두 `{id, date, axis, summary}` 객체. D-145만 문자열 단독은 형식 비대칭. consume 측 분기 부담.

**Master 결정 불요** — SOT 일관성 회복은 정제 영역 정합. 본 세션 close 직전 Edi 또는 후속 Edi 호출 시 자동 정정 가능.

### 2-2. current_session.notes entry 2 정정 또는 삭제

**before**:
```
"5건 caveats(D-130/132/133/141/143) acked/resolved 분류 Master 결정 동반"
```

**after (옵션 A — 정정)**:
```
"6건 caveats(D-137·138·141·142·143·144) acked/resolved 분류 Master 결정 동반"
```

**after (옵션 B — 삭제)**: notes 배열에서 제거. oneLineSummary가 정확값 보유.

**권고: 옵션 B (삭제)** — Master 메모리 `simple_growth_not_measurement` 정합. notes는 open 시점 placeholder. 종결 시점 oneLineSummary가 SOT.

### 2-3. project_charter.history 단조 증가 / version 정합

**실측**: history len 27, 마지막 3 entry version: "2.19", "v2.20", "**v0.01**"

**점검 결과**: 
- D-144 박제 시 `era_history` 분리 + `v0.00 → v0.01` 표기 전환이 D-144 결정 (history[] 28 entry 불변 박제됨) — 본 세션 D-145가 새로 +1 추가하여 27 entry 됐는데, **D-144 시점 28 entry 박제와 1건 차이**. 
- `pc.version` 필드는 `undefined` (top-level). version 라이브 값은 어디?

**의심**: D-144 박제 시점에 `pc.history` len 추정값과 실측 차이. 본 세션 scope 외 — `arki_rev2.md history[] 26 anomaly 점검` 결과(D-145 axis (d))로 이미 처리됨. **그대로 둔다.**

단 **`pc.version` top-level 부재**는 Refine 후보 — `charter.version` 또는 `eras` 객체 내부에 박제됐을 가능성. 본 토픽 scope 외 PD 후보.

### 2-4. versionBump.reason 텍스트 길이

**실측 (current_session.versionBump.reason, 약 160자)**:
> "PD-056 본체 7 Phase 완결 + D-145(Jobs↔Ace↔Nexus 분리 원칙) 신규 결정 박제. capacity 확장 단일 정책. skill 본문은 옵션 B 1줄 위임으로 보존, CLAUDE.md Nexus Open Protocol 섹션은 D-145의 mirror. 세션당 +0.1 캡 미돌파."

**판정**: **그대로 둔다.** 4문장은 D-130 룰 적용 근거 명시(structural vs capacity 판정·skill 옵션 B 보존·CLAUDE.md mirror·캡 정합)로 모두 정보값. 장황 아님.

### 2-5. evidence_index E-020 finding 길이

**실측 (90자)**:
> "spec docs/dashboard-upgrade-v2-spec.md \"5건\" anchor가 PD-056 resolveCondition 본문까지 오염시킴. Arki rev1 실측 결과 6건(D-137·138·141·142·143·144) 정정. anchoring 편향 적출."

**판정**: **그대로 둔다.** 출처(jobs_rev1 Step 6) + finding 핵심(anchor 오염 경로) + 실측 정정값(6건 ID 명시) 정보 밀도 높음. 보고서 인용으로도 finding 본문 충분 전달.

### 2-6. masterDecisions array 형식 — 이전 세션 패턴과 정합

**실측**: `current_session.masterDecisions[0]` = `{session, topic, date, decisions: string[10]}`. 
- decisions는 string array (각 결정 1줄)
- ledger 박제 패턴(`{axis, values, scope}` 3필드)과 다른 형식

**점검**: 직전 세션(session_167 / topic_144)의 masterDecisions 형식 확인 필요 — 본 점검 scope 외 (session_index 비교 작업 무거움). 본 entry 형식은 self-consistent + Master 의사결정 추적 가능 → **그대로 둔다.**

### Refine 결과
- **합친다 (즉시 적용 권고)**: 2건 (recentDecisions D-145 객체화 / notes entry 2 삭제)
- **그대로 둔다**: 4건

---

## §3. Audit (security-review)

### 3-1. 하드코딩 카운트 표 (자산 7건 전수)

| 검토 패턴 | 자산 | hits | 판정 |
|---|---|---|---|
| 절대 경로 (`C:\\`, `/Users/`, `file:///`) | 7건 전수 | **0** | ✅ pass |
| API key / token / secret / password / credential | 7건 전수 | **0** | ✅ pass |
| `session_168` 하드코딩 | current_session, master_feedback_log F-session_168, evidence E-020, decision_ledger D-145, system_state, topic_index | 다수 | ✅ 정당 (현재 세션 ID, SOT) |
| `topic_145` 하드코딩 | 6 자산 | 다수 | ✅ 정당 (현재 토픽 ID, SOT) |
| 외부 URL | 7건 전수 | **0** | ✅ pass (anchor governance §3-2 별도) |

### 3-2. anchor governance 외부 URL 점검

**Edi rev1 §8.2** (보고서 본문)에서 외부 anchor 출처 식별자 누락 3건 list-up:
1. Jobs Tversky & Kahneman 1981 *Science* 211(4481):453–458 — DOI 미부착
2. Ace Porter/Keynes 학파명만 — 출처 식별자 없음
3. Arki Rich Hickey "Simple Made Easy" 2011 — URL 미부착

**판정**: 박제된 자산 7건에는 외부 URL 0건. anchor 인용은 보고서 markdown 본문에 한정 — Edi가 anchor governance 분담(D-125)으로 list-up 완료. **Zero 침범 영역 아님.**

### 3-3. PII / 사용자 데이터 누출

- `caveats` 본문이 dashboard에 노출(의도된 회피 가시화) — 시스템 결정 메타데이터, 외부 사용자 데이터 아님. **Audit pass.**
- master_feedback_log F-session_168 entry — Master 의사결정 압축, 외부 PII 0.

### 3-4. 무결성 / SOT 정합 검사

- D-145 entry: decision_ledger.json + session_index decisions array(`current_session.decisions: ["D-145"]`) 동시 박제 정합 ✅
- PD-056: system_state.pendingDeferrals 배열 내 `status: "resolved"` + `resolvedInSession: "session_168"` + `resolvedAt: "2026-05-02"` 정합 ✅
- topic_145 status: SOT(`topic_index.json`) `"completed"` ✅, mirror(`topics/topic_145/topic_meta.json`)는 본 점검 scope에서 미확인 — D-F 정책상 SOT 변경 시 `updateTopicStatus()` 헬퍼 자동 갱신 책임. Edi 박제 도구가 헬퍼 사용했다면 정합. **info: mirror 일치 확인 후속 권고.**

### Audit 결과
- **violations**: 0건
- **info (후속 권고)**: 1건 (topic_meta.json mirror 일치 확인)

---

## §4. 종합 판정

### 결과 카운트
- **지운다**: **0건**
- **합친다**: **2건** (recentDecisions D-145 객체화 / notes entry 2 삭제)
- **그대로 둔다**: **6건** (D-145 3필드 패턴 / D-145 axis 4책임 / F-session_168 mirror / evidence ID 역순 / charter version 부재 / versionBump.reason / E-020 finding / masterDecisions 형식)

### 임팩트 큰 발견 (Master 보고용 1~2건)

1. **🟡 합친다 — system_state.recentDecisions D-145 형식 비대칭**: D-145만 문자열 단독("D-145"), 다른 4 entry는 객체. consume 측 분기 부담 + SOT 일관성 위배. **즉시 적용 권고 (Master 결정 불요, 정제 영역 정합)**. Edi 또는 후속 정제 hook이 D-145 객체화 박제.

2. **🟡 합친다 — current_session.notes entry 2 잘못된 ID**: "5건 caveats(D-130/132/133/141/143)" 박제됐으나 실측 6건 D-137·138·141·142·143·144. open 시점 placeholder 잔재. 옵션 B(삭제) 권고 — oneLineSummary가 정확값 SOT.

### Master 결정 필요 항목
- **0건**. 두 Refine 모두 Zero 영역 자율 적용 가능.

### 즉시 적용 가능 여부
- 두 Refine 항목 모두 본 세션 close 직전 직접 박제 또는 후속 세션 정제 작업으로 처리 가능. 차단 갭 0.

---

## Master 직접 보고용 (200자)

자산 7건 정제 점검 — 지운다 0 / 합친다 2 / 그대로 둔다 6. 임팩트 큰 발견 2건: (1) system_state.recentDecisions D-145 형식 비대칭(문자열 vs 객체) → 객체화 권고 / (2) current_session.notes entry 2 잘못된 caveats ID(D-130/132/133/141/143 → 실측 6건) → 옵션 B 삭제 권고. 두 건 모두 정제 영역 자율, Master 결정 불요. credential·secrets·PII 누출 0. SOT 정합(D-145 박제·PD-056 resolved·topic_145 completed) 정상. 즉시 적용 가능.

---

ZERO_REFINE_DONE: reports/2026-05-02_pd056-ackedbutunresolved-impl/zero_rev2.md

[ROLE:zero]
# self-scores
cut_count: 0
refine_count: 2
audit_violations: 0
sec_pass: Y
