---
topic: 레전드팀 v0.4.0 업그레이드 검토
role: editor
revision: 1
date: 2026-04-05
status: approved
---

# Editor 정리 — v0.4.0 업그레이드 결정사항

## 결정 요약

| ID | 축 | 결정 | 내용 |
|---|---|---|---|
| D-010 | v0.4.0 범위 | B | 자동화 + 자산 실질화 |
| D-011 | 자동화 수준 | A | 스크립트 보조 (session-log.ts 확장) |
| D-012 | N-항목 처리 | A | v0.4.0에 포함 (프로토콜 문서 수준) |
| D-013 | v0.3.0 소급 | Master 지시 | session_003~006 성과를 v0.3.0으로 확정 |

## v0.4.0 실행 범위

### 포함
- H-01: 세션 체크리스트 자동화 (session-log.ts 확장)
- H-02: 로그 시스템 구조화
- N-01: evidence_index 운용 프로토콜 정의
- N-03: glossary 운용 기준 정의
- 스크립트 활성/deprecated 분류 및 정리
- generate-dashboard.ts vs build.js 역할 확정

### 제외
- M-02: 출력 포맷 전면 표준화 (점진적으로)
- 풀 오케스트레이션 (v0.5.0 이후 재검토)
- viewer 연동 (이미 가동 중)
- 새 에이전트 추가 / 역할 재정의

## 이미 완료된 항목 (이번 세션)
- session_index.json JSON 구문 오류 수정
- project.json v0.2.0 → v0.3.0
- master_preferences v0.3.0 이력 추가
- topic_005 등록 (topic_index.json)
- D-010~D-013 기록 (decision_ledger.json)
