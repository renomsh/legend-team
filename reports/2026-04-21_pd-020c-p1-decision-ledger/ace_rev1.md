---
topic: topic_067
topic_slug: pd-020c-p1-decision-ledger
role: ace
phase: framing
revision: 1
date: 2026-04-21
report_status: approved
session_status: closed
accessed_assets:
  - system_state.json
  - decision_ledger.json
  - topic_index.json
---

# Ace — 경량 프레이밍 (L1, Grade B)

이번 토픽은 PD-020c P1으로 범위가 명확합니다.

**핵심 작업:** `decision_ledger.json` 기존 엔트리 전체에 `owningTopicId` + `scopeCheck` 두 필드 추가. 신규 스키마 타입 선언 → 백필 스크립트 실행 → 검증.

**전제:** D-055에서 확정된 강제강도 구조 — `owningTopicId`(🔴 하드, 필수), `scopeCheck`(🔴 하드, enum 4값: `topic-local|cross-topic|global|legacy-ambiguous`). 백필 기준: 기존 결정은 `legacy-ambiguous` 기본값, `owningTopicId`는 decision_ledger의 `sessionId` → topic_index 역매핑으로 추론.

**리스크 1개:** `owningTopicId` 역매핑 실패 시 `null` 허용 — Dev 판단으로 처리 (slug 역매핑 fallback으로 실제 null 0건).

Dev 직행.
