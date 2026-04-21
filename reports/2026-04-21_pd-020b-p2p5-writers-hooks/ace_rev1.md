---
topic: topic_064
topic_slug: pd-020b-p2p5-writers-hooks
role: ace
phase: framing
revision: 1
date: 2026-04-21
report_status: approved
session_status: closed
accessed_assets:
  - memory/sessions/current_session.json
  - memory/shared/system_state.json
  - memory/sessions/session_index.json
---

# Ace — L1 프레이밍 (Grade B)

P0+P1에서 turns[] 단일원천과 Context 3층 스키마(TS+검증)를 깔았으니, 이번은 **쓰기 파이프라인 3단과 훅 배선**이 전부입니다. 결정축은 없고 순차 구현이라 L1으로 충분합니다 — 다만 **session_060 L1 backfill은 스키마 위반 없이 fabrication 없는 데이터만 쓰는지**를 Dev가 명시적으로 체크하고 가야 합니다.

P2→P3→P4→P5 순서, 각 단계마다 validate-context-layers 통과를 게이트로 삼고 진행.
