---
session: session_115
topic: topic_113
topicSlug: topic113-ops-build-freshness-remove
date: 2026-04-27
role: editor
revision: 1
---

# 대시보드 정비 — ops Build Freshness 제거 + Growth/People 통합

## 구현 완료 항목

### 1. Ops 보드판 — Build Freshness 카드 제거 + 글자 크기 균일화
- `app/dashboard-ops.html`: Build Freshness 카드(`cards[0]`) 제거
- `command-value` 인라인 `font-size` style 전체 제거 → CSS 기본값 48px 적용
- 결과: 모든 KPI 수치 동일 폰트 크기, 반응형 유지

### 2. Growth + People 통합 — 단일 캐릭터 성장 페이지
- `app/growth.html` 전면 재작성:
  - §1 Axis Pulse — 역할별 6축 레이더 (4칸 그리드)
  - §2 Roles — 8 캐릭터 카드 (Integrity Score + 역할색 도트)
  - §3 Drill — 역할 선택 시 세션별 성장 상세
  - §4 Raw aggregates — `<details>` collapsed 기본값
  - view selector로 axis/roles/drill 전체 동기화
- `app/people.html`: redirect stub (meta refresh + JS → growth.html)
- `app/_redirects`: `/people.html → /growth.html 301` 추가

### 3. 홈 hub card 4→3 정리
- `app/index.html`: People hub card 제거
- Growth sub-text: "8 characters · 6 axes · growth tracking"
- `app/partials/sidebar.html`: People nav-group + nav-item 제거

### 4. 역할 색상 통일 (role_registry.json v1.1)
- `memory/shared/role_registry.json` v1.0→v1.1: 6개 역할 색상 동기화
  - ace: #FF6B6B→#8B5CF6, arki: #845EC2→#06B6D4, fin: #00C9A7→#F59E0B
  - riki: #FFC75F→#EF4444, nova: #F9F871→#10B981, dev: #4D96FF→#3B82F6
- growth.html: `ROLE_COLOR[role.id]` 우선 참조 (role.color stale 제거)
- 홈·growth·role-signature-card 4개 출처 팔레트 정렬

## 빌드 & 배포
- `node scripts/build.js` 실행 완료 → dist/ 반영
