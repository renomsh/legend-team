---
role: ace
session: session_090
topic: pd031-topic082-parallel-integration
topicId: topic_095
grade: A
date: 2026-04-24
---

# Ace — session_090 프레이밍·종합

## 최초 프레이밍 (A1~A5 축)

| 축 | A극 | B극 | 결정 |
|---|---|---|---|
| A1 스코프 폭 | 진단+최소 | 진단+batch-helper+nav+반응형 | **B (축소판)** |
| A2 입력 도구 | YAML 직접 | batch-helper | 폐기로 전환 |
| A3 출력 통합 | nav 1건 | topic_082 전면 | nav + 반응형 골격만 |
| A4 실기입 유도 | 경고만 | 강제 hook | A (allowDefaultFallback=false로 충분) |
| A5 측정 기준 | 10세션 70% | 3세션 90% | A |

## Master 방향 전환

**"자가평가가 복잡하면 의미 퇴색"** → YAML 기입 전면 폐기. 시스템 자동 추출 + 10세션 리뷰 대화 구조.
**"가볍게 성장"** → signal 3~4개/역할, 단일 점수, 카드 클릭 드릴다운, 세션 구간 슬라이더, 역할간 미공유, ver1.00 시작.

## 중대 구조 발견 (scope 대전환)

**session_090 전반 Main(Opus)이 Grade A임에도 7역할 inline 시뮬레이션.** Master 지적: "팀의 존재 가치 없앰". Ace-as-relay 위반까지 발견(F-005). 원인 진단 변천:
1. (오진) 22세션 누적 부채 → Master 반박 철회
2. (오진) /open 스킬 invoke 누락 → Master '스킬 문제 아니다' 반박
3. (정진) **D-058 enforcement 공백** — 결정 박제만 있고 hook·schema 없음

## 종합 — D-066 (3층 방어)
- **L1 Schema**: turns[].invocationMode (진실 강제)
- **L2 Hook**: finalize Grade A+inline-main gaps 박제 (저마찰)
- **L3 Structural**: dispatch_config 4필드 (alwaysActive/conditionalDispatch/gradeAInlineBlock/gradeSInlineBlock)
- **폐기**: opus-dispatcher 스킬 enforcement 경로 (Soft-guide는 변수 아님)

## Signal v1.00 확정 (30개)
역할별 3~4개. 24🟢 자동 + 3🟡 F-태깅 + 3🔴 10세션 리뷰. 기존 36지표 중 9개 고비용 제거, 2개 신규(framing_acceptance, taboo_audit_hit).

## 다음 세션 권고
- topic_095 signal 수집 로직 구현 (Grade B)
- PD-032(페르소나 분리) / PD-033(서브 세션 지속성) / PD-034(visual_regression) 대기
