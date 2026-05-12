---
role: riki
turnId: 3
invocationMode: subagent
topic: topic_202
session: session_238
---

# Riki — PD-80 Arki 권고 검토

Riki입니다. Arki 권고에 대한 적대적 검증입니다.

## 1. 반례 탐색 결과 [T4 / A1 / O5]

**legacy 마커 분포 실측** — `reports/**/_zero_condense.json` 22건 grep:
- `"sessionId":` 21건
- `"session":` 1건 → `reports/2026-05-05_self-score-table-format-unify/_zero_condense.json`

**결론**: legacy 키 마커가 실재합니다 (1건, ~4.5%). Arki 우려는 가상 위험 아님 [T4].

**Arki 인용 정확성** — post-tool-use-task.js line 446 `marker.sessionId === _sessionId` 및 line 511 동일 패턴 확인. 인라인 read 2곳 모두 `marker.sessionId`만 검사, legacy fallback 없음 [T4 / A1 / O5]. pre-tool-use line 226 `require('../../scripts/lib/zero-condense-marker.js')` 헬퍼 import 확인 [T4].

**zero-condense-marker.js:114** `m.sessionId ?? m.session` legacy fallback 실재 [T4].

## 2. 각 권고 검토

### 권고 1 (인라인 → 헬퍼 치환): **사실 / 채택 동의** [T4 / A1 / O4]
- legacy 마커 1건 실재. post-tool-use 인라인 검사가 해당 디렉토리 진입 시 `marker.sessionId === _sessionId` → `undefined === sess_id` → false → frontmatter 패치 시도 + missing-report gap 박제 가능 (false-positive 회귀).
- Arki 진단 정확.

### 권고 2 (마커 검증 일반화 폐기): **동의** [T2 / A1 / O3]
- 사용처 1. YAGNI 적정.

### 권고 3 (test 위치 유지): **동의 / 검토 없음** [T1 / A0 / O1]
- Riki 영역 아님.

### 권고 4 (D.* 게이트 일반화 보류): **동의** [T2 / A1 / O3]
- 두 번째 사례 전 추상화는 추상화 부채.

## 3. 숨은 전제 적출

**(a) "헬��� = SOT" 전제**: 헬퐈 자체 결함 시 단일 장애점. **다만** 현재는 인라인이 SOT를 우회하는 게 더 위험 (legacy 키 모름) → 단일화 정당 [T3 / A1 / O3].

**(b) post-tool-use 검증 의미론 차이**: 인라인은 `sessionId` **AND** `files.includes(fileName)` (line 447, 513) 동시 검증. 헬퐈 `readAndValidateMarker`는 sessionId·completedAt만 검사, `files` 포함 여부는 caller 책임. **치환 시 files 검증 누락 위험** [T4 / A1 / O5].

→ 권고: 헬퐈 호출 후 `result.valid` + `result.canonical.files.includes(fileName)` 별도 체크 잔존 필요. Arki "치환"이 단순 1:1이 아님을 명시할 것.

## 4. 실패 모드 (옵션 A 채택 시)

- **F1 [🟡]**: 헬퐈 시그니처 변화 시 양 hook 동시 영향 (단일 장애점). mitigation: 헬퐈 변경 시 `scripts/test-pd80-fix.js` 회귀 + pre/post 양쪽 smoke 필수.
- **F2 [🔴]**: files 검증 누락 시 `_zero_condense.json` 존재만으로 frontmatter 패치 우회 → Zero 외 임의 산출물 검증 면제 회귀. mitigation: 치환 코드에 files.includes(fileName) 명시 잔존.
- **F3 [🟡]**: 헬퐈 require 경로 (`../../scripts/lib/...`) 동작 검증. post-tool-use도 동일 위치 (`.claude/hooks/`) → 경로 동일, OK [T4].

## 5. 종합 권고: **채택 (조건부)** [T3 / A1 / O3]

- 옵션 A 채택 합당. legacy 마커 1건 실증, FP 회귀 차단 가치 명확.
- **조건**: 치환 시 `files.includes(fileName)` 검증 인라인 잔존시킬 것. 헬퐈는 sessionId 정규화·legacy 호환만 담당, files 매칭은 caller(post-tool-use 두 지점) 책임 유지.
- 권고 2·4 폐기/보류 동의. N+1 우려 만들지 않음.

[ROLE:riki]
# self-scores
crt_rcl: 1.0
cr_val: Y
prd_rej: N
fp_rt: 0.0

RIKI_WRITE_DONE: reports/2026-05-12_pd-080-zero-marker-fp/riki_rev1.md
