---
role: ace
topic: Dashboard 개편 — Phase 3 G3 회귀 게이트 → Phase 5 G5 부분 출시
topicId: topic_109
session: session_106
date: 2026-04-26
rev: 1
phase: framing
grade: A
---

# Ace — 프레이밍 (Turn 0)

## topicType 판정

- **topicType**: `implementation`
- **parentTopicId**: `topic_082` (Dashboard 개편 framing 토픽)
- session_105에서 G2 PASS → 이번 세션은 Phase 3~5 완결 실행 세션

## Scope 선언

### In-Scope (이번 세션 완결 목표)

| Phase | 내용 | 게이트 |
|---|---|---|
| Pre-G3 블록 | inline :root{} 제거(7파일), role-colors.js 통일, pixelmatch+pngjs 설치, vr-compare.ts 구현 | — |
| Phase 3 | G3-A lint-contrast (19개 토큰 채도/명도 기준), G3-B vr-compare (24/24 max 2%) | G3 이중 게이트 |
| Phase 3.5 | deferrals.html 신설, sidebar nav 추가, tab ARIA 보완 | G3.5 검증 |
| Phase 4 | skip-link 5페이지, role=tab, focus-visible, D3 SVG aria | G4 접근성 게이트 |
| Phase 5 | B1(HTML valid), B2(CSS lint), B3(접근성 PASS) 동시 통과 → 4페이지 CF Pages 배포 | G5 출시 게이트 |

### Out-of-Scope

- Edi 인계 Phase 6+ (role-detail, reports-detail 신설)
- VR cross-OS 결정성 추가 검증 (session_107 이후)
- Growth Board 상세 구현

## Carry 5건 처리

| 항목 | 처리 |
|---|---|
| PD-051 vr-infra-spec image 핀 정정 | D-099로 박제 + vr-infra-spec.md 갱신 |
| Docker Desktop 설치 확인 | Dev 1차에서 docker pull 검증으로 확인 |
| role color 단일 css 통일 | inline :root{} 7파일 제거 + role-colors.js canonical 확립 |
| Phase 3 범위 선언 | 위 Scope 선언으로 해소 |
| VR cross-OS 결정성 검증 | session_107 이연 (carry-over) |

## 핵심 가정

1. pixelmatch + pngjs npm 설치 가능 (네트워크 연결 전제)
2. Docker Desktop v1.59.1-jammy 이미지 pull 가능
3. 현재 24개 baseline 스냅샷이 정상 캡처 상태
4. 4페이지(Home/Dashboard-Upgrade/Dashboard-Ops/Records-Topics)가 CF Pages에 이미 배포된 상태

## executionPlanMode

`plan` — Phase 3~5 순차 의존 구조 존재. 각 게이트가 전제조건.
