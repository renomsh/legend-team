---
role: ace
turnId: 5
phase: synthesis
sessionId: session_246
topicId: topic_206
date: 2026-05-13
skill: ace-synthesis
invocationMode: subagent
---

# Ace 종합검토 — PD-075 Zero 운용 모드 (M1/M2/M3) 결정

Ace입니다. 7개 보고서를 모두 직접 읽고 종합 판단드립니다. Master가 정정한 본질("내재화된 Zero가 외부 skill보다 품질이 우수한가? 3 모드 간 품질 차이가 발생하지 않는가?")에 단일 권고로 답하겠습니다.

## §1 구조 시각 판정 (Structure · Porter) — 정태적 경계·의존

### 1.1 SOT·의존 구조

| 자산 | 현행 SOT | 의존 |
|---|---|---|
| Zero 정체성·도구 | `memory/roles/personas/role-zero.md` | D-127·D-146·D-119 supersede 체인 |
| Zero 운용 정책 | `memory/roles/policies/role-zero.md` | dispatch_config rules.zero |
| 흡수 결정 박제 | D-127 본문 "**물리 파일 부재 확인**" 명분 포함 [T4/A4/O5] | (Riki rev1 A1) |
| 외부 skill 3종 | Anthropic 측 description (legend-team SOT 외) | D2 (거짓 전제) 적용 의무 |
| legend-team 정책 정합 | D-017 (Schedule-on-Demand)·D-F (SOT-mirror)·D-146 (self-exclusion) | M3 자동 시 sanitization 필요 |

**핵심 비대칭** [T4/A4/O5]: Zero 흡수본은 SOT가 **legend-team 내부**, 외부 skill은 SOT가 **외부**. D2(거짓 전제) 원칙상 외부 SOT는 행위 검증 없이 신뢰 0. 따라서 외부 skill을 시스템 박제 경로(persona→hook→artifact)에 직결시키는 모든 구조는 D2와 정면 충돌합니다.

### 1.2 3 모드 구조 비교

| 축 | M1 (흡수) | M2 (Zero 재량) | M3 (Hook 자동) |
|---|---|---|---|
| **SOT 통제** | 단일 (Zero spec) | 이중 (Zero spec + 외부 skill description) | 이중 + hook 강제 결합 |
| **D2 신뢰 경계** | 자체통제 — false claim 표면 0 | 부분노출 — Zero가 self-flag 가능 | 전면노출 — 자동 병합 시 무여과 주입 |
| **legend-team 정책 정합 게이트** | spec에 내재 | Zero 호출 시점 판단 | hook 단 sanitization layer 필수 |
| **결정 권한 위치** | persona spec | Zero 자율 (Master 검토 의무 추가) | hook 강제 (관찰 가능, 변경 비용 큼) |
| **변경 비용** | 0 (현행) | 작음 (rules.zero 확장) | 큼 (hook 신설·sanitization 코드·테스트) |

**구조 판정**: M3은 **legend-team 정합 sanitization layer를 hook 단에 박제**하지 않는 한 D2·D-017·D-146 정면 위반 위험. M2는 Zero 재량 게이트가 이미 D2 정합 (self-flagging 메커니즘 실증, Riki R2-4). M1은 D2 표면적 0 — 안전.

**구조적 trade-off (양립 불가 한 줄)**: 외부 skill의 *일반화된 패턴 풀 확장*을 얻으려면 *legend-team SOT 통제 표면*을 일부 포기해야 합니다. 어디까지 포기할지는 영역별 다릅니다. [T3/A2/O3]

---

## §2 흐름 시각 판정 (System · Keynes) — 동태적·시간축

### 2.1 정제 흐름 (input → 모드 → 출력 → 박제)

```
[input 파일/세션 상태] → [Zero dispatch]
                        ↓
        ┌───────────────┼───────────────┐
        ↓ M1            ↓ M2            ↓ M3
    내부 도구        Zero 재량        Hook 자동
    (호출처 grep,    (case-by-case,   (description
     정책 인용)       self-flag)       무여과 주입)
        ↓               ↓               ↓
    [정제 결과]      [정제 결과+flag] [raw output]
        ↓               ↓               ↓
    Edi 박제 → decision_ledger / topic artifact
```

### 2.2 시간축 위험·이득 (1년 운영 관점)

| 시간축 사건 | M1 | M2 | M3 |
|---|---|---|---|
| 외부 skill 패턴 풀 진화 (분기당 신규 시그니처 inbound) | stale 누적 위험 (실측은 미수행) | Zero가 cherry-pick 가능 | 자동 흡수 — 단 fabrication도 자동 흡수 |
| Zero 호출 빈도 증가 (세션당 N회) | 토큰 비용 일정 | 외부 호출 round-trip × N | hook 강제 + sanitization 비용 × N |
| legend-team 정책 변경 (D-NNN 신규) | spec 정정으로 즉시 반영 | Zero 판단으로 즉시 반영 | hook sanitization 갱신 지연 위험 |
| 외부 skill description 변경 (false claim 가능) | 영향 없음 | Zero가 행위 검증 가능 | 무여과 주입 — D2 위반 누적 |
| fabrication 사고 1건 발생 (Riki R3-1: 테스트 부재 단언) | M1에서는 호출처 grep으로 사전 차단 [T4/A4/O5] | self-flag로 부분 차단 가능 | 무여과 박제 위험 — session_235 fabrication 사고 재발 |

**흐름 판정**: M3 모드를 **현 시점 채택**하면, session PD-80 fabrication 사고(D-185 강화 직접 원인) 재발 경로를 자동화하는 것입니다. 시간이 지날수록 누적 부채. [T3/A1/O5]

### 2.3 불확실성 (Keynesian uncertainty) vs 리스크 구분

- **리스크 (확률 가능)**: M1 stale drift (외부 skill 신규 패턴 미반영). 분기별 수동 audit으로 통제 가능.
- **불확실성 (확률 불가)**: 외부 skill description의 미래 변경 방향·legend-team 시스템의 미래 SOT 구조 변경. M3 자동화는 이 불확실성을 *시스템 박제 경로*에 직결시킴 — 비대칭 손실 구조.

**Keynesian 결론**: 불확실성이 큰 영역에서는 *자율 적응 메커니즘*(M2의 Zero 재량 self-flagging)이 *경직 자동화*(M3 hook)보다 우위. [T3/A2/O3]

---

## §3 지속 가능성 단일 판정 (1년 운영 관점)

### 핵심 질문

> "legend-team 시스템 1년 운영 관점에서 본 결정이 지속 가능한가."

### 판정: **Conditional Yes — 영역별 차등 매핑 한정 지속 가능**

**근거 3가지** [T3/A2/O3]:

1. **M3 단독 채택은 지속 불가능** — Riki R3-1·R3-2가 실측으로 입증. D-017 위반·fabrication 4건·legend-team 정책 무지 4건은 *현재* 위험이며 시간 경과로 악화. hook sanitization layer는 신설 가능하지만 **legend-team 정책 변경마다 갱신 부담**이 지속 누적.
2. **M1 단독 유지도 약한 stale 위험 존재** — 외부 skill 패턴 풀 진화는 실측 baseline 부재로 정량화 불가하지만 시간축에서 누적. security-review 영역 (Audit 도구 시그니처 협소함) 에서 가장 강하게 발현 가설.
3. **M2 (Zero 재량 + self-flagging)는 D2·D-017·D-146 정합 가능 + 외부 패턴 풀 cherry-pick 경로 확보** — 단, Master/Arki 무비판 채택 차단 안전망 의무.

**지속 가능 한 줄**: M1을 default로 유지하되, security-review 영역만 M2 cherry-pick 경로를 명시적으로 허용. M3은 **현시점 폐기**(향후 sanitization layer 실측 후 별도 PD에서 재검토). [T3/A2/O3]

---

## §4 Cross-Review 매핑 (각 역할 발언 합치/불일치)

### 4.1 Arki rev1 vs Riki rev1 (명분/결정 분리 논쟁)

| 논점 | Arki rev1 | Riki rev1 | Ace 판정 |
|---|---|---|---|
| 명분("파일 부재") vs 결정("내재화") 분리 가능성 | 가능 — D-119 본문에 "내재화" 명시 | 불가 — D-127 본문에 "물리 파일 부재 확인" 박제 [T4/A4/O5] | **Riki 옳음** — Jobs framing 재정의가 본 논쟁 해소 |
| 옵션 (b) 정정 범위 L28·L49 2줄 | 충분 | D-127·PD-075·supersede 체인 3건 추가 | **Riki 옳음** — Edi 박제 범위는 D-127 본문 포함 |
| 옵션 (a)·(b) 별개 옵션 가정 | 별개 | 동일 결과(흡수 유지) 두 박제 방식 | **Riki 옳음** — Jobs framing이 이를 명시적으로 재정의 |

**합치**: 둘 다 결정 본질(흡수 유지 vs 위임)이 핵심임에 동의. 차이는 정정 범위 추정.

### 4.2 Jobs framing 재정의 → Arki rev2 → 실측 → Riki rev2 일관성

| 단계 | 핵심 단언 | 후속 검증 결과 |
|---|---|---|
| Jobs rev1 | 본질 = 3 모드 × 3 영역 9 매트릭스. K1(메트릭) 검증 가능성이 결정력 병목 | Arki rev2가 K1 메트릭 5종 정의 ✓ |
| Arki rev2 가설 | tech-debt: M1·M2 동률 / security-review: M2 우위 / simplify: M1 ≥ | tech-debt M1 약간 우위로 기움 (Riki rev2 §5.1) — 가설 부분 수정 |
| 실측 1건 (M1/M2/M3) | 출력 형식 비호환 (R4-1) | 직접 비교 불가, 모드별 *특성 관찰*로 frame 재정의 |
| Riki rev2 | M3 fabrication 4건·D-017 위반 실증, M2 false positive 1건·self-flag 작동, M1 정합 | **본 종합검토가 그대로 수용** |

**합치**: Jobs → Arki rev2 → 실측 → Riki rev2 흐름은 일관. **불일치 0**.

### 4.3 본 실측 1건의 해석 합의

- M1 우위 (legend-team 컨텍스트 인지, fabrication 0): **3 보고서 모두 동의 가능** (Zero M1 자기보고 + Riki rev2 검증)
- M2 보조 가치 + false positive 1건: **3 보고서 모두 동의 가능** (M2 self-flag + Riki R2-1·R2-4)
- M3 단독 비권고: **3 보고서 모두 동의 가능** (M3 자체는 self-flag 없음, Riki R3-1~R3-4가 외부 검증)

**핵심 합치**: 모든 역할이 *"M3 단독 채택 비권고"*에 사실상 수렴. 직접 명시는 Riki만 했지만 M1·M2 자기보고도 모순 없음.

### 4.4 Riki R4-3 일반화 한계 — 자기 검열

본 cross-review가 Riki R4-3 ("본 실측 1건의 9 매트릭스 일반화 불가") 을 다시 우회하지 않는지 자가 점검:

- **tech-debt 영역**: 실측 직접 측정 → M1 우위 판정 정당 [T3/A4/O5]
- **security-review 영역**: 실측 미수행 → Arki rev2 가설 + 외부 skill description 비중첩 추론 + Riki R-3 cross-check만 근거. **확신도 중간 [T2]**, "현시점 최선" 판단으로 영역별 cherry-pick 경로 허용 권고 — 단 추가 실측 후 박제 권고
- **simplify 영역**: 실측 미수행 → 격차 작은 가설 (M1 ≥ M2). status quo M1 유지 안전 — 변경 비용 없음 [T2/A2/O3]

**자기 검열 결론**: 본 권고는 일반화 한계를 *우회하지 않고 명시적으로 인정*하며, 영역별 확신도를 분리 표기합니다.

---

## §5 본 실측 1건의 결정력 (1/9 가설 검증 효과)

### 결정력 정량 평가

| 영역 × 모드 | 사전 가설 (Arki rev2) | 실측 영향 | 잔여 가설 |
|---|---|---|---|
| tech-debt × M1 | 품질 3, 컨텍스트 high | **실증** — 호출처 grep + 정책 인용 | 0 (확정) |
| tech-debt × M2 | 품질 3.5, self-flag 가능 | **실증** — 18건 적출 + false positive 1건 + self-flag 작동 | 0 (확정) |
| tech-debt × M3 | 품질 3, fabrication 위험 | **실증** — fabrication 3건·D-017 위반 | 0 (확정 — 더 강하게 비권고) |
| security-review × 3 모드 | M2 우위 가설 | **미실측** | 3 가설 잔존 |
| simplify × 3 모드 | M1 ≥ M2 > M3 가설 | **미실측** | 3 가설 잔존 |

**결정력**: **3/9 칸 확정 (33%)**. 단, 확정된 3 칸이 *모드 단독 채택 가능성*을 일반화 평가하기에 충분 — M3 단독 비권고는 영역 무관 결론 (D-017 위반은 본질적 시스템 위반).

### 본 실측이 도출한 영역 무관 결론

1. **M3 단독 채택 비권고**: D-017 위반은 영역 무관 (Schedule-on-Demand 정책이 모든 영역에 적용). hook sanitization 없이는 어느 영역에서도 채택 불가. [T4/A4/O5]
2. **M2의 self-flagging 메커니즘은 모드 안전망으로 작동**: Zero 재량 게이트가 D2 정합 (Riki R2-4 실증). 영역과 무관하게 *Zero가 호출하는 한* 안전망 보존.
3. **M1의 legend-team 컨텍스트 인지는 모드 우위**: 호출처 grep·정책 인용은 영역 무관 — M1 default 유지 정당.

### 본 실측이 도출 못한 영역별 결론

- security-review × M2 우위 (Arki rev2 강한 가설) — *외부 skill 패턴 비중첩* 가설은 추정 [T2/A1/O1]. 실측 없이 박제 금지.
- simplify × M1 ≥ M2 — *코드 컨벤션 의존도* 가설. 격차 작아 status quo 유지가 안전 — 별도 실측 ROI 낮음. [T2/A2/O3]

---

## §6 단일 권고 (Master 결정 분기)

### 최종 권고 (단일)

> **M1을 default로 유지. M3은 현시점 폐기. security-review 영역에 한해 M2 cherry-pick 경로를 명시적으로 허용 (단, 향후 실측 1건 후 박제).** [T3/A2/O3]

### 구체 액션

#### A. D-127 정정 (Edi 박제 — Master 승인 후)

- **D-127 본문 amendment**: "물리 파일 부재 확인" → "**legend-team 컨텍스트 내재화 우선 + D2(거짓 전제) 신뢰 경계 보호. 외부 skill 3종은 실재하나 의도적 호출 배제.**" [T3/A1/O5]
- amendment 사유: PD-075 (사실관계 정정) + 본 종합검토 결정 (3 모드 평가 결과 흡수 유지 정당화)

#### B. role-zero.md spec 정정 (Edi 박제 — Master 승인 후)

- **L28** (Cut/Refine/Audit 폐기 명분): "외부 skill 파일 부재" → "legend-team 컨텍스트 내재화 우선 + D2 신뢰 경계 보호"
- **L49** (engineering:tech-debt·simplify 레거시 표기): "본 페르소나 흡수로 외부 호출 폐기" → "외부 skill 실재하나 의도적 호출 배제. **단 security-review 영역에 한해 Zero 재량 cherry-pick 허용** (별도 실측 1건 후 박제 예정)"

#### C. dispatch_config.json rules.zero 갱신 (Edi 박제 — Master 승인 후)

- 신규 필드 `external_skills_allowlist`: `[]` (default 빈 배열)
- 신규 필드 `external_skills_mode`: `"manual_zero_discretion"` (M2 = Zero 자율 cherry-pick / M3 hook 자동 명시 차단)
- 신규 필드 `m3_hook_auto_status`: `"deprecated_current_session"` + 박제 사유 (D-017 위반·fabrication 4건 실측)

#### D. 신규 결정 박제 후보 — **D-NNN: Zero 외부 skill 운용 모드 결정** (Edi 박제 후보)

```
D-NNN (2026-05-13, topic_206/session_246, PD-075 resolves):
Zero 페르소나 외부 skill 운용 모드 = M2 default (Zero 재량 cherry-pick) 가능
선언, 단 현시점 활성 영역 = 없음 (allowlist 빈 배열).
M1(흡수) 유지가 default. M3(hook 자동)은 D-017 위반·fabrication 실증
(session_246 Riki rev2 §3·§4) 으로 폐기.
영역별 cherry-pick 활성화는 영역당 실측 1건 + 별도 PD 박제 후 점진.
```

- T3/A2/O5 — 본 종합검토 + Riki rev2 실증 근거
- supersede: 없음 (D-127·D-146·D-119 보존, 보강 관계)

#### E. 후속 PD 분기 (Edi 또는 Master 등록)

- **PD-NNN-1**: security-review 영역 외부 skill 실측 1건 (예: `engineering:code-review` × legend-team 도구 코드 1 파일). 본 PD resolves 시 D-NNN amendment로 security-review × M2 cherry-pick 활성화.
- **PD-NNN-2**: simplify 영역 별도 실측 보류 (격차 작음 가설, ROI 낮음). Status quo 유지 명시.
- **PD-NNN-3** (선택): M3 hook 자동 sanitization layer 설계. D-017 금지어 v0 grep + 제거 hook + 외부 skill description changelog watch. 단 ROI 미검증 — 보류 권고.

### 본 권고가 회피한 결정 (Saying No)

- **9 매트릭스 전체 일괄 결정**: Riki R4-3 일반화 한계 정합. 영역별 점진 박제.
- **외부 skill description의 절대 품질 평가**: 본 토픽 범위 외 (Jobs scope OUT).
- **Zero 외 페르소나 외부 skill 정책**: 본 토픽 범위 외.

### Master 결정 필요 항목 (3건만)

1. **A·B·C 정정 + D-NNN 박제 진행 여부** (단일 권고 수용 또는 reject)
2. **PD-NNN-1 (security-review 실측 1건) 등록 여부** — 즉시·후속·생략 중 선택
3. **PD-NNN-3 (M3 sanitization 설계) 등록 여부** — 보류 권고 그대로 채택할지

---

## §7 자기측정

```
[ROLE:ace]
# self-scores
rfrm_trg: Y
ctx_car: 4
mst_fr: 0
ang_nov: 3
```

- `rfrm_trg Y`: Master 가정("3 모드 비교")을 *형식 비호환·일반화 한계*로 frame 재구성 (R4-1·R4-3 수용), 영역별 차등 + M3 폐기·M2 conditional 활성으로 결정축 재정렬.
- `ctx_car 4`: arki_rev1·riki_rev1·jobs_rev1·arki_rev2·m1/m2/m3·riki_rev2 7개 보고서 전부 직접 read + 핵심 단언 cross-mapping. D-127/D-017/D-146/D-185 정책 인용 정합. 5점 미부여 사유: D-119 본문 직접 grep 미수행 (Riki rev1 인용에 의존).
- `mst_fr 0`: 본 세션 내 Master 명시 마찰 0건. (auto 모드에서 Master 좌절/원복 신호 없음.)
- `ang_nov 3`: 신규 판정 축 3건 — ① M3 sanitization layer 분리 후보 ② security-review 영역 별도 PD 분기 ③ external_skills_allowlist 필드 신설 형식. 5점 미부여 사유: 핵심 frame은 Jobs rev1 + Arki rev2 + Riki rev2가 이미 제시 — Ace는 합성·결정.

---

ACE_WRITE_DONE: reports/2026-05-13_zero-external-skill-review/ace_synthesis.md
