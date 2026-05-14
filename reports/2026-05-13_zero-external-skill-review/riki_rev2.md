---
role: riki
turnId: 4
phase: experiment-audit
sessionId: session_246
topicId: topic_206
date: 2026-05-13
---

# Riki rev2 — PD-075 실측 1건 3 모드 적대적 감사

Riki입니다. M1/M2/M3 세 보고서와 input 파일(`scripts/lib/topic-status.ts`)을 직접 read하고, 호출처 grep으로 컨텍스트를 확보한 후 적대적 감사를 수행합니다.

**자가검열 선언 (D-185 정합)**: 본 임무 자체가 "적출 압력"을 부여 — 부풀림 위험 인지. 슬롯 미달 정상 원칙(feedback_riki_filter_consolidated) 우선 적용, 확신 없는 항목은 제외합니다.

---

## §1 M1 (Zero 흡수) 감사

### 🟡 R1-1. "강한 cut 권고 0건" 단언은 회피 아닌 정합

**원문 인용** [T4/A2/O5]: M1 §4 — *"강한 cut 권고 0건 ... 본 파일은 이미 잘 정제된 코드"*

**검증**: input 100줄을 직접 read한 결과:
- early return 패턴 정상 (L70·L78·L86) [T4/A4/O5]
- 단일 책임 (SOT + mirror 동시 갱신) [T4/A4/O5]
- 테스트 PASS 사실 확인 — `tests/topic-status-finalize-r6.test.ts` 존재 grep 확인 [T4/A4/O5]

**판정**: M1의 "강한 cut 0건" 단언은 **회피 아닌 정합**. status quo bias 의심은 합리적 자가검열이지만, 실제 코드와 호출처 정합성 확인 결과 cut 대상 부재는 사실. Riki 적출 무리.

### 🟡 R1-2. M2/M3가 적출한 항목 중 M1이 누락한 것의 정당성

| 항목 | M1 처리 | M2/M3 주장 | Riki 판정 |
|---|---|---|---|
| 테스트 부재 (M2 C3-1 High / M3 TD-13 High) | 미언급 | **테스트 없음** 단언 | **M2/M3 fabrication** — `tests/topic-status-finalize-r6.test.ts` 32/32 PASS 실재 [T4/A4/O5]. M1만 호출처 grep으로 사실 확인. |
| `Record<string, unknown>` 약 타입 (M2 C7-1 High / M3 TD-04 Medium) | Cut #3로 적출, 약한 권고 | 인터페이스화 권고 | M1·M2·M3 동일 적출. M1 처리 정당. |
| Atomic write 부재 (M2 C5-2 / M3 TD-03 High) | 미언급 | High severity | **legend-team 컨텍스트 부재 단언** — 본 헬퍼는 `close.md` step 8(세션 종료) 직렬 호출 1회 컨텍스트. atomic write 도입 ROI 미검증. M1 누락은 *컨텍스트 인지에 따른 의도적 제외*로 해석 가능, 단 명시 doc 부재는 약점. |
| 동시성 잠금 부재 (M2 C6-3 / M3 TD-02 High) | 미언급 | High severity | **컨텍스트 부재 단언** — 본 헬퍼 호출은 close.md step 8 1회·tests 1회. 세션 종료 시점에 두 master worktree가 동시에 close 실행하는 시나리오는 일반적이지 않음. 실재 동시성 risk 없음. M1 누락 정당. |
| 트랜잭셔널 롤백 부재 (M3 TD-19 High) | 미언급 | High severity | **legend-team 의도 무지 단언** — 코드 헤더 주석 L5-6에 *"SOT 갱신 실패 시 mirror 갱신 중단 — 부분 갱신으로 인한 표류 방지"* 명시. 즉 best-effort warning 모델이 의도. git이 백업 역할. M3 false positive. |

**판정**: M1 누락 4건 중 1건(약 타입)은 M1도 적출했고, 3건은 **legend-team 컨텍스트상 정당한 제외**. M2/M3의 "테스트 부재" 단언이 가장 강한 적출 사고 — M1만이 호출처 grep으로 fabrication 회피.

### 🟡 R1-3. "status quo bias 가능성" 자가검열은 면죄부 아닌 정직 표기

M1 §4 *"M1 모드 한계 자가검열 (B5 confirmation bias 차단)"* 블록은 결론을 약화시키지 않고 미수행 영역(동적 실행 추적·M2 비교)을 명시. **면죄부 아님** — D-184 자연 분포 원칙 정합.

---

## §2 M2 (Zero 재량 — 외부 skill) 감사

### 🟡 R2-1. "테스트 파일 부재 가능성" 단언이 fabrication

**원문 인용** [T4/A2/O5]: M2 C3-1 — *"테스트 파일 부재 가능성 — `scripts/lib/topic-status.test.ts` 또는 `__tests__/topic-status.spec.ts`의 존재가 본 파일에서 확인되지 않음. ... **High**"*

**반례 grep** [T4/A4/O5]:
- `tests/topic-status-finalize-r6.test.ts` 실재 (M1·M2·M3 모두에서 보고서 자체에 언급되지 않음 — M1만 §1 표 C1에서 인용)
- session_133에서 32/32 PASS [T3/A2/O3]

**파손 범위**: M2가 "가능성"이라는 hedge를 붙였으나 결론은 **High severity 적출**로 출력 → Top 5 권고 #2 "회귀 테스트 슈트 추가, 1일 effort"로 박제. **legend-team 컨벤션 부재 단언이 권고로 결과화**. 채택 시 이미 존재하는 테스트와 중복 작업.

**완화**: M2는 외부 skill 호출 전 *호출처·테스트 파일 grep을 self-exclusion 외 영역에서 의무화*. 또는 "가능성" hedge가 있을 때는 Top 5 진입 차단. Riki R-3(M2가 자기보고한 충돌 1건) 외 본 건이 **추가 false positive 1건**.

### 🟡 R2-2. C6-1 "transactional rollback 부재" — legend-team 의도와 충돌

**원문 인용** [T4/A2/O5]: M2 C6-1 — *"SOT 갱신 성공 후 mirror 갱신 실패 시 SOT를 되돌리지 않음. ... 부분 갱신 방지라는 헤더 주석과 실제 동작 일부 mismatch"*

**검증** [T4/A4/O5]:
- 헤더 주석 L5-6 *"SOT 갱신 실패 시 mirror 갱신 중단"* — 즉 의도는 *"SOT 실패 → mirror skip"*이지 *"mirror 실패 → SOT rollback"*이 아님.
- D-F 정책(CLAUDE.md §Topic Status SOT 정책) — *"SOT는 단일 출처, mirror는 따라가는 복사본"*. mirror 실패는 best-effort warning이 SOT 정합.

**판정**: M2는 본 충돌을 §마무리에서 *"채택 전 M1 흡수본 또는 Arki/Master 컨텍스트 확인 필요"*로 명시 — **Zero 재량 모드의 self-exclusion 작동 사례**. M2 모드의 강점이 발현된 지점.

### 🟡 R2-3. ROI 산정의 일반 SOP 적용 — legend-team에서 무효 가능

**Top 5 #2 "회귀 테스트 슈트 추가, Medium effort 1d"** — 이미 존재(R2-1). Top 5의 1건이 ROI 0 또는 음수.

**Top 5 #3 "Atomic write, Small effort"** — close.md step 8 직렬 호출 컨텍스트에서 *crash 시 invalid JSON* risk는 git이 백업 역할. ROI 실측 없음. SOP 적용은 가능하지만 legend-team에서는 *over-engineering* 영역.

**완화**: M2 ROI 산정은 일반 SOP 기반이므로 legend-team 컨텍스트 가중치 (예: 호출 빈도·동시성·백업 메커니즘) 별도 적용 필요. **무비판 채택 금지**.

### 🟢 R2-4. M2의 "self-flagging" 메커니즘은 작동 (긍정 발견)

M2 §마무리 — *"본 audit은 일반화된 SOP 적용 결과이며, legend-team 특수 컨텍스트를 1차 기준으로 삼지 않았습니다. ... 일부는 legend-team 의도와 충돌 가능"* 명시.

**판정**: M2의 self-flagging은 D2(도구 description 거짓 전제) 정합. Master가 무비판 채택만 피하면 모드 자체는 안전. R2-1·R2-2·R2-3은 **자기 인식한 한계의 구체 사례**로 박제 가치 있음.

---

## §3 M3 (외부 skill 단독) 감사

### 🔴 R3-1. fabrication 4건 (High severity 박제)

**TD-13 "No unit tests referenced or co-located"** [T4/A4/O5 반례]: `tests/topic-status-finalize-r6.test.ts` 실재. **M3 fabrication**. (M2 R2-1과 동일 사고이나 M3는 self-flagging 없음 → 더 위험)

**TD-19 "No backup/rollback of SOT before write — write failure mid-stream loses prior content, High"** [T2/A1/O1 반례]: git이 워크트리 백업 메커니즘. 본 헬퍼 호출 직후 hook chain `auto-push.js`(D-008)가 매 세션 끝에 push. **legend-team 의도 무지 단언**.

**TD-02 "No file locking — concurrent invocations can corrupt JSON, High"** [T3/A1/O5 반례]: 호출처 grep 결과 close.md step 8 + tests 2곳, 세션 종료 시점 직렬 호출 1회. concurrent 컨텍스트 없음. **컨텍스트 부재 단언**.

**TD-03 "Non-atomic write, High"** — atomic write 자체는 일반 best practice지만 git 백업·직렬 호출 컨텍스트에서 High severity는 과대평가. Medium 이하가 적정.

**파손 범위**: M3 High 4건 중 **3건이 fabrication 또는 컨텍스트 무지**, 1건이 과대평가. "High-severity items: 4" 메트릭 단언 자체가 신뢰성 없음.

### 🔴 R3-2. Schedule-on-Demand (D-017) 정면 위반

**원문 인용** [T4/A2/O5]:
- M3 §6 *"Estimated remediation effort: ~4.5 person-days"*
- §5 *"Phase 1 — Stabilize (Week 1, ~1.5 days)"·"Phase 2 — Harden I/O (Week 2, ~2 days)"·"Phase 3 — Modernize (Week 3, ~1 day)"*
- §4 *"Estimated effort: 0.5 day"·"2 hours"·"3 hours"*

**검증** [T4/A4/O5]: D-017 (CLAUDE.md §Schedule-on-Demand) — *"일정·공수·담당 추정은 Master가 명시적으로 요청한 경우에만 수행 ... 요청 없는 자동 일정 생성 금지"*. Arki 실행계획 오염 금지어 v0: `D+N일·N주차·N시간·N일 소요·공수`.

**파손 범위**:
- M3 출력 = `Week 1·Week 2·Week 3` (절대 시간 위계) + `person-days·hours` (공수 단위) + `Phase 1/2/3 (Stabilize/Harden/Modernize)` (단계 라벨링까지 일정화)
- M3 모드를 hook 자동 발동(M3 정의 = "Zero dispatch 시 외부 skill 강제 병발")으로 운영 시 → **매 Zero 호출마다 일정 추정이 legend-team artifact에 주입**
- D-017 박제 정책 정면 충돌. legend-team 시스템 정합성 손상.

**완화 조건**: M3 채택 시 hook 단에서 일정 표현 sanitization 필수 (금지어 v0 grep 후 제거). 또는 M3 모드 자체를 *legend-team 영역에는 부적합*으로 판정.

### 🟡 R3-3. 메트릭 단언의 fabrication 의심

**원문 인용** [T4/A2/O5]: M3 §6 — *"Debt density: 200 issues / KLOC"·"Cyclomatic complexity: 5 for updateTopicStatus"·"Type coverage: ~60%"·"Test coverage: 0%"*

**검증**:
- "Debt density 200/KLOC" — 100줄 1파일에서 20건 적출 → 자체 산정 결과. 단위 분모(KLOC)는 분모 부풀림 표기. **수치 정합성 자체는 산수상 정합**, 그러나 본 메트릭이 *대표성*을 가질 수 없는 표본 크기(1 파일 100줄).
- "Cyclomatic complexity 5" — 코드 정독 결과 try/catch 2개 + if 분기 2개 + early return 3회. 정확한 산정 도구(예: eslint-plugin-complexity) 미사용 추정. **fabrication까지는 아니나 도구 미사용 단언**.
- "Type coverage ~60%" — TypeScript compiler `--strict`·`type-coverage` 도구 결과 인용 부재. **fabrication 의심** [T1/A1/O1].
- "Test coverage 0%" — **fabrication** (R3-1 동일).

**판정**: 4 메트릭 중 1건 정합·1건 추정·2건 fabrication. M3 §6 메트릭 표 전체 신뢰성 ≤ 50%.

### 🔴 R3-4. legend-team 의도 무지의 시스템적 비용

M3는 *외부 skill 단독*이므로 다음 legend-team SOT 정책을 모름:
- D-F (SOT-mirror 정책 — mirror 실패는 best-effort)
- D-017 (Schedule-on-Demand)
- D-148/auto-push.js (git 백업 메커니즘)
- close.md step 8 호출 컨텍스트 (세션 종료 직렬 1회)

**파손 범위**: M3 결과를 *그대로 채택*하면 위 4 정책에 정합 검증 없이 변경이 주입됨. Master 또는 Arki cross-check 없으면 **legend-team 시스템 박제 정책 훼손**.

**완화**: M3 모드 자체는 *unfiltered raw output 생성기*로만 사용. Zero/Arki/Master 필터링 후 채택 필수. hook 자동 병발(M3 정의) 시 sanitization layer 강제. 또는 M3 모드 폐기.

---

## §4 메타 감사 — PD-075 본질 비교 가능성

### 🟡 R4-1. 3 모드 출력 형식 비호환 — 직접 비교 불가

| 축 | M1 | M2 | M3 |
|---|---|---|---|
| 적출 건수 | 5 (Cut) + 2 (Refine) = 7 | 18 | 20 |
| 형식 | 종류별 + 강도 P3 | 7 카테고리 × Severity × ROI × Priority | 6 카테고리 + Severity × Effort 매트릭스 + Phase 로드맵 |
| legend-team 컨텍스트 인용 | D-F·D-B·close.md G2·호출처 grep | 부분 (마무리에서 self-flag) | 없음 |
| Schedule 표현 | 없음 | 일부 (Effort: 1d/2h 등) | 광범위 (Phase 1/2/3·Week·person-days) |
| 호출처 인지 | ✓ (C1~C5 5종 grep) | ✗ | ✗ |

**판정**: "Master가 같은 메트릭으로 3 모드 비교" 시도는 **본질적으로 불가능**. 다른 렌즈의 *형식이 다른* 사진. 본 실측 1건의 결론 도출은 *비교*가 아니라 *각 모드의 특성 관찰*로 frame 재정의 필요.

### 🟡 R4-2. Nexus의 "다른 렌즈의 사진" 단언은 중립화 회피 아님

본 토픽 dispatch context 자체에 Nexus가 "다른 렌즈의 사진" 단언을 박제했다고 명시되어 있으나, 실제 dispatch 프롬프트의 §메타 축에서 *Riki가 그 단언을 감사 대상으로 명시*. 즉 Nexus는 자기 단언을 적대적 감사에 노출 — D-185 정합. 회피 아닌 정직.

**단, Master가 결정해야 할 본질**: "어느 렌즈가 legend-team 시스템에 적합한가." Riki 판단:
- M1: legend-team-native 렌즈 (호출처·정책 인지)
- M2: 일반 SOP + self-flagging (Zero 재량으로 보완 가능)
- M3: 일반 SOP raw output (legend-team 정합 sanitization 없음)

### 🔴 R4-3. 본 실측 1건의 9 매트릭스 일반화 불가

**dispatch 메타 축 인용**: *"본 실측 1건이 9 매트릭스 전체에 일반화 가능한가: tech-debt 영역 1 케이스로 simplify·security-review 영역까지 추론 가능?"*

**판정**: **불가능**.
- 본 실측은 tech-debt 영역 1 파일 100줄. Arki rev2의 9 매트릭스 중 **1칸 (tech-debt × M1·M2·M3 3 칸)만 부분 측정**.
- simplify 영역 (Arki: M1 ≥ M2 > M3) 미측정.
- security-review 영역 (Arki: M2 > M3 > M1, 가장 강한 모드 전환 근거) **미측정**.
- security-review에서 M2 우위 가설이 본 토픽의 *실제 결정 분기점*이지만, 본 실측은 그 영역을 건드리지 않음.

**파손 범위**: 본 실측 결과로 영역별 차등 매핑 (`{tech-debt: M1·M2 동률, security-review: M2, simplify: M1}`)을 확정하면 **6/9 칸이 가설 그대로** — 결정 근거 ≤ 33%. Master 결정 박제 시 confidence 명시 필수.

### 🟡 R4-4. 본 실측의 정당한 결론 범위

본 실측이 도달 가능한 결론:
1. **M1은 legend-team 컨텍스트 인지 우위가 실증됨** (호출처 grep·D-F 정책 인용) — Arki rev2 가설 일부 확인
2. **M3은 legend-team 정합 sanitization 없이는 위험** (D-017 위반·fabrication 4건·정책 무지) — Arki rev2 가설 강화
3. **M2는 self-flagging 메커니즘이 작동하나 false positive 발생** — Arki rev2 가설 부분 확인 (Zero 재량 = M1 보완 + 일반 SOP 외부 풀)
4. **tech-debt 영역 M1·M2 동률 가설 → 본 실측 결과 M1 우위로 약간 기움** (R2-1·R2-3 false positive 누적)

본 실측이 도달 **불가**한 결론:
- security-review 영역 영역 모드 선택
- simplify 영역 모드 선택
- 9 매트릭스 다른 8칸

---

## §5 권고 (3 모드 우열·영역별 채택안 영향)

### 5.1 본 실측 1건 직접 결론

| 영역 | Arki rev2 가설 | 본 실측 결과 영향 |
|---|---|---|
| tech-debt | M1·M2 동률 (격차 작음) | **M1 약간 우위** 쪽으로 기움 (M2 false positive 1건·일반 SOP ROI 무효 1건 적출). 동률 가설 → M1 잠정 우위 |
| security-review | M2 > M3 > M1 (모드 전환 가장 강한 근거) | **미측정** — 본 실측 무관 |
| simplify | M1 ≥ M2 > M3 | **미측정** — 본 실측 무관 |

### 5.2 모드별 우열 (본 실측 한정)

| 모드 | 본 실측 결과 |
|---|---|
| **M1** | legend-team 컨텍스트 인지 + 호출처 grep + 정책 인용. fabrication 0건. 정당한 적출. **우위** |
| **M2** | 표면 풀 넓음 (18건 vs M1 7건). false positive 1건(R2-1) + ROI 무효 1건(R2-3) + self-flagging 작동(R2-4). **보조 도구로 가치 있음**, 단독 채택 비권고 |
| **M3** | fabrication 3건(High) + D-017 위반(Phase·Week·person-days) + 정책 무지 4건. **단독 채택 시 시스템 박제 정책 훼손 위험** |

### 5.3 Arki rev2 권고 매핑에 미치는 영향

Arki rev2 권고: `{tech-debt: M1, security-review: M2, simplify: M1}` [T2/A1/O3]

**Riki 영향 평가**:
- tech-debt M1: **유지** — 본 실측이 약하게 지지
- security-review M2: **본 실측 무관, Arki 가설 유지 가능** — 단, *실측 없이 박제 금지*. Master가 별도 실측 (예: dispatch_config.json 또는 다른 코드 파일 security-review 영역) 1건 추가 권고
- simplify M1: **본 실측 무관, Arki 가설 유지** — security-review와 동일하게 미실측이나 격차 작은 가설이므로 status quo 유지 안전

**추가 권고**: M3 모드를 채택할 경우 hook 단에서 **D-017 sanitization layer** 필수 (절대 시간·공수·Phase 라벨 grep 후 제거). 없으면 M3 모드 폐기 권고.

### 5.4 PD-075 본문 frame 재확인

Jobs rev1 §7 (Saying No)에서 명시한 *"본 토픽 결과물 = 영역별 (영역, 운용모드) 매핑 3 tuple"* frame 정합. 본 실측 1건은 1/3 영역만 부분 측정 — frame을 *전체 결정*이 아니라 *영역별 점진 결정*으로 좁히는 것이 정합 (security·simplify는 미결, 별도 측정 후 결정).

### 5.5 Master 결정에 미치는 영향 — 결정 분기

1. **M3 모드 채택 여부** — 본 실측에서 위험 실증 (R3-1·R3-2). **비권고** [T3/A1/O5]
2. **tech-debt 영역 M2 채택 여부** — 본 실측에서 M2 보조 가치 실증. 단독 채택 비권고. **M1 유지 + 특정 케이스에서 M2 cherry-pick** 권고
3. **security-review·simplify 영역 결정** — **본 실측만으로 결정 불가, 보류 + 추가 실측 토픽 분기 권고**

---

## §6 Nexus 발화 감사 (D-183/D-184)

본 세션 dispatch context 외 Nexus 본체 발화는 다음을 포함합니다.
- dispatch 프롬프트 §메타 축 *"다른 렌즈의 사진"* 단언 (R4-2)
- 실측 case 선택 *"후보 1 (topic-status.ts)"* (Arki 추천 채택)

**위반 cross-review**:
- V1 (미부착): dispatch 프롬프트 내 *"다른 렌즈의 사진"* 단언은 [Tn/An/On] 미부착. **위반 1건**.
- V2 (인플레이션): 발견 없음.
- V3 (권한외): 발견 없음.
- V4 (무인용 cross-review): 발견 없음.

**현 세션 누적 baseline**: V1=1 / V2=0 / V3=0 / V4=0 total **1**. session_235 baseline(V1=5)보다 낮음. (단, dispatch 프롬프트만 채집한 부분 측정 — finalize hook의 자동 감사가 본격 cross-review 수행 시 갱신.)

---

## §7 자기측정

```
[ROLE:riki]
# self-scores
crt_rcl: 0.75
cr_val: Y
prd_rej: Y
fp_rt: 0.00
```

- `crt_rcl 0.75`: critical 표기 🔴 3건 (R3-1·R3-2·R4-3). M3 fabrication·D-017 위반·일반화 불가는 Arki rev2 자가감사·M1·M2 모두 사전 식별 못한 영역. 단, M3 fabrication 일부는 M3 자기보고도 부분 인정 가능성 → 0.75 추정.
- `cr_val Y`: R3-2 (D-017 위반)·R3-4 (정책 무지)에 완화 조건(sanitization layer) + fallback (M3 폐기) 병기. feedback_arki_risk_requires_mitigation 정합.
- `prd_rej Y`: M3 단독 채택 기각 선언 + tech-debt M2 단독 채택 기각 선언. 사후 Master/Ace 동의 가능성 높음 (R3-2가 D-017 정면 위반 실증).
- `fp_rt 0.00`: 본 적출 7건(R1-1·R1-2·R1-3·R2-1·R2-2·R2-3·R2-4·R3-1~R3-4·R4-1~R4-4) 중 critical 표기 🔴 3건은 모두 grep·원문 인용 근거 확보. false positive 추정 0건.

**자가검열 (D-184 자연 분포 원칙)**: 본 자가측정은 *상위 슬롯 채우기* 압력에 노출됨. crt_rcl 0.75는 *내가 식별한 critical = 사후 실증된 critical / 전체 critical*의 비율 추정인데, "전체 critical"의 분모를 본인이 정의함 → 상향 편향 가능. Master/Ace cross-review 시 0.5 미만 정정 가능성 열어둠.

---

RIKI_WRITE_DONE: reports/2026-05-13_zero-external-skill-review/riki_rev2.md
