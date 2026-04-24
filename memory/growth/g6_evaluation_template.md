---
title: "PD-023 G6 Acceptance Evaluation — Tier {A|B|C} Template"
specSource: "reports/2026-04-23_pd023-self-scores-thin-impl/arki_rev1.md §7"
tier: "{A | B | C}"                    # A=primary / B=fallback / C=last-resort
triggerCondition: "{trigger-narrative}" # e.g. "5토픽 종결 + Grade A·B·C 중 ≥ 2종 충족"
evaluatedAt: "{YYYY-MM-DDTHH:MM:SSZ}"
evaluator: "master"
gradesCovered: ["A", "B", "C"]         # 실제 데이터 범위
sessionRange: { from: "session_NNN", to: "session_MMM" }
topicsCovered: ["topic_NNN", "topic_..."]
verdict: "PENDING"                     # PASS | FAIL | PARTIAL | PENDING
---

# PD-023 G6 Acceptance Evaluation

> Tier 선택 가이드 (spec §7):
> - **Tier A (primary)** — 5토픽 종결 + Grade A·B·C 중 ≥ 2종 충족 시
> - **Tier B (fallback)** — 30세션 누적 시 Tier A 미충족 → Grade A/B/C 각 ≥ 1 의무
> - **Tier C (last resort)** — 60세션 도달 시 A/B 모두 미충족 → 가용 데이터 부분 평가

## Trigger Checklist

- [ ] 세션 누적: `{N}` 세션
- [ ] 종결 토픽 수: `{M}`
- [ ] Grade 분포: A=`{a}` / B=`{b}` / C=`{c}` / S=`{s}`
- [ ] 선택 Tier: **`{A|B|C}`**
- [ ] Tier 선택 근거: `{1줄 설명}`

---

## §7.1 Quantitative (6 auto-computed items)

각 항목은 스크립트로 자동 산출된다. 수동 계산 금지.

### Q1. Rater participation rate (topicType-aware)

**How to verify:**
```bash
npx ts-node scripts/compute-signature-metrics.ts --participation --gradesCovered A,B,C
```

- 기대: `participationExpectedTopicTypes` 기반 분모로 산출한 참여율이 role별 ≥ 80%
- 측정값: `{0.00}` (role별 내역 첨부)
- **판정:** `PASS | FAIL` — `{사유}`

### Q2. Audit field non-null rate ≥ 95%

**How to verify:**
```bash
jq -s '
  map(select(.registryVersion != null and .recordedBy != null and .recordSource != null and .sessionPhase != null and .ts != null))
  | length as $valid
  | $valid / (input_line_number // 1)
' memory/growth/self_scores.jsonl
```

또는:
```bash
npx ts-node scripts/validate-self-scores.ts --audit-fields
```

- 기대: 5필드 (registryVersion / recordedBy / recordSource / sessionPhase / ts) 모두 non-null인 레코드 비율 ≥ 95%
- 측정값: `{0.00}`
- **판정:** `PASS | FAIL` — `{사유}`

### Q3. Compute SLA 위반 0회

**How to verify:**
```bash
grep "E-010" logs/app.log | wc -l
# 또는 구조화 로그일 경우:
grep -E '"code"\s*:\s*"E-010"' logs/app.log | wc -l
```

- 기대: E-010 (compute SLA exceeded) 에러 로그 0건
- 측정값: `{N}` 건
- **판정:** `PASS | FAIL` — `{사유}`

### Q4. Schema validation E-class 에러 0건

**How to verify:**
```bash
npx ts-node scripts/validate-self-scores.ts --schema-only
npx ts-node scripts/compile-metrics-registry.ts --validate-only
# Ajv 리포트의 error 배열 길이 확인
```

- 기대: E-001 / E-002 / E-004 / E-006 / E-008 / E-009 / E-022 등 E-class schema 에러 누적 0건
- 측정값: `{N}` 건 (에러 코드별 breakdown 첨부)
- **판정:** `PASS | FAIL` — `{사유}`

### Q5. Regression test fixture diff 0

**How to verify:**
```bash
npx ts-node scripts/test-regression.ts
# 기대 stdout: "fixtures PASS (5/5)"
```

- 기대: PD-023 변경 전 5개 스냅샷 fixture 과 diff 0
- 측정값: `{N/5}` PASS
- **판정:** `PASS | FAIL` — `{사유}`

### Q6. Quarantine 폴더 forward-compat 슬롯 검증

**How to verify:**
```bash
ls -la memory/growth/_quarantine/
# 구조 존재 여부 확인
npx ts-node scripts/validate-self-scores.ts --extensions-namespace
# extensions.{moduleId}.* 위반 (E-022) 0건 기대
```

- 기대: `_quarantine/` 폴더 존재 + `extensions: {}` 슬롯 보존 + top-level 필드 추가 없음
- 측정값: 폴더 존재 `{Y/N}` · E-022 건수 `{N}`
- **판정:** `PASS | FAIL` — `{사유}`

### Quantitative Summary

| # | Item | Result | Value |
|---|---|---|---|
| Q1 | participation rate | `{PASS/FAIL}` | `{0.00}` |
| Q2 | audit non-null ≥ 95% | `{PASS/FAIL}` | `{0.00}` |
| Q3 | SLA 위반 0회 | `{PASS/FAIL}` | `{N}` |
| Q4 | schema E-class 0건 | `{PASS/FAIL}` | `{N}` |
| Q5 | regression diff 0 | `{PASS/FAIL}` | `{N/5}` |
| Q6 | quarantine slot | `{PASS/FAIL}` | `{Y/N}` |

---

## §7.2 Qualitative (5 Master fill-in items)

Master가 직접 기입. 회고 기반, 데이터 자동 산출 아님.

### R1. 5토픽 운영 일지 (각 토픽 종결 시 1줄 메모, 누적 5줄)

1. `topic_NNN` — `{한 줄 메모: 무엇을 결정/발견했고 MVP가 어디에 개입했나}`
2. `topic_NNN` — `{...}`
3. `topic_NNN` — `{...}`
4. `topic_NNN` — `{...}`
5. `topic_NNN` — `{...}`

- **Tier B/C의 경우:** 가용 토픽 수만큼 기록. 미달분은 `(미해당)` 표기.
- **판정:** `{SUFFICIENT | INSUFFICIENT}`

### R2. 세션 1~5 batch helper 사용 완료 여부

- 대상 세션: `session_NNN` ~ `session_MMM`
- `batch-score-helper.ts` 호출 여부 체크:
  - [ ] 세션 1: `{Y/N}` — 소요시간 `{분}`
  - [ ] 세션 2: `{Y/N}` — 소요시간 `{분}`
  - [ ] 세션 3: `{Y/N}` — 소요시간 `{분}`
  - [ ] 세션 4: `{Y/N}` — 소요시간 `{분}`
  - [ ] 세션 5: `{Y/N}` — 소요시간 `{분}`
- **판정:** `{전부 Y | 부분 | 전부 N}` — `{코멘트}`

### R3. Tier 1 dashboard 사용 자기 보고

- 지난 N세션 동안 Tier 1 카드를 실제로 본 횟수: `{N회}`
- 카드 정보로 의사결정을 조정한 경험: `{있음/없음 + 1줄 사례}`
- UI 개선 요구사항 (PD-025+ 반영): `{자유 기술}`
- **판정:** `{USED | UNUSED}`

### R4. "MVP가 의사결정에 영향" 사례 ≥ 1건

최소 1건의 구체 사례를 기입 (없으면 FAIL).

> **사례 1:**
> - 세션/토픽: `{session_NNN / topic_NNN}`
> - MVP가 표시한 신호: `{예: dev.codeReuse 점수 하락, arki.structuralClarity baseline 미도달}`
> - Master가 취한 조치: `{예: Arki 재호출, 범위 축소, PD 분할}`
> - 조치가 없었다면 일어났을 일: `{카운터팩추얼}`

- **판정:** `{PASS (≥1건) | FAIL (0건)}`

### R5. 5분 초과 helper 사용 세션 카운트

- `batch-score-helper.ts` 단독 실행이 5분을 넘은 세션: `{N}` 건
- 주요 지연 원인 (해당 시): `{기입 난이도 | 정의 모호 | UI 불편 | 기타}`
- 판정 기준: 30세션 누적 시 `{N}` ≥ 10 이면 PD-025 helper 개선 선행 필요.
- **판정:** `{ACCEPTABLE | NEEDS_IMPROVEMENT}`

### Qualitative Summary

| # | Item | Result |
|---|---|---|
| R1 | 5토픽 운영 일지 | `{SUFFICIENT/INSUFFICIENT}` |
| R2 | batch helper 사용 | `{전부 Y/부분/전부 N}` |
| R3 | Tier 1 dashboard 사용 | `{USED/UNUSED}` |
| R4 | 의사결정 영향 사례 | `{PASS/FAIL}` |
| R5 | 5분 초과 세션 | `{ACCEPTABLE/NEEDS_IMPROVEMENT}` |

---

## Verdict

- **정량 6/6:** `{N}` PASS
- **정성 5/5:** `{N}` PASS (SUFFICIENT/USED/PASS/ACCEPTABLE 기준)

### Final Verdict

**`PASS | FAIL | PARTIAL`**

### Rationale

`{3~5줄 설명 — Tier 선택 근거, 판정 근거, 잔여 리스크, 다음 단계 (PD-025 진입 / 보강 / rollback) 제안}`

### Next Actions

- [ ] PD-025 진입 (resolveCondition 충족 시)
- [ ] 정량 FAIL 항목 보강 (대상: `{Q?}`)
- [ ] 정성 INSUFFICIENT 항목 회고 재수집
- [ ] Rollback 검토 (E-010 SLA ≥ 3 또는 Master "원복" 신호 시 — `memory/growth/rollback_playbook.md` 참조)
