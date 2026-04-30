---
role: arki
session: session_153
topic: topic_131
date: 2026-05-01
turnId: 0
invocationMode: subagent
rev: 1
accessed_assets:
  - memory/shared/dispatch_config.json
  - memory/shared/decision_ledger.json (D-108, D-115, D-123, D-124)
  - .claude/hooks/post-tool-use-task.js
  - .claude/hooks/session-end-finalize.js
  - memory/shared/ncl_violations.jsonl.README.md
  - memory/roles/personas/role-arki.md
  - CLAUDE.md
---

# Arki — Big Bang Legend Nexus P3 (1/2, s153) 구조 설계

## §1. Nexus 정의 박제 설계

### 1.1 현황 진단

현재 CLAUDE.md에는 "Nexus"가 다음 3개 맥락에서 사용됩니다:

| 위치 | 내용 | 평가 |
|---|---|---|
| 126줄 `Speaking order` | `Nexus orchestrates per D-130` | 하네스 의미 암묵적 — 명시 없음 |
| 180줄 `Ace 종합검토` | `orchestration은 Nexus` | 기능 언급만, 정의 없음 |
| 181줄 `versionBump` | `Nexus 자동 감지` → `session-end-finalize.js` | hook과 동의어 암시 — 불완전 |

D-108 결정 ("Nexus = 코드 레이어 오케스트레이션 허브")은 현재 ledger에만 있고, CLAUDE.md에 **별도 단락이 없습니다.** "하네스 시스템 자체"라는 Master 최종 정의도 어디에도 박제되지 않은 상태입니다.

### 1.2 짓지 않음 옵션 검토 (Rich Hickey 기준)

- **신규 파일(role-nexus.md) 생성**: 불필요. Nexus는 페르소나가 아닌 시스템이므로 페르소나 파일을 만들면 혼동 발생. → **기각**
- **dispatch_config.json에 nexus entry 추가**: Nexus는 dispatch 대상이 아니라 dispatch 실행 주체. entry 추가 시 역할과 시스템의 혼동 구조화. → **기각**
- **CLAUDE.md 단일 단락 추가**: 최소 변경으로 정의를 박제하는 단일 방법. → **채택**

### 1.3 CLAUDE.md 수정 범위 (설계안)

**삽입 위치**: `## Operating Protocol` 섹션 직전, 현재 `**Master-first 모드 (D-129...)`와 `- Prefer explicit...` 사이에 새 bullet 또는 별도 섹션 헤더.

**권고 형식**: 기존 `**키워드 (D-NNN, 날짜)**:` 패턴을 따르는 bullet 1개.

```
- **Nexus 정의 (D-131, 2026-05-01):** Nexus = 하네스 시스템 자체 — CLAUDE.md + hooks + dispatch_config + skills 총체. 오케스트레이션을 학습하고 에이전트 출력을 수렴·연결하는 코드 레이어. 별도 에이전트/페르소나 아님 (role-nexus.md 불필요). 오케스트레이션 단일 책임자 (D-130). D-108 C축 자동 전이: 오케스트레이션 학습·수렴 = Nexus self-reinforcement (C축 정의 §2 참조).
```

**new decision ID**: D-131 (현재 최신 D-125 대비 +6 — 본 세션에서 박제 예정인 D-126~D-130이 s142/s145/s146에 이미 박제 완료, D-131이 다음 가용 ID).

> **Arki 확인 필요**: decision_ledger를 조회하면 last ID가 D-125. 그러나 Edi s142 보고서에서 D-126~D-128, Edi s141에서 D-122~D-125, CLAUDE.md에는 D-130까지 언급됩니다. ledger에 D-126~D-130이 실제로 있는지 Dev가 검증해야 합니다. Arki 자신이 단언하지 않습니다 — 다축 교차검증 원칙 준수.

### 1.4 dispatch_config.json 수정 범위

Nexus는 dispatch 대상이 아니므로 `rules.nexus` entry는 불필요합니다. 현재 파일(v0.2.0)에 nexus entry 부재 = **올바른 상태**. 수정 불필요.

단, `comment` 필드를 다음으로 갱신하는 것을 권고합니다:

```json
"comment": "역할 호출 트리거·격리 정책·NCL 배출 권한 단일 출처. Nexus(= 하네스 시스템 자체)는 dispatch 대상이 아니므로 entry 없음. pre-tool-use-task-sage-gate.js가 sage 격리 read."
```

---

## §2. C축 정의 박제 설계

### 2.1 D-108 현황

D-108 결정문: "C축 신규 정의는 후속 세션 합의" — 즉 **C축은 ledger에서 미결 상태**입니다.

Master 확정 C축 정의: **"오케스트레이션 학습·수렴 (Nexus self-reinforcement)"**

### 2.2 amendment vs 새 결정

| 옵션 | 구조 | 위험 |
|---|---|---|
| D-108 amendment (status=resolved + newValue) | 기존 결정 수정 | D-108이 "C축 신규 정의 후속 합의"를 명시 → amendment는 SOT 의미론상 자연 |
| 새 결정 D-131 | D-108 C축 미결 종결 + Nexus 정의 동시 박제 | 단일 결정이 두 가지 axis를 포괄할 때 원인 추적 복잡 |

**권고: 새 결정 D-131에서 두 가지를 함께 박제** — Nexus 정의 + D-108 C축 종결을 하나의 결정으로 묶되, D-108에는 `supersededBy: D-131` 표기. 이유: amendment보다 append-only ledger 정책에 충실하고, D-130까지의 박제 패턴(supersedes 체인)과 일관됩니다.

### 2.3 CLAUDE.md 반영 위치

§1.3에서 박제하는 `**Nexus 정의 (D-131)**` bullet 내에 C축 정의를 함께 포함합니다. 별도 bullet 분리 불필요 (Nexus = C축 주체이므로 단일 단락이 더 명확).

---

## §3. NCL Phase A v0 hook 아키텍처

### 3.1 D-123 3항목 평가: 현재 hook에서 측정 가능한가

**현재 자산 기반 측정 가능성 검토:**

#### Origin Trace (자기 인용 비율)

```
D-123 의사코드: self_citation_ratio = (발언 내 자기 역할 선행 발언 인용 횟수) / (전체 인용 횟수)
```

- **데이터 소스**: `tool_response` 텍스트 (post-tool-use-task.js가 이미 읽는 위치)
- **측정 방법**: 정규식으로 `[ROLE:본인역할]` 또는 `(본인역할 rev\d+)` 패턴 카운트
- **가용성**: ✅ PostToolUse에서 tool_response 파싱 가능. extractSelfScores()와 동일한 패턴으로 추가 가능.
- **한계**: 암묵적 자기인용(마커 없이 이전 발언 내용 반복)은 탐지 불가. → Phase A에서는 명시적 마커 기반만 가동.

#### Influence Score (직전 역할 출력 → 현재 역할 출력 유사도)

```
D-123 의사코드: 직전 turns[-1].role의 발언 → 현재 발언 간 단어 중첩 비율
```

- **데이터 소스**: 직전 turn의 발언 = PostToolUse 시점에서 tool_response 직전 실행된 turn의 보고서 파일
- **실현 가능성**: 직전 보고서 파일을 post-tool-use-task.js에서 읽어야 하므로 **I/O 비용 발생**. 단순 단어 집합 교집합(Jaccard 유사도)으로 근사는 가능.
- **리스크**: 동일 토픽 발언이면 자연스러운 단어 중첩이 높아 false positive 多. 역할 전환 직후(예: arki→fin)에는 전문 용어 층이 달라 false negative 多.
- **가용성**: ⚠ 기술적으로 구현 가능하나 **false alarm 밀도가 높아 Phase A warn-only에서도 노이즈 문제** 발생 우려. mitigation: 역할 간 cross-role similarity만 체크 (동 역할 re-call은 제외), threshold를 0.7 이상으로 높임.

#### Diversity Index (세션 내 역할 발언 분포)

```
D-123 의사코드: role_count / total_turns (역할 다양성 비율)
```

- **데이터 소스**: `current_session.json.turns[]` — SessionEnd finalize에서 이미 읽는 구조
- **가용성**: ✅ SessionEnd에서 turns[] 기반 계산 완전히 가능. Shannon entropy로 다양성 측정도 turns[] 집계로 충분.
- **임계값 설정**: single role dominance = 1 역할이 전체 turns의 60% 이상. → `diversity_ratio = unique_roles / total_turns`로 단순화 가능.

### 3.2 hook 삽입 위치 설계

#### PostToolUse 삽입: post-tool-use-task.js

현재 구조 (line 208~324):
```
readStdin → extractRole → push turn → extractSelfScores → write session → writeTurnLog → missing-report check
```

**NCL 평가 삽입 위치: turn push 직후, session write 직전**

```javascript
// [NCL Phase A v0] Origin Trace + Influence Score 평가
const nclFlags = evaluateNclPostTool(role, toolResponse, sess, cwd);
if (nclFlags.length > 0) {
  appendNclFlags(nclFlags, cwd);  // ncl_violations.jsonl append
  nclFlags.forEach(f => log(`[NCL flag] type=${f.type} condition=${f.condition_id} severity=${f.severity}`));
}
```

**병렬 실행 가능성**: ✅ 기존 역할 검증 로직(extractRole, extractSelfScores)과 완전히 독립된 평가 함수로 분리. 현재 로직에 부수 효과 없음. 단, session write는 NCL flag append 이후에 실행해 일관성 유지.

#### SessionEnd 삽입: session-end-finalize.js

**삽입 위치: `ensureEdiInAgents()` 이후, session_index 전파 직전**

```javascript
// [NCL Phase A v0] Diversity Index + Ace ack TTL 체크
evaluateNclSessionEnd(sess, cwd);
```

- `evaluateNclSessionEnd()`는 turns[] 기반으로 diversity_ratio 계산 + threshold 비교 + ncl_violations.jsonl append.
- 기존 escalateAceAcksWithTTL() 함수가 이미 있음(s141 Dev 박제) → TTL 체크는 해당 함수 재사용.

### 3.3 ncl_violations.jsonl 파일 초기화 방법

D-141 README: "빈 파일 자체는 git track하지 않음 — 첫 실 flag 발생 시 hook이 신설."

**초기화 구조**:
```javascript
function appendNclFlags(flags, cwd) {
  const filePath = path.join(cwd, 'memory', 'shared', 'ncl_violations.jsonl');
  const lines = flags.map(f => JSON.stringify(f)).join('\n') + '\n';
  fs.appendFileSync(filePath, lines, 'utf8');  // 파일 없으면 자동 생성
}
```

- `appendFileSync`는 파일 부재 시 자동 신설 → 별도 init 단계 불필요.
- 첫 flag 발생 전까지는 파일 미생성 → git untracked 유지 → README 정책 준수.

### 3.4 SessionEnd NCL 집계 처리 방안

**집계 대상**: Diversity Index (SessionEnd만) + Origin Trace·Influence Score 누적 count (PostToolUse에서 이미 append됨).

**집계 처리 설계**:
```
turns[] → role 분포 계산 → diversity_ratio 산출 → threshold 비교 → 위반 시 ncl_violations.jsonl append
```

**ncl_violations.jsonl에서 session-level 요약 필드 추가**:
```json
{ "type": "diversity", "severity": "warn", "sessionId": "session_NNN",
  "condition_id": "diversity.axis_coverage",
  "raw_metric": { "diversity_ratio": 0.3, "dominant_role": "arki", "total_turns": 10 },
  "turnIdx": -1 }
```
`turnIdx: -1`은 session-level flag 관용 마커 (turn 귀속 불가).

### 3.5 구조적 설계 옵션 3개

**옵션 A (권고): 기존 hook 2개에 함수 추가 (인라인 확장)**
- post-tool-use-task.js에 `evaluateNclPostTool()` 함수 추가
- session-end-finalize.js에 `evaluateNclSessionEnd()` 함수 추가
- 장: 기존 파일 구조 유지, 신규 파일 0개
- 단: 각 파일 길이 증가 (+80~120줄 예상)
- ROI: MUST_NOW

**옵션 B: 별도 ncl-evaluator.js 모듈 분리**
- `require('./ncl-evaluator')` 방식으로 두 hook에서 공유
- 장: SRP(Martin 2003) 원칙 준수, 단위 테스트 용이
- 단: 신규 파일 1개, hook 파일 수정 + 모듈 파일 수정 동시 필요
- ROI: SHOULD (Phase A v0에서는 과잉, v0.1 이후 분리 권고)

**옵션 C: 신규 hook 파일 (post-tool-use-task-ncl.js)**
- sage-gate처럼 별도 hook으로 완전 분리
- 장: 기존 hook 무수정, 단일 책임
- 단: settings.json PostToolUse 등록 추가 필요, hook 실행 순서 의존 발생
- ROI: MUST_BY_N=30 (v0.1 또는 enforcement 단계에서)

**권고: 옵션 A → v0.1 진입 시 옵션 B로 리팩터**

---

## §4. 구조적 실행계획 (executionPlanMode: plan)

### Phase 분해

**Phase 1: Nexus 정의 박제 (CLAUDE.md + decision_ledger)**
- 목표: D-131 결정 초안 확정 + CLAUDE.md 1 bullet 삽입 + dispatch_config.json comment 갱신 + D-108 supersededBy 표기
- 의존: Master 확인 (D-131 결정 내용 동의 여부)
- 검증 게이트 G1: `grep -c "D-131" CLAUDE.md` → 1

**Phase 2: D-123 조건식 구현 (post-tool-use-task.js)**
- 목표: `evaluateNclPostTool()` 함수 삽입 — Origin Trace + Influence Score 측정 + ncl_violations.jsonl append
- 의존: G1 통과 후 (Nexus 정의 확정)
- 검증 게이트 G2:
  - `node --check .claude/hooks/post-tool-use-task.js` → OK
  - 테스트 시나리오: mock tool_response로 self_citation_ratio 계산 검증

**Phase 3: D-123 조건식 구현 (session-end-finalize.js)**
- 목표: `evaluateNclSessionEnd()` 함수 삽입 — Diversity Index 측정 + ncl_violations.jsonl append + TTL 체크 재사용
- 의존: G2 통과 후
- 검증 게이트 G3:
  - `node --check .claude/hooks/session-end-finalize.js` → OK
  - mock turns[] 3개 케이스: (단일 역할 dominant / 다양성 정상 / 빈 배열)

**Phase 4: 통합 검증 + 빌드**
- 목표: validate-prime-directive.ts OK + build.js 통과 + ncl_violations.jsonl 미존재 확인(첫 flag 전)
- 의존: G3 통과 후

### 의존 그래프

```
Master 확인 (D-131 내용)
    ↓
Phase 1 (CLAUDE.md + ledger)
    ↓
G1 통과
    ↓
Phase 2 (PostToolUse NCL)
    ↓
G2 통과
    ↓
Phase 3 (SessionEnd NCL)
    ↓
G3 통과
    ↓
Phase 4 (빌드 검증)
```

### 검증 게이트 상세

| 게이트 | 통과 기준 | 실패 시 처리 |
|---|---|---|
| G1 | `grep "D-131" CLAUDE.md && grep "D-131" decision_ledger.json` | Phase 2 진입 금지. Edi 재작성 |
| G2 | `node --check` OK + unit test 3 케이스 통과 | Phase 3 진입 금지. Dev rollback |
| G3 | `node --check` OK + mock 3 케이스 통과 | Phase 4 진입 금지. Dev rollback |
| G4 | `node scripts/build.js` 통과 + validator OK | 세션 종료 금지 |

### 롤백 경로

- Phase 1 실패: CLAUDE.md git restore + ledger 항목 `status: "draft"` 표기
- Phase 2/3 실패: hook 파일 git restore (각각 독립 롤백 가능)
- Phase 4 실패: Phase 2+3 동시 rollback

### 전제 조건

1. decision_ledger.json 최신 D-NNN 번호 확인 필요 (현재 D-125 이후 D-126~D-130이 실제 박제 완료 여부 Dev 검증)
2. `escalateAceAcksWithTTL()` 함수가 session-end-finalize.js에 실제 존재 여부 확인 (s141 Dev 박제 주장 — Dev 검증)
3. Master D-131 결정 내용 동의 필요 (Phase 1 진입 전)

### 중단 조건

- Phase 2/3 구현 후 hook `node --check` 실패 시: 즉시 중단, rollback 실행 후 Nexus(Master) 보고
- Influence Score false positive 율이 mock 테스트에서 30% 초과 시: 해당 항목을 Phase A v0에서 제외하고 v0.1로 분리 (Origin Trace + Diversity Index만 가동)

---

## §5. 자기감사 (1차)

**structuration**: 3개 섹션(Nexus 박제 / C축 박제 / NCL hook)이 각각 독립 Phase로 분리됨. 섹션 간 의존 명시(G1 → Phase 2). 문제 없음.

**hardcoding**: §3.3 `ncl_violations.jsonl` 경로가 하드코딩 우려 → `path.join(cwd, 'memory', 'shared', 'ncl_violations.jsonl')` 구조로 cwd 파라미터화 권고 박제 완료.

**efficiency**: Origin Trace에서 정규식 패턴을 매 turn마다 컴파일하지 않도록 모듈 상단 상수화 권고.

**extensibility**: Phase A v0에서 3항목, v0.1에서 4항목(anchor_synth 추가)으로 확장 경로 명시됨. `condition_id` 필드가 항목 추가 시 자연 확장 허용.

**발견: 1건 (MUST_BY_N=10)**: Influence Score false positive 우려 — §3.2에서 threshold·필터 조건 구체화했으나, Dev 구현 시 단위 테스트 없이 merge하면 noise flood 위험. G2 게이트에 명시 요구 박제 완료.

---

## §6. 경계 조건 (설계가 깨지는 조건)

1. **post-tool-use-task.js의 tool_response가 truncate되는 경우**: 긴 발언의 자기인용 탐지 누락. → Phase A에서는 첫 2000자만 스캔으로 제한(extractSelfScores 패턴과 동일).
2. **ncl_violations.jsonl 파일 손상(non-JSON 라인 포함)**: append는 계속 가능하지만 read 시 파싱 실패. → jsonl 특성상 손상 라인만 skip하는 line-by-line 파서 사용 권고 (Dev에 전달).
3. **Influence Score 비교 대상 직전 turn이 없는 경우(첫 번째 turn)**: 비교 불가 → skip(flag 없음). 코드에서 `if (turns.length < 2) return []` 가드 필수.
4. **session-end-finalize.js가 현재 세션에 turns가 0건인 경우**: Diversity Index division by zero. → `if (total_turns === 0) return` 가드.

---

ARKI_WRITE_DONE: reports/2026-05-01_big-bang-legend-nexus-p3-1of2/arki_rev1.md

[ROLE:arki]
# self-scores
aud_rcl: Y
str_fd: 1
spc_lck: N
sa_rnd: 1
