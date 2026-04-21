---
session: session_065
topic: PD-020b 완결 검증
role: dev
rev: 1
date: 2026-04-21
---

# Dev — PD-020b 완결 검증

## 수행 작업

### 1. topic_062 공식 종결
- `status: in-progress` → `completed`, `phase: framing` → `validated`
- outcome 갱신: 구현이 topic_063(P0+P1) / topic_064(P2~P5) / topic_065(P6)로 분할 완료됨 명시

### 2. topic_066 anchor lint 해소 — 버그 2개 수정

**버그 A — session_063.md Decisions 기록 누락**
- 원인: session-end-finalize.js가 `masterDecisions`를 문자열 배열로 session_index에 저장 → `write-session-contribution.ts`가 `d.id`를 읽을 때 `undefined` → `"undefined"` 문자열 기록
- 수정: session_063.md에 D-055 직접 소급 기록 (불가피한 하드코딩)

**버그 B — `regenerate-context-brief.ts` regex 불일치**
- 원인: regex `/\*\*(D-\d+)\*\*/g`가 `**(D-NNN)**` 괄호 포함 형식 미처리
- 수정: `/\*\*\(?(D-\d+)\)?\*\*/g` (괄호 선택적 처리) — 근원 수정

**버그 C (근원) — `write-session-contribution.ts` decision 조회 방식**
- 원인: `session.decisions` 배열이 문자열·객체 혼재 가능 → `d.id` undefined 재발 구조
- 수정: `decision_ledger.session` 필드를 단일 원천으로 변경 (근원 수정)
  ```ts
  // 변경 전: session.decisions 배열에서 d.id 추출
  // 변경 후: ledger.decisions.filter(d => d.session === sessionId)
  ```

### 3. topic_066 종결 + system_state 동기화
- topic_066 `in-progress/framing` → `completed/validated`
- `sync-system-state.ts` 실행 → openTopics에서 topic_062/066 제거 (잔여: topic_044, topic_012)
- PD-020b deferral `pending` → `resolved` (system_state.json 수동 업데이트)

## 구조적 미해소 사항 (Master 문의 결과)

재발 위험 확인된 2개 구조적 갭:
1. **프레이밍 토픽 자동 종결 로직 없음** — 분할 구현 패턴 반복 시마다 수동 종결 필요
2. **PD resolved 처리 절차 미명문화** — Session End 체크리스트에 "이연 항목 해소 확인 시 resolved 처리" 절차 없음

→ 별도 토픽으로 구조적 해소 예정
