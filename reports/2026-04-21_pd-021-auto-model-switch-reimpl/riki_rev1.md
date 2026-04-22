---
role: riki
topic: PD-021 auto-model-switch 재구현 — Sonnet 메인 + Opus 서브에이전트
session: session_068
phase: analysis
date: 2026-04-22
---

# Riki — 리스크 감사

## 🔴 R-1. E1 "기술적 스키마 확인" ≠ "실제 동작 확인"
Arki §0의 스키마 확인은 실제 라우팅 검증이 아님. Sonnet 메인에서 opus 서브가 실제 Opus 4.7로 동작하는지 증거 없음.
→ **실측 프로브 필수.** 확인 전 child 구현 착수 금지.
→ **[결과] Probe 1 통과 — Opus 4.7 실제 동작 확인. R-1 기각.**

## 🔴 R-2. 서브에이전트 스킬 컨텍스트 미상속
Skill tool 로드 컨텍스트는 메인에만 존재. 서브는 ace-framing Step 0 등 스킬 구조를 상속받지 않음.
→ 핵심 역할(Ace 종합검토)에 스킬 본문 수동 주입 필요.
→ **[결과] Probe 3 — Opus 4.7 내재화로 경감. 스킬 주입 없이도 Step 0 수행. R-2 경감.**

## 🟡 R-3. 메인 Sonnet의 Master 신호 감지 저하
좌절 신호(feedback_revert_when_master_frustrated)·절충안 금지(feedback_no_middle_ground) 캐치는 메인 담당. Sonnet 급 충분한지 실측 전 불확실.
→ P4 검증 게이트에서 3세션 실측 필수.

## 🟡 R-4. Ace 종합검토 서브 비용 과소 산정
Ace 종합검토는 이전 역할 발언 전부 참조 → 입력 40~60k 토큰. Fin 산정의 "서브당 20k" 기준 초과.
→ Fin "75~80% 절감"을 "65~75%"로 하향 보정.

## 기각
- Turn Push C1 누락: A안 + hook으로 완화 가능. 구조 결정 후 운영 문제.
- Nova·Dev·Vera 서브화: 1차 범위 밖.
