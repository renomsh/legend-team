---
topic: topic_060
topic_slug: pd-020a-p4-migration
role: dev
phase: execution-plan
revision: 1
date: 2026-04-21
report_status: approved
session_status: closed
accessed_assets:
  - memory/shared/topic_index.json
  - memory/sessions/session_index.json
  - topics/topic_001/topic_meta.json
  - src/types/index.ts
---

# PD-020a P4 — 마이그레이션 실행 결과

## 선행 수정: TopicIndexEntry 타입 정의 보강

P3에서 `create-topic.ts`에 `phase`/`hold` 필드를 추가했으나 `src/types/index.ts`의 `TopicIndexEntry` 인터페이스 업데이트가 누락돼 TS 컴파일 오류 발생. 본 세션에서 즉시 보강.

추가 필드: `phase`, `hold`, `heldAtPhase`, `holdReason`, `legacy`, `grade`

## Step 1: topic_index.json 마이그레이션

- 대상: 55개 엔트리 (phase 필드 없는 전체 → topic_060 제외)
- 적용: `phase: null, hold: null, legacy: true`
- 결과: **55개 완료**

## Step 2: topic_001/topic_meta.json 물리 파일

- `topics/topic_001/topic_meta.json`에 동일 필드 추가 완료

## Step 3: session_index topicId 백필

- 자동 매칭: reportPath slug 기반 → **51개**
- 수동 매칭: session_035→topic_031, session_042→topic_043 → **+2개**
- 소급 불가: session_005(v030-debt-close), session_006(deploy-fix-branch-unify) → topic_index 미등재 소급 세션
- **총 53개 / 55개 완료**

## 검증 결과

```
topic_index: 56개 중 56개 phase 있음, 55개 legacy:true
session_index: 55개 중 53개 topicId 있음
```

## 잔여 작업 (PD-020a P5)

- validate-topic-schema.ts로 마이그레이션된 엔트리 스키마 검증
- session_005/006 topicId 없음 허용 여부 Master 확인
