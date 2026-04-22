---
topic: "3세션 Grade A 토픽에서 비용 절감률·Master 신호 감지·재호출 분포 실측"
topicId: topic_072
session: session_069
role: ace
rev: 1
date: 2026-04-22
---

# P4 실측 검증 — Grade A 3세션 비용·신호·재호출 분포

## 측정 범위
- 대상: session_066, session_067, session_068 (전부 Grade A)
- 데이터 소스: token_log.json (비용), session_index.json turns[] (재호출)

---

## 1. 비용 절감률 (Fin 계산)

| 세션 | 실제 비용 | 캐시 無 가상 비용 | 절감액 | 절감률 |
|---|---|---|---|---|
| session_066 | $2.56 | $13.32 | $10.76 | **80.8%** |
| session_067 | $10.09 | $56.92 | $46.83 | **82.3%** |
| session_068 | $14.10 | $64.24 | $50.14 | **78.1%** |
| **평균** | **$8.92** | **$44.83** | **$35.91** | **80.4%** |

캐시 히트율: session_066(96.0%) → session_067(95.3%) → session_068(92.8%)
session_068 소폭 하락은 Dispatcher-Worker 구조 도입 1회성 비용으로 판정.

---

## 2. Master 신호 감지율 (정의 재설계)

**기각된 정의:** masterTurns(전체 발언) / 재호출 수 → 분모 왜곡 (session_068 masterTurns=34는 Probe Q&A)

**채택된 정의:** 재호출 원인 분포 자체를 지표로 사용

| recallReason | 건수(Grade A 10세션) | 비율 |
|---|---|---|
| post-master | 10 | 47.6% |
| post-intervention | 7 | 33.3% |
| post-roles (Ace 자율) | 3 | 14.3% |
| master-request | 1 | 4.8% |

→ 재호출의 81%가 Master·외부 개입. Ace 자율 재호출 14%.

---

## 3. 재호출 분포 (3세션 한정)

| 세션 | 총 turns | 재호출 | Master-triggered | Ace 자율 |
|---|---|---|---|---|
| session_066 | 7 | 2 | 1 | 1 |
| session_067 | 8 | 3 | 2 | 1 |
| session_068 | 6 | 1 | 0 | 1 |
| **합계** | **21** | **6** | **3 (50%)** | **3 (50%)** |

표본(3세션)이 작아 전체 10세션 데이터 병기 필요.

---

## 4. Riki 검증 결과

- 가정 A (token_log 정확성): ✅ 유효 (cliSessionId=null 🟡 잔존 위험)
- 가정 B (turns[] recallReason): 🟡 조건부 유효 (기록 주체 검증 불가)
- 가정 C (masterTurns ≈ Master 신호): 🔴 기각 → 재정의로 대응

---

## 5. 결론

| 축 | 상태 | 수치 |
|---|---|---|
| 비용 절감률 | ✅ 확인 | 평균 80.4% |
| 재호출 분포 | ✅ 기준선 확보 | Master주도 81%, Ace자율 14% |
| Master 신호 감지율 | 🟡 재정의 | 분포 기반으로 전환 |

다음 세션(070, 071)에서 캐시 히트율 회복 추적 및 Ace 자율 비율 증가 여부 모니터링 권장.
