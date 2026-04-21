---
role: riki
topic: PD-020c — 결정 소유권 + 운영규칙 구현
session: session_063
date: 2026-04-21
rev: 1
---

# Riki — 리스크 분석

## R1 🔴 critical
**P1-2 소급 백필 — 복수 축 세션 귀속 불가.** 예: session_017(복수 결정축).
→ 대응: `owningTopicId: null` + `scopeCheck: "legacy-ambiguous"` 예외 허용.

## R2 🟡 medium
**lifecycle 경고 noise화.** topic_044(COPD) 같은 의도적 장기 토픽이 매번 경고.
→ 대응: `topic_meta.json.expectedDuration` 명시 시 경고 제외.

## R3 🟡 medium
**앵커 lint 전수 경고 폭발.** 구 brief 앵커 없음.
→ 대응: `legacy: true` 플래그로 기존 brief 면제.

## R4 🟢 low
**Ace 실시간 append 누락.** Claude 몰입 중 잊을 가능성.
→ 대응: Editor 세션 종료 시 "언급됐지만 append 안 된 PD" 역검사 백업.

## 리스크 없는 영역
A6-1 핵심 스키마(신규 결정 강제만) — 깨끗함.
