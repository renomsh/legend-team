# Riki — PD-063 적대적 감사

session_192 / topic_165 / Grade A / turnIdx 1

> Master 발언 "점수 자체가 보드에 제대로 나온적이 없어"가 Arki 토대(stale 49건 표면 동작) 부정.

## 1. Arki 검증되지 않은 가정

Arki §1·§2·§3은 registry.json 49건이 대시보드까지 흘러 화면에 렌더링됨을 가정. 그러나 registry 파일 존재만 확인했지 **소비 경로**는 검증 안 함. Master는 이 흐름이 한 번도 닫힌 적 없다고 증언.

세 가능성 동등 개방:
- (a) registry 정상이나 viewer 못 읽음
- (b) viewer 읽으나 metric panel UI 부재/hidden
- (c) panel 있으나 score 필드 전부 null

Arki Option B는 (a)~(c) 어느 것도 해결 못함.

## 🔴 R-1. PD-063은 end-to-end 다중 단절의 한 마디

**실재성:** ◯ — Master 직접 증언.
**파손:** Option B 완료해도 보드 점수 0. PD-063 closed 박제되나 Master 체감 변화 0. 증상만 닫고 본질 미해결 패턴 재발.
- **mitigation:** PD-063 scope 재정의. "registry 복원" → "self-score → registry → dashboard end-to-end loop 폐쇄". 검증 게이트 = Master 보드 시각 확인.
- **fallback:** scope 확장 거부 시 Option B로 닫되 **즉시 PD-064 신규 등록** (소비 경로 검증·복구).

## 🔴 R-2. Arki §1 표 자체가 한 축 누락 (소비단)

**실재성:** ◯ — Master 발언 정확히 이 누락 축에서 터짐.
**파손:** Arki "정공 경로 끊김 + stale snapshot 동작 중" 단정이 흔들림. **처음부터 미완성**일 수 있음 — H3 의도적 폐기 가설도 약화. historical 해석 오기.
- **mitigation:** Option 선택 전 grep 4건 의무 — `metrics_registry` 소비 측 / `signatureMetrics` 소비 측 / app 내 score 렌더링 / compute-dashboard.ts read 경로. 결과 0건이면 R-1 확정.
- **fallback:** grep 거부 시 결정 박제에서 H3 가설을 "추정"으로 격하, "stale snapshot 동작 중" 삭제.

## 🟡 R-3. Option B "보조 JSON" 신설 = 실질적 이중 SOT

**실재성:** △→◯ — Master B안 컬럼 가변(weight 없는 role 등) 고려 시 보조 JSON이 메트릭 50%+ 커버 가능. 그 시점 보조가 정공이 됨.
**파손:** 6개월 후 "policy 표 vs 보조 JSON 어느 것이 SOT?" 재질문 — PD-063 재발 변형. Arki가 C에서 기각한 이중 SOT 위험을 B 이름으로 재도입.
- **mitigation:** 보조 JSON 적용 전 커버 필드 비율 사전 측정. 50%+ 시 Option B 부적합 재판정. 25 부족 필드(scale/weight/tier/정의)가 정확히 뭔지 명시.
- **fallback:** 보조 JSON 신설 대신 D-158 표 schema 확장(메타필드 포함). 이중 SOT 회피.

## 2. 죽일 가설 K1

"PD-063은 measurement loop 미폐쇄의 증상, 단독 복구 ROI 0"
- 성립 조건: R-1 확정 + R-2 grep 결과 소비 경로 0건
- 성립 시: PD-063 단독 금지. loop 전체 토픽으로 승격(Grade S 후보) 또는 PD 묶음
- 성립 안 함: Option B 진행 가능

**증거 균형:** Master 발언 + Arki 누락 축 = 가설 우세하나 grep 미실행으로 단정 불가.

## 3. 패스 (Riki 3대 필터)

- "잔재 ≠ 의도적 폐기": 확신 미달
- "registry 49건 부패": 실재성 미검증
- D-092 정합 위반: 기여도 미달(중복)

## 4. 권고

1. **즉시:** R-2 grep 4건 실행 (5분 미만, 정보가치 결정적)
2. **결과별:**
   - 소비 경로 존재 + 파손 → PD-063 + PD-064(소비 복구) 묶음
   - 소비 경로 부재 → Grade S 승격 검토 또는 measurement loop 종합 PD
   - 소비 경로 정상 → Option B 진행, R-1은 false alarm

---

### selfScores
- crt_rcl: 0.85 / cr_val: Y / prd_rej: Y / fp_rt: 0.15
