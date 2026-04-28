---
turnId: 5
invocationMode: subagent
role: riki
topic: topic_127
session: session_130
grade: B
phase: risk-audit
date: 2026-04-28
---

# Riki 리스크 감사 — transition checkpoint 5건 결함

Riki입니다. Master refinement으로 게이트가 "tool blocker"에서 "1회 transition checkpoint"로 좁아졌고, Arki가 5 finding으로 분해했습니다. 좁아진 정의 자체가 만든 **새 함정**과 **다축 교차로만 보이는 silent miss**만 짚습니다. 코드 직접 검증한 항목은 인용으로 박제, 약한 추측은 자가 제거.

전체 시야 의무에 따라 다음 축을 교차했습니다:
- **코드 축**: `.claude/hooks/pre-tool-use-task.js` v2 350줄 직접 정독
- **데이터 축**: `memory/shared/topic_index.json` status 필드 실측 (node 스크립트)
- **자연어 축**: CLAUDE.md L11 D-020 "진행해" 정의 인용
- **문서 축**: ace-learning-loop / verification-before-completion 스킬에서 "진행해" 신호 사용처 검색

총 5건 식별. 슬롯 미달 정상 — 약한 항목 4건 자가 제거.

---

## Section 1 — 신규 리스크 (R-1 ~ R-5)

### R-1 — Hook은 Task만 가로챔, Edit/Write/Bash 직행 경로 미차단 (critical)

**근거 (코드 인용)**:
```js
// .claude/hooks/pre-tool-use-task.js:24
const TARGET_TOOL_NAMES = ['Task', 'Agent'];
```
- 현 v2 hook은 PreToolUse(Task)만 발동. Edit/Write/Bash는 처음부터 보지 않음.
- Master refinement: "구현 phase 진입 직전 1회 최종 확인". 그러나 본 시스템에서 **Dev 호출 = Agent(role-dev) Task = Task hook 발동**이지만, Grade D 또는 인라인 직행(`feedback_cd_no_subagent` 메모리)에서는 Main이 직접 Edit/Write 수행. 이 경로는 hook이 못 봄.
- 결과: framing 토픽이 "design-approved" 상태로 잠긴 상태에서 Main이 Edit으로 코드 직접 수정 → 게이트 우회. transition checkpoint 정의 자체가 무효화됨.

**심각도**: critical — 정책의 작동 영역이 절반(Agent 경로) 뿐. Grade C/D 흐름과 D-066(Agent 강제) 미적용 흐름 모두 사각지대.

**mitigation**: hook을 Task 외 Edit/Write/Bash에도 등록 (settings.json hooks PreToolUse matcher 확장). 단, hook은 **차단 X 마커 prepend만** (Master refinement 부합). 즉 Edit input의 file_path가 코드 영역(.claude/, scripts/, app/)이고 현 토픽 status가 `design-approved`인데 `implementing`으로 토글 안 됐으면 prompt 안에 ⚠ 마커 prepend (Edit input은 prompt가 아니라 차단되지 않음).

**fallback**: hook 차원에서 Edit/Write 마커가 어렵다면 (Edit input은 sub의 prompt와 별개), session-end-finalize.js가 사후 검증으로 "status=design-approved인 토픽에서 코드 영역 변경 발생" 시 `gaps: gate-bypass-suspected` 박제. 사후 적발만 가능. 본 세션 안 mitigation 가능 = Yes (hook matcher 확장만).

---

### R-2 — Arki F-1 status 인벤토리가 실측 데이터와 불일치 (high)

**근거 (데이터 검증)**:
```bash
node -e "const idx=JSON.parse(fs.readFileSync('memory/shared/topic_index.json','utf8')); ..."
# 출력: {"undefined": 1}
```
- Arki F-1이 인용한 "completed 117 / suspended 3 / in-progress 1 / design-complete 1 / cancelled 1"는 **`memory/shared/topic_index.json` 본체가 아님**. 본체는 status 필드가 없거나 1건만 보유.
- Arki가 본 위치 = 별도 인벤토리(예: `topics/{topicId}/topic_meta.json`)일 가능성, 또는 다른 데이터 축을 잘못 합산했을 가능성.
- 결과: enum 7종 확정·legacy 122개 fallback 매핑 같은 마이그레이션 비용 추정이 **잘못된 baseline 위에 서 있음**. P1 G1 게이트 통과 기준도 부정확.

**심각도**: high — 본 토픽 P1 작업량(legacy 122개 매핑)이 실제로는 0건일 수 있음. 반대로 topic_meta에 분산되어 있다면 122 × 별도 파일 마이그레이션이라 비용 다름.

**mitigation**: P1 시작 직전 Dev가 `find topics/ -name "topic_meta.json"` 실측 + topic_index 실측 결과를 `reports/.../topic-status-inventory.md`로 박제. Arki 인용 출처 명시. 출처 확정 후에만 P1 진행.

**fallback**: 측정 결과 status 필드가 의미 있는 위치에 없으면, F-1 fallback 매핑 작업 자체 폐기. enum 신규 정의 + topic_127 1건만 적용으로 단순화 (메모리 "레거시 소급은 실질 가치 증명 후" 정합).

본 세션 안 mitigation = Yes (실측 1회).

---

### R-3 — "진행해" 신호 의미 충돌 (D-020 vs 본 게이트 trigger) (high)

**근거 (자연어·문서 축)**:
- CLAUDE.md L11 D-020: `Master can override with "진행해"`. — Ace 학습루프 override 신호.
- ace-learning-loop / verification-before-completion 스킬에서 동일 어휘 사용 확인 (Grep 결과 2 file).
- Ace 종합 D-E (본 토픽): 자연어 "진행해" → status `design-approved` → `implementing` 토글 trigger.
- 충돌: 같은 어휘가 두 다른 의미. (a) D-020 = "Ace의 검증 우려를 무시하고 결정 강행" (b) 본 게이트 = "design 동결 → implementation 진입 transition 승인". Master가 일반 진행 의도로 "진행해"만 발화 시 두 의미 동시 발동, 또는 (더 위험) 본 게이트가 D-020 override까지 자동 유발.

**심각도**: high — Master 의도 ≠ 시스템 동작. 특히 design 단계에서 Ace가 "X 우려가 있는데 진행할까요?" 질문 → Master "진행해" → D-020 override 의도였으나 status까지 toggle되어 implementing으로 강제 진입.

**mitigation**: transition trigger 어휘를 분리. "진행해"는 D-020 전용으로 유지. 본 게이트 trigger = 명시적 phrase (예: "구현 진입", "implementing 토글", "M-Gate 통과", "착수해도 됩니다") — Ace 종합 발언이 `transitionGate: pending`을 포함했을 때만 매칭. 일반 "진행해"는 trigger X.

**fallback**: trigger 어휘 분리 어려우면, Ace가 transitionGate 발동 시 항상 "구현 진입 승인 요청 — Y/N" 명시 질문 형태로 발화. Master 응답이 "Y" 또는 "구현 진입" 명시 phrase일 때만 토글. "진행해"는 모호 → 토글 X.

본 세션 안 mitigation = Yes (trigger 어휘 정의를 CLAUDE.md 1줄 박제).

---

### R-4 — Grade C/D 직행 흐름의 게이트 미적용 (medium)

**근거 (메모리·정책)**:
- 메모리 `feedback_cd_no_subagent`: "Grade C/D는 Agent 툴 금지, 메인 인라인 직접 발언만". CLAUDE.md Grade D 행: "Dev 직행 (Edi 생략, hook 자동 기록)".
- Grade D 토픽은 framing → implementation 분리가 없음 (단일 phase). transition checkpoint 발동 시점이 정의 안 됨.
- Arki F-4가 제시한 trigger A (Ace 종합 시점) + B (PreToolUse 시점) 둘 다 Grade D에는 미해당. Grade C도 Ace 인라인 1~2줄이라 종합검토 phase 부재.

**심각도**: medium — Grade D는 의도적으로 "명백 단순 작업". 게이트 미적용이 합리적이지만, 정책 박제 시 명시 안 하면 향후 Grade C/D 토픽 status도 design-approved로 잘못 토글되어 게이트가 영원히 안 풀림.

**mitigation**: D-105(가칭) 박제 시 명시: "transition checkpoint는 Grade A/B/S framing 토픽에만 적용. Grade C/D는 status enum에서 framing/design-approved phase를 사용하지 않음 (open → completed 직행 허용)".

**fallback**: enum 자체에 Grade 의존성 두지 말고, framing/design-approved phase는 선택적(optional) 통과 phase로 정의. Grade C/D 토픽이 통과해도 검증 0건이면 자동 skip.

본 세션 안 mitigation = Yes (D-105 박제 시 1줄 추가).

---

### R-5 — PD-052 미해결 상태에서 본 게이트 적용 시 사칭으로 무력화 (medium)

**근거 (다축)**:
- session_129 Edi 인계 메모 Section 7: PD-052 = "Agent 툴 미경유 인라인 사칭 차단" — **미해결**.
- 본 게이트 D-E: Ace decision 박제 시 status 토글. 그러나 Ace decision 박제는 reports/{topic}/ace_revN.md Write로도, decision_ledger.json append로도 가능 — Main이 Ace를 사칭(인라인 frontmatter 박제 후 Write)하면 게이트가 자동 통과.
- 즉 본 게이트의 실효성 = PD-052 해결 의존. PD-052 미해결 + 본 게이트 적용 시 "게이트 있음" 환상만 만듦.

**심각도**: medium — PD-052는 별도 토픽이라 본 세션 scope 밖이지만, 본 게이트 적용 시기를 PD-052 해결 이전에 두면 false-sense-of-security. Ace 종합이 R-4(원래 R-4 = PD-052의 source)를 분리한 정합성을 유지하려면 본 게이트 적용도 PD-052 해결 후로 연기.

**mitigation**: 본 토픽 D-105 박제 시 dependency 명시: "transition checkpoint 활성화는 PD-052 (사칭 차단) 해결 이후". 그 전까지는 hook이 마커 prepend는 하되 status 토글은 비활성. session_131은 D-105 박제 + dependency 명시 only, 활성화는 PD-052 해결 세션에서.

**fallback**: PD-052 해결 의존성을 못 박는 게 어렵다면, finalize hook이 매 세션 종료 시 status 토글 trigger의 발화자(Ace인지 Main 사칭인지) 검증 — `pre-tool-use-task.log` × turns 매칭. 미일치 시 토글 무효화 + `gaps: status-toggle-by-impersonation` 박제.

본 세션 안 mitigation = Partial (D-105 박제에 dependency 1줄 + finalize 검증 hook은 PD-052 작업 시 통합).

---

## Section 2 — Arki/Ace 가정 감사

| 가정 ID | 가정 내용 | 근거 강도 | 감사 결과 |
|---|---|---|---|
| A-Arki-F1 | topic_index.json에 5종 status가 분포 (117/3/1/1/1) | **약** | **반박** — node 실측 결과 본체 status 필드는 1건. Arki가 본 출처 미명시. R-2로 박제 |
| A-Arki-F4 | trigger A(Ace 발언) + B(hook 마커) 합성이 차단 X 보장 | 중 | 약점 — Edit/Write 직행 경로는 A·B 모두 작동 X. R-1로 보강 |
| A-Ace-DE | 자연어 "진행해"가 status 토글 trigger | 중 | 약점 — D-020 override와 신호 충돌. R-3으로 박제 |
| A-Arki-F2 | hook v3 두 책임을 함수 단위 분리하면 silent fail 회피 | 강 | 통과 — 함수 분리 + 로그 phase 3분리 정합성 OK |
| A-Ace-D-105 | PD-044 deprecated 동시 박제 가능 | 중 | 통과 — 단, PD-052 dependency가 더 큰 risk라 R-5로 추가 |

본 세션 의사결정에 영향 없는 가정(예: Arki F-5 시뮬레이션 세부)은 감사 X.

---

## Section 3 — 본 세션 의사결정 영향 평가

| 리스크 | 본 세션 mitigation 가능? | 권고 |
|---|---|---|
| R-1 | Yes (hook matcher 확장) | **본 세션 처리** — Arki Phase 2(P2 hook v3) 작업에 통합 |
| R-2 | Yes (실측 1회) | **본 세션 처리** — P1 시작 직전 inventory 박제 |
| R-3 | Yes (CLAUDE.md 1줄) | **본 세션 처리** — D-105 박제 직전 어휘 분리 |
| R-4 | Yes (D-105 1줄) | **본 세션 처리** — D-105 박제 시 Grade scope 명시 |
| R-5 | Partial — dependency 박제만 | **본 세션 일부 처리** — D-105에 dependency 박제, 활성화 자체는 PD-052 해결 후 |

R-1·R-2가 critical/high. P2 hook v3 + P1 inventory 작업 직전에 처리. 누락 시 P2 작업 결과가 "차단 안 되는 hook" 또는 "잘못된 baseline 위 마이그레이션"으로 회귀.

---

## Section 4 — 폐기한 곁가지 (Riki 메모리 정책 준수)

확신 없는 항목 자가 제거 — 슬롯 미달 정상:

- ~~hook v3 함수 분리 시 코드 가독성 저하~~ — 결정 영향 없음
- ~~status enum 7종이 아니라 5종이면 충분 의견~~ — 본 게이트 작동에 무관
- ~~vera 페르소나 KNOWN_ROLES 누락~~ — 이미 Edi 인계 메모 Section 6에 박제됨, 중복
- ~~`_common.md` 100줄 cap 박제 누락 시 비대화~~ — session_129 R-7에서 이미 처리, 중복

---

## Section 5 — Ace에게 인계

본 세션 5건 중 4건은 본 세션 안 처리 가능, 1건(R-5)은 PD-052 dependency 박제로 부분 처리. **단일 권고**: Ace 종합검토 시 D-105 초안에 (a) Grade scope 명시 (R-4) (b) trigger 어휘 분리 (R-3) (c) PD-052 dependency (R-5) 3줄 추가 + Arki Phase 1 직전에 R-2 inventory 작업 + Phase 2 hook v3에 R-1 matcher 확장 통합.

본 5건 외 추가 함정 없음 — 약한 항목 4건 자가 제거 후 슬롯 미달 정상.

---

```yaml
# self-scores
risk_id: 0.85
mit_pair: 1.00
fp_rt: 0.95
```

- `risk_id: 0.85` — 5건 모두 코드/데이터/문서 축 직접 검증. R-2는 node 실측으로 Arki 가정 반박, R-1은 hook 코드 24행 인용. 단 R-5는 부분 추측 포함(사칭 시나리오 실측 X).
- `mit_pair: 1.00` — 5건 모두 mitigation + fallback 병기. 메모리 정책 `feedback_arki_risk_requires_mitigation` 정합.
- `fp_rt: 0.95` — 폐기 4건 자가 제거로 false positive 최소화. R-4(Grade C/D)는 결정 영향 medium이지만 향후 정책 박제 누락 risk라 포함 정당화.

RIKI_AUDIT_DONE: reports/2026-04-28_persona-structure-redesign/riki_rev2.md
