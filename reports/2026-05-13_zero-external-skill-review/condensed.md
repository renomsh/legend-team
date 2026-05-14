---
role: zero
turnId: condense
phase: condense
sessionId: session_246
topicId: topic_206
date: 2026-05-13
mode: D.Condense
preservePolicy: design-content-verbatim
invocationMode: subagent
---

# session_246 / topic_206 / PD-075 condense

D.Condense 게이트 산출물. 본 압축본은 흐름·맥락만 요약하고, **설계 내용(design content)은 원문 그대로 보존**합니다 (Master 신규 결정 정합 — 본 세션 turn 11 박제 예정).

원본 보고서 10건은 모두 보존 (이 condensed.md는 별도 파일).

---

## §1 흐름 요약 (요약 가능 부분)

- **turn 0 [arki_rev1]** — 옵션 (a)·(b) 제시. 옵션 (b)("문구만 정정 — 흡수 결정 유지") 권고. SOT를 D-119로 추정.
- **turn 1 [riki_rev1]** — Arki rev1 SOT 오선택 적출. **D-127이 실제 SOT** ("물리 파일 부재 확인" 박제). 옵션 (a)·(b) 동일 결과(흡수 유지) 두 박제 방식임을 적출. 정정 범위 = role-zero.md L28·L49 + D-127 본문 + supersede 체인 3건.
- **turn 2 [jobs_rev1]** — framing 재정의. 본질 = **3 영역 × 3 모드 9 매트릭스**. K1(메트릭 비교 가능성)·K4(외부 skill 진화)·K6(영역별 분포 동일) 미검증 전제 표기. OUT scope 6항 명시. executionPlanMode = conditional.
- **turn 3 [arki_rev2]** — 9 매트릭스 가설 + 실측 1건 후보 3건. 후보 1 (`scripts/lib/topic-status.ts` × tech-debt) 1순위 추천.
- **turn 4~6 [m1·m2·m3]** — 실측 1건 3 모드 병렬 실행. input = `scripts/lib/topic-status.ts` (100줄).
- **turn 7 [riki_rev2]** — 3 모드 적대적 감사. M1 정합 확인, M2 false positive 1건 + self-flag 작동, M3 fabrication 4건 + D-017 정면 위반 실증.
- **turn 8 [ace_synthesis]** — 종합검토. 단일 권고 = M1 default + M3 폐기 + security-review M2 cherry-pick 후속 PD.
- **turn 9 [jobs_rev2]** — Ace 권고 cross-check. 부분 동의 (M1 default·M3 폐기는 정합, sec-review M2 cherry-pick은 K1 미검증으로 강도 약화 권고).
- **turn 10·11 [Master 결정]** — Ace 영역 차등 권고를 **더 강한 M1 (영역 차등 없음, 흡수 + 적용 의무)**으로 재정의. 동시에 **인계 원문 보존 정책** 신규 D-NNN 박제 결정.

---

## §2 Design Content (원문 보존 — 압축·재서술 금지)

### 2.1 결정 1 — 강화된 M1 (Zero absorbs and applies all external skills)

> Zero 페르소나 외부 skill 운용 모드 = **강화된 M1 (흡수 + 적용)**.
> Zero는 외부 skill 3종(`engineering:tech-debt`·`simplify`·`engineering:code-review`)을 **호출하지 않는다 (call=false)**. 동시에 외부 skill이 제공하는 패턴 풀·시그니처는 **Zero 내부 Cut/Refine/Audit 도구에 흡수하여 적용한다 (absorb_apply=true)**. hook 자동 병발은 폐기 (hook_auto_invoke=false).
> 영역 차등 없음 — tech-debt·security-review·simplify 3 영역 모두 강화된 M1 적용.
> 본 결정 근거 = (1) topic-status.ts × tech-debt 실측 1건 (M1 fabrication 0건 / M2 false positive 1건 / M3 fabrication 4건 + D-017 위반), (2) D2 신뢰 경계 보호 (외부 skill SOT 외부), (3) D-017 Schedule-on-Demand 정합 (M3 hook 자동 시 일정 추정 자동 주입 차단).
> supersede: D-127 본문 amendment. D-146 (self-exclusion) 보존.

### 2.2 결정 2 — 인계 원문 보존 정책 (신규 D-NNN)

> 세션 간 인계 자산(condense·summary·decision 박제·session-end 보고)에서 **설계 내용(design content)은 원문 보존**한다.
> - 설계 내용 정의 = 구체 액션 항목·구현 명세·실측 결과·결정 근거 체인·박제 후보 D-NNN 본문·정책 신설 필드·코드/spec 정정 신규 문구
> - 요약 가능 범위 = 일반 토론 맥락·역할 발언 흐름·과정 진술·turn 순서
> - 적용 대상 = Zero D.Condense Phase A/B, Edi session-end 박제, decision_ledger entry, Master 인계 보고
> - 위반 시 = 다음 세션에서 design content 누락 → 의사결정 왜곡 → 재발 시 enforce hook 신설 검토
> 본 결정 근거 = 본 세션 condense 진행 중 Master 직접 명시 ("설계 내용 원문 보존, 과도 요약 금지").

### 2.3 role-zero.md 정정 신규 문구

**L28 (Cut/Refine/Audit 폐기 명분):**
- 기존: "**물리 파일 부재 확인**" (또는 D-127 supersede 본문)
- 신규: "legend-team 컨텍스트 내재화 우선 + D2(거짓 전제) 신뢰 경계 보호. 외부 skill 3종 실재하나 의도적 호출 배제 (call=false), 패턴 풀은 흡수 적용 (absorb_apply=true)."

**L49 (engineering:tech-debt·simplify 레거시 표기):**
- 기존: "(레거시: `engineering:tech-debt`, `simplify` skill — 본 페르소나 흡수로 외부 호출 폐기.)"
- 신규: "(외부 skill: `engineering:tech-debt`·`simplify`·`engineering:code-review` 실재. **강화된 M1** — 호출 배제(call=false) + 패턴 흡수 적용(absorb_apply=true). hook 자동 병발 폐기(hook_auto_invoke=false). 영역 차등 없음 — 3 영역 모두 동일 적용. 실측 근거: session_246 topic_206.)"

### 2.4 dispatch_config.json rules.zero 신설 필드 3종

```json
{
  "rules": {
    "zero": {
      "external_skills_call": false,
      "external_skills_absorb_apply": true,
      "hook_auto_invoke": false
    }
  }
}
```

- `external_skills_call: false` — Zero가 외부 skill을 호출하지 않음 (M2 차단)
- `external_skills_absorb_apply: true` — 외부 skill 패턴 풀을 내부 도구에 흡수 적용 의무 (강화된 M1의 적용 축)
- `hook_auto_invoke: false` — hook이 dispatch 시 외부 skill 자동 병발 금지 (M3 차단)

### 2.5 실측 결과 — `scripts/lib/topic-status.ts` × tech-debt 영역

| 모드 | 적출 건수 | fabrication | 비고 |
|---|---|---|---|
| **M1 (Zero 흡수)** | Cut 5건 + Refine 2건 = **7건** | **0건** | 호출처 grep (5종) + 정책 인용 (D-F·D-104-s130) + 테스트 존재 확인 (`tests/topic-status-finalize-r6.test.ts` 32/32 PASS) |
| **M2 (Zero 재량 — 외부 skill)** | C1-1~C7-1 = **18건** (대분류) | **1건 (false positive)** | C3-1 "테스트 부재 가능성" High 단언이 fabrication (테스트 실재). self-flag 메커니즘은 작동 (§마무리에 "legend-team 컨텍스트 무비판 채택 금지" 명시) |
| **M3 (외부 skill 단독)** | TD-01~TD-22 = **20건** | **4건 (High severity 박제)** | TD-13 (No unit tests — fabrication), TD-19 (No backup/rollback — git 백업 무지), TD-02 (No file locking — concurrent context 부재), TD-03 (Non-atomic write — High 과대평가). self-flag 없음. |

### 2.6 M3 D-017 (Schedule-on-Demand) 정면 위반 항목

원문 인용 [T4/A2/O5]:
- §6 *"Estimated remediation effort: **~4.5 person-days**"*
- §5 *"**Phase 1 — Stabilize (Week 1, ~1.5 days)**"·"**Phase 2 — Harden I/O (Week 2, ~2 days)**"·"**Phase 3 — Modernize (Week 3, ~1 day)**"*
- §4 *"Estimated effort: **0.5 day**"·"**2 hours**"·"**3 hours**"*

금지어 매칭: `Week 1/2/3` (절대 시간), `person-days`/`hours`/`day` (공수 단위), `Phase 1/2/3` 일정 라벨링.

→ M3 hook 자동 채택 시 매 Zero 호출마다 일정 추정이 legend-team artifact에 자동 주입 — D-017 정면 충돌.

### 2.7 9 매트릭스 (사전 가설 + 실측 확정)

| 영역 \ 모드 | M1 흡수 | M2 Zero 재량 | M3 Hook 자동 |
|---|---|---|---|
| **tech-debt** (실측) | 품질 3 / fabrication 0 / **우위** | 품질 3.5 / false positive 1 / self-flag 작동 | 품질 3 / fabrication 4 / D-017 위반 / **비권고** |
| **security-review** (미실측, 가설) | 품질 2.5 / Audit 시그니처 협소 | 품질 4 / `code-review` 비중첩 (가설) | 품질 3.5 / false positive 폭발 위험 |
| **simplify** (미실측, 가설) | 품질 3.5 / 컨벤션 내재화 우위 | 품질 3 / 패턴 중첩 가설 | 품질 2.5 / 과잉 정규화 위험 |

→ Master 최종 결정: 영역 차등 폐기. 3 영역 모두 **강화된 M1** 적용 (call=false + absorb_apply=true + hook_auto_invoke=false).

### 2.8 PD-075 resolves

> **PD-075 (Zero 외부 skill 실재 확인 + 운용 모드 결정) — resolved by D-NNN (강화된 M1 + 인계 원문 보존 정책 2건)**
> 사실관계: 외부 skill 3종 실재 (D-127 본문 "물리 파일 부재 확인" 단언은 부정확). 단 운용 결과 = **흡수 유지 + 적용 의무 추가** (call=false / absorb_apply=true / hook_auto_invoke=false).

### 2.9 후속 PD 분기 (현 세션 박제 대상 아님)

- **sec-review·simplify 영역 별도 PD 분기 불필요** — Master 결정으로 영역 차등 폐기 (강화된 M1 영역 무관 적용).
- M3 sanitization layer 설계 (Ace §6 PD-NNN-3) — 보류 (ROI 미검증, Master 미요청).

---

## §3 Self-score

```
[ROLE:zero]
# self-scores
ref_cnt: 0
hc_found: 0
cln_rt: 1.0
```

- `ref_cnt 0`: 본 turn은 D.Condense 게이트 (정제 산출물 생성). Cut/Refine/Audit 신규 적출 0건. 본 condense 자체는 정제 적출이 아닌 *압축 산출* — count 면제.
- `hc_found 0`: Audit 신규 적출 없음 (본 turn은 condense 전용, security-review 영역 미수행).
- `cln_rt 1.0`: 산출물 2건 (condensed.md + _zero_condense.json) write 후 read 검증 통과 (오류 0).

---

ZERO_WRITE_DONE: reports/2026-05-13_zero-external-skill-review/condensed.md
