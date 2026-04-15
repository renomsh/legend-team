---
topic: ace-framing 자작 skill 실제 구현
topicId: topic_016
session: session_019
date: 2026-04-16
role: arki
rev: 1
---

# Arki — 구조 분석 + 실행계획 + 구현 점검

## 원본 해체 분석 (9항목 → 흡수 분류)

| # | 원본 | 판정 |
|---|---|---|
| 1 | Explore project context | 벤치마킹 — git log 추가 |
| 2 | Offer visual companion | 제외 |
| 3 | Ask clarifying questions | **흡수 대상** |
| 4 | Propose 2-3 approaches | 벤치마킹 — 추천 근거 필수화 |
| 5 | Present design sections | 벤치마킹 — 섹션별 승인 (Ace re-call로 처리) |
| 6 | Write design doc | 이미 있음 (Editor) |
| 7 | Spec self-review | **흡수 대상 → 전 역할 확장** |
| 8 | User reviews spec | 벤치마킹 — 명시적 리뷰 게이트 |
| 9 | Transition to implementation | 이미 있음 (Arki 실행계획 D-016) |

## 구조 설계

- skill 위치: `.claude/commands/ace-framing.md` (open/close와 동일 경로)
- 3섹션: 발동 조건 / 정교화 질문 / 추천 근거·자가검토
- self-review: CLAUDE.md 역할 공통 프로토콜로 분리 (A안 채택)
- 섹션별 승인: Ace 오케스트레이션 re-call로 처리 (프로토콜 변경 없음)

## 실행계획

- Phase 1: skill 파일 작성 → Phase 1 완료 후
- Phase 2: CLAUDE.md 연결 → Phase 2 완료 후
- Phase 3: 압력 테스트 (Master 승인 시, 별도 토픽)

## 구현 점검 결과

5개 항목 전부 정상 적용 확인. 구조적 이상 없음.
