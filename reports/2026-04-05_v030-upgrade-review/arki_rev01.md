---
topic: v0.3.0 업그레이드 항목 검토 (운영 부채 청산)
role: arki
revision: 1
date: 2026-04-05
status: master-approved
accessed_assets:
  - file: scripts/build-report.ts
    scope: current implementation
  - file: scripts/run-debate.ts
    scope: current implementation
  - file: scripts/session-log.ts
    scope: current implementation
  - file: scripts/validate-output.ts
    scope: valid_statuses, required_fields
  - file: scripts/build.js
    scope: publish pipeline
  - file: app/js/data-loader.js
    scope: viewer data contract
  - file: app/topic.html
    scope: topic.path dependency
  - file: memory/master/master_feedback_log.json
    scope: JSON syntax error, D-007 inconsistency
  - file: memory/sessions/session_index.json
    scope: empty sessions array
  - file: reports/**/*.md
    scope: frontmatter status survey
---

# ARKI — 구조 점검 및 설계

## 레이어 구조 현황

시스템은 세 레이어로 구성되어야 하나 레이어 간 연결 계약이 없거나 깨져 있음.

```
[Source]   reports/{dir}/{role}_rev{n}.md  +  memory/*.json
              ↓  (연결 계약: 없음 또는 수동)
[Pipeline] build.js  +  build-report.ts
              ↓  (연결 계약: manifest.json = 파일 목록만)
[Viewer]   app/*.html  ←  data-loader.js
```

## 항목별 현황

### OP-01 — master_feedback_log.json (데이터 오류)
- JSON 구문 오류: line 35-36 `}` 중복. 파싱 불가. feedback.html 표시 불가 상태.
- D-007 값 불일치: MF-002 = "reports/+memory/shared/ 일부만" vs decision_ledger = "전체 배포(memory/master/ 포함)"
- 수정 범위: 데이터 fix만. 코드 변경 없음.

### OP-02 — build-report.ts (역할 재정의)
현재: `topics/{topicId}/debate_log.json` 의존 → 존재하지 않는 경로. 죽은 코드.
`topics/` = topic_001 하나만 존재. v0.1 legacy 데이터.

**확정된 새 계약 (Master 승인):**
```
input:  topic_index.json  +  reports/{YYYY-MM-DD}_{slug}/*.md
output: published/topics_manifest.json
        published/decisions_summary.json
        published/topics/{slug}/manifest.json  (선택적)
```

**확정된 구조 (설계 확정 A — Master 승인):**
- `build-report.ts` = standalone publish compiler (독립 실행)
- `build.js` = packaging only (published/ → dist/로 복사)
- `published/` 디렉토리 신설 필요

파이프라인:
```
ts-node scripts/build-report.ts
   → published/topics_manifest.json
   → published/decisions_summary.json

node scripts/build.js
   → dist/data/memory/...
   → dist/data/reports/...
   → dist/data/published/...
   → dist/data/manifest.json
```

### OP-03 — run-debate.ts (legacy 처리)
`topics/{topicId}/debate_log.json` 의존. build-report.ts와 동일 구 시스템.
처리: `scripts/_archived/run-debate.ts`로 이동 + deprecated 마킹.
`topics/topic_001` 디렉토리: historical artifact — 삭제 금지.

### OP-04 — session start/end 실행 확인 루프
`session-log.ts`: 코드 정상. 실행 기록 0건 (session_index.json sessions: []).
5개 세션 동안 단 한 번도 호출되지 않음.

**확정된 방식 (Master 보정):**
- 즉시: `current_session.json`에 `sessionLogCalled` 플래그 추가 (임시 장치)
- 운영 기준: 다음 세션 시작 시 `session_index.json` 대조 (원장)
- 플래그는 보조, 원장은 session_index

### OP-05 — frontmatter migration + strict validate 정책
이상 파일:
- `2026-04-02_.../ace_rev01.md`: `topic: topic_001` (ID값), `retroactive: true` (비표준)
- `2026-04-03_.../ace_rev01.md`: `status: approved` (혼용)
- `2026-04-04_v030.../ace_rev01.md`: `status: partial (세션 중...)` — validate-output.ts 기준 invalid

**확정된 정책 (설계 확정 B — Master 승인):**
- `master-approved`로 단일화
- `approved`는 `master-approved`로 migration
- 신규 파일(이번 세션부터): validate-output.ts 통과 필수

### OP-06 — 감사 trail 보정
- session_index.json: 소급 불가 → gap 기록 후 이번 세션부터 시작
- MF-002 D-007 불일치: OP-01로 해결
- topic.html path 다중 fallback: OP-02(published/ 도입) 이후 정리

## 의존성 그래프 — 실행 순서

```
OP-01 (데이터 fix)               — 독립, 즉시
OP-03 (run-debate.ts archive)    — 독립, 즉시
OP-05 (frontmatter migration)    — 독립 (정책 확정 후 → 확정됨)
OP-06 (감사 trail)               — 일부 OP-01 의존
OP-04 (session 확인 루프)        — current_session.json 스키마 변경
OP-02 (build-report.ts 재설계)   — 모두 완료 후 실행 권장
```

## Master 확정 사항

- 설계 확정 A: build-report.ts = standalone publish compiler, build.js = packaging only ✓
- 설계 확정 B: status = master-approved 단일화 ✓
- OP-04 보정: sessionLogCalled 플래그(임시) + session_index 원장(최종) 2단계 ✓
