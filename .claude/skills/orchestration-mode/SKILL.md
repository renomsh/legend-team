---
name: orchestration-mode
description: "오케스트레이션 모드 전환 — /auto (자동 루프) / /master (수동 복귀)"
user_invocable: true
---

# Orchestration Mode

세션 오케스트레이션 모드를 전환한다. (D-074, session_093)

## 명령어

| 명령 | 효과 |
|---|---|
| `/auto` | 프레이밍 승인 + 이후 루프 자동 전환. `orchestrationMode: "auto"` 기록. |
| `/master` | auto → manual 복귀. `orchestrationMode: "manual"` 기록. |

## 동작 규칙

### /auto 발동 시
1. 현재 프레이밍 발언을 **승인**으로 처리
2. `current_session.json.orchestrationMode` → `"auto"` 업데이트
3. `orchestrationTransitions[]`에 `{ mode: "auto", turnIdx: <현재>, trigger: "/auto", at: <ISO> }` append
4. 이후 역할 호출·Fin 포함 여부·Nova 추천 등을 **Ace 자동 판단**으로 진행
5. Master 무응답 = 승인. 짧은 확인("OK", "진행", "응") = 개입 아님.

### /master 발동 시 (또는 자연어 개입)
1. `orchestrationMode` → `"manual"` 업데이트
2. `orchestrationTransitions[]`에 `{ mode: "manual", turnIdx: <현재>, trigger: "/master" | "natural-language", at: <ISO> }` append
3. 이후 Ace가 매 분기마다 Master 확인 재개
4. Master가 다시 `/auto` 입력 시 재진입

## auto 모드 중 강제 Master 확인 지점 (2개)

Ace는 auto 모드라도 다음 2개 지점에서 **반드시** Master 확인 질의를 수행한다:

1. **결정 박제 직전** (decision_ledger D-xxx append 전)
   - Ace가 `phase: "master-gate-request"` Turn 먼저 push
   - "D-xxx 결정 박제 예정: [결정 요약]. 확인?" 텍스트 출력
   - Master 무응답 = 승인

2. **Edi 호출 직전** (루프 종결 → 컴파일 직전)
   - Ace가 `phase: "master-gate-request"` Turn push
   - "루프 종결, Edi 컴파일 진행?" 출력
   - Master 무응답 = 승인

## 모드별 세션 기록

- `current_session.json.orchestrationMode`: `"manual" | "auto"` (기본 `"manual"`)
- `current_session.json.orchestrationTransitions`: 전환 이력 배열

## 원칙

- `/auto`는 언제든 입력 가능 (Grade·Phase 무관)
- S grade + `/auto` → grade 필드는 S 유지, 운영 모드만 전환
- C/D grade는 `/auto` 불필요 (Master 개입 없이 직행)
- 역할 sequencing은 auto 모드에서도 Ace 판단 (D-019)
