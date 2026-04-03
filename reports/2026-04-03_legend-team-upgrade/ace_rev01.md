---
topic: legend-team-upgrade
role: ace
revision: 1
date: 2026-04-03
status: approved
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

# ACE — 레전드팀 업그레이드 프레이밍

## 토픽 스테이트먼트

레전드팀은 현재 v0.1.0 — 어제(04-02) 생성된 초기 구조체다. 에이전트 정의, 워크플로우,
메모리 스키마가 파일로 존재하지만 실제 작동하는 로직(TS 코드)과 검증된 세션 이력이 없다.
업그레이드의 핵심 질문:

> "v0.1.0이 '구조체'로 그치지 않고 '실제 작동하는 전략 시스템'이 되려면 무엇이 바뀌어야 하는가?"

## 결정 축 (Decision Axes)

| 축 | 옵션 A | 옵션 B |
|---|---|---|
| 실행 방식 | prompt-driven (현상 유지) | TS 코드 오케스트레이션 |
| 메모리 | 파일 기반 유지 | DB(SQLite 등) 도입 |
| 인터페이스 | 파일/CLI 전용 | 경량 API 레이어 추가 |
| 노바 | speculative 유지 | 특정 조건 자동 승격 정의 |

## 스코프

**In:**
- 메모리 시스템 실질화 (빈 파일 → 스키마 있는 JSON)
- 역할별 출력 파일 실제 생성/저장 루틴
- 토픽 인덱스 자동 갱신 메커니즘
- CLAUDE.md ↔ 실제 운용 규칙의 갭 해소

**Out:**
- UI/대시보드 신규 생성
- 외부 API 통합
- Nova 자동화 로직

## 핵심 가정

1. Master는 파일 기반 검사 가능성(inspectability)을 유지하길 원한다
2. 에이전트 역할은 prompt-driven으로 계속 운용된다
3. 업그레이드는 기존 파일 구조를 깨지 않는 방향이어야 한다

## Master 결정 (2026-04-03)

- 결정 1: A — v0.2.0 = 메모리 초기화 + reports/ 구조만으로 선언
- 결정 2: A — 수동 기록 프로토콜 (Claude Code가 직접 파일에 기록)
- 결정 3: B — internal-viewer.html + CLAUDE.md 예외 명시
- 결정 4: 제안 구조대로 — reports/{date_topic}/{role}_rev{n}.md
- 결정 5: 유지 — Nova 현상 유지
