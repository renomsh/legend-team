# /discussion — Discussion 모드 전환

현재 세션의 `operationType`을 `discussion`으로 전환한다.

## 동작

1. `memory/sessions/current_session.json` 읽기
2. `operationType` 필드를 `"discussion"`으로 갱신
3. `phase` 필드가 없거나 `"framing"`이 아니면 `"framing"`으로 초기화
4. 변경 사항을 current_session.json에 저장
5. 전환 보고:
   ```
   [Discussion 모드 전환]
   operationType: structured → discussion
   phase: framing
   5단계 진행: framing → blind-parallel → open → debate → synthesis
   /ace-synthesis 사용 불가 (D-170-A2)
   ```

## 규칙

- Grade와 직교 — 모든 Grade에서 사용 가능
- 전환 후 Nexus가 phase 진행을 주도한다
- phase 전환은 Nexus가 current_session.json.phase 필드를 직접 갱신
- structured 모드로 복귀: `/structured`
- SOT: `memory/shared/dispatch_config.json` (phase_enum, role_domain_template)
- 결정: D-170 (2026-05-07)
