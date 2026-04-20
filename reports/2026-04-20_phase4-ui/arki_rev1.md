---
role: arki
topic: Phase 4 — UI
session: session_049
date: 2026-04-20
rev: 1
---

# Arki — Execution Plan

Phase 4 Phase A~D 분해 (executionPlanMode: plan).

## Phase A — 선결 정비 (Editor)
- `<details>` 접이식 전환 (session.html:112-114)
- AGENT_ORDER에 dev 편입 + sequence 패널은 turnSequences 독립 렌더 주석
- 게이트: <details> 기본 접힘·agentProgress 정상·build.js 통과

## Phase B — sequence 패널 프로토타입 (Vera 직접)
- D3 v7 CDN + `#sequencePanelCard` + renderSequencePanel()
- 위치: roleFreqChart 직후
- 게이트: 10행 이하 렌더·호버·콘솔 에러 0·--text-2 사용·read-only

## Phase C — 메모리 반영
- vera_memory.skills 매트릭스 + invocationMode + "토큰 신규 추가 여부" 우선 판정자 명시
- design_rules.json 신설 (R-D01·R-D02)

## Phase D — 템플릿화
- app/js/sequence-panel.js 모듈 분리
- vera_memory.templates.sequencePanel: confirmed 등록

## 전제
- turnSequences 구조 불변, D3 CDN 가용, Viewer Policy 준수

## Fin 오염 감사: 금지어 0건 (시간·공수·담당 없음), 통과
