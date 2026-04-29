---
role: arki
topic: topic_132
session: session_144
turnId: 5
invocationMode: subagent
date: 2026-04-30
---

# Arki — Master-first 모드 구조 설계 (옵션 2 hook 박제)

## 1. Findings (구조적 발견)

- **F-201 (root cause)**: s139 echo chamber는 "Master 발언 → role 발언 사이"에 자기감사 hook이 0건이었던 점에서 발생. 기존 hook 7건은 모두 PreToolUse(Task)/PostToolUse/SessionEnd 라이프사이클에 묶여 있어 **Master 발언 직후**(`UserPromptSubmit`) 게이트가 비어 있음. → 이 슬롯이 본 토픽의 진짜 빈자리.
- **F-202**: Sage(D-126) read-only는 "다음 세션 채점"이라 시점 미스매치. 본 토픽은 그 보완재(같은 세션 안에서 작동)이지 대체재 아님 — Sage와 책임 분할 필요.
- **F-203**: hook 책임 단일화 깨지면(SRP 위반, Martin 2003) D-128 sage-gate 분리 패턴과 충돌. → master-first도 별도 파일 2건으로 쪼개야 함.
- **F-204**: D2(description 거짓 전제)/D4(모델 설득 무력화) 적용 시, 자가검사 LLM 분류 결과를 "Claude 자율 판단"이 아니라 **hook이 inject한 외부 사실**로 박제해야 함. inject 경로 = Ace/role의 다음 prompt 최상단 컨텍스트 블록.
- **F-205 (위험 root)**: 자가검사 LLM 호출 자체가 또 다른 echo chamber가 될 수 있음(자기 모델이 자기 발언 채점). → 키워드 1차(룰북) + LLM 2차(분류) **순서 강제** + LLM은 키워드 미스 케이스만 호출 (Goodhart 회피, Strathern 1997).

## 2. 컴포넌트 구조

```
[Master 발언]
   │
   ▼
┌──────────────────────────────────────────┐
│ HookA: user-prompt-submit-master-first.js │  (UserPromptSubmit)
│  ─ 트리거 조건 판정 (Grade B+ AND framing) │
│  ─ 키워드 1차 분류 (echo trigger 패턴)     │
│  ─ LLM 2차 분류 (키워드 unknown 시만)      │
│  ─ 결과 → master_first_state.json 박제    │
│  ─ 결과 → 다음 prompt에 inject 마커 작성   │
└──────────────────────────────────────────┘
   │
   ▼
[Claude 본체 응답 — Ace 등 role 발언 시작]
   │
   ▼
┌──────────────────────────────────────────┐
│ HookB: pre-tool-use-task-master-first.js  │  (PreToolUse: Task)
│  ─ 직전 Master 발언 분류 결과 read         │
│  ─ role 호출 prompt에 자가검사 결과 prepend│
│  ─ "Master 의도 재확인" 의무 표기           │
│  ─ unresolved 분류 결과 → 호출 차단(exit 2)│
└──────────────────────────────────────────┘
   │
   ▼
[role 서브에이전트 발언]
```

### master_first_config.json 스키마

```json
{
  "version": "0.1.0",
  "enabled_grades": ["B", "A", "S"],
  "enabled_topic_types": ["framing"],
  "exclude_grades": ["C", "D"],
  "keyword_rules": {
    "echo_triggers": ["맞아", "맞다", "그렇지", "동의", "역시"],
    "intent_change": ["아니", "다시", "취소", "원복"],
    "ambiguity_marker": ["혹시", "아마", "정도"]
  },
  "llm_classifier": {
    "fallback_only": true,
    "max_tokens": 200,
    "model_tier": "haiku"
  },
  "inject_target": {
    "role_prompts": true,
    "marker": "[MASTER-FIRST-AUDIT]"
  },
  "enforcement": {
    "warn_only": false,
    "block_on_unresolved": true
  },
  "false_positive_review_after_sessions": 30
}
```

### Sage / pre-tool-use-task와 발동 순서

| 순서 | hook | 슬롯 | 책임 |
|---|---|---|---|
| 1 | user-prompt-submit-master-first | UserPromptSubmit | Master 발언 분류 + state 박제 |
| 2 | pre-tool-use-task-sage-gate | PreToolUse(Task) | Sage 호출이면 다른 페르소나 차단 (D-128) |
| 3 | pre-tool-use-task-master-first | PreToolUse(Task) | role prompt에 audit 결과 inject + unresolved 차단 |
| 4 | pre-tool-use-task | PreToolUse(Task) | role marker + 컨텍스트 inject (기존) |
| 5 | post-tool-use-task | PostToolUse(Task) | NCL 4항목 검증 (기존) |

순서는 `dispatch_config.json.hook_chain_order` 명시 (D2 검증용 — description 아닌 코드 위치로 검증).

## 3. 의존 그래프

- G1 (전제): PD-052 resolved 확인 → master_first_config.enforcement.warn_only 결정
- G2: prime_directive.lock.json (D-122) 무결성 검증 통과 후 hook 활성화
- G3: NCL Phase A (D-123) PostToolUse hook 정상 작동 — master_first 위반도 NCL 4항목과 동일 violation flag로 박제
- G4: dispatch_config.json 스키마 확장 (master_first 섹션 추가) — 기존 sage/zero 룰과 키 충돌 없음 검증

## 4. 구조적 실행계획 (executionPlanMode: plan)

### Phase 분해

- **P1 — 룰셋·config 박제**: `master_first_config.json` 작성 + `dispatch_config.json`에 `master_first` 섹션 추가. 키워드 룰 v0 박제. 게이트 G_P1: config JSON 스키마 validate 통과.
- **P2 — HookA 박제 (UserPromptSubmit)**: `user-prompt-submit-master-first.js` 신규. 키워드 1차 분류 + state 박제. **LLM 호출 미포함** (warn-only). 게이트 G_P2: 수동 fixture 5건 분류 정확도 ≥80%.
- **P3 — HookB 박제 (PreToolUse Task)**: `pre-tool-use-task-master-first.js` 신규. inject 동작만, block 비활성. 게이트 G_P3: PreToolUse hook chain 순서 검증, sage-gate와 비충돌.
- **P4 — LLM 2차 분류 추가**: HookA에 fallback LLM 분류 추가. 게이트 G_P4: 키워드 unknown 케이스에서만 호출되는지 trace log로 검증.
- **P5 — enforce 모드 전환**: `warn_only: false` + `block_on_unresolved: true`. 게이트 G_P5: Riki spike 테스트(echo 시나리오 재현 fixture)에서 차단 확인.
- **P6 — 30세션 실측 측정 게이트**: false positive 율 측정 패널 추가, ≥10% 시 P1 재설계.

### 검증 게이트 (정합성)

- G_NCL: PostToolUse hook이 master_first violation을 NCL 4항목 중 1건으로 박제 (D-123 정합)
- G_D2: hook description ≠ 실동작 차이 fixture 1건으로 검증 (description에 "차단"이라 적었는데 inject만 하는지 확인)
- G_D4: Claude prompt에 "이번만 master_first 우회" 자가설득 시도 → hook이 차단하는지 spike 테스트

### 롤백 경로

- 즉시 롤백: `master_first_config.enabled_grades: []` → 사실상 비활성. 코드 보존.
- 부분 롤백: P5만 되돌림 → warn-only 복귀. 데이터(state.json)는 유지.
- 완전 롤백: hook 2건 settings.json에서 제거 + config 파일 archive/.

### 전제

- PD-052 resolved (사칭 차단 hook 활성)
- D-122 prime_directive lock 무결성 통과
- D-128 sage-gate hook 정상 동작 중

### 중단 조건

- C1: P2 게이트에서 키워드 분류 정확도 <60% → P1 룰셋 재설계
- C2: P3에서 hook chain 순서 충돌 발생 → 설계 단계로 회귀
- C3: P5 enforce 후 false positive ≥30% → 즉시 warn-only 회귀, 토픽 재오픈
- C4: master_first hook이 자기 자신을 echo chamber로 만드는 신호 발견(F-205 실현) → 전체 비활성, Sage(다음 세션 채점) 단독 회귀

## 5. 함정·자기감사

- **D2 적용**: hook 2건 description에 "차단" "강제" 어휘를 박지만, P3까지는 inject only. 실동작은 settings.json hook chain + 코드 trace로 검증해야 함 (description 신뢰 금지).
- **D4 적용**: Claude가 "Master가 묵시 승인했으니 master_first 패스"로 자가설득 가능. → enforce 단계는 hook이 prompt에 audit 결과를 박아서 모델 자율 판단 우회 차단.
- **자기 echo 위험 (F-205)**: 자가검사 LLM이 자기 모델이면, 자기 발언 채점 → 동질화. mitigation: ① 키워드 1차 우선 ② LLM은 다른 tier (haiku) 사용 ③ 30세션마다 fixture 회귀 ④ Sage(다음 세션) 외부 채점 병행으로 cross-check.
- **Sage 역할 침범 위험**: master-first가 Sage 영역(메타 자기성찰) 잠식 가능. 책임 경계: master-first = **세션 내 실시간 발언 분류만**, Sage = **세션 종료 후 메타 패턴 분석**. config에 책임 경계 주석 명시.
- **Anchor**: SRE Book Ch.4 (Google, 2016) "Service Level Objectives" — error budget 30 세션 후 측정 게이트(P6)는 SLO 회귀 임계 패턴. 단일 hook 분리(SRP)는 Martin (2003) Agile Software Development.

## 6. selfScores

[ROLE:arki]
# self-scores
aud_rcl: Y
str_fd: 4
spc_lck: Y
sa_rnd: 2

ARKI_WRITE_DONE: reports/2026-04-30_master-first-mode/arki_rev1.md
