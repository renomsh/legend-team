---
role: fin
topic: PD-021 auto-model-switch 재구현 — Sonnet 메인 + Opus 서브에이전트
session: session_068
phase: analysis
date: 2026-04-22
---

# Fin — 비용·자원 평가

## Arki 실행계획 오염 감사
금지어 0건. Clean.

## 비용 비교 (directional, session_067 기준값)
| 모드 | 추정 비용 | vs Opus 통짜 |
|---|---|---|
| Opus 통짜 (현재 A grade) | ~$50 | 100% |
| Sonnet 통짜 | ~$10 | 20% |
| Dispatcher-Worker (제안) | ~$9~12 | ~20~25% |

**핵심**: Dispatcher-Worker ≈ Sonnet 통짜 비용 + Opus 품질 역할 발언. ~75~80% 절감.

## 비용 역전 구간
- 짧은 세션(20~30 msg): 서브 고정비 지배 → 역전 가능
- 재호출 10회+: cache_creation 누적 → 수렴
- 평균 Grade A(60~150 msg): 안전 구간

## 비재무 자산
| 자산 | 평가 |
|---|---|
| 역할 발언 원문 | A안(파일 write) 시 동등 이상 |
| 학습 루프 | A안 채택 시 중립 |
| Master 인지부하 | + (저마찰 원칙 정합) |
| Ace 오케스트레이션 학습 | + (명문화) |

## 수익 프로파일
- Grade A 세션당 ~$40 절감. 월 10세션 기준 ~$400/월.
- 절감분을 S grade Opus 1M 또는 Nova 촉발 여유로 재투자 가능.
