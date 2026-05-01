---
role: arki
session: session_160
topic: topic_141
topicSlug: bigbang-completion-review
date: 2026-05-01
turnId: 1
invocationMode: subagent
rev: 1
---

# Arki — 구조 진단: Edi LLM 미호출 패턴

## 1. 세션 기록 분석

`session_index.json` 최근 12건 (session_148~session_159) 분석:

| 세션 | Grade | agentsCompleted에 edi 포함 | edi source |
|---|---|---|---|
| session_148 | A | Y | 불명 (turns 미확인) |
| session_149 | A | Y | 불명 |
| session_150 | A | Y | 불명 |
| session_151 | A | Y | 불명 |
| session_152 | B | Y | 불명 |
| session_153 | S | Y | 불명 |
| session_154 | A | Y | 불명 |
| session_155 | A | Y | 불명 |
| session_156 | S | Y | 불명 |
| session_157 | C | Y | mechanical(예상) |
| session_158 | C | Y | mechanical(예상) |
| session_159 | **B** | **Y (edi만 포함)** | **불명** |

**session_159 turns 실측:**
```json
"turns": [{ "role": "edi", "turnIdx": 0, "phase": "compile" }]
```
- `source` 필드 **없음** → `auditEdiLlmInvocation`의 `llmEdiTurn` 검출 불가 (`t.source === 'agent'` 조건 미충족)
- 보고서 파일: `edi_auto_rev1.md` (frontmatter `auto-compiled: true`) → `llmEdiFile` 검출도 불가

**session_160 현재 상태:**
- `agentsCompleted: []`, `turns: [{role: "ace", source: "agent"}]`
- Edi turn 없음 — 현 세션에서 Edi LLM 미호출 상태

**결론:** session_159는 edi가 agentsCompleted에 기재되었으나, 실제로는 mechanical fallback(auto-compiled)만 박제된 상태. session_160은 현재 진행 중으로 Edi 미호출.

---

## 2. auditEdiLlmInvocation 감지 조건 (코드 직접 인용)

`.claude/hooks/session-end-finalize.js` lines 845–869:

```javascript
function auditEdiLlmInvocation(sess) {
  const grade = (sess.grade || '').toUpperCase();
  const isEnforced = grade === 'A' || grade === 'B' || grade === 'S';

  // LLM Edi 호출 검출
  const turns = Array.isArray(sess.turns) ? sess.turns : [];
  const llmEdiTurn = turns.some(t => t && t.role === 'edi' && t.source === 'agent');

  let llmEdiFile = false;
  if (sess.reportPath) {
    const reportsDir = path.join(CWD, sess.reportPath);
    if (fs.existsSync(reportsDir)) {
      try {
        const files = fs.readdirSync(reportsDir).filter(f => /^edi_rev\d+\.md$/.test(f));
        for (const f of files) {
          try {
            const head = fs.readFileSync(path.join(reportsDir, f), 'utf8').slice(0, 500);
            if (!/^auto-compiled:\s*true/m.test(head)) { llmEdiFile = true; break; }
          } catch {}
        }
      } catch {}
    }
  }

  const llmEdiPresent = llmEdiTurn || llmEdiFile;
  if (llmEdiPresent) { return; }   // LLM 검출 시 조기 반환
  ...
```

**감지 로직 2신호:**
1. `llmEdiTurn`: `turns[].role === 'edi'` **AND** `turns[].source === 'agent'` — 두 조건 모두 필요
2. `llmEdiFile`: `edi_rev*.md` 파일 존재 **AND** frontmatter `auto-compiled: true` **없음**

**구조적 취약점 식별:**
- `source === 'agent'` 필드는 `post-tool-use-task.js`가 Agent 툴 경유 시 박제 (PD-052)
- Agent 툴 미사용(메인 인라인 발언)이면 `source` 필드 자체가 없음 → `llmEdiTurn = false`
- 즉, **메인(Nexus)이 Edi를 인라인으로 발언하면 LLM Edi로 감지되지 않음**

---

## 3. dispatch_config.json Edi 정의

`memory/shared/dispatch_config.json` 확인 결과:

```json
{
  "rules": {
    "jobs": { "trigger": {...}, "auto_hook": false },
    "sage": { "trigger": {...}, "auto_hook": false },
    "zero": { "scope_areas": [...], "auto_hook": false }
  }
}
```

**Edi는 dispatch_config.json에 rule 정의 없음.**

- `jobs`, `sage`, `zero` 3개 역할만 명시적 rule 존재
- Edi 자동 호출 트리거·격리 정책·auto_hook 설정 0건
- dispatch_config는 Edi 발동 조건에 대해 **완전히 침묵**

**구조적 함의:** Edi 호출은 시스템(hook)이 강제하지 않음. 오케스트레이터(Nexus/Main)의 자율 판단에 의존.

---

## 4. 역할 페르소나 호출 방식

`memory/roles/personas/role-edi.md` frontmatter:

```yaml
model: opus
description: 레전드팀 Edi(에디) 역할 서브에이전트. 모든 역할 발언 후 마지막에 호출. 산출물 컴파일·형식화·최종 아티팩트 생성.
```

- `model: opus` — LLM 서브에이전트로 명시 (opus 모델)
- `description`에 "모든 역할 발언 후 마지막에 호출" 명시

**그러나 호출 방식(Agent 툴 vs 인라인)은 personas/role-edi.md에 명시되어 있지 않음.**
`memory/roles/policies/role-edi.md`도 호출 주체와 메커니즘을 기술하지 않음 — 발언 구조·지표만 박제.

---

## 5. CLAUDE.md Edi Protocol 해석

CLAUDE.md Edi Protocol 섹션:

> "Edi speaks last in Observation Mode, after Ace's comprehensive review (or directly after roles if `/ace-synthesis` not invoked, D-130)"
> "Edi compiles, formats, and outputs final artifacts — does not perform independent synthesis or judgment"

Grade A/B/S feedback (memory): **"Grade A/S 역할 발언은 Agent 툴 서브 호출 필수, Main inline 금지 (session_090, D-066)"**

**해석:**
- CLAUDE.md는 Edi를 "마지막 발언자"로 정의하지만, 호출 수단(Agent 툴 vs 인라인)을 명시하지 않음
- D-066 + feedback(grade_a_subagent_enforcement)은 Grade A/S에서 Agent 툴 서브 호출 **필수**, 메인 인라인 금지
- 따라서 Grade A/B 세션에서 Edi는 Agent 툴로 서브에이전트 호출되어야 함
- `auditEdiLlmInvocation`은 정확히 이 조건(`t.source === 'agent'`)으로 LLM 검출

**결론:** Agent 툴로 호출해야 LLM Edi로 인정. 메인 인라인 Edi 발언은 시스템 관점에서 "미호출"과 동치.

---

## 6. 근본 원인 가설 (3개)

### 가설 H-1: Nexus(Main)가 Edi를 Agent 툴 대신 인라인으로 처리 — 가장 유력

**증거:**
- session_159 turns: `{role: "edi", source: undefined}` — `source: 'agent'` 없음
- CLAUDE.md에 "Grade A/S Agent 툴 필수"가 명시되어 있으나 Edi Protocol 섹션 자체에는 재기술 없음
- dispatch_config에 Edi 자동 강제 hook 없음 → Nexus 자율 판단에 의존

**구조적 경로:** Nexus가 세션 진행 중 Edi를 직접 발언(인라인)하거나, Edi 호출 자체를 생략 → `source: 'agent'` 미박제 → `auditEdiLlmInvocation`이 LLM 미검출로 판정 → edi_auto_rev1.md 기계 생성.

**mitigation:** `.claude/hooks/pre-tool-use-task.js` 또는 orchestration 지시에 "Edi = Agent 툴 강제" 명시 + dispatch_config에 edi rule 추가.

---

### 가설 H-2: agentsCompleted와 turns.source 간 기록 불일치 — 이차 원인

**증거:**
- session_159: `agentsCompleted: ["edi"]`이지만 `turns[0].source` 없음
- `agentsCompleted`는 자동 기록 경로와 수동 기록 경로가 혼재할 가능성 있음
- `post-tool-use-task.js`가 Agent 툴 경유 시 `source: 'agent'` 박제하지만, 세션 `agentsCompleted` 갱신은 별도 경로

**구조적 경로:** agentsCompleted는 박제되었으나 turns.source 미박제 → auditEdiLlmInvocation 두 신호 모두 false → 정상 완료였음에도 edi-llm-skipped 오탐 가능성.

**단, session_159 edi_auto_rev1.md가 실제로 auto-compiled: true로 확인됨** → 오탐이 아닌 실제 미호출 확인.

---

### 가설 H-3: Grade A 세션 종료 시 오케스트레이션 흐름에서 Edi 호출 단계 누락 — 운영 실수형

**증거:**
- session_159 `agentsCompleted: ["edi"]`이며 다른 역할(ace, arki, riki 등)이 없음 → Edi만 기록된 비정상 패턴
- 즉 session_159는 실질적으로 BigBang 완료 검토 세션인데 대부분 역할 발언이 agentsCompleted에 미기록
- Edi가 "마지막 발언자"여야 하나, 앞선 역할들이 Agent 툴로 호출되지 않은 채 세션이 진행된 것으로 추정

**구조적 경로:** Master 또는 Nexus가 세션 후반부에 Edi 호출 단계 없이 세션을 종료 → session-end-finalize.js가 Edi 미호출 감지 → 기계 생성.

**mitigation:** 세션 종료 checklist에 "Grade A/B/S이면 Edi LLM 호출 확인" 게이트 추가 (현재 warn-only → 명시적 체크리스트 항목화).

---

## 구조적 결론

**1차 구조적 결함: 강제 메커니즘 부재**

```
Grade A/B/S 세션 종료 흐름:
  Nexus(Main) 오케스트레이션
    → Edi 호출 의무: CLAUDE.md에 명시 + D-066 강제
    → 강제 수단: 없음 (dispatch_config Edi rule 없음, pre-hook 없음)
    → 실제 감지: 세션 종료 후 auditEdiLlmInvocation (사후 탐지 only)
    → 처리: warn-only (4신호 박제, 차단 아님)
```

**2차 구조적 결함: 감지 조건 취약**

`auditEdiLlmInvocation` 두 신호 모두 `post-tool-use-task.js`의 `source: 'agent'` 박제 또는 파일 존재 여부에만 의존. Nexus 인라인 Edi 발언은 감지 불가.

**의존 그래프:**
```
D-066(Grade A Agent 필수) → [지시 문서만] → Nexus 판단
                                             ↘ Edi LLM 호출 여부 결정
auditEdiLlmInvocation ← session-end-finalize.js
                       ← turns[].source='agent' (post-tool-use-task.js 박제)
                       ← edi_rev*.md (auto-compiled 없음)
```

→ D-066 준수는 Nexus 자율 판단에 100% 의존. hook이 사전 차단하지 않음.

---

## 권고

**R-1 (MUST_NOW): dispatch_config.json에 Edi rule 추가**
```json
"edi": {
  "trigger": { "auto_at": "session_end", "grade": ["A","B","S"] },
  "auto_hook": false,
  "enforcement": "warn-only",
  "invocation_mode": "agent"
}
```
강제 차단은 warn-only 유지하되, invocation_mode를 명시적으로 문서화.

**R-2 (MUST_NOW): CLAUDE.md Edi Protocol에 호출 수단 명시**
현재: "Edi speaks last..."
추가: "Grade A/B/S에서 Edi는 Agent 툴(서브에이전트)로 호출 필수. 인라인 발언은 LLM Edi로 미인정 (D-066, auditEdiLlmInvocation 감지 조건)."

**R-3 (SHOULD): Session End 체크리스트 8단계에 Edi LLM 호출 확인 추가**
현재 체크리스트에 Edi LLM 호출 명시적 항목 없음. "Grade A/B/S 세션: Edi LLM Agent 호출 여부 확인" 항목 추가.

**R-4 (DEFER): pre-tool-use 게이트 → 사전 차단 강화**
세션 종료 직전 Phase에서 Edi 미호출 감지 시 Nexus 인터럽트. 현재 warn-only로 충분하나, 반복 누적 시 hard-block 전환 검토.

---

**자기감사 1차 — 발견 3개 / 각 축 최소 3지점 검사 / ROI 라벨 의무**

structuration: dispatch_config Edi rule 부재(MUST_NOW), CLAUDE.md Edi Protocol 호출 수단 미명시(MUST_NOW), Session End 체크리스트 Edi 확인 항목 미포함(SHOULD)
hardcoding: No issue at this dimension
efficiency: auditEdiLlmInvocation 두 신호만으로 LLM 검출 — 신호 추가 SHOULD, 현재는 충분
extensibility: dispatch_config 확장으로 다른 역할도 동일 패턴 적용 가능 SHOULD

**자기감사 2차 — 발견 1개 / 추가 축 전환 검사**

structuration 보완: session_159 agentsCompleted에 "edi"만 있고 다른 역할 없는 점 — 세션 기록 불완전성(pre-hook 미실행 또는 수동 기록 가능성). 이 자체는 별도 이슈이나, agentsCompleted가 LLM 호출 증거로 신뢰될 수 없음을 재확인.

**자기감사 3차 — 발견 0개** → 종료 조건 충족.
