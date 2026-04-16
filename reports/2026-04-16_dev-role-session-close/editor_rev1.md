---
topic: topic_019
topic_slug: dev-role-session-close
title: /open 비용 구조 및 세션 체크리스트 최적화
role: editor
phase: output
revision: 1
date: 2026-04-16
report_status: final
session_status: closed
agents_completed: [ace, arki, fin, riki, dev]
nova_invoked: false
---

## 토픽 요약

Master 질문 2건을 출발점으로 시작:
1. 세션 클로즈 시 코딩 역할이 Editor인가 Dev인가
2. `/open` 실행마다 ~2K 토큰이 소모되고 이중체크 구조가 필요한가

Ace가 진단 토픽으로 판단 → 직답 후 Arki 구조 검토 투입.

---

## 역할별 핵심 발언

**Ace (초기 진단)**
- Editor는 코딩 미담당. Dev는 구현 토픽에서만 호출. 세션 클로즈는 Claude Code 직접 실행.
- Ace 프레이밍 무조건 발동이 과잉이라는 구조적 갭 확인.

**Arki (구조 검토)**
- `/open` 실제 비용: ~4,200 토큰 (topic_index 1,800 + decision_ledger 1,500 + session_index 700 + current_session 150)
- 이중체크 구조 분석: /close → session-log.ts → /open 3중 검증 확인
- 개선안 A(2단계 로드), B(Ace 조건부 프레이밍), C(closeVerified 마커) 제안

**Fin (추가 절감)**
- session-log.ts가 /close와 동일한 쓰기를 중복 수행 중 → D안 제안
- counters.json 분리(E안), decision_ledger 선택적 로드(F안) 추가 제안
- 전량 적용 시 `/open` ~4,200 → ~170 토큰 예상

**Riki (리스크 검증)**
- D안 거부: session-log.ts는 Claude Code 외부의 유일한 독립 검증자. 제거 시기상조.
- E안 거부: 이중 진실원 위험 > 130토큰 절감 이득
- F안 조건부: "CLAUDE.md 미반영 결정만" 기준 필요

**Arki (Fin·Riki 통합)**
- D→D': session-log.ts 쓰기 제거, 읽기 전용 감사관 전환 (B-02 선행 조건 소멸 논증)
- E 폐기, F를 A안에 흡수
- 1·2차 실행 분리 불필요 — 파일 단위 묶음이 안전

**Ace (종합)**
- D'에 exit code 기반 실패 신호 추가 (복구 경로 명시)
- "95% 절감"은 `/open 시점` 절감. 전략 토픽 총량 변화 미미. 체감 핵심은 B안.

---

## 구현 결과 (Dev)

| 파일 | 변경 내용 |
|------|-----------|
| `.claude/commands/open.md` | A: 2단계 로드 + ID를 current_session에서 직접 파생 / B: Ace 조건부 프레이밍 |
| `.claude/commands/close.md` | C: closeVerified 마커 — push 성공 후 최후단에만 기록 |
| `scripts/session-log.ts` | D': 쓰기 전면 제거, 감사 전용화, exit code 1, B-02 제거 |
| `src/types/index.ts` | 선행 버그 수정 — TopicIndexEntry에 controlPath·reportPath·reportFiles 등 추가 |

tsc --noEmit 오류 0 확인. session-log.ts end 실행 검증 완료.

---

## 예상 효과

| 경로 | 변경 전 | 변경 후 |
|------|---------|---------|
| `/open` 진단 토픽 (패스트패스 + 프레이밍 생략) | ~4,200 토큰 | ~200 토큰 |
| `/open` 전략 토픽 (패스트패스 + 프레이밍 발동) | ~4,200 토큰 | ~700 토큰 |
| session-log.ts 중복 쓰기 | /close와 동일 쓰기 반복 | 감사만, 쓰기 없음 |

---

## 미결·이연 없음

이번 토픽은 진단 + 구현 완결형. 후속 토픽 없음.
