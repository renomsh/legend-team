---
role: dev
session: session_153
topic: topic_131
date: 2026-05-01
turnId: 21
invocationMode: subagent
rev: 2
accessed_assets:
  - memory/roles/personas/role-sage.md
  - memory/roles/personas/role-zero.md
  - memory/roles/personas/role-edi.md
  - memory/roles/policies/role-sage.md
  - memory/roles/sage_memory.json
  - memory/roles/zero_memory.json
  - memory/roles/jobs_memory.json
  - memory/shared/decision_ledger.json
---

# Dev rev2 — Zero rev1 WARN 2건 cleanup

## 1. 무엇을 변경했는지 (변경 파일 표)

| # | 파일 | 변경 종류 | 잔존 검증 |
|---|---|---|---|
| 1 | `memory/roles/personas/role-sage.md` | edit | NCL 표현 5곳 정리 (역할정체성 / 절대금지 4 bullet / dispatch_config 키 / R&R 표 / 분석 축 3 / Caveat 정책 봉인) — 잔존 0건 |
| 2 | `memory/roles/personas/role-zero.md` | edit | excludedAssets에서 `ncl_violations.jsonl` 제거 + 절대금지 D-115/D-125 → D-125 + 호출 규칙 D-115/D-125 → D-125 + R&R "NCL produce" 행 삭제 — 잔존 0건 |
| 3 | `memory/roles/personas/role-edi.md` | edit | "NCL Origin Trace flag 사후 검증 보조" 한 줄 제거 — 잔존 0건 |
| 4 | `memory/roles/policies/role-sage.md` | edit | 분석 축 3 "NCL 영수증" 제거 + 강제 제약 "NCL produce 금지 (`ncl_emission.allowed: false`)" 한 줄 제거 — 잔존 0건 |
| 5 | `memory/roles/sage_memory.json` | edit | scope.out "NCL 영수증 produce" 항목 제거 + policy.callTriggers `ncl_emission_allowed: false` 필드 제거 — 잔존 0건 |
| 6 | `memory/roles/zero_memory.json` | edit | policy.excludedAssets `memory/shared/ncl_violations.jsonl` 제거 + policy `ncl_emission_allowed: true` 필드 제거 — 잔존 0건 |
| 7 | `memory/roles/jobs_memory.json` | edit | policy.callTriggers `ncl_emission_allowed: true` 필드 제거 — 잔존 0건 |
| 8 | `memory/shared/decision_ledger.json` | edit | D-124 `decision` 본문 `memory/shared/ncl_violations.jsonl (raw, append-only)` 부분 → "별도 인프라 (NCL 폐기 후 재정의 필요)" 표현으로 정리. ack 50자/TTL 2 본질 보존 |

**원칙 준수 결과:**
- "deprecated D-133" 주석 추가 0건 (잔재 흔적 만들지 않음)
- 페르소나 본체 정체성·정책 보존 (Sage same-session 격리 D-128 / Zero 3 영역 / Jobs framing)
- JSON 콤마 syntax 4개 파일 모두 정상

## 2. 어떻게 실행/검증했는지 (검증 결과 표)

### 2-A. JSON parse 검증 (변경한 4 JSON 파일)

```bash
node -e "JSON.parse(require('fs').readFileSync('memory/roles/sage_memory.json'))" && echo sage_OK
node -e "JSON.parse(require('fs').readFileSync('memory/roles/zero_memory.json'))" && echo zero_OK
node -e "JSON.parse(require('fs').readFileSync('memory/roles/jobs_memory.json'))" && echo jobs_OK
node -e "JSON.parse(require('fs').readFileSync('memory/shared/decision_ledger.json'))" && echo ledger_OK
```

**실제 출력**:

```
sage_OK
zero_OK
jobs_OK
ledger_OK
```

| 파일 | 결과 |
|---|---|
| sage_memory.json | OK |
| zero_memory.json | OK |
| jobs_memory.json | OK |
| decision_ledger.json | OK |

### 2-B. 최종 grep — `memory/roles/` 잔존 케이스

```bash
grep -rn "NCL\|ncl_violation\|ncl_emission" memory/roles/
```

**실제 출력**:

```
memory/roles/ace_memory.json:170: "pattern": "NCL+Sage+Master 3-Layer 합의. ..."
memory/roles/fin_memory.json:56: "pattern": "D-120 enforcement ... Goodhart 회피 위해 NCL raw 점수 ..."
```

| 잔존 위치 | 박제 사유 |
|---|---|
| ace_memory.json:170 | `lessonLog[].pattern` — 과거 turn(s140)의 합의 기록. NCL 폐기 이전 시점의 정직 history 기록이므로 보존 정합. |
| fin_memory.json:56 | `lessonLog[].pattern` — 과거 turn(s140) Fin의 D-120 enforcement 단계 분리 권고 기록. 과거 시점 외부 anchor(Goodhart 1975) 인용 포함. 보존 정합. |

**판정**: lessonLog 항목은 과거 의사결정의 정직 기록(D3 정합 — 저장소는 history를 보존)이며 잔재가 아닌 history. cleanup 미션의 "잔재 정리" 범위 밖. **새로운 페르소나/메모리 활성 영역의 NCL 잔재 = 0건**.

### 2-C. D-124 본문 정합 확인

```bash
grep "ncl_violations\.jsonl \(raw" memory/shared/decision_ledger.json
```

**실제 출력**: `No matches found` ✅

D-124 ack 50자 / TTL 2 세션 / Master 전권 본질 보존 확인:

- `ackReason 50자 이상 의무` (보존)
- `ack TTL = 2 세션` (보존)
- `severity 무관 openMasterAlerts 강제 prepend` (보존)
- `Ace 우선순위 자가 분류 권한 제거` (보존)
- `dashboard ackedButUnresolved 패널` (보존)
- `resolve/dismiss 권한 Master 전권` (보존)

### 2-D. dispatch_config.json 무관 확인

미션 명시: "이미 Dev rev1에서 정리됨". 본 turn 변경 없음.

### 2-E. D-118 amendedBy 링크 (B1)

```bash
grep -A 2 '"id": "D-118"' memory/shared/decision_ledger.json | head -10
```

확인 결과: `"status": "amended"`, `"amendedBy": "D-133"` 이미 박제 완료 (이전 작업 turn 또는 D-133 박제 시 동시 처리됨). 본 turn 추가 변경 0건. 미션 B1 요건 충족 상태.

## 3. 미해결 이슈

1. **lessonLog 잔존 2건 (ace/fin)** — 본 cleanup 범위 밖(과거 turn history 기록). 정직 보존 정합.
2. **사용자 요청 미스매치 가능성** — 본 미션은 D-118에 `amendedBy: "D-133"` 추가 지시였으나 실제 ledger에는 이미 박제되어 있음. 변경 행위 없이 미션 충족 확인. 만약 다른 의도(예: D-117·D-120·D-123 전부 수정)라면 후속 turn에서 재지시 필요.
3. **page-side 사이드 이펙트 0건** — `dispatch_config.json`은 본 turn 미수정. CLAUDE.md / hooks 미수정 (미션 범위 밖). 빌드/검증 hook 영향 0.

---

DEV_WRITE_DONE: reports/2026-05-01_big-bang-legend-nexus-p3-1of2/dev_rev2.md

[ROLE:dev]
# self-scores
rt_cov: 1.0
gt_pas: 1.0
hc_rt: 0.0
spc_drf: 0
