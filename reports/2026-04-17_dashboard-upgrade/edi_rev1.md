---
topic: dashboard-upgrade
session: session_027
date: 2026-04-17
roles: [ace, arki, fin, riki, dev, editor]
decisions: [D-024, D-025, D-026]
status: completed
---

# 대시보드 업그레이드 — 설계 확정 보고서

## 핵심 결론

레전드팀 대시보드를 **팀 업그레이드 투자판**으로 재정의한다.
"무슨 일이 있었나" → "팀이 좋아지고 있나 / 얼마로 / 어디서 비틀리나"

---

## 1. 결정 사항

### D-024 — 제안/채택 레이블링 룰 (Phase 0)
| 레이블 | 조건 |
|---|---|
| 명시적 채택 | decision_ledger D-번호 등재 |
| 묵시적 채택 | Master 개입 없이 다음 단계 진행 (비개입 = 통과·자율성 신호) |
| 기각 | master_feedback_log 기각 표기 |
| 보류 | pendingDeferrals PD-번호 등재 |

**채택률 = (명시적 + 묵시적 채택) / 전체 제안**

### D-025 — 대시보드 재설계 확정

#### 2뷰 체계
```
[공유 데이터 레이어]
session_index / topic_index / decision_ledger / feedback_log
role_call_log* / token_log* / asset_index / version_snapshots*
         │
         ├── 업그레이드 뷰 (팀이 좋아지고 있나)
         └── 과제 운영 뷰 (지금 뭐가 움직이나)
```

#### 업그레이드 뷰
- **최상단**: 자율성 카드 (masterTurns 연속값)
- U1. Growth Pulse — 버전 delta + 효율성 그래프
- U2. 역할군 성장추세 (5군)
- U3. 학습 폐쇄율 (Open/Reflected/Recurred 퍼널)
- U4. 자산 건강성
- U5. 비용 건강성

#### 과제 운영 뷰
- O1. 지휘판 (경보 카운터 배지)
- O2. 파이프라인
- O3. 최근 세션 (역순)
- O4. 결정·이연 레저

#### 5군 역할 평가
| 역할군 | 구성 | 성공 정의 |
|---|---|---|
| 프레이밍 | ace | 구조 잔존 + Master 수정 최소화 |
| 구조 | arki | 운영 부채 감소 |
| 검증 | riki | 적중 리스크 vs 과잉 경보 |
| 자원 | fin | 감사 적중 + 비용 해석 |
| 산출 | editor, dev | 재작업 없이 투입 가능 |

#### Phase 구조 (Bottom-up)
- Phase 0: 레이블 정의 (D-024, 완료)
- Phase 0.5: 발언 태깅 (proposal/audit/execution)
- Phase 1: 최소 가동 (원지표 7개)
- Phase 2: 해석지표 + 경보 룰
- Phase 3: 신규 파이프라인 (token_log 자동 수집 D-026)

#### 효율성 그래프 (U1 내부)
버블 차트 (ECharts)
- X: Size 스코어 (연속값)
- Y: 채택률
- 버블 크기: 사용량 % (토큰)
- 버블 색상: masterTurns (진할수록 개입 적음)

#### Size 공식
```
Size = (decisionAxes × 2) + rolesCalled + (rolesRecalled × 2)
     + (sessionsSpanned × 3) + (masterTurns × 1)
```
카테고리 없음. 연속값 사용.

#### 경보 룰 (7개, Phase 2)
R1 Ace 과호출 / R2 Master 병목 / R3 고토큰 저재활용
R4 역할 편중 / R5 피드백 재발 / R6 결정 미이행 / R7 경보 포화

### D-026 — SessionEnd Hook 구현 완료
- `.claude/hooks/session-end-tokens.js` 신규
- `memory/sessions/token_log.json` 신규
- `current_session.tokenUsage` 자동 삽입
- Phase 3a 경로 (i) 확정: transcript .jsonl 직접 파싱

---

## 2. 이연 항목

| ID | 내용 |
|---|---|
| PD-006 | Hook Windows 경로 이스케이프 검증 |
| PD-007 | token_log 중복 제거 로직 |
| PD-008 | masterTurns 분리 파싱 (Master 입력만) |

---

## 3. 주요 학습 (session_027)

- **LL-006**: 배제 대신 정교화. 허수 우려 있어도 정교화 경로 있으면 포함.
- **LL-007**: 자율성 = masterTurns 연속값. Binary 지표는 정보 손실.
- **LL-008**: Fin+Riki 병렬 → Arki 통합 재설계. Ace 완충 역할 금지.
- **LL-009**: 무응답 = 묵시적 채택. 비개입 = 자율성 신호.
- **협력적 사고 선언**: Master "내 말이 무조건 옳지 않아". Ace 능동적 반대 의견 표명 의무.

---

## 4. 토큰 사용량 (현 세션)

| 항목 | 값 |
|---|---|
| input_tokens | 488 |
| output_tokens | 104,271 |
| cache_creation | 386,885 |
| cache_read | 8,394,702 |
| **total_billable** | **8,886,346** |
| messageCount | 82 |

※ cache_read 94%. 실질 비용은 total의 ~15% 수준.
