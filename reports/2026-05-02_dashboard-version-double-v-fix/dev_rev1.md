---
session: session_169
topic: topic_146
role: dev
rev: 1
date: 2026-05-02
---

# Dev — Dashboard 버전/UI 수정 보고

## 수정 사항 요약

### 1. vv0.01 중복 v 버그 수정
- **원인**: `project_charter.json`의 `version` 필드가 `"v0.01"` (이미 v 포함) 인데, 클라이언트 3곳에서 `v` 재 prepend → `vv0.01`
- **수정 위치**:
  - `app/js/nav.js` — `startsWith('v')` 조건 추가
  - `app/index.html` — hero version 표시 로직 수정
  - `app/dashboard-upgrade.html` — heroLabel + sidebarVersion 로직 수정
- **참고**: `sync-system-state.ts:163`의 `.replace(/^vv/, 'v')` 방어 로직과 정합

### 2. VERSION KPI 레이블 → "Legend Nexus"
- `app/index.html` hero KPI 카드의 `hm-k` 클래스 텍스트: `"VERSION"` → `"Legend Nexus"`

### 3. 에이전트 카드 추가 (JOBS, SAGE, ZERO)
- 11개 역할 카드 전체 재구성
- 신규 추가: JOBS (#F97316), SAGE (#818CF8), ZERO (#64748B)
- 최종 색상 팔레트:
  - ACE #8B5CF6, JOBS #F97316, ARKI #06B6D4, FIN #F59E0B, RIKI #EF4444
  - DEV #3B82F6, EDI #84CC16, VERA #D946EF, ZERO #64748B
  - NOVA #10B981, SAGE #818CF8
- JOBS·ZERO: solid border (상시 호출), NOVA·SAGE: dashed border

### 4. 에이전트 순서 재정렬
- Jobs 2번째 위치, Zero는 Nova 앞에 배치
- 상시 호출 역할 앞쪽 배치

### 5. EDI 색상 수정
- #9CA3AF (gray) → #E4A83C (warm gold, FIN과 유사) → #14B8A6 (teal, NOVA와 유사) → #84CC16 (lime, 최종 확정)
- Lime 선택 이유: 11색 팔레트에서 유일하게 비어있던 hue zone

### 6. 사이드바 브랜드명 수정
- `app/partials/sidebar.html` line 10: `"legend·team"` → `"Legend Nexus"`
- build-time partial 파일 수정 후 재빌드로 전체 페이지 반영

## 검증
- `node scripts/build.js` 빌드 통과
- Preview 서버(http-server dist/ -p 8090) 확인: 모든 수정 반영 확인
- `node scripts/auto-push.js` GitHub push 완료
