---
topic: topic_001
role: editor
revision: 1
date: 2026-04-02
status: approved
retroactive: true
contributing_agents: [ace, arki, fin, riki, editor]
nova_invoked: false
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

# 레전드팀 Shared Asset 조회 프로토콜 설계 — 최종 합산

> 소급 재구성 보고서 (retroactive). 원본 세션: 2026-04-02. 재구성: 2026-04-03.

## Executive Summary

각 에이전트가 어떤 공유 메모리 파일을 필수/선택으로 조회해야 하는지 정의한 visibility
matrix를 config/visibility.json으로 확정했다. 각 에이전트 정의 파일(agents/*.md)에
Shared Asset Protocol 섹션을 추가하여 프로토콜을 명문화했다. Riki가 매 세션 manifest
감사를 수행하는 역할을 맡는다.

## 확정 Visibility Matrix

| 자산 | Ace | Arki | Fin | Riki | Editor | Nova |
|---|---|---|---|---|---|---|
| topic_index.json | **required** | optional | optional | **required** | **required** | optional |
| decision_ledger.json | **required** | optional | optional | **required** | **required** | optional |
| evidence_index.json | **required** | optional | optional | **required** | **required** | optional |
| glossary.json | **required** | **required** | optional | **required** | **required** | optional |
| project_charter.json | **required** | optional | optional | **required** | optional | optional |

## 구현 산출물

- `config/visibility.json` — 권한 매트릭스 파일 (created)
- `agents/ace.md` — Shared Asset Protocol 섹션 추가
- `agents/arki.md` — Shared Asset Protocol 섹션 추가
- `agents/fin.md` — Shared Asset Protocol 섹션 추가
- `agents/riki.md` — Shared Asset Protocol 섹션 + manifest 감사 프로토콜 추가
- `agents/editor.md` — Shared Asset Protocol 섹션 추가
- `agents/nova.md` — Shared Asset Protocol 섹션 추가

## Riki Manifest 감사 프로토콜

Riki는 매 세션:
1. 이전 역할 출력의 `accessed_assets` frontmatter 수집
2. visibility.json required 항목과 대조
3. 누락된 required 항목 → Contradiction Log에 기록
4. 과도한 optional 접근 → 경고 (비차단)

## 미해소 질문

- 자동 validator 스크립트 구현 시기 → v0.3.0에서 검토

## 버전 노트

- 이 보고서는 v0.1.0 시점 작업의 소급 재구성 (retroactive reconstruction)
- 원본 에이전트별 debate 기록은 미복원 (원본 세션 파일 부재)
- v0.2.0 topic_002 세션에서 소급 처리 결정
