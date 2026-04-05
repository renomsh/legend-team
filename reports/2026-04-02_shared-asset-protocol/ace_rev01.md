---
topic: topic_001
role: ace
revision: 1
date: 2026-04-02
status: approved
retroactive: true
accessed_assets:
  - file: topic_index.json
    scope: all_topics
  - file: decision_ledger.json
    scope: all_topics
  - file: evidence_index.json
    scope: all_topics
  - file: glossary.json
    scope: all_topics
  - file: project_charter.json
    scope: all_topics
---

# ACE — Shared Asset 조회 프로토콜 설계 프레이밍

> 소급 재구성 보고서 (retroactive). 원본 세션: 2026-04-02. 재구성: 2026-04-03.

## 토픽 스테이트먼트

각 에이전트가 판단을 내리려면 공유 자산(topic_index, decision_ledger, evidence_index,
glossary, project_charter)에 접근해야 한다. 그러나 어떤 역할이 어떤 파일을 언제
조회해야 하는지에 대한 명시적 규칙이 없으면, 에이전트 간 정보 비대칭과 책임 불명확이
발생한다.

> "각 역할이 어떤 공유 자산을 필수로, 어떤 것을 선택적으로 조회해야 하는가?"

## 결정 축

| 축 | 옵션 A | 옵션 B |
|---|---|---|
| 조회 의무 | 전 역할 전 파일 필수 | 역할별 차등 필수/선택 |
| 강제 방식 | 코드 강제 | 프로토콜 명문화 |
| 감사 주체 | 자동 검증 스크립트 | Riki가 manifest 감사 |

## 확정 범위

**In:** 역할별 조회 권한 매트릭스 (visibility matrix) 설계, agents/*.md에 프로토콜 명시
**Out:** 자동 조회 코드 구현, 외부 데이터소스 연결

## 핵심 가정

1. 에이전트는 prompt-driven — 조회 의무는 프로토콜로 강제
2. Riki가 manifest 감사 역할 수행 (자동화보다 먼저)
3. 필수/선택 구분이 명확해야 Riki 감사가 실효성 있음

## 결과

→ config/visibility.json 생성 (visibility matrix 확정)
→ agents/*.md 각각에 Shared Asset Protocol 섹션 추가
