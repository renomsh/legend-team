---
role: ace
session: session_173
topic: topic_150
topicId: topic_150
turnId: 3
phase: synthesis
rev: 1
invocationMode: subagent
---

# Ace — Zero 비효율 점검 종합검토

Ace입니다. Arki 인벤토리(12축, 후보 9건)·Riki 적대적 감사(R-1~R-3 + 누락 축 6)·Dev 행위 검증(5/0/1) 정독 후 단일 권고드립니다.

---

## Step 1. 대상 발언 명시

- `reports/2026-05-02_zero-logic-inefficiency-audit/arki_rev1.md` — 다축 footprint 12 인벤토리 + 정리 후보 C1~C9 + 자기감사 추가 3건
- `reports/2026-05-02_zero-logic-inefficiency-audit/riki_rev1.md` — R-1(C4 영향 평가 오류)·R-2(C1 폐기 회귀비용 미평가)·R-3(C5 보강 anti-pattern) + F1~F3 전제 결함
- `reports/2026-05-02_zero-logic-inefficiency-audit/dev_rev1.md` — V1~V5 행위 검증, 결손 0건, 잠재 위험 1건(W1 SOT 격하 미문서화)

---

## Step 2. 충돌·정합성 cross-review

### 충돌 1: C4(role_registry/palette 결손) — Arki 🔴 vs Riki 🟢 vs Dev V3 정상

**판정: Riki/Dev가 정합.** Dev V3가 결정적 — `compute-dashboard.ts` L456-474는 turns에서 role을 직접 추출, role_registry.json을 read하지 않음. viewer SOT는 `app/css/tokens.css`(zero/jobs/sage 12역할 박제)이며 role-colors.js L1 주석이 "Single source of truth: tokens.css"로 명시. Arki C4 "무색 출력 위험" 단언은 코드 미검증 추론이었음. **C4 강도 🔴 → 🟢 강등 확정.**

### 충돌 2: C1(excludedAssets) — Arki 🔴 vs Riki 🟡 유지+통합

**판정: Riki가 정합.** Dev 검증으로 enforce 코드 0건·보호 대상 파일 부재 양쪽 다 사실 확인. 폐기/유지 모두 회귀비용 0. 그러나 **자기참조 paradox(NCL/Sage log/audit trail 등 메타-자산이 향후 재도입될 가능성)** 이라는 일반 원칙 가치는 Riki R-2가 적출. **결정 권고는 통합(SOT 1곳)이되 enforce hook은 신설 X** — D-142(ROI 0 자동 감시 회피) 정합.

### 충돌 3: C5(rules.zero 비대칭 보강) — Arki 🟡 vs Riki ❌ 거부

**판정: Riki가 정합.** Edi rule이 비대해진 것은 D-138 영구 감시 회피의 결과(인라인 enforce 유지, config 박제만)였고, 이를 Zero에 복제하면 **dispatch_config 비대화 anti-pattern**. Master 피드백 "정착된 정책 재질문 금지" + "ROI 0 자동 감시 욕구의 변형"이라는 Riki 진단 정합. **C5 거부 확정.**

### 전제 재검토

- **Riki F3 "dispatch_config가 SOT여야 한다는 암묵 전제"** 결함 적출 = 본 토픽의 핵심 통찰. hook v3가 read하는 SOT는 persona+policy(prepend) + finalize.js 인라인이며, dispatch_config는 sage-gate hook 2개 키만 read. **이 전제 결함이 Arki C3·C5·C7 권고의 공통 뿌리.** Arki 권고 일부가 "dispatch_config 격상 욕구"로 오염되어 있음.

### 누락 축 (Dev 자인)

- viewer runtime 미검증(브라우저 색상 출력) — Riki A1 정적 검증으로 갈음
- build 회귀 미실행 — build.js 단순 복사 코드 명백, ROI 낮음
- worktrees 미검증 — 격리된 작업 트리, 운영 영향 0

---

## Step 3. 구조·흐름 시각 합성

### Porter — 구조 (Competitive Strategy, 1985)

Zero 페르소나의 핵심 trade-off는 **"정체성 표현 비용 vs 정리 효율"**. persona·policy·memory 3중 박제는 **hook v3 prepend 패턴의 자연스러운 결과**(persona=정체성, policy=발언구조, memory=self-state)이며 이는 비용이지만 trade-off로서 정당. dispatch_config를 "SOT 격상" 욕구로 4번째 박제 + enforce hook 신설은 **양립 불가의 잘못된 선택** — 코드가 read하지 않는 정책의 권위 격상은 운영 효익 없이 비대화만 초래(Porter 1985: "stuck in the middle" 함정). 단일 최적: **운영상 read되는 SOT(persona/policy)는 보존하고, 사문(dispatch_config)은 sparse 유지**.

### Keynes — 흐름 (General Theory, 1936)

본 토픽은 **식별 단계** — Master scope 명시. NCL 폐기(D-133) 흐름은 자기참조 paradox(R-1)을 시스템 잔재로 남겼고, 향후 메타-자산(Sage self-scores log·audit trail) 재도입 가능성은 **불확실성(uncertainty, not risk)** — 확률 산정 불가. Keynes 1936 원칙 "uncertainty 하에선 적응적 보존이 합리적". excludedAssets 일반 원칙(self-exclusion)은 0-cost 보존 가치 존재. 단 enforce 코드는 미래 자산 재도입 시점에 신설 — 지금 신설은 "premature optimization".

### 지속 가능성 판정

**Conditional Yes.** Zero 페르소나 footprint는 운영상 정합(Dev V1~V5 정상). 단 self-exclusion 정책의 SOT 분열(4중 박제)과 D-125 dead pointer 잔존은 **단순 통합·표기 정정**으로 해소 가능. 본 토픽 범위 내 처리 완결 가능.

---

## Step 4. 단일 최종 권고

**본 세션은 "phantom 정합 정합화 + dead pointer 정정 + 매니페스트 결손"만 처리하고, SOT 분열·영역 경계·ledger chain 모호는 별도 후속 토픽으로 분리한다.** Trade-off: 식별→정리 1세션 내 완결(Master 메모리 implementation_within_3_sessions 정합) 대신 신규 3 페르소나 공통 이슈는 격리.

### 본 세션 처리 항목 (3건)

| # | 항목 | 처리 | 근거 |
|---|---|---|---|
| **A1** | C1 — excludedAssets 4중 박제 → **persona 1곳 SOT 통합** | policy/memory/dispatch_config 3곳에서 prose 참조형 단축. enforce hook 신설 X. Self-exclusion 일반 원칙으로 정책 보존. | Riki R-2 + Dev V1 (회귀비용 0) + Keynes 적응적 보존 |
| **A2** | C2 — D-125 NCL `ncl_violations.jsonl` 명문 → **statusNote에 "D-133 supersede 후 dead pointer" 1줄 추가** | 본문 보존(D-134), pointer만 정정. | Arki §2.5 + D-134 정신 |
| **A3** | C9 — `topic_load_manifest.json`에 zero 키워드 등록 | "정제·tech-debt·simplify·security-review·하드코딩" 매핑 1건 추가. 저비용. | Arki §2.11 |

### 후속 토픽 분리 항목 (3건)

| # | 항목 | 분리 사유 |
|---|---|---|
| **B1** | C4 — role_registry/role_palette에 zero/jobs/sage 추가 | **3 페르소나 공통 결손** — Zero 단독 토픽 범위 밖. 별도 토픽에서 SOT 분열(role_palette vs tokens.css) 합의 후 일괄 처리. |
| **B2** | C8 — 3 영역(tech-debt/security-review/simplify) 경계 정량 기준 | Zero 호출 사례 누적 후 데이터 기반 박제. 현 시점 정량화는 추정. |
| **B3** | Dev W1 — role_registry.json SOT 격하 미문서화 | 3 페르소나 공통 + decision chain D-110→D-119→D-127 모호와 함께 묶어 별도 토픽. |

### 거부 항목 (1건)

- **C5 — rules.zero 비대칭 보강 거부.** Riki R-3 정합 — anti-pattern. dispatch_config 비대화 회피.

### DEFER 항목 (3건, 결정 불요)

- C3(scope_areas 4중) — 운영 효익 낮음(Riki F2). prose 가독성 손실 우려.
- C6(KNOWN_ROLES 공통 모듈) — Zero 한정 아님, ROI 낮음.
- C7(internal_tools 미사용 잔재) — 저비용, 정보 가치 잔존.

---

## Step 5. executionPlanMode

**`executionPlanMode: conditional`.** 본 토픽은 식별 단계 — A1~A3 결정이 Master 승인되면 Arki 재호출하여 구조적 실행계획(Phase 분해·롤백·전제) 박제 후 Dev 구현. 정리 실행은 후속 세션 권고(Master 메모리 implementation_within_3_sessions). **본 세션 내 정리 실행은 scope drift 위험.**

---

## 외부 anchor

- **Porter, M. E. (1985).** *Competitive Advantage: Creating and Sustaining Superior Performance.* Free Press. — Trade-off의 냉정함, "stuck in the middle" 함정. dispatch_config SOT 격상 욕구의 구조적 함정 진단 근거.
- **Keynes, J. M. (1936).** *The General Theory of Employment, Interest and Money.* Macmillan. — Uncertainty(불확실성) vs Risk(리스크) 구분, 적응적 보존 원칙. excludedAssets 일반 원칙 0-cost 유지 근거.

---

ACE_WRITE_DONE: C:/Projects/legend-team/reports/2026-05-02_zero-logic-inefficiency-audit/ace_rev1.md

[ROLE:ace]
# self-scores
rfrm_trg: Y
ctx_car: 0.95
mst_fr: 0.85
ang_nov: 3
