---
role: ace
topic: topic_096
session: session_091
rev: 2
date: 2026-04-24
phase: synthesis-decisions
invocationMode: subagent
parentInstanceId: synthesis-after-arki-rev6
mode: 4decisions-fixation
---

ACE_WRITE_DONE: reports/2026-04-24_topic096-ace-arki-protocol/ace_synthesis_rev2_4decisions.md

# Ace Synthesis rev2 — 4 Decisions Fixation (D-067 ~ D-070)

본 문서는 4개 결정만 단정 박제합니다. 구현 코드·일정·공수·옵션 나열 일체 없음. 다음 Dev 호출이 본 문서 8절(Dev 호출 입력)을 그대로 입력으로 사용합니다.

**Ledger 정합 사전 검증 결과**: `memory/shared/decision_ledger.json` 마지막 결정 = **D-066** (2026-04-23, session_090). 다음 가용 번호 D-067 시작 단정 일치 — 박제 그대로 진행.

---

## 1. Inputs Locked

### Master 박제 9 기준 (변형 금지, arki rev6 §1 인용)

1. reports 파일만으로는 역할 분화 인정 불가.
2. plannedSequence 또는 agentsCompleted 문자열만으로는 역할 분화 인정 불가.
3. invocationMode=subagent와 subagentId/agentId가 기록되어야 한다.
4. 해당 role report가 생성되어야 한다.
5. report artifact는 invocation record와 agentId 또는 turnId로 연결되어야 한다.
6. agentsCompleted는 위 두 조건을 모두 만족한 role만 포함한다.
7. legacy sessions는 legacy:true로 유지하고 invocationMode를 추정 백필하지 않는다.
8. session_090은 최초 측정 snapshot으로 유지한다.
9. 앞으로의 baseline은 (c) 양자 충족 기준으로 신규 측정한다.

### rev6 영향 강도 순위 (대상 6개 중 cover 우선순위)

1. 대상 4 — agentsCompleted semantics (의미 변경 영향 최강) → **D-069 cover**
2. 대상 3 — reports structure (link key 부재) → **D-067 cover**
3. 대상 1 — turns schema (link 필드 부재) → **D-067 cover (대상 3과 짝)**
4. 대상 2 — hook point (검증 책임 확장) → **D-068 cover**
5. 대상 6 — regression test (T1~T9 표면) → 4 결정 각각의 regression test 키로 분산 배치
6. 대상 5 — legacy handling (snapshot 보호 신호 부재) → **D-070 cover**

### 추가 박제 전제

- rev5 결론: good-state 부재 확정. spec 방향 = "최초 baseline 신설" (복원 아님).
- session_031 시점은 subagent dispatch infrastructure 자체가 코드베이스에 없었음 (rev5 §2 Q5).
- session_090이 invocationMode 첫 측정 세션 (turns 11개, subagentId 3건).

---

## 2. Decision D-067 (D-A) — turns + reports link 표준 신설

**한 문장 단정**: 신규 세션부터 `Turn`은 `turnIdx`를 canonical link key로 갖고 모든 role report frontmatter에 동일 `turnId` 필드를 의무 기록하며 `subagentId`는 invocationMode=subagent인 turn에서 보조 식별자로 동시 박제한다.

**영향 (rev6 6 대상 중)**:
- 대상 1 (turns schema) — `Turn.subagentId` 의미 강화 (invocationMode=subagent 필수, JSDoc 단정 → 검증 로직 외부 의존 명문화)
- 대상 3 (reports structure) — frontmatter에 `turnId` 필드 의무 신설, 기존 `parentInstanceId` 자유 텍스트 폐기

**Rejected alternative**: `agentId` 신규 필드 신설안. `subagentId`와 의미 중복 + schema 분기 증가 + 9 기준의 "agentId 또는 turnId"는 둘 중 1개로 충족 가능 → `turnId` 단일 채택이 schema 영향 최소.

**충족 9 기준**: **3 (subagentId 박제)**, **5 (turnId 매칭)**, 부분적으로 1 (reports만으론 link 부재로 인정 불가 자연 보호).

**Minimal patch 표면**:
- 수정 1: `scripts/lib/turn-types.ts` — `Turn.subagentId` JSDoc 의미 강화, link 책임 단정 추가 (~10 LOC)
- 수정 2: `.claude/agents/role-*.md` 4개 — Write 계약 절에 frontmatter `turnId` 의무 추가 (~4×3 = 12 LOC)
- 신규 0건. 총 표면 ~22 LOC.

**Regression test 키**:
- T-101 — 신규 reports에 `turnId` 부재 시 fail (기준 5 매핑)
- T-102 — invocationMode=subagent turn에 subagentId 부재 시 fail (기준 3 매핑)

---

## 3. Decision D-068 (D-B) — PostToolUse(Task) hook으로 자동 박제 + SessionEnd 양자 충족 검증 신설

**한 문장 단정**: subagentId·turnId의 turns 박제는 PostToolUse(Task) hook이 Agent 툴 반환 직후 자동 수행하고, reports 파일 존재·link 매칭 검증은 SessionEnd finalize hook이 단일 시점에 수행한다.

**영향 (rev6 6 대상 중)**:
- 대상 2 (hook point) — PostToolUse(Task) hook 신규 등록, finalize hook 검증 책임 확장
- 대상 1 (turns schema) — 변경 없음 (기록 시점만 자동화)

**Rejected alternative**: SessionEnd 1회 시점에 모든 박제·검증 통합안. session 중간 turns에 subagentId 부재 → Master 가시성 0 + Master 개입 시점 박제 누락 위험. 자동 박제와 검증을 분리하는 것이 9 기준 3·4·5 동시 충족에 유일 최적.

**충족 9 기준**: **3 (자동 박제 경로)**, **4 (reports 존재 검증)**, **5 (link 매칭 검증)**.

**Minimal patch 표면**:
- 신규 1: `.claude/hooks/post-tool-use-task.js` — Agent 툴 반환에서 subagentId 추출 → current_session.json.turns push (~50 LOC)
- 수정 1: `.claude/hooks/session-end-finalize.js` — turns 순회하며 reports glob + frontmatter `turnId` cross-check, 불일치 gaps 박제 (~40 LOC 추가)
- 수정 2: `.claude/settings.json` — hooks.PostToolUse 등록 (~5 LOC)
- 총 표면 ~95 LOC.

**Regression test 키**:
- T-103 — Agent 툴 호출 후 turns에 subagentId 자동 박제 확인 (기준 3 매핑)
- T-104 — reports 파일 부재 + turn invocationMode=subagent 조합 fail (기준 4 매핑)
- T-105 — turn.turnIdx ≠ reports frontmatter.turnId 시 fail (기준 5 매핑)

---

## 4. Decision D-069 (D-C) — agentsCompleted 양자 충족 필터 + legacy 의미 분기

**한 문장 단정**: 신규 세션의 `agentsCompleted`는 finalize hook이 (invocationMode=subagent AND subagentId 존재 AND 대응 reports 파일 존재 AND turnId 매칭) 4조건 동시 통과한 role만 포함하도록 재정의하고, legacy:true 세션의 `agentsCompleted`는 기존 의미("추정 발언 기록")로 동결하여 두 의미를 `legacy` 플래그로 분기 해석한다.

**영향 (rev6 6 대상 중)**:
- 대상 4 (agentsCompleted semantics) — 의미 재정의 (string[] 타입 무변경, 생성 로직 변경)
- 대상 5 (legacy handling) — 의미 분기 신호 명문화 (`legacy: true` = 기존 의미)
- 대상 2 (hook point) — `ensureEditorInAgents` 함수 책임 확장 (편집 자동 push와 양자 충족 필터 분리)

**Rejected alternative**: 신규 의미를 legacy에도 소급 적용안. 기준 7(백필 금지) 직접 위반 + rev5 §2 Q1·Q2·Q5의 "측정 부재 89세션" 결정적 단서 소실. 의미 분기 공존이 유일 정답.

**충족 9 기준**: **6 (양자 충족 필터)**, **7 (legacy 동결)**, **2 (문자열만으론 인정 불가 finalize 차원 박제)**.

**Minimal patch 표면**:
- 수정 1: `.claude/hooks/session-end-finalize.js` — `ensureEditorInAgents` → `filterAgentsCompletedByDualSatisfaction` 함수 분리, 4조건 검사 신설 (~60 LOC)
- 수정 2: 동일 hook 내 legacy 가드 — `if (sess.legacy) return existing.agentsCompleted` 명문화 (~5 LOC)
- 신규 0건. 총 표면 ~65 LOC.

**Regression test 키**:
- T-106 — 신규 세션에서 reports 부재 role이 agentsCompleted에서 제외됨 (기준 1·6 매핑)
- T-107 — legacy:true 세션의 agentsCompleted 재계산 시도 시 fail (기준 7 매핑)
- T-108 — plannedSequence·문자열만으론 agentsCompleted 진입 불가 (기준 2 매핑)

---

## 5. Decision D-070 (D-D) — session_090 immutable snapshot 보호

**한 문장 단정**: session_090 entry에 `immutable: true` + `frozenAt: "2026-04-24"` 마커를 박제하고 finalize hook의 `appendOrUpdateSessionIndex`가 immutable=true entry에 대해 모든 갱신 시도를 차단(no-op + gap 기록)한다.

**영향 (rev6 6 대상 중)**:
- 대상 5 (legacy handling) — snapshot 보호 신호 신설 (현 schema에 부재 — rev6 §6 단정)
- 대상 2 (hook point) — finalize hook idempotent 보장 차단 로직 신설

**Rejected alternative**: session_090 entry를 별도 immutable 사본 파일로 격리안. session_index 단일 source of truth 깨짐 + dashboard·통계 코드 전수 분기 필요 + 9 기준 8의 "snapshot 유지"는 동일 entry 동결로 충족 가능 → 인-플레이스 immutable 마커가 영향 최소.

**충족 9 기준**: **8 (session_090 snapshot 유지)**, **9 (앞으로 baseline은 신규 측정 — session_090을 baseline으로 격상하지 않음 보장)**.

**Minimal patch 표면**:
- 수정 1: `memory/sessions/session_index.json` — session_090 entry에 `immutable: true`, `frozenAt: "2026-04-24"` 2필드 추가 (~2 LOC, 데이터 단발 박제)
- 수정 2: `.claude/hooks/session-end-finalize.js` — `appendOrUpdateSessionIndex`에 immutable 가드 추가 (~10 LOC)
- 신규 0건. 총 표면 ~12 LOC.

**Regression test 키**:
- T-109 — session_090 entry 갱신 시도 시 finalize hook이 no-op + gap 기록 (기준 8 매핑)
- T-110 — session_090을 baseline으로 사용하는 코드 부재 정적 검증 (기준 9 매핑)

---

## 6. Compatibility Matrix (4 결정 × 4 결정 충돌 0 증명)

|  | D-067 (link 표준) | D-068 (hook 자동화) | D-069 (필터+분기) | D-070 (snapshot) |
|---|---|---|---|---|
| **D-067** | — | D-068이 D-067 신설 link key를 자동 박제. 동일 source. **충돌 0** | D-069 필터가 D-067 link 매칭을 4조건 중 1개로 사용. 의존 정합. **충돌 0** | D-070은 session_090 snapshot에만 적용, link 표준은 신규 세션부터. 시점 분리. **충돌 0** |
| **D-068** | 위 동일. **충돌 0** | — | D-069는 D-068 finalize 확장의 일부. 동일 hook 내부 분리 함수. **충돌 0** | D-070 immutable 가드는 D-068 finalize와 동일 hook 내부. append 차단이 finalize 책임 확장과 정합. **충돌 0** |
| **D-069** | 위 동일. **충돌 0** | 위 동일. **충돌 0** | — | D-069는 신규 세션 의미·legacy 동결 / D-070은 session_090 snapshot 동결. session_090은 신규(legacy=false) 세션 첫 사례 — D-069 신규 의미 적용 후 D-070 immutable로 동결. 적용 순서 명확. **충돌 0** |
| **D-070** | 위 동일. **충돌 0** | 위 동일. **충돌 0** | 위 동일. **충돌 0** | — |

**증명 단정**: 4 결정 모두 (a) 시점 분리(신규 vs legacy vs snapshot), (b) 위치 분리(turn-types.ts / hook / settings / session_index.json), (c) 의존 단방향(D-067 → D-068 → D-069 → D-070 적용 가능, 역방향 의존 0). 한 결정이 다른 결정을 무력화하는 경로 부재.

---

## 7. 9 기준 충족 매핑 (모든 기준 measure-able)

| 기준 | 본문 | Cover 결정 | Regression test 키 |
|---|---|---|---|
| 1 | reports 파일만으론 인정 불가 | D-067 (link 부재 자연 보호) + D-069 (필터) | T-106 |
| 2 | plannedSequence/agentsCompleted 문자열만으론 인정 불가 | D-069 (필터 차원 박제) | T-108 |
| 3 | invocationMode=subagent + subagentId/agentId 기록 | D-067 (subagentId 의미 강화) + D-068 (자동 박제) | T-102, T-103 |
| 4 | role report 생성 | D-068 (SessionEnd reports 존재 검증) | T-104 |
| 5 | invocation record와 turnId/agentId link | D-067 (turnId canonical) + D-068 (cross-check) | T-101, T-105 |
| 6 | agentsCompleted = 양자 충족 role만 | D-069 (4조건 필터) | T-106 |
| 7 | legacy 백필 금지 | D-069 (legacy 동결 가드) | T-107 |
| 8 | session_090 snapshot 유지 | D-070 (immutable 마커 + 갱신 차단) | T-109 |
| 9 | 신규 baseline = (c) 기준 신규 측정 | D-067+D-068+D-069 합성 (신규 세션부터 적용) + D-070 (session_090 baseline 격상 차단) | T-110 |

**단정**: 9 기준 모두 4 결정 합성으로 cover. schema 차원 표현 불가 항목 0. 측정 표면 T-101 ~ T-110 (10건) 모두 9 기준에 1:1 또는 1:N 매핑.

---

## 8. Dev 호출 입력 (다음 호출 그대로 전달)

### 구현 LOC 총합 추정

- D-067: ~22 LOC
- D-068: ~95 LOC (신규 hook 1개 포함)
- D-069: ~65 LOC
- D-070: ~12 LOC (데이터 ~2 + 코드 ~10)
- **합계 ~194 LOC** (신규 1 파일, 수정 6 파일)

### 파일 list (union, 신규/수정 구분)

**신규 (1)**:
- `.claude/hooks/post-tool-use-task.js` — Agent 툴 반환에서 subagentId 추출 → turns 자동 push

**수정 (6)**:
- `scripts/lib/turn-types.ts` — `Turn.subagentId` 의미 강화 + link 책임 명문화
- `.claude/agents/role-ace.md`, `.claude/agents/role-arki.md`, `.claude/agents/role-fin.md`, `.claude/agents/role-riki.md` — Write 계약에 frontmatter `turnId` 의무 추가 (4개 파일)
- `.claude/hooks/session-end-finalize.js` — 양자 충족 검증 + agentsCompleted 필터 함수 분리 + immutable 가드
- `.claude/settings.json` — hooks.PostToolUse 등록
- `memory/sessions/session_index.json` — session_090 entry에 `immutable: true` + `frozenAt: "2026-04-24"` 2필드

### 보호 패치 의무 (rev5 §7 + rev6 단정 계승)

Dev 구현은 다음 절대 금지:
- legacy 45세션의 invocationMode 추정 백필 (기준 7)
- session_090 entry의 immutable 마커 외 어떤 변경 (기준 8)
- session_001~089 reports 디렉토리 frontmatter 소급 수정
- 기존 fixtures (snapshot_1~5.json) 재사용 (rev6 §7 단정 — 9 기준 도입 이전 fixture 호환 불가)

### Regression test 표면 (T-101 ~ T-110, 10건)

- 9 기준 1:1/1:N 매핑 (위 §7 표 참조)
- session_090 snapshot 비교 테스트 ↔ 신규 측정 테스트 **분리 필수** (rev6 §7 단정)
- 신규 fixture 필요 (rev6 §7 단정) — Dev가 직접 fixture 신설 (legacy=false + turns + invocationMode=subagent + subagentId + reports link 갖춘 minimal session entry)

### 우선 순위 (Dev 구현 순서 권고)

1. **D-067** (link 표준) → 가장 기반. turn-types.ts + role agents frontmatter 의무화 먼저.
2. **D-068** (hook 자동화) → D-067의 link key를 자동 박제할 hook 신설 + finalize 검증 확장.
3. **D-069** (필터+분기) → D-068이 만든 검증 결과를 agentsCompleted에 반영.
4. **D-070** (snapshot 보호) → D-068 finalize 확장에 immutable 가드 추가 + session_090 entry 마킹.

순서 의존은 **단방향**(역방향 0). Dev가 4개 task로 분할 가능.

---

## 종결

4개 결정 D-067 ~ D-070 박제 완료. 모든 결정은 단정 — 절충 0건, 옵션 나열 0건, 추가 결정 신설 0건. 9 기준 100% cover, 4 결정 상호 충돌 0건. Dev 호출 입력 §8이 다음 단계 사양으로 그대로 전달됩니다.
