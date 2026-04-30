---
role: arki
topic: topic_135
session: session_152
rev: 1
date: 2026-05-01
turnId: 0
invocationMode: subagent
parentTopicId: topic_131
grade: B
---

# Arki — Sage R-1 자기참조 paradox 차단 hook 구조 분석

ARKI_WRITE_DONE: reports/2026-05-01_sage-r1-paradox-block-hook/arki_rev1.md

---

## §1 현황 진단 — sage-gate hook 현재 동작

### 차단하는 것 (현재 sage-gate.js 기준)

`pre-tool-use-task-sage-gate.js`는 **same-session 격리**만 담당한다:

1. **Case 1**: role === 'sage' AND 현 세션에 다른 role turn 존재 → reject (Sage가 다른 페르소나와 공존 불가)
2. **Case 2**: role !== 'sage' AND 마지막 turn이 sage였음 → reject (Sage 이후 다른 페르소나 진입 차단)
3. **Case 3**: role !== 'sage' AND turns에 sage 포함 → reject (Sage 세션에 다른 페르소나 추가 차단)

role 식별 우선순위: `## ROLE:` 마커 → `subagent_type` → description 첫 단어

### 차단하지 못하는 것 (현재 미구현 영역)

| 미차단 시나리오 | 현황 |
|---|---|
| `## ROLE: sage` 마커 **위조** | extractRole()이 마커 우선 처리 → 위조 시 우회 성공 |
| `subagent_type: 'role-sage'` + 마커 일치 **이중 검증** | 단일 우선순위만, 이중 교차검증 없음 |
| **PostToolUse 재검증** (Sage 발언 후 역할 확인) | post-tool-use-task.js의 KNOWN_ROLES에 `sage`, `zero`, `vera` 미포함 → Sage turn 박제 자체가 불완전 |
| Sage가 **자기 자신을 분석 대상으로 지정** (호출 인자 내 `target: sage`) | 완전 미차단 — prompt 내용 검사 없음 |

---

## §2 R-1 문제 재정의 — 자기참조 paradox 구체 케이스

### 케이스 A: Sage → Sage 직접 재호출 (direct self-dispatch)

```
[Master] /sage 호출
[Sage 발언 중] "내가 sage 페르소나의 지표를 분석하겠다"
  → prompt에 ## ROLE: sage + subagent_type: role-sage 포함 Task 호출
  → sage-gate Case 1: turns에 sage 있으므로 reject 가능
  → BUT: same-session이 아닌 경우 (새 세션) → 차단 불가
```

**핵심 문제**: sage-gate는 현재 세션의 turns만 검사한다. Sage가 새 세션을 열고 자기 자신을 분석 대상으로 지정하면 차단 없음.

### 케이스 B: 마커 위조 (marker forgery)

```
[악의적 프롬프트] prompt 첫 줄: "## ROLE: arki"
                   실제 내용: Sage 역할 수행 지시 포함
→ extractRole() → 'arki' 반환 → sage-gate 통과
→ 실제 발언은 Sage 역할 (자기참조 분석 포함)
```

**핵심 문제**: 마커만 보고 역할 신뢰. `subagent_type`과 마커 교차검증 없음.

### 케이스 C: Sage가 Sage 분석 결과를 prompt에 삽입 (circular analysis)

```
[Sage 세션] Sage가 이전 Sage 세션의 self-scores를 분석
  → "sage의 분석 신뢰도는 X" 라는 결론 생성
  → 이 결론이 다음 Sage 세션 context에 포함
  → Sage가 자신의 이전 분석을 근거로 현재 분석 수행
  → 자기참조 루프 형성
```

**핵심 문제**: hook 레벨이 아닌 **컨텐츠 레벨** 자기참조. hook으로 완전 차단 불가 (LLM 판단 영역).

### 케이스 D: post-tool-use-task.js의 KNOWN_ROLES 누락

```
KNOWN_ROLES = ['ace', 'arki', 'fin', 'riki', 'nova', 'dev', 'edi', 'designer']
              → 'sage', 'zero', 'vera', 'jobs' 미포함
→ Sage 발언 후 post-tool-use-task.js가 role 추출 실패 → turns 박제 안됨
→ sage-gate의 turns 검사 기반 차단이 무력화될 수 있음
```

**핵심 문제**: sage-gate와 post-tool-use-task.js 간 KNOWN_ROLES 불일치.

---

## §3 설계 제약

### 차단 가능 레이어 (구현 실현 가능)

| 레이어 | 메커니즘 | 차단 범위 | 한계 |
|---|---|---|---|
| **L1: 이중 마커 검증** | `## ROLE: sage` AND `subagent_type: role-sage` 동시 일치 요구 | 마커 위조 → subagent_type 불일치 시 차단 | subagent_type도 위조 가능 (D2 전제) |
| **L2: PostToolUse sage 재검증** | Sage 발언 후 tool_response 내 `[ROLE:sage]` 마커 확인, 불일치 시 경보 | 발언 후 역할 드리프트 탐지 | 차단 아닌 경보 — 이미 발언 완료 후 |
| **L3: prompt 내용 검사** | prompt 내 `target: sage`, `analyze sage`, `role-sage 분석` 등 키워드 탐지 시 추가 검증 요구 | 케이스 A/C 직접 자기참조 패턴 | false positive 높음, 우회 쉬움 |
| **L4: KNOWN_ROLES 통일** | sage-gate + post-tool-use-task.js KNOWN_ROLES 동기화 | 케이스 D (turns 누락 → 게이트 무력화) 차단 | 낮은 비용, 즉시 적용 가능 |

### Claude Agent SDK 제약

- **hook은 tool 호출 전후만 개입 가능** — LLM 발언 내용 자체를 차단 불가
- **process.exit(2)가 tool 차단 메커니즘** — 현재 sage-gate가 사용 중 (정상)
- **prompt 내용 검사는 false positive 위험** — Riki의 "실질적 차단 vs 소음 증가" 균형 필요
- **케이스 C (컨텐츠 레벨 자기참조)는 hook으로 완전 해결 불가** — 이것이 R-1 caveat "잔존"의 본질

### 짓지 않음 옵션 (Rich Hickey 관점)

> 케이스 C는 hook으로 해결할 수 없다. "Sage가 자기 자신을 분석하면 신뢰도 0"이라는 **정책 박제(CLAUDE.md/role-sage.md 명시)**가 hook 구현보다 더 단순하고 확실하다.

현재 `role-sage.md` §Caveat에 이미 "후속 토픽에서 처리 예정"으로 정직 박제됨 → **이미 절반은 완료 상태**.

구현 범위를 **L1(이중 검증) + L4(KNOWN_ROLES 통일)**로 제한하고, 케이스 C는 정책 박제로 봉인하는 것이 최소 복잡도 설계.

---

## §4 구조적 실행계획 (executionPlanMode: plan)

### Phase 분해

**Phase 1: KNOWN_ROLES 통일 (L4)**
- `post-tool-use-task.js` KNOWN_ROLES에 `'sage', 'zero', 'vera', 'jobs'` 추가
- `pre-tool-use-task-sage-gate.js` KNOWN_ROLES 동일 확인 (이미 포함)
- `pre-tool-use-task.js` KNOWN_ROLES 동기화 확인
- 목적: turns 박제 누락 → sage-gate 무력화 시나리오(케이스 D) 차단

**Phase 2: sage-gate 이중 마커 검증 강화 (L1)**
- `pre-tool-use-task-sage-gate.js`에 이중 검증 로직 추가:
  - role === 'sage' 시: `## ROLE: sage` 마커 AND `subagent_type: 'role-sage'` 양쪽 일치 요구
  - 하나라도 불일치 시: 경보 로그 + 블록 (또는 경보만 — Master 결정 필요)
- 위조 마커 탐지: 마커가 sage인데 subagent_type이 다른 역할 → 불일치 경보

**Phase 3: PostToolUse sage 재검증 hook (L2)**
- `post-tool-use-task.js` 또는 별도 `post-tool-use-task-sage-verify.js` 신설
- Sage turn 완료 후 tool_response에서 `[ROLE:sage]` self-scores 마커 확인
- `## ROLE: sage`로 시작했는데 `[ROLE:arki]`로 끝나는 경우 → gaps에 role-drift 경보 기록
- **차단 아닌 경보** (발언 이미 완료됨, process.exit(2) 무의미)

### 의존 그래프

```
Phase 1 (KNOWN_ROLES 통일)
    ↓ 전제: Phase 1 완료 (turns 박제 정상화)
Phase 2 (이중 마커 검증)
    ↓ 선택적 선행: Phase 2 완료 권장 (마커 신뢰 확보 후)
Phase 3 (PostToolUse 재검증)
```

Phase 1 → Phase 2 순서 의존 있음 (turns 누락 상태에서 이중 검증 추가해도 효과 미흡).
Phase 3는 Phase 1/2 독립적으로 구현 가능하나, Phase 2 완료 후 추가 가치 명확.

### 검증 게이트

**G1 (Phase 1 완료 기준)**:
- `post-tool-use-task.js` KNOWN_ROLES 배열에 `sage`, `zero`, `vera`, `jobs` 포함 확인
- Sage 서브에이전트 호출 후 `current_session.json.turns`에 `role: "sage"` turn 박제 확인
- `sage-gate.log`에 sage turn 이후 Case 1/2/3 차단 정상 동작 확인

**G2 (Phase 2 완료 기준)**:
- 마커 `## ROLE: sage` + `subagent_type: 'role-arki'` 조합 시 경보/차단 발생 확인
- 정상 sage 호출 (`## ROLE: sage` + `subagent_type: 'role-sage'`) 통과 확인
- false positive 없음 확인 (정상 비-sage 호출 통과)

**G3 (Phase 3 완료 기준)**:
- Sage 발언 후 role-drift 발생 시 `current_session.json.gaps`에 경보 박제 확인
- 정상 발언 시 gaps 오염 없음 확인

### 롤백 경로

- **Phase 1 롤백**: `post-tool-use-task.js` KNOWN_ROLES 원복 (sage/zero/vera/jobs 제거)
  - 영향: Sage turn이 turns에 박제 안 됨 → sage-gate의 Case 1/2/3 check 무력화 (현재 상태와 동일)
  - 리스크: 낮음 — 현재보다 나쁘지 않음

- **Phase 2 롤백**: sage-gate의 이중 검증 코드 제거, 단일 마커 로직 원복
  - 영향: 마커 위조 시 우회 가능 (현재와 동일)

- **Phase 3 롤백**: post-tool-use-task-sage-verify.js 삭제 또는 settings.json hook 등록 제거
  - 영향: role-drift 탐지 불가 (현재와 동일)

### 전제·중단 조건

**전제**:
- `current_session.json`이 정상 존재하고 turns 배열이 읽기 가능한 상태
- `dispatch_config.json`의 `rules.sage.session_isolation: "exclusive"` 유지
- Phase 2 이중 검증 정책 결정 (블록 vs 경보만) — **Master 결정 필요 (§5 참조)**

**중단 조건**:
- G1 통과 후 Phase 2에서 정상 sage 호출 false positive 발생 시 → Phase 2 설계 재검토
- Phase 3에서 gaps 오염이 정상 세션에서 과다 발생 시 → threshold 조정 또는 폐기

---

## §5 Open Issues

### OI-1: Phase 2 이중 검증 실패 시 차단 vs 경보 정책 (Master 결정 필요)

- **Option A (Hard Block)**: 마커와 subagent_type 불일치 시 process.exit(2) 차단
  - 장: 위조 마커 완전 차단
  - 단: D2 전제("tool description은 거짓일 수 있다")에 의해 subagent_type 자체가 신뢰 불가 → false positive 가능성
- **Option B (경보 전용)**: 불일치 시 gaps 기록 + stderr 경보만, 차단 안 함
  - 장: D2 정합, 과잉 차단 방지
  - 단: 실질 차단력 없음

**권고**: B (경보 전용) — D2 prime directive 정합. 케이스 C는 정책으로 봉인 (R-1 caveat 정직 박제).

### OI-2: 케이스 C (컨텐츠 레벨 자기참조) 처리 범위

케이스 C는 hook으로 차단 불가 (LLM 발언 내용 검사). 선택지:
- `role-sage.md` §Caveat에 "Sage self-analysis 결과는 신뢰도 0으로 취급" 명시 강화
- `dispatch_config.json`에 `sage.self_analysis_target_allowed: false` 추가 (정책 박제)
- 실질 강제는 불가 — honest best-effort

### OI-3: Phase 3 별도 hook vs post-tool-use-task.js 통합

- **별도 hook**: SRP 보존, 파일 수 증가
- **통합**: post-tool-use-task.js에 sage 조건 분기 추가, 파일 1개 유지

현재 sage-gate가 별도 파일로 SRP 분리된 선례 존재 → 일관성 상 별도 hook 권장.

### OI-4: `pre-tool-use-task.js` KNOWN_ROLES 동기화 확인 필요

Phase 1에서 post-tool-use-task.js만 수정하면 pre-tool-use-task.js (역할 식별 + context inject hook)와 불일치 발생 가능. 3개 파일 동시 동기화 체계 필요.

---

## 자기 감사 (1차)

### structuration
- Phase 의존 그래프 명확: Phase 1 → 2 → 3 순서 의존 표현 완료
- KNOWN_ROLES 불일치 문제는 3개 파일에 걸쳐 있어 단일 수정으로 해결 불가 → OI-4 박제

### hardcoding
- KNOWN_ROLES가 3개 파일에 하드코딩 (`post-tool-use-task.js`, `pre-tool-use-task.js`, `pre-tool-use-task-sage-gate.js`) → 공유 constants 모듈 필요 여부는 `MUST_BY_N=30` (본 토픽 범위 아님)
- 현재 구현 우선순위: `MUST_NOW` Phase 1/2, `SHOULD` Phase 3

### efficiency
- Phase 3 별도 hook은 PostToolUse 체인에 1개 추가 — 성능 영향 미미 (동기 파일 read만)
- No issue at this dimension (성능 critical path 없음)

### extensibility
- KNOWN_ROLES 공유 모듈 추출 시 신규 역할 추가 1개소 수정으로 해결 → DEFER (3세션 내 구현이 우선)
- Phase 2 이중 검증 로직은 sage 전용 — 향후 다른 역할 격리 정책 추가 시 일반화 여지 있음 → SHOULD

### 자기 감사 결론 (1차)
- 발견 3개 (KNOWN_ROLES 불일치 / 위조 우회 / 케이스 C hook 불가)
- 모두 설계 섹션에 반영됨
- Phase 1이 가장 낮은 비용·높은 효과: `MUST_NOW`

---

[ROLE:arki]
# self-scores
aud_rcl: Y
str_fd: 3
spc_lck: N
sa_rnd: 1
