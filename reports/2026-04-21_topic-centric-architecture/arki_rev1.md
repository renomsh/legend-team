---
role: arki
session: session_053
topic: topic-centric-architecture
topicId: topic_056
rev: 1
date: 2026-04-21
phase: structural-analysis
---

# Arki — 구조 분석 (초안 + 재호출 2회)

## 1. 현 스키마 의존 그래프 치명 지점

1. `session_index[].topicId` 단수 — 한 세션 다토픽 불가
2. `topic_index[].sessions[]` 필드 부재 — 역방향 조회 매번 전체 스캔
3. dashboard KPI 전부 "세션 for-loop" — 토픽 축 집계 레이어 없음

## 2. 현실 빈도 검증 (G4)

- N:1 (토픽>세션): topic_044 5+세션, legend-team-upgrade-v2 6세션, dashboard-upgrade 3세션 — 명백히 존재
- 1:N (세션>토픽): 현 스키마 기록 불가, 부수 결정으로만 암묵적 존재
- 1:1: 대다수

판정: N:1이 주류, 1:N은 소수·얕음. **비대칭 다대다**.

## 3. 초안 권고 → Master 피드백 반영

- 원안 A2: 양방향 배열 + 쓰기 훅
- Master 지적: N:1 단방향이 운영 효율 대비 우월
- **최종**: N:1 단방향 채택, 양방향 훅 제거 — 과설계 자인

## 4. 숨은 축 도출

- **A5**: topic `phase[]` 4단계
- **A6**: decision 1차 소유자 = 토픽 (`owningTopicId`)

## 5. Master 추가 제안 흡수

- **A7** (연계 토픽 자동 context 로드): 즉시 채택 — save01~05 관행 해소 경로
- **A8** (turn-log + session_contributions + context_brief 3층): 채택 — A7과 한 쌍, 둘 다 필요

## 6. phase × hold 직교화 (Master 최종 정제 수용)

1차원 enum에 hold를 섞으면 조합 폭발. 2차원 직교가 정확:
- `phase`: framing/design/implementation/validated
- `hold`: active/heldAt/heldAtPhase/reason

hold는 어느 phase에서든 삽입 가능, 해제 시 heldAtPhase 복귀.

## 7. 수정 규모 (최종)

| 영역 | 규모 |
|---|---|
| JSON 스키마 | S~M |
| append-session.ts | S (topic.sessions.push 1줄) |
| create-topic.ts | S (sessions[] 초기화) |
| compute-dashboard.ts | M (토픽 축 집계 추가) |
| /open 스킬 | S (context_brief 자동 로드) |
| /close 훅 체인 | M (contribution-writer + regenerate-brief 2개 신설) |
| UI | M (토픽 페이지 확장) |
| 52세션 마이그 | S (1회성) |

**Big bang 회피, 점진 이행 가능.**
