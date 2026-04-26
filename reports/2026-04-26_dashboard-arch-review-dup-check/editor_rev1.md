---
role: editor
session: session_112
topic: topic_115
date: 2026-04-26
rev: 1
---

# 세션 산출물 — dashboard-arch-review-dup-check

## 진단 결과 (Arki)

### 구조적 중복 — 발견 항목
| 항목 | 위치 | 판정 |
|---|---|---|
| sidebar/nav §7 inline 잔존 | dashboard-ops.html (15개 선택자) | 제거 완료 (P1) |
| `.card`/`.card-h`/`.card-title`/`.card-sub` inline | dashboard-upgrade.html | 제거 완료 (P2) |
| `.section-grid` 클래스명 충돌 (값 다름 vs §5) | dashboard-upgrade.html | `.section-grid-2col` 분리 완료 (P2) |
| `.tab-bar`/`.tab-btn` inline | session.html | §11 최소 override로 압축 완료 (P3) |
| `components.css §12` 번호 공백 | §11→§13 점프 | §12 신설 완료 (P4) |
| `.kpi-top`/`.kpi-icon` upgrade inline | dashboard-upgrade.html | §12로 이전 완료 (P4) |
| `renderTier3()` 완전 동일 중복 | growth.html + people.html | metrics-utils.js 공통 추출 완료 (P4) |

### 내용적 중복 — Master 이연 (P3)
| 항목 | 위치 | 처리 |
|---|---|---|
| Pending Deferrals 3중 표시 | index + upgrade + deferrals | 이연 |
| Active Alarms 2중 표시 | upgrade + ops | 이연 |
| Integrity 배너 CSS/JS 중복 | growth + people | 이연 |

## 완료 작업

### Phase 1 — dashboard-ops.html sidebar inline 제거
- `<style>` 블록 2번 (lines 86~101) 전체 삭제
- `.app`/`.sidebar`/`.brand*`/`.nav-group`/`.nav-item`/`.nav-dot`/`.sidebar-foot` (15개 선택자) → components.css §7 canonical 위임
- `.s-topbar{margin-bottom:24px}` → 첫 번째 style 블록으로 이전 (ops 전용 유지)
- 검증: nav·사이드바·O1~O4 정상 렌더링, 콘솔 에러 없음

### Phase 2 — dashboard-upgrade.html 정리
- inline `.card`/`.card-h`/`.card-title`/`.card-sub` 4개 선택자 제거 → §6 canonical 위임
- `.section-grid{1.7fr 1fr}` → `.section-grid-2col{1.7fr 1fr}`로 클래스명 변경 (§5 `auto-fit minmax` 충돌 해소)
- HTML `class="section-grid"` → `class="section-grid-2col"` 치환 (1곳)
- 검증: `.card` §6 canonical 적용, grid 1.7fr:1fr 비율 정상

### Phase 3 — session.html §11 최소 override
- `.tab-bar`/`.tab-btn`/`.tab-btn:hover` 전체 정의 → 최소 override로 압축
  - `.tab-bar{margin-bottom:28px}` (§11=24px와 차이 유지)
  - `.tab-btn{padding:10px 20px;font-size:13px;letter-spacing:0}` (크기 차이 유지)
  - `.tab-btn.active{color:#10B981;border-bottom-color:#10B981}` (§11 미정의 항목 유지)
- `<style>` 블록을 `</head>` 밖→ `<head>` 내 이동 (cascade 명시화)
- 결과: tab-btn `text-transform`은 §11 `uppercase` 통일 (topic.html과 동일 패턴)

### Phase 4 — §12 신설 + renderTier3 공통 추출
- `components.css §12` 추가: `.kpi-top{display:flex;...}` / `.kpi-icon{width:30px;...}`
- `dashboard-upgrade.html` inline에서 `.kpi-top`/`.kpi-icon` 제거 → §12 canonical 위임
- `app/js/metrics-utils.js` 신설: `renderTier3()` 함수
- `growth.html`/`people.html`: `renderTier3()` 함수 정의 제거 → `<script src="js/metrics-utils.js">` 참조로 전환
- 검증: growth/people Tier3 테이블 123행 정상 렌더링

## components.css 섹션 현황 (세션 후)

| 섹션 | 내용 |
|---|---|
| §0 | G4 Accessibility AA |
| §1 | helper class 5종 |
| §2 | drawer mobile CSS |
| §3 | KPI auto-fit + fallback |
| §4 | .kpi (upgrade canonical) |
| §5 | .section-grid (범용 auto-fit) |
| §6 | .card (generic card) |
| §7 | Navigation (sidebar) |
| §8 | Hero / Pill / Blip / Spark |
| §9 | Mini panels |
| §10 | Page Layout |
| §11 | tab-bar / tab-btn |
| **§12** | **KPI Card internals (.kpi-top / .kpi-icon)** ← 신설 |
| §13 | badge |
| §14 | table |

## 잔존 inline 현황 (세션 후)

| 파일 | 잔존 inline | 성격 |
|---|---|---|
| dashboard-upgrade.html | .kpi/.kpi-row/.cost-row/.filter-bar/.flow*/.rf-*/.wide-grid 등 | 페이지 전용 정당 |
| dashboard-ops.html | .command-card/.pipeline-item/.session-table/.deferral-item/.decision-table 등 | 페이지 전용 정당 |
| growth.html | .axis-card/.panel-*/.pc-* 등 | 리포트 전용 정당 |
| people.html | .tier/.cards/.s-sub 등 | 리포트 전용 정당 |
| session.html | .tab-bar(override)/.card/.hist-card/.search-* 등 | 최소 override + 페이지 전용 |
| topic.html | .tab-btn.active(override) | 최소 override |
| decisions.html | 없음 | 정상 |
| feedback.html | 없음 | 정상 |
| deferrals.html | .chip/.deferral-card/.graph-card 등 | 페이지 전용 정당 |
