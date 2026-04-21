---
role: ace
session: session_059
topic: pd-020b-context-3layer
date: 2026-04-21
turns: [0, 5]
phase: framing + synthesis
---

# Ace — Framing & Synthesis

## 1. 프레이밍 (turn 0)

### 토픽 정의
**핵심 질문:** Master 수동 save01~05 관행을 대체할 3층 컨텍스트 누적 구조 설계·구현.

**배경:** PD-020a 완료로 topics/{id}/ 물리 디렉토리 확보. 컨텍스트 연속성이 Master 수동 저장에 의존 → 인지 부하 + 성장 루프 병목. D-051 A7+A8 구현 토픽.

### 결정 축 4개
1. turn_log 기록 시점 → /close 일괄 변환 권장
2. contribution 작성 주체 → 혼합(hook 골격 + Editor 본문) 권장
3. brief 재생성 트리거 → 매 /close 전체 재생성 권장
4. /open 로드 방식 → 자동 로드(hold=false 한정) 권장

### Scope
- **In:** 3개 파일 스키마+생성, 2개 신규 훅, /close 체인 통합, /open step 3.5 로더
- **Out:** UI 패널화(별도 토픽), PD-020c 영역, 소급 복원, hold 토픽 자동 로드

### 핵심 전제
- 🔴 PD-020a 완료 (확인됨)
- 🔴 current_session.turns[] 정상 기록 (검증 필요 → Riki RK-1로 부각됨)

### executionPlanMode: plan
Arki 실행계획 필요. Phase·게이트·전제·롤백·중단 조건 명세.

### Orchestration Plan
Arki → Fin → Riki → Ace 종합 → Dev → Editor. 함정 사전 고지: Arki에 schema evolution 고려, Fin에 비재무 자산 평가, Riki에 silent failure 패턴 경계.

---

## 2. 종합검토 (turn 5)

### 결정 축 최종
| 축 | 결론 |
|---|---|
| 기록 시점 | /close 일괄 변환 |
| 작성 주체 | 혼합 + RK-2 quality 플래그 |
| 재생성 트리거 | 매 /close 전체 재생성 |
| 로드 방식 | 자동 로드 + N>7 fallback |

### 산출물 정합성
- Arki v1 → v2 진화가 핵심 가치. Riki 3개 리스크 모두 흡수 → P0 신규(turns 검증), P3·P4 quality/degraded 분리, P6 N>7 fallback
- Fin: 비재무 자산 ↑↑ 평가 + 오염 감사 통과
- Riki: 침묵 실패(RK-2)·전제 위반(RK-1)이 결정적

### 잔여 갈등
없음. v2가 통합안.

### 추천 결정
**Arki v2 (7 Phase, P0~P6) 그대로 Dev 진입**

D-053 제안:
> Context 3층 누적 아키텍처 v1: turn_log(L1) × session_contributions(L2) × context_brief(L3). /open 자동 로드는 hold=false 한정, 활성토픽 N>7 시 현재 토픽만 로드 fallback. C1 프로토콜 강제화(P0) 선결.

### 다음 단계 권고
실집행은 새 세션으로 분할 (session_060+). 현 세션은 framing-complete로 종료.
