---
role: zero
session: session_153
topic: topic_131
date: 2026-05-01
turnId: 15
invocationMode: subagent
rev: 1
accessed_assets:
  - reports/2026-05-01_big-bang-legend-nexus-p3-1of2/dev_rev1.md
  - memory/shared/dispatch_config.json
  - memory/shared/decision_ledger.json
  - memory/shared/prime_directive.lock.json
  - memory/sessions/current_session.json
  - CLAUDE.md
  - memory/roles/jobs_memory.json
  - memory/roles/zero_memory.json
  - memory/roles/sage_memory.json
  - memory/roles/personas/role-sage.md
  - memory/roles/personas/role-zero.md
  - memory/roles/personas/role-edi.md
  - memory/roles/policies/role-sage.md
---

# Zero — NCL 전면 폐기 구현 검증 (s153 P3 1/2)

검증 영역 3 한정: tech-debt / security-review / simplify. violation flag direct read 차단(D-127) 준수 — grep으로만 흔적 확인, 점수 채점 없음.

## 1. tech-debt — **WARN** (잔존 NCL 흔적 다수)

### 1.1 PASS 항목
- `memory/shared/ncl_violations.jsonl.README.md` 파일 시스템 부재 ✅ (`ls` 결과 No such file)
- `dispatch_config.json` v0.3.0 — `sage.ncl_emission` / `zero.ncl_emission` 객체 모두 제거 확인 ✅
- `dispatch_config.sage.write_permission: "none"` 명시 ✅
- `CLAUDE.md` — "NCL violation flag", "ncl_emission" 표현 0건 ✅ (grep 검증 완료)
- `prime_directive.lock.json` sha256 `8403fce6f661…` 갱신, lockedBy=session_153 ✅
- `decision_ledger`에 D-133 박제(status 필드는 미부여, 관행상 active 결정은 status 미기재) ✅
- D-115 `deprecated supersededBy:D-133` ✅
- D-117 `partially-superseded supersededBy:D-133` ✅
- D-123 `deprecated supersededBy:D-133` ✅

### 1.2 FAIL — 페르소나 본문/역할 메모리 NCL 잔재 (DRY 위반 + tech-debt)

D-133이 NCL 인프라 전면 폐기를 선언했으나 **페르소나 본문·역할 메모리는 미정리**. 다음 파일들에 NCL 활성 표현 잔존:

```
memory/roles/personas/role-sage.md:16: NCL(Nexus Contribution Ledger) + decision_ledger + ... read-only 분석
memory/roles/personas/role-sage.md:23: NCL 영수증 직접 produce ... — D-115 정합, dispatch_config `sage.ncl_emission.allowed: false`
memory/roles/personas/role-sage.md:26: 자가 분석 결과를 NCL/decision_ledger에 직접 append
memory/roles/personas/role-sage.md:46: | read (NCL·ledger·self-scores·memory) | ✅ 전체 |
memory/roles/personas/role-sage.md:51: | NCL produce (영수증 발행) | ❌ — `ncl_emission.allowed: false` (Riki R-5) |
memory/roles/personas/role-sage.md:57: 자가채점 cross-check ... NCL 영수증·외부 관찰 ... 3축 비교
memory/roles/personas/role-sage.md:91: 교차 근거(NCL + decision_ledger + Master feedback) 3축 비교가 의무
memory/roles/personas/role-zero.md:39: `excludedAssets`: `["memory/shared/ncl_violations.jsonl", ...]`
memory/roles/personas/role-zero.md:63: | NCL produce | ✅ — Zero 페르소나 자체 영수증 발행 가능 |
memory/roles/policies/role-sage.md:19: NCL 영수증·외부 관찰 ... 3축 비교
memory/roles/policies/role-sage.md:41: NCL produce 금지 (`ncl_emission.allowed: false`)
memory/roles/sage_memory.json:13: "NCL 영수증 produce" (callTriggers 등에 잔존 추정)
memory/roles/sage_memory.json:54: "ncl_emission_allowed": false
memory/roles/zero_memory.json:36: "memory/shared/ncl_violations.jsonl" (excludedAssets)
memory/roles/zero_memory.json:40: "ncl_emission_allowed": true
memory/roles/jobs_memory.json:41: "ncl_emission_allowed": true
memory/roles/personas/role-edi.md:30: NCL Origin Trace flag 사후 검증 보조
```

**증거:** 위 grep 결과는 D-115/D-117/D-123 deprecate **이후** 시점에서 그대로 잔존. D-133이 `dispatch_config`만 정리하고 페르소나 본문/메모리 정리는 누락.

**영향도:** 다음 세션 페르소나 dispatch 시 hook v3가 페르소나 본문을 prepend하면 페르소나(특히 Sage·Zero·Jobs)가 NCL이 살아있다는 가정으로 발언 가능 — D-133의 폐기 정합성 훼손.

### 1.3 FAIL — D-133 본문 self-containment 미흡

D-133 본문이 deprecated된 D-115 본문을 정합 근거로 직접 인용(`Sage가 NCL violation flag direct read하여 자기검열 우회하는 경로 차단`이라는 D-115 본문이 D-128 본문에 잔존). D-128(Sage 격리 hook)도 NCL produce 차단을 별개 결정으로 박제.

```
decision_ledger.json:1773 D-115 본문: NCL 4항목 + violation flag 페르소나 노출 차단
decision_ledger.json:1804 D-117: 페르소나→NCL 단방향 produce, NCL→Sage 단방향 read
decision_ledger.json:1807 D-117 statusNote: D-133에 의해 NCL 데이터 흐름 부분 amendment, Star 토폴로지는 보존
decision_ledger.json:1853 D-123: NCL violation 4항목 판정 조건식 동결 (deprecated supersededBy: D-133)
decision_ledger.json:1869 D-124 본문: ncl_violations.jsonl 기록 위치 명시 (D-124는 살아있음)
decision_ledger.json:1883 D-125 본문: NCL raw 영역 hard-exclude (D-125는 살아있음)
```

**핵심 문제:** **D-124가 살아있는데** 본문에 "기록 위치: memory/shared/ncl_violations.jsonl"을 명시. ncl_violations.jsonl은 폐기됐는데 D-124는 유지 — D-124 amendment 또는 본문 정정 필요.

**D-118 amended 표시이나 supersededBy:none** — D-133이 D-118 amend했는데 supersededBy 링크 누락(추적성 결손).

## 2. security-review (하드코딩 secrets) — **PASS**

변경 6건 파일 스캔:
- `dispatch_config.json` — secret/token/key 0건 ✅
- `prime_directive.lock.json` — sha256 hash만 (secret 아님) ✅
- `decision_ledger.json` D-133 — 평문 결정 본문, secret 0건 ✅
- `CLAUDE.md` 변경 라인 — secret 0건 ✅
- `current_session.json` — sha256 hash 인용만 ✅

`prime_directive.lock.json` sha256 갱신은 D4 텍스트 변조(`NCL violation flag` 제거) 반영의 의도된 보안 변경 ✅.

`grep -i "secret|password|api_key|aws_|sk-"` 변경 파일 6건에서 노이즈(GITHUB_TOKEN 환경변수 참조 등) 외 실제 하드코딩 0건.

## 3. simplify (재사용·품질·효율) — **WARN**

### 3.1 PASS
- `dispatch_config.json` v0.3.0 — sage 9키 / zero 5키로 미니멀 유지, 불필요 중첩 0건 ✅
- `ncl_violations.jsonl.README.md` 삭제 — schema-only 문서 정리 ✅

### 3.2 WARN — 동일 변경 산재 (DRY 위반)

NCL 폐기 시점에 정합 조정해야 할 위치가 **9개 파일**에 흩어져 있고 본 세션에선 **3개만 정리**:

| 파일 | 정리 상태 |
|---|---|
| `dispatch_config.json` | ✅ 정리됨 |
| `CLAUDE.md` | ✅ 정리됨 |
| `prime_directive.lock.json` | ✅ 갱신됨 |
| `memory/roles/personas/role-sage.md` | ❌ NCL 다수 잔존 |
| `memory/roles/personas/role-zero.md` | ❌ NCL 잔존 |
| `memory/roles/policies/role-sage.md` | ❌ NCL 잔존 |
| `memory/roles/sage_memory.json` | ❌ ncl_emission_allowed 잔존 |
| `memory/roles/zero_memory.json` | ❌ ncl_emission_allowed + ncl_violations 경로 잔존 |
| `memory/roles/jobs_memory.json` | ❌ ncl_emission_allowed 잔존 |
| `memory/roles/personas/role-edi.md` | ❌ NCL Origin Trace 표현 잔존 |

**Refine 권고:** 다음 turn에서 일괄 cleanup commit (Audit→Refine→Cut). D-133 본문에 "후속 cleanup task: 페르소나 본문/역할 메모리 NCL 표현 일괄 제거" 명시 보강 권고.

### 3.3 WARN — D-133 본문 재사용성

D-133 value 본문이 deprecated 결정 인용 의존도 높음 — 향후 Sage·Zero 페르소나 spec 검토 시 D-115/D-117/D-123/D-128을 함께 봐야 의미 파악 가능. **self-containment 보강 권고**: D-133 본문에 "(1) 페르소나→NCL produce 폐기 (2) NCL→Sage read 폐기 (3) Sage→NCL 영수증화 폐기 (4) ncl_violations.jsonl 인프라 폐기 (5) Sage write 권한 0 본문 명시" 처럼 명시적 폐기 항목 enumerate.

## 4. 종합

| 영역 | 결과 |
|---|---|
| tech-debt | **WARN** (페르소나/메모리 NCL 잔재 9개 파일, D-118 supersededBy 링크 누락, D-124 본문 ncl_violations 경로 잔존) |
| security-review | **PASS** |
| simplify | **WARN** (DRY 위반 — 9 위치 중 3 위치만 정리) |

## 5. Cleanup 권고 (3개 항목)

1. **페르소나/메모리 일괄 cleanup** — 7개 파일에서 NCL/ncl_emission/ncl_violations 표현 제거 또는 deprecation 마커 박제 (Edi가 다음 세션 처리 권고).
2. **D-124 본문 amendment** — 기록 위치 `memory/shared/ncl_violations.jsonl` 표현 정정 또는 D-124 partial-supersede.
3. **D-118 supersededBy 링크 보강** — `supersededBy: D-133` (또는 amendments 필드 사용) 박제로 추적성 회복.

위 3건 모두 **본 세션에서 처리 가능한 산출물 레이어 작업**이나, Zero 권한(write=full로 추정되나 본 세션에서는 검증 권한만 사용)으로는 권고만 박제. Master 결정 또는 Edi 위임 권고.

---

ZERO_WRITE_DONE: reports/2026-05-01_big-bang-legend-nexus-p3-1of2/zero_rev1.md

[ROLE:zero]
# self-scores
gp_acc: 0.85
scc: Y
cs_cnt: 3
art_cmp: 1.0
gap_fc: 3
