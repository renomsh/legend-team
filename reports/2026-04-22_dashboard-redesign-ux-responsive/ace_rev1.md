---
role: ace
topic: Dashboard 개편 — 인터페이스 UX + 반응형 프레임
topicId: topic_082
session: session_076
date: 2026-04-22
rev: 1
phase: framing
status: held
---

# Ace 프레이밍 — topic_082 Dashboard 개편

## Step 0. 생명주기 판정
- topicType: framing
- parentTopicId: 없음 (standalone framing)

## 1. 토픽 정의
viewer(app/)를 토픽 중심·반응형 깨짐 없는 대시보드로 재설계하려면 IA·반응형 프레임·비주얼을 어떻게 묶을 것인가.

## 2. 결정 축
- A1 홈 IA: 하이브리드(open 토픽+PD 상단 tray + 세션 타임라인 하단)
- A2 PD/open 노출: 미결정
- A3 클릭 타겟: 미결정
- A4 반응형 전략: CSS Grid + container queries 전면 (Ace 초안)
- A5 개편 범위: **viewer 전체 통일** (Master 확정)
- A6 적용 순서: **구조 먼저 → 구현 단계에서 반응형 동시** (Master 확정, Ace 대안 "반응형 토큰·breakpoint를 구조 단계에 포함" 수용)

## 3. 범위
- In: viewer 전체 IA, 반응형 아키텍처, 디자인토큰, Vera 비주얼 스펙, child topic 분해
- Out: 데이터 스키마 변경, 새 지표 수집, JSX/React 도입, 차트 라이브러리 교체

## 4. 전제
- 🔴 viewer read-only 정책 유지 (D-003)
- 🔴 Cloudflare Pages 정적 배포 유지
- 반응형 = desktop-first + graceful shrink (모바일 전용 X)

## 5. 추가 제안 — Tier 1 (포함 권고)
1. 글로벌 커맨드 팔레트 (Cmd/Ctrl+K)
2. 토픽 상세 페이지 + 부모-자식 관계 뷰
3. 홈 "오늘의 상태" 요약 카드 + Alarm 배너
4. URL 딥링크 + Breadcrumb

## 6. IA 확장 리스크 발견 (Master 제기)
PD-015(성장지표 정의 + Board 계측)가 진행되면 새 보드·역할 프로필·KPI 카드가 추가되어 IA 재설계 위험.

### 3가지 선택지
- A. PD-015 선행 → 대시보드 개편 후순위
- B. PD-015 흡수 (Grade S 확장)
- C. 확장점 예약 IA 설계

**Master 결정: Option A** — 이번 토픽 hold, PD-015 선행 완료 후 재호출.

## 7. 보류 사유
프레이밍 단계에서 IA 확장 리스크 발견. 반응형 깨짐·홈 UX 불편은 잠시 감수하고 PD-015 완료 후 재개.
