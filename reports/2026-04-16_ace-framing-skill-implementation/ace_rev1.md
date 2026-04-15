---
topic: ace-framing 자작 skill 실제 구현
topicId: topic_016
session: session_019
date: 2026-04-16
role: ace
rev: 1
---

# Ace — 프레이밍 + 종합검토

## 1차 프레이밍

**executionPlanMode: plan**

**Scope In:**
- `ace-framing` skill 파일 작성 (`.claude/commands/`)
- Superpowers brainstorming 3번(정교화 질문)·7번(spec self-review) 흡수
- 레전드팀 Observation Mode 프로토콜과의 통합

**Scope Out:**
- 다른 skill 파일
- Superpowers 전체 기능 재현
- UI/대시보드 변경

**결정 축:**
- 축 1: skill 구현 형태 → **skill 파일(.md) 확정** (Master 지시)
- 축 2: brainstorming 흡수 범위 → 3·7번 + 벤치마킹 4건(1·4·5·8) 전부 (Master 지시)
- 축 3: Ace 발언 프로토콜 연결 → ace-framing은 Ace 호출 또는 Master 직접 호출

## Master 개입 반영

| 개입 | 내용 | 반영 |
|---|---|---|
| Q1 | self-review는 전 역할에 필요 | 역할 공통 프로토콜로 격상 |
| Q2 | 보고서·HTML·차트 디자인 전담 | Editor 업그레이드로 수렴, 별도 토픽 이연 |
| Q3 | 벤치마킹 4건 모두 이번에 적용 | scope 확장 반영 |

## 종합검토

**확정 구현 목록:**
1. `.claude/commands/ace-framing.md` 신규
2. CLAUDE.md — git log 추가 (Session Start 2번)
3. CLAUDE.md — Ace 추천 근거 필수화 (Speaking order)
4. CLAUDE.md — 역할 공통 자가검토 프로토콜 신설
5. CLAUDE.md — Editor 리뷰 게이트 추가

**Ace 최종 추천:** 즉시 구현. 리스크 낮음, 롤백 용이. Phase 3(압력 테스트)는 Master 판단 후 별도 토픽.
