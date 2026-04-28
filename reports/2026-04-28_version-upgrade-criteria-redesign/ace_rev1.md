---
session: session_127
topic: topic_125
role: ace
rev: 1
date: 2026-04-28
---

# Ace 프레이밍 + 종합검토

## Step 0. 토픽 생명주기 판정
- topicType: standalone
- parentTopicId: null
- Grade: A | orchestrationMode: manual

## Step 1. 토픽 정의
**핵심 질문:** "버전 번호가 실제 시스템 성숙도를 표현하려면, Decision 없이 이루어지는 실질 성장을 어떻게 포착해야 하는가?"

## Step 2. 결정 축
1. 트리거 범위: Decision 전용 → 구현·디버그·역할 강화 확장
2. 업데이트 주체: Ace 수동 vs 자동화
3. 증분 체계: 유지 vs 재설계
4. 소급: 신규 이후 vs 과거 소급

## Step 5. executionPlanMode: conditional

---

## 종합검토 — 단일 최적해

| 축 | 결정 |
|---|---|
| 트리거 범위 | 구현·디버그·역할 강화·시스템 조정 모두 포함. Decision 전용 폐기 |
| 업데이트 주체 | Ace 수동 + 훅 자동 전파 혼합 |
| 증분 체계 | 재설계. +0.1/+0.01/+0.001. **세션당 최대 +0.1 캡** |
| 소급 | 신규 이후만. legacy-gap 태그로 v1.65~v1.75 공백 마킹 |

**v1.75 → v1.85 (+0.1 구조 변경)**

**D-104 결정 박제** — 버전 bump 트리거 확장 + R1 임계값 Grade 구분 없이 ≥11 통일
