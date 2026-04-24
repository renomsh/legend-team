---
session: session_097
topic: PD-030 PD 자동 전이 훅 확장 — children/git/교차검증/Step 0 재판정
role: ace
rev: 1
date: 2026-04-25
phase: framing + synthesis
---

# Ace — 프레이밍 + 종합검토

## Step 0. 토픽 생명주기 판정

**topicType: `implementation`**
PD-030 원문이 "구현 필요" 4축으로 명시. 상위 framing 토픽 없음 (D-057 이후 독립 설계항목).

**parentTopicId:** null

## Step 0b. PD 교차검증

| 항목 | 결과 |
|---|---|
| children 확인 | PD-030 연결 child 없음 |
| git log 확인 | `deferrals-apply`, `efficiency-test-and-deferrals` — PD-030 4축 확장 commit 없음 |
| artifacts 확인 | `resolve-pending-deferrals.ts` 존재, 자연어 매칭 1축만. 4축 미구현 |

**판정: ❌ 구현 전무 → 신규 구현 진입**

## 결정 축

- **축 1 (4축 전부 vs 분할):** 축 3(/open 교차검증) P0 우선, 나머지 가능 범위 내 구현
- **축 2 (git 매칭 엄격도):** 관대 suggest + commitType 태그 구분
- **축 3 (/open 통합 방식):** 스크립트 출력 확장 (별도 스텝 추가 X)
- **축 4 (Step 0 prompt):** ace-framing Step 0b가 이미 설계됨 — 이 세션 적용으로 갈음

## 범위

**In:** git log 스캔 축, /open 교차검증 출력, gitEvidence 필드 추가
**Out:** children→부모 PD 자동 전이, ace-framing 스킬 코드 수정

## executionPlanMode: plan

## 종합검토 (Riki 반영)

| Riki | 반영 방향 |
|---|---|
| R-1 🔴 session-end 오인 | implementation 타입 0건 PD → "구현 커밋 없음" 출력, "구현 확인 권장" 억제 |
| R-2 🟡 덮어쓰기 이력 소실 | append-or-update 방식 (hash 기준 upsert) |
| R-3 🟢 성능 | `--since="6 months ago"` 추가 |
| R-4 🔴 부트스트랩 | P4 검증 완료 후 resolved 처리 원칙 — dry-run 검증으로 충족 |
