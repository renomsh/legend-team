---
turnId: 1
invocationMode: subagent
role: arki
date: 2026-05-05
topic: topic_161
session: session_188
slug: persona-layer-analysis
---

# Arki — Persona Layer 절삭 가능성 구조 분석

## 1. 로딩 메커니즘 파악

### 주입 경로 (실코드 검증)

`pre-tool-use-task.js` v4 `buildPersonaLayer()` 함수가 Task/Agent 툴 호출 시 자동 실행:

```
레이어 1: memory/roles/policies/_common.md        (항상 로드)
레이어 2: memory/roles/policies/role-{role}.md    (역할별, 없으면 silent skip)
레이어 3: memory/roles/personas/role-{role}.md    (역할별, 없으면 PERSONA_INJECT_FAILED 마커)
```

세 파일을 `'\n\n---\n\n'`으로 연결 후 `<dispatch-context>` 블록에 삽입. **세 레이어 모두 매 서브에이전트 호출마다 로드된다** — 선택적 로드 없음.

### 세션당 주입 빈도 (로그 실측, 294건)

| 역할 | 호출 횟수 | 평균 injectionLen | 최대 injectionLen |
|---|---|---|---|
| edi | 33회 | 29,495B | 66,272B |
| dev | 25회 | 22,818B | 45,997B |
| riki | 42회 | 15,280B | 52,603B |
| ace | 31회 | 14,443B | 44,799B |
| arki | 32회 | 11,659B | 38,588B |
| zero | 5회 | 23,758B | 42,157B |
| **전체** | **203회** | **18,281B** | **66,272B** |

persona layer 자체는 절삭 금지 (level 4 PERSONA_OVER_CAP 정책). session/topic layer가 먼저 절삭된다.

### 절삭 우선순위 (코드 확인)
1. session layer turns 단축 → 2. session layer drop → 3. topic layer drop → 4. persona layer는 **절삭 금지** → PERSONA_OVER_CAP 경보

---

## 2. policies vs personas 중복 분석

### 구조적 분리 현황

실제 파일 읽기 결과:

| 레이어 | 담당 내용 | 고유 내용 |
|---|---|---|
| **_common.md** (62줄, 3,753B) | Write 계약·Frontmatter link·Self-Score 공통 규칙·컨텍스트 활용·자기소개 제약 | 5개 공통 계약 전부 |
| **policies/role-{r}.md** | 역할별 발언 구조·Self-Score 지표 키·감사 프로토콜 | 발언 형식 + 점수 키 |
| **personas/role-{r}.md** | 역할 정체성·페르소나 모델·원칙·금지항목·호출 규칙 | 정체성 + 행동 경계 |

### 2개 레이어 모두 로드 여부

**YES** — `buildPersonaLayer`가 policy + persona 양쪽을 항상 concat한다. 선택적 로드 없음.

### 중복 비율 추정

| 역할 | policy 내 원칙 섹션 존재 | persona 내 원칙 섹션 존재 | 실질 중복 |
|---|---|---|---|
| ace | N | Y | 없음 (분리 깔끔) |
| arki | N | Y | 없음 |
| dev | N | Y | 없음 |
| fin | Y | Y | 중복 있음 |
| jobs | Y | Y | 중복 있음 |
| vera | Y | Y | 중복 있음 |
| zero | Y | Y | 중복 있음 |
| riki/nova/sage | N (또는 없음) | Y | 없음 |

**구조 분리 설계는 올바르다**: policy = 발언 형식 + 지표 키, persona = 정체성 + 행동 경계. 단, zero/jobs/fin/vera 4개 역할에서 원칙 섹션이 양쪽 파일에 존재 — 이게 실질 내용 중복인지는 내용 수준 비교 필요 (아래 감사 섹션에서 다룸).

### per-role 파일 크기 및 _common.md 비율

| 역할 | 총 주입(B) | _common 비율 | policy 비율 | persona 비율 |
|---|---|---|---|---|
| arki | 7,800 | 48% | 33% | 19% |
| riki | 6,775 | 55% | 24% | 21% |
| fin | 6,714 | 56% | 24% | 20% |
| dev | 8,611 | 44% | 29% | 27% |
| edi | 12,782 | 29% | 52% | 19% |
| zero | 13,291 | 28% | 37% | 35% |
| jobs | 12,180 | 31% | 38% | 31% |
| ace | 10,588 | 35% | 27% | 38% |
| vera | 7,860 | 48% | 20% | 32% |
| sage | 12,142 | 31% | 19% | 50% |
| nova | 7,596 | 49% | 28% | 23% |

**주목**: riki/fin/arki에서 _common.md가 전체 persona layer의 50% 이상 차지 — 이 역할들은 고유 콘텐츠가 적다.

---

## 3. _common.md 내용 분석

### 섹션 목록 (실제 파일 읽기)

```
line 1:  # 공통 정책 (모든 역할 서브에이전트 공통)
line 8:  ## Write 계약 (필수)
line 15: ## Frontmatter link 의무 (D-067)
line 23: ## Self-Score YAML 출력 계약 (PD-023)
line 37: ### 공통 기록 규칙
line 44: ## 컨텍스트 활용 지시 (공통)
line 51: ## Shared Asset Protocol (공통)
line 58: ## 자기소개 제약 (F-013)
```

**총 62줄, 3,753B (UTF-8 기준)**

### CLAUDE.md와의 중복

| _common.md 섹션 | CLAUDE.md 존재 | 판정 |
|---|---|---|
| Write 계약 | NO | _common.md 고유 |
| Frontmatter link | NO | _common.md 고유 |
| Self-Score YAML | NO | _common.md 고유 |
| 컨텍스트 활용 지시 | NO | _common.md 고유 |
| Shared Asset Protocol (evidence_index, glossary) | **YES** (CLAUDE.md Asset Protocols §) | 부분 중복 |
| 자기소개 제약 | NO | _common.md 고유 |

**결론**: Shared Asset Protocol이 CLAUDE.md §"Asset Protocols (D-012)"와 부분 중복. _common.md의 evidence_index/glossary/decision_ledger 언급은 CLAUDE.md에도 존재.

### Sage 예외 처리

_common.md 첫 줄에 "Sage는 write 0 예외 — Self-Score YAML 출력 계약 적용 안 됨 (`policies/role-sage.md` 참조)"로 명시. 그러나 Sage도 buildPersonaLayer로 _common.md 전체를 로드한다 — Sage에 불필요한 Write 계약(~400B)을 포함해 전달한다.

---

## 4. 절삭 기회 맵

### 자기감사 1차 — 제거 가능 카테고리

**structuration 축:**

1. **_common.md Shared Asset Protocol 섹션 (~200B)** — MUST_BY_N=10
   - CLAUDE.md §"Asset Protocols (D-012)"와 내용 중복. evidence_index/glossary/decision_ledger 언급이 양쪽 모두 존재.
   - mitigation: _common.md에서 "CLAUDE.md §Asset Protocols 참조" 1줄로 대체. ~150B 절감.
   - fallback: 양쪽 보존 시 오염 없음 — 단순 비용 낭비.

2. **Sage에 대한 _common.md 조건 주석 처리 (~100B)** — SHOULD
   - Sage는 Write 계약·Self-Score 계약 모두 적용 안 됨. 하지만 buildPersonaLayer가 Sage도 _common.md를 로드한다.
   - 두 가지 옵션:
     - (A) buildPersonaLayer에서 Sage role은 _common.md 로드 skip — 코드 1줄 수정, 3,753B 절감
     - (B) _common.md 상단 Sage 예외 주석은 유지, 내용 적용은 role-sage.md에서 재선언 — 현재 방식
   - mitigation: 옵션 A 채택 시 Sage 호출 비용 감소. hook 코드 1줄 변경 + 검증 필요.
   - 리스크: buildPersonaLayer Sage skip 로직이 sage-gate.js와 상호작용 검증 필요.

3. **정책·페르소나 원칙 섹션 중복 (zero/jobs/fin/vera 4개 역할)** — SHOULD
   - 4개 역할에서 `## 원칙` 섹션이 policy와 persona 양쪽에 존재.
   - 의도된 분리: policy의 원칙은 "기계적 실행 규칙", persona의 원칙은 "정체성 행동 원칙"으로 달라야 함.
   - 실측 확인 필요: jobs policy §원칙은 Grade override·Relay금지 등 절차적 내용. jobs persona §원칙은 "본질에 집착한다" 등 행동 원칙. 실질 중복 낮음.
   - 판정: 내용 중복 낮음 — DEFER (구조 의도에 부합).

**hardcoding 축:**

4. **dispatch-context 헤더 하드코딩 (pre-tool-use-task.js L451)** — SHOULD
   - `# 자동 주입 컨텍스트 — pre-tool-use-task.js v3 (topic_127, 2026-04-28 P2)` 버전 문자열이 v4로 업그레이드됐지만 주석은 "v3" 그대로.
   - mitigation: 버전 문자열 상수화 또는 `v${VERSION}` 동적 삽입.
   - 절감: 0B (기능 영향 없음, 혼동 위험 제거).

5. **MAX_CHARS_PER_REPORT 하드코딩 (L34-36)** — NICE
   - 6000/8000/80000 세 상수가 인라인. config JSON에 있지 않음.
   - mitigation: dispatch_config.json `injection_caps` 추가 — Arki 원칙 준수.

**efficiency 축:**

6. **edi policy 6,625B — 전체 policy 파일 중 최대** — MUST_BY_N=10
   - edi policy에 versionBump 전체 스펙(§6.1~§6.6, ~3,000B)이 인라인. 매 Edi 호출마다 3,000B 이상 주입.
   - mitigation: versionBump 세부 스펙을 `memory/roles/policies/role-edi-versionbump.md`로 분리, role-edi.md에서 파일 참조만 남김. hook이 필요 시만 append하는 구조.
   - 예상 절감: 최대 ~2,500B/호출. Edi 33회 * 2,500B = 82,500B/세션 절감.
   - 리스크: 분리 파일 누락 시 Edi가 versionBump 규칙을 잊을 수 있음 — 세션 종료 전 hook이 ref inject하는 방식으로 mitigation.

7. **zero policy 4,933B — 전체 도구 스펙 인라인** — SHOULD
   - D.Condense Phase A/B/마커 포맷까지 전부 인라인. 매 Zero 호출마다 전부 주입.
   - mitigation: 핵심 흐름(마커 경로, 완료 조건)만 남기고 상세 포맷은 별도 참조 파일로.
   - 예상 절감: ~1,500B/호출.

**extensibility 축:**

8. **KNOWN_ROLES 중복 참조** — NICE
   - `lib/known-roles.js` SOT → `pre-tool-use-task.js`·`post-tool-use-task.js`·`pre-tool-use-task-sage-gate.js` 3개 파일이 require로 가져옴. 구조 올바름.
   - 새 역할 추가 시 known-roles.js 1개 파일만 수정 → 확장 OK.

### 자기감사 2차 — 추가 발견

**structuration 재검사:**

9. **persona 파일 상단 cross-reference 중복** — NICE
   - 11개 persona 파일 모두 동일한 boilerplate:
     ```
     > 본 문서는 **페르소나(정체성)** 만 박제. 발언 구조·지표·공통 계약은:
     > - 역할 정책: `memory/roles/policies/role-{r}.md`
     > - 공통 정책: `memory/roles/policies/_common.md`
     ```
   - buildPersonaLayer가 이미 세 파일을 concat하므로 이 안내는 서브에이전트가 읽을 필요 없는 자기 설명.
   - 11개 파일 * ~100B = 1,100B 절감 가능.
   - mitigation: 제거 시 persona 파일이 단독으로 읽힐 때(사람이 직접 읽는 경우) 컨텍스트 손실. NICE 수준.

10. **session-end-finalize.js가 _common.md 100줄 cap 검증** — 구조 리스크
    - `_common.md` 현재 62줄 — cap(100줄)까지 38줄 여유.
    - 콘텐츠 추가 시 cap 경보 전에 몇 세션 치 비용이 늘어나는 구조. cap이 낮게 설정되어 있음.
    - 절삭 후 cap을 50줄로 하향 조정 권고 (아래 옵션 3 참조).

**hardcoding 재검사:**

11. **role-edi.md 내 `confirmedBy: "edi"` 대소문자 주의** — MUST_NOW
    - §6.6에 `confirmedBy: "edi"` 정확히 소문자 요구, 대소문자 구분 가드 존재 명시.
    - Edi LLM이 "Edi" 대문자로 박제 시 applyVersionBump가 project_charter 갱신 차단.
    - 이는 코드 버그가 아닌 문서 명시 사항이나 실수 여지가 높음.
    - mitigation: hook에서 `confirmedBy.toLowerCase() === 'edi'` 정규화 처리 권고.

**efficiency 재검사:**

12. **_common.md가 Sage 호출마다 전체 주입** — MUST_BY_N=10
    - Sage 호출은 전용 세션(exclusive) — 다른 역할과 공존 없음. 그러나 _common.md 3,753B는 여전히 주입됨.
    - Sage에 불필요한 Write 계약(~500B) + Self-Score YAML 계약(~600B) + Shared Asset Protocol(~200B) = ~1,300B 낭비.
    - mitigation: buildPersonaLayer에 `if (role === 'sage') skip _common` 조건 추가. 또는 _common.md에 `<!-- sage: exclude_sections: ["Write 계약", "Self-Score YAML 출력 계약"] -->` 마커 방식.

**extensibility 재검사:**

13. **정책 파일 versioning 없음** — DEFER
    - policy/persona 파일에 버전 태그 없음. 내용 변경 시 어느 decision이 적용됐는지 추적 불가.
    - 현재 decision_ledger가 SOT이므로 DEFER. 단, 향후 자동 diff 필요 시 문제.

### 자기감사 3차 — 통합 정리

**추가 발견:**

14. **dispatch-context 재주입 방지 마커 정합** — MUST_NOW
    - `INJECTION_MARKER = '[PRE-TOOL-USE-TASK-INJECTED]'`가 prompt 첫 500자 체크로 중복 주입 방지.
    - 현재 본 분석 요청에서도 dispatch-context 상단에 `[PRE-TOOL-USE-TASK-INJECTED]`가 있어 hook이 skip함 — 정상.
    - 그러나 발견: 본 분석 요청의 dispatch-context에 이미 arki policy + _common.md + persona가 **inline으로 붙어** 있음 (CLAUDE.md에서 확인 가능). 즉 hook이 파일을 읽어 주입하는 구조와 별도로, **dispatch prompt 작성 시 인라인으로도 포함**됨.
    - 이 이중 포함이 의도된 것인지 확인 필요: hook inject (파일 기반) vs dispatch prompt 직접 embed (인라인). 현재 구조에서는 한쪽만 실행되므로 문제 없으나, 관리 분산 리스크.

---

## 설계 옵션

### 옵션 A: _common.md Sage 조건부 skip (권고)

**구조**: buildPersonaLayer에 `if (role === 'sage') { skip _common.md }` 1줄 추가.

- 장: Sage 호출마다 ~3,753B 절감. 구현 1줄.
- 단: sage-gate.js와 조합 테스트 필요. _common.md 의존 Sage 규칙 없는지 확인 필수.
- 리스크: Sage가 Write 계약을 실수로 따를 여지 제거 (오히려 개선).
- mitigation: sage-gate.js 테스트 + role-sage.md에 "Write 계약 미적용" 재확인.

### 옵션 B: edi policy versionBump 스펙 분리 (권고)

**구조**: §6.1~§6.6 (~3,000B) → `role-edi-versionbump-spec.md`로 추출. role-edi.md에는 핵심 규칙 1단락 + 파일 참조만.

- 장: Edi 33회 * ~2,500B = ~82,500B/세션 절감. edi policy 6,625B → ~3,500B.
- 단: hook이 Edi 호출 시 versionbump spec을 조건부로 append해야 함 (세션 종료 단계 감지).
- 리스크: 세션 종료 판단 로직 추가 필요. 잘못 skip 시 Edi가 versionBump 확정 미수행.
- mitigation: `current_session.json.phase === 'session-close'` 조건 시 spec inject. 기존 hook 확장.

### 옵션 C: zero policy condense 스펙 분리 (선택)

**구조**: D.Condense Phase A/B 상세 포맷 → `role-zero-condense-spec.md`. role-zero.md에는 핵심 흐름만.

- 장: Zero 호출마다 ~1,500B 절감.
- 단: 구현 복잡도 중간. Zero condense 호출은 빈도 낮음(5회/세션).
- ROI: 낮음 — SHOULD 수준.

### 비교 매트릭스

| 옵션 | 절감량 | 구현 복잡도 | 리스크 | ROI |
|---|---|---|---|---|
| A: Sage _common skip | ~3,753B/Sage 호출 | 낮음 (1줄) | 낮음 | MUST_BY_N=10 |
| B: edi versionbump 분리 | ~2,500B/Edi 호출 | 중간 (hook 확장) | 중간 | MUST_BY_N=10 |
| C: zero condense 분리 | ~1,500B/Zero 호출 | 중간 | 낮음 | SHOULD |

**권고: 옵션 A + B 병행 구현** — persona layer 절삭 정책 위반 없이 구현 가능한 구조적 절삭.

---

## 경계 조건

1. **PERSONA_OVER_CAP 임계**: 현재 TOTAL_CAP_CHARS=80,000. 최대 실측 injectionLen=66,272B. 여유 ~13,728B. Sage에 대형 session layer가 붙으면 cap 근접 — 옵션 A가 이 여유 확보에도 기여.

2. **hook 중단 조건**: buildPersonaLayer가 _common.md를 읽지 못하면 `COMMON_POLICY_MISSING` 마커 발생 → 서브에이전트가 공통 계약 없이 발언. 옵션 A 구현 시 Sage 대상 마커 조건도 갱신 필요.

3. **session-end-finalize.js cap 검증 연동**: _common.md 절삭 후 현재 62줄 → 50줄 목표로 낮추면 finalize가 cap(현재 100줄) 위반 탐지 기준도 조정 필요.

4. **Zero condense 게이트 마커 파일 의존성**: pre-tool-use-task.js v4가 `_zero_condense.json` 부재 시 Edi 차단. Zero policy 분리 시 condense 완료 조건이 바뀌면 마커 포맷도 갱신 필요.

---

## 예상 절감 요약

| 항목 | 절감량(B) | 빈도 | ROI 라벨 |
|---|---|---|---|
| _common.md Shared Asset 섹션 중복 제거 | ~200 | 모든 역할 호출 | MUST_BY_N=10 |
| Sage 대상 _common.md skip (옵션 A) | 3,753 | Sage 호출 시 | MUST_BY_N=10 |
| edi policy versionBump 스펙 분리 (옵션 B) | ~2,500/호출 | Edi 33회/세션 | MUST_BY_N=10 |
| persona 파일 boilerplate 제거 | ~100/파일 * 11 = 1,100 | 전역 1회 | NICE |
| zero policy condense 스펙 분리 (옵션 C) | ~1,500/호출 | Zero 5회/세션 | SHOULD |
| dispatch-context header 버전 수정 | 0B | 코드 품질 | MUST_NOW |
| edi confirmedBy 정규화 hook | 0B | 버그 예방 | MUST_NOW |

**총 구조적 절감 (A+B 옵션 구현 시)**: 고정 ~1,300B + Edi 호출당 ~2,500B. 세션당 추정 ~85,000B 이상 절감.

---

ARKI_WRITE_DONE: reports/2026-05-05_persona-layer-analysis/arki_rev1.md
