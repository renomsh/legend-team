---
role: zero
turnId: 4
sessionId: session_248
invocationMode: subagent
---

# zero rev1 — PD-085 정제 검토 (부정→긍정 윤색 감사 포함)

ZERO_WRITE_DONE: reports/2026-05-14_pd-085-marker-sot-consolidation/zero_rev1.md

## 결론 (먼저)

**정제 적출 2건 / 부정→긍정 윤색 감사 통과 (윤색 적출 0건, 단 잔존 위험 묵음 1건 적출). G1 재실행 PASS, 코드 치환·헬퍼 import·grep 결과 모두 Dev 보고와 실측 일치.** [T4/A1/O5]

| 영역 | 적출 | 등급 |
|---|---|---|
| Audit (security-review) | 0건 | — |
| Cut (tech-debt) | 0건 | — |
| Refine (simplify) | 2건 | 🟡 |
| **Master 특별 지시 — 부정→긍정 윤색** | **0건 윤색 / 1건 잔존 위험 묵음** | 🟡 |

총 3건 (모두 🟡, 본문 정제 권고 — 박제 차단 사유 없음).

---

## Source Map

| 보고서 | 핵심 단언 | T·A·O |
|---|---|---|
| arki_rev1 | Option A 권고. completedAt 필수화 = "안전 방향" | T3/A1/O3 |
| riki_rev1 | 적출 4건 (🔴 R-1·R-2·R-3 / 🟡 R-4). R-2 mitigation = NG 분기 fallback 권고 | T4/A1/O5 |
| dev_rev1 | 모든 게이트 PASS / 회귀 0건 / 안전 강화 1건 | T4/A2/O5 |

---

## Step 1 — 부정→긍정 윤색 적출 (Master 특별 지시)

Riki 4 적출 각각에 대해 Dev rev1 mitigation 묘사를 1:1 대조했습니다.

### R-1 (Riki 🔴 — 회귀 분포 단언 오류)
- Riki 원문: "회귀 표면이 실측 4건이며 그 중 **1건만 행위 역전**" + "Master에게 정확한 분포를 알리지 않으면 회귀 디버깅 시 잘못된 가정으로 시간 낭비"
- Dev 묘사 (§4 표): "디스크 전수 grep 결과 박제 + G5 표로 회귀 표면 명시" / "**적용**"
- Dev §3 G5 본문: "TOTAL dirs: 29 helper invalid: 0 **behavior changes: 1**" + 1건 분석 박제
- **평가**: 윤색 없음. Dev는 "1건 행위 변화 = 안전 강화 방향"로 분류했으나 이는 R-1 본문(1건만 역전)과 정합. Riki R-1의 핵심 = "분포가 1건이 아니라 4건이며 그 중 1건만 역전"인데 Dev는 G5 표에 4건 walk-through 결과(behavior changes=1)를 박제하여 4 케이스 전수가 검증됐음을 명시. [근거: dev_rev1 L106 "TOTAL dirs: 29  helper invalid: 0  behavior changes: 1"] **윤색 없음**. [T4/A1/O5]

### R-2 (Riki 🔴 — completedAt 필수화 scope creep)
- Riki 원문: "scope creep" / "Master에게 명시 확인 필수" / "Master 무응답 시 **NG 보수 분기 채택**(PD scope 준수 우선)"
- Dev 묘사 (§4 R-2): "Master 결정 = **'동시 적용'** → completedAt 필수화 채택. G3-revised로 회귀 0건 확인" / "**적용 + 검증**"
- **평가**: ⚠️ Dev는 "Master 결정 = 동시 적용"을 단언하나, 본 dispatch 메시지에는 "4건 mitigation 동시 적용"이라는 Master 지시 인용은 있으나 R-2가 "OK 분기(엄격화 의도)"인지 "NG 분기(보수 행위 동치)"인지에 대한 Master 명시 결정 인용은 **부재**. Dev는 "동시 적용 = OK 분기 채택"으로 해석했고, 결과적으로 G3-revised 실측 0건 회귀가 확인됐으므로 **현 시점 실행 결과는 동치**. 그러나 [추측: Dev의 "Master 동시 적용 결정" 인용은 dispatch 텍스트의 부분 인용이며, R-2 OK/NG 분기 명시 결정으로 확장 해석한 가능성]. **윤색은 아니지만 인용 정확도 보강 권고**. [T3/A1/O3]

### R-3 (Riki 🔴 — false-positive 제거 단언 검증 부족)
- Riki 원문: "Arki의 'false-positive 표면 제거' 주장은 **현재 분포에서 거짓**"
- Dev 묘사 (§5): "Riki R-3 지적대로 **현 세션 caller에서는 sessionId mismatch로 자연 차단되므로 즉시 효과 없음**. 정확한 표현: '...동일 sid 재활성 시나리오 한정 false-positive 제거'"
- Dev §3 G5 본문: "**legacy 마커 1건의 잠재 false-positive 표면 제거 = 안전 강화 방향**"
- **평가**: §5에서는 Riki 단언을 정확히 인용하여 Arki 표현을 정정. §3 G5 본문에서는 "안전 강화 방향" 표현을 사용. 두 표현이 동일 보고서 내 공존하므로 부분 인용 의미 왜곡 아님 — §3은 시나리오 한정 효과를 인정한 후 안전 방향이라 분류, §5는 즉시 효과 없음을 명시. **윤색 없음, 정합**. [T4/A1/O5]

### R-4 (Riki 🟡 — G1 게이트 검증력 약함)
- Riki 원문: "G1 'test 4건 PASS' 게이트는 치환 안전성을 **증명하지 않음**"
- Dev 묘사 (§4 R-4): "test-pd80-fix.js를 헬퍼 import로 재작성. 동일 4 케이스를 hook 치환 코드와 동일 분기로 검증" / "**적용**"
- 실측 검증: `scripts/test-pd80-fix.js` L7 `require('./lib/zero-condense-marker.js')` 확인 + L18·L38·L57 모두 `readAndValidateMarker` 호출. 인라인 fs.readFileSync 재구현 제거됨. [T4/A1/O5]
- **평가**: 윤색 없음. R-4 mitigation 실제 적용 확인.

### Step 1 결론
**근거 없는 긍정 윤색 0건.** Dev rev1의 부정 단어(회귀·invalid·scope creep) 변환은 모두 실측 결과 동반. R-2의 "Master 결정 인용 정확도"만 🟡 보강 권고.

---

## Step 2 — 잔존 위험 묵음 검증

Riki가 명시한 fallback·잔존 risk가 Dev 보고에서 누락됐는지 검토.

| Riki 잔존 위험 | Dev 반영 여부 | 평가 |
|---|---|---|
| R-1 Fallback: "legacy 1건의 행위 역전이 의도와 다르면 헬퍼의 legacy 키 호환 path를 **opt-in 플래그**로 전환" | Dev §5에서 "동일 sid 재활성 시나리오 한정"으로 명시했으나 opt-in 플래그 fallback은 미언급 | 🟡 묵음 |
| R-2 Fallback: "Master 무응답 시 NG 보수 분기 채택 (PD scope 준수 우선)" | Dev §4에서 "Master 결정 = 동시 적용 → OK 분기 채택"로 처리. NG fallback 자체는 미언급 | 잔존 위험 명시 보강 권고 |
| R-3 Fallback: "박제 경로 ≥1 발견 시 PD-085 scope에 'legacy 박제 경로 제거' 추가 또는 별도 PD 분기" | Dev §4에서 grep "writeFileSync.*_zero_condense No matches" 박제하여 0건 확인. 별도 PD 분기 트리거 0 — Fallback 자체는 불필요 (조건 미충족) | 정합 |
| R-4 Fallback: "수정 누락 시 G1 게이트를 '검증력 약함' 메모 박제" | Dev §3 G1에서 헬퍼 import 재작성 완료. Fallback 트리거 0 | 정합 |
| Riki 추가 점검 — `_sessionId=undefined` 분기 잠재 회귀 ("**잠재 회귀**이나 실측 진입 경로 미확인") | Dev §6 자가 검증 한계 항목에 "PostToolUse 외 다른 hook(e.g. session-end-finalize.js) read 경로 grep 미확인 — 본 PD scope creep 회피. 잔존 인라인 read 발견 시 별도 PD 분기 권고" 박제 | 우회 명시 보강 권고 — 단, scope 분리 정당 |

### Step 2 결론
**잔존 위험 묵음 1건 적출 (🟡)**: R-1 Fallback의 "opt-in 플래그 전환" 옵션이 Dev 보고에 미언급. 현 분포 회귀 표면이 1건(self-score-table-format-unify, sid mismatch로 자연 차단)이라 실효 위험은 낮으나, 향후 session_191 재활성 시나리오를 위한 fallback 경로 박제 권고. [T3/A1/O3]

---

## Step 3 — 실측 cross-check

### 3-1. post-tool-use-task.js 치환 확인

| 지점 | 확인 결과 |
|---|---|
| L36 (top-level require) | `const { readAndValidateMarker } = require('../../scripts/lib/zero-condense-marker.js');` 추가 확인 [T4/A1/O5] |
| L443~453 (L442 치환) | 인라인 fs.readFileSync 제거 + 헬퍼 호출 + `result.canonical.files.includes(fileName)` 잔존 검증 유지 — Arki Option A 스펙 정합 |
| L508~515 (L510 치환) | 인라인 제거 + 헬퍼 호출 + `length>0 + every(...)` 잔존 검증 유지 — set-completeness 보존 |

### 3-2. test-pd80-fix.js 재작성 확인

- L7: `require('./lib/zero-condense-marker.js')` 헬퍼 import 추가 [T4/A1/O5]
- L18·L38·L57: 3개 테스트 분기 모두 `readAndValidateMarker(...)` 호출 — 인라인 fs.readFileSync 재구현 제거됨
- Test 3은 비-Zero 분기 그대로 (의도 정합)
- 실행 결과: **4건 PASS 재현** (본 정제 검토 시점에 재실행 확인)

### 3-3. grep 재실행

- `writeFileSync.*_zero_condense` → No matches (Dev R-3 결과 재현). writeMarker 외 박제 경로 0건 확정.
- `_zero_condense` 참조 5 파일: 본 PR 치환 대상 2 파일 + SOT 헬퍼 3 파일 (`.ts`/`.js`/`.d.ts`). 추가 인라인 read 경로 0건.

### 3-4. require 경로 정합

`pre-tool-use-task.js`와 `post-tool-use-task.js`의 require 경로 모두 `'../../scripts/lib/zero-condense-marker.js'` 동일 패턴. [T4/A1/O5]

### Step 3 결론
Dev 보고의 모든 실측 단언(G1 PASS, 헬퍼 import, grep 0건, require 경로) **전건 재현 성공**. fabrication·근거 부재 단언 0건.

---

## Step 4 — 정제 산출

### Refine 적출 2건 (🟡 시정 권고, 박제 차단 사유 아님)

#### Refine-1 — Dev rev1 §4 R-2 mitigation 묘사 보강 (잔존 위험 명시)

Before (Dev §4 R-2):
```
| **R-2** (completedAt 필수화 scope creep) | Master 결정 = "동시 적용" → completedAt 필수화 채택. G3-revised로 회귀 0건 확인 | **적용 + 검증** | §3 G3-revised. 디스크 29건 중 0건 회귀 |
```

After (Edi 박제 시 권고):
```
| **R-2** (completedAt 필수화 scope creep) | Master 결정 = "4건 mitigation 동시 적용" → Riki R-2 OK 분기(엄격화 의도) 채택. G3-revised로 현 디스크 회귀 0건 확인. 잔존 위험: 향후 caller가 completedAt 누락 박제 시 헬퍼 차단 (SOT writeMarker로 강제). NG 분기 fallback(행위 동치 보존)은 미채택. | **적용 + 검증 + 잔존위험 명시** |
```

근거: Step 1 R-2 인용 정확도 + Step 2 R-2 fallback 미언급 통합 보강. [T3/A1/O3]

#### Refine-2 — Edi 박제 시 R-1 opt-in 플래그 fallback 명시

Riki R-1 Fallback("opt-in 플래그 전환")은 현 분포에서 트리거 0이지만 향후 session_191 또는 동등 시나리오 재활성 시 즉시 대응 경로로 박제 필요. Edi가 session 결정 박제 시 다음 한 줄 포함 권고:

```
PD-085 후속: legacy 키 호환 path를 opt-in으로 전환할 필요 발생 시 헬퍼 시그니처 확장(readAndValidateMarker(dir, sess, { allowLegacy: boolean })). 트리거: legacy 키 마커가 동일 sid에서 false-positive 유발 사고 1건 이상.
```

근거: Step 2 잔존 위험 묵음 1건. [T3/A1/O3]

### Cut 적출 0건
Dev rev1 본문은 모두 검증 결과 또는 스펙 인용으로 채워져 있음. 삭제 권고 대상 없음.

### Audit 적출 0건
- `.claude/hooks/post-tool-use-task.js` — 하드코딩 secrets·credentials·절대 경로 0건. require 경로 `'../../scripts/lib/zero-condense-marker.js'`는 상대 경로 표준
- `scripts/test-pd80-fix.js` — `path.join(process.cwd(), 'reports', ...)` + sessionId 리터럴(`session_234`, `session_999`)은 테스트 fixture 의도, 보안 위반 아님

---

## Confidence Matrix

| 발견 | 등급 | 근거 |
|---|---|---|
| 부정→긍정 윤색 0건 | **High** | Riki·Dev 1:1 인용 대조 + 실측 cross-check 전건 재현 |
| R-1 opt-in fallback 묵음 | **Medium** | Dev 보고 검색 결과 명시 부재 — 박제 차단 사유는 아님 |
| R-2 Master 결정 인용 정확도 보강 | **Medium** | dispatch 텍스트의 "4건 동시 적용" 인용은 정확하나 OK/NG 분기 명시 결정으로 확장 해석한 가능성 |
| 코드 치환 정확성 | **High** | L36·L443~453·L508~515 직접 read 확인 + G1 4건 PASS 재현 |
| Refine 2건 권고 | **Medium** | Edi 박제 시 보강 권고이며 박제 차단 트리거 아님 |

---

## Open Questions

1. Master 결정 "4건 mitigation 동시 적용"이 R-2 OK 분기(엄격화 의도)인지, 단순히 "각 적출 대응을 분리하지 말고 한 PR에 묶어라"인지 — 후자라면 NG 보수 분기 채택도 valid했음. Dev는 전자로 해석. Edi 박제 전 Master 1회 확인 권고 (만약 Master가 dispatch 외 채널에서 명시했다면 본 Open Question 자동 해소).
2. PostToolUse 외 hook(`session-end-finalize.js` 등)에서 `_zero_condense.json` read 경로가 정말 0건인지 Step 3 grep으로는 "writeFileSync 박제 경로 0건"만 확정. **read 경로 grep**은 본 정제 검토 scope 외(Dev §6 자가 한계 항목과 정합). 별도 PD 분기 가능성 잔존.

---

## Self-exclusion 확인

- 본 검토는 산출물 보고서(arki·riki·dev) + 코드(post-tool-use-task.js·test-pd80-fix.js)만 대상.
- 메타-자산(violation flag·audit trail·self-scores log) 정제 회피 — D-146 SOT 정합.
- decision_ledger·NCL 등 메타 분석 산출물 미접근.

---

## Self-Score

```
[ROLE:zero]
# self-scores
ref_cnt: 2
hc_found: 0
cln_rt: 1.0
```

- `ref_cnt: 2` — Refine 2건 (R-2 인용 보강 + R-1 opt-in fallback 박제 권고)
- `hc_found: 0` — Audit 적출 0건 (post-tool-use-task.js·test-pd80-fix.js 하드코딩 secrets·credentials·절대 경로 부재)
- `cln_rt: 1.0` — 정제 후 G1 test 재실행 4건 PASS 확인, 오류 0건
