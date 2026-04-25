---
session: session_103
topic: topic_108
role: ace
rev: 1
date: 2026-04-25
---

# Ace 프레이밍 + 종합검토 — PD-041 test-regression MVP

## Step 0 — 토픽 분류
- topicType: implementation
- parentTopicId: topic_105 (session_100, PD-040/041 신설 세션)

## Step 0b — PD 교차검증
- PD-040: validate-schema-lifecycle.ts enum 박제 0건 → pending 확정 → 결국 session_103에서 **deprecated** (ROI 낮음, D-092 동류)
- PD-041: test-regression.ts 미생성, fixture 껍데기만 존재 → pending 확정 → 본 토픽에서 구현 완료

## 범위 축소 결정 (Master 주도, Ace 검증)
Master의 연속 질문으로 프레이밍 단계에서 핵심 scope 재정의:
1. PD-040 폐기 — 실 drift 0건, 육안 검출 충분, D-092 패턴 동류
2. PD-041 MVP — fixture 5종 설계 → 2종으로 축소. hook 편입·3중 차단·feature_flag 전부 폐기
3. D-092 정신 일관 적용: 자동 감시 인프라 = 실 incident 없이 선제 투자 금지

## Arki 자가인정 (session_103 핵심 사건)
Arki가 scopeDriftCheck 우회를 자가 인정:
- "5종 placeholder 카테고리를 spec으로 오독해 풀구현으로 갔습니다"
- hook 편입·feature_flag·3중 차단 = D-092 폐기 패턴을 24시간 만에 재이식

## 종합 판정
MVP(fixture 2개 + ~130 lines + 수동 CLI) 구현 완료. PD-041 resolveCondition 충족.
PD-043(역할 사칭 검증), PD-044(페르소나 정책 박제) 신규 등록.
