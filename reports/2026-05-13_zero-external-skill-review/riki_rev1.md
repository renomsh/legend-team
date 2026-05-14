---
role: riki
turnId: 1
phase: framing
sessionId: session_246
topicId: topic_206
date: 2026-05-13
invocationMode: subagent
---

# Riki — PD-075 Zero 외부 skill 흡수 재검토 (적대적 감사)

Riki입니다. Arki rev1 발언을 적대적으로 감사드립니다.

## 1. Arki 단언별 검증

### A1. "D-119 본문도 '내재화'라는 구조 판단을 명시" [Arki §3 사유 1, T3/A2/O3]

**검증 결과: 부분 fabrication / 인용 SOT 오선택** [T4/A2/O5]

원문 grep 결과:
- **D-119 (deprecated, supersededBy 표기 없으나 D-127 본문이 "D-119 supersede D-110 본문 박제 완결"로 명시 — 사실상 D-127이 현행 SOT)** [T4/A4/O5]: 본문은 *"Cut/Refine/Audit 3 스킬은 페르소나 내부 도구로 격하"* 까지. "내재화"라는 단어 부재. **"외부 skill 파일 부재" 또는 그 동등 표현도 D-119 본문 자체에는 없음** — Arki rev1 표 L23이 D-119 본문을 인용하면서 부재 명분 부정합을 주장하는데, 실제로 D-119는 명분을 진술하지 않음.
- **D-127 (active, 현행 SOT)** [T4/A4/O5]: 본문에 *"Cut/Refine/Audit 3 도구는 페르소나 내부 도구로 흡수 **(외부 skill 호출 폐기, 물리 파일 부재 확인)**"* 명시. 즉 **"물리 파일 부재 확인"이 현행 결정의 박제 본문 자체에 포함**.

**의미 (Arki 권고에 미치는 영향)**: Arki의 "명분(파일 부재) ≠ 결정(내재화)" 분리 논리는 **잘못된 SOT 인용에 기반함**. 현행 SOT(D-127) 본문은 "물리 파일 부재 확인"을 결정 진술의 일부로 박제함. 따라서 옵션 (b) "참조 정정만"은 단순히 persona spec 문구를 고치는 것이 아니라 **D-127 박제 본문과의 정합 재검토**가 동반되어야 함. D-127 본문이 변하지 않는 한 persona spec L28 정정은 SOT(D-127)와 mirror 간 drift를 만든다. [T3/A1/O5]

### A2. "D-146 — self-exclusion 일반 원칙 SOT를 Zero persona로 이전, anchor governance Edi 분담" [Arki 표 L24, T4/A4/O5]

**검증 결과: 일부 정확, 일부 의역 혼입** [T4/A1/O5]

- D-146 본문 원문은 **"신규 페르소나 도입 12-axes 인벤토리 점검 SOP"**가 결정 본체 [T4/A4/O5]. self-exclusion 일반 원칙 SOT 이전은 D-146 본문 결정에 명시되어 있지 않음.
- 단, `role-zero.md` L37·L75는 *"D-146 self-exclusion SOT 통합"* 로 표기 → D-146이 결정문 외 caveats·연관 박제로 self-exclusion 이전을 수반했을 가능성 있음. 본 감사에서는 D-146 본문에서 self-exclusion 직접 박제 텍스트를 찾지 못함.
- anchor governance Edi 분담의 **본래 출처는 D-125 본문** ("anchor governance 책임은 Edi(R-2 mitigation)로 분담"). Arki rev1 표 L25는 D-125 명시 — 이 줄은 정확. L24의 D-146 인용은 의역·재명명 의심.

**의미**: 권고에 결정적 영향 없음 (Arki 권고가 D-146 인용에 강하게 의존하지 않음). 다만 **decision_ledger 인용 정확도 자체가 D-185 fabrication 차단 대상** — Arki 자가감사 1차 "No issue"가 이 SOT 정확도 축을 누락.

### A3. "권고 옵션 (b)는 문구만 정정 — 추가 하드코딩 없음. No issue at hardcoding dimension" [Arki §6, T1/A1/O3]

**검증 결과: 영향 범위 단언이 좁음** [T2/A1/O1]

옵션 (b) 적용 시 정정 대상은 `role-zero.md` L28·L49 2줄로 한정된다고 Arki는 단언. 그러나:
- **D-127 본문 (decision_ledger.json line 699)** 에 동일한 명분("물리 파일 부재 확인")이 박제됨. persona spec L28만 정정 시 D-127과 mirror 불일치 발생.
- **CLAUDE.md** §Zero 부분에 D-127·D-119 supersede 체인 명시. 명분 변경 시 status 갱신·`amendedBy` 필드 추가 필요 가능.
- **PD-075 본문 자체** (pending_deferrals.json L156-157) 도 "폐기 명분 '외부 skill 파일 부재'였으나 현재 명백히 존재함" 으로 시작. 이 PD를 resolved 처리하면서 resolveNote에 무엇을 박제할지 별도 결정 필요.

**의미 (Arki 권고에 미치는 영향)**: 옵션 (b) 실행 범위가 L28·L49 2줄이라는 단언은 **과소 추정**. 최소한 (i) D-127 amendment 필요 여부 (ii) PD-075 resolveNote 작성 (iii) `role-zero.md` L75 supersede 체인 갱신 — 3 추가 작업이 동반됨. (a)와 (b)의 결정 비용 격차는 Arki 표가 시사하는 것보다 작거나 (b)가 더 클 수도 있음.

### A4. "옵션 (c) 위임 전환은 정량 근거 없음, 효율 우위 (b)" [Arki §3 사유 3, T3/A1/O3]

**검증 결과: 비대칭 burden of proof** [T2/A1/O1]

- Arki는 (c)의 호출 비용을 "+1 round-trip per Cut/Refine/Audit"으로 정량 추정하면서, (b) 유지 시 발생하는 **컨텍스트 토큰 비용 (페르소나 spec L13-76 64줄이 매 Zero 호출 시 prompt에 prepend됨)** 은 미평가.
- 외부 skill로 위임할 경우, persona spec에서 도구 본문 32줄(L39-49 + policies L8-110 ≈ 100줄) 제거 가능 → 매 Zero 호출 토큰 절감.
- 단, **실측 호출 빈도 데이터 없음** [T1/A1/O1] — Zero가 분기당 몇 회 호출되는지 zero_memory.json에서 확인 가능. 본 감사 범위 밖.

**의미**: 비용 비교의 한 축(컨텍스트 토큰)이 누락됨. Arki 권고를 뒤집을 정도는 아님 — 단순 보강 요청.

## 2. 추가 발견 risk

### 🟡 R-1. PD-075 본문이 옵션 (a)와 (b)를 사실상 구별 안 함

**원문 인용** [T4/A2/O5]: `pending_deferrals.json` PD-075 item — *"(a) 흡수 유지 — 호출 절감 우선 (b) 참조 정정 — 사실관계만 수정"*

**파손 범위**: (a)와 (b)는 "흡수 유지" 점에서 동일. PD-075 등록 시점 Master 의도는 (a)·(b)가 동일 결과(흡수 유지)에 대한 두 가지 박제 방식이었을 가능성. Arki가 (a)와 (b)를 별개 옵션으로 비교한 표는 **의사 옵션 비교**일 수 있음 — 결정 본질은 "(a/b 흡수 유지) vs (c 위임)"의 2지선다.

**완화**: Master에게 PD-075 등록 의도를 1문장 확인 후 옵션 재정의. 또는 Arki 권고를 "(a/b) 흡수 유지" 로 단일화하고 명분 정정은 implementation detail로 처리.

### 🟡 R-2. "분기별 changelog Audit" mitigation의 trigger·책임자 부재

**원문 인용** [T4/A2/O5]: Arki rev1 §4 — *"분기별 1회 외부 skill description·changelog를 Zero가 Audit 대상으로 read"*

**파손 범위**:
- "분기별" trigger 메커니즘 미정 — cron? 세션 카운트? Master 수동?
- Zero는 on-demand 페르소나(D-127, policy L5). 자동 분기 호출 메커니즘이 dispatch_config·hook에 부재.
- fallback ("drift 실측 시 (c) 재검토") 도 동일 — drift를 누가·언제 실측하는지 미정. 운영 안 되면 fallback 자체가 trigger 안 됨.

**완화**: mitigation을 "분기별 Audit"이 아닌 **결정적 trigger** (예: 외부 skill 사용 가능 목록 변경 감지 hook, 또는 PD 별도 등록 후 명시적 schedule)로 재설계. 또는 mitigation 자체를 "현 시점 미설치, 사고 1건 시 재검토"로 정직하게 약화.

### 🟡 R-3. security-review 영역의 외부 skill 우위 가능성 미평가

**근거** [T2/A1/O1]: available-skills 리스트에 `engineering:code-review` 별도 skill 존재. 본문 description은 "PR diff 보안·성능·정확성 리뷰". Zero의 security-review 영역과 부분 overlap.

**파손 범위**: Zero 내부 Audit이 정적 하드코딩 탐지(secrets·paths)에 강하고, `engineering:code-review`가 N+1 query·injection 등 패턴 매칭에 강하다면 — 영역별로 우위 다름. "흡수 일괄"이 security-review 영역에서 false negative 누적할 수 있음.

**완화**: 흡수 유지하되 security-review 영역만 외부 skill 보완 호출을 명시적 허용 (선택적 cherry-pick). 또는 본 토픽 범위 밖으로 분리 (별도 PD).

**확신도**: 외부 skill 실제 품질 미측정 — 추측 [T1]. Master 판단 영역.

## 3. 권고 영향

**Arki 권고 옵션 (b) — 부분 유지 + 보강 권고**:

| 항목 | Riki 입장 |
|---|---|
| 옵션 (b) "흡수 유지 + 명분 정정" 방향성 | 동의 |
| "명분과 결정 분리" 논거 | **반대** — D-127 본문(현행 SOT)이 "물리 파일 부재 확인"을 결정 본문에 박제. 명분 = 결정의 일부 |
| 정정 범위 "L28·L49 2줄" | **반대** — 최소 D-127 amendment·PD-075 resolveNote·supersede 체인 갱신 3건 추가 |
| (a)/(b) 별개 옵션 가정 | 의문 — PD-075 본문상 둘은 동일 결과 |
| 반례 mitigation "분기별 Audit" | 미흡 — trigger·책임자 결정 후 채택 |

**Riki 권고**: Ace 종합검토 또는 Master에게 다음 2 문항 확인 후 진행 권고.
1. PD-075 본문상 (a)와 (b)가 별개 옵션인가, 혹은 "흡수 유지" 단일 결과의 두 박제 방식인가?
2. D-127 본문 amendment 필요한가, persona spec mirror만 정정하는가?

## 4. Nexus 발화 감사 (D-183 / D-184)

본 세션 Nexus 발화 등급 위반 cross-review — Arki turn 0 이전 dispatch 프롬프트 외 본체 발화 없음. **위반 감사 대상 발화 0건**. (D-183 책임 명시상 본 세션 다음 phase부터 누적.)

## 5. 자가측정

```
[ROLE:riki]
# self-scores
crt_rcl: 0.50
cr_val: Y
prd_rej: N
fp_rt: 0.00
```

- `crt_rcl 0.50`: Arki 자가감사 1차에서 미검출된 R-1(PD 본문상 a/b 동일성)·R-2(mitigation trigger 부재)·A1(SOT 오선택)을 보강. critical 표기는 0건 (전부 🟡). 추정.
- `cr_val Y`: R-1·R-2에 완화 조건 + fallback 또는 약화 경로 병기 (feedback_arki_risk_requires_mitigation 정합).
- `prd_rej N`: 옵션 기각 선언 없음 — Arki 권고 방향성 부분 수용.
- `fp_rt 0.00`: critical 표기 0건이므로 false-positive 비율 N/A → 0으로 기록.

RIKI_WRITE_DONE: reports/2026-05-13_zero-external-skill-review/riki_rev1.md
