---
topic: v0.3.0 업그레이드 항목 검토
role: ace
revision: 1
date: 2026-04-04
status: partial
note: 세션 중 브랜치 일원화(master←origin/main)로 중단. 4개 의사결정 축 미결정. topic_004 suspended.
accessed_assets:
  - file: current_session.json
    scope: session_002, session_003
  - file: decision_ledger.json
    scope: D-001 ~ D-009
  - file: topic_index.json
    scope: all_topics
  - file: project.json
    scope: version
  - file: riki_rev01.md (session_002)
    scope: risk_register
  - file: fin_rev01.md (session_002)
    scope: deferred_items
  - file: arki_rev01.md (session_002)
    scope: structural_gaps
---

# ACE — v0.3.0 프레이밍 & 의사결정 축

## 상황 인식

v0.2.0은 "기억하는 시스템"의 최소 조건을 달성. 수동 프로토콜 2세션 연속 이행, 트립와이어 전부 통과.
질문은 "수동을 얼마나 자동으로 바꿀 것인가"와 "아직 껍데기인 자산을 실질화할 것인가"로 나뉨.

## v0.2.0 트립와이어 검증 (Riki 기준)

- ✅ topic_index.json — 2개 토픽 등록됨 (세션 시작 시점)
- ✅ reports/ — 2개 세션 보고서 존재
- ✅ decision_ledger.json — D-001~D-005 기록됨
- ✅ current_session.json — 이전 세션 정상 종료

## 스코프 정의

### IN-SCOPE (v0.3.0 후보)

| 카테고리 | 항목 | 이연 근거 |
|---|---|---|
| **자동화** | H-01: 세션 기록 TS 자동화 | D-001에서 명시적 이연 |
| **자동화** | H-02: 로그 시스템 활성화 | Arki GAP, Fin 이연 |
| **리스크 해소** | M-01: 수동 누락 구조적 해소 | Riki R-02 잔여 리스크 |
| **품질** | M-02: 출력 포맷 일관성 강화 | Riki R-05 |
| **자산 실질화** | N-01: evidence_index 활용 프로토콜 | 스키마만 존재 |
| **자산 실질화** | N-02: master_preferences 실질화 | 비어있음 |
| **자산 실질화** | N-03: glossary 운용 기준 | 프로토콜 부재 |
| **연동** | N-04: internal-viewer ↔ reports 연동 | 현재 단절 |

### OUT-OF-SCOPE

- 새 에이전트 추가 / 역할 재정의
- 외부 시스템 연동 (API, DB)
- React/JSX 기반 UI (CLAUDE.md 금지 — D-003 유지)

## 의사결정 축 (제안 — Master 미결정)

### 축 1: v0.3.0 범위 전략
- A. 자동화 집중 (H-01 + H-02만)
- B. 자동화 + 자산 실질화 (H + N-01~03)
- C. 풀 패키지 (H + M + N 전부 + viewer 연동)

### 축 2: 자동화 수준
- A. 스크립트 보조 (TS 스크립트가 체크리스트 생성/검증, Claude Code가 호출)
- B. 풀 오케스트레이션 (세션 시작/종료 자동 실행)

### 축 3: N-항목(자산 실질화) 처리
- A. v0.3.0에 포함
- B. v0.4.0으로 이연
- C. 필요 시 점진

### 축 4: internal-viewer 연동
- A. reports/ 자동 인덱싱
- B. 현상 유지
- C. 폐기

## 세션 중 중단 사유

Master가 모바일 호환 확인을 요청 → internal-viewer.html 점검 중 origin/main과의 분기 발견.
origin/main에는 session_003(Cloudflare Pages 배포, D-006~009, 역할 재정의)이 이미 존재.
Master 지시로 브랜치 일원화(merge) 실행. 일원화 완료 후 세션 종료.

**4개 축 모두 Master 미결정 상태. 다음 세션에서 D-006~009 반영 후 재개 필요.**
