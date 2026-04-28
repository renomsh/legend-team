---
turnId: 3
invocationMode: subagent
role: ace
topic: topic_127
session: session_129
grade: S
phase: synthesis
date: 2026-04-28
---

# Ace 종합검토 — 옵션 2 + mitigation 6건 + R-4 분리

Ace입니다. Arki 옵션 2 권고와 Riki 함정 8건 감사를 받아, 본 토픽의 spec을 동결하고 Master gate 1건만 남겨 인계합니다. 단일 최적해만 제시합니다.

---

## 1. 종합 판단 (단일 권고)

**채택**: 옵션 2 (3층 분리 — `personas/` + `policies/role-{r}.md` + `policies/_common.md`) + Riki mitigation 6건 동결 + R-4(사칭 차단)는 별도 PD-052로 분리 + prereq 토큰 측정 추가 + P1 시범 확장(arki + ace + dev 3역할).

**이유 3가지** (절충 아님, 권고의 정당성):
1. **D-092 정합 회복은 옵션 1·2·3 모두 동일 비용**. 옵션 2는 추가로 공통 정책 중복 제거 → 향후 정책 변경 시 1곳만 수정. Master 휴먼 편집성(7회 직접 수정 실측) 보존.
2. **session_128 [A] 실패지점 직접 해결**. F-A(파일 있는데 안 박힘)는 옵션 2가 구조적으로 차단. `.claude/agents/` harness silent 의존 표면적 = 0.
3. **Riki 8건 중 6건이 옵션 2 채택을 전제로 한 mitigation** — 옵션 변경으로 회피 안 됨. 옵션 2 + mitigation 통합이 가장 적은 추가비용으로 가장 큰 함정 표면적 축소.

**기각된 대안**:
- 옵션 1 (2층 정적): 공통정책 8역할 중복. 정책 변경 시 8회 수정 회귀 비용 누적.
- 옵션 3 (페르소나만 파일, 정책=JS): 휴먼 편집성 손실. Master 작업 흐름 정합 안 됨. (Riki A4 가정 감사로 빈도 비교 근거는 약화됐으나, "휴먼 편집성 가치" 자체는 유지.)

---

## 2. Riki R-1~R-8 분배 매핑 (Phase별 흡수)

| 리스크 | 심각도 | mitigation | 분배 Phase |
|---|---|---|---|
| **R-1** token cap 절삭으로 persona silent miss | 🔴 | hook v3 절삭 우선순위(persona 절삭 금지) + 측정 prereq | **Phase 0 (prereq 측정)** + Phase 2 hook v3 |
| **R-2** hook 등록 회귀 부재 | 🔴 | `validate-hook-registration.ts` 신규 + finalize 사후 매칭 (turns vs log) | **Phase 2** + Phase 4 finalize 확장 |
| **R-3** 부분 마이그레이션 silent miss | 🔴 | 8역할 atomic commit 강제 + `phase: persona-missing` 로그 라인 분리 | **Phase 3 G3 게이트** |
| **R-4** PD-043 사후 사칭 차단 | 🔴 | **scope-out → 별도 PD-052 등록** | (별도 토픽) |
| **R-6** 메트릭 scale 검증 깨짐 | 🔴 | `_common.md`에 self-score scale 규칙 이전 + finalize scale validator | **Phase 2** + Phase 3 |
| **R-7** `_common.md` 비대화 | 🟡 | 100줄 cap 박제 + finalize 라인수 검증 | **Phase 3** + CLAUDE.md 1단락 |
| **R-8** P1 시범 1역할 편향 | 🟡 | 시범을 arki + ace(분리 모호) + dev(분리 짧음) 3역할로 확장 | **Phase 1 변경** |
| R-5 사칭 부수효과 | 🟡 | 인정만, 채택 근거 X | (조치 없음) |

**R-4 scope-out 정당화**: 본 토픽 = "persona 구조 재수립". 사칭 차단(post-hoc enforcement)은 호출 후 검증 영역 — 구조 재수립과 직교 축. 한 토픽에 묶으면 (a) Phase 5 추가로 본 세션 종착점 초과 (b) 사칭 차단 자체가 PD-043 후속 영역으로 별도 결정축 보유. 메모리 정책 "구현은 3세션 이내" 준수 + 정보 휘발 위험 회피. → PD-052 등록, 본 세션 Phase 4 종료 직후 자동 전이 dry-run에서 수면 위로.

---

## 3. Arki 가정 A2 → Phase 0 prereq 신설

Riki A2 지적(한국어 UTF-8 ~80~120바이트/줄, 추정 3KB가 실제 7~10KB일 가능성) 수용. P1 시범 직전 측정 의무화:

**Phase 0 — 토큰 측정 prereq** (Arki 실행계획 P1 앞 삽입):
- 산출물: 8역할 페르소나 영역 + 정책 영역 가상 분리 후 char/byte 측정 표 (`reports/2026-04-28_persona-structure-redesign/token-budget.md`).
- 측정 항목: `personas/role-{r}.md` 추정 byte, `policies/role-{r}.md` 추정 byte, `_common.md` 추정 byte, 8역할 평균 + 최대.
- 통과 기준: 1역할 호출당 persona-layer 합 ≤ TOTAL_CAP_CHARS의 15% (= 12KB). 초과 시 페르소나 문체 압축 또는 옵션 1 fallback 검토.
- hook v3 token cap 절삭 우선순위 = `sessionLayer 절삭 → topicLayer 절삭 → persona-layer 절삭 금지(=발언 거부)`. Phase 0 측정값이 이 정책의 실측 근거.

---

## 4. PD-044 재정의 박제 (Phase 4 G4 통과 후)

PD-044 노선("정책=persona / 누적학습=memory")은 본 토픽 결과와 **정반대**. 본 토픽 D-105(가칭) 박제와 동시에 PD-044 deprecated 처리.

**D-105 박제안**:
> persona·role·metrics 3층 분리 canonical 원칙 확정. **persona = 정체성·톤·금지·원칙(가벼움) / role policy = 정책·계약·발언구조(분리) / metrics = `metrics_registry.json` SOT(D-092 정합)**. 호출 시 PreToolUse hook v3가 `_common.md` + `policies/role-{r}.md` + `personas/role-{r}.md` 3파일 동적 compose하여 prompt 최상단 prepend. PD-044 deprecated, topic_127로 흡수·재정의.

**박제 시점**: Phase 3 완료 직후, Phase 4 검증 직전 **Master gate 의무** (manual mode). M-Gate-2로 별도 게이트. 본 게이트는 본 종합검토 단계에서 미실행.

---

## 5. 본 세션 종착점 결정

Master Q3 답("가능한 영역까지, 구현까지") 수용. Ace 단일 권고:

**본 세션 진행 가능 범위**: Phase 0 (prereq 측정) → Phase 1 (3역할 시범) → Phase 2 (hook v3) → Phase 3 (8역할 일괄 atomic). **Phase 4 검증·D-105 박제는 다음 세션** (한 세션에 박제 + 검증 동거 시 회귀 발견 후 박제 롤백 비용 큼).

단, Phase 0 측정값이 cap 15% 초과 시 즉시 본 세션 종결 + 옵션 1 fallback 검토 토픽 오픈. 이 분기는 Phase 0 산출물 보고 후 Master 확인.

---

## 6. 다음 호출 권고

1. **writing-plans 스킬 발동** (Dev 인계 직전) — Phase 0~3 task 분해. Arki 실행계획에 Phase 0 prereq 추가 + Riki mitigation 6건 task로 명시.
2. **Dev 호출** — subagent-driven-development 스킬 적용. Phase 0 → 1 → 2 → 3 순차. 각 Phase 게이트(G0~G3) 통과 시점에 Master gate 자동 삽입(Phase 3 통과 후 = D-105 박제 게이트 = M-Gate-2).
3. R-4 → PD-052 등록은 본 세션 종료 finalize hook이 자동 처리 (현 토픽 종결 시 auto-trigger dry-run).

---

## 7. Master gate (manual mode 의무)

**M-Gate-1 (본 세션 단 1건)**:
> R-4 (PD-043 사후 사칭 차단)을 **본 토픽에서 분리하여 PD-052로 등록**. Ace 권고는 분리. 본 세션 scope = persona 구조 재수립으로 한정. **동의 시 무응답 OK** (메모리 정책: 결정 불요 사항 자동 진행).

D-105 박제 + PD-044 deprecated 게이트(M-Gate-2)는 Phase 3 완료 후 별도 발동.

---

## 8. 폐기한 곁가지 (Riki 모범 따라 명시)

- ~옵션 1·3 재논쟁~ — Riki Section 4 가정 감사로 결론 확정, 추가 논의 무가치
- ~옵션 2 파일명·디렉터리명 컨벤션 의견~ — Arki/Dev 실무 영역
- ~persona 톤·문체 다듬기~ — 본 토픽 out scope (Ace 첫 발언 명시)
- ~vera 페르소나 신규 작성~ — 기존 파일 분리 우선
- ~R-5 (사칭 부수효과)~ — 옵션 2 채택 근거로 약함, 인정만

---

```yaml
# self-scores
rfrm_trg: N
ctx_car: 1.00
orc_hit: 0.85
ang_nov: 0
```

- `rfrm_trg: N` — 본 발언은 종합 단계, 신규 프레이밍 축 없음. Master 가정 흔들기 없음.
- `ctx_car: 1.00` — Arki(8섹션)·Riki(R-1~R-8 + A1~A4 가정 감사)·Master Q3 답·메모리 정책("결정 불요 자동 진행"·"3세션 이내"·"Riki 곁가지 폐기"·"단일 최적해") 전부 합성. 누락 없음.
- `orc_hit: 0.85` — Ace 종합 후 Dev 인계 흐름 명시, writing-plans 스킬 호출 권고. M-Gate-1 단일화로 Master 마찰 최소화. mst_fr은 측정 불가(다음 발언에서 검증) — YAML에서 생략.
- `ang_nov: 0` — 종합 단계, 신규 축 0건. Phase 0 prereq 신설은 Riki A2 지적 흡수이지 신규 축 아님.

ACE_WRITE_DONE: reports/2026-04-28_persona-structure-redesign/ace_rev2.md
