---
role: dev
turnId: 3
sessionId: session_248
invocationMode: subagent
accessed_assets:
  - file: scripts/lib/zero-condense-marker.js
    scope: SOT helper (readAndValidateMarker)
  - file: .claude/hooks/post-tool-use-task.js
    scope: 치환 대상 (L442·L510)
  - file: scripts/test-pd80-fix.js
    scope: G1 게이트 + R-4 mitigation
  - file: reports/2026-05-14_pd-085-marker-sot-consolidation/arki_rev1.md
    scope: design_spec (Option A)
  - file: reports/2026-05-14_pd-085-marker-sot-consolidation/riki_rev1.md
    scope: 적출 4건 mitigation 입력
---

# dev rev1 — PD-085 구현

DEV_WRITE_DONE: reports/2026-05-14_pd-085-marker-sot-consolidation/dev_rev1.md

## 1. 결론

**모든 게이트 PASS. 회귀 0건. 안전 강화 방향 1건 (의도 정합).** [T4/A2/O5]

| Gate | 결과 | 비고 |
|---|---|---|
| G1 (test-pd80-fix.js 4건) | **PASS 4/4** | 헬퍼 import 후에도 동일 결과 |
| G2 (legacy 키 fixture 4종) | **PASS** | A(legacy session+executedAt)·B(canonical+executedAt) valid=true / C(no sid)·D(mismatch) valid=false |
| G3-revised (completedAt+executedAt 모두 부재 마커) | **0건 / PASS** | 디스크 29건 전수 grep, completedAt 필수화 회귀 없음 |
| G4 (require 경로) | **PASS** | `pre-tool-use-task.js` L226과 동일 `../../scripts/lib/zero-condense-marker.js` |
| G5 (디스크 walk-through 동치 검증) | **PASS** | 29건 중 1건 행위 변화 — 안전 강화 방향 (R-1·R-3 정합) |

## 2. 변경 파일

| 파일 | 변경 | 라인 수 변화 |
|---|---|---|
| `.claude/hooks/post-tool-use-task.js` | top-level `readAndValidateMarker` require 추가 + L442 인라인 read → 헬퍼 호출 치환 + L510 인라인 read → 헬퍼 호출 치환 | -22 +20 (net -2) |
| `scripts/test-pd80-fix.js` | 인라인 fs.readFileSync 재구현 제거, 헬퍼 import 후 동일 4 케이스 재구성 (R-4 mitigation) | -10 +15 (재구성) |

생성 파일 없음. 헬퍼(`scripts/lib/zero-condense-marker.{ts,js}`) 변경 없음 — SOT 그대로 사용.

## 3. 게이트 실행 결과 (증거)

### G1 — test-pd80-fix.js (실행 명령 → 실제 출력)

명령: `node scripts/test-pd80-fix.js`

```
=== Test 1: missing-report 검사 (role=zero) ===
files: [ 'condensed.md', 'edi_rev1.md', '_zero_condense.json' ]
hasReport: true (expected: true)
PASS

=== Test 2: frontmatter-patch Zero D.Condense skip ===
isZeroCondenseOutput: true (expected: true)
PASS — frontmatter patch 우회 작동

=== Test 3: 비-Zero 역할은 기존 검사 유지 ===
arki rev files: false (expected: false — Arki는 Nexus 직접 작성)
PASS — 비-Zero 검사 변경 없음

=== Test 4: 다른 sessionId 마커는 통과 안 함 ===
hasReport (잘못된 sessionId): false (expected: false)
PASS — sessionId 검증 작동
```

본 테스트는 R-4 mitigation으로 **이제 hook 치환 코드와 동일한 헬퍼 분기를 직접 호출**한다 — 인라인 시뮬레이션 폐기. 행위 동치 보장. [T4/A1/O5]

### G2 — legacy 키 fixture (헬퍼 직접 호출)

| fixture | 키 상태 | 헬퍼 결과 | 평가 |
|---|---|---|---|
| A | `session`+`executedAt`+`files`(1건) | `valid:true`, canonical `{sessionId:'session_191', completedAt:'...', files:['x.md']}` | legacy 키 호환 OK |
| B | canonical `sessionId`+`executedAt`(legacy)+`files:[]` | `valid:true`, canonical `{sessionId, completedAt:executedAt, files:[]}` | mixed canonical/legacy OK |
| C | 양쪽 sessionId/session 모두 부재 | `valid:false`, `reason:'missing sessionId ...'` | 정상 차단 |
| D | A fixture를 `sessionId:'WRONG'` 기대로 read | `valid:false`, `reason:'sessionId mismatch: marker=session_191 expected=WRONG'` | mismatch 차단 OK |

### G3-revised — completedAt 필수화 회귀 (전수)

디스크 29건 전수 검사: `completedAt 부재 AND executedAt 부재`인 마커 = **0건**.

- `completedAt` 보유: 27건
- `executedAt`만 보유(legacy): 2건 (`2026-05-04_nexus-enhancement`, `2026-05-05_pd063-signature-metrics-sot-restore`) — 헬퍼가 legacy 키 호환으로 valid=true 처리

→ Riki R-2의 "현재 디스크 상 행위 변화 0건" 단언 **실측 확인**. completedAt 필수화는 **현 시점 회귀 없음** + **장래 박제 시 SOT writeMarker로 강제** (writeMarker 외 박제 경로는 R-3 grep으로 0건 확인).

### G4 — require 경로

```js
// pre-tool-use-task.js L226 (기존)
const { readAndValidateMarker } = require('../../scripts/lib/zero-condense-marker.js');

// post-tool-use-task.js (신규, 본 PR)
const { readAndValidateMarker } = require('../../scripts/lib/zero-condense-marker.js');
```

경로 동일. `.js` 컴파일본 mtime 정합 (헬퍼 미수정).

### G5 — 디스크 walk-through 동치 검증

스크립트: 29개 디렉토리 전수 — 각 마커에 대해 (a) 헬퍼 분기 vs (b) 인라인 분기를 동일 sessionId 기대로 시뮬레이션.

```
TOTAL dirs: 29  helper invalid: 0  behavior changes: 1
[
  {
    "dir": "2026-05-05_self-score-table-format-unify",
    "inline": false,
    "helper": true,
    "reason": "-",
    "hasInlineSid": false,
    "hasSession": true
  }
]
```

**행위 변화 1건 분석**:
- `2026-05-05_self-score-table-format-unify`: marker는 `session:'session_191'` (legacy 키만). 인라인은 `marker.sessionId === _sessionId` 매칭 실패로 차단. 헬퍼는 legacy `session` 키 호환으로 `sessionId='session_191'` 인식 + sessionId 매칭으로 valid=true.
- **현 세션(session_248)에서는 caller 호출 시 sessionId mismatch로 자연 차단** — 헬퍼 단독 동치 검증은 매칭 sid 가정이므로 결과가 다르지만, 실제 hook 동작상 무차이 (Riki R-3 단언 정합).
- 의미: 향후 session_191이 재활성화되어 동일 sid로 marker가 caller에 도달하는 시나리오에서 인라인=false였던 게 헬퍼=true가 됨. SOT writeMarker로 박제된 신규 마커는 canonical 키만 쓰므로 회귀 표면 0. **legacy 마커 1건의 잠재 false-positive 표면 제거 = 안전 강화 방향**.

## 4. R-1 ~ R-4 Mitigation 적용 상태

| 적출 | Mitigation | 상태 | 증거 |
|---|---|---|---|
| **R-1** (legacy 마커 분포 정확성: 1건이 아닌 3건 회귀 표면) | 디스크 전수 grep 결과 박제 + G5 표로 회귀 표면 명시 | **적용** | 본 보고서 §3 G5. `legacySessionOnly=1`, `legacyExecutedOnly=2`, `missingFiles=7` 전수 확정 |
| **R-2** (completedAt 필수화 scope creep) | Master 결정 = "동시 적용" → completedAt 필수화 채택. G3-revised로 회귀 0건 확인 | **적용 + 검증** | §3 G3-revised. 디스크 29건 중 0건 회귀 |
| **R-3** (writeMarker 외 박제 경로 존재 검증) | `grep "writeFileSync.*_zero_condense"` 0건 + `writeMarker` 외 직접 박제 경로 0건 확인 | **적용** | `Grep "writeFileSync.*_zero_condense"` 결과 No matches. SOT 단일화 유지 |
| **R-4** (test-pd80-fix.js 인라인 재구현 → 검증력 약함) | test-pd80-fix.js를 헬퍼 import로 재작성. 동일 4 케이스를 hook 치환 코드와 동일 분기로 검증 | **적용** | `scripts/test-pd80-fix.js` rewrite. G1 PASS는 이제 hook 치환의 직접 증거 |

## 5. 정정 사항 (Arki rev1 기준)

- Arki §3 "legacy 키 마커 호환 자동 획득 → self-score-table-format-unify 1건의 잠재 false-positive 표면 제거" — Riki R-3 지적대로 **현 세션 caller에서는 sessionId mismatch로 자연 차단되므로 즉시 효과 없음**. 정확한 표현: "legacy 박제 경로 차단(SOT writeMarker 단일화 유지) + 동일 sid 재활성 시나리오 한정 false-positive 제거". [T4/A1/O5]
- Arki §2 "completedAt 필수화 — 안전 방향" — policy 결정으로 격상되며, Master 동시 적용 결정으로 PD-085 resolveCondition에 명시적으로 포함되어야 함. **D-NNN 박제 후보** (Edi 판단). [T3/A2/O3]
- Arki §2 부수효과 1 "caller의 Array.isArray 가드 제거 가능" — 본 PR에서 caller는 `result.canonical.files`를 받으므로 `Array.isArray` 가드는 헬퍼 내부에서 흡수됨. caller는 `length>0` + `every(...)` + `includes(...)` 만 책임. [T4/A1/O5]

## 6. 자가 검증 한계 (D-185)

- 본 PR은 hook chain을 단일 PostToolUse(Task) 한정 변경. PostToolUse 외 다른 hook(e.g. session-end-finalize.js)에서 `_zero_condense.json`을 read하는 경로는 grep으로 확인하지 않음 — 본 PD scope creep 회피. 잔존 인라인 read 발견 시 별도 PD 분기 권고.
- G5 walk-through는 sessionId 매칭이 가정된 단일 축 검증. caller(`_sessionId`)가 marker sid와 다른 경우의 회귀는 Riki R-3 분석에 위임.
- "회귀 0건" 단언은 디스크 현 시점 29건에 대한 단언. 향후 신규 마커는 SOT writeMarker가 canonical 키 강제하므로 회귀 표면 신규 발생 가능성은 코드 레이어로 차단됨 — 그러나 외부 도구가 우회 박제하면 무방비. [T3/A2/O3]

## 7. Self-Score

```
[ROLE:dev]
# self-scores
rt_cov: 1.0
gt_pas: 1.0
hc_rt: 0
spc_drf: 0
```

- `rt_cov` 1.0 — 치환 2지점 모두 헬퍼 호출 + 게이트 G1·G2·G5로 실측 실행 검증
- `gt_pas` 1.0 — G1~G5 5게이트 first-try 전부 PASS
- `hc_rt` 0 — config 하드코딩 0, require 경로는 기존 pre-tool-use-task.js 패턴 재사용
- `spc_drf` 0 — Arki Option A spec 그대로 적용 + Riki 4건 mitigation 전부 적용. scope creep 없음 (R-2는 Master 명시 결정 후 적용)
