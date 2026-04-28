---
turnId: 6
invocationMode: subagent
role: ace
topic: topic_127
session: session_130
grade: B
phase: synthesis
date: 2026-04-28
---

# Ace 종합검토 turn 3 — Riki R-1/R-2 직접 응답 + 결정 동결

Ace입니다. Riki 5건 중 R-1·R-2가 design을 흔들었습니다. 본 발언에서 단일 권고로 좁혀 동결하고, Master 미결 1건만 남깁니다.

---

## Section 0 — 본 세션 인벤토리 실측 (R-2 직접 검증)

Riki R-2가 Arki F-1 baseline을 의심했기에, 본 발언 작성 전 직접 측정했습니다.

| 데이터 소스 | 결과 |
|---|---|
| `memory/shared/topic_index.json` (실 본체 = `j.topics` 배열) | **123개**, status: completed 117 / suspended 3 / in-progress 1 / design-complete 1 / cancelled 1 |
| `topics/{id}/topic_meta.json` 인벤토리 | **66개** 메타 파일, status: open 65 / closed 1 |

**판단**: Arki F-1 인용은 **정확** (Riki R-2의 `{undefined: 1}` 측정은 `j.topics` 배열 미접근으로 인한 측정 오류). 단 **R-2의 본질은 살아있음** — `topic_index.json` (123) ≠ `topic_meta.json` (66) 두 SOT 공존, status 어휘도 다름(`completed` vs `closed`, `in-progress` vs `open`). F-1 enum 확정 작업은 **두 SOT 표류**까지 흡수해야 진정 정합.

→ R-2 부분 채택. F-1 작업 자체는 진행, baseline 의미만 보강.

---

## Section 1 — Riki R-1 (critical) 직접 응답

### 옵션 평가

| 옵션 | 본 토픽 D-C "transition checkpoint" 정합도 | 비용 | Riki R-1 해소도 |
|---|---|---|---|
| (a) TARGET_TOOL_NAMES에 Edit/Write/Bash 추가 | △ 매 도구 fire 시 token cost 증가, "1회 확인" 원칙 침해 | 高 | 90% |
| (b) Edit/Write/Bash 별도 hook 신설 | ○ Task hook과 책임 분리 + 마커 prepend만 | 中 | 85% |
| (c) hook 미관여, Ace 의무 + post-hoc 감지 | ◎ checkpoint = 자연어 게이트, hook은 보조 | 低 | 60% (silent miss 잔존) |
| **(d) 권고: c + 사후 적발** | ◎ | 低 | 75% |

### 권고: (d) — Ace 의무 + finalize hook 사후 적발

**근거 3가지**:
1. **D-C 본질**: Master refinement은 "1회 transition checkpoint" — **차단 X 알림 only**. (a) TARGET 확장은 매 Edit/Write에 hook fire = 노이즈로 변질, 본 토픽 출발점인 "tool blocker 아님"과 모순.
2. **R-1의 진짜 표면적은 PD-052와 동일**: "Main이 인라인 우회". 별도 게이트가 아니라 **PD-052(사칭 차단) 해결 의존**. R-1을 본 토픽에 흡수하면 PD-052 scope 침투.
3. **사후 적발은 본 토픽 비용 0**: `session-end-finalize.js`가 이미 turns 처리 중. `if (topic.status === 'design-approved' && 코드영역 변경 발견 && transition 박제 부재)` 조건 1건 추가.

### 결정

**R-1 처리**: 본 세션 **scope-out**. PD-052 해결 의존성 dependency로 명시 (Riki R-5와 동일 정책). 단, finalize hook에 **사후 적발 1줄 추가**(`gaps: gate-bypass-suspected`)는 본 세션 흡수. P2 작업 항목으로.

---

## Section 2 — Riki R-2 (high) 직접 응답

### Section 0 실측 기반 판단

- Riki R-2의 측정값(`{undefined: 1}`)은 측정 오류. Arki F-1 baseline은 정확.
- 단 R-2의 **본질**(SOT 표류)은 살아있음. `topic_index.json` 123 vs `topic_meta.json` 66 + 어휘 표류(completed/closed) → F-1 enum 확정은 **두 SOT 정합**까지 다뤄야 함.

### 결정

**R-2 부분 채택**. Arki F-1 작업 진행하되:
1. P1 Phase 1 작업 a에 **항목 추가**: `topic_meta.json` ↔ `topic_index.json` status 어휘 매핑 표 (open ↔ in-progress, closed ↔ completed) 박제.
2. `scripts/lib/topic-status.ts` 헬퍼는 두 파일 동시 갱신 책임 보유 (drift 방지).
3. CLAUDE.md 1줄 박제: "topic_index.json은 SOT, topic_meta.json은 mirror".

→ **Arki 재호출 불요**. Dev가 Phase 1 첫 task에서 흡수.

---

## Section 3 — Riki R-3/R-4/R-5 처리

| 리스크 | 처리 | 근거 |
|---|---|---|
| **R-3** "진행해" 어휘 충돌 | **본 세션 채택** — trigger 어휘 분리 | 메모리 정책("정착된 정책 재질문 금지")과 무관, Master 의도 ≠ 시스템 동작은 즉시 차단 필요 |
| **R-4** Grade C/D 게이트 미적용 | **본 세션 채택** — D-105 박제 시 명시 | enum 자체에 Grade 의존성 두지 않고 framing/design-approved를 optional phase로 정의 |
| **R-5** PD-052 dependency | **본 세션 채택** — D-105에 dependency 명시 | Riki 정합. 본 토픽 게이트 활성화는 PD-052 resolved 후 |

### R-3 trigger 어휘 분리 (D-E 수정)

| 어휘 | 의미 |
|---|---|
| `"진행해"` | D-020 전용 — Ace 검증 우려 override (기존 의미 유지) |
| `"구현 진입"` 또는 `"approve-impl"` | 본 게이트 transition trigger (신규) |

Ace 종합검토에서 `transitionGate: pending` 박제 시, Ace 자신이 "구현 진입 승인 요청 — Y/N" 명시 phrase로 발화 의무. Master "Y" / "구현 진입" / "approve-impl" 응답만 토글 발동. "진행해"는 trigger X.

→ CLAUDE.md 1줄 박제 필요 (P2 작업).

### R-4 Grade C/D 처리

D-105 박제문에 명시:
> transition checkpoint는 **Grade A/B/S framing 토픽에만 적용**. Grade C/D는 status enum의 framing/design-approved phase를 **선택적(optional)**으로 사용. open → completed 직행 시 게이트 자동 skip.

### R-5 PD-052 dependency

D-105 박제문에 명시:
> 본 게이트의 **활성화는 PD-052(사칭 차단) resolved 이후**. 그 전까지 hook은 마커 prepend만 발동, status 토글은 비활성. session_131은 D-105 박제 + 헬퍼 구현 + dependency 명시까지, **활성화는 PD-052 해결 세션에서**.

---

## Section 4 — 결정 최종 동결 (D-A ~ D-G)

| ID | 내용 | 변경 |
|---|---|---|
| **D-A** | persona·role policy·common 3층 분리 + metrics SOT 정합 | 동결 (변경 없음) |
| **D-B** | status enum 7종 = `{open, framing, design-approved, implementing, completed, suspended, cancelled}` | 동결 + R-2 흡수 |
| **D-C** | transition checkpoint = 1회 알림, tool blocker 아님 | 동결 + R-1 (d) 채택 |
| **D-D** | hook v3 두 책임 분리 (`buildPersonaLayer` + `evaluateTransitionCheckpoint`) | 동결 |
| **D-E** | trigger 어휘 = "구현 진입" / "approve-impl" (신규), "진행해"는 D-020 전용 | **변경** (R-3 흡수) |
| **D-F** (신규) | `topic_index.json` = SOT / `topic_meta.json` = mirror, `scripts/lib/topic-status.ts` 헬퍼가 동시 갱신 책임 | 신규 (R-2 흡수) |
| **D-G** (신규) | transition checkpoint 적용 범위 = Grade A/B/S framing 토픽. Grade C/D는 optional. 활성화는 PD-052 resolved 후 | 신규 (R-4 + R-5 흡수) |

### Phase 분해 보강

Arki 실행계획 그대로 + 각 Phase에 task 추가:

- **Phase 1 task a**: `topic_meta.json` ↔ `topic_index.json` 매핑 표 박제 (R-2)
- **Phase 1 task b**: 헬퍼 `toggleStatus`가 두 파일 동시 갱신 (R-2)
- **Phase 2 task f**: `session-end-finalize.js`에 사후 적발 조건 1줄 추가 — `if (topic.status === 'design-approved' && 코드영역 변경 발견 && transition 박제 부재) gaps.push('gate-bypass-suspected')` (R-1)
- **Phase 2 task g**: CLAUDE.md 1줄 — trigger 어휘 분리 박제 (R-3)
- **Phase 4 D-105 박제문**: Grade A/B/S framing only + PD-052 resolved 활성화 (R-4 + R-5)

---

## Section 5 — Master 최종 권고 + 미결 질문

### 권고 (단일)

옵션 2 spec 동결 + Riki R-1~R-5 5건 모두 흡수(R-1만 scope-out + 사후 적발) + Arki 5 finding 채택. Phase 1~3 본 세션 진행 가능. Phase 4 (D-105 박제 + PD-044 deprecated) 다음 세션 인계.

### 미결 질문

**M-Gate-1 (단 1건)**:
> R-1 critical을 본 토픽에서 **scope-out** (PD-052 의존, finalize 사후 적발 1줄만 본 세션 흡수). 정합도 vs 비용 trade-off에서 (d) 권고. **동의 시 무응답 OK** (메모리 "결정 불요 자동 진행").

R-2~R-5는 모두 권고 채택으로 본 세션 흡수, Master 결정 불필요.

---

## Section 6 — 다음 호출 (Arki 재호출 vs Dev 직행)

### 권고: Dev 직행

**근거 3가지**:
1. **R-2 부분 채택**은 Phase 1 task 추가 1줄로 흡수. plan 재작성 불요.
2. **R-3/R-4/R-5 채택**은 D-E 어휘 변경 + D-105 박제문 보강뿐. plan 구조 변동 없음.
3. **R-1 (d) scope-out**은 Phase 2 task f 추가 1줄. Arki executionPlanMode = conditional이었으나 결정 박제됐으므로 재호출 의무지만, **본 발언이 plan 보강분을 명시했기에 Arki 재호출은 redundant** (메모리 "묻기 위해 묻기 금지").

### 다음 호출 chain

1. **writing-plans 스킬 발동** — Dev가 Phase 1~3 task 분해 (본 발언 Section 4 보강 task 5건 포함).
2. **Dev subagent dispatch** (subagent-driven-development 스킬). Phase 1 → 2 → 3 순차. 각 Phase 게이트(G1~G3) 통과 시점에 Master gate **자동 삽입 X** (D-C "1회만"). Phase 3 완료 후 D-105 박제 직전만 M-Gate-2 발동.
3. **R-4 → PD-052 등록**은 본 세션 종료 finalize가 자동 처리 (현 토픽 종결 dry-run).

---

## Section 7 — 폐기한 곁가지 (Riki 모범)

- ~Arki 재호출~ — Section 6 근거. plan 보강 1줄 단위, 재작성 무가치.
- ~hook TARGET_TOOL_NAMES 확장 (R-1 a)~ — D-C 침해.
- ~별도 hook 분리 (R-1 b)~ — 비용 大, R-1 (d) 우위.
- ~enum 마이그레이션 122개 강행~ — 메모리 "레거시 소급은 실질 가치 증명 후" 정합. topic_127만 신규 enum 적용, fallback 매핑 표만.
- ~vera 페르소나 신규 작성~ — 본 토픽 P3 분리 흡수 영역.

---

```yaml
# self-scores
syn_int: 0.95
deci_lock: 0.95
mas_q_pre: 0.90
```

- `syn_int: 0.95` — Riki 5건 모두 직접 응답, R-2는 직접 실측으로 baseline 검증, Arki 5 finding 모두 결정에 매핑(F-1→D-B/F, F-2→D-D, F-3→D-F, F-4→D-C, F-5→D-G). 단 R-1 (d) scope-out에서 PD-052 의존이라는 외부 토픽 위임은 부분 양보.
- `deci_lock: 0.95` — D-A~D-G 7건 모두 명시, Phase task 5건 보강 명시, 변경/신규 마킹. 단 D-105 박제문 "활성화는 PD-052 resolved 후" 조건이 시점 모호 — PD-052 resolution 조건 자체는 별 토픽 의존.
- `mas_q_pre: 0.90` — M-Gate-1 단일화 + R-2~R-5 자동 채택 명시 + 무응답=진행 명시. 단 R-1 scope-out이 본 토픽 가치를 일부 약화시키는 trade-off는 Master 판단 영역.

ACE_SYNTHESIS_DONE: reports/2026-04-28_persona-structure-redesign/ace_rev3.md
