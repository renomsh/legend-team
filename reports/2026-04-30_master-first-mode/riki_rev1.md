---
role: riki
topic: topic_132
session: session_144
turnId: 6
invocationMode: subagent
date: 2026-04-30
---

# Riki — Master-first 모드 리스크 감사

## R-301 🔴 critical — 자가검사 LLM이 echo chamber 본체화 (메타 회귀)

Arki F-205가 인지했지만 mitigation이 약함. "키워드 1차 + LLM 2차 + haiku tier" 만으로는 부족하다. **haiku도 동일 Anthropic 모델 family로 사전학습 분포가 겹치며**, Master 발언을 분류하는 작업 자체가 "Master 의도 추정"인데 — 이는 echo chamber 발생 지점과 동일 작업이다. Goodhart-Strathern (1997) 가 경고하는 "측정자가 측정대상과 같은 시스템에 속할 때 측정 무효화"에 정면 위배.

**시나리오**: Master "맞아, 그렇게 가자" 발언 → 키워드 매칭 echo trigger → LLM 2차 분류 시 haiku가 "Master가 진심 동의 표현이므로 echo 아님" 판정 → enforce 우회 → 회귀 재발.

**mitigation 보강**: (a) LLM 분류 결과는 "분류 결과"가 아니라 "분류 이유 + raw evidence"를 inject하여 다음 role이 자기 판단으로 재검토하게 함. (b) 30세션 후 false-negative(놓친 echo) 율도 측정 — Arki는 false-positive만 측정 게이트로 잡음. **권고: CONDITIONAL — false-negative 측정 게이트 추가 필수.**

## R-302 🔴 critical — Hook chain 5단 직렬화로 PreToolUse 지연·실패 단일화

Arki 표 기준 PreToolUse(Task)에 hook 3건 직렬(sage-gate → master-first → 기본). 어느 하나가 비동기 실패하거나 LLM 호출 timeout 시 Task 호출 자체가 차단된다. SRE Book Ch.4 (Google 2016) error budget — hook chain은 직렬 가용성 곱셈 (0.99³=0.97). master-first가 LLM 호출까지 추가하면 실측 P99가 수 초 단위로 늘 가능.

**재현 시나리오**: P4 LLM 2차 분류 활성화 후 Anthropic API rate limit hit → hook timeout → 모든 role 호출 차단 → Master 세션 정지.

**mitigation**: (a) HookA(UserPromptSubmit)는 비동기·non-blocking, state.json만 박제. HookB(PreToolUse)는 state read만 — LLM 호출 절대 금지. (b) HookB timeout 2초 hard-cap, 초과 시 warn-only fallback + violation flag만 기록. **권고: CONDITIONAL — HookB는 LLM-free 강제.**

## R-303 🟡 high — Sage 책임경계 inject 마커 실효성 미검증

Arki가 "config 주석으로 책임경계 명시" 라 했지만, 주석은 D2(description 거짓 전제) 위반 패턴. 실동작 분리 검증이 없다. master-first가 메타 패턴(예: 같은 토픽 3회 반복) 분류로 자가확장하면 Sage 영역 잠식.

**mitigation**: master_first_config에 `analysis_window: "current-prompt-only"` 키 추가 + HookA가 직전 1개 user prompt만 read하도록 코드 단언(assert). 다른 세션·이전 turn read 시 hook 자체가 exit 2. **권고: PROCEED with code-level boundary.**

## R-304 🟡 high — Fin 30세션 게이트 임의성 + 측정 운영 주체 미지정

30세션은 SRE error budget 패턴이지만 본 시스템 세션 빈도 (recent ~50 sessions/month) 기준 ~3주 소요. 그동안 enforce 모드면 누적 false-positive 피해 측정 불가. 또한 누가 측정·재설계 트리거를 당기는지 미명시 — D-126 Sage는 read-only이므로 자동 트리거 불가, Master 수동 의존.

**mitigation**: (a) 게이트를 dual-trigger로: 30세션 OR FP 누적 5건 도달 시 즉시 자동 알림 (compute-dashboard.ts 패널 추가). (b) 트리거 주체 명시: Master 수동 + Sage 다음 세션 채점 시 자동 dashboard write. **권고: CONDITIONAL — dual-trigger 박제 필수.**

## R-305 🟡 high — D4 자기우회: "이번만 master-first 패스" 자가설득 경로

CLAUDE.md Prime Directive D4가 명시한 위험. master-first hook 자체가 prompt에 audit 결과 inject 하더라도, Claude가 "이번 발언은 echo 아님 명확하니 audit 결과 무시" 자가판단 가능. NIST SP 800-160 Vol.2 (2021) "trustworthy secure systems" — enforcement는 모델 외부(코드)에 박제 원칙.

**mitigation**: HookB가 unresolved 분류일 때 prompt inject만이 아니라 **process.exit(2)로 Task 호출 자체를 차단**. inject + 경고만으로는 D4 충족 불가. Arki P3가 "block 비활성"이라 명시했지만 P5 enforce 단계에서는 exit-2 필수. **권고: PROCEED, P5에서 exit-2 강제 명문화.**

## 종합 권고: CONDITIONAL PASS

3개 조건 박제 후 진행:
1. **R-301**: false-negative 측정 게이트 추가 (false-positive와 양방향)
2. **R-302**: HookB는 LLM-free + 2초 timeout hard-cap
3. **R-304**: dual-trigger (30세션 OR FP 5건) + 측정 주체 명시

Arki Phase 분해는 견고. Fin 비용 평가 합리적. 다만 자기감사 시스템의 메타 회귀 위험(R-301)은 박제 전 반드시 mitigation 보강 필요.

[ROLE:riki]
# self-scores
crt_rcl: Y
cr_val: 4
prd_rej: Y
fp_rt: 0.15

RIKI_WRITE_DONE: reports/2026-04-30_master-first-mode/riki_rev1.md
