---
role: arki
session: session_092
topic: topic_097
rev: 1
phase: diagnosis
turnId: 1
invocationMode: subagent
---

# Arki rev1 — D-058 분기점 root cause 진단 (수정 금지, 진단만)

**모드**: 검시. 처방·구현·patch 0건. Master 지시: "수정은 하지말고 원인 파악. 그 분기가 문제면 그 로직을 제거."

---

## A. 분기 로직의 실작동 모드 단정

**(iii) 문서적 가이드.**

근거 (3중 합치):

1. **opus-dispatcher SKILL.md line 89 호출 contract**:
   ```
   Agent(
     subagent_type: agentFile에서 파생된 역할 이름,
     model: config.models.agentToolAliases[policy.subModel],
     prompt: contextPackage
   )
   ```
   — Task 툴의 `subagent_type` 파라미터는 **harness에 등록된** subagent 이름만 받음. `model` 파라미터로 모델 강제 가능 여부는 별개.

2. **`.claude/agents/role-{ace,arki,fin,riki}.md` frontmatter 실측**:
   - role-arki.md: `model: opus` + `description:` — **`name:` 필드 부재**.
   - role-ace.md 동일 패턴.
   - 레퍼런스: 본 세션 harness가 노출한 등록 subagent (`claude-code-guide`, `Explore`, `Plan`, `statusline-setup`) — 모두 다른 경로(plugin/system)에서 등록. role-* 4개는 이 목록에 **부재**.

3. **외부 앵커 (D-059)**: Anthropic Claude Code 공식 문서 `claude-code/sub-agents` 규약상 project-level subagent는 `.claude/agents/{name}.md`에 frontmatter `name:`(필수) + `description:`(필수)를 갖춰야 `subagent_type: <name>`으로 호출 가능. **현 4개 파일은 `name:` 누락 → harness 등록 실패 또는 silent skip 추정.** 단 정확한 등록 정책(`name` 누락 시 파일명 fallback 여부)은 외부 문서 1차 확인만으로 100% 단정 불가 — **앵커 강도: Medium. Master 또는 실호출 1회로 falsification 권고**.

**보조 증거**:
- `.claude/hooks/post-tool-use-task.js` line 32: `KNOWN_ROLES = ['ace', 'arki', 'fin', 'riki', ...]` — hook은 `subagent_type` 문자열에서 역할명을 **추출만** 한다. 즉 hook 본인은 등록 여부와 무관하게 동작. 메인이 `subagent_type: "role-arki"` 입력으로 Task를 호출했을 때 (a) harness가 fallback해서 general-purpose로 실행 + (b) hook은 prompt 메타만 보고 turn을 박제 — 이 조합이면 "박제는 되지만 실등록은 아님"이라는 dual-sat 9건의 정확한 패턴이 발생.

**단정**: 분기 로직은 **문서적 가이드 + Sonnet 메인 self-roleplay + hook 박제 자동화** 3개의 합성. "Opus 서브 격리 호출"의 물리적 증거는 dispatcher-probe(2026-04-22) Probe 1~3 1회뿐이며 그 이후 22세션 동안 재측정 0회.

---

## B. Root Cause Tree (depth 3)

### 1차 원인 (직접)
**`.claude/agents/role-*.md` 4개 파일의 frontmatter가 Claude Code subagent 등록 규약을 충족하지 못함 (또는 충족 여부가 측정되지 않은 채 D-058이 채택됨).**

- 표면: `name:` 필드 부재. 등록된 subagent 목록에서 부재.
- 결과: opus-dispatcher 스킬이 호출하는 `subagent_type: "role-arki"`가 harness에서 unknown 또는 silent fallback. 메인(Sonnet)이 결국 self-roleplay하며 `Opus 서브` label만 박제.

### 2차 원인 (왜 1차가 발생)
**D-058 채택 시점에 dispatcher-probe 3건 통과를 "구조 충족"으로 오역.**

- session_068 ace_rev2: "Probe 1: E1 라우팅 ✅ — Sonnet 4.6 메인 → opus 서브 → 실제 Opus 4.7 동작" → **probe 3건은 "Agent 툴이 model 파라미터를 받는다"만 입증.** subagent_type 등록 규약·재현성·22세션 잠복 후 동작은 미검증.
- Arki rev1 (session_068) "E1 즉시 검증" 자체가 1줄: `✅ Agent tool 스키마에 model 파라미터 존재. 단, 정확한 버전 강제는 에이전트 정의 파일 frontmatter 필요.` — frontmatter 요건을 인지했으나 **실제 frontmatter 작성 → harness 등록 → 재호출 검증 게이트(G1)를 실행계획에 두고 통과 증거 박제 없이** 다음 phase로 진행.
- 즉 P1(서브에이전트 정의 4종 + G1 검증)이 "파일 생성"으로만 종결되고 "harness 등록·실호출 검증"이 G1에서 빠짐. Arki 자기 책임 — 실행계획 게이트 정의 부실.

### 3차 원인 (왜 22세션 미적발)
**측정 인프라가 결정보다 22세션 늦게 도입됨 + Master 즉시 자각이 PD로만 정리된 채 잠복.**

- `invocationMode` 필드 자체가 session_090에서 처음 도입 (rev4 §2.3, session_index.json grep 11회 모두 session_090 한정). 22세션 동안 "Main inline vs subagent" 측정 불가.
- master_feedback_log line 191 (session_068 직후): `"현 구현은 의도와 불일치. 재구현은 다음 이연과제로."` — Master 본인이 즉시 자각했지만 "재구현 = D-058 = 완료"로 ledger 박제. 이연과제(PD)가 stale로 누적되며 이후 21세션 동안 dispatcher 본인을 검증할 동기 부재.
- 동시에 Schedule-on-Demand·grade 시스템·turns 신설·growth metrics 등 **다른** 표면이 Master 시야를 점유 → dispatcher는 "이미 결정난 인프라"로 신뢰됨.
- session_090에서 invocationMode 도입과 동시에 **첫 측정에서 즉시 inline-main 3건 검출** — 22세션 잠복은 측정 부재가 유일한 잠복 메커니즘.

---

## C. 분기 로직 제거 시뮬레이션

**가정**: D-058 폐기, Grade A/S에서도 Sonnet 메인 + (서브화 없이) inline 역할 수행 허용. opus-dispatcher 스킬 폐기. dispatch_config의 `dispatchSubs` 정책 무력화.

### 잃는 것
1. **Opus 급 역할 발언 품질의 명목적 보장.** Grade A 토픽에서 Arki/Fin/Riki/Ace 분석이 Sonnet 4.6 inline 품질로 회귀. (단, 잠복 22세션 동안 이미 사실상 그 품질로 운영되고 있었으므로 "잃음"의 실체는 명목뿐일 수 있음 — measurement 부재로 quality delta 단정 불가.)
2. **역할 격리 가능성 옵션.** 향후 진짜 등록을 다시 시도할 때 사용할 수 있던 인프라(role-*.md 4개) 폐기.
3. **Grade S Opus 메인 정책의 정당화 근거 약화.** Grade A는 inline 허용이지만 Grade S만 Opus 메인 강제하는 비대칭이 어색해짐.

### 얻는 것
1. **Schema·hook·검증 부채 즉시 해소.** D-067/D-068/D-069/D-070 4개 결정의 존재 이유(=양자 충족 baseline)가 사라짐. invocationMode·subagentId·turnId·양자 충족 필터·immutable snapshot 모두 폐기 가능.
2. **dual-sat 9건 경보 자동 소멸.** 측정 대상 자체가 사라지므로 gaps 박제 메커니즘 필요 없음.
3. **operating model 단순화.** "메인이 모든 역할을 inline으로 수행"이 D-019 (Ace 오케스트레이터 선언)의 원래 의도와 정합. D-019는 호출 매체(Task tool)를 명문화하지 않았음 (rev4 후보 #1) — D-058이 Task tool을 사후 도입하며 매체 의무를 만들었지만 정작 등록은 빼먹은 비대칭.
4. **F-005 (Ace relay 금지) 자연 무력화.** subagent 응답을 Ace가 전달하는 패턴 자체가 사라짐.

### 남는 부채
1. **D-066 (session_090) — Grade A 서브에이전트 강제** 무효화 필요. 이 결정이 dispatcher 존재를 전제하므로.
2. **D-067~D-070 (session_091) 4개 결정** 전부 무효화 또는 의미 재정의 필요. 이미 c9e6604 commit으로 코드 적용된 부분 (frontmatter 의무, post-tool-use-task.js hook, finalize 확장, immutable 마커) 롤백.
3. **legacy 처리**: session_090·091 entry는 "측정 첫 시도 → 위반 → 폐기"로 동결 처리 (rev6 §5 legacy handling 의미 분기와 정합).
4. **PD-021** 폐기 또는 "실패한 구현" status로 종결.

### 제거 비용 (변경 범위)
- **Decision ledger**: D-058 폐기 마킹 + D-066 폐기 + D-067~D-070 폐기 또는 재정의 (총 6건).
- **코드 롤백**: post-tool-use-task.js 삭제, settings.json hooks.PostToolUse 등록 해제, session-end-finalize.js 양자 충족 필터·immutable 가드 제거, turn-types.ts subagentId 의미 환원, role-*.md 4개 frontmatter turnId 의무 제거 (또는 파일 자체 삭제).
- **dispatch_config.json**: 모든 정책을 dispatchSubs:false로 동결 또는 파일 자체 폐기.
- **opus-dispatcher SKILL.md**: 폐기 또는 "deprecated, see D-XXX" 마킹.
- **CLAUDE.md**: "Grade A/S 오케스트레이션: opus-dispatcher 스킬 참조" 줄 제거 + Grade 표의 "메인 모델" 컬럼 단순화.
- **운영**: Ace는 다시 inline 오케스트레이터. Master 가시성은 reports/* 파일 + 세션별 plannedSequence로 회귀.

**LOC 추정**: 삭제 ~200, 수정 ~30, 신규 0. (D-067~D-070 합산 신설 ~194 LOC가 대부분 unwind 대상.)

---

## D. 분기 로직 보존 + Structural 공백 메우기 시뮬레이션

**가정**: D-058 유지. role-*.md 4개를 harness 실등록 가능 형식으로 보강. 이후 양자 충족 baseline 실측이 안정 작동.

### 미지수 (단정 불가 항목)
1. **Claude Code harness가 project-level `.claude/agents/*.md`를 자동 등록하는 frontmatter 정확 schema** — `name:` 단독으로 충분한지, `tools:` 화이트리스트 필수인지, `model:` 인정 알리아스 범위 등. 외부 앵커 1개로는 fallback 정책 단정 불가. **실호출 falsification 1회로 측정 가능.**
2. **등록된 subagent에서 `model: opus` 강제가 실제로 Opus 4.7 인스턴스를 생성하는지** — dispatcher-probe(2026-04-22) Probe 1이 1회 입증했으나, frontmatter `model:` 강제가 sustainable한지(harness 업데이트로 silent override되지 않는지) 미검증.
3. **subagentId 반환 형식** — post-tool-use-task.js line 88~93은 `tool_response.agentId / subagent_id / subagentId / id` 4개 필드를 fallback chain으로 시도. 어느 것이 실제 반환되는지 미측정 → fallback이 `auto-{ts}` 합성으로 떨어지면 **subagentId 실재성 0** (cosmetic ID).
4. **재호출 시 subagent context 격리 vs 누적** — 동일 role 재호출 시 새 인스턴스인지 동일 인스턴스인지 dispatch_config에 명시 없음.

### 얻는 것
1. D-058·D-066·D-067~D-070 결정의 정합성 회복. 
2. Grade A/S에서 진짜 Opus 품질 확보.
3. Sonnet 메인 비용 절감 ($5/세션 추정, Arki rev1 session_068).

### 비용
1. **외부 의존 영구화.** Claude Code harness의 subagent 등록 규약 변경 시 시스템 즉시 파손. 자립 원칙(feedback_external_plugin_absorption.md) 위반 위험.
2. **measurement 부채 가중.** 양자 충족 4조건 + immutable snapshot + legacy 분기 + PostToolUse hook + frontmatter 의무 → 모든 신규 세션이 5층 검증 통과 필수. 한 층 fail 시 gaps 박제 → Master 가시성 부담.
3. **D-067~D-070 보존 시 schema는 dispatcher 정상 작동 전제.** 만약 frontmatter 보강 후에도 subagent_type 등록이 silent fail이면 dual-sat 측정이 영구히 0으로 수렴 → 측정 자체가 "측정 위한 측정" (MEMORY F-측정 위반).
4. **운영 LOC**: 신규 ~10 (frontmatter `name:` 4개 + 검증 스크립트 1) + 기존 유지 ~194. 단 falsification probe 미통과 시 D 시뮬레이션 자체 폐기 → C로 회귀하는 cost 추가.

### 외부 앵커 cross-check (D-059)
- **앵커 1**: Anthropic 공식 docs `claude-code/sub-agents` (메모리 인용, URL 직접 fetch 불가) — project subagent 등록은 `.claude/agents/{name}.md` + `name:` frontmatter 필수.
- **앵커 부재 영역**: `name:` 누락 시 파일명 fallback 정책, `model: opus` alias의 정확한 인정 범위 — **Master 확인 또는 실호출 falsification 필요**로 명시.

---

## E. Arki 단정 권고

**제거 (C 시뮬레이션 채택).**

### 근거 (2줄)
1. D-058은 측정 부재 상태에서 채택되어 22세션 잠복 → invocationMode 도입 즉시 위반 노출 → D-066~D-070 5개 결정의 사후 패치 누적이라는 **누적 부채 패턴**. 보존 시 (D 시뮬레이션) 미지수 4개 중 단 1개라도 fail이면 동일 패턴 재발. 자립 원칙·심플 성장 원칙·반대를 위한 반대 금지 원칙 모두 "측정 인프라가 측정 대상보다 큰 구조"를 기각.
2. Master 본인이 D-058 직후 즉시 의도 불일치 자각 (MF line 191) + dispatcher-probe 외 재현 증거 0건 → "구조가 작동한다"는 명제의 객관 근거가 P4 3세션 실측(Arki 실행계획)이 한 번도 완수되지 않은 채 22세션 진행. 보존 정당화 근거 부재.

### 제거 후 권고 후속 (이번 토픽 Out)
- D-058·D-066~D-070 unwind는 별도 implementation 토픽으로 분리.
- D-019 "Ace 오케스트레이터" 본문에 "호출 매체는 inline 허용" 1줄 명문화 (rev4 후보 #1 해소).
- 향후 Opus 서브 호출이 진짜 필요해지는 시점에 (a) harness 등록 규약 외부 앵커 확정 (b) 실호출 falsification 통과 (c) 양자 충족 baseline 신설 — 3 게이트 동시 통과 시에만 재도입 검토.

---

## 기록

- 시간·공수·담당 추정 0건 (D-017 준수).
- 옵션 나열 0건 (Master 단정 권고 1개).
- 외부 앵커 1개 cross-check, 단정 불가 영역 명시 (D-059 준수).
- 슬롯 미달 정상 — 곁가지 분석 폐기 (반대를 위한 반대 금지).
