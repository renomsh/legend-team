# Riki rev1 (condensed) — PD-063 적대적 감사

session_192 / topic_165 / Grade A / turn 1

> Master 발언 "점수 자체가 보드에 제대로 나온적이 없어"가 Arki 토대(stale 동작) 부정.

## Arki 검증 안 된 가정

§1·2·3는 registry 49건이 대시보드 렌더링됨 가정. 소비 경로 미검증. 세 가능성 동등 개방: (a) viewer 못 읽음 (b) panel 부재/hidden (c) score 전부 null. Option B는 어느 것도 미해결.

## 🔴 R-1. PD-063 = end-to-end 다중 단절의 한 마디
- **실재성 ◯** Master 증언
- **파손:** Option B 완료해도 보드 점수 0. 증상 닫고 본질 미해결.
- **mit:** scope 재정의 — "self-score → registry → dashboard 전체 loop 폐쇄". 게이트 = Master 보드 시각 확인.
- **fb:** 거부 시 Option B로 닫되 PD-064 즉시 등록.

## 🔴 R-2. Arki §1 표 한 축 누락 (소비단)
- **실재성 ◯**
- **파손:** "정공 끊김 + stale 동작 중" 단정 흔들림. 처음부터 미완성 가능. H3 약화.
- **mit:** Option 선택 전 grep 4건 — `metrics_registry` 소비 / `signatureMetrics` 소비 / app score 렌더 / compute-dashboard.ts read. 0건이면 R-1 확정.
- **fb:** grep 거부 시 H3 "추정"으로 격하.

## 🟡 R-3. Option B 보조 JSON = 실질 이중 SOT
- **실재성 △→◯** (가변 컬럼 시 50%+ 커버 가능)
- **파손:** 6개월 후 SOT 재질문 — PD-063 재발 변형.
- **mit:** 적용 전 커버율 측정. 50%+ 시 부적합. 25 부족 필드 명시.
- **fb:** D-158 표 schema 확장으로 이중 SOT 회피.

## K1 죽일 가설
"PD-063 = loop 미폐쇄 증상, 단독 복구 ROI 0"
- 성립: R-1 확정 + grep 0건 → 단독 금지, Grade S 승격 또는 PD 묶음
- 불성립: Option B 진행

## 패스 (3대 필터)
- "잔재 ≠ 의도적 폐기": 확신 미달
- "registry 부패": 실재성 미검증
- D-092 위반: 기여도 미달

## 권고
1. 즉시 grep 4건 (5분, 결정적)
2. 결과별 분기 (상/중/하)

### selfScores
- crt_rcl: 0.85 / cr_val: Y / prd_rej: Y / fp_rt: 0.15
