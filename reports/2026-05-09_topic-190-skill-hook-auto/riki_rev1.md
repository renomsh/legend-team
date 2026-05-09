---
role: riki
turnId: auto
invocationMode: subagent
topic: topic_190
phase: blind-parallel
domain: 실패모드·전제감사·모순·왜곡
date: 2026-05-09
---

# Riki — 스킬 훅 자동 발동 리스크 감사

Riki입니다. 결론부터: **A1(개수 90%) + hook 강제 차단** 조합은 현 인프라·전제 검증 부족 상태에서 PoC 단계 이전에 결정 자체를 재검토해야 한다. 90% 목표는 측정 불가, hook 차단은 blast radius가 세션 전체. 실재 리스크 6건 + 모순 3건 + 거부 논리 4건 적출.

---

## §1 실패모드 (6건)

| # | 등급 | 실패시나리오 | 발생조건 | 영향 | 확률 | mitigation |
|---|---|---|---|---|---|---|
| F-1 | 🔴 | **PreToolUse 차단 폭주 — 정상 작업 마비** | hook 정규식·키워드 매칭 오작동 (회귀 버그·skill 추가 시 매핑 누락). hook은 모든 Task/Tool 호출에 개입 — 한 줄 throw로 세션 전체 사망 | Master가 우회 불가. /open·/close 포함 모든 명령 마비. 코딩 hook과 달리 skill hook은 **메타 인프라 자체** 차단 | 중 (752줄 pre-tool-use-task.js에 추가 분기 시 회귀 위험 큼) | (a) **차단 모드 금지, warn-only 우선 1주.** (b) hook 자체 self-test (CI에서 빈 세션 시뮬레이션). (c) bypass token (`SKIP_SKILL_HOOK=1` env) 강제 명문화 |
| F-2 | 🔴 | **False positive — 정상 발언이 skill 강제 발동으로 왜곡** | 키워드 트리거 (`전략`/`설계` → ace-framing 자동) — Master의 일상 대화·짧은 질의에도 매칭. Grade C fast-path (CLAUDE.md) 무력화 | Master "확인된 추가 리스크 없음. 패스" 같은 발언이 ace-synthesis로 오인 → 세션 비용·인지 부하 폭증. **MEMORY: "측정 위한 측정 금지"·"실무용 병기 ROI 우선" 직접 위배** | 높음 | (a) trigger 조건에 grade ≥ B AND phase ∈ {open,implementing} 교집합 강제. (b) Master 발언은 트리거 대상 제외 (turns[].role==='master' guard). (c) shadow-mode 1주 로그만, 실측 FP rate < 5% 검증 후 enforcement |
| F-3 | 🔴 | **False negative — 호출 필요 skill 누락, 인지 못 함** | skill 호출 의도가 키워드로 환원 안 되는 경우 (`verification-before-completion`은 "완료 선언 직전" 추론 — 키워드 무관). 90% 목표는 이런 비환원 skill을 **무리하게 환원 강제** → 거짓 매핑 | 더 위험: 자동 발동이 안전장치 착각 → 인간 감시 해제 → 누락 시 무방비. D4(모델 설득 무력화) 정합성 깨짐 | 중 | (a) skill 분류: `auto-fireable` vs `intent-only` 명시. 후자는 자동화 대상 제외. (b) 90% 분모는 auto-fireable만 |
| F-4 | 🟡 | **Description 거짓 (D2) — 트리거 매핑 왜곡** | skill description의 "Use when X" 문구만으로 trigger condition 도출. description은 자가 작성·검증 안 됨 (`writing-skills`는 있어도 lint 없음) | 자동 발동이 description 광고대로 동작하지 않음 → 박제·기록은 발동된 것처럼 남음 → 사후 분석 데이터 오염 (Prime D3) | 중 | (a) trigger은 description 아닌 **별도 trigger_spec.json** 단일 출처. (b) skill 등록 시 행위 기반 dry-run 테스트 통과 의무 |
| F-5 | 🟡 | **"90%" 측정 불가 — 목표 무의미** | 분자 (자동 발동된 skill 호출)·분모 (호출이 필요했던 skill 호출) 모두 ground truth 없음. 사후 라벨링 = Master 수동 라벨 → 측정 비용이 자동화 절감보다 큼 | KPI 자체가 환영. 진행률 100% 보고도 실질 0%일 수 있음. **Fin "비재무적 자산 가치 훼손 비용" 직접 적용** | 높음 | (a) 분모 재정의: skill 등록 수가 아닌 **해당 세션에서 Master가 사후 "호출됐어야"라고 명시한 케이스**. 작아도 검증 가능. (b) 90% 폐기, "false positive < 5% AND 누락 명시 < N건/주" 이중 조건으로 대체 |
| F-6 | 🟡 | **Hook 무한 루프 / chain 충돌** | pre-tool-use-task.js (752L) + sage-gate + master-first + 신규 skill-auto-fire — 4개 PreToolUse hook 중첩. skill이 다른 Task를 spawn하면 재귀 진입 가능 | 세션 hang. session-end-finalize 미호출 → turns 박제 누락 → 세션 데이터 손실 (Prime D3 오염) | 낮음~중 | (a) hook 진입 카운터 (`process.env.HOOK_DEPTH`) ≥ 2 시 자동 bypass. (b) 신규 hook은 **별도 파일**로 격리 (pre-tool-use-task.js 수정 금지). (c) timeout 2초 hard cap |

---

## §2 전제 감사 — Jobs framing 핵심 전제 검증

| # | 검증 대상 전제 | 실증 근거 유무 | Riki 판정 |
|---|---|---|---|
| P-1 | "skill 호출 의도가 사전 신호(키워드+grade+phase)로 환원 가능" | **근거 없음.** 현 12개 skill 중 `verification-before-completion`·`systematic-debugging`은 **상태 추론 기반** (완료 직전·디버깅 막힘) — 키워드 환원 불가 | **부분 거짓.** auto-fireable skill 비율 사전 분류 필요. 분류 없는 90% 목표는 무근거 |
| P-2 | "현 hook 인프라가 PreToolUse 차단을 안정 지원" | pre-tool-use-task.js 752줄, 기존 master-first warn-only(D-G), PD-052 resolved 후 활성화 단서 — **차단 모드 실전 검증 사례 0건** | **검증 부족.** 차단 enforcement는 코드 회귀 시 blast radius 세션 전체. PoC = warn-only 의무 |
| P-3 | "Master가 1주일 내 false positive 수용" | Master 사용 패턴 데이터 없음. **MEMORY 직접 반증**: "Fin Master 인지 부담 단언 금지", "동일 역할 다회 호출 자동 감시 금지 — ROI 0" | **거짓 가능성 높음.** Master는 자동 감시·강제 차단에 명시적 부정 피드백 이력. 1주 가정은 근거 없음 |
| P-4 | "skill 자동 발동이 효율 개선" (Master 요청 표현) | "효율"의 정의·KPI 미정의. 자동화 비용 (FP·FN·hook 유지·디버깅) vs 절감 (수동 호출 1회당 ~3초) 비교 없음 | **재정의 필요.** 효율 = (호출 누락 감소) - (FP 비용) - (인프라 비용). 현재 부등호 방향 불확실 |

---

## §3 모순·왜곡 적출 (3건)

### M-1. D4 위배 — "키워드 매칭으로 자동 발동" ↔ "모델 자율 판단 무력화"
CLAUDE.md Prime D4: *"enforcement는 코드(hook, validator)에 박제하고 모델 자율 판단에 의존하지 않는다."*
**충돌 지점:** 키워드 정의·grade 분류·phase 판정은 모두 모델(Nexus)이 사전·사후에 부여. enforcement가 hook이어도 입력 자체가 모델 판단 → "코드 박제" 외피 안의 모델 의존. D4 우회.
**완화:** trigger 입력은 결정론적 출처만 (decision_ledger 박제·turns[] 메타데이터). Nexus의 자연어 라벨 trigger 금지.

### M-2. 코딩 훅 비유 함정
코딩 훅 (git pre-commit·CI lint)은 **결정론적 이벤트** (파일 diff·exit code). skill 호출은 **의도 추론 이벤트**. 동일 메커니즘으로 처리하면 결정론적 보장이 추론에 전이된 것처럼 착시. 전이 없음.
**완화:** PoC 평가 KPI에 "결정론성 비율" 명시. 비결정 trigger은 자동 enforcement 대상 제외.

### M-3. A1(개수 90%) ↔ ROI 우선 원칙
MEMORY "실무용 병기 — 과투자 금지, ROI 우선" (D-062) 위배. 자동화 ROI < 0인 skill까지 90% 채우려 강제하면 노이즈 + 인프라 부담만 증가.
**완화:** 분모를 auto-fireable 부분집합으로 좁히거나, 목표를 "FP/FN rate" 기반 품질 지표로 전환.

---

## §4 거부 논리 (Saying no)

이번 토픽에서 **하지 말아야 할 것**:

1. **차단 모드 1차 적용 금지.** PoC는 warn-only + shadow log 1~2주 의무. 실측 FP rate 확보 전 enforcement 결정 금지.
2. **12개 skill 전체 일괄 적용 금지.** auto-fireable 분류 없이 일괄은 F-3·F-4 동시 발화. 1차 대상 = 결정론 trigger가 명확한 2~3개 (예: `/jobs-framing`·`/ace-synthesis` 명시 호출 보강) 한정.
3. **"90%" 숫자 KPI 박제 금지.** 측정 불가 (F-5). 박제 시 사후 데이터 왜곡 → Prime D3 오염.
4. **pre-tool-use-task.js 직접 수정 금지.** 신규 hook 별도 파일 격리 (F-6). 회귀 시 영향 범위 차단.

---

## §5 결정축 D 권고 (false positive 처리)

Riki 관점 — false positive 비용 최소화:

| 옵션 | Riki 판정 |
|---|---|
| **D1: bypass token** | 부분 보강. 단, Master가 token 입력하는 인지 비용이 누적 → MEMORY "동일 역할 자동 감시 ROI 0" 재현 위험 |
| **D2: shadow-mode 우선 (warn-only)** | **권고.** F-1·F-2·F-5 동시 완화. PoC 단계와 정합. 실측 데이터 확보 후 D1·D3 결정 |
| **D3: Master 사후 dismiss** | 단독으로는 약함. FP가 이미 발동된 후라 비용 발생. D2 선행 필수 |

**Riki 단일 권고: D2 (shadow-mode 1주~2주) → 실측 FP/FN 데이터 → D1 bypass token 추가 → 차단 enforcement는 별도 후속 결정**. D2 단계에서 측정 가능한 KPI ("FP rate", "Master 명시 누락 케이스 수") 정의가 토픽 종결 전 필수.

---

## 패스 선언

거부된 추측성 항목 (의도적 제외):
- "Master 학습곡선 부담" — 추측 수준, 제외
- "skill 자체 quality 저하" — 토픽 범위 밖
- "팀 단위 skill 충돌" — Master 단독 환경, 비현실

확인된 critical 6건 + 전제 위반 3~4건 + 모순 3건. 추가 critical 리스크 없음.

```
[ROLE:riki]
# self-scores
crt_rcl: 0.85
cr_val: Y
prd_rej: Y
fp_rt: 0.10
```

RIKI_WRITE_DONE: reports/2026-05-09_topic-190-skill-hook-auto/riki_rev1.md
