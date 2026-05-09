# Riki — Phase 2 blind-parallel (실패모드, 12 skill 시기)

**결론**: A1(개수 90%) + hook 강제 차단 조합은 PoC 단계에서 결정 자체 재검토. 90% 측정 불가, 차단 blast radius = 세션 전체.

## §1 실패모드 6건

| ID | 시나리오 | mitigation |
|---|---|---|
| 🔴 F-1 | PreToolUse 차단 폭주 — pre-tool-use-task.js 752줄에 분기 추가 시 회귀 = 세션 전체 사망 | warn-only 우선 + bypass token 의무 |
| 🔴 F-2 | False positive — 키워드 트리거가 Master 일상 발언까지 매칭. "측정 위한 측정 금지"·"ROI 우선" 직접 위배 | grade≥B AND phase 교집합 + Master turn 제외 + shadow-mode FP<5% |
| 🔴 F-3 | False negative — verification-before-completion 등은 상태 추론 기반, 키워드 환원 불가 | auto-fireable vs intent-only 분류 |
| 🟡 F-4 | Description 거짓 (D2) — description 기반 trigger 매핑은 Prime D2 위반 | trigger_spec.json SOT + dry-run |
| 🟡 F-5 | 90% 측정 불가 — 분자·분모 ground truth 없음 | 분모 재정의 또는 FP/FN rate KPI 대체 |
| 🟡 F-6 | Hook chain 충돌 — PreToolUse 4중첩 + 재귀 spawn 가능 | HOOK_DEPTH guard + 별도 파일 + 2초 timeout |

## §2 전제 감사 — 4건 모두 검증 부족

- P-1 키워드 환원 가능성: **부분 거짓** (12개 중 상태 추론형 다수)
- P-2 차단 인프라 안정성: **검증 0건** (PoC=warn-only 의무)
- P-3 Master FP 1주 수용: **거짓 가능성 높음** (MEMORY: "자동 감시 ROI 0", "Master 인지 부담 단언 금지")
- P-4 "효율" 정의: 부등호 방향 불확실

## §3 모순 3건
- **M-1 D4 위배**: 키워드·grade 라벨 자체가 모델 판단 → enforcement 외피 안의 모델 의존
- **M-2 코딩훅 비유 함정**: 결정론적 이벤트 ↔ 의도 추론 이벤트 동일시
- **M-3 A1 90% ↔ ROI 우선**: 자동화 ROI<0 skill 강제 노이즈

## §4 거부 논리
1. 차단 모드 1차 적용 금지 (warn-only + shadow log 1~2주 의무)
2. 12개 skill 일괄 적용 금지 (결정론 trigger 명확한 2~3개 한정)
3. "90%" 숫자 KPI 박제 금지 (Prime D3 오염 위험)
4. pre-tool-use-task.js 직접 수정 금지 (신규 hook 별도 파일)

## §5 결정축 D 권고
**D2 (shadow-mode 1~2주) 단독 권고** → 실측 FP/FN 후 D1 bypass token 추가 → 차단 enforcement는 별도 후속 결정

```
[ROLE:riki] crt_rcl:0.85 cr_val:Y prd_rej:Y fp_rt:0.10
```
