---
role: arki
topic: Dashboard 개편 — Phase 3 G3 회귀 게이트 → Phase 5 G5 부분 출시
topicId: topic_109
session: session_106
date: 2026-04-26
rev: 1
phase: execution-plan
grade: A
---

# Arki — 구조 분석 + 실행계획 (Turn 1)

## 의존 그래프

```
[Pre-G3 블록]
  ├── pixelmatch + pngjs 설치
  ├── vr-compare.ts 구현
  ├── role-colors.js canonical 확립
  └── inline :root{} 7파일 제거
        ↓
[Phase 3 G3-A] lint-contrast (19/19)
        ↓
[Phase 3 G3-B] vr-compare 24/24 max 0.05%
        ↓
[Phase 3.5] deferrals.html + sidebar nav + tab ARIA
        ↓
[Phase 4 G4] skip-link×5 + role=tab + focus-visible + D3 aria
        ↓
[Phase 5 G5] B1+B2+B3 동시 PASS → CF Pages 배포
```

## 구조적 실행계획

### Phase 분해

**Pre-G3 (전제조건)**
- P0: pixelmatch + pngjs npm install + tsconfig.json paths 확인
- P1: vr-compare.ts 신규 구현 (diff = diffPixelCount / (w×h), 임계 2%, 크기 불일치 FAIL)
- P2: role-colors.js → :root{} 토큰 canonical 확립
- P3~P7: inline :root{} 7파일에서 제거 + import role-colors.js 교체

**Phase 3**
- G3-A: scripts/lint-contrast.ts 실행 → 19/19 PASS
- G3-B: vr-compare.ts --mode=compare → 24/24 max diff < 2% PASS

**Phase 3.5**
- deferrals.html 신설 (pending deferrals 뷰어)
- app/index.html sidebar에 "Deferrals" 링크 추가
- tab[role=tab] + tabpanel[role=tabpanel] + aria-controls ARIA 보완

**Phase 4**
- skip-link: Home/Dashboard-Upgrade/Dashboard-Ops/Records-Topics/Deferrals 5개
- role=tab 적용 (Records-Topics 등 탭 UI)
- focus-visible CSS 전역 적용
- D3 SVG aria-label + role=img

**Phase 5**
- B1: HTML W3C validator (로컬 실행)
- B2: CSS lint (stylelint)
- B3: axe-core 접근성 자동 검사
- CF Pages auto-push

## 검증 게이트

| 게이트 | 통과 기준 | 실패 시 |
|---|---|---|
| G3-A | lint-contrast 19/19 PASS | 실패 토큰 수정 후 재실행 |
| G3-B | vr-compare 24/24 max < 2% | 스냅샷 재촬영 + 비교 |
| G4 | axe skip-link 5개 + tab ARIA 오류 0 | 누락 요소 추가 |
| G5 B1 | HTML valid 0 error | 마크업 수정 |
| G5 B2 | CSS lint 0 error | 스타일 수정 |
| G5 B3 | axe 접근성 0 critical | aria 보완 |

## 롤백

- role-colors.js 변경 전 inline :root{} 원본을 git stash 가능
- vr-compare.ts 실패 시 baseline 재촬영 (vr:capture --recapture)

## 전제조건

- Docker Desktop 실행 중
- CF Pages 빌드 스크립트 정상

## 중단 조건

- Docker 이미지 pull 실패 → PD 재등록
- lint-contrast 5개 이상 실패 → 색상 토큰 재설계 (Vera 재호출)
