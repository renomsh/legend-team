---
topic: PD-023 구현 점검
session: session_100
role: arki
phase: structural-analysis
revision: 2
date: 2026-04-25
report_status: approved
session_status: closed
accessed_assets:
  - validate-schema-lifecycle.ts
  - topic_index.json
---

# Arki rev2 — Ace rev1 구조 검토

## 검토 결론

(b) 진단+분기 권고는 안전하나, Master가 Quick-win 채택 시 (c) 진행 가능. 2파일 모두 외부 의존 없음 + 단일 책임 → 회귀 리스크 낮음.

## 추가 구조 권고

- C8 추가: 스키마 거버넌스 트랙 신설 필요. operationalStatus·triggerType·absorbed enum이 PD/topic 양쪽에서 임시 활용 중. PD-020 거버넌스 트랙으로 이관하여 1회 박제 후 validate-schema-lifecycle.ts 갱신.
- 재호출 강제 원칙: PD 흡수 시 원본 statusNote 필수 (R-2 mitigation 재확인).
- PD-035 closing 조건: "8/8 mention 확인" + "행동 변화 검증은 후속 관찰" 분리 명시.

## 매트릭스 보강

P3-supplementary done 표기는 mention 확인 기준. 행동 변화(yaml-block 기록률 변화)는 P3 운영 KPI 트랙으로 분리.
