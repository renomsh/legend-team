---
topic: topic_001
title: 레전드팀의 shared asset 조회 프로토콜 설계
agent: ace
revision: 2
date: 2026-04-02
status: master-approved
---

## Topic Statement

레전드팀 시스템 내에서 shared memory(`memory/shared/`)에 저장된 자산(topic_index, decision_ledger, evidence_index, glossary, project_charter)을 각 역할이 어떤 규칙과 경로로 조회하는지에 대한 프로토콜을 설계한다.

## Decision Axes

1. **개방 vs 제한** — 역할별로 읽기 범위를 제한한다 (필수/선택 매트릭스)
2. **조회 시점** — 역할이 발언 전에 자동으로 조회하는가, 명시적 요청 시에만 조회하는가
3. **조회 깊이** — 인덱스만 볼 수 있는가, 원본 데이터까지 접근 가능한가
4. **강제 메커니즘** — 옵션 B 확정: 조회 매니페스트 + Riki 감사

## Scope

### In

- `memory/shared/` 내 파일들에 대한 역할별 읽기 접근 규칙
- 조회 타이밍 (자동 vs 수동)
- 조회 결과의 형식과 필터링 기준
- 역할별 가시성 매트릭스 정의
- 강제 메커니즘: accessed_assets 매니페스트 + Riki 감사

### Out

- 쓰기/수정 권한 설계 (별도 토픽으로 분리)
- `memory/master/` 접근 규칙 (Master 전용)
- `memory/roles/`, `memory/sessions/` 설계
- UI 또는 API 레이어
- 런타임 필터 (향후 승격 가능, 현재 범위 외)

## Key Assumptions

1. shared asset은 팀 공용 지식이며, 기본적으로 읽기는 허용되어야 한다
2. 역할별로 관심 영역이 다르므로 전체를 무차별 로드하는 것은 비효율적이다
3. Master 피드백 로그(`memory/master/`)는 shared와 별도 권한 체계를 가진다
4. 프로토콜은 파일 기반으로 구현되어야 한다 (런타임 서버 불필요)
5. evidence_index 조회는 전체 토픽에 걸쳐 가능하다 (기본값: 전체, 토픽 필터는 옵션)

## Confirmed Decisions

### 역할별 shared asset 조회 매트릭스

| shared asset | Ace | Arki | Fin | Riki | Editor | Nova |
|---|---|---|---|---|---|---|
| topic_index.json | 필수 | 선택 | 선택 | 필수 | 필수 | 선택 |
| decision_ledger.json | 필수 | 선택 | 선택 | 필수 | 필수 | 선택 |
| evidence_index.json | 필수 | 선택 | 선택 | 필수 | 필수 | 선택 |
| glossary.json | 필수 | 필수 | 선택 | 필수 | 필수 | 선택 |
| project_charter.json | 필수 | 선택 | 선택 | 필수 | 선택 | 선택 |

- Ace, Riki: 모든 자산 필수 (프레이밍 + 감사 역할)
- Editor: 합성에 필요한 4종 필수, charter는 선택
- Arki: glossary 필수, 나머지 선택
- Fin, Nova: 전부 선택

### 강제 메커니즘: 옵션 B

- 각 역할의 출력에 `accessed_assets: [...]` 필드를 포함
- Riki가 매트릭스 대비 과부족을 감사
- 향후 런타임 구현 시 옵션 C(런타임 필터)로 승격 가능

## Agent Sequence

| 순서 | 역할 | 과제 | 상태 |
|------|------|------|------|
| 1 | Ace | 프레이밍 | 완료 (master-approved) |
| 2 | Arki | 조회 프로토콜 구조 설계 | 대기 |
| 3 | Fin | 복잡도 비용 평가 | 대기 |
| 4 | Riki | 접근 제어 실패 모드 분석 | 대기 |
| 5 | Editor | 프로토콜 문서 합성 | 대기 |

## Open Questions (resolved)

1. ~~역할별 필수/선택 기준~~ → 매트릭스 확정 (Ace, Riki 필수)
2. ~~evidence_index 조회 범위~~ → 전체 토픽 가능
3. ~~강제 메커니즘~~ → 옵션 B (조회 매니페스트 + Riki 감사)
