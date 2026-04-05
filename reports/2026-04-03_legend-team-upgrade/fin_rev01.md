---
topic: legend-team-upgrade
role: fin
revision: 1
date: 2026-04-03
status: master-approved
accessed_assets:
  - file: decision_ledger.json
    scope: current_topic
---

# FIN — 비용/리소스 분석

## 업그레이드 작업 비용 추정

> 가정: Master + Claude Code 수행. 외부 인력 없음.

| 항목 | 난이도 | 예상 시간 | 상태 |
|---|---|---|---|
| 메모리 파일 초기화 스키마 확정 | 낮음 | 0.5h | v0.2.0 포함 |
| current_session 수동 기록 프로토콜 | 낮음 | 0.5h | v0.2.0 포함 |
| topic_index 갱신 프로토콜 | 낮음 | 0.5h | v0.2.0 포함 |
| decision_ledger 기록 | 낮음 | 0.5h | v0.2.0 포함 |
| reports/ 디렉토리 구조화 | 낮음 | 0.5h | v0.2.0 포함 |
| dashboard.html → internal-viewer.html | 낮음 | 0.5h | v0.2.0 포함 |
| **v0.2.0 합계** | | **~3h** | |
| TS 자동화 코드 | 중간 | 3-4h | v0.3.0으로 이연 |
| 로그 시스템 활성화 | 중간 | 1h | v0.3.0으로 이연 |

## 핵심 재무 판단

- **즉시 ROI 최고:** 메모리 스키마 확정 + reports/ 구조 생성
- **올바른 이연:** TS 자동화는 수동 프로토콜 검증 이후에 투자
- **v0.2.0 투자 대비 효과:** 시스템이 실제로 "작동"하는 상태로 전환됨

## Master 결정 반영

- 결정 1A: v0.2.0 = 메모리 초기화 + reports/ 구조. 이 범위로 비용 최소화.
- 결정 2A: 수동 프로토콜. TS 코드 비용 발생 없음.
