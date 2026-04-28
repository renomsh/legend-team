---
role: dev
session: session_132
topic: topic_127
revision: 4
date: 2026-04-28
phase: implementation
turnId: 0
grade: B
---

# Dev — P4 구현 (session_132)

## 작업 범위

CLAUDE.md 박제(D-E·D-F·D-G) + D-105 decision_ledger 등재 + `scripts/lib/topic-status.ts` SOT 헬퍼 신규 + `session-end-finalize.js` R-6 self-score scale 감지 추가.

---

## 구현 1 — CLAUDE.md 박제

`Topic Lifecycle System` 섹션에 두 서브섹션 신설:

### Topic Status SOT 정책 (D-F)
- SOT: `memory/shared/topic_index.json`
- mirror: `topics/{topicId}/topic_meta.json`
- 갱신 책임: `scripts/lib/topic-status.ts`의 `updateTopicStatus()` 헬퍼
- status enum 7종 (D-B) 명시

### Transition Checkpoint 정책 (D-C·D-E·D-G)
- trigger 어휘: `"구현 진입"` / `"approve-impl"`. `"진행해"` = D-020 전용 (혼용 금지)
- checkpoint 동작: 1회 알림만, tool blocker 아님
- 적용 범위: Grade A/B/S framing 토픽. C/D optional
- 활성화 조건: PD-052 resolved 이후

관련 스크립트 목록에 `topic-status.ts` 추가.

---

## 구현 2 — D-105 decision_ledger 등재

`memory/shared/decision_ledger.json` 첫 번째 엔트리로 추가:
- D-E trigger 어휘 분리 / D-F SOT 정책 / D-G 적용 범위 + 활성화 조건 공식 박제
- 구현 근거: CLAUDE.md 섹션 신설 + topic-status.ts 신규

---

## 구현 3 — scripts/lib/topic-status.ts (신규)

`updateTopicStatus(root, topicId, update)` 함수:
- SOT(`topic_index.json`) 갱신 성공 시 mirror(`topic_meta.json`) 동시 갱신
- SOT 실패 시 mirror 갱신 중단 (표류 방지)
- 반환: `{ sotUpdated, mirrorUpdated, warnings }`

런타임 검증: `sotUpdated: true, mirrorUpdated: true, warnings: []` PASS

---

## 구현 4 — session-end-finalize.js R-6

`checkSelfScoreScale(sess)` 함수 추가 (checkCommonPolicyCap 바로 앞 실행):
- turns[].selfScores 순회 → 숫자값만 [0, 100] 범위 검증
- `deferred` / `null` / `undefined` / Y·N 등 비숫자값 → skip (스케일 검증 대상 아님)
- 위반 시 `gaps: self-score-scale-violation` 박제

단위 테스트 4건 PASS:
- T1 정상 (Y/N 포함): OK
- T2 범위 초과(120): FAIL 검출
- T3 deferred + 정상 숫자: OK
- T4 selfScores 없는 turn: OK
