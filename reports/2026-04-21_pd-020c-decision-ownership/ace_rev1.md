---
role: ace
topic: PD-020c — 결정 소유권 + 운영규칙 구현
session: session_063
date: 2026-04-21
rev: 1
---

# Ace — Framing + 종합검토

## Purpose
"결정이 어느 토픽에서 나왔고, 어느 토픽에만 적용되는가"를 시스템이 강제한다. PD-020a(스키마)·PD-020b(Context 3층)는 토픽 내부 정돈. PD-020c는 **토픽 간 경계** — 결정 소유권, 토픽 수명, 인용 진위.

## In-Scope
- A6-1: `decision_ledger.json`에 `owningTopicId` + `scopeCheck` 필드
- A6-2: `topic_lifecycle_rules.json` 신설 (maxSessions=5, lastActivity=30일, hold 제외)
- A6-3: `context_brief.md` 출처 앵커 규칙 (`[turn_log:session_NNN:turnIdx]` / `[D-NNN]`)
- A6-4: Ace 실시간 PD append 프로토콜

## Out-of-Scope
- Grade 재판정 알고리즘
- 역할 페르소나 변경
- 대시보드 UI 시각화

## 결정축 최종 확정
- **D1 scopeCheck**: 4값 enum — `topic-local` | `cross-topic` | `global` | `legacy-ambiguous`. 의심 시 기본값 `cross-topic` + `relatedTopics`. `global`은 CLAUDE.md 등재 동반.
- **D2 lifecycle**: 경고만. /open 시 stale 후보 브리핑, 자동 전환 없음. `expectedDuration` 예외.
- **D3 앵커**: 경고만. lint 리포트, Editor 차단 없음, legacy 면제.
- **D4 PD append**: 발언 직후 즉시. Editor 세션 종료 시 역검사 백업.

## 강제 강도 재분류 (Master 지적 "과부화 회피" 반영)
| 요소 | 강도 | 근거 |
|---|---|---|
| A6-1 owningTopicId | 🔴 하드 | 데이터 정합성, 회복 불가 |
| A6-2 lifecycle | 🟡 경고만 | 과부화 위험 (grade 선례) |
| A6-3 앵커 | 🟡 경고만 | 세션 마감 방해 회피 |
| A6-4 실시간 append | 🔴 하드 | 휘발 방지, Editor 백업 |

## executionPlanMode
`plan` — Arki 실행계획 P1~P3 확정.

## 다음 액션
구현은 별도 세션 오픈 권장 (PD-020a/b 전례). P1부터 순차 진행.
