---
topicId: topic_082
topicTitle: "Dashboard 개편 — 인터페이스 UX + 반응형 프레임"
phase: implementation
hold: {"active":false,"heldAt":"2026-04-22T09:50:00.000Z","heldAtPhase":"framing","reason":"PD-015(성장지표 정의 + Board 계측) 선행 완료 후 Master 재호출까지 보류. IA 확장 리스크로 Option A 채택.","releasedAt":"2026-04-25T17:30:00.000Z","releaseReason":"Master 재호출 (session_104). PD-015 resolved (D-060, session_077). Grade S 재선언."}
grade: S
sessionCount: 3
lastUpdated: 2026-04-25T13:10:09.013Z
sizeBytes: 2344
---

## Current Phase

**implementation**

> **HOLD**: PD-015(성장지표 정의 + Board 계측) 선행 완료 후 Master 재호출까지 보류. IA 확장 리스크로 Option A 채택.

## Key Anchors

- D-094
- D-095
- D-096
- D-097
- D-098

## Decisions

- **D-094**: topic_082 framing 21일 hold 해제 후 전면 IA 박제. Records 정문 = Topics, 토픽 카드에 매핑 세션 시간순 chip. People 4×2, Growth D-060 안 β 본체. Home 가벼운 랜딩 / Dashboard 풀 KPI 분리.
- **D-095**: 1024px 이상=데스크톱 풀, 미만=모바일 단일 처리. Vera 4단 breakpoint·태블릿 collapsed sidebar 폐기. 모바일 = off-canvas drawer 280px. 데스크톱 기준 + 모바일 안 깨짐(가로 스크롤·텍스트 잘림 0) Master 정책 직접 충족.
- **D-096**: mcr.microsoft.com/playwright:v1.45.0-jammy 핀 + reducedMotion + ko-KR/Asia/Seoul + dark. 6 페이지 × 4 viewport(1920/1440/1280/375)=24 baseline. mock fixture 10항목 + bbox 영역 마킹(data-vr-bbox) + diff 임계 2%. PD-034 본 토픽 안 흡수.
- **D-097**: app/dashboard-upgrade.html이 viewer 디자인 reference. 색·토큰뿐 아니라 컴포넌트 클래스(.kpi-row/.section-grid/.card/.flow-row 등) 표준 카탈로그. dashboard-ops .command-grid 등은 PD-046로 흡수. tokens.css 단일 출처. Master 직접 명시.
- **D-098**: G1=색 토큰만 빌드 실패(레이아웃은 PD-045 이연). G3=WCAG AA 4.5:1 자동 contrast lint(scripts/lint-contrast.ts) + accent-only lint. 분화 금지 원칙 유지하되 Hard breaker B1·B2·B3 한정 child 분기 허용. 부분 출시 가능 4 페이지: Home/Dashboard-Upgrade/Dashboard-Ops/Records-Topics. Partial 로딩=<template>+build-time inline(Master M1).

## Open Issues

_(없음)_

## Next Action

topic_082
