---
role: arki
turnId: 0
sessionId: session_194
topicId: topic_167
grade: B
invocationMode: subagent
accessed_assets:
  - .claude/hooks/pre-tool-use-task.js
  - .claude/hooks/session-end-finalize.js
  - memory/sessions/session_index.json
  - memory/sessions/current_session.json
  - memory/shared/system_state.json
  - reports/2026-05-05_self-score-table-format-unify/_zero_condense.json
  - reports/2026-05-05_pd062-selfscore-weight-sot/_zero_condense.json
---

ARKI_WRITE_DONE: reports/2026-05-05_pd064-edi-subagent-hook-fp/arki_rev1.md

# Arki — session_194 / topic_167 / Grade B

Arki입니다. PD-064 결함 3건 구조 진단.

---

# Arki 진단 — PD-064 (3건)

## 결함 #1: Edi subagent zero-condense gate FP

### 위치
- `C:\Projects\legend-team\.claude\hooks\pre-tool-use-task.js`
- 함수 `evaluateZeroCondenseGate` (L214–L252)
- 결정 라인: **L221–L222** — `const marker = readJsonFile(markerPath); if (marker && marker.sessionId === sess.sessionId)`

### 원인 구조
**마커 스키마 드리프트**가 root cause. 게이트는 marker JSON에서 `marker.sessionId` 키를 읽지만, Zero가 실제 작성하는 마커는 두 가지 다른 키 형태로 공존:

| 출처 | 실제 키 | 게이트가 기대하는 키 | 결과 |
|---|---|---|---|
| `reports/2026-05-05_self-score-table-format-unify/_zero_condense.json` (session_191) | `session`, `topic` | `sessionId` | undefined === sess.sessionId → **false → BLOCK** |
| `reports/2026-05-05_pd062-selfscore-weight-sot/_zero_condense.json` (session_193) | `sessionId`, `topicId` | `sessionId` | OK |

session_191 시점 Zero가 옛 키(`session`/`topic`)로 박제 → 게이트는 매번 마커가 "세션 불일치"로 보여 차단. session_193부터 키가 교정됐으나 단일 출처 강제 없음 → 동일 FP 재발 가능.

부수 원인: `try/catch` 빈 핸들러(L226)가 readJsonFile 파싱 에러까지 삼켜 silent BLOCK 발생 → 디버깅 곤란.

### 의존 관계
- **상류**: Zero (D.Condense 단계) — 마커 작성 주체. role-zero 페르소나 instruction에 마커 schema 명문화 부재 추정.
- **하류**: Edi subagent dispatch — 게이트 실패 시 본문 전체가 BLOCK 메시지로 교체되어 main inline fallback 강제.
- **교차 의존**: `sess.reportPath` (current_session.json 박제값) — `/open` 시 박제. drift 시 marker 경로 mismatch로 동일 FP.

### 설계 제약 (수정 시 invariant 보존 의무)
- **D-125 anchor governance** (Edi 단일 책임) — Edi는 마커를 신뢰만, 작성/검증 권한은 갖지 않음. 게이트가 마커 미신뢰 시 Edi 자력 통과 경로 부재 → BLOCK이 시스템 단일 차단점.
- **D-143 dispatch_config rules.edi** — `auto_hook: true` (mechanical fallback). 게이트가 Edi 자체를 차단해서는 안 됨, **Zero 결과의 유효성**만 차단해야 함.
- **Prime Directive D2** — 마커 description(존재만) 신뢰 금지. 실 페이로드 검증 필요.

### 수정 방향 + 리스크 + mitigation

**단일 최적해**: 마커 스키마를 SOT로 박제 + 게이트 로직 강건화.

1. `scripts/lib/zero-condense-marker.ts` 신규 — `writeMarker(sess)` / `readAndValidateMarker(reportDir, sess)` 두 함수 export. **스키마 단일 출처**.
   - 필수 키: `sessionId`, `topicId`, `completedAt`, `files[]`
   - 게이트는 이 헬퍼만 호출. raw key 직접 접근 금지.
2. Zero persona instruction에 `writeMarker()` 호출 의무 + raw JSON.stringify 금지 명문화 (`memory/roles/policies/role-zero.md`).
3. `evaluateZeroCondenseGate`의 silent catch 제거 — 파싱 실패 시 BLOCK 메시지에 `parseError: <msg>` 포함하여 진단 가능.
4. 레거시 마커 호환 어댑터(legacy → canonical 1회 마이그레이션 스크립트). 신규 BLOCK은 canonical만 인정.

**리스크**:
- (R1) 헬퍼 도입 후에도 Zero가 raw write로 우회 가능 — **mitigation**: Zero subagent prompt에 marker 작성 지시 시 헬퍼 경로만 노출. **fallback**: post-tool-use-task.js에서 condensed.md 생성 직후 마커 schema 자동 검사, 실패 시 sess.gaps 박제.
- (R2) 레거시 마커(session_191)가 영구 보존 시 향후 게이트가 같은 dir에 reopen 발생하면 동일 FP — **mitigation**: 마이그레이션 스크립트로 1회 normalize. **fallback**: 게이트가 legacy 키도 read해서 sessionId 비교 fallback (호환 1세대만).

---

## 결함 #2: inline-role-header-mismatch hook FP

### 위치
- `C:\Projects\legend-team\.claude\hooks\session-end-finalize.js`
- 함수 `validateInlineRoleHeaders` (L429–L514)
- 결정 라인: **L476–L486** — `if (turnId < turns.length) { const turnRole = turns[turnId] && turns[turnId].role; ... }`

### 원인 구조
**turnId 매핑 알고리즘이 array index를 turnIdx로 동일시**. 코드는 `turns[turnId]`로 직접 인덱싱하지만, `turnIdx`는 의미상 **고유 식별자**이며 array 위치와의 동일성은 우발적 보장.

검증된 사실 (session_193 session_index.json):
- arr_idx 0: turnIdx 0 / arki
- arr_idx 4: turnIdx 4 / edi (rev1)
- arr_idx 5: turnIdx 5 / edi (rev2)

session_193은 우연히 turnIdx == arr_idx. 그러나 **불변성이 아님**:
1. Turn Push Protocol C1 (D-048)이 phase 전환 시 분리/병합 — turnIdx skip 가능.
2. Master 개입 후 재발언 시 turnIdx 재할당 정책 미정 — 비연속 가능.
3. session_index 정렬이 timestamp 기반이면 turnIdx 정합 깨짐.

추가 결함: H1 헤더 검증(L490–L502)이 KNOWN 리스트에 `jobs`, `zero`, `sage` 누락 — 정상 H1을 unknown 처리(silent skip)하거나 (만약 다른 역할명과 매칭되면) 잘못된 mismatch 보고. role_registry는 이 3종 포함됨(최근 commit `3281386`).

### 의존 관계
- **상류**: Turn Push Protocol C1 hook (`current_session.json.turns[]` 박제). turnIdx 할당 룰 단일 출처 부재.
- **하류**: `sess.gaps[]` — close hook 검증 실패 카운터에 직접 영향. 5건 false gap 박제 시 Master 신뢰 저하.
- **교차**: `scripts/lib/turn-types.ts` — turn 스키마 타입 정의. `turnIdx`가 globally unique인지 array-positional인지 명세 부재 추정.

### 설계 제약
- **session_index.json은 append-session.ts로만 수정** (D-028) — 직접 turn 배열 재정렬 금지.
- **Arki 전체 시야 의무** (메모리 ID 119) — turn 박제·인덱싱·검증을 한 축이 아닌 전 chain에서 일관 처리.
- **D-048 Turn Push C1** — 분리/병합 4조건. turnIdx는 의미적 식별자로 불연속 가능.

### 수정 방향 + 리스크 + mitigation

**단일 최적해**: array index 직접 접근 폐기 + turnIdx → turn 객체 lookup 함수 도입.

1. `scripts/lib/turn-types.ts`에 `findTurnById(turns, turnIdx) → Turn | null` export. O(n) linear scan 또는 Map 캐시.
2. `validateInlineRoleHeaders` L476 교체:
   ```
   const matchedTurn = findTurnById(turns, turnId);
   if (matchedTurn && matchedTurn.role.toLowerCase() !== role) { /* mismatch */ }
   if (!matchedTurn) { /* turn 미존재 — 다른 gap type 'turn-not-found' */ }
   ```
3. KNOWN 리스트 보강 — `jobs`, `zero`, `sage`, `vera`, `designer` 추가. 또는 `memory/shared/role_registry.json`을 단일 출처로 read.
4. `turn-types.ts` 주석에 turnIdx 의미 명문화: "globally unique within session, not array position".

**리스크**:
- (R1) findTurnById가 O(n) — 세션당 turn 수가 수백을 넘으면 hook 실행 지연 — **mitigation**: 첫 호출 시 Map 캐시. **fallback**: 검증 시작점에서 sort 후 binary search.
- (R2) turnIdx duplicate 발생 시 first-match만 반환 → silent miss — **mitigation**: 헬퍼가 duplicate 감지 시 console.warn + gaps에 'turn-id-duplicate' 박제. **fallback**: append-session.ts에서 박제 시점 unique 검증.
- (R3) `jobs` 등이 KNOWN에 들어가면 기존에 silent skip되던 H1이 신규 mismatch로 감지될 수 있음 — **mitigation**: 1세션 dry-run 후 적용. **fallback**: severity 'info' 강등 첫 도입 시.

---

## 결함 #3: versionBump override 우선순위 미정의

### 위치
- `C:\Projects\legend-team\.claude\hooks\session-end-finalize.js`
- 함수 `detectVersionBump` (L1165–L1271): hook 자동 감지 → `sess.versionBumpSuggested`
- 함수 `applyVersionBump` (L1278–L1351): `sess.versionBump` 필요 + `confirmedBy === 'edi'` 강제 (L1286)
- 함수 `checkVersionBumpConfirmation` (L1363–L1430): 미확정 시 gap+alert 박제

### 원인 구조
**Edi가 inline override(0.01 capability)로 박제하려 하면 hook(0.1 structural)과 충돌하지만 우선순위 룰 부재**.

현재 흐름:
1. Hook이 git status로 `versionBumpSuggested = {value: 0.1, type: structural, confirmedBy: null}` 박제 (L1258).
2. Edi turn에서 만약 `versionBump = {value: 0.01, type: capacity, confirmedBy: 'edi', ...}` 박제 시도.
3. detectVersionBump L1167: `if (sess.versionBump && ...)`로 자동감지 skip. **Edi 우선** — 그러나 Edi가 hook 결과를 *읽지 않은* 상태에서 capacity override 시 structural 사실 손실.
4. applyVersionBump는 `confirmedBy === 'edi'`만 인정(L1286), `confirmedAt` 부재면 gap 박제(L1287).
5. **충돌 판정 로직 0건** — value 차이, type 불일치, hook suggested vs Edi confirmed 차이 비교 코드 없음.

session_191에서 confirmedBy:null 종결한 사유 추정: Edi가 inline 시도 중 도중 차단(zero-condense gate FP, 결함 #1) → confirmedAt 못 박제 → applyVersionBump가 reject → checkVersionBumpConfirmation이 'version-bump-edi-unconfirmed' gap 박제. 결함 #1과 cascade.

### 의존 관계
- **상류**: detectVersionBump (git status) → versionBumpSuggested.
- **하류**: project_charter.json (applyVersionBump이 history 추가).
- **교차**: D-130 (Nexus 자동 감지 + Edi 확정), D-131(Edi LLM 확정만 인정), D-138/D-140(Edi 미확정 시 hard enforcement), `agents/role-edi.md`, `memory/roles/policies/role-edi.md` (Edi 페르소나 — versionBump 확정 책임자).

### 설계 제약
- **D-125 anchor governance** — versionBump 확정은 Edi 단일 책임. hook은 *제안*만, 확정은 Edi LLM 검증.
- **D-130 책임 분배** — Nexus 자동 감지 + Edi 확정. "자동 감지가 사실, Edi가 의미 부여"의 단방향 흐름.
- **세션당 +0.1 cap** (CLAUDE.md) — 충돌 해소 시에도 max 0.1 보존 의무.
- **D-156 versionBump 형식 X.YYY 점 하나 float** — 어떤 override든 형식 깨면 안 됨.

### 수정 방향 + 리스크 + mitigation

**단일 최적해**: 충돌 해소 함수 + Edi 페르소나 instruction에 hook 결과 읽기 의무 명문화.

1. `session-end-finalize.js`에 `reconcileVersionBump(sess)` 신규:
   - input: suggested(hook) + bump(Edi)
   - 룰:
     a. **Edi value > suggested value** → Edi 인정 (capacity boost intent).
     b. **Edi value < suggested value** → **conflict gap** 박제 + Edi 사유 강제 검사 (`bump.overrideReason` 필수). 사유 없으면 reject, suggested 값으로 fallback.
     c. **Edi value == suggested value** → 그대로 confirm (단순 확정).
   - 결과를 `sess.versionBump.reconciled = true`, `sess.versionBump.suggestedAtConfirm = {...}` 박제하여 audit trail.
2. `agents/role-edi.md` (생성 필요 — 현재 personas/policies만 존재) 또는 `memory/roles/policies/role-edi.md`에 명문화:
   - "versionBump 확정 시 `sess.versionBumpSuggested` 먼저 read 의무. value 차이 시 `overrideReason` 필수."
3. `dispatch_config.json` rules.edi에 `version_bump_confirm: true` 외에 `version_bump_override_requires_reason: true` 추가 (D-143 정합).

**리스크**:
- (R1) 룰 (b)가 너무 엄격 → Edi가 정당한 다운그레이드(예: hook이 .js 변경 단순 노이즈 감지)를 못 함 — **mitigation**: overrideReason 50자 의무로 충분, reject 대신 warn-only 시작. **fallback**: Master alert 박제하여 사후 교정.
- (R2) reconcile 함수가 confirmedAt 박제 책임을 떠안으면 D-131 "Edi LLM 확정만 인정" 위반 — **mitigation**: reconcile은 *검증*만, confirmedAt은 Edi turn에서 박제. reconcile은 검증 실패 시 confirm 무효화만.
- (R3) session_191처럼 #1 cascade로 Edi 자체가 호출 안 된 경우 — **mitigation**: checkVersionBumpConfirmation이 결함 #1 마커(`zero-condense-blocked`) 동시 박제 시 severity 강등. **fallback**: PD 자동 등록하여 다음 세션 재처리.

---

## 종합 — 우선순위·의존 그래프

```
결함 #1 (zero-condense gate FP)
   │
   │ cascade: Edi 차단 → versionBump 확정 turn 미발생
   ↓
결함 #3 (versionBump 충돌, confirmedBy:null)

결함 #2 (inline-role-header-mismatch FP)
   │ 독립 — turnId 인덱싱 결함, #1/#3와 무관
   ↓
   gap 노이즈 5건 → Master 신뢰 저하
```

**수정 우선순위** (구조적 선후만, Schedule-on-Demand 준수 — 시간/공수 명시 X):

1. **Phase 1 (#1 — 마커 schema SOT)** — 가장 root. cascade 차단. 헬퍼 + Zero persona 명문화 + silent catch 제거.
2. **Phase 2 (#3 — versionBump reconcile)** — #1 해소 후 Edi turn이 정상 도달해야 검증 가능. reconcile 함수 + Edi instruction.
3. **Phase 3 (#2 — turnId lookup 헬퍼)** — 독립 결함. KNOWN 리스트 보강 + findTurnById 도입.

**검증 게이트**:
- G1: Phase 1 후 — 신규 세션에서 Edi BLOCK 0건 (마커 정상 시).
- G2: Phase 2 후 — versionBump.confirmedBy === 'edi' 박제율 100% (Grade A/B/S 세션).
- G3: Phase 3 후 — inline-role-header-mismatch gap 0건 (정상 frontmatter 세션).

**롤백 경로**: 각 Phase는 hook 단위 독립 → hook 파일 git revert만으로 단일 Phase 롤백 가능. SOT 헬퍼는 신규 파일이므로 import 제거만으로 무력화.

**중단 조건**: Phase 1 완료 후 G1 미달성 시 Phase 2 진입 금지 (cascade 해소 미확인 상태에서 reconcile 도입은 노이즈만 증가).

---

## SelfScores

[ROLE:arki]
# self-scores
aud_rcl: 0.5
str_fd: 3
spc_lck: N
sa_rnd: 1
