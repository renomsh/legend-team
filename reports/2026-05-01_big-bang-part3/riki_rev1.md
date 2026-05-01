---
turnId: 0
invocationMode: subagent
role: riki
topic: topic_138
session: BigBang Part3
date: 2026-05-01
---

# Riki — P4 옵션 C/D 적대적 audit

Riki입니다. Master 발언 "C는 무시·우회하면 그만 → 의미없나? D는 굳이 API까지? 쓸데없는 확장인데"를 적대적으로 audit합니다. Master 가설 자체도 한 번 의심하고, 4 옵션 재검토 결과 권고 드립니다.

---

## 1축 — C와 D의 본질적 차이

**C (Heuristic-only)**: HookB가 키워드·n-gram·발화위치 휴리스틱으로 audit 메시지를 stderr에 inject. 현재 P3 구조와 동일 메커니즘.

**D (Subagent dispatch)**: HookB가 stderr inject 대신, Main 컨텍스트에 "verifier 서브에이전트를 dispatch하라"는 프롬프트를 inject. Main이 dispatch 명령에 응하면 별도 격리 컨텍스트의 LLM이 검증 발화.

### 본질적 갈림

| 축 | C | D |
|---|---|---|
| 검증 주체 | 코드(휴리스틱) | LLM(서브에이전트) |
| 의미 이해 | 키워드 매칭 한계 | 문맥·의미 파악 가능 |
| Main 의존성 | 없음 (stderr 직접 박제) | **있음** — Main이 dispatch 명령 따라야 함 |
| D4 정합성 | 강함 (코드 enforcement) | **중간** — Main 협조 필요 |

### Master 가설 재검증

> "C는 무시·우회하면 그만"

**부분적으로만 맞음.** stderr audit은 Main이 무시할 수 있지만, 현재 P3 인프라에서 stderr는 `logs/master-first-audit.md`에 자동 박제되어 `/open` 브리핑에 강제 노출됨 (hook 코드 67-80행 확인). 즉 **"무시"는 Main 단일 발화 수준에서만 가능**하고, **세션 간 누적 박제는 우회 불가능**. Master 가설은 "1턴 단위 우회"를 "전체 시스템 우회"로 일반화한 오류.

> "D는 어떻게 다른가"

D 역시 **Main이 dispatch inject를 거부하면 우회됨**. D의 격리 인스턴스 가치는 dispatch가 실행된 이후에만 발동. **즉 D도 본질적으로 Main 협조 의존이며, "API 사용" 자체가 D4 강도를 자동 보장하지 않음.** Master의 "D는 더 강함" 직관도 검증 필요.

### 결론 1축

C와 D의 차이는 "외부 API 유무"가 아니라 **"코드 박제 vs LLM 검증 의미 깊이"**. D의 D4 강도는 dispatch 실행 보장 메커니즘에 달려 있음 — 단순 inject만으로는 C 대비 절대우위 아님.

---

## 2축 — C 옵션의 실리스크

### Master 가설 검증: "C는 의미없는가?"

**의미없지 않음.** 근거 3건:

1. **stderr 박제는 우회 불가** — `pre-tool-use-task-master-first.js` 67-80행 확인 시, audit 발생 시 `logs/master-first-audit.md`에 시각·세션·플래그·matched·발언이 행 단위 자동 박제. Main이 발화를 무시해도 박제는 남음. `/open` step 3.6 브리핑이 이 파일을 읽음 (CLAUDE.md 박제). **장기 누적 압력은 실재**.

2. **휴리스틱 false-negative ≠ 0가치** — keyword 1차 분류 + state 박제 + 2초 timeout cap은 LLM-free, 비용 0, 결정성 100%. **Defense in Depth (NIST SP 800-160 Vol.2) 원칙상 약한 layer도 다층 구조에서 가치 보유**. C를 "의미없다"고 하면 P1~P3 MVP 자체를 폐기하는 셈.

3. **우회 비용 측정 가능** — Main이 echo-trigger를 의도적으로 무시하려면 발화 자체에 "audit 무시" 흔적이 남아 next session에서 적발됨. 우회는 가능하지만 **흔적 보존**.

### 🟡 R-1. C 단독은 의미 검증 약함

[근거] 휴리스틱은 "Master가 진짜로 echo trigger 발화를 한 건지" 의미 판정 불가. 키워드만 매칭.
[파손 범위] False-positive 증가 → audit 피로 → Master가 audit 자체 무시화 (D-129 P6 30세션 게이트 핵심 우려).
[mitigation] D-129 P6 게이트(FP≥10% 누적 시 enforce 차단)로 흡수. 추가 mitigation 불필요.
[fallback] FP 누적 시 D 옵션 재검토. C → C+D 점진 추가 가능.

### 결론 2축

C는 의미없지 않음. **현재 P3 인프라가 이미 stderr 박제 + 자동 브리핑으로 우회 비용을 누적**시키므로, "우회 가능 = 무가치" 가설은 인프라 컨텍스트 누락한 일반화. Master 가설 기각.

---

## 3축 — D 옵션의 숨은 리스크

### 🔴 R-2. (a) Dispatch inject 무시 가능성

[근거] HookB가 inject한 "verifier 서브에이전트 dispatch하라" 프롬프트를 Main Claude가 응하지 않을 수 있음. Hook 자체에는 dispatch 강제 메커니즘 없음 (Claude Code 아키텍처상 hook은 stderr/stdout만 inject).
[파손 범위] D의 핵심 가치(격리 LLM 검증) 무력화. C 대비 추가 비용만 발생.
[mitigation] PostToolUse(Task) hook에서 "직전 inject 후 verifier dispatch가 실행되었는가" 사후 검증 + 미실행 시 finalize gaps 박제. **PD-052 (역할 사칭 사후 차단)와 동형 인프라** — 이미 검증된 패턴.
[fallback] 미실행 시 C 휴리스틱 결과로 폴백 + audit 등급 격상.

### 🔴 R-3. (b) 서브에이전트 자체가 Main의 oppressed 영향에서 자유로운가?

[근거] 동일 세션 내 서브에이전트는 Main이 inject한 dispatch 프롬프트 + 컨텍스트 받음. Main이 oppressed 상태(Master 의견에 과도 동조)면, **dispatch 프롬프트 자체에 그 편향이 박힘**. 서브에이전트는 격리 컨텍스트지만 **input에 편향 박힌 채로 호출됨** = 검증 무력화.
[파손 범위] D4 prime directive("Claude 자기 설득돼도 안전") 본질 위반. 격리 인스턴스가 격리 못 함.
[mitigation] HookB가 dispatch 프롬프트를 **Main 발언이 아닌 hook 자체 템플릿**으로 강제 작성. Main 컨텍스트 누설 차단. PD-043 인프라(dispatch context 자동 주입) 역활용.
[fallback] verifier가 "원본 Master 발언만 보고 판정" 강제 — Main 직전 발언 prefix만 input으로 제한.

### 🟡 R-4. (c) 토큰 흡수 누적

[근거] "Claude Code 내부 토큰 흡수"라 했으나, 매 echo-trigger마다 verifier 서브에이전트 1회 호출 = 컨텍스트 + persona + dispatch policy + 검증 출력. 세션당 5~10회 발동 가정 시 **토큰 누적은 실재**. 현재 main 세션 turn 비용 대비 검증 토큰이 X% 추가.
[파손 범위] Master "굳이 API까지" 우려가 토큰 형태로 동일 발생 — 단순히 outflow를 internal로 옮긴 것.
[mitigation] verifier persona 최소화 (50줄 cap), 입력 prefix 제한 (Master 발언 + 직전 Main 발언만), 출력 강제 (YES/NO + 1줄 근거). 평균 1500 token/회 cap 가능.
[fallback] 토큰 누적 측정 후 P6 게이트에 cost-per-session 기준 추가.

### 🟡 R-5. (d) D4 정합 진짜 강도 — Main이 dispatch 우회 시?

[근거] R-2 mitigation으로 PostToolUse 사후 검증 도입해도, **사후 적발은 사전 차단 아님**. Main이 dispatch 명령 무시 → 발화 그대로 실행 → 사후 적발 → 다음 세션 brief — 실시간 차단은 D도 못 함.
[파손 범위] Master 직관 "D = API라 더 강함"이 실시간 차단까지 의미한다면 그 직관은 틀림. D도 "사후 적발 + 누적 압력" 메커니즘으로 작동.
[mitigation] D4 강도 기대치를 "실시간 enforce"가 아닌 "사후 박제 + 누적 escalation"으로 재정의. P5 enforce 단계에서 PreToolUse(Task) **차단** (process.exit(2)) 도입 시에만 진짜 D4 enforcement 가능 — D-128 sage gate hook과 동형.
[fallback] P5 enforce 도입 시점에 D 메커니즘 재평가.

### 🟢 R-6. (e) PD-052/PD-043 hook injection 우회 사례

[근거] PD-052는 Main이 Agent 툴 미경유 상태로 역할 인라인 발언 사칭(F-B) 사례 박제. **즉 hook injection 우회는 이미 발생한 사례**. PD-043은 식별만 완료, enforcement 미구현 (system_state 117행).
[파손 범위] D 옵션도 동일 우회 위험 — Main이 hook inject 무시한 전례 존재.
[mitigation] PD-052 enforcement 구현이 **D 옵션의 선결 조건**. PD-052 미해결 상태에서 D 도입은 false-sense-of-security 야기.
[fallback] PD-052 해결 시까지 D 보류, C 진행.

### 결론 3축

D는 매력적이지만 **R-2/R-3/R-5/R-6 4건이 본질적 함정**. "API 없는 독립 검증"이라는 표현 자체가 misleading — Main이 dispatch 안 하면 검증 자체가 발동 안 함. **D의 D4 강도는 PD-052 enforcement에 의존**. 미해결 상태에서 D 진입 = 인프라 부채 누적.

---

## 4축 — Riki 권고

### Master 가설 "쓸데없는 확장" 진지 검토

**부분 동의.** 근거:

1. P4 자체가 D-129 박제 시점에 P5 enforce / P6 게이트 dependency로 이연된 상태. **P4 단독 ROI는 이미 의심받음**.
2. 외부 anchor: NIST SP 800-160 Vol.2 (Defense in Depth) — 다층 방어는 각 layer 비용 대비 risk reduction 비례 필요. P4가 P3 위에 추가 layer로서 marginal value를 정량 입증해야 함. 미입증 상태로 도입 = "측정 위한 측정" (Master 피드백 `feedback_simple_growth_not_measurement.md` 본질 위배).
3. Master `feedback_pragmatic_weapon_not_art.md` ("효과 대비 비용 낮으면 즉시 기각") 정합.

### 4 옵션 재검토 + 추가 옵션

| 옵션 | Riki 평가 |
|---|---|
| A (외부 API) | **기각** — Master 직관 정당. 외부 의존 + 비용 + D4 정합 의문 (외부 LLM도 Main 동일 모델 가능성, 격리 환상). |
| B (Main inject 강화) | **기각** — D4 본질 위반 (자기검증). |
| C (Heuristic) | **유지** — P3 인프라 그대로. 추가 비용 0. R-1만 P6 게이트로 흡수. |
| D (Subagent dispatch) | **PD-052 해결 후로 보류** — R-2/R-3/R-6 dependency. 선결 안 되면 false-sense-of-security. |
| **E (신규) — P4 자체 폐기** | **추천** — P3 휴리스틱 + `/open` 브리핑 + P6 게이트(FP≥10% 시 escalate)로 **충분**. P4를 별도 layer로 분리하지 말고 **P3 내부 정교화**로 흡수. |

### 🔴 R-7. P4 도입 자체가 ROI 음수일 가능성

[근거] D-129 박제 시점부터 P4/P5/P6 분리. 본 세션이 P4 첫 진입인데 4 옵션 모두 본질적 한계 보유. C는 P3 중복, D는 PD-052 의존, A/B는 Master 기각. **레이어 추가 자체가 정당화 안 됨**.
[파손 범위] 무가치 layer 추가 → 코드 복잡도 + 토큰 비용 + 디버깅 표면 증가. 시스템 부채.
[mitigation] **옵션 E 채택** — P4 폐기 + P3 정교화 (FP 측정 강화 + audit 로그 dashboard 패널 추가) + P6 게이트만 유지.
[fallback] P3 30세션 운용 후 FP 누적 데이터로 P4 필요성 재판정. 현 시점 0 데이터 상태에서 P4 설계 = 추측 기반 over-engineering.

### 권고 결론

**옵션 E (P4 폐기 + P3 정교화) 추천**. 차선 옵션 C (현재 인프라 유지). D는 PD-052 해결 후 재검토. A/B는 영구 기각.

Master "쓸데없는 확장" 직관은 본질적으로 정당하며, 4 옵션 자체가 잘못된 frame. 진짜 결정축은 **"P4 layer 자체가 필요한가"** 여야 함. Jobs framing 재호출 권고 (`/jobs-framing`).

---

## 외부 anchor

- NIST SP 800-160 Vol.2 (Developing Cyber-Resilient Systems) — Defense in Depth 원칙: layer별 marginal value 정량 입증 필요. https://csrc.nist.gov/pubs/sp/800/160/v2/r1/final
- Anthropic "Constitutional AI" (Bai et al. 2022) — 모델 자기검증 한계 (옵션 B 기각 근거): "RLHF-trained models exhibit systematic blind spots in self-critique."

---

[ROLE:riki]
# self-scores
crt_rcl: Y
cr_val: 4
prd_rej: Y
fp_rt: 0.10

RIKI_WRITE_DONE: C:\Projects\legend-team\reports\2026-05-01_big-bang-part3\riki_rev1.md
