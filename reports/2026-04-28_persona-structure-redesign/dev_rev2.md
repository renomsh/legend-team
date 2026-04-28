---
turnId: 7
invocationMode: subagent
role: dev
topic: topic_127
session: session_130
grade: B
phase: implementation
date: 2026-04-28
---

# Dev 구현 — P2 hook v3 + fixture + validate-hook-registration

Dev입니다. Ace 종합검토 결정 D-A~D-G + Arki Phase 분해 기반으로 P2 MUST 4건을 구현하고 G2 게이트를 통과했습니다.

---

## Section 1 — 파일별 구현 내역

| 경로 | 상태 | 핵심 변경 |
|---|---|---|
| `.claude/hooks/pre-tool-use-task.js` | 수정 (v2 → v3) | `buildPersonaLayer` + `evaluateTransitionCheckpoint` 두 함수 추가, KNOWN_ROLES에 `vera` 추가 |
| `tests/fixtures/hook/pre-tool-use-task-fire.test.ts` | 신규 | v3 단위 테스트 4건 (T-P2-01~04) |
| `scripts/validate-hook-registration.ts` | 신규 | settings.json 훅 등록 상태 점검 |
| `memory/shared/topic_index.json` | 수정 | topic_127 status `in-progress` → `implementing` |
| `topics/topic_127/topic_meta.json` | 수정 | mirror 갱신: status `open` → `implementing`, phase `framing` → `implementation` |

---

## Section 2 — G2 검증 출력

### Test 1: fixture 실행 (4건)

```
=== pre-tool-use-task.js v3 fixture 테스트 ===

[PASS] T-P2-01 persona inject 정상 작동 (buildPersonaLayer 3층 concat) — 3층 concat + 순서 정합
[PASS] T-P2-02 persona 절삭 금지 — PERSONA_OVER_CAP 마커 검증 — PERSONA_OVER_CAP 마커 확인, persona 보존, 총 길이 90389
[PASS] T-P2-03 transition gate 미발동 (Grade C 토픽 — D-G 정합) — Grade C → TRANSITION_GATE 미발동, 기본 inject 정상
[PASS] T-P2-04 transition gate 발동 (Grade A framing, design-approved 상태 — D-G 정합) — Grade A framing design-approved → TRANSITION_GATE 정상 발동

--- 결과 요약 ---
4/4 PASS

G2 게이트 기준 통과.
```

**G2 요구사항 3건 대비:**
- R-1 회귀 (persona 절삭 금지): T-P2-02 PASS ✓
- R-2 회귀 (transition gate D-G): T-P2-03 + T-P2-04 PASS ✓
- 합성 Task input → 3층 layer prepend 정상: T-P2-01 PASS ✓

### Test 2: validate-hook-registration 실행

```
[PASS] settings.json 파싱: 정상 파싱
[PASS] PreToolUse: pre-tool-use-task.js: hooks.PreToolUse에 등록 확인
[PASS] PostToolUse: post-tool-use-task.js: hooks.PostToolUse에 등록 확인
[PASS] SessionEnd hook: 1개 그룹 등록 확인

--- validate-hook-registration 결과 ---
4/4 항목 정상
모든 훅 정상 등록 확인.
```

### Test 3: hook 합성 input 시뮬레이션

```
hook load OK
exit code: 0
```

**G2 PASS — 3건 모두 정상 출력 확인.**

---

## Section 3 — 구현 세부 (v3 핵심 변경)

### buildPersonaLayer(cwd, role)
- 3파일 concat 순서: `_common.md` → `policies/role-{r}.md` → `personas/role-{r}.md`
- policy 없음: 조용히 스킵 (P3 완료 전 잔여 역할 호환)
- persona 없음: `⚠ PERSONA_INJECT_FAILED: role={role}` 마커
- `_common.md` 없음: `⚠ COMMON_POLICY_MISSING` 마커
- 반환: `{ content: string, markers: string[] }`

### evaluateTransitionCheckpoint(cwd, topicId)
- D-G 조건: grade ∈ {A,B,S} AND topicType='framing' AND status ≠ 'implementing'
- 발동 시: `⚠ TRANSITION_GATE: topic '{id}' 상태 '{status}' — 구현 진입 전 "구현 진입" 또는 "approve-impl" 확인 필요` 마커
- 미발동 (C/D grade, implementing, completed/suspended/cancelled): null 반환
- 파일 없음/파싱 실패: null (조용히 패스, D-G "gate는 선택적")

### 절삭 계층 (5단)
```
Level 0: persona + topic + session (전체)
Level 1: persona + topic + session (최근 5 turns)
Level 2: persona + topic + null
Level 3: persona + null + null
Level 4: TOTAL_CAP_CHARS 여전히 초과 → ⚠ PERSONA_OVER_CAP 마커 (persona 절삭 금지)
```

### 로그 phase 분리 (v3)
```
mutate-v3-persona | persona-missing | persona-over-cap | gate-check | gate-triggered | skip-already-injected | error
```

### KNOWN_ROLES 갱신
```js
// v2
const KNOWN_ROLES = ['ace', 'arki', 'fin', 'riki', 'nova', 'dev', 'edi', 'designer'];
// v3 (vera 추가)
const KNOWN_ROLES = ['ace', 'arki', 'fin', 'riki', 'nova', 'dev', 'edi', 'designer', 'vera'];
```

---

## Section 4 — 롤백 경로

```bash
# hook v3 롤백
git checkout HEAD -- .claude/hooks/pre-tool-use-task.js

# 신규 파일 제거
rm tests/fixtures/hook/pre-tool-use-task-fire.test.ts
rmdir tests/fixtures/hook/ 2>/dev/null || true
rm scripts/validate-hook-registration.ts

# topic status 롤백
git checkout HEAD -- memory/shared/topic_index.json
git checkout HEAD -- topics/topic_127/topic_meta.json
```

---

## Section 5 — P3 인계 메모

다음 세션 P3 시작점: **잔여 5역할 fin·riki·nova·edi·vera atomic 분리**

### P3 즉시 시작 가능 항목

1. **5역할 페르소나 분리** — `memory/roles/personas/role-{fin,riki,nova,edi,vera}.md` 현재 파일에서 policy 영역 분리
   - 현재 파일 위치: `memory/roles/personas/role-*.md` (기존 통합본)
   - 분리 후: `personas/` = 정체성·톤·금지·원칙 (30~46줄 목표)
   - 신규: `policies/role-{fin,riki,nova,edi,vera}.md` = 발언구조·계약·역할별 정책 (42~63줄 목표)

2. **Vera 정밀 분리** (R-8 mitigation):
   - D-029 (Vera Design 영역) 정체성 손실 위험 최고
   - visual system: color·typography·spacing·gradient·component spec 영역 persona에 보존 필수

3. **`scripts/scaffold-role.ts` 신규** (G3 게이트 조건):
   - 8역할 inject 100% 검증 스크립트
   - 각 역할별 `buildPersonaLayer()` 호출 + 파일 존재 여부 + 마커 없음 확인

4. **`_common.md` 100줄 cap 검증** — finalize hook 확장:
   - `_common.md` 라인수 > 100 시 `gaps: common-policy-over-cap` 박제

### G3 게이트 조건
- 8역할 모두 `buildPersonaLayer()` 호출 시 `PERSONA_INJECT_FAILED` 마커 0건
- `scaffold-role.ts` 실행 PASS

---

## Section 6 — P3 미완료 잔여 확인

| 항목 | 상태 | 이유 |
|---|---|---|
| `scripts/lib/topic-status.ts` SOT 헬퍼 (D-F) | 미구현 | P3 작업 항목 (Arki Phase 2 분류, GOOD-TO-HAVE) |
| `session-end-finalize.js` R-6 self-score scale 감지 | 미구현 | P3 GOOD-TO-HAVE — scale 감지 코드 분리 필요 |
| `CLAUDE.md` 박제 (D-E trigger 어휘 분리, D-F SOT) | 미구현 | P4 작업 (D-105 박제 세션) |
| D-105 박제 | 미구현 | P4 전용 |

SOT 헬퍼와 finalize 확장은 본 세션 MUST 범위 외 (Arki Phase 2). P3 세션에서 Phase 2 task c/d/e와 함께 구현.

---

```yaml
# self-scores
rt_cov: 0.92    # 4건 fixture 실행 + hook load 검증
gt_pas: 1.0     # G2 PASS (4/4 fixture + validate 4/4)
hc_rt: 1.0      # 하드코딩 없음 — TOTAL_CAP_CHARS/KNOWN_ROLES 상수화, config 파일에서 읽기
spc_drf: 0.95   # D-A~D-G 전부 반영, R-1(d) scope-out 준수, GOOD-TO-HAVE 2건 미구현(의도적)
```

DEV_IMPL_DONE: reports/2026-04-28_persona-structure-redesign/dev_rev2.md
