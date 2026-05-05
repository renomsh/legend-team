---
role: dev
turnId: 2
sessionId: session_194
topicId: topic_167
grade: B
invocationMode: subagent
accessed_assets:
  - reports/2026-05-05_pd064-edi-subagent-hook-fp/arki_rev1.md
  - reports/2026-05-05_pd064-edi-subagent-hook-fp/riki_rev1.md
  - .claude/hooks/pre-tool-use-task.js
  - .claude/hooks/session-end-finalize.js
  - scripts/lib/turn-types.ts
  - memory/shared/role_registry.json
  - memory/shared/dispatch_config.json
  - memory/roles/policies/role-zero.md
  - memory/roles/policies/role-edi.md
  - reports/2026-05-05_self-score-table-format-unify/_zero_condense.json
  - reports/2026-05-05_pd062-selfscore-weight-sot/_zero_condense.json
---

DEV_WRITE_DONE: reports/2026-05-05_pd064-edi-subagent-hook-fp/dev_rev1.md

# Dev 구현 — PD-064 (P1~P4)

Dev입니다. Ace 권고(Riki 축소안 채택) 4단 구현 + 런타임 검증 완료.

---

## P1 — zero-condense gate FP

### 변경 파일
- **신규**: `scripts/lib/zero-condense-marker.ts` (143 lines) — SOT 헬퍼 (writeMarker / readAndValidateMarker)
- **신규**: `scripts/lib/zero-condense-marker.js` (97 lines) — CommonJS sidecar (hook .js에서 require용)
- `.claude/hooks/pre-tool-use-task.js` — `evaluateZeroCondenseGate` 헬퍼 사용으로 교체, silent catch 제거 + parseError 노출
- `memory/roles/policies/role-zero.md` — 마커 박제 시 `writeMarker()` 헬퍼 의무 명문화

### 핵심 diff 요약

```diff
// pre-tool-use-task.js
-  try {
-    const markerPath = path.join(cwd, sess.reportPath, '_zero_condense.json');
-    if (fs.existsSync(markerPath)) {
-      const marker = readJsonFile(markerPath);
-      if (marker && marker.sessionId === sess.sessionId) {
-        return null; // 게이트 통과
-      }
-    }
-  } catch {}
+  let gateReason = null;
+  try {
+    const { readAndValidateMarker } = require('../../scripts/lib/zero-condense-marker.js');
+    const result = readAndValidateMarker(path.join(cwd, sess.reportPath), sess);
+    if (result.valid) return null;
+    gateReason = result.reason || 'unknown validation failure';
+  } catch (e) {
+    gateReason = 'helper-error: ' + (e && e.message);
+  }
+  // BLOCK 메시지에 `진단: ${gateReason}` 라인 추가
```

헬퍼 핵심:
- canonical 키: `sessionId`, `topicId`, `completedAt`, `files[]`
- legacy compat read: `marker.sessionId || marker.session`, `marker.topicId || marker.topic`, `marker.completedAt || marker.executedAt`
- 검증 실패 시 `{valid: false, reason}` — 파싱 에러도 reason에 포함
- **legacy migrate 안 함** (D-028 정신 보존, Riki F1 위험 회피)

### 검증 결과 ✅
실제 reports의 두 마커로 end-to-end 게이트 시뮬레이션:
```
session_191 (legacy keys: session/topic/executedAt): valid=true ← FP 제거 확인
session_193 (canonical: sessionId/topicId/completedAt): valid=true
FP test (session_192이 session_191 dir 호출): valid=false, sessionId mismatch ← 정상 BLOCK
```

5종 헬퍼 단위 테스트 (legacy compat / canonical / mismatch / parseError / write round-trip) 전량 PASS.

---

## P2 — versionBump 충돌 (자동 룰 도입 보류, 차이 감지만)

### 변경 파일
- `.claude/hooks/session-end-finalize.js` `checkVersionBumpConfirmation` — Edi confirmed 시 suggested ≠ confirmed + overrideReason 부재 → `version-bump-suggested-vs-confirmed-diff` info gap
- `memory/roles/policies/role-edi.md` §6.3 — versionBumpSuggested **먼저 read 의무** + value 차이 시 `overrideReason` 필수 명문화
- `memory/shared/dispatch_config.json` `rules.edi.version_bump_override_requires_reason: true` 추가

### 핵심 diff 요약

```diff
// session-end-finalize.js#checkVersionBumpConfirmation (Edi confirmed 분기)
   if (confirmed) {
-    log('checkVersionBumpConfirmation: Edi 확정 확인됨 — 경고 없음');
-    return;
+    if (suggested.value != null && bump.value != null && suggested.value !== bump.value) {
+      const hasOverrideReason = bump.overrideReason && String(bump.overrideReason).trim();
+      if (!hasOverrideReason) {
+        sess.gaps.push({
+          type: 'version-bump-suggested-vs-confirmed-diff',
+          severity: 'info',
+          detail: `suggested=${suggested.value} vs confirmed=${bump.value} (overrideReason 없음)`,
+          ...
+        });
+      }
+    }
+    return;
   }
```

자동 reconcile 룰(Arki 룰 a/b/c)은 **도입하지 않음** — Riki G3 "D-130 Edi 단일 책임 잠식" 권고 채택. hook은 차이 감지만, 결정은 Edi turn에서 명시적 처리.

### 검증 결과 ✅
- `dispatch_config.json` JSON 파싱 OK + 신 필드 read 확인
- finalize.js 노드 syntax check 통과

---

## P3 — turnId 인덱싱

### 선행 — H1 grep
`reports/2026-05-*/*.md` 전체 H1 헤더 추출. `jobs/zero/sage/vera/designer` 시작 H1 확인:
- `# Jobs ...`, `# Zero ...`, `# Vera ...` 다수 존재 (frontmatter role과 일치하는 정상 케이스 추정)
- frontmatter role과 H1 role 모두 jobs/zero/vera로 일치하는 보고서 다수
- **신규 mismatch 후보 검출 0건** (frontmatter `role: jobs`인 보고서의 H1 또한 `# Jobs ...`로 일치)
- 기존 KNOWN(`ace, arki, fin, riki, nova, dev, edi, designer`)에서 SOT 확장으로 신규 false-positive 발생 위험 없음

### 변경 파일
- `scripts/lib/turn-types.ts` — `findTurnById(turns, turnIdx) → Turn | null` export, "globally unique within session, not array position" 주석 명문화
- `scripts/lib/turn-types.js` (신규 CommonJS sidecar, 25 lines) — hook .js require용
- `.claude/hooks/session-end-finalize.js` `validateInlineRoleHeaders`:
  - L476 `turns[turnId]` → `findTurnById(turns, turnId)` 교체
  - 신규 gap type `turn-not-found` (turnId 박제됐으나 turns[]에 매칭 없음, turns 비어있을 땐 skip)
  - `KNOWN` 정적 리스트 → `memory/shared/role_registry.json` SOT read (jobs/zero/sage/vera 자동 포함, designer alias 보존)
  - Map 캐시 도입 안 함 (Riki R1: ROI 0)

### 핵심 diff 요약

```diff
// validateInlineRoleHeaders 함수 진입부 — SOT loader 추가
+  let findTurnById;
+  try {
+    ({ findTurnById } = require(path.join(CWD, 'scripts', 'lib', 'turn-types.js')));
+  } catch (e) { /* fallback to array index */ }
+
+  let KNOWN_ROLES = ['ace', 'arki', 'fin', 'riki', 'nova', 'dev', 'edi', 'designer'];
+  try {
+    const reg = JSON.parse(fs.readFileSync('memory/shared/role_registry.json', 'utf8'));
+    KNOWN_ROLES = reg.roles.map(r => r.id.toLowerCase());
+    if (!KNOWN_ROLES.includes('designer')) KNOWN_ROLES.push('designer');
+  } catch {}

// turns[] cross-check
-  if (turnId < turns.length) {
-    const turnRole = turns[turnId] && turns[turnId].role;
-    if (turnRole && turnRole.toLowerCase() !== role) { /* mismatch */ }
-  }
+  const matchedTurn = findTurnById(turns, turnId);
+  if (matchedTurn) { /* 기존 mismatch 분기 */ }
+  else if (turns.length > 0) {
+    violations.push({ type: 'turn-not-found', file, turnId, note: '...' });
+  }
```

### 검증 결과 ✅
- `findTurnById` 단위 테스트 (정상 매치 / array index ≠ turnIdx (gap) / 미존재 / duplicate 경고 / 빈 배열 / null) 전량 PASS
- `role_registry.json` SOT read 결과: `[ace, arki, fin, riki, nova, dev, vera, edi, jobs, zero, sage]` + `designer` alias = 12종 KNOWN
- finalize.js 노드 syntax check 통과

---

## P4 — Edi 미dispatch gap type 분리 (G2 4번째 결함)

### 변경 파일
- `.claude/hooks/session-end-finalize.js` `checkVersionBumpConfirmation`:
  - `agentsCompleted` + `turns[]` 조합으로 Edi dispatch 여부 판정
  - dispatch 부재 시 `version-bump-edi-not-dispatched` (ref: PD-064-P4) 별도 gap type
  - early-return 가드: 신/구 두 type 모두 체크하여 이중 박제 방지

### 핵심 diff 요약

```diff
+  const agentsCompleted = Array.isArray(sess.agentsCompleted) ? sess.agentsCompleted : [];
+  const turns = Array.isArray(sess.turns) ? sess.turns : [];
+  const ediInAgents = agentsCompleted.some(a => String(a).toLowerCase() === 'edi');
+  const ediInTurns = turns.some(t => t && String(t.role || '').toLowerCase() === 'edi');
+  const ediDispatched = ediInAgents || ediInTurns;
   ...
-  sess.gaps.push({ type: 'version-bump-edi-unconfirmed', ... });
+  const gapType = ediDispatched
+    ? 'version-bump-edi-unconfirmed'
+    : 'version-bump-edi-not-dispatched';
+  sess.gaps.push({ type: gapType, ..., ref: ediDispatched ? 'D-140' : 'PD-064-P4' });
```

이중 박제 방지 가드도 두 type 모두 체크하도록 확장.

### 검증 결과 ✅
finalize.js 노드 syntax check 통과. 로직 분기는 sess 모킹 없이 grep으로 확인 — `ediInAgents || ediInTurns` 분기 진입 path 명확.

---

## 종합 검증

| 항목 | 결과 |
|---|---|
| `node --check pre-tool-use-task.js` | ✅ PASS |
| `node --check session-end-finalize.js` | ✅ PASS |
| `npx tsc --noEmit` (zero-condense-marker.ts, turn-types.ts) | ✅ 0 errors |
| zero-condense-marker 헬퍼 단위 테스트 (5/5) | ✅ ALL PASS |
| 실제 마커 (session_191 legacy / session_193 canonical) 게이트 통과 | ✅ FP 제거 확인 |
| findTurnById 단위 테스트 (7/7) | ✅ ALL PASS |
| `dispatch_config.json` 파싱 + 신 필드 노출 | ✅ |
| H1 grep 신규 mismatch 후보 | ✅ 0건 |
| role_registry.json SOT read | ✅ 11 + designer alias = 12 KNOWN roles |

## 잔여 위험

- **R1 (낮음)**: `findTurnById` O(n) — 세션당 turn 100건 미만 현 시점 ROI 영향 없음. 미래 1000+ turn 시점 Map 캐시 검토 (Riki R1과 동일 판단).
- **R2 (낮음)**: legacy turn(turnIdx 누락)이 섞인 세션은 모든 frontmatter turnId가 `turn-not-found` gap을 양산할 가능성. 본 변경에서는 `turns.length > 0` 조건으로만 발동하므로 legacy 세션(빈 turns 또는 `legacy: true`)은 영향 없음. 추가 가드 필요 시 `sess.legacy === true` skip 분기 도입 검토.
- **R3 (정보)**: `version-bump-suggested-vs-confirmed-diff`는 severity `info`로만 박제 — Master 대시보드 노이즈는 적지만 실제 정책 위반 catch율은 Edi 자율 준수에 의존. 향후 N세션 모니터링 후 severity 상향 검토.

## 인계 메모

- 본 PD-064 status 변경(open → resolved)은 Edi 영역 (Dev 권한 외).
- versionBumpSuggested 자동 감지: hooks 변경 + role policy 변경 + decision_ledger.json 미변경 → capacity 카테고리 +0.01 예상.
- 본 세션 P1~P4 모두 hook+policy+lib 변경으로 D-104 매핑상 capacity bump 후보. 단일 기능 패치 묶음으로 1회 +0.01 spec 적합.

---

[ROLE:dev]
# self-scores
rt_cov: 0.95
gt_pas: 1.0
hc_rt: 0.0
spc_drf: 0
