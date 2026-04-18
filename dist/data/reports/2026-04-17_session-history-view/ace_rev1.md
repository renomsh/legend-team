---
session: session_031
topic: 세션 히스토리 뷰 신설 (PD-008)
role: ace
rev: 1
date: 2026-04-17
---

# Ace — 프레이밍

**토픽**: 세션 히스토리 뷰 신설 (PD-008)

## 문제 구조 분해

PD-008은 세 개의 독립 레이어:

1. **데이터 수집 레이어** — `append-session.ts`: agentsCompleted → session_index 영구 저장
2. **집계 레이어** — `compute-dashboard.ts`: roleFrequency 집계 → dashboard_data.json
3. **뷰 레이어** — `session.html`: Current|History 탭, 역할 빈도 차트

## 범위

- **In**: append-session.ts 수정, compute-dashboard.ts 수정, session.html 재설계, backfill 소급
- **Out**: session_001~006 retroactive 4개 (reportFiles 없음), PD-006/007 병행

## 핵심 전제

agentsCompleted가 current_session.json에만 존재하고 session_index에 미전달 → 세션 종료 시 소실. close.md step 8 수정 + backfill-agents.ts로 선제 해소.

**executionPlanMode: plan**

## Ace 종합검토

모든 역할 동의. 두 결정:
1. backfill 데이터 한계: dataQuality:'backfill' 레이블로 구분
2. close.md step 8 명시화 + append-session.ts agentsCompleted 필수화(경고 출력)

**실행 순서**: Phase 1(데이터 파이프라인) → Phase 2(집계) → Phase 3(뷰) → Phase 4(빌드·배포)

Master 피드백: "Ace 이번에 잘 주관했어." — 오케스트레이션 패턴 유효성 확인.
