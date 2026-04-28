---
turnId: 4
invocationMode: subagent
role: arki
topic: topic_127
session: session_130
grade: B
phase: structural-design
date: 2026-04-28
---

# Arki 구조 진단 — P2 hook v3 + transition checkpoint 통합 설계

Arki입니다. Master refinement으로 게이트가 "tool blocker"에서 "transition checkpoint"로 좁아져 conditional → plan 분해가 가능해졌습니다. 다축 교차(스키마·hook entry·SOT 갱신·trigger 시점·session_131 시뮬레이션)로 단언 없이 finding 5건을 박제하고, P2 본체 task 4건과 게이트 메커니즘을 같은 plan에 합성합니다.

---

## Section 1 — 구조 진단 (5 finding)

### F-1 — status enum 충돌 실측 (legacy 5종 vs Ace 권고 6종)
**현황**: `topic_index.json` 123개 토픽 status 인벤토리:
- `completed`: 117 / `suspended`: 3 / `in-progress`: 1 / `design-complete`: 1 / `cancelled`: 1
- 기존 enum 5종 = `{completed, suspended, in-progress, design-complete, cancelled}`
- Ace 권고 6종 = `{open, in-progress, framing, design-approved, implementing, completed, suspended}` (Ace 발언 D-B 보강)
- **충돌**: ① `in-progress` 의미 모호 — 기존 1건이 framing/design/implementing 중 어디인지 불명. ② `design-complete` (1건) vs `design-approved` (Ace 권고) 명칭 표류. ③ `cancelled`는 enum에 미포함됐으나 실재.
- **mitigation**: enum 확정 = `{open, framing, design-approved, implementing, completed, suspended, cancelled}` 7종. legacy `in-progress` 1건 + `design-complete` 1건은 마이그레이션 스크립트 1회 실행으로 정규화 (단, "레거시 소급은 실질 가치 증명 후" 메모리 정책 따라 본 세션 in scope 토픽 = topic_127만 신규 enum 적용, 122개 legacy는 조회 시 fallback 매핑 테이블만 박제).
- **fallback**: enum 확정 보류 + Phase 1을 "스키마 추가만 (legacy 호환 layer)" 단계로 좁힘. 실제 토글은 Phase 3에서.

### F-2 — pre-tool-use-task.js v3의 두 책임 entry point 분리도
**현황**: 현 v2 (350줄, 단일 IIFE) 구조 — `(async () => { readStdin → role 식별 → buildTopicLayer + buildSessionLayer → composeInjection → write }`. v3는 두 책임 추가: ① P2 본체 (persona 3층 compose) ② Master refinement (transition checkpoint).
- **위험**: 한 hook에 두 책임 묶으면 (a) 로깅 phase 식별자 혼선 (`mutate-v2` 단일 phase로 두 동작 구분 안 됨), (b) checkpoint 로직 버그 시 persona inject까지 silent fail, (c) 테스트 fixture가 두 책임 동시 검증 강제.
- **mitigation**: v3 내부에 함수 단위 분리 — `buildPersonaLayer(cwd, role)` (Edi 인계 메모 Section 6.1 그대로) + `evaluateTransitionCheckpoint(cwd, sess, toolInput)` 두 순수 함수. main IIFE는 두 함수 결과 합성만. 로그 phase = `mutate-v3-persona` / `mutate-v3-checkpoint-pass` / `mutate-v3-checkpoint-block` 3분리.
- **fallback**: checkpoint를 별도 hook 파일(`pre-tool-use-checkpoint.js`)로 완전 분리. Ace 권고(D-D 통합)와 충돌하나 통합 시 회귀 위험이 측정 임계 초과하면 분리.

### F-3 — topic_index 갱신 SOT 충돌 (자동 토글 vs 수동 Edit)
**현황**: D-E (자연어 "진행해" → Ace 결정 박제 + status 토글)는 hook이 자동 갱신. 그러나 Master는 메모리 정책상 직접 Edit으로도 토픽 status 수정 가능 (`session_index.json`처럼 스크립트 강제 X). 동시 갱신 시 "마지막 쓰기 승" 레이스.
- **multi-axis check**:
  - 코드 축: write lock 없음
  - 자연어 축: Master "이 토픽 보류" 발언 → Ace가 status 토글 vs Master 직접 Edit 동시 발생 가능
  - 문서 축: CLAUDE.md `session_index.json`만 스크립트 강제, `topic_index.json`은 미규정
- **mitigation**: ① topic_index 갱신용 단일 헬퍼 `scripts/lib/topic-status.ts.toggleStatus(topicId, newStatus, {actor, sessionId})` 도입, revision_history 자동 기록. ② Ace decision 박제·Master 명시 요청 모두 이 헬퍼 경유. ③ 직접 Edit 금지를 CLAUDE.md 1줄로 박제 (D-028 `session_index.json` 패턴 준용).
- **fallback**: 강제 못 하므로 finalize hook이 매 세션 종료 시 `revision_history` ↔ `status` 일관성 검증, 불일치는 `gaps: status-drift` 박제.

### F-4 — 게이트 발동 trigger 위치 (Ace 종합검토 직후 vs Dev dispatch 직전)
**현황**: Master refinement = "구현 phase 진입 직전 1회". 후보 trigger 2개:
- 후보 A: Ace 종합검토 발언 박제 시점 (즉, Ace가 implementation 결정 박제 직후, Dev 호출 전)
- 후보 B: Dev subagent dispatch 직전 (PreToolUse hook 발동 시점)
- **차이**: A는 Ace 발언 안에 명시 게이트 phrase 박제 ("M-Gate 시작") 후 Master 응답 대기. B는 hook이 status를 보고 차단 결정.
- **multi-axis 진단**:
  - 자연스러움: A가 자연어 흐름 일치 (Ace가 이미 종합 직후 게이트를 verbal로 호출)
  - 강제력: B가 강함 (hook이 tool 차단)
  - "tool blocker 아님" Master refinement 부합도: A 우위 (B는 Edit/Write 연속 차단으로 흐름 깨질 위험)
- **mitigation**: **A + B 합성**. A = Ace가 종합검토에서 `transitionGate: pending` 박제, hook B는 `topic_index.status === 'design-approved' && intendedTransition === 'implementing'` 조건일 때만 단 1회 prompt 안에 ⚠ 마커 prepend (차단 X, 알림 only). Master "진행해" → status `implementing`으로 토글되면 마커 자동 해제. → "transition checkpoint" 정의 정확히 부합.
- **fallback**: A 단일 (hook 미관여). 구현 단순화하나 silent skip 위험 존재.

### F-5 — session_131 첫 진입 4단 흐름 시뮬레이션
**현황**: D-E 흐름 = (1) Master "진행해" → (2) Ace 결정 박제 → (3) status 토글 → (4) Dev 호출. 자연스러움 검증:
- 시뮬레이션: session_131 첫 turn에서 Master가 P3 atomic 분리 진행 지시 → Ace 종합검토 (이미 본 토픽 spec 동결됐으므로 짧게) → Ace decision 박제 시 `topicStatus: implementing` 토글 → Dev subagent dispatch.
- **issue**: ① Ace 종합검토는 본 세션에서 끝났음. session_131에선 "재종합" 명분 약함. 박제 trigger를 Ace 발언이 아니라 Master "진행해" 발언 자체로 잡으면 Ace를 우회 가능 — D-019 (Ace orchestrator) 침해. ② 메모리 "결정 불요 자동 진행" 정책과 명시 게이트 충돌 가능 — Master 무응답 시 게이트 통과로 봐야 하나, transition은 명시 의지가 필요.
- **mitigation**: ① session_131 첫 발언은 Ace 1턴 (재종합 아닌 "spec 확인 + transition 박제" phase). ② 게이트 무응답 정책 = `transitionGate`만 무응답=대기 (다른 결정과 분리, 메모리 정책 예외). CLAUDE.md에 1줄 박제.
- **fallback**: session_131 첫 진입은 Master "진행해" 명시 발언 = 게이트 자동 통과로 단순화. Ace 1턴 생략.

---

## Section 2 — Phase 분해 (executionPlanMode = plan)

```
Phase 1 — status 스키마 확장 + topic-status.ts 헬퍼
  - 작업:
    a. memory/shared/topic_index.json 신규 enum 7종 박제 (legacy 보존, fallback 매핑 표 작성)
    b. scripts/lib/topic-status.ts 신규 — toggleStatus(topicId, newStatus, {actor, sessionId}) +
       revision_history 자동 기록 + enum 검증
    c. CLAUDE.md 1줄 박제: "topic_index.status는 topic-status.ts 헬퍼로만 수정"
  - 의존: 없음 (P0 이전 prereq 없음 — Edi P0/P1 G0/G1 이미 PASS)
  - 게이트 G1: enum 확정 + 헬퍼 단위 테스트 PASS + topic_127 status 'design-approved'로 전이 시 revision_history 1건 자동 박제 확인
  - 롤백: git checkout HEAD -- memory/shared/topic_index.json scripts/lib/topic-status.ts CLAUDE.md

Phase 2 — pre-tool-use-task.js v3 (persona 3층 compose)
  - 작업:
    a. buildPersonaLayer(cwd, role) 함수 추가 — _common.md + policies/role-{r}.md + personas/role-{r}.md 순서 concat
    b. KNOWN_ROLES에 'vera' 추가 (현 8종 → 9종)
    c. composeInjection 절삭 우선순위 정책 박제 (sessionLayer → topicLayer → persona-layer 절삭 금지)
    d. 페르소나 부재 시 fallback 마커 ⚠ PERSONA_INJECT_FAILED prepend
    e. 로그 phase 분리: mutate-v3-persona
  - 의존: Phase 1 G1 통과 (enum 확정 후 진행, 충돌 회피)
  - 게이트 G2: 합성 Task input → 3층 layer prepend 정상 작동 + dry-run 8역할 inject 시뮬레이션 PASS
  - 롤백: git checkout HEAD -- .claude/hooks/pre-tool-use-task.js

Phase 3 — transition checkpoint 통합 (F-4 mitigation A+B 합성)
  - 작업:
    a. evaluateTransitionCheckpoint(cwd, sess, toolInput) 함수 추가 — topic.status + intendedTransition 매칭
    b. Ace 종합검토 박제 패턴: transitionGate: pending 마커가 있는 ace_rev*.md 발견 시 hook이 ⚠ TRANSITION_GATE_PENDING 마커 prepend (차단 X, 알림 only)
    c. status='implementing' 토글되면 마커 자동 해제
    d. 로그 phase 분리: mutate-v3-checkpoint-pass / mutate-v3-checkpoint-marker
    e. ace-framing skill에 transitionGate 박제 가이드 1줄 추가 (Ace가 종합검토 시 자동 박제)
  - 의존: Phase 1 (status enum) + Phase 2 (hook 함수 분리 구조)
  - 게이트 G3: 합성 시나리오 — design-approved + transitionGate=pending 상태에서 Dev dispatch 시뮬레이션 시 마커 prepend 확인 + Master "진행해" 박제 후 implementing 토글 시 마커 해제 확인
  - 롤백: Phase 2와 동일 hook 파일 + ace-framing skill 일부

Phase 4 — fixture (R-1/R-2 회귀) + validate-hook-registration.ts + metrics scale 검증
  - 작업:
    a. tests/fixtures/hook/pre-tool-use-task-fire.test.ts 신설:
       - R-1: TOTAL_CAP_CHARS=10KB 강제 → persona 절삭 안 되는지
       - R-2: settings.json hooks 미등록 모의 → finalize gap 박제
       - F-4: transitionGate 마커 prepend/해제 검증
    b. scripts/validate-hook-registration.ts 신설 — .claude/settings.json hooks PreToolUse 등록 점검, SessionEnd finalize 통합
    c. R-6 metrics scale validator — finalize 단계 self-scores 추출 시 metrics_registry.json scale 위반 → selfScores: null + gap 박제
  - 의존: Phase 2 + Phase 3 통과
  - 게이트 G4: fixture 3건 PASS + dry-run 1세션에서 위반 0건 또는 정상 적발
  - 롤백: tests/fixtures/hook/pre-tool-use-task-fire.test.ts + scripts/validate-hook-registration.ts 삭제

Phase 5 — dry-run 본 세션 종료 시점 검증 (P2 통합)
  - 작업: 본 세션 종료 hook chain (tokens → finalize → compute → build → push) 실행 + 회귀 0건 확인
  - 의존: Phase 1~4 모두 통과
  - 게이트 G5 = 본 세션 종결 readiness: validate-hook-registration PASS + topic_127 status='design-approved' 전이 + revision_history 자동 박제
  - 롤백: 본 세션 commit 통째 revert (git revert HEAD)

[scope-out — 다음 세션 P3]: 잔여 5역할(fin·riki·nova·edi·vera) atomic 분리 + scaffold-role.ts
[scope-out — 다음다음 세션 P4]: D-105 박제 + PD-044 deprecated + M-Gate-2
```

**금지어 자가검토**: 절대시간·인력·공수단위 사용 0건 확인. 의존 표현은 모두 구조적 선후 (`Phase X 완료 → Phase Y`, `게이트 GN 통과 후`).

---

## Section 3 — 의존 그래프 + 게이트 정의

| Phase | 의존 | 게이트 | 통과 기준 (필요 직접 증거) |
|---|---|---|---|
| Phase 1 | — | G1 | ① 7종 enum 박제 diff ② topic-status.ts 단위 테스트 출력 PASS ③ topic_127 status를 'design-approved'로 토글 후 revision_history.json에 entry 1건 자동 추가 확인 |
| Phase 2 | G1 | G2 | ① pre-tool-use-task.js diff에 buildPersonaLayer 함수 + KNOWN_ROLES vera 포함 ② 합성 Task fixture로 prompt 최상단 3층 prepend 확인 ③ TOTAL_CAP_CHARS 절삭 시뮬레이션에서 persona-layer 보존 확인 |
| Phase 3 | G1 + G2 | G3 | ① evaluateTransitionCheckpoint 함수 diff ② design-approved + transitionGate=pending 시나리오에서 ⚠ 마커 prepend 직접 출력 ③ Master "진행해" → status implementing 토글 후 마커 사라짐 출력 ④ ace-framing skill 갱신 diff |
| Phase 4 | G2 + G3 | G4 | ① fixture 3건 PASS 출력 ② validate-hook-registration.ts 스크립트 실행 출력 (hooks 등록 정상) ③ metrics scale validator 합성 위반 input → selfScores: null 박제 출력 |
| Phase 5 | G1~G4 | G5 | ① 본 세션 종료 finalize hook chain 출력 ② topic_127 final status='design-approved' 확인 ③ logs/pre-tool-use-task.log에 mutate-v3-* phase 라인 존재 확인 |

**의존 그래프**:
```
       Phase 1 (스키마)
        ├──> Phase 2 (persona inject)
        ├──> Phase 3 (checkpoint, Phase 2 함수 구조 의존)
        │     └──> Phase 4 (fixture + validate hook)
        └──> Phase 5 (G5 통과 = 세션 종결)
```

---

## Section 4 — 경계조건·전제·중단 조건

### 전제 P-1~P-5
- **P-1**: Edi P0/P1 G0/G1 PASS 결과(token 24.7%, 회귀 0건) 본 세션 시작 시점에 유지됨. 다른 세션 동시 진행으로 인한 회귀 없음.
- **P-2**: `.claude/agents/role-*.md` harness 파일은 본 세션 P2에서 변경 없음 (P3 scope). 단, KNOWN_ROLES에 vera 추가 시 agents/role-vera.md 부재로 인한 silent miss 가능 → buildPersonaLayer가 personas/role-vera.md만 보고 layer 생성하므로 무관.
- **P-3**: Master refinement "1회 최종 확인"은 transition (design-approved → implementing) 단일 분기에만 적용. 다른 status 전이는 자동 (open → framing 등).
- **P-4**: PD-052 (사칭 차단)은 본 세션 미적용. transitionGate 마커는 진정성 검증 X — 마커 prepend는 알림 only이므로 사칭 영향 없음.
- **P-5**: ace-framing skill 갱신은 1줄 추가 수준. Ace 자동 박제 패턴 변경 0건.

### 중단 조건 S-1~S-4 (어떤 신호 시 본 세션 중단·P3 이관)
- **S-1**: Phase 1 G1에서 legacy 122개 토픽 fallback 매핑 충돌 발견 (예: `in-progress` 1건이 framing/implementing 어느 쪽인지 결정 못 함) → 본 세션 종결, "legacy status 정규화" 별도 토픽 오픈.
- **S-2**: Phase 2 G2 dry-run에서 8역할 합산 token cap 초과 발견 (Edi P0 측정은 24.7%였으나 _common.md 추가 줄로 변동 가능) → 페르소나 문체 압축 별도 토픽 오픈, 본 세션 Phase 2까지만 commit + 종결.
- **S-3**: Phase 3 G3 시뮬레이션에서 마커 prepend가 Edit/Write 연속 흐름을 깨는 부수효과 발견 → "transition checkpoint" 정의 자체 재논의 필요, Master 게이트 발동 + 본 세션 중단.
- **S-4**: Phase 4 fixture 작성 중 hook v3 회귀 (P1 분리된 3역할 발언 정상 작동 깨짐) 발견 → 즉시 롤백 + 본 세션 중단 + Master 보고.

### 자기감사 (한 축 단언 자가 점검)
**검토**: 본 발언은 다음 4축 교차 — (1) 코드 축: pre-tool-use-task.js v2 350줄 직접 Read. (2) 데이터 축: topic_index.json 123개 status 인벤토리 실측 (F-1 충돌 발견). (3) 자연어 축: F-3 동시 갱신 레이스, F-5 session_131 시뮬레이션. (4) 문서 축: CLAUDE.md D-028 패턴 준용 (F-3 mitigation), 메모리 정책 "결정 불요 자동 진행" 예외 (F-5).

**약점 자인**: ① F-4 mitigation A+B 합성은 합성 Task 시뮬레이션으로만 검증, 실제 PreToolUse hook이 ace_rev*.md frontmatter `transitionGate` 필드를 안전하게 파싱할지 Phase 3 구현 단계에서 재검증 필요. ② F-5 session_131 흐름은 가정 시나리오 — 실제 Master 발언 패턴은 다를 수 있음. 본 발언은 "구조 진단"이며 Ace 종합검토 + Master 재확인이 후행 필수. ③ F-1 enum 확정 7종은 메모리 "정착된 정책 재질문 금지" 위반 위험 — Master가 이전에 status 명세를 답했다면 본 finding은 redundant.

---

```yaml
# self-scores
str_fd: 0.85
plan_dec: 0.90
self_audit: 0.80
```

- `str_fd: 0.85` — 5 finding 모두 mitigation + fallback 병기 (메모리 "Arki 리스크 대안 의무" 준수). F-1은 실측 인벤토리 박제, F-2~F-5는 코드·자연어·문서 다축 교차. 곁가지 0건.
- `plan_dec: 0.90` — Phase 1~5 분해 + 의존 그래프 + 게이트 G1~G5 직접 증거 명시. 금지어 0건. scope-out 명시(P3/P4). 약점: G3 마커 prepend 검증 방법이 dry-run 시뮬레이션 의존, fixture 작성 후 재확인 필요.
- `self_audit: 0.80` — 4축 교차 + 약점 3건 자인 (F-4 합성 검증 한계, F-5 가정 시나리오, F-1 redundant 위험). Master 메모리 "Arki 전체 시야 의무" 준수. 약점: legacy 122개 토픽 마이그레이션 비용 정량화 부재 (Fin 평가 영역으로 인계).

ARKI_DESIGN_DONE: reports/2026-04-28_persona-structure-redesign/arki_rev2.md
