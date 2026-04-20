---
role: vera
topic: 역할 재호출 측정 구조 신설
topicId: topic_048
sessionId: session_045
date: 2026-04-20
type: design-handoff
skillsApplied: [design:design-system, design:design-handoff, design:accessibility-review]
scope: visual-spec-only
---

# Vera — Design Handoff · Turn Timeline & Recall Strip

> Scope: 비주얼 시스템 스펙만. UX 동선·패널 개수·정보 계층은 Arki/Ace 영역.
> 방법론: `design:design-system`으로 토큰 정의, `design:design-handoff`로 dev 스펙 전달, `design:accessibility-review`로 a11y 검증.

---

## 1. Design Tokens (단일 원천)

### 1.1 Role Palette
- 원천: [memory/shared/role_palette.json](../../memory/shared/role_palette.json)
- 하드코딩 금지. CSS 변수로 주입: `--role-{name}-base`, `--role-{name}-hue`
- 8개 역할 고정 색: ace/arki/fin/riki/nova/vera/dev/editor

### 1.2 Semantic Tokens (신설)
```css
--gap-mismatch:       #F59E0B
--legacy-overlay:     rgba(0,0,0,0.50)  /* desaturation via filter */
--motif-shadow:       0 0 0 2px var(--role-current-base-30)
--phase-border-fw:    1.2px             /* synthesis */
--recall-strip-h:     56px
--recall-strip-div:   1px solid #E5E7EB
--kpi-number:         24px/1.2 tabular-nums 600
--kpi-label:          12px/1.4 uppercase tracking-[0.08em] #6B7280
```

### 1.3 Phase Encoding (color variation)
| phase | 변조 방식 | 의미 |
|---|---|---|
| framing | saturation 100% | 시작 강조 |
| analysis | saturation 85% | 기본 |
| synthesis | saturation 110% + 1.2px solid border | 무게감 |
| reframe | 45° white 대각 스트라이프 | 재진입 signal |
| speculative | 1px dashed border | Nova 투기 표식 |
| execution-plan | fill: none, 1px solid outline | 계획 단계 |
| compile | 135° 그라디언트 (base → 10% lighter) | Editor 종결 |

---

## 2. Component — Session Turn Timeline

### 2.1 Layout
- 가로 스크롤 가능 swim-lane. 세로축: 역할(8개), 가로축: turn index
- 각 셀: 40×40px, gap 4px
- 빈 셀: `background: var(--grid-empty, #F9FAFB)`
- 활성 셀: role color + phase 변조

### 2.2 Gap Overlay (planned vs actual)
- Planned only: `border: 1px dashed var(--role-X-base-40); fill: none`
- Actual only: solid fill, border `var(--gap-mismatch)` (1.5px)
- 둘 다 있음: solid fill, 정상 (border 없음)
- Missing planned: 위치에 어두운 X 패턴

### 2.3 Motif Highlight
- 연속 3셀 동일 패턴 자동 감지 시:
  - `border-radius: 6px` 그룹 외곽
  - `box-shadow: 0 0 0 2px rgba(role-base, 0.3)`
  - 상단 작은 라벨 (motif 이름, 10px)
- 라벨 호버 시 motif 전체 카탈로그 노출

### 2.4 Tooltip (hover)
- turn index · role · phase · chars · recallReason/splitReason · 발언 요약 1줄
- 폭 최대 280px, z-index 최상단

---

## 3. Component — Recall Summary Strip

### 3.1 Layout
- 높이: `var(--recall-strip-h)` (56px)
- 4분할: 재호출 총계 · 주요 재호출 역할 · 빈발 motif · 평균 gap
- divider: `var(--recall-strip-div)`
- padding: 16px horizontal, 12px vertical

### 3.2 Cell Spec
각 셀 상단 label (12px uppercase) + 하단 value (24px tabular):
- **재호출 총계**: 숫자만 "17회"
- **주요 재호출 역할**: 상위 3 역할 미니 바 (색상 = role base)
- **빈발 motif**: 상위 1 motif 텍스트 + 횟수 "riki→ace→arki ×4"
- **평균 gap**: "+1.2" (+ 신호 색상: 0→녹, 1~2→노랑, 3+→빨강)

### 3.3 Interaction
- 셀 클릭 → 해당 지표의 세션 리스트 드릴다운 (기존 세션 상세 페이지로 이동)
- 키보드: Tab 포커스, Enter 드릴다운

---

## 4. Legacy Indication

- 세션 리스트 카드: `🟨 legacy` 배지 우상단, `filter: saturate(0.5)` 적용
- 전역 토글: 대시보드 상단 `[ ] include legacy (session_001~044)` — 기본 off
- 토글 상태 localStorage 저장

---

## 5. Accessibility (design:accessibility-review 적용)

### 5.1 색상 대비
- Role base 8개 모두 WCAG AA (4.5:1) 대비 배경 #FFFFFF 검증 필요
  - ⚠️ `nova #D066DB` 대비 3.6:1 — fail. **Text 사용 시 darker variant `#A940AD` 필요**
  - ⚠️ `vera #FFB547` 대비 2.1:1 — fail. **Text 사용 시 `#B37419` 필요**
  - 나머지 6개 pass
- **적용 규칙**: 셀 fill은 base 사용 가능. **텍스트·아이콘은 darker variant 필수**.

### 5.2 색상 외 신호 (색맹 대응)
- phase 구분을 색상에만 의존 금지 → border·pattern·saturation 병행 (Phase Encoding 표 참조)
- motif 강조를 outline+shadow로 이중 표현 (색만 아님)
- gap mismatch에 `⚠` 아이콘 병기

### 5.3 키보드 내비게이션
- Timeline 셀 tab 순회 가능, focus ring 2px solid #4F46E5
- Strip 셀 동일
- Tooltip은 focus 시에도 표시

### 5.4 스크린 리더
- Timeline 각 셀 `aria-label="turn 5, ace, synthesis phase, 3200 chars, recalled after riki"`
- Strip 값 `aria-live="polite"` 필터 변경 시 알림

---

## 6. 구현 체크리스트 (handoff)

- [ ] `role_palette.json` 로드 → CSS 변수 주입 유틸 (`app/js/role-palette.js` 신설)
- [ ] `phase_catalog.json` 신설 후 phase encoding CSS 매핑
- [ ] `darker variants` (nova, vera) palette에 추가
- [ ] Timeline 컴포넌트: `app/components/turn-timeline.html` (or inline in session.html)
- [ ] Strip 컴포넌트: dashboard-upgrade.html 하단 신규 섹션
- [ ] Legacy 토글: 대시보드 상단 전역 필터 영역
- [ ] a11y: nova/vera darker variant, color-only 신호 제거, aria-label 적용
- [ ] 반응형: 1280px 미만에서 Timeline 가로 스크롤, Strip 2×2 그리드 fallback

---

## 7. Vera 영역 경계

이 문서에 포함됨:
- ✅ 색상 토큰, phase encoding, 컴포넌트 비주얼 스펙, a11y 검증

이 문서에 포함 안 됨 (Ace/Arki 영역):
- ❌ 패널 개수·정보 계층 (Arki 결정: 1 primary + 1 aggregate)
- ❌ Motif 자동 탐지 threshold (Arki: 15/30/100 세션)
- ❌ UX flow·드릴다운 동선 (Ace)
