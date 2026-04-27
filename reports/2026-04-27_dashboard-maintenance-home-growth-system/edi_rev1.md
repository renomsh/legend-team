---
session: session_117
topic: topic_113
topicSlug: dashboard-maintenance-home-growth-system
date: 2026-04-27
role: editor
revision: 1
---

# 대시보드 정비 — session.html 테이블 전환 + feedback.html 정비

## 컨텍스트
- topic_113 재사용(분기 A) — 기존 `completed` → `open` 전이 후 잔여 정비 항목 처리
- Grade B(Master 명시), L2 ace-framing 발동, executionPlanMode: none, Dev 직행
- Master 결정: Q1=(b) feedback.html, Q2=(b) 데이터·기능까지

## 구현 완료 항목

### 1. session.html — All Sessions 카드 → 테이블 전환 (P0, Master 명시)
- 카드형 `.hist-card` 리스트 → `.table .sess-table` 테이블로 전환 (canonical §14 .table 위임)
- 8 컬럼: Session / Topic / Date / Size / Decisions / Turns / Quality / Roles
- `.table-scroll` wrapper로 모바일 가로 스크롤 지원
- 행 hover 효과(rgba(16,185,129,.04)) + cursor:default
- 셀 클래스: `.td-id`(#06B6D4 SF Mono), `.td-topic`(ellipsis 340px max), `.td-date`(11px text-3), `.td-num`(tabular-nums right-align + .zero 색 약화), `.td-roles`(flex chip wrap)
- Quality 셀: `.dq-auto/.dq-backfill/.dq-manual` badge 색상 토큰 유지
- 빈 결과 처리: `<table>` hide + `#histEmpty` empty-state 노출
- 인라인 `.hist-card`/`.hist-sid`/`.hist-topic`/`.hist-date`/`.hist-meta`/`.hist-badge`/`.hist-roles` 6개 클래스 일괄 제거

### 2. feedback.html — 검색·필터·status 카운트·canonical 위임
- 상단 status counts 4종 패널 (`total / resolved / in-progress / pending`)
- `fb-search` 검색 입력 + `fb-filter` status 셀렉트 (search·filter 결합 필터링)
- `feedback-item` 좌측 3px border (status별 색: 🟢 resolved / 🟡 in-progress / 🔴 pending)
- 우상단 `fb-status-badge` (RESOLVED/IN PROGRESS/PENDING)
- decisions 매핑은 `.fb-decision-row + code` canonical 토큰 위임 (var(--accent-blue))
- XSS 방어: `escapeHtml()` 도입 (feedback/instruction/topic/decisions 전 필드)
- 데이터 검증: 111 entries × 3 status (resolved/in-progress/pending) 집계 확인
- 비어있을 때 `.empty-state` 위임

## 빌드 & 배포
- `node scripts/build.js` 통과 — dist/ 404 data files + 113 topics + 100 decisions
- dist/session.html: `.sess-table` 8행 적용 확인 (line 178)
- dist/feedback.html: `.fb-counts` 패널 적용 확인 (line 108)

## 미완료 / 다음 세션 후보
- decisions.html / deferrals.html / topic.html — 이번 세션 scope 외 (Master 1건 한정)
- Hook Success rate 개선(FIRED→FALLBACK 1 success 카운트) — 별도 토픽 분리 결정 (A3)
- ops `.session-table` legacy CSS 제거 검토 — 현 dashboard-ops.html에 정의돼 있으나 미사용

## 변경 파일
- `app/session.html` — style 블록 정리(50→25줄), renderHistory() 카드→테이블 교체
- `app/feedback.html` — 전면 재작성 (63→139줄, +counts +filter +search +escape)
