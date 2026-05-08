---
turnId: 9
invocationMode: subagent
session: session_209
topic: topic_176
role: arki
phase: structural-durability-analysis
date: 2026-05-08
---

# Arki — 옵션 B 구조적 내구성 평가 (session_209)

## 결론

**옵션 B는 버틴다 — 조건부로.**

버티는 조건: Nexus 생존 + hook turnPushMode 분기 비활성화 동반. 이 경로에서 race는 원천 제거된다.

버틸 수 없는 조건: Nexus crash + pending_turns 미박제. turns[]는 Nexus 메모리에만 존재 → crash = full loss.

---

## 1. Race 해소 여부

해소된다. 해소 메커니즘 = push 주체 단일화.

- 현재 hook 구조: N개 Task 병렬 종료 → N개 hook이 current_session.json read-modify-write → race (SPIKE-R6 실증).
- 옵션 B 구조: N개 tool_response → Nexus 단일 스레드 순차 파싱 → turns[] push. file-level lock 불필요, race 없음.

단, hook turnPushMode 분기 비활성화 없이 옵션 B만 추가하면 hook + Nexus 이중 write → 새로운 race. arki_rev4 §5.5 분기 read 의무가 이 문제의 코드 박제 요건이다.

---

## 2. Turn 손실 위험 (Nexus crash)

옵션 B 단독("추가 구현 없음"):
- turns[]가 Nexus 메모리에만 존재 → crash = 해당 세션 전체 turn 영구 손실.
- G안 jsonl 방식은 hook이 파일에 즉시 박제 → crash 이후에도 복구 가능. 옵션 B 단독은 이 보호 없음.

rev4의 pending_turns 병행 방식이 crash 방어를 복원하는 이유가 여기다:
- hook이 pending_turns_{sessionId}.jsonl에 append (D1 sentinel 포함)
- Nexus crash 시 finalize join(session-end-finalize.js §5.4)이 pending_turns read → turns[] 후미 append

"추가 구현 없음"이 pending_turns 병행도 없는 순수 옵션 B라면 crash=full loss는 받아들일 수 없는 구조 결함이다.

---

## 3. D1 위험: self-scores 파싱 단일점

medium 위험, 구조적 완전 차단 불가.

- extractSelfScores lastIndexOf 로직 → 본문 내 인용 블록 걸러짐 (session_192 fix).
- 발언 말미 위조 블록 삽입은 차단 불가 — tool_response는 신뢰해야 하는 채널.
- G안 jsonl vs 옵션 B 비교: jsonl은 파일 시스템 접근 가능한 누구든 삽입 가능 (더 넓은 공격 면적). 옵션 B는 tool_response 채널 단일 vector (좁지만 단일 성공 시 100% 영향).

mitigation: Nexus 측에서 role·turnIdx·reportsPath 교차 검증으로 비정상 점프 감지 validator 추가 권고.

---

## 4. 버티는 조건 / 버틸 수 없는 조건

| 조건 | 판정 |
|---|---|
| 병렬 N개 Task 정상 완료 + Nexus 생존 | 버틴다 |
| hook turnPushMode 분기 비활성화 동반 | 필수 (미박제 시 race 재발) |
| Nexus 중간 crash (pending_turns 미박제) | 버틸 수 없다 — full loss |
| Nexus 중간 crash + finalize join fallback 박제 | 버틴다 (recovery 가능) |
| 세션 길이 확장 (turn 수 ↑) | 버틴다 — file I/O 없음 |
| D1 위조 self-scores | 수용 가능 잔존 위험 |

---

## 5. "추가 구현 없음" 해석 분기

Master에게 범위 확정 필요:

- **협의 해석**: 기존 hook 그대로 + Nexus 파싱만 추가 → hook + Nexus 이중 write = race 재발
- **광의 해석**: hook 분기 박제 + pending_turns 병행 없음 → crash=full loss
- **rev4 채택 해석**: hook 분기 박제(③ skip) + pending_turns append + finalize join fallback = 옵션 B + 안전망

rev4가 옵션 B를 "GATE α 통과 시 채택 선택지"로 정의한 것은 세 번째 해석이다. 이 해석 하에 옵션 B는 구조적으로 버티며, crash 방어도 finalize join이 커버한다.

---

## 자가감사 (2라운드)

### 1차 (4축)
- structuration: race 해소 조건 vs crash 위험 조건 명확 분리. OK
- hardcoding: "추가 구현 없음" 해석 분기 — 이것이 분석 결과를 바꾸는 핵심 변수. MUST_NOW 박제 완료 (§5).
- efficiency: 구조 분석 범위 내 OK. 측정 수치 요구 없음.
- extensibility: Case A(PD-065) 직교. OK

### 2차 (거버넌스·메타 안전)
- D2: extractSelfScores session_208 7/8 실증. OK
- D4: 옵션 B 단독은 Nexus LLM 코드 실행 의존 — rev4 finalize join 코드 박제가 필수인 이유. OK (박제 위치 명시됨)
- scope drift: race/crash/D1/D4 모두 구조적 내구성의 직접 구성 요소. drift 없음.

[ROLE:arki]
# self-scores
aud_rcl: 0.8
str_fd: 3
spc_lck: N
sa_rnd: 2
