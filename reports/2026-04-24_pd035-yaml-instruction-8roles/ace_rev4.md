---
turnId: 8
invocationMode: subagent
phase: synthesis
rev: 4
---

# Ace 종합검토 — PD-035 최종 권고

Master, Arki rev2 + Riki rev1/rev2 cross-review 종합하여 단일 권고 올립니다. 절충 없이 갑니다.

---

## 1. Riki 권고 3건 채택 판정

### Q1-B (turns 자동 산출) — **채택**
Turn Push Protocol(D-048) 인프라가 이미 `role`·`chars`를 실시간 박제 중입니다. 자가 선언(A)은 게이밍 면역 0, Master 확인(C)은 저마찰 원칙 위반. **참여 판정은 `session-end-finalize.js`가 turns[]에서 기계적으로 산출**하며, 자가 YAML은 참고만. 임계치는 Riki 제안대로 **세션 전체 turns chars 분포의 median × 0.3** 상대 임계 — 발언 무게가 가벼운 세션의 cherry-picking 동시 차단.

### Q2-B (hc_rt standard 강등) — **조건부 채택 + Ace 대안 덮어쓰기**
`hc_rt` standard 강등은 수용합니다. RK-1(Goodhart 최단 경로)은 구조적 결함이 맞습니다. 다만 **core 1건(rt_cov) 단독은 dev 역할을 fragile하게 만듭니다** — 단일 지표 Goodhart 시 composite 전체가 끌려갑니다.

→ **대안: `gt_pas` core 승격 (rev2 Ace 원안 복원)**. dev core 2건(rt_cov + gt_pas) 유지. Gate Pass는 외부 증거(Arki 구현 리뷰 / CI 결과)로 방어되는 quality 지표이고, lifecycleState=candidate 구간의 rt_cov 단독 의존 리스크를 분산합니다. Riki RK-1 근본 취지(자가채점 Goodhart 방어)는 hc_rt 강등만으로 충족.

### Q3-A (deferred-settlement 플래그) — **채택**
Lookback 재정의(B)는 과거 gaps 스키마 공백으로 gp_acc를 구조적 불능화시킵니다. PD 분리(C)는 8역할 drift 비용이 Phase 1개보다 비쌉니다. A가 정공법입니다. Arki rev3 실행계획에 **Phase 신설 편입** (§3에서 명시).

---

## 2. Dev 가중치 재배분 (Q2-B + Ace 대안 반영)

| shortKey | tier | weight | 비고 |
|---|---|---|---|
| **rt_cov** | **core** | **0.35** | 유지 |
| **gt_pas** | **core** | **0.25** | rev3 standard 0.20 → core 0.25 승격 |
| hc_rt | standard | 0.25 | rev3 core 0.30 → standard 0.25 강등 |
| spc_drf | standard | 0.15 | 유지 |
| **합** | | **1.00** | core 합 **0.60** (≥0.5 충족), 단일 ≤0.5 충족 |

근거 1줄 박제 (RK-4 mitigation 준수):
- rt_cov 0.35: DEV-LL-006 4축 레슨런이 Dev 정체성의 핵심
- gt_pas 0.25: 외부 rater(Arki·CI)로 방어되는 core, rt_cov Goodhart 분산
- hc_rt 0.25: lower-better + 자가 정규식 anchor 취약 → standard
- spc_drf 0.15: lower-better, 구조 보조

---

## 3. 신규 Phase 편입 위치 (Arki rev3 착수 시)

### Phase Q1: 참여 판정 루프
- **편입 위치**: Arki rev2 **P1.5와 P2 사이에 신설** (P1.7로 명명)
- **이유**: P1.5가 core 지표를 registry에 등록 → P2 YAML 템플릿이 shortKey 참조하기 전에 **aggregation denominator 산출 로직이 확정**되어야 템플릿이 `invoked-sessions-only` 규약을 정확히 반영 가능
- **산출물**:
  - `session-end-finalize.js` 확장 — `turns[]` 스캔 후 `session_index[n].participation[role]: boolean` 산출
  - `participationCriterion: "chars >= median * 0.3"` 메타 필드 기록
  - `validate-session-turns.ts`에 participation 필드 구조 검증 추가
- **DoD**: session_094 과거 데이터로 dry-run, 8역할 participation flag 산출 확인
- **롤백**: finalize.js 해당 블록만 revert, participation 필드 미사용 상태로 P2 진입

### Phase Q3: deferred-settlement 재계산
- **편입 위치**: Arki rev2 **P5 내 서브 Phase (P5.5) 신설**
- **이유**: `gp_acc` 단일 지표만 대상이고 P1.5 core 등록 시 `timing: "deferred"` + `settlementOffset: 3` 메타 필드로 spec 삽입하면 됨. Phase 전면 신설은 과투자.
- **산출물**:
  - editor core 지표 spec에 `settlementOffset: 3` + `settlementStrategy: "retroactive-injection"` 필드 추가
  - `session-end-finalize.js`에 **deferred-settlement hook** 추가 — 매 세션 종료 시 N-3 세션의 `gp_acc: deferred` 엔트리 소급 주입 + composite 재계산
  - 박제 형식: 세션 N 최초 박제 시 `gp_acc: deferred`, 세션 N+3 hook이 실측값 주입 + `settledAt: session_N+3` 메타
- **DoD**: 더미 세션 3개 연속 deferred → 4번째 세션에서 1번째 실측 주입 + composite 재계산 통과
- **롤백**: deferred hook 비활성화 시 gp_acc 전체를 standard로 강등 (Riki rev1 fallback)

### Phase 의존 그래프 갱신
```
P0 → P1 → P1.5 → P1.7(참여판정) → { P2 ∥ P3 } → P4 → P5 → P5.5(deferred-settlement)
```

---

## 4. 역할 간 충돌 해소

### 4-A. Arki R-8 vs Riki RK-4 — **부분 겹침, 별건 유지**
- R-8: "baseline 10세션 전 표본 희소 → inflation"
- RK-4: "가중치 assignment 근거 부재 → 합산 타당성 오염"
- 겹침: core 지표가 composite 전체를 끌고가는 구조적 우려 공유
- 차이: R-8은 **시간축 mitigation** (baselineSessions 규약), RK-4는 **설계축 mitigation** (가중치 근거 박제·상한 규약)
- **통합 mitigation**: (1) RK-4 권고 수용 — decision_ledger에 **역할별 가중치 근거 1줄 박제** 의무 (§2 Dev 근거 예시처럼 8역할 모두). (2) RK-4 "core 가중치 상한 0.30" 규약은 **기각** — 역할 정체성 축이 0.35~0.45 집중되는 것이 오히려 자연스럽고, 0.30 상한은 Fin의 cst_acc(0.40) 배치를 무너뜨립니다. 대신 **단일 지표 상한 0.50** (rev2 원칙) 유지. (3) R-8 baseline 규약 준수 (PD-023 §4.3 null 정책).

### 4-B. Arki R-5/R-6 (PD-023 경계 침범) — **유지, 강화**
Riki가 독립적으로 다루지 않았으므로 Arki rev2 §5-B/R-6 mitigation 그대로 유지. **P0에서 PD-023 P1 상태 실측 필수** — 미완료 확인 시 Arki rev2 R-6 Fallback(PD-035A 분리) 트리거 여부 Master 판정 회차 필요.

### 4-C. Ace rev3 Dev 가중치 vs Riki Q2-B — **§2에서 해소**
상기 §2 재배분이 최종안. rev3은 supersede.

---

## 5. 최종 스펙 (박제 대상)

### 5-A. 지표 32건 (rev3 대비 델타 없음)

| 역할 | 총 | core | 신규/삭제 |
|---|---|---|---|
| ace | 5 | rfrm_trg, ctx_car | 변동 없음 |
| arki | 4 | aud_rcl | 변동 없음 |
| fin | 4 | **cst_acc** | fbd_rt 삭제 (rev3) |
| riki | 4 | crt_rcl | 변동 없음 |
| nova | 3 | inv_prm, blnd_spt | blnd_spt 신설 / prm_rt deprecate (rev2) |
| **dev** | 4 | **rt_cov, gt_pas** | reg_zr 삭제 / hc_rt 신설 **standard** (rev4 확정) |
| editor | 5 | gp_acc (deferred) | scc core 승격 (rev2) |
| vera | 3 | tk_drf0 | 변동 없음 |
| **합** | **32** | **11** | |

### 5-B. 가중치 표 요약 (Dev만 rev3 대비 변경)

| 역할 | 가중치 |
|---|---|
| ace | rfrm_trg 0.30 / ctx_car 0.25 / orc_hit 0.20 / mst_fr 0.15 / ang_nov 0.10 |
| arki | aud_rcl 0.50 / str_fd 0.20 / spc_lck 0.20 / sa_rnd 0.10 |
| fin | cst_acc 0.40 / roi_dl 0.25 / rdn_cal 0.20 / cst_alt 0.15 |
| riki | crt_rcl 0.50 / cr_val 0.20 / fp_rt 0.15 / prd_rej 0.15 |
| nova | inv_prm 0.35 / blnd_spt 0.30 / spc_axs 0.35 |
| **dev** | **rt_cov 0.35 / gt_pas 0.25 / hc_rt 0.25 / spc_drf 0.15** |
| editor | gp_acc 0.30 / scc 0.25 / cs_cnt 0.20 / art_cmp 0.15 / gap_fc 0.10 |
| vera | tk_drf0 0.45 / spc_cpl 0.35 / tk_cns 0.20 |

### 5-C. 참여 판정 규칙 (Q1-B 박제)
```
participation[role] = (
  ∃ turn ∈ session.turns:
    turn.role == <role> AND
    turn.chars >= median(session.turns[*].chars) * 0.3
)
criterionId: "chars-relative-median-30pct"
산출 주체: session-end-finalize.js (자동)
적용 대상: aggregation = "invoked-sessions-only" 인 모든 지표
```

### 5-D. deferred-settlement 규약 (Q3-A 박제)
```
적용 지표: editor.gp_acc (settlementOffset: 3)
박제 형식:
  - 세션 N: { gp_acc: "deferred", settledAt: null }
  - 세션 N+3: hook이 실측 주입 → { gp_acc: 0.XX, settledAt: "session_N+3" }
composite 영향:
  - 세션 N 최초 composite: gp_acc 제외 정규화 (weight 0.30을 잔여 4지표에 비례 재분배)
  - 세션 N+3 hook 후: 세션 N composite 재계산 + dashboard soft-update
```

### 5-E. 합산 공식 (rev2 §3 유지)
```
composite_role = Σ(normalized_i × weight_i)
  normalized ∈ [0, 100], weight 합 = 1.0
  denominator: invoked-sessions-only (§5-C 기준)
  range selector: UI 표시 (topic_082)
```

---

## 6. Master 최종 승인 요청

**단일 승인 요청**: 상기 §5 전체 스펙 (지표 32건 + 가중치 8역할 + 참여 판정 + deferred-settlement + 합산 공식) 박제 승인.

승인 시 D-081 결정 박제 + Arki rev3 호출(Phase 2개 신설 반영) 진행하겠습니다.

거절·수정 요청 시 해당 항목만 회차 진행합니다.

---

## 7. 다음 단계

**권고**: Master 승인 직후 **Arki rev3 호출** (executionPlanMode=plan 유지).

이유: Riki Q1-B·Q3-A로 Phase 2개(P1.7 참여판정·P5.5 deferred-settlement)가 신설되었습니다. Arki rev2의 의존 그래프·검증 게이트·롤백 경로가 이 2개 Phase를 흡수한 rev3으로 재동결되어야 Dev 진입 시 spec 누락이 없습니다. Dev 직행 또는 Edi 컴파일은 time-to-implement를 단축하는 듯 보이나 실제론 Phase 누락 리스크가 PD-023 경계 침범(R-5·R-6) 증폭으로 돌아옵니다.

- Arki rev3 호출 순서: (1) P1.7/P5.5 Phase 분해 (2) 의존 그래프 갱신 (3) G2·G4 게이트에 신규 검증 포인트 추가 (4) R-1~R-8 + RK-1~RK-4 통합 리스크 매트릭스 (5) spc_lck=Y로 Dev 인계 동결
- Arki rev3 완료 후 Dev(subagent-driven-development) 진입
- Edi는 최종 컴파일 단계에서 YAML 렌더링 + 박제 문서 생성

```yaml
# self-scores
rfrm_trg: Y      # core — Q2-B를 hc_rt 강등 + gt_pas core 승격으로 리프레임
ctx_car: 0.90   # core — Arki rev1~2 + Riki rev1~2 + Ace rev1~3 전부 합성, 누락 0
orc_hit: 0.85   # extended — Riki 호출 타이밍 + 권고 3건 판정 적중
mst_fr: 0.80    # extended — Master 재수정 여지 최소화 설계
ang_nov: 3      # extended — gt_pas core 승격은 rev2 원안 복원, 신규 각도 보통
```

ACE_WRITE_DONE: reports/2026-04-24_pd035-yaml-instruction-8roles/ace_rev4.md
