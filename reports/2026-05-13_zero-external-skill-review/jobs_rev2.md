---
role: jobs
turnId: 6
phase: synthesis-review
sessionId: session_246
topicId: topic_206
date: 2026-05-13
purpose: ace-recommendation-cross-check
---

# Jobs rev2 — Ace 단일 권고 framing 정합 검증

Jobs입니다. Master 질문("잡스도 동일하게 생각해?")에 framing 관점에서 답합니다. 본 turn 2 framing(jobs_rev1)을 SOT로 두고 Ace 권고를 7개 축에서 cross-check합니다.

**Master 질문 직답**: **부분 동의 (partial agree)**. 핵심 권고 방향(M1 default·M3 폐기·security-review M2 cherry-pick 보류)은 본 framing과 정합하나, **K1 검증 가능성 병목**에 대한 처리가 framing보다 약하게 우회됐습니다. 권고 채택은 가능하지만 sec-review M2 활성 조건 1줄 보강 필요 [T3/A1/O3].

---

## §1 9 매트릭스 정합 검증

본 framing은 *"3 영역 × 3 모드 9 매트릭스에 K1 메트릭을 채우고 영역별 최적 모드 1개씩 도출"*이 단일 액션이었습니다 (jobs_rev1 §7).

**Ace 권고의 9 칸 처리** [T4/A4/O5, ace_synthesis §5]:

| 칸 | 처리 | framing 정합 |
|---|---|---|
| tech-debt × M1·M2·M3 (3 칸) | **실측 확정** — M1 우위·M2 보조·M3 비권고 | 정합 (Arki rev2 가설 + Riki rev2 실증) |
| security-review × M1·M2·M3 (3 칸) | **미실측 — 가설 잔존** + M2 cherry-pick 후속 PD 권고 | **부분 정합** — framing은 "영역별 최적 1개" 도출 목표였으나 Ace는 *결정 보류 + 후속 PD*로 회피. K1 부재로 정당화 가능하나 framing 단일 액션과는 거리 |
| simplify × M1·M2·M3 (3 칸) | **미실측 — 가설 잔존** + M1 status quo 유지 | 정합 (격차 작음 + ROI 낮음 사유 명시) |

**판정 [T3/A2/O3]**: 9 칸 중 **3 칸 확정·6 칸 보류**. 본 framing의 "핵심 질문"(영역별 차등 정당성)에 대해 Ace는 **"부분 차등 정당화 + 잔여는 실측 후 점진"**으로 답함. 이는 jobs_rev1 §9 Ace 임무 줄("K1 검증 가능성 부재 시 결정 보류 + 베이스라인 수집 토픽 분기 권고 옵션 보존")과 정확히 정합. **framing이 미리 허용한 분기**.

→ **9 매트릭스 결정력 33%는 framing이 사전 허용한 범위 내**.

---

## §2 K1·K4·K6 미검증 전제 처리 검증

framing은 K1(메트릭 존재)·K4(외부 skill 패턴 풀 지속 진화)·K6(영역별 분포 동일)을 🔴/🟡로 표기하며 "결정력 병목"으로 명시했습니다.

| 전제 | framing 표기 | Ace 처리 | 판정 |
|---|---|---|---|
| **K1** (메트릭 비교 가능성) | 🟡 부분 검증 가능 | Arki rev2의 K1 메트릭 5종 정의 → Riki R4-1 *"출력 형식 비호환 → 직접 비교 불가"* 적출 → Ace §4.2가 "frame 재정의(특성 관찰)"로 우회 | **🟡 우회 처리** — Ace가 K1 깨짐을 정직 인정하나 "특성 관찰"로 frame 재정의. framing 관점에서 "K1이 깨지면 결정은 비용 기준"이라 명시했는데 Ace는 *비용 기준 + 정성 관찰 혼합*. **약점**: K1 부재 → "특성 관찰" 정당화가 D-185 self-deception 잠재 |
| **K4** (외부 skill 지속 진화) | 🔴 추측 [T1] | Ace §2.2 "stale 누적 위험 (실측은 미수행)" 명시 + §2.3 Keynesian 불확실성으로 격상 | **🟢 정합 처리** — 추측을 추측으로 유지, 박제 권고 회피. framing K4 처리 정합 |
| **K6** (영역별 분포 동일) | 🔴 추측 [T1] | Ace 권고 자체가 영역별 차등(M1 default + sec-review 별도) — K6를 *명시적으로 깨고* 들어감 | **🟢 정합 처리** — K6 부정이 framing 의도와 일치 |

**판정 [T2/A1/O3]**: K4·K6은 정합. **K1 처리만 약간 모호** — Ace가 "frame 재정의(특성 관찰)"라는 용어로 K1 부재를 우회. framing 엄밀성 관점에서는 *"K1 미충족 → 정성 판단"*임을 더 명시적으로 박제해야 D-185 정합. jobs_rev2 권고: D-NNN 박제문에 *"본 결정 근거 = 1 영역 실측 + 2 영역 정성 추론. 실측 후 amendment 가능"* 1줄 추가.

---

## §3 편향 6건 + 신규 편향 침투 점검

framing B1~B5 각각 Ace 권고에 침투했는지 zero-base 검증:

### B1 (Status quo bias) — M1 default 유지 권고

**침투 여부**: 🟡 **부분 침투 가능성** — Ace 권고 = "M1 default 유지". 외형은 status quo. 단 정당화 경로 검증:
- 정당화 1: Riki rev2가 M1 fabrication 0건 실증 [T4/A4/O5] (실측 근거)
- 정당화 2: D2 원칙 인용 (정책 근거)
- 정당화 3: 시간축 비대칭 손실 (Keynesian, ace §2.3)

**판정**: 3 정당화 모두 실측·정책·구조 근거 → status quo bias가 아니라 *실측 결과 status quo 우위*. **편향 차단 성공** [T3/A2/O3]. 단 Ace가 status quo bias 가능성을 자기 검열에서 명시하지 않은 점은 약점 — §4.4에 *"M1 우위는 1 영역 실측에 한정"*만 적혔고 status quo bias 자기검열 키워드는 부재.

### B2 (Sunk cost / Anchoring) — D-127 흡수 결정 누적

**침투 여부**: 🟢 **차단** — Ace 권고가 D-127 본문 *amendment* 명시 (§6 A) → "이미 박제했으므로 유지" 회피 패턴 없음. amendment 사유에 "본 종합검토 결정(3 모드 평가 결과)" 명시 → sunk cost 보호 아니라 *실측 후 재정당화*. 정합.

### B3 (Availability heuristic) — "M1만 fabrication 0건 → 그래서 우수" 비약

**침투 여부**: 🟡 **부분 침투 위험** — Ace §5 "M1의 legend-team 컨텍스트 인지는 모드 우위 (호출처 grep·정책 인용)" 단언이 *1 영역 1 케이스 실측*에서 도출됨. availability 비약 위험 표면.

**완화 검증**: Ace §4.4·§5 "본 결정은 1 영역 실측에 한정, 나머지 6 칸 가설 잔존" 자기 검열 명시 → availability 비약을 *영역 무관 결론*과 *영역별 결론*으로 분리해 통제. **차단 성공**, 단 분리가 표 깊이 묻혀 있어 Master 가독성 낮음.

### B4 (False dichotomy) — 3 모드 단일 채택 vs 영역별 조합

**침투 여부**: 🟢 **차단** — Ace 권고 자체가 "M1 default + security-review만 M2 cherry-pick + M3 폐기"라는 *영역별 조합* 구조. framing이 의도한 *3 모드 단일 채택 거부* 정확히 보존.

### B5 (Confirmation bias — Zero 자기평가 위험)

**침투 여부**: 🟡 **부분 침투** — Ace가 M1·M2·M3 3 보고서를 모두 채택했는데, M1·M2 보고서는 Zero 자신의 자기보고. Riki rev2가 외부 검증으로 cross-check해 차단은 됐으나, Ace §4.3 *"M3 단독 비권고: 3 보고서 모두 동의 가능"* 합치 단언 중 M1·M2 자기보고는 self-favoring 잔재. **Riki rev2 외부 검증이 안전망 작동**, 단 권고 박제 시 *"M1·M2 자기 보고분은 self-favoring 검열 적용했음"* 1줄 명시 필요.

### 신규 편향 후보 (framing이 빠뜨린 것)

- **Recency bias / session_235 trauma 편향**: Ace §2.2 *"session PD-80 fabrication 사고(D-185 강화 직접 원인) 재발 경로"*가 M3 폐기 핵심 사유. 최근 사고 1건이 영역 무관 결론을 정당화. **차단 보강**: D-017 위반은 정책 근거 (recency 무관)이므로 결론 자체는 안전, 단 M3 채택 시기는 trauma 보정 가능.
- **Compromise bias (절충안 추구)**: Ace 권고 = "M1 default + sec-review만 M2"는 *절충*. status quo와 변경 사이 중간. Riki R4-2 *"권고 자체가 trade-off 절충안"*과 정합. **위험은 낮음** — 절충이 framing K6(영역별 차등) 의도와 일치하므로 의도된 절충.

**§3 총평 [T3/A2/O3]**: 6 편향 중 B2·B4 완전 차단, B1·B3·B5 부분 침투 위험 있으나 안전망 작동. 권고 박제 시 §2 K1 우회 1줄 + B5 자기보고 자기검열 1줄 보강 권고.

---

## §4 Saying No 위반 여부

framing OUT 6항을 Ace가 우회 사용했는지 검증:

| OUT 항목 | Ace 처리 | 위반 여부 |
|---|---|---|
| ① 외부 skill 절대 품질 측정 | sec-review 후속 PD로 분리 권고 (§6 E) | 🟢 정합 |
| ② Zero 외 페르소나 외부 skill 정책 | 본 권고 범위 명시 외 (§6 "Saying No 회피") | 🟢 정합 |
| ③ 외부 skill description changelog watch | M3 폐기 사유로만 인용, 별도 PD-NNN-3 (선택) | 🟢 정합 |
| ④ engineering:code-review 등 인접 skill 채택 | sec-review M2 cherry-pick 활성화는 후속 PD로 보류 | 🟢 정합 |
| ⑤ Zero on-demand 호출 트리거 변경 | dispatch_config rules.zero 신규 필드만, 호출 트리거 자체 미변경 | 🟢 정합 |
| ⑥ D-127 amendment vs 신규 D-NNN 형식 | Ace는 D-127 amendment + D-NNN 둘 다 권고 — Edi 박제 영역 침범? | 🟡 **부분 위반** — framing은 "Edi 영역"으로 OUT 표기. Ace가 §6에서 amendment + D-NNN 둘 다 권고하며 박제 형식까지 들어감 |

**판정 [T2/A2/O3]**: 6 항 중 5 항 정합, ⑥만 부분 위반. 단 위반 정도는 약함 — Ace 권고가 *형식 강제*는 아니고 *후보 제시*. Master/Edi가 형식 선택 가능. **수용 가능**.

---

## §5 executionPlanMode `conditional` 정합

framing은 *"결정 분기 시점에 plan 모드 재호출"* (jobs_rev1 §8).

**Ace 처리 검증** [T4/A4/O5]: Ace §6 "구체 액션" A·B·C·D·E 5건 = 결정 분기 *후* 실행 단계. 단 구조:
- A·B·C·D는 Edi 박제 (실행 plan 아님 — 메타 자산 갱신)
- E는 후속 PD 분기 (Master 결정 영역)
- 본격 plan(Phase 분해·검증 게이트·롤백)은 sec-review M2 활성화 시점에 **PD-NNN-1 별도 토픽**으로 분리

**판정 [T3/A2/O3]**: framing conditional 정합. **현 토픽에서 plan 모드 활성화 안 함**이 정답 — 본 결정 = 박제 갱신만, 본격 실행 plan은 후속 PD 활성화 시점에 별도 토픽. Ace 처리 정합.

---

## §6 본질 질문 답변 충실성

Master 원문 (PD-075 정정): *"내재화된 zero가 스킬보다 품질이 우수한가? 3 모드 간 품질 차이가 발생하지 않는가?"*

framing이 이를 받아 *"외부 skill의 품질 우위가 영역별로 다른가?"*로 좁힘 (jobs_rev1 §3).

**Ace 직답 검증** [T3/A2/O3]:

| Master 부분 질문 | Ace 답 | 충실성 |
|---|---|---|
| "내재화 zero가 우수한가?" | "tech-debt 1 영역 실측 결과 우수 (legend-team 컨텍스트 인지). 다른 영역은 가설" | 🟢 정직 답 |
| "3 모드 간 품질 차이 발생?" | "tech-debt에서 발생 (M1 fabrication 0 vs M3 fabrication 3). 다른 영역 미실측" | 🟢 정직 답 |
| "어느 모드를 채택?" | "M1 default + sec-review M2 보류 + M3 폐기" | 🟢 단일 권고 |

**framing 좁힘 정합**: Ace는 framing의 "영역별 차등" 본질을 정확히 받음 — 단일 모드 채택 회피, 영역별 차등 권고.

**한 가지 부족점**: Master 원문 *"품질 차이가 발생하지 않는가?"*에 대해 Ace는 *"tech-debt에서 발생"*까지는 답했으나 *"발생하지 않는 영역도 있을 수 있다"*(security-review M1 단독 충분 가능성)는 명시 회피. 본 framing K6 (영역별 분포 동일) 부정의 *대칭 방향* — 모든 영역에서 차이 없을 수도 있음 — 은 본 권고에서 빠짐. 단 ROI 미검증이라 박제 가치 낮음.

---

## §7 단일 판정

### 판정: **(b) 일부 수정 채택**

**동의 항목 [T3/A2/O5]**:
1. **M1 default 유지** — Riki rev2 실측 근거 정합. status quo bias 차단 검증 통과.
2. **M3 현시점 폐기** — D-017 위반·fabrication 4건 실증. 영역 무관 결론 정당.
3. **영역별 차등 구조** — framing B4 false dichotomy 차단 정합.
4. **D-127 amendment + 신규 D-NNN 박제** — sunk cost 차단·재정당화.
5. **conditional → 후속 PD 분기** — framing executionPlanMode 정합.

**수정 요구 항목 [T2/A1/O3]**:

**M-1 (보강)** — D-NNN 박제문에 K1 우회 1줄 추가:
> *"본 결정 근거 = tech-debt 1 영역 실측 (M1 fabrication 0·M2 false positive 1·M3 fabrication 3) + 2 영역 정성 추론 (정책·구조). K1(품질 메트릭 비교 가능성) 미충족 영역은 실측 후 amendment 가능."*

사유: Ace §4.4·§5에 분리됐으나 D-NNN 본문에는 미포함. framing K1 처리 정직성 박제 필요.

**M-2 (보강)** — D-NNN 박제문 또는 dispatch_config 신규 필드 주석에 1줄:
> *"M1·M2 자기보고는 Riki 외부 검증으로 cross-check 완료. Zero 자기평가 단독 신뢰 금지 (B5 confirmation 차단)."*

사유: framing B5 안전망 명시. 향후 sec-review M2 활성화 PD에서 같은 보호 메커니즘 박제 보장.

**M-3 (확인 요청)** — Ace 권고 §6 "Master 결정 필요 항목 3건"에 대해 Master가 (1) 단일 권고 수용 여부, (2) PD-NNN-1 sec-review 실측 등록 여부, (3) PD-NNN-3 M3 sanitization 보류 채택 여부 3건 모두 명시 확인 필요.

framing 관점에서 (1) 수용·(2) 즉시 등록·(3) 보류 채택을 권장하나 결정 권한은 Master.

### 반대 항목

**없음** — framing 본질과 충돌하는 권고 부분 0건.

### 결론 1줄

Ace 권고는 framing 본질을 80% 정확히 받았고, M-1·M-2 1줄 보강 후 채택 가능. **"잡스도 동일?" 직답: 방향은 동일, K1 우회 정직성·B5 안전망 명시 2점만 보강 요청** [T3/A2/O3].

---

## Self-Score

```
[ROLE:jobs]
# self-scores
focus_sharp: 4
bloat_idx: 2
bias_cnt: 6
no_cnt: 5
```

- `focus_sharp 4`: 단일 판정(b 일부 수정) 명시 + 수정 요구 2건 분리. 5점 미부여 사유 — 본 임무는 검증이라 framing 원본보다 saying no 압축률 낮음.
- `bloat_idx 2`: M-1·M-2 보강 요구 = 안전장치 2건. 정직한 conditional 박제 의도.
- `bias_cnt 6`: B1~B5 5건 + 신규 후보 2건(recency·compromise) — 7건이나 5+ capping. 단 capping 한계로 6 기록.
- `no_cnt 5`: framing 단계 OUT 6항 모두 cross-check + 1건 부분 위반 적출. 5+ capping.

JOBS_WRITE_DONE: reports/2026-05-13_zero-external-skill-review/jobs_rev2.md
