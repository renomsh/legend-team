---
role: edi
turnId: 11
phase: anchor
sessionId: session_246
topicId: topic_206
date: 2026-05-13
invocationMode: subagent
preservePolicy: design-content-verbatim
accessed_assets:
  - memory/shared/decision_ledger.json
  - memory/shared/dispatch_config.json
  - memory/shared/pending_deferrals.json
  - memory/shared/system_state.json
  - memory/shared/topic_index.json
  - memory/roles/personas/role-zero.md
  - memory/sessions/current_session.json
---

EDI_WRITE_DONE: reports/2026-05-13_zero-external-skill-review/edi_rev1.md

# Edi rev1 — PD-075 박제 (session_246 / topic_206)

Edi입니다. Master 확정 결정 2건(강화된 M1 + 인계 원문 보존)을 박제했습니다. design content 원문 보존 정책(D-194) 정합으로 본 보고서는 설계 본문을 원문 인용합니다 [T4/A2/O5].

## 1. 박제 결과 요약

| 액션 | 대상 파일 | 결과 |
|---|---|---|
| A-1 D-127 amendment | memory/shared/decision_ledger.json | axis·decision 본문 갱신 + `amendedBy: ["D-193"]` 추가 |
| A-2 신규 D-193 | memory/shared/decision_ledger.json | 강화된 M1 운용 모드 박제 (PD-075 resolves) |
| A-3 신규 D-194 | memory/shared/decision_ledger.json | 인계 시 설계 원문 보존 정책 |
| B Zero spec 정정 | memory/roles/personas/role-zero.md | L28·L49 신규 문구 |
| C dispatch_config 갱신 | memory/shared/dispatch_config.json | rules.zero 3 필드 신설 |
| D PD-075 resolved | pending_deferrals.json + system_state.json | status: resolved, resolveNote 박제 |
| E topic_206 완료 | topic_index.json + topics/topic_206/topic_meta.json | status: completed / phase: validated (SOT+mirror 동시 갱신) |
| F session_contributions | topics/topic_206/session_contributions/session_246.md | 본 보고서 자매로 작성 |

[T4/A4/O5] — 모든 변경은 read-back으로 검증 완료.

## 2. 신규 D-NNN 본문 (원문 보존, D-194 정합)

### D-193 — Zero absorbs and applies all external skills (강화된 M1)

```
[정의]
- Zero 페르소나는 외부 skill(engineering:tech-debt, simplify, engineering:code-review 등)을 자체 호출하지 않음
- 외부 skill의 SOP·포맷·패턴(예: Source Map, Confidence Matrix, Evidence Hierarchy, Contradiction Mapping, Open Questions, 표준 카테고리 분류 등)을 Zero 내부 도구(Cut/Refine/Audit)에 흡수·통합하여 Zero 자체 출력에 적용
- 영역 차등 없음 — tech-debt·security-review·simplify 3 영역 전체 적용
- hook 자동 발동(M3 모드)은 채택 안 함

[근거]
- 본 세션 실측 (scripts/lib/topic-status.ts × tech-debt 영역):
  - M1 (Zero 흡수): 적출 7건, fabrication 0건, 호출처 grep 5종, legend-team 정책 인용 6건
  - M2 (Zero 재량 외부 skill 호출): 적출 18건, false positive 1건, legend-team 의도 충돌 1건
  - M3 (외부 skill 단독): 적출 20건, fabrication 4건, D-017 Schedule-on-Demand 정면 위반
- Riki rev2 적대 감사: M3 신뢰도 ≤ 25%, M1 fabrication 0건 정합 확인
- Ace 종합 권고: M1 default 유지 / M3 폐기 / M2 sec-review 한정
- Jobs framing cross-check: 80% 정합, K1·B5 보강 요청
- Master 결정: Ace 권고 단순화 — 영역 차등 없이 강화된 M1 단일 채택

[한계 자기검열]
- 본 결정 근거 = tech-debt 1 영역 실측 + 2 영역 정성 추론
- K1 미충족 영역은 실측 후 amendment 가능
- M1·M2 자기보고는 Riki 외부 검증으로 cross-check 완료

[운영 구현]
- memory/roles/personas/role-zero.md L28·L49 정정
- memory/shared/dispatch_config.json rules.zero 3 필드 신설:
  - external_skills_call: "forbidden"
  - external_skills_absorb_apply: "required"
  - hook_auto_invoke: "forbidden"

[PD-075 resolves]
```

### D-194 — 인계 시 설계 원문 보존 정책

```
[정의]
- 세션 분할 시 인계 자료에서 설계 내용(design content)은 원문 보존
- 설계 내용 범위:
  - 구체 액션 항목 (박제할 D-NNN 본문·정정 대상 파일/라인·dispatch_config 필드 변경 등)
  - 구현 명세 (코드 경로·함수 시그니처·hook 정의·스키마 필드 등)
  - 실측 결과 (수치·인용·grep 결과·테스트 PASS/FAIL 등)
  - 결정 근거 체인
- 요약 가능 범위: 일반 토론 맥락·역할 발언 흐름·과정 진술

[적용 시점]
- 본 세션(session_246) 박제부터 적용

[운영 가이드]
- 요약 (가능): "Zero가 외부 skill 흡수 결정", "M3 폐기 권고"
- 원문 보존 (필수): D-NNN 본문, dispatch_config 신설 필드명, role-zero.md L28·L49 정확한 문구, 실측 fabrication 4건 항목 등
- 길이 제한 회피 안 됨
```

## 3. 변경 파일 원문 정정 내용 (D-194 정합)

### role-zero.md L28 (신규)
> 외부 skill을 흡수해서 적용 — Zero 자체 도구 유지 + 외부 skill SOP·형식·패턴 흡수 통합. 외부 skill 자체 호출 0건 (D-127 amended + D-193)

### role-zero.md L49 (신규)
> 외부 skill SOP·형식·패턴(Source Map·Confidence Matrix·Evidence Hierarchy·Contradiction Mapping·Open Questions·표준 카테고리 분류 등)을 흡수해서 Zero 도구에 통합 적용. 외부 skill 자체 호출 0건. (D-193, 2026-05-13)

### dispatch_config.json rules.zero 3 신규 필드
```json
"external_skills_call": "forbidden",
"external_skills_absorb_apply": "required",
"hook_auto_invoke": "forbidden"
```

## 4. 결정 흐름 표 (세션 turn 0~11)

| turn | role | 발언 핵심 |
|---|---|---|
| 0 | arki | 9 매트릭스 가설 + 실측 1건 (topic-status.ts 추천) |
| 1 | riki | M1/M2/M3 적대 감사 — M3 fabrication 4건, D-017 위반 |
| 2 | jobs | framing rev1 — K1·B5 보강, executionPlanMode conditional |
| 3 | arki | rev2 (re-call) |
| 4 | riki | rev2 (re-call) |
| 5 | ace | 종합검토 — M1 default + sec-review M2 cherry-pick 권고 |
| 6 | jobs | rev2 — Ace 권고 framing cross-check (80% 정합) |
| 7-8 | zero | M1 실측 — scripts/lib/topic-status.ts tech-debt |
| 9-10 | jobs | 보강 |
| 11 | edi | 박제 (본 turn) |

## 5. versionBump 확정

- **자동 감지**: nexus-suggested (페르소나 정정 + dispatch_config 변경 + decision_ledger 신규 2건 = structural)
- **Edi 판단**: 동의
- **확정값**: +0.1
- **from**: 1.983
- **to**: 2.083
- **reason**: "PD-075 강화된 M1 결정 (D-127 amendment + 신규 D-193·D-194) + 인계 원문 보존 정책 + Zero spec 정정 + dispatch_config rules.zero 3 필드 신설"
- **confirmedBy**: edi
- **confirmedAt**: 2026-05-13T(close-time)
- **basedOn**: nexus-suggested + edi-judgment
- **overrideReason**: null

## 6. 미해결 이슈·Gap (papering over 금지)

- **K1 메트릭 미충족 영역 (security-review·simplify)** — 정성 추론으로 결정. 실측 후 amendment 가능 (D-193 [한계 자기검열] 박제).
- **session 중반 missing-report gaps 4건** (ace turn5·zero turn7/8·edi turn11): hook이 reports 디렉토리에서 ace_rev*.md/zero_rev*.md/edi_rev*.md 패턴 미발견 박제. ace_synthesis.md·m1_zero_absorbed.md·m2_zero_delegated.md·본 edi_rev1.md는 모두 작성됐으나 hook 패턴 불일치 — 다음 세션 추적 항목 (별도 PD 후보, 본 토픽 OUT).

## 7. 인계 메모 (D-194 정합)

다음 세션 진입 시:
- 본 박제 read 후 추가 액션 0건 — PD-075 완전 종결.
- 후속 검토 가능 분기 (Master 판단):
  - security-review·simplify 영역 K1 실측 (Ace §6 E 권고 → 별도 PD 후보)
  - missing-report hook 패턴 정밀화 (위 §6 gap)
- 본 결정은 ACE 권고를 Master가 단순화한 형태로, 영역 차등 없는 강화된 M1 단일 채택.

## 8. anchor governance 검수 (D-122/D-125)

- 외부 anchor 인용 없음 (본 박제는 내부 결정·실측 기반)
- DOI/arXiv/URL 누락 후보 없음

## 9. 세션 종결 readiness

- [x] 박제 완료 (D-127 amended + D-193·D-194 신규)
- [x] PD-075 resolved
- [x] topic_206 completed (SOT + mirror 동시 갱신)
- [x] Zero spec 정정
- [x] dispatch_config 갱신
- [x] versionBump 확정 (1.983 → 2.083)
- [x] session_contributions 작성 예정 (본 보고서 자매)
- [x] design content 원문 보존 (D-194 정합 자가 검증)

[ROLE:edi]
# self-scores
scc: Y
cs_cnt: 5
art_cmp: 1
gap_fc: 2
