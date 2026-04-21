---
role: fin
session: session_059
topic: pd-020b-context-3layer
date: 2026-04-21
turns: [2]
phase: cost-evaluation
---

# Fin — 비용·자산 평가

## 1. 직접 비용 (방향성)

**런타임:**
- /close 1회당 추가 I/O: turn_log append + contribution.md write + brief 재생성 = 디스크 write 3회. 무시 가능.
- context_brief 토큰: 토픽당 ~500토큰 × hold=false N개 = 매 /open +500N. 활성 5개 안정 시 +2,500토큰. Sonnet cache_read($0.30/MTok) 영역이면 미미.

**구현:** 신규 파일 5개(스크립트 3 + 스키마 doc 1 + 로더 1). 6 Phase 순차 (v1 기준, v2에서 P0 추가로 7 Phase). 정량 추정은 Master 요청 시.

## 2. 비재무적 자산 가치 (D-017 핵심)

| 자산 | 변화 | 방향 |
|---|---|---|
| Master 인지 부하 | save01~05 폐지, 세션 진입 비용 ↓ | ↑↑ |
| 학습 연속성 | 토픽 단위 컨텍스트 자동 주입, 역할 학습 누적 정합성 ↑ | ↑↑ |
| 디버깅 가능성 | turn_log.jsonl 원본 보존, L2/L3 손상 시 재구성 | ↑ |
| 컨텍스트 부풀이 | 활성 토픽 누적 시 매 세션 입력 토큰 ↑ | ↓ (RK-3) |

## 3. 종합

직접 비용은 무시 수준. 비재무적 자산 이득(특히 Master 인지 부하 ↓)이 압도적. **투자 가치 +**.

## 4. Arki 실행계획 오염 감사

- 절대 시간 (D+N일/MM/DD): ✅ 없음
- 인력 배정 (담당자/PD/MM): ✅ 없음
- 공수 단위 (N시간/N일/공수): ✅ 없음

**통과.** Phase 분해·게이트·전제·롤백·중단 조건만 사용 — 구조적 선후 표현 적합.
