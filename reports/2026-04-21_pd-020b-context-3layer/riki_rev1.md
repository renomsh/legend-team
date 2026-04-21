---
role: riki
session: session_059
topic: pd-020b-context-3layer
date: 2026-04-21
turns: [3]
phase: risk-audit
---

# Riki — 리스크·전제 감사

## 🔴 RK-1 — turns[] 미기록 시 L1 무효화 (전제 위반)

Arki가 🔴로 명시한 핵심 전제 "current_session.turns[]가 정상 기록되고 있다"는 D-048 구현됐다고 선언만 됐을 뿐 **실제 검증된 적 없음**. session_054~058 확인 시 turns 배열이 채워진 세션은 4개 정도이고 그것도 Claude가 수동 push한 결과. 자동 기록 메커니즘(C1 프로토콜)이 코드 레벨에서 강제되는 곳이 없음.

**구체 영향:** P2(turn-log-writer.js)가 정상 동작해도 입력이 빈 배열이면 turn_log.jsonl도 빈 파일. L1 자체가 죽음 → L2/L3 derivation 의미 없음.

**권고:** P2 진입 전 validate-session-turns.ts로 최근 5세션 turns[] 무결성 사전 검증 필수. 빈 배열·turnIdx 누락 발견 시 P2 보류, C1 프로토콜 강제화 먼저.

→ Arki v2에서 P0 신규 추가로 수용됨.

## 🟡 RK-2 — Editor 본문 우회 시 침묵 실패 (Arki 제약 4)

Arki Phase 3 설계: "Editor 본문은 current_session.contributionBody 임시 필드, 없으면 notes/decisions 자동 요약."

**실제로 일어날 일:** Editor가 본문 작성을 잊는다(Editor 발언이 형식적이므로 가능성 매우 높음). hook이 fallback. 자동 요약은 의미 없는 bullet 나열. **에러 없이 빈 의미 파일이 생성**되고, L3가 그걸 입력으로 받아 brief까지 노이즈로 채움.

**권고:** fallback 시 contribution.md 헤더에 quality: degraded 플래그 명시 + L3 재생성 시 degraded 파일 가중치 낮춤 또는 별도 섹션 분리.

→ Arki v2에서 quality 플래그(editor-written|hook-fallback) + degraded 섹션 분리 + hook stderr 경고로 수용 보강됨.

## 🟡 RK-3 — context_brief 자동 로드의 토큰 폭발 시점

Fin이 "활성 토픽 5개 안정 시 +2,500토큰" 추산했지만 **현재 system_state.openTopics는 2개**. PD-020c 이후 운영규칙(maxSessions/lastActivity hold 자동화)이 적용되기 전까지는 활성 토픽 누적 위험. PD-020b가 PD-020c보다 먼저 시작 → **갭 기간 동안 활성 토픽 모니터링 부재**.

**권고:** P6 /open 로더에 "활성 토픽 N > 임계(예: 7) 시 경고 출력 + 현재 토픽만 로드 fallback" 추가. PD-020c 완료 시 제거 가능.

→ Arki v2에서 N>7 fallback (--load-all 옵션 포함)으로 수용됨.

## ✅ 명시적 패스

- Idempotency 설계 — 적절. 추가 리스크 없음.
- Hook 실패 격리 — 기존 패턴 재사용, 안전.
- topic_id 누락 방어 — 충분.
- 의존 그래프 순차 실행 — race condition 없음.

리스크 개수 채우지 않음. 위 3개가 실제 발견 항목 전부.
