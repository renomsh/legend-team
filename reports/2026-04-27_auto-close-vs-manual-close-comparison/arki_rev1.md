---
role: arki
topic: topic_118
session: session_119
date: 2026-04-27
revision: 1
status: framing
contributing_agents: [arki]
turnId: 0
invocationMode: subagent
accessed_assets:
  - file: topic_index.json
    scope: topic_118
  - file: decision_ledger.json
    scope: D-074_D-101
  - file: evidence_index.json
    scope: F-118
  - file: glossary.json
    scope: scoped
---

# Arki 구조진단 — 자동 close vs 수동 /close 산출물 차이

## Lead

PD-039의 본질은 "두 close 경로의 산출물이 일관되는가"이며, 구조 단계에서 6개 finding(F-118a~f)을 도출했다. **단**, Master 피드백을 통해 본 진단이 코드 경로 단언과 시야 협소에 치우쳤음을 인정한다 — Dev 실측이 우선이며 본 finding 중 일부는 가설 단계에 머문다.

## F-118a — close skill 자체의 hook chain 직접 미호출
`.claude/commands/close.md` 또는 `.claude/skills/close/SKILL.md` 내부에 `auto-push.js` 호출 단계가 명시 박제되지 않은 가능성. SessionEnd hook에 의존 — Master가 `/close` 입력 후 세션이 실제 종료될 때(transcript end) 자동 트리거되는 구조.

## F-118b — auto-close 규칙은 CLAUDE.md 문장 수준
"구현 검증 완료 시 /close 없이 자동 close 호출" (D-090, 2026-04-22) 룰이 텍스트로만 박혀 있고 enforcement hook은 별도 존재하지 않는다. 즉 자동 close = LLM 자가판단으로 `/close` 스킬을 호출하는 것이고, 수동 close = Master가 입력으로 호출하는 것 — **호출 경로는 동일하다는 가설**.

## F-118c — checklist 8단계 vs 14단계 표면 불일치 가능성
CLAUDE.md Session Protocol에는 8단계 checklist 박제. 실제 hook chain(`session-end-finalize.js` + `compute-dashboard.ts` + `build.js` + `auto-push.js`)은 더 많은 단계를 자동 수행. 8 vs 14 차이는 "Master 가시 단계" vs "hook 자동 단계"의 layer 분리에서 비롯.

## F-118d — current_session.json status 변경 주체 모호
자동 close 시 status="closed" 박제 주체 — `/close` 스킬이 박제하는지, finalize hook이 박제하는지, LLM이 직접 Edit하는지 명세 산재.

## F-118e — git commit message 패턴 차이 가설
자동 close → "session end: auto" 일률 메시지. 수동 close → topic-slug 포함. **단 이는 Dev 실측에서 반박됨** — Dev 분석은 27/30이 slug 포함, 3/30이 "auto" 포함으로 수동 close가 다수임을 보였다.

## F-118f — checklist drift 위험
8단계 중 4단계(decision_ledger 갱신·topic_index 갱신·master_feedback_log 갱신·role_memory 갱신)는 LLM 명시적 수행에 의존 — hook이 자동 검증하지 않으면 자동 close 시 누락 위험.

## Master 피드백 수용 (footnote)

본 구조 진단은 (1) 코드 경로를 단언했으나 실제 파일 검증 없이 가설로 제시, (2) git log·실측 commit 분포 등 운영 시야를 누락, (3) Master 재-close 흔적 등 인간 행동 데이터 미포함 — 시야 협소를 인정한다. F-118e는 Dev 실측으로 반박되었다. 본 limitation은 `feedback_arki_full_system_view.md`에 박제됐고, 향후 Arki 진단은 코드+운영+로그 3축 동시 점검을 기본으로 한다.

## 권고 (Dev 실측 후 재구성된 결론)

Master 결정 (2) **finalize hook delta-check** 채택 → 8단계 checklist 중 코드 검증 가능한 4단계(decision_ledger·topic_index·master_feedback·role_memory)에 대해 finalize hook이 close 직전 delta 0 여부를 판정, WARN 게이트 부착. F-118f 위험 mitigation으로 직결.
