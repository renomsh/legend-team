---
topic: topic_059
topic_slug: pd-020a-p3-writer-enforce
title: PD-020a P3 — create-topic.ts·append-session.ts writer 강제
role: dev
phase: execution-plan
revision: 1
date: 2026-04-21
report_status: approved
session_status: closed
accessed_assets:
  - scripts/create-topic.ts
  - scripts/append-session.ts
  - src/types/index.ts
  - scripts/validate-topic-schema.ts
  - memory/shared/topic_phase_catalog.json
  - memory/shared/hold_reasons_catalog.json
---

## 구현 요약

PD-020a P3 — D-052 스키마의 phase×hold 필드를 writer 스크립트에 강제 기록.

## 변경 파일

### `src/types/index.ts`
- `TopicHoldState` 인터페이스 신설 (`heldAt`, `heldAtPhase`, `reason`, `note?`)
- `TopicIndexEntry`에 필드 추가:
  - `phase?: string | null` — topic_phase_catalog enum
  - `hold?: TopicHoldState | null` — null = active(보류 없음)
  - `grade?: string` — S/A/B/C

### `scripts/create-topic.ts`
- `topic_meta.json` 생성 시 `phase: "framing"` + `hold: null` 강제 기록
- `topic_index.json` 엔트리에 `phase: "framing"` + `hold: null` 강제 기록
- 3번째 positional arg로 `grade` 수용 (S/A/B/C 외 값 경고 후 무시)
- `VALID_GRADES` Set으로 유효값 가드

### `scripts/append-session.ts`
D-051/D-052 필드 전면 추가:
- `--topicId` — N:1 단방향 링크 (topic_index ↔ session_index)
- `--grade` / `--gradeDeclared` / `--gradeActual` — 선언·실측 grade
- `gradeMismatch` — gradeDeclared !== gradeActual 자동 계산
- `--plannedSequence` — comma-separated role list
- `--turns` — Turn[] JSON 문자열 (D-048 스키마)
- `SessionEntry` 인터페이스에 위 필드 반영

## 검증 결과

- `npx tsc --noEmit` → 오류 없음
- `create-topic.ts` dry-run (topic_060 생성): topic_meta.json `phase:"framing", hold:null` 확인
- `validate-topic-schema.ts topic_060` → OK
- `append-session.ts` dry-run (session_test_p3): `topicId, gradeDeclared, gradeActual, gradeMismatch, turns, plannedSequence` 구조 확인
- 테스트 엔트리 cleanup 완료

## 잔여 작업 (P4/P5)

- P4: `migrate-to-topic-centric.ts` — 56개 topic_meta.json legacy 소급, 52개 session topicId 백필
- P5: validator 전수 통과 + dashboard 무회귀 검증
