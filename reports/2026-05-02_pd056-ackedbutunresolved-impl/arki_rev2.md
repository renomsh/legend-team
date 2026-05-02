---
role: arki
turnId: 2
invocationMode: subagent
session: session_168
topic: topic_145
topicSlug: pd056-ackedbutunresolved-impl
date: 2026-05-02
rev: 2
recallReason: phase-transition
scope: 확장 scope 6~9 구조 설계 + Phase 5~7 + history[] 26 anomaly 점검
accessed_assets:
  - file: reports/2026-05-02_pd056-ackedbutunresolved-impl/arki_rev1.md
  - file: reports/2026-05-02_pd056-ackedbutunresolved-impl/jobs_rev1.md
  - file: .claude/skills/jobs-framing/SKILL.md
  - file: .claude/skills/ace-framing/SKILL.md
  - file: .claude/commands/open.md
  - file: CLAUDE.md
  - file: memory/shared/project_charter.json
---

에이키입니다. Master 6번 결정으로 추가된 확장 scope 6~9의 구조 설계와 Phase 5~7 실행계획, 그리고 부수 점검 사항인 history[] 26 anomaly의 git diff 실측 결과를 박제합니다. 본 turn은 phase-transition 재호출이며, 코드·spec·skill·hook·charter 4축 교차 검증 결과 R-9(scope 추가에 따른 3세션 한계 재악화)를 우선 적출하고 mitigation을 동봉합니다.

---

## §1. 확장 scope 6~9 의존 그래프

### 1.1 결정 박제 → 본문 수정 → 박제 위치 선정 선후 관계

```
[전제] D-145 결정 박제 (Master inline 1턴)
   │  Jobs↔Ace↔Nexus 호출 분리 원칙 + Step 0/0b 책임 이전 결정
   │
   ├─→ scope 7: jobs-framing/SKILL.md Step 0/0b 처리
   │       │  옵션 A(완전 삭제+번호 재정렬) vs 옵션 B(1줄 위임 표기)
   │       │
   ├─→ scope 8: ace-framing/SKILL.md Step 0/0b 처리
   │       │  scope 7 동일 패턴 + ace 고유 시각 잔여 검토
   │       │
   └─→ scope 9: Nexus topicType 판정 박제 위치
           │  CLAUDE.md(canonical) + .claude/commands/open.md(operational)
           │  단일 출처 원칙 = CLAUDE.md, open.md는 참조 링크만
```

**의존성 핵심:** scope 6(D-145 박제)이 선결되지 않으면 scope 7·8·9는 모두 정당성 결여. 6 → 7·8·9 순서 강제. 7과 8은 병렬 가능, 9는 7·8과 독립이지만 같은 Phase에 묶어 1턴 압축 가능.

### 1.2 짓지 않음 옵션 검토 (Rich Hickey 원칙 의무)

**옵션 Z — 본문 수정 0, 운영 합의만 박제:**

scope 7·8을 skill 본문에서 수정하지 않고, D-145 결정문에 "Jobs/Ace skill의 Step 0·0b는 향후 호출 시 Nexus 영역으로 위임된 것으로 해석한다"는 1줄 운영 규칙만 박제. 본문은 보존.

| 평가축 | 옵션 Z (짓지 않음) | 옵션 A (완전 삭제) | 옵션 B (1줄 위임 표기, **권고**) |
|---|---|---|---|
| 마이그레이션 비용 | 0 | 중(번호 재정렬·참조 깨짐) | 저(1줄 추가) |
| 코드 잔재 | 잔재 100%(혼선 위험) | 0 | 잔재 0%(명시 위임) |
| 향후 인입자 인지부하 | 고(D-145 모르면 오해) | 저 | 저 |
| 롤백 비용 | 0 | 고 | 저 |

**채택: 옵션 B.** 옵션 Z는 `claude_design_vs_plugin_skills` 메모리 정합 위배 — skill 본문이 사실상 거짓이 되면 Master/Claude가 모두 misled. 옵션 A는 번호 재정렬로 외부 참조(CLAUDE.md `Topic Lifecycle System` 섹션이 Step 0 참조) 깨짐 위험. 옵션 B는 본문에 "DEPRECATED — Nexus 영역으로 이전 (D-145, 2026-05-02). 본 Step은 호출되지 않음" 1줄로 박제 + 번호 보존.

### 1.3 단일 출처 (SOT) 정합

scope 9의 Nexus topicType 판정 박제 위치는 **CLAUDE.md가 SOT, `.claude/commands/open.md`는 mirror.** Topic Status SOT 정책(D-F)과 동일 패턴. `dispatch_config rules.edi 박제 (D-143)`도 동일 — config는 SOT, hook 인라인 enforcement는 mirror. 하나의 정책을 두 파일에 동시 정의 금지.

---

## §2. Phase 5~7 실행계획

### Phase 5 — D-145 결정 박제 (scope 6)

**무엇을:** `memory/shared/decision_ledger.json`에 D-145 entry 신설.

**구조:**

```json
{
  "id": "D-145",
  "date": "2026-05-02",
  "session": 168,
  "topic": "topic_145",
  "axis": "Jobs↔Ace↔Nexus 호출 분리 원칙 — Step 0/0b 책임 이전",
  "decision": "토픽 오픈 흐름은 Nexus(Step 0·1) → Jobs(Step 2, 명시 호출 시) → Ace(Step 3, 명시 호출 시)로 단계 책임 분리. Jobs/Ace skill에서 토픽 생명주기 판정·PD 교차검증 책임 제거. 이행은 Phase 6·7에서 박제.",
  "alternatives": ["옵션 Z(본문 수정 0)", "옵션 A(완전 삭제+번호 재정렬)", "옵션 B(1줄 위임 표기)"],
  "rationale": "framing skill이 Nexus 영역(생명주기·PD 교차검증)까지 침범하면 SRP 위배 + Sage isolation 같은 책임 분리 원칙(D-128)과 비정합. Master 결정 6/6.",
  "caveats": ["Phase 6·7이 본 세션 내 박제되지 않으면 D-145 잔재만 남고 skill 본문은 misled 상태"],
  "caveatsMeta": {
    "acked": false,
    "ackedBySession": null,
    "ackedAt": null,
    "resolvedAt": null,
    "scope": null
  }
}
```

**검증 게이트 G5:**
- D-145 entry JSON parse 통과
- caveatsMeta 5필드 모두 부착 (Phase 0 마이그레이션과 정합)
- decision_ledger.decisions 길이 +1
- session_index의 decisions 배열에도 "D-145" 추가 (`session-end-finalize.js` 자동 처리 대상)

**롤백:** decision_ledger.json git checkout + session_index 항목 제거.

---

### Phase 6 — jobs-framing·ace-framing skill 본문 수정 (scope 7·8)

**무엇을:** 두 skill의 Step 0·Step 0b를 옵션 B 방식으로 deprecate.

**구조 (jobs-framing/SKILL.md 기준):**

```diff
 ### Step 0. 토픽 생명주기 판정 (D-057 승계)
+
+> **DEPRECATED (D-145, 2026-05-02).** 본 Step은 Nexus 영역으로 이전됨.
+> Jobs는 호출 시점에 topicType이 이미 판정되어 있다 전제하고 Step 1부터 시작한다.
+> 자세한 위치는 CLAUDE.md `Topic Lifecycle System` 섹션 참조.

 첫 발언 **최상단**:
 - **topicType**: ...
 (이하 본문 보존)

 ### Step 0b. PD 교차검증 (D-065 승계)
+
+> **DEPRECATED (D-145, 2026-05-02).** Nexus가 `/open` 단계에서 PD 교차검증 수행.
+> Jobs는 PD 이행 토픽이라도 본 Step을 건너뛴다.

 PD를 이행하는 토픽이면 다음 3행 포함:
 (이하 본문 보존)
```

**ace-framing/SKILL.md** 동일 패턴. 추가 검토 — ace-framing Step 0의 "ace 고유 시각의 별도 판정"이 Jobs와 다른가? 본문 read 결과 동일 enum(framing/implementation/standalone) 사용. **결론: 중복.** 차별화 없으므로 동일하게 deprecate.

**검증 게이트 G6:**
- 두 skill frontmatter `description` 변경 없음 (호환성 보존)
- Step 1~ 번호 변경 없음 (외부 참조 깨짐 방지)
- DEPRECATED 블록 grep 검출 ≥ 4건 (skill 2개 × Step 0/0b)
- 신규 토픽 시뮬레이션 호출 시 hook이 두 skill 정상 로드

**롤백:** skill 2파일 git checkout 1줄.

---

### Phase 7 — Nexus topicType 판정 박제 (scope 9)

**무엇을:** CLAUDE.md `Topic Lifecycle System` 섹션 또는 신규 `Nexus Open Protocol` 섹션에 topicType·parentTopicId 자동 추론 알고리즘 박제.

**박제 위치 옵션 (3안):**

| 옵션 | 박제 위치 | 장점 | 단점 |
|---|---|---|---|
| (a) CLAUDE.md `Topic Lifecycle System` 섹션 확장 | 기존 섹션 + Nexus Step 명시 | 단일 출처, D-130/D-133 정합 | 섹션 비대화 |
| (b) `.claude/commands/open.md` Step 5·6 사이 분기 추가 | operational 명령 정의에 직접 박제 | 즉시 운영 효력 | CLAUDE.md SOT 위배(SOT 분산) |
| (c) hook 파일(`user-prompt-submit-master-first.js`) 보강 | 자동 enforcement 강제 | D4(설득 무력화) 정합 | LoC 비대화·테스트 부담 |

**채택: (a) + (b) 보조.** CLAUDE.md가 SOT, open.md는 "Step 5에서 Nexus가 CLAUDE.md `Topic Lifecycle System` §Nexus Open Protocol 알고리즘 적용" 1줄 참조만. (c)는 본 토픽 scope 외 — 향후 PD로 분화.

**판정 알고리즘 (CLAUDE.md 박제 본문):**

```
### Nexus Open Protocol — topicType 자동 추론 (D-145, 2026-05-02)

`/open` Step 5(또는 toptopicType 판정 시점)에서 Nexus가 다음 알고리즘 수행:

1. **parentTopicId 추출 시도:**
   - Master 명시: "topic_NNN의 child" / "PD-NNN 이행" → parentTopicId 확정
   - pendingDeferrals 매칭: 토픽 제목 키워드 ∩ PD resolveCondition → parent 후보
   - 직전 세션 framing 토픽 status: framing → parent 후보

2. **topicType 판정:**
   - parentTopicId 명시 ∨ PD 이행 → `implementation`
   - 토픽 제목에 "framing" / "전략" / "설계" / "구조 검토" 키워드 + parentTopicId null → `framing`
   - 둘 다 아님 → `standalone`

3. **Master-first 모호 분기:**
   - Grade S/A/B + 키워드 충돌(예: "framing 구현") → Nexus가 1줄 질문 후 Master 답변으로 확정
   - Grade C/D → standalone 기본값, 질문 생략

4. **결과 박제:**
   - `create-topic.ts --topicType ... --parentTopicId ...` 인자 자동 주입
   - `topic_index.json` SOT + `topic_meta.json` mirror 동시 갱신 (D-F)
```

**검증 게이트 G7:**
- CLAUDE.md grep `Nexus Open Protocol` 1건 매칭
- open.md grep `Topic Lifecycle System` 참조 1건 매칭 (mirror)
- 신규 implementation 토픽 1건 시뮬레이션: parentTopicId 자동 추출 성공
- 신규 framing 토픽 시뮬레이션: 키워드 매칭 성공
- Grade D 단발 토픽: standalone 기본값 적용

**롤백:** CLAUDE.md + open.md 2파일 git checkout.

---

## §3. history[] 26 anomaly — git diff 실측 결과

### 3.1 실측 (Master 보고용 핵심)

```bash
# HEAD vs working tree 비교
$ git show HEAD:memory/shared/project_charter.json | jq '.history | length'
26
$ cat memory/shared/project_charter.json | jq '.history | length'
26
$ git diff HEAD -- memory/shared/project_charter.json
(no output)
```

**결과: HEAD == working tree. 본 세션에서 charter 변경 0건.**

### 3.2 commit별 history 길이 추적

```
4612ca7 (HEAD,  session 165 close)         : history=26  era_history=0
00909d5 (session_165 finalize)             : history=26  era_history=0
3cd3617 (bigbang-completion-review-part5)  : history=26  era_history=0
47665a2 (part4)                            : history=25
8db3f62 (part3)                            : history=24
6bd0c66 (initial review)                   : history=23
d350915 (versionBump 2.17→2.18)            : history=22
5d114c3 (nexus-structure-v1)               : history=22
0fbded1 (sage-r1-paradox-block-hook)       : history=21
c6f13c7 (big-bang-legend-nexus-p3)         : history=20
```

**관찰:**
- history는 단조 증가 (20 → 26).
- era_history는 모든 commit에서 0. 분리 박제 흔적 없음.
- 26은 직전 3개 commit(part5·session_165·HEAD)에서 안정.

### 3.3 forbid 표현 정정 결론

**Arki rev1·이전 세션이 "history[] 28 entry 불변"으로 박제한 forbid는 사실관계 오류.**

- 실제 28이었던 적 없음 (commit 추적 결과 최대값 26).
- "본 세션에서 26으로 줄었다"는 추정도 거짓 — HEAD 본 세션 변경 0건.
- 추정 오류의 원인: 직전 세션 메모리 anchoring(spec "5건"과 동일 패턴, Jobs Step 6 anchoring 발견 정합).

**판정:**
- forbid 위반 여부: **위반 없음** (변경 자체가 없음).
- forbid 표현 정정 필요성: **있음** (사실관계 오류 잔존 시 향후 세션이 동일 anchoring 재생산).

**Mitigation:**
- 본 세션 Edi 박제 시 forbid를 다음으로 정정:
  - 변경 전: "history[] 28 entry 불변"
  - 변경 후: "history[] entry 단조 증가 보존 (현재 26, 신규 era 발생 시에만 +1)"
- evidence_index.json에 E-NNN 기록: "anchor 오류 — history 28 anchoring은 미실증"

**Fallback:** 정정도 안 하고 무시 — 다음 세션이 또 anchor에 끌릴 위험. 권장 X.

---

## §4. 리스크 + mitigation + fallback

| ID | 리스크 | mitigation | fallback |
|---|---|---|---|
| R-6 | skill 본문 옵션 B 적용 시 외부 참조(CLAUDE.md) 깨짐 | DEPRECATED 블록 추가만, Step 번호·본문 보존. grep 검증 G6 | git checkout 2파일 |
| R-7 | Nexus topicType 박제 위치 분산(CLAUDE.md + open.md + hook) → SOT 위배 | (a) CLAUDE.md SOT 단일, open.md는 참조 1줄. (c) hook은 본 토픽 scope 외 | (b) 단독 채택으로 후퇴 |
| R-8 | history[] forbid 표현 정정이 다른 forbid 정정 욕구를 유발 → scope 확장 | 본 토픽은 history[] 1건만 정정, 다른 forbid는 별도 PD | 정정 미수행, evidence_index 기록만 |
| R-9 | scope 4건 추가로 본 세션 부담 급증 → 3세션 한계 재악화 | Phase 5(D-145)는 Master inline 1턴. Phase 6·7은 Edi 단일 배치 박제로 1턴 압축. 총 +2턴 한계 | child 분화(권장 X — `no_premature_topic_split` 위배) |
| R-10 | D-145 caveats가 Phase 0 마이그레이션 직후라 caveatsMeta 미부착 시 acked 추적 불가 | Phase 0와 Phase 5를 같은 마이그레이션 스크립트에서 처리 — D-145 신설 시 caveatsMeta 5필드 자동 부착 | 수동 1회 부착 |
| R-11 | scope 9 알고리즘이 Master-first hook(`user-prompt-submit-master-first.js`)과 충돌 | 본 토픽은 알고리즘 정의만 박제. hook 보강은 별도 PD로 분화 | 정의 박제 후 enforcement 미구현 — D4 정신 위배 일시 허용 |

**R-9 우선 적출:** Master에게 "1턴 일괄 결정 압축" 명시 동의 필요. Phase 5·6·7을 한 메시지에 묶어 Master inline 결정 → Edi 단일 박제로 처리 가능.

---

## §5. forbid (rev1 승계 + 정정 1건)

### rev1에서 승계 (변경 없음)
- 절대 시간 어휘 금지 (`D+N일`, `N주차`, `MM/DD`, 구체 날짜)
- 인력 배정 어휘 금지 (`담당자:`, 특정 이름, `PD`, `MM`)
- 공수 단위 어휘 금지 (`N시간`, `N일 소요`, `공수`)
- caveats 자동 분류 금지 (Master 수동 100%)
- 본 토픽 외 파일 변경 금지 (CLAUDE.md·skill·hook·charter·decision_ledger 외 금지)

### 정정 1건 (history anomaly 점검 결과)
- ~~"history[] 28 entry 불변"~~ → **"history[] entry 단조 증가 보존 (현재 26, 신규 era 발생 시에만 +1)"** (실측 근거 §3.2)

### 신규 1건 (scope 9 정합)
- Nexus topicType 판정 알고리즘은 CLAUDE.md SOT만 박제. open.md는 참조 1줄, hook 추가 박제 금지(별도 PD).

---

## §6. 자기감사 라운드 1 — 4축 점검

| 축 | 발견 | ROI 라벨 |
|---|---|---|
| structuration | scope 9 (a)/(b)/(c) 옵션 분리, 3축 채택 명시 | MUST_NOW |
| structuration | Phase 6 옵션 B의 DEPRECATED 블록 위치 — Step 헤더 직후 vs 본문 끝 → 헤더 직후 권고 | MUST_NOW |
| structuration | scope 7·8이 jobs/ace 동일 패턴 — 헬퍼 스크립트 한 번에 적용? → No, 본문이 미세하게 다름 (수동 권고) | NICE |
| hardcoding | Nexus 알고리즘 키워드 리스트("framing", "전략", "설계", "구조 검토") CLAUDE.md 인라인 — config 파일로 빠질 수 있는가? → 본 토픽 scope 외, 향후 PD | DEFER |
| hardcoding | D-145 entry session 번호 168 하드코딩 — 정상(결정 메타) | No issue |
| efficiency | Phase 5·6·7 1턴 압축이 R-9 mitigation 핵심 — Edi 단일 배치 박제 가능 | MUST_NOW |
| efficiency | Phase 6 두 skill 동시 박제 → Edit 도구 2회 호출 정상 | No issue |
| extensibility | 향후 ace-framing 부활 시 DEPRECATED 블록 제거만으로 복구 가능 (옵션 B 채택 정당화) | MUST_NOW |
| extensibility | Nexus 알고리즘이 Grade C/D에서 standalone 기본값만 적용 → 향후 더 정교한 분류 필요 시 알고리즘 §2 확장 가능 | NICE |

**자기감사 라운드 1 결론:** 발견 9개. MUST_NOW 4건은 본 보고서에 박제 완료. 라운드 2 필요 여부 = scope drift 우려 작음(본문 추가 없이 검증만), R-9 우선 처리 후 라운드 2는 Master 판단.

---

## §7. spec 동결 (Dev 인계 직전)

- Phase 0~7 동결.
- caveats 형식 = `string[]` (D-141 패턴).
- caveatsMeta = entry-level 5필드.
- TTL = 고정 2 세션 (env 외부화 OUT).
- Nexus 알고리즘 = CLAUDE.md SOT.
- skill DEPRECATED 방식 = 옵션 B (1줄 위임 표기).
- forbid 정정 = history 표현 1건만.

Dev 인계 후 spec 변경 시 Arki 재호출 의무.

---

## Master 직접 보고용 요약 (250자)

확장 scope 6~9 구조 설계 박제. D-145(Phase 5)→skill DEPRECATED 옵션 B(Phase 6)→CLAUDE.md SOT 단일 박제(Phase 7) 의존 그래프 + 게이트 G5/G6/G7 + 롤백. history[] 28 forbid는 git diff 실측 결과 미실증, 단조 증가 26으로 표현 정정 권고. R-9(scope 추가→3세션 한계 재악화) mitigation은 Phase 5·6·7 1턴 압축. Master inline 1턴 결정 동의 필요.

ARKI_SPEC_DONE: reports/2026-05-02_pd056-ackedbutunresolved-impl/arki_rev2.md

[ROLE:arki]
# self-scores
aud_rcl: Y
str_fd: 4
spc_lck: Y
sa_rnd: 1
