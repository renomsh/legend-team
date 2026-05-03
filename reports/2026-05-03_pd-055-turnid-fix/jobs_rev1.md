---
role: jobs
topic: PD-055 서브에이전트 turnId 자가 추정 오류 fix
session: session_178
date: 2026-05-03
turnId: 1
invocationMode: subagent
grade: B
---

# Jobs — PD-055 framing

## Step 1. Why

이것은 "오류 수정"이 아닙니다. 시스템 감사 체계의 신뢰도 문제입니다.

turnId 오류 하나가 발생시키는 건 `inline-role-header-mismatch` gap 하나가 아닙니다. 그 gap이 violations[]에 누적되고, 세션 정합성 판정이 오탐을 내놓는다면 — 이 시스템이 "스스로를 믿을 수 없게" 됩니다.

자기감사 시스템이 자신을 틀리게 진단하는 것은 단순 버그가 아닙니다. **감사 신뢰도 붕괴**입니다. 방치하면 violations[] 수치 자체를 신뢰할 수 없게 되고, 이후 진짜 문제가 생겼을 때 감지 불가.

## Step 2. What

**결과물:** `post-tool-use-task.js` 15줄 패치 + 검증 → 오탐 gap 소거 확인

**frame:** 이 fix 이후, Master가 violations[]를 열었을 때 "이 숫자를 믿을 수 있다"는 확신. 감사 시스템이 다시 self-coherent해지는 것.

## Step 3. 결정축

**결정축: 오탐 gap을 시스템 노이즈로 수용할 것인가, 지금 제거할 것인가.**

| 축 | 수용 (방치) | 제거 (fix) |
|---|---|---|
| 비용 | 0 (지금) | 15줄, 추가 토큰 0 |
| 리스크 | violations[] 신뢰도 저하 누적 | 패치 로직 오작동 가능성 (검증으로 제거) |
| 장기 | 진짜 문제 발생 시 감지 불능 | 감사 수치 self-coherent 유지 |

절충 없음. fix가 압도적으로 유리합니다.

## Step 4. Scope

**In:**
- `post-tool-use-task.js` frontmatter turnId 사후 패치 로직 (~15줄)
- 패치 후 오탐 gap 소거 검증
- `session-end-finalize.js` 소비 경로 확인

**Out (명시 제외):**
- R-3 (`extractReportsPath` silent skip) — 별도 토픽
- 병렬 dispatch race condition 근본 재설계 — R-1 실제 위험 낮음, 과투자 금지
- 다른 gap 유형 일괄 점검 — scope creep
- `validate-session-turns.ts` 리팩터 — 별도 토픽

## Step 5. 핵심 전제

- 🔴 `post-tool-use-task.js`가 frontmatter를 쓰기 가능한 시점에 실행된다 — 틀리면 전략 무효. Arki 검증 필수.
- 🟡 R-1 판정(순차 실행)이 실측 기반 — session_167 단일 세션 기준. 병렬 fire 드물게 발생 가능.

## Step 6. 인지편향 감사

**가용성 편향:** 보이는 gap만 과대평가 → 빈도로 판단하면 방치 편향 발생. 실제 위험은 발생 빈도가 아니라 오탐 누적 시 체계적 신뢰도 훼손.

**현상 유지 편향:** "지금까지 큰 문제 없었다" → 방치 정당화. 15줄 fix가 충분한데 관성으로 미루는 패턴.

## Step 7. executionPlanMode

`plan` — 검증 게이트 포함 실행계획 필요. Arki 이관.

## 결론

violations[]는 이 시스템의 양심입니다. 양심이 오탐을 내면 아무도 그 숫자를 믿지 않게 됩니다. 비용 0에 가까운 fix로 self-coherence를 복원할 수 있는데 방치할 이유가 없습니다. 지금 수습하는 것이 맞습니다.
