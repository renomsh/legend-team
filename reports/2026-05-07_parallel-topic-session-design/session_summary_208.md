---
sessionId: session_208
topicId: topic_176
grade: S
type: framing
date: 2026-05-08
---

# session_208 — topic_176 병렬 토픽 및 세션 구조 설계 (framing+plan 박제)

## 발언 sequence

| turn | role | 핵심 |
|---|---|---|
| 0 | arki rev3 | Case B "사고 병렬+발언·기록 순차" frame, turnPushMode 분기, hook 6 책임/race ③ 본질, MUST_NOW 6, spc_lck=N |
| 1 | jobs rev1 | 본질=편향(시간=부수). 결정축 4·IN5/OUT8·인지편향 5·executionPlanMode=plan |
| 2 | riki rev1 | 🔴 5 + 🟡 5. dead artifact 연쇄 risk. prd_rej=Y |
| 3 | ace rev1 | 4 충돌 → Riki 단일 권고. M1~M5 추출. 지속 가능성=Conditional |
| 4 | arki rev4 | 통합 11건 + PD-066 + 자산 매트릭스 11종 + Phase P-1~P9 + 3-게이트, spc_lck=Y |
| 5-6 | zero | D.Condense, condensed.md(prsv=Y, redundancyReduction≈0.55) |
| 7 | edi | compile (본 세션 산출물) |

## Master 결정 (verbatim 보존)

1. **M1 frame 본질**: "맞아. 시간은 동시 토픽으로 해결할꺼야. 본질은 편향이야."
2. **M2 D-170 amendment**: "1-3동의하고 각자 발언하고 나서는 서로 내용을 보면서 토론을 해야지. b는 OK / c는 default = prompt prepend 차단만"
3. **M2-(d) 토론 phase**: "공개하고 나서 한번만 이야기하는게 아니라 서로 의견이 좁혀질때까지 이야기를 주고 받는거야... 발언권은 Nexus가 분배... 나는 언제든 끼어들고 싶을때 끼어들테니. 너희끼리 의견을 맞춰보라는 거야."
4. **Q1·Q2·Q3**: "(a) 기준으로 하되, 의견이 좁혀지지 않는 것을 나에게 묻는 형태로. a와 c 혼합"
5. **M5 토론형 (5)종합**: "5단계는 Edi 단일 호출로 해보자. 에이스 종합결론으로 가면 양립된 의견도 하나로 합칠테니"
6. **M3+M4**: "M3 OK / M4 pd-066 resolved"

## 박제 결정 (decision_ledger.json, lastUpdated 2026-05-07T16:00Z)

- **D-170** (framing): 토픽 운영 유형 enum {structured(default), discussion}. Grade와 직교.
- **D-170-A1** (framing): 4 sub-axis (a/b/c/d) — blind 격리 phase 한정 / 우선순위 phase>operationMode>grade / 격리 강도 default=prepend 차단만 / 수렴 토론 N round 무한 + Nexus 자율 분배 + Master interrupt + 수렴 판정 escalation.
- **D-170-A2** (design): 토론형 (5)종합=Edi 단일 호출. `/ace-synthesis`=structured 한정.
- **D-171** (design): Case B Phase 진입 게이트 강제. spc_lck=Y + PD-066 resolved + amendment 코드 박제 후 P0. warn-only 아님.

## 핵심 통찰

1. **편향=본질, 시간=부수** — Master M1로 frame 본질 확정. 시간 절감은 Case A(PD-065) 별도 trajectory.
2. **Ace 단일 권고와 토론형 frame 충돌 인지** — Master M5 통찰로 토론형 (5)종합=Edi 단일로 분기. 양립 의견 보존.
3. **운영 무결성 강제** — D-171이 PD-066 fallback 아닌 resolved 강제. Phase 진입 게이트 코드 박제 = warn-only 아님.
4. **dead artifact 연쇄 risk** — Riki R-1·R-2·R-3 통합 risk가 frame 자체 견고성 의존. rev4 통합 11건이 frame 신뢰도 결정.

## PD 인계

- **PD-066** (신설, open): Nexus crash 시 pending_turns 영구 손실 방지 복구. Phase 진입 게이트 resolved 강제 조건. fallback=turnPushMode=hook.
- **PD-065** (외부 인계): Case A mtopic_NNN 다중 인스턴스. 직교, 별도 trajectory.

## Gap 박제

| 종류 | 건수 | 비고 |
|---|---|---|
| missing-report (turn 0~5) | 6 | **false positive** — 산출물은 `reports/2026-05-07_topic_176_{role}/` 별도 디렉토리에 박제됨. finalize hook 검색 경로 한정 이슈 |
| frontmatter-patch-failed (turn 6) | 1 | condensed.md write 후 hook 패치 race. 산출물 정상 |
| missing-report (turn 6 zero) | 1 | 동일 false positive |

조치: false positive 명시. finalize hook 보강은 별도 PD 후보(우선순위 낮음).

## 다음 세션 진입점

`/open topic_176` → G-PRE 통과 검증 → P0 진입 → P1 spike A·B 동시 (N=10) → GATE α → P2~P9.

## versionBump

- **+0.01 (capacity)**, v0.958 → v0.968
- 사유: D-170/A1/A2/171 신설 4건 + Arki rev4 plan 박제 + PD-066 신설. structural(+0.1) 불해당(코드 박제 0건).
- confirmedBy: edi
