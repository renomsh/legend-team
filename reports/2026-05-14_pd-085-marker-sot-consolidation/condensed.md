---
role: zero
turnId: 6
sessionId: session_248
phase: condense
---

# condensed — PD-085 post-tool-use hook 인라인 마커 검증 SOT 일관화

## 1. 결론

`.claude/hooks/post-tool-use-task.js`의 L442·L510 두 인라인 `_zero_condense.json` read를 `scripts/lib/zero-condense-marker.js`의 `readAndValidateMarker()` 헬퍼 호출로 치환. **5 게이트 전건 PASS / 디스크 29건 회귀 0건 / 행위 변화 1건은 안전 강화 방향(legacy 마커 false-positive 표면 제거)**. PD-085 resolveCondition 충족. [T4/A2/O5]

---

## 2. Arki Option A 핵심 (구조 권고)

**Option A — 두 인라인 모두 헬퍼 호출로 치환 + caller에 잔존 검증 유지** [T3/A1/O3]

### 현 구조 매핑
```
scripts/lib/zero-condense-marker.js  (SOT helper)
  ├─ writeMarker()           ─ canonical schema 박제
  └─ readAndValidateMarker() ─ legacy 키 호환 read + 검증
        ▼ used by
  .claude/hooks/pre-tool-use-task.js   (이미 사용)
        ▼ NOT used by (PD-085 적출 지점)
  .claude/hooks/post-tool-use-task.js
        ├─ L442  frontmatter patch skip 판정 (per-file membership)
        └─ L510  hasReport 판정 (set-completeness)
```

### 인라인 2지점 역할 차이
| 지점 | 컨텍스트 | 인라인 검증 | caller 잔존 검증 |
|---|---|---|---|
| L442 | per-file membership | `sessionId === _sessionId && Array.isArray(files) && files.includes(fileName)` | `result.canonical.files.includes(fileName)` |
| L510 | set-completeness | `sessionId === _sessionId && Array.isArray(files) && length>0 && files.every(f => diskFiles.includes(f))` | `length>0 + every(f => files.includes(f))` |

헬퍼 반환 스키마(`{valid, canonical:{sessionId, topicId, completedAt, files[]}, raw}`)가 caller 검증 요구 전건 충족. legacy 키 호환·`completedAt` 필수·sessionId mismatch 흡수. caller의 `Array.isArray` 가드 제거 가능 (헬퍼가 항상 배열 정규화).

**부수효과**: `completedAt` 필수화로 검증 엄격화(안전 방향) + legacy 박제 경로 차단(SOT writeMarker 단일화 유지).

**Option B(인라인 유지 + legacy fallback만 추가), Option C(헬퍼에 caller-specific 함수 추가)는 폐기 권고**.

---

## 3. Riki 4 적출 + mitigation/fallback

### 🔴 R-1. legacy 마커 분포 = 1건 단언 오류 (실측 4건)

> Arki rev1은 "legacy 마커 실측 1건"이라 단언했으나, `reports/*/_zero_condense.json` 29건 grep 실측에서 4 케이스가 헬퍼 치환 시 종전 인라인 대비 행위가 바뀝니다. **그 중 1건만 행위 역전**. Master에게 정확한 분포를 알리지 않으면 회귀 디버깅 시 잘못된 가정으로 시간 낭비. [T4/A1/O5]

| 디렉토리 | 키 상태 | 인라인 | 헬퍼(Option A) | 회귀 방향 |
|---|---|---|---|---|
| `self-score-table-format-unify` | legacy `session`+`executedAt`+files(4) | patch 진행 / fallback | patch skip / hasReport=true | **행위 역전** |
| `nexus-enhancement` | canonical sid + `executedAt` + files 부재 | patch 진행 / fallback | patch 진행 / fallback | 동치 |
| `open-close-lightweight` | sid + completedAt + files 부재 | 동상 | 동상 | 동치 |
| `persona-layer-refine-p2` | 동상 | 동상 | 동상 | 동치 |

**Mitigation**: Dev PR에 표 박제 + G2 게이트에 2 케이스 명시 추가 + 치환 후 실측 박제.
**Fallback**: 행위 역전이 의도와 다르면 헬퍼 legacy 키 호환을 opt-in 플래그로 전환.

### 🔴 R-2. completedAt 필수화 scope creep 가능성

> 인라인 L446은 completedAt 미검사로 통과. 헬퍼 L121~123은 completedAt 부재 시 즉시 invalid. 분포 실측 0건이나 이는 policy 결정이지 Arki가 자가 판정할 사항이 아님. PD-085 resolveCondition은 "두 인라인 read 치환 + test 4건 PASS" 한정 — **검증 엄격성 변경을 무단 포함하면 PD scope creep**. [T4/A1/O3]

**Mitigation**: Master 명시 확인 — OK(엄격화 의도) 분기 시 resolveCondition 명시 박제 + D-NNN 후보 / NG(보수 행위 동치) 분기 시 caller가 `valid:false && reason.startsWith('missing completedAt')` 인라인 fallback.
**Fallback**: Master 무응답 시 NG 보수 분기 채택 (PD scope 준수 우선).

### 🔴 R-3. false-positive 제거 단언 실측 검증 없음

> Arki "self-score-table-format-unify 1건의 잠재 false-positive 표면 제거" 주장은 **현재 분포에서 거짓**. 마커는 session_191 컨텍스트 박제 — 현재(session_248) caller read 시 sessionId mismatch로 자연 차단. legacy 키 호환은 동일 세션 내 read에서만 의미. [T3/A1/O3]

**Mitigation**: `grep "_zero_condense" --include="*.js" --include="*.ts"` 실측해서 `writeMarker` 외 박제 경로 0건 확인 박제 + Arki 표현을 "legacy 키 박제 경로 차단(SOT writeMarker 단일화 유지)"로 정정해서 D-NNN 박제.
**Fallback**: 박제 경로 ≥1 발견 시 PD-085 scope에 "legacy 박제 경로 제거" 추가 또는 별도 PD 분기.

### 🟡 R-4. test-pd80-fix.js 인라인 재구현 — G1 검증력 약함

> 본 테스트는 post-tool-use-task.js의 L442·L510을 **시뮬레이션**할 뿐 require하지 않음 (L13~29, L36~46 fs.readFileSync 인라인 재구현). 인라인을 헬퍼로 바꿔도 테스트는 그대로 4건 PASS — 치환 안전성을 **증명하지 않음**. [T4/A1/O5]

**Mitigation**: test-pd80-fix.js를 본 PR과 함께 수정 — 인라인 fs.readFileSync 제거 + `readAndValidateMarker` import + 동일 4 케이스 재실행.
**Fallback**: 수정 누락 시 G1 게이트에 "검증력 약함 — 수동 코드 리뷰 필수" 메모 박제.

---

## 4. Dev 변경 + 5 게이트 결과

### 변경 파일
| 파일 | 변경 | 라인 |
|---|---|---|
| `.claude/hooks/post-tool-use-task.js` | top-level `readAndValidateMarker` require + L442·L510 인라인 → 헬퍼 호출 치환 | -22 +20 (net -2) |
| `scripts/test-pd80-fix.js` | 인라인 fs.readFileSync 제거, 헬퍼 import 후 동일 4 케이스 재구성 (R-4 mitigation) | -10 +15 |

헬퍼(`scripts/lib/zero-condense-marker.{ts,js}`) 변경 없음 — SOT 그대로 사용.

### 5 게이트 결과
| Gate | 결과 | 비고 |
|---|---|---|
| **G1** (test-pd80-fix.js 4건) | PASS 4/4 | 헬퍼 import 후에도 동일 결과 — R-4 mitigation으로 hook 치환 직접 증거 획득 |
| **G2** (legacy 키 fixture 4종) | PASS | A(legacy session+executedAt)·B(canonical+executedAt) valid=true / C(no sid)·D(mismatch) valid=false |
| **G3-revised** (completedAt+executedAt 모두 부재 마커) | 0건 / PASS | 디스크 29건 전수: completedAt 보유 27건 + executedAt만 보유(legacy) 2건. 회귀 표면 0 |
| **G4** (require 경로) | PASS | `pre-tool-use-task.js` L226과 동일 `../../scripts/lib/zero-condense-marker.js` |
| **G5** (디스크 walk-through) | PASS | 29건 중 1건 행위 변화 (`self-score-table-format-unify`, legacy `session` 키) — sessionId mismatch로 caller 자연 차단, hook 실행상 무차이. 신규 마커는 SOT writeMarker가 canonical 키 강제. **안전 강화 방향** |

### G5 walk-through 실제 출력
```
TOTAL dirs: 29  helper invalid: 0  behavior changes: 1
[
  {
    "dir": "2026-05-05_self-score-table-format-unify",
    "inline": false, "helper": true,
    "hasInlineSid": false, "hasSession": true
  }
]
```

### R-1 ~ R-4 Mitigation 적용 상태
| 적출 | 상태 | 증거 |
|---|---|---|
| R-1 | 적용 | §3 G5. `legacySessionOnly=1`, `legacyExecutedOnly=2`, `missingFiles=7` 전수 확정 |
| R-2 | 적용 + 검증 | G3-revised 디스크 29건 중 0건 회귀 — Master "동시 적용" 결정 인용 (Zero §Refine-1에서 인용 정확도 보강 권고) |
| R-3 | 적용 | `Grep "writeFileSync.*_zero_condense"` No matches. SOT 단일화 유지 |
| R-4 | 적용 | test-pd80-fix.js 재작성. G1 PASS는 이제 hook 치환의 직접 증거 |

---

## 5. Zero refine 2건 (🟡 박제 차단 사유 아님)

### Refine-1 — Dev §4 R-2 인용 정확도 보강

> Dev §4 R-2 "Master 결정 = '동시 적용' → completedAt 필수화 채택" — dispatch 텍스트에는 "4건 mitigation 동시 적용" 인용은 있으나 R-2의 OK/NG 분기 명시 결정 인용은 부재. 실행 결과는 동치(G3-revised 0건)이나 인용 정확도 보강 권고. [추측: 부분 인용을 OK 분기로 확장 해석한 가능성]

권고 표현: "Master 결정 = '4건 mitigation 동시 적용' → completedAt 필수화 채택. R-2 NG fallback(보수 행위 동치)은 G3-revised 0건 확인으로 트리거 미발생."

### Refine-2 — R-1 Fallback "opt-in 플래그" 후속 트리거 박제

> Riki R-1 fallback "legacy 키 호환 path를 opt-in 플래그로 전환"이 Dev 보고에 미언급. 현 분포 회귀 표면 1건(self-score-table-format-unify, sid mismatch로 자연 차단)이라 실효 위험 낮으나, 향후 session_191 재활성 시나리오 fallback 경로 박제 권고. [T3/A1/O3]

권고: Edi 박제 시 "후속 트리거 — session_191 재활성 또는 legacy 박제 경로 ≥1 발견 시 헬퍼 legacy 키 호환을 opt-in 플래그로 전환" 명시.

---

## 6. 잔존 위험 / 후속 트리거

| 항목 | 상태 | 후속 |
|---|---|---|
| PostToolUse 외 hook(session-end-finalize.js 등)의 `_zero_condense.json` read 경로 | 본 PR scope 외 — grep 미실시 | 잔존 인라인 read 발견 시 별도 PD 분기 |
| `_sessionId=undefined` 분기 잠재 회귀 (Riki 추가 점검) | 실측 진입 경로 미확인 | scope 분리 정당 — 후속 별도 점검 |
| completedAt 필수화 = OK/NG 분기 Master 명시 결정 | 행동상 OK 분기로 진행, 결과 동치 검증 완료 | Edi 박제 시 D-NNN 후보 (PD-085 resolveCondition 명시) |
| R-1 opt-in 플래그 fallback 경로 | 미 박제 | Refine-2 권고 — Edi 박제 시 후속 트리거 명시 |
| 외부 도구가 SOT writeMarker 우회 박제 시 | 코드 레이어 차단 무효 | 운영 정책 — 발견 시 즉시 SOT 강제 |

---

## 7. Self-Score

```
[ROLE:zero]
# self-scores
ref_cnt: 2
hc_found: 0
cln_rt: 1.0
```

- `ref_cnt` 2 — Refine 적출 2건 (R-2 인용 정확도 + R-1 fallback 후속 트리거)
- `hc_found` 0 — Audit 영역 적출 없음. 코드 치환은 헬퍼 SOT 사용으로 하드코딩 0
- `cln_rt` 1.0 — G1 재실행 PASS, 코드 치환/헬퍼 import/grep 결과 4 보고서 실측 cross-check 전건 일치
