---
role: dev
topic: topic_135
session: session_152
rev: 1
date: 2026-05-01
turnId: 3
invocationMode: subagent
parentTopicId: topic_131
grade: B
accessed_assets:
  - file: .claude/hooks/post-tool-use-task.js
    scope: KNOWN_ROLES 현황 + 수정 위치
  - file: .claude/hooks/pre-tool-use-task-sage-gate.js
    scope: 이중 검증 삽입 위치
  - file: memory/roles/personas/role-sage.md
    scope: caveat 추가 위치
---

# Dev — Sage R-1 자기참조 paradox 차단 hook 구현

DEV_WRITE_DONE: reports/2026-05-01_sage-r1-paradox-block-hook/dev_rev1.md

---

## 구현 완료 항목

### Phase 1: KNOWN_ROLES 통일 (post-tool-use-task.js)

**수정 파일**: `.claude/hooks/post-tool-use-task.js` line 32

**변경 전**:
```js
const KNOWN_ROLES = ['ace', 'arki', 'fin', 'riki', 'nova', 'dev', 'edi', 'designer'];
```

**변경 후**:
```js
const KNOWN_ROLES = ['ace', 'arki', 'fin', 'riki', 'nova', 'dev', 'edi', 'designer', 'sage', 'zero', 'vera', 'jobs'];
```

SYNC RULE 주석 삽입: 역할 추가 시 3파일 동시 업데이트 의무를 코드에 박제.

**효과**: `sage`, `zero`, `vera`, `jobs` turn이 `current_session.json.turns`에 정상 박제됨.
이전에는 sage turn이 turns에 기록되지 않아 sage-gate의 Case 1/2/3 차단이 실질적으로 무력화되던 구조적 결함 (케이스 D, Riki R-1) 해결.

---

### Phase 1 보완: sage-gate.js KNOWN_ROLES에 `jobs` 추가

**수정 파일**: `.claude/hooks/pre-tool-use-task-sage-gate.js` line 31

KNOWN_ROLES에 `jobs` 추가 (기존: sage/zero/vera 포함, jobs 누락).
SYNC RULE 주석 동일 삽입.

---

### Phase 2: 이중 마커 검증 로직 추가 (sage-gate.js)

**수정 파일**: `.claude/hooks/pre-tool-use-task-sage-gate.js`

extractRole() 호출 직후, dispatch_config 확인 전에 이중 검증 블록 삽입:

```js
if (role === 'sage' || (toolInput.subagent_type || '').toLowerCase() === 'role-sage') {
  // 마커 role과 subagent_type role 추출
  // 불일치 → process.exit(2) 차단
  if (markerRole === 'sage' && subagentRole !== 'sage') → BLOCK
  if (subagentRole === 'sage' && markerRole !== 'sage') → BLOCK
}
```

**차단 논거**: dispatch 계약 위반 = 올바른 Sage 호출이 아님 (Jobs §4 프레임). 경보 아닌 차단.

---

### Phase 3 (정책 박제): role-sage.md caveat 갱신

**수정 파일**: `memory/roles/personas/role-sage.md` Caveat 섹션

- 기존 "예정" 박제 → 구현 완료 사실로 갱신
- 케이스 A/B/D hook 레벨 처리 완료 명시
- 케이스 C 정책 봉인 명시: prompt 레벨 자기참조는 hook 차단 불가 — 3축 교차 근거 의무 + 단일 자기참조 루프 형성 시 신뢰도 0 처리 정책 박제

---

## 실행 명령 → 실제 출력

### Syntax 검증
```
$ node --check .claude/hooks/post-tool-use-task.js
SYNTAX OK: post-tool-use-task.js

$ node --check .claude/hooks/pre-tool-use-task-sage-gate.js
SYNTAX OK: sage-gate.js
```

### KNOWN_ROLES + Phase 2 코드 존재 확인
```
Phase 1 - post-tool-use-task KNOWN_ROLES: ace, arki, fin, riki, nova, dev, edi, designer, sage, zero, vera, jobs
Phase 1 - required roles present: PASS
Phase 1 - sage-gate KNOWN_ROLES: ace, arki, fin, riki, nova, dev, edi, designer, vera, sage, zero, jobs
Phase 1 - jobs present in sage-gate: PASS
Phase 2 - 이중 마커 검증 코드 존재: PASS
SYNC RULE comment - post-tool-use-task: PASS
SYNC RULE comment - sage-gate: PASS
```

### 이중 검증 시나리오 테스트 (6케이스)
```
PASS [Normal sage] => PASS
PASS [Marker forgery (sage marker + arki type)] => BLOCK: marker=sage but subagent_type!=role-sage
PASS [Missing marker (type=role-sage, no marker)] => BLOCK: subagent_type=role-sage but marker!=sage
PASS [Type=role-sage but marker=arki] => BLOCK: subagent_type=role-sage but marker!=sage
PASS [Normal arki] => PASS
PASS [Normal dev] => PASS

Overall: ALL PASS
```

### 빌드 통과
```
$ node scripts/build.js
[build] Generated data/published/topics_manifest.json (131 topics)
[build] Generated data/published/decisions_summary.json (132 decisions)
[build] Done. dist/ ready with 534 data files + published/ artifacts.
```

기존 WARN(topic_013 누락 파일) 2건은 본 변경 이전부터 존재하는 사전 항목 — 무관.

---

## 구현 제외 확인

- Phase 3 PostToolUse 별도 hook 신설: **미구현** (OUT 범위)
- dispatch_config 필드 추가: **미구현** (OUT 범위)
- KNOWN_ROLES 모듈화: **미구현** (OI-4 DEFER 유지)

---

[ROLE:dev]
# self-scores
rt_cov: 1.00
gt_pas: 1.00
hc_rt: 0.00
spc_drf: 0
