---
role: arki
turnId: 0
sessionId: session_248
invocationMode: subagent
---

# arki rev1 — PD-085 구조 분석

## 결론 (먼저)

치환은 **안전하게 가능**하며, 권고는 **Option A — 두 인라인 모두 `readAndValidateMarker` 호출로 치환 + caller에 `files.includes(fileName)` / `files.length>0 + files.every(...)` 잔존 검증 유지** 입니다. [T3/A1/O3]

근거: 헬퍼 반환 `canonical.files`가 두 caller가 요구하는 검증의 **필요 입력**을 모두 제공하고, sessionId mismatch 판정은 헬퍼가 **흡수 (valid=false)** 하므로 caller는 `valid` 분기와 `canonical.files` 사용만 책임지면 됩니다. legacy 키 호환 path가 SOT 한 곳으로 모이며 false-positive 회귀 표면이 단일화됩니다. [T4/A1/O5]

---

## 1. 현 구조 매핑

```
scripts/lib/zero-condense-marker.js  (SOT helper)
  ├─ writeMarker(reportDir, sess, opts)              ─ canonical schema 박제
  └─ readAndValidateMarker(reportDir, sess)          ─ legacy 키 호환 read + 검증
        │
        ▼ used by
  .claude/hooks/pre-tool-use-task.js                 ─ (SOT consumer, 이미 헬퍼 사용)
        │
        ▼ NOT used by (= PD-085 적출 지점)
  .claude/hooks/post-tool-use-task.js
        ├─ L442  frontmatter patch skip 판정 (per-file)
        └─ L510  hasReport 판정 (zero D.Condense gate)
```

### 인라인 read 2곳의 역할 차이 [T4/A1/O5]

| 지점 | 위치 | 컨텍스트 | 검증 조건 | 산출 분기 |
|---|---|---|---|---|
| **L442** | frontmatter patch 직전 | 단일 보고서 파일(`absReportPath`)에 대해 turnId 박제 여부 판정 | `marker.sessionId === _sessionId` **AND** `Array.isArray(marker.files)` **AND** `marker.files.includes(fileName)` | true → `isZeroCondenseOutput=true` → patch skip / false → patch 시도 후 실패 시 `frontmatter-patch-failed` gap |
| **L510** | hasReport 검증 (zero 분기) | reports 디렉토리 단위 보고서 산출 검증 (gate) | `marker.sessionId === _sessionId` **AND** `Array.isArray(marker.files)` **AND** `marker.files.length > 0` **AND** `marker.files.every(f => files.includes(f))` | true → `hasReport=true` (gate 통과) / false → fallback (`zero_rev*.md` · `condensed.md` · `zero_condensed.md`) |

핵심 차이:
- **L442는 "이 파일이 마커 목록에 있나"** (per-file membership).
- **L510은 "마커가 선언한 파일들이 디스크에 모두 있나"** (set-completeness).
- 둘 다 `sessionId` 매칭 + `files` 검증을 공통으로 요구. `topicId` · `completedAt`은 미사용. `legacy 키(session/executedAt) fallback` 미적용 → **legacy 마커 1건 (`reports/2026-05-05_self-score-table-format-unify/_zero_condense.json`)** 시나리오에서 잠재 false-positive 표면.

---

## 2. 헬퍼 반환 스키마 vs caller 요구 [T4/A1/O5]

헬퍼 반환:
```
{ valid: true,  canonical: { sessionId, topicId, completedAt, files: string[] }, raw }
{ valid: false, reason: string, raw? }
```

헬퍼 내부에서 이미 수행:
- 파일 존재 / parseError / empty-or-not-object 가드
- `sessionId = m.sessionId ?? m.session` (legacy 호환)
- `completedAt = m.completedAt ?? m.executedAt` 필수
- `sess.sessionId && sessionId !== sess.sessionId` → mismatch valid=false
- `files = Array.isArray(m.files) ? m.files : []`

| caller | 필요 검증 | 헬퍼가 충족 | caller에 잔존 |
|---|---|---|---|
| L442 | sessionId 매칭 / files 배열 / `files.includes(fileName)` | sessionId·files 배열화 충족 | **`canonical.files.includes(fileName)` 인라인 보존** (per-file membership은 caller 책임 — Riki 적출과 정합) |
| L510 | sessionId 매칭 / `files.length > 0` / `files.every(f => diskFiles.includes(f))` | sessionId·files 배열화 충족 | **`length>0` + `every(...)` 인라인 보존** (set-completeness는 caller 책임) |

**미충족 없음.** 두 caller가 요구하는 조건은 헬퍼의 `valid + canonical.files`만 있으면 모두 표현 가능합니다.

> 부수효과 1: 헬퍼는 `files`를 항상 배열로 정규화 (`[]` fallback). 따라서 caller의 `Array.isArray(marker.files)` 가드는 **제거 가능** (단, `length>0` 가드는 의미적으로 필요 유지).
>
> 부수효과 2: 헬퍼는 `completedAt` 부재 시 invalid 처리. 현재 L442·L510 인라인은 `completedAt`을 검사하지 않음 — 치환 시 **검증이 더 엄격해짐** (회귀 위험 낮음, 안전 방향).

---

## 3. 치환 설계

### Option A (권고): 헬퍼 호출 + caller 잔존 검증 [T3/A1/O3]

**L442 치환:**
```js
const { readAndValidateMarker } = require('../../scripts/lib/zero-condense-marker.js');
// ...
let isZeroCondenseOutput = false;
const markerDir = path.dirname(absReportPath);
const result = readAndValidateMarker(markerDir, { sessionId: _sessionId });
if (result.valid) {
  const fileName = path.basename(absReportPath);
  if (result.canonical.files.includes(fileName)) {
    isZeroCondenseOutput = true;
  }
}
// try/catch 제거 가능 — 헬퍼 내부에 fs/parse 가드 포함
```

**L510 치환:**
```js
const result = readAndValidateMarker(reportsDir, { sessionId: _sessionId });
if (result.valid &&
    result.canonical.files.length > 0 &&
    result.canonical.files.every(f => files.includes(f))) {
  hasReport = true;
}
```

**잔존 인라인 검증:**
- L442: `canonical.files.includes(fileName)` — Riki 적출 정합.
- L510: `canonical.files.length > 0` + `canonical.files.every(f => files.includes(f))` — set-completeness.

**의존 변화:**
- post-tool-use-task.js → scripts/lib/zero-condense-marker.js **신규 require** 추가.
- pre-tool-use-task.js와 require 경로 동일 (`../../scripts/lib/zero-condense-marker.js` — 확인 필요. pre-tool-use 측 require 경로 grep 후 정렬).

**부작용:**
- legacy 키(`session`/`executedAt`) 마커 호환 자동 획득 → `2026-05-05_self-score-table-format-unify/_zero_condense.json` 실측 1건의 잠재 false-positive 표면 제거. [T3/A1/O5]
- `completedAt` 필수화로 invalid 분기 확장 (안전 방향).
- try/catch 명시 제거 가능 (헬퍼가 fs.existsSync + JSON.parse error 모두 처리).

### Option B (대안): post-tool-use 인라인 유지 + legacy fallback만 인라인 추가
- 장: 의존 추가 없음.
- 단: SOT 일관화 목표 미달성. 헬퍼 변경 시 sync 누락 위험 재발. **폐기 권고.**

### Option C (대안): 헬퍼에 caller-specific 함수 추가 (`isFileInMarker`, `areAllFilesPresent`)
- 장: caller 인라인 0줄.
- 단: 헬퍼 인터페이스 비대화. caller의 의미적 검증이 헬퍼로 흘러들어가 "마커 read" 단일 책임이 깨짐. **폐기 권고.**

**권고: Option A 채택.**

---

## 4. 검증 게이트

### scripts/test-pd80-fix.js의 검증 범위 (resolveCondition 명시: **4건 PASS 유지**) [T3/A1/O3]

본 보고서 작성 시점에 테스트 케이스 구체 내용은 미확인 — 치환 직전 Dev가 read하여 4 케이스가 다음을 커버하는지 확인 필요:
1. canonical 마커 read → frontmatter patch skip OK (L442 path)
2. canonical 마커 read → hasReport=true OK (L510 path)
3. sessionId mismatch → patch 진행 / hasReport=false (negative)
4. files 불일치 (마커 declared ≠ disk) → hasReport=false (negative)

### 본 치환이 추가로 요구하는 검증 (gate Gn)

| Gate | 통과 기준 | 검증 방식 |
|---|---|---|
| **G1 — 행위 동치성** | 치환 전후 4 케이스 모두 동일 결과 | `node scripts/test-pd80-fix.js` 4건 PASS |
| **G2 — legacy 호환 회귀** | `marker.session` (legacy 키)만 있는 마커 입력 시 헬퍼가 valid=true 반환 + L442/L510 caller가 종전 인라인 대비 **개선된** 결과 (false-positive 제거) 산출 | legacy 마커 fixture 1건 추가 테스트 (`2026-05-05_self-score-table-format-unify/_zero_condense.json` 형태) — 신규 테스트 케이스 G2 추가 권고 |
| **G3 — completedAt 부재 회귀** | `completedAt` 없는 마커에서 헬퍼 invalid 반환 → caller가 종전 동작(통과)과 다른 동작(차단)을 보이는지 명시적 확인. **의도된 안전 강화**로 분류. | fixture 추가 + 결과 문서화 |
| **G4 — require 경로 정합** | post-tool-use-task.js의 require 경로가 pre-tool-use-task.js와 동일 형태 + 런타임 모듈 해석 성공 | hook 실행 1회 (실제 세션 또는 mock invocation) — 로그에 require error 0 |

### 롤백 경로
- git revert 1 commit (post-tool-use-task.js 단일 파일 변경). pre-tool-use-task.js·zero-condense-marker.js 미변경 → 회귀 표면 최소.

### 중단 조건
- G1 4건 중 1건이라도 FAIL → 치환 중단, 원인 분석 후 재설계.
- G4 require error → 경로 재정렬 (pre-tool-use 기준 mirror).

### 전제
- pre-tool-use-task.js의 헬퍼 사용 패턴이 안정적으로 동작 중 (이미 SOT consumer로 작동). [T3/A2/O5 — PD-085 본문 명시]
- `_zero_condense.json` canonical 마커 schema가 D-180 이후 변경 없음.

---

## Self-Score

```
[ROLE:arki]
# self-scores
str_fd: 3
sa_rnd: 1
spc_lck: N
aud_rcl: 0.80
```

ARKI_WRITE_DONE: reports/2026-05-14_pd-085-marker-sot-consolidation/arki_rev1.md
