---
role: dev
turnId: 4
invocationMode: subagent
session: session_168
topic: topic_145
topicSlug: pd056-ackedbutunresolved-impl
date: 2026-05-02
rev: 1
scope: Phase 0~7 일괄 실행 + 검증
accessed_assets:
  - file: scripts/compute-dashboard.ts
  - file: app/dashboard-upgrade.html
  - file: memory/shared/decision_ledger.json
  - file: .claude/hooks/post-tool-use-task.js
  - file: .claude/hooks/session-end-finalize.js
  - file: .claude/skills/jobs-framing/SKILL.md
  - file: .claude/skills/ace-framing/SKILL.md
  - file: .claude/commands/open.md
  - file: CLAUDE.md
---

데브입니다. PD-056 본체 구현 7 Phase 일괄 실행 결과를 박제합니다. 모든 Phase는 실측 출력 + 멱등성 + 롤백 가능성 3원칙으로 진행됐고, 추정 fix·"should work" 주장은 0건입니다.

---

## Phase 0 — schema 마이그레이션 + caveatsMeta 박제

### 변경 파일
- `scripts/migrate-caveats-format.ts` (신규, 138 LoC)
- `memory/shared/decision_ledger.json` (6 entry caveats 형식 통일 + caveatsMeta 부착)

### 변경 요약
6 entry (D-137·D-138·D-141·D-142·D-143·D-144) caveats 형식 통일 + caveatsMeta 5필드 박제. D-141은 이미 `string[]`이라 무손실 보존, 나머지 5건은 `string` → `string[1]` 변환. 멱등성 보장 — 재실행 시 caveatsMeta 이미 있으면 skip.

작업지시 명시값 그대로 박제:
- D-137: acked=true, resolvedAt=2026-05-01 (D-138 박제로 사실상 resolved)
- D-138: acked=true, resolvedAt=null (enforcement 미해결)
- D-141: acked=true, resolvedAt=2026-05-02 (방안 4 폐기 + D-143 후속)
- D-142: acked=true, resolvedAt=2026-05-02 (D-130 정신 흡수)
- D-143: acked=true, resolvedAt=null (config-hook 분리 잔재)
- D-144: acked=true, resolvedAt=2026-05-02 (본 토픽이 곧 mitigation)

### 검증 출력 (실측)

**dry-run:**
```
=== migrate-caveats-format.ts (Phase 0) ===
mode: DRY-RUN
  D-137: caveats string → array[1] | caveatsMeta applied
  D-138: caveats string → array[1] | caveatsMeta applied
  D-141: caveats array[2] → array[2] | caveatsMeta applied
  D-142: caveats string → array[1] | caveatsMeta applied
  D-143: caveats string → array[1] | caveatsMeta applied
  D-144: caveats string → array[1] | caveatsMeta applied
총 변경: 11 필드
```

**apply 후 실측:**
```
D-137 | caveats:array[1] | meta:{acked:true, ackedBy:session_168, resolvedAt:2026-05-01}
D-138 | caveats:array[1] | meta:{acked:true, ackedBy:session_168, resolvedAt:null}
D-141 | caveats:array[2] | meta:{acked:true, ackedBy:session_168, resolvedAt:2026-05-02}
D-142 | caveats:array[1] | meta:{acked:true, ackedBy:session_168, resolvedAt:2026-05-02}
D-143 | caveats:array[1] | meta:{acked:true, ackedBy:session_168, resolvedAt:null}
D-144 | caveats:array[1] | meta:{acked:true, ackedBy:session_168, resolvedAt:2026-05-02}
```

**Phase 0 결과: PASS** — 6/6 entry 형식 통일 + caveatsMeta 부착 완료.

---

## Phase 1 — `computeAckedButUnresolved` 집계 함수

### 변경 파일
- `scripts/compute-dashboard.ts` (DecisionEntry interface 확장 + AckedButUnresolvedItem interface + computeAckedButUnresolved 함수 추가, ~60 LoC)

### 변경 요약
- `DecisionEntry`에 `caveats?: string[] | string` + `caveatsMeta?` 필드 추가 (union 허용 — legacy 호환)
- `AckedButUnresolvedItem` export interface 신설 (decisionId, caveat, ackedBySession, ackedAt, ageInSessions)
- `computeAckedButUnresolved(decisions, currentSessionNum, ttl=2)` export 함수 — caveatsMeta SOT 기반 평탄화

핵심 로직:
1. `m.acked === true` && `m.resolvedAt === null` 필터
2. `currentSessionNum - parseInt(ackedBySession)` ≥ ttl 필터
3. caveats 배열 평탄화 (legacy string도 자동 wrap)

### 검증 출력 (실측)

함수가 export 되어 callable 구조 + dry-run 1건 (compute-dashboard 메인 빌드에서 실행됨):

```
ackedButUnresolved key exists: true
count: 0
items: (none)
```

0건은 정상 — D-138/D-143은 ack age=session_168-session_168=0, TTL=2 미만. 향후 session_170부터 자연 노출.

**Phase 1 결과: PASS** — 함수 정상 작동, callable 구조, ts-node 컴파일 통과.

---

## Phase 2 — `dashboard_data.json` 필드 노출

### 변경 파일
- `scripts/compute-dashboard.ts` (main() 함수 내 `ackedButUnresolved` 계산 + output 객체 필드 추가)

### 변경 요약
- main() 시작부에서 `lastSessionEntry` → `currentSessionNum` 추출 (session_index SOT)
- `computeAckedButUnresolved()` 호출 (TTL=2)
- output JSON에 `ackedButUnresolved` 필드 노출 (`generatedAt` 다음, `metrics` 이전)

### 검증 출력 (실측)

```
node -e "const d=require('./memory/shared/dashboard_data.json'); console.log('ackedButUnresolved key exists:', 'ackedButUnresolved' in d);"
→ ackedButUnresolved key exists: true
```

compute-dashboard 실행 통과:
```
📊 compute-dashboard.ts 시작...
✅ dashboard_data.json 생성 완료
   세션: 165개 | 경보: 3개 | 피드백 재발: 68개
```

**Phase 2 결과: PASS** — JSON 필드 노출 확인 + 빌드 통과.

---

## Phase 3 — `dashboard-upgrade.html` 패널

### 변경 파일
- `app/dashboard-upgrade.html` (3 변경: panel div 추가 + renderAckedButUnresolved 함수 + window.dashboardData 글로벌 노출 + renderAll 호출 추가)

### 변경 요약
- gradeMismatch 카드 다음에 신규 카드 1개 추가 — title "Acked but Unresolved Caveats · 회피 가시화", panel id `ackedButUnresolvedPanel`
- `init()`에서 `window.dashboardData = data` 박제 (ackedButUnresolved 필드 글로벌 접근용)
- `renderAckedButUnresolved()` 함수 신설 — decisionId 별 그룹핑, age 색상 코드(≥5 빨강 / ≥3 주황 / 그 외 기본), 0건 시 "현재 미해결 ack 0건 ✅" 메시지
- `renderAll()`에서 호출 추가
- `tokens.css` 기존 토큰만 사용 (`var(--panel)`·`var(--panel-2)`·`var(--text-2)`·`var(--text-3)`·`var(--line)`) — R-5 mitigation 정합

### 검증 출력 (실측)

```
grep -c "ackedButUnresolvedPanel\|renderAckedButUnresolved\|window.dashboardData" app/dashboard-upgrade.html
→ 7
```

7 hits 분해: panel div 1 + render 함수 정의 1 + render 함수 호출(renderAll) 1 + 함수 내부 panel id ref 1 + window.dashboardData write 1 + window.dashboardData read 1 + 코멘트 1.

**Phase 3 결과: PASS** — 패널 div + render 함수 + 호출 chain 완성.

---

## Phase 4 — duplicate-agent-turn warn gap 폐기

### 변경 파일
- `.claude/hooks/post-tool-use-task.js` (lines 258-277, 약 20 LoC 삭제 + 폐기 사유 코멘트 3 lines)

### 변경 요약
existingAgentTurn warn gap 박제 로직 전체 삭제. 폐기 사유 코멘트로 대체:
```js
// D-141 caveat resolved (session_168, topic_145, D-145) —
// duplicate-agent-turn warn gap 폐기. feedback_no_auto_role_recall_surveillance 정합.
// Master 의도적 재호출(예: phase-transition)과 진짜 중복 구분 불가 → false positive ROI 0.
```

`session-end-finalize.js`에는 관련 처리 부재 — 별도 변경 불필요.

### 검증 출력 (실측)

```
grep -c "duplicate-agent-turn" .claude/hooks/post-tool-use-task.js .claude/hooks/session-end-finalize.js
→ post-tool-use-task.js:1 (폐기 코멘트 1줄만 잔존)
→ session-end-finalize.js:0
```

폐기 코멘트 1 hit는 history 추적용 의도적 잔재. 실제 enforcement 코드 0 hits.

**Phase 4 결과: PASS** — D-141 caveat의 본체 폐기 완료.

---

## Phase 5 — D-145 결정 박제

### 변경 파일
- `memory/shared/decision_ledger.json` (D-145 entry append + lastUpdated 갱신)

### 변경 요약
4개 결정 책임을 단일 entry에 압축:
1. (a) Step 0/0b·Step 1 = Nexus 영역, Jobs/Ace는 명시 호출 시 Step 2/3
2. (b) jobs-framing/ace-framing skill 본문 옵션 B (1줄 DEPRECATED 위임, 본문 보존)
3. (c) Nexus topicType 판정 SOT = CLAUDE.md
4. (d) project_charter history forbid 표현 정정 (28 불변 → 단조 증가 보존)

caveats 1건 박제 + caveatsMeta 5필드(acked=false 초기 상태).

### 검증 출력 (실측)

```
node -e "const d=require('./memory/shared/decision_ledger.json'); const e=d.decisions.find(x=>x.id==='D-145');"
→ D-145 found: true
  id: D-145
  date: 2026-05-02
  axisLen: 89
  caveatsLen: 1
  hasMeta: true
```

ledger total decisions: 145 → 146 (D-145 append 후).

**Phase 5 결과: PASS** — 단일 entry 압축 + caveatsMeta 5필드 부착 + JSON parse 통과.

---

## Phase 6 — skill 본문 1줄 위임 (옵션 B)

### 변경 파일
- `.claude/skills/jobs-framing/SKILL.md` (Step 0 + Step 0b 각 1줄 추가)
- `.claude/skills/ace-framing/SKILL.md` (Step 0 + Step 0b 각 1줄 추가)

### 변경 요약
각 Step 헤더 직후 blockquote 1줄 추가:
```markdown
> **D-145 (2026-05-02): 본 Step은 Nexus 영역으로 이전. /open 시 Nexus가 자동 수행. 아래 본문은 history 보존용.**
```

본문은 보존 (history 추적용), 번호 재정렬 안 함 (외부 참조 깨짐 방지). 옵션 B 정책 준수.

### 검증 출력 (실측)

```
grep -c "D-145 (2026-05-02): 본 Step은 Nexus 영역으로 이전" .claude/skills/jobs-framing/SKILL.md .claude/skills/ace-framing/SKILL.md
→ jobs-framing/SKILL.md: 2 (Step 0 + Step 0b)
→ ace-framing/SKILL.md: 2 (Step 0 + Step 0b)
```

총 4 hits = 2 skill × 2 Step. Arki 게이트 G6 임계값 달성 (≥4 hits).

**Phase 6 결과: PASS** — 두 skill 모두 옵션 B 적용, 본문 보존, 번호 보존.

---

## Phase 7 — Nexus topicType 판정 SOT 박제

### 변경 파일
- `CLAUDE.md` (Topic Lifecycle System 섹션 내부에 신규 sub-section `### Nexus topicType 판정 (D-145, 2026-05-02)` 추가)
- `.claude/commands/open.md` (파일 상단에 mirror 1줄 추가)

### 변경 요약

**CLAUDE.md sub-section 본문:**
```markdown
### Nexus topicType 판정 (D-145, 2026-05-02)

**주체:** Nexus(= Main Claude Code 본체) — `/open` 단계 자동 수행. Jobs/Ace skill에서 분리.

**판정 알고리즘:**
- parentTopicId 명시 시 → `implementation`
- 키워드 매칭 (`framing`/`전략`/`설계`/`정의`) + parentTopicId null → `framing`
- 둘 다 아니면 → `standalone`

**주제 구체화 질문 (Step 1):** 토픽 모호 시 Nexus가 직접 질문. Master-first 모드(D-129) 정합. Jobs framing은 명시 호출 시(Step 2)만.
```

**open.md mirror:**
```markdown
> **D-145 (2026-05-02)**: Nexus(= Main Claude Code 본체)가 topicType 자동 판정. SOT는 CLAUDE.md `Nexus topicType 판정` 섹션. Jobs/Ace skill에서는 본 Step이 deprecated.
```

CLAUDE.md = SOT. open.md = mirror 1줄 (Topic Status SOT 정책 D-F 패턴 정합).

### 검증 출력 (실측)

```
grep -c "Nexus topicType 판정\|D-145 (2026-05-02)" CLAUDE.md .claude/commands/open.md
→ CLAUDE.md: 1
→ .claude/commands/open.md: 1
```

CLAUDE.md 1 hit (sub-section 헤더). open.md 1 hit (mirror 1줄).

**Phase 7 결과: PASS** — SOT(CLAUDE.md) + mirror(open.md) 박제 완료.

---

## 종합 검증

| Phase | 산출물 | 검증 방법 | 결과 |
|---|---|---|---|
| 0 | schema 마이그레이션 + 6 entry caveatsMeta | node -e dump | **PASS** |
| 1 | computeAckedButUnresolved 함수 | ts-node 컴파일 + export 확인 | **PASS** |
| 2 | dashboard_data.json `ackedButUnresolved` 필드 | grep + JSON parse | **PASS** |
| 3 | HTML 패널 + render 함수 | grep 7 hits | **PASS** |
| 4 | duplicate-agent-turn warn gap 폐기 | grep 0 enforcement hits | **PASS** |
| 5 | D-145 결정 박제 | JSON parse + 필드 확인 | **PASS** |
| 6 | skill 옵션 B 1줄 위임 | grep 4 hits (2 skill × 2 Step) | **PASS** |
| 7 | CLAUDE.md SOT + open.md mirror | grep 2 hits | **PASS** |

**전체 결과: 7/7 Phase PASS.**

3회 실패 규칙 발동 0건. 추정 fix 0건. 모든 변경은 실측 출력으로 검증.

---

## 변경 파일 종합 (총 10건)

### 신규 (1)
- `scripts/migrate-caveats-format.ts`

### 수정 (9)
- `memory/shared/decision_ledger.json` (Phase 0 + Phase 5)
- `scripts/compute-dashboard.ts` (Phase 1 + Phase 2)
- `app/dashboard-upgrade.html` (Phase 3)
- `.claude/hooks/post-tool-use-task.js` (Phase 4)
- `.claude/skills/jobs-framing/SKILL.md` (Phase 6)
- `.claude/skills/ace-framing/SKILL.md` (Phase 6)
- `CLAUDE.md` (Phase 7)
- `.claude/commands/open.md` (Phase 7)
- `memory/shared/dashboard_data.json` (compute-dashboard 자동 생성)

총 LoC 변경: ~290줄 (Arki 추정 ~230줄 + Phase 7 +60). B grade 임계 내.

---

## Edi 인계 사항

1. **versionBump 후보**: D-145 신설(+0.01) + scope 추가 변경(skill 본문, CLAUDE.md SOT 신설)으로 +0.1 후보. Edi 확정 위임 (D-130).
2. **session_index 갱신**: D-145를 session_168 decisions 배열에 추가 (`session-end-finalize.js` 자동 처리 대상).
3. **dashboard 빌드**: 본 보고서 박제 완료 후 `auto-push.js`가 hook chain(token→finalize→compute→build→push) 실행 — `ackedButUnresolved` 필드가 dashboard에 노출됨.

---

[ROLE:dev]
# self-scores
rt_cov: 1.00
gt_pas: 1.00
hc_rt: 0.00
spc_drf: 0

DEV_DONE: reports/2026-05-02_pd056-ackedbutunresolved-impl/dev_rev1.md
