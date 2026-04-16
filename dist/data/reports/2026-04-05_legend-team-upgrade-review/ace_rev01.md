---
topic: 레전드팀 v0.4.0 업그레이드 검토
role: ace
revision: 1
date: 2026-04-05
status: approved
accessed_assets:
  - file: current_session.json
    scope: session_006 (closed)
  - file: decision_ledger.json
    scope: D-001 ~ D-009
  - file: topic_index.json
    scope: all_topics
  - file: project.json
    scope: version (v0.2.0 → v0.3.0 소급)
  - file: ace_rev01.md (topic_004)
    scope: 4개 축 승계
  - file: build.js
    scope: 빌드 파이프라인 구조 확인
  - file: data-loader.js
    scope: 뷰어 데이터 연동 확인
  - file: auto-push.js
    scope: 배포 흐름 확인
---

# ACE 종합검토 — 레전드팀 v0.4.0 업그레이드 검토

## 상황 인식

v0.3.0 소급 확정 (D-013): session_003~006의 성과(CF Pages 배포, 다중 페이지 뷰어, 역할 재정의, 운영 부채 폐쇄, main 브랜치 통일, build.js 파이프라인 가동)를 v0.3.0으로 인정.

topic_004에서 제기한 4개 축 중 축4(viewer 연동)는 이미 가동 중으로 제거. 3개 축으로 재구성.

## 내부 역할 논의 요약

**Arki**: build.js 파이프라인 이미 작동 확인. 스크립트 12개 중 활성 4, deprecated 1, 미확인 7. generate-dashboard.ts vs build.js 역할 충돌 가능성.

**Fin**: N-04 제거로 총 작업량 감소. 1~2세션 규모. session-log.ts 확장이 최고 ROI.

**Riki**: session_index.json 구문 오류 즉시 수정 필요(완료). 풀 오케스트레이션은 위험 — 스크립트 보조가 안전.

## 의사결정 3개 축

### 축 1: v0.4.0 범위 (D-010)
**결정: B — 자동화 + 자산 실질화**

### 축 2: 자동화 수준 (D-011)
**결정: A — 스크립트 보조**

### 축 3: N-항목 처리 (D-012)
**결정: A — v0.4.0에 포함 (프로토콜 수준)**

## Master 정정 반영
- v0.3.0 소급 확정 (D-013)
- 축4(viewer 연동) 제거 — 이미 가동 중
- Ace가 topic_004 프레이밍을 현재 시점에 갱신하지 않은 오류 인정

## 실행 우선순위

0. 즉시 수정 — session_index.json 구문 오류 + project.json v0.3.0 (완료)
1. 스크립트 정리 — 활성/deprecated 분류, generate-dashboard.ts vs build.js 역할 확정
2. 세션 자동화 확장 — session-log.ts 체크리스트 검증 추가
3. 자산 프로토콜 — evidence, glossary 운용 규칙
4. v0.4.0 선언
