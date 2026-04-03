---
topic: topic_001
title: 레전드팀의 shared asset 조회 프로토콜 설계
agent: editor
revision: 1
date: 2026-04-02
status: master-approved
contributing_agents: [ace, arki, fin, riki, editor]
accessed_assets:
  - file: topic_index.json
    scope: all_topics
  - file: decision_ledger.json
    scope: all_topics
  - file: evidence_index.json
    scope: all_topics
  - file: glossary.json
    scope: all_topics
---

## Executive Summary

레전드팀의 `memory/shared/` 자산에 대한 역할별 조회 프로토콜 확정:

1. **가시성 매트릭스** — `config/visibility.json`에 역할별 required/optional 정의
2. **조회 매니페스트** — 역할 출력 frontmatter에 `accessed_assets` 기록
3. **Riki 감사** — 매트릭스 대비 매니페스트 대조, contradiction log에 기록

## Visibility Matrix

| shared asset | Ace | Arki | Fin | Riki | Editor | Nova |
|---|---|---|---|---|---|---|
| topic_index.json | required | optional | optional | required | required | optional |
| decision_ledger.json | required | optional | optional | required | required | optional |
| evidence_index.json | required | optional | optional | required | required | optional |
| glossary.json | required | required | optional | required | required | optional |
| project_charter.json | required | optional | optional | required | optional | optional |

- evidence_index 조회 범위: 기본값 all_topics, 토픽 필터는 옵션

## Manifest Specification

```yaml
accessed_assets:
  - file: glossary.json
    scope: current_topic
  - file: decision_ledger.json
    scope: all_topics
```

- 미조회 자산은 기록하지 않음 — 부재 자체가 감사 신호

## Riki Audit Procedure

1. 선행 역할 출력에서 accessed_assets 수집
2. config/visibility.json의 required 항목과 대조
3. 필수 미조회 → contradiction log 기록
4. 선택 과다 조회 → 경고 수준 (non-blocking)

## Trip Wires

| 신호 | 임계 | 대응 |
|------|------|------|
| 역할 accessed_assets 누락 | 3개 연속 토픽 | Master 보고, 옵션 C 승격 검토 |
| visibility.json 동기화 실패 | 30일 미갱신 + 새 asset | Arki에게 갱신 요청 |
| Riki 감사 섹션 생략 | 2개 연속 토픽 | Master 개입 |

## Confirmed Decisions

| ID | 결정 | 출처 |
|----|------|------|
| D-001 | 역할별 필수/선택 매트릭스 채택 | Ace → Master 승인 |
| D-002 | 강제 메커니즘: 옵션 B (매니페스트 + Riki 감사) | Ace → Master 승인 |
| D-003 | 매트릭스를 config/visibility.json에 저장 | Arki |
| D-004 | 매니페스트를 frontmatter accessed_assets로 기록 | Arki |
| D-005 | TypeScript 타입에 AccessedAsset 추가 | Ace 추천 |
| D-006 | private memory 조회는 별도 필드로 분리 (설계만 예약) | Ace 추천 |

## Implementation

| 작업 | 파일 | 상태 |
|------|------|------|
| visibility.json 생성 | config/visibility.json | 완료 |
| output.json frontmatter 갱신 | config/output.json | 완료 |
| AccessedAsset 타입 추가 | src/types/index.ts | 완료 |
| agent .md 매니페스트 가이드 추가 | agents/*.md (6개 전부) | 완료 |
