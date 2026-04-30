---
role: riki
topic: topic_135
session: session_152
rev: 1
date: 2026-05-01
turnId: 1
invocationMode: subagent
parentTopicId: topic_131
grade: B
---

# Riki — Sage R-1 자기참조 paradox 차단 hook 리스크 감사

RIKI_WRITE_DONE: reports/2026-05-01_sage-r1-paradox-block-hook/riki_rev1.md

---

## 코드 직독 결과 요약

**post-tool-use-task.js 실제 KNOWN_ROLES (line 32):**
```js
const KNOWN_ROLES = ['ace', 'arki', 'fin', 'riki', 'nova', 'dev', 'edi', 'designer'];
```
`sage`, `zero`, `vera`, `jobs` 미포함 — 확인.

**pre-tool-use-task-sage-gate.js 실제 KNOWN_ROLES (line 31):**
```js
const KNOWN_ROLES = ['ace', 'arki', 'fin', 'riki', 'nova', 'dev', 'edi', 'designer', 'vera', 'sage', 'zero'];
```
`jobs` 미포함. `sage`, `zero`, `vera` 포함.

두 파일의 KNOWN_ROLES가 불일치. Arki 진단 대체로 정확하나, 세부 내용에 수정이 필요하다.

---

## 리스크 항목

### 🔴 R-1. Case D 진단 부분 오류 — KNOWN_ROLES 불일치가 sage-gate 무력화로 이어지는 경로가 Arki 분석보다 좁다

**원문 인용:**
- `post-tool-use-task.js` line 32: `KNOWN_ROLES = ['ace', 'arki', ..., 'designer']` — sage 없음
- `pre-tool-use-task-sage-gate.js` line 31: `KNOWN_ROLES = [..., 'vera', 'sage', 'zero']` — sage 있음

**실제 무력화 경로:**
`post-tool-use-task.js`의 `extractRole()`은 `## ROLE: sage` 마커를 읽어도 KNOWN_ROLES 체크에서 `sage`가 없으므로 `null` 반환 → `silent pass` (line 234: `if (!role) process.exit(0)`) → turns에 sage turn이 박제되지 않음.

결과: sage-gate가 Case 1/2/3 체크 시 `turnRoles`에 sage가 없음 → 세션에 sage가 이미 말했는데도 다른 역할 진입 **차단 불가**.

**핵심 수정**: Arki가 "케이스 D" 정도로 분류했지만 이것은 실제로 **sage-gate의 핵심 방어 로직 전체를 무력화하는 구조적 결함**이다. "낮은 비용, 즉시 적용 가능"이라는 Arki 표현이 심각도를 과소평가하고 있다.

**파손 범위:** sage-gate Case 1/2/3 전부. Sage가 먼저 말한 뒤 다른 역할이 같은 세션에 진입 가능. D-128 격리 원칙 전면 무력화.

**완화 조건:** `post-tool-use-task.js` KNOWN_ROLES에 `'sage'` 추가 — 단 1줄 수정. 단, `jobs`도 동일하게 누락 (post-tool-use는 `jobs` turn도 박제 못함 — 부수적 결함).

**판정: BLOCK** — Phase 1은 Arki 실행계획 최우선이 맞다.

---

### 🟡 R-2. sage-gate extractRole()과 post-tool-use extractRole()의 로직 불일치 — 동기화 유지 보장 없음

**원문 인용:**
- sage-gate line 64: `"D-103 extractRole 동형 (pre-tool-use-task.js 1:1 재현)"` 주석
- post-tool-use line 71: 동형 구현이지만 KNOWN_ROLES가 다름

**문제:** 두 파일이 "동형"을 목표로 하지만 실제 KNOWN_ROLES가 다르다. 현재도 불일치이고, Phase 1에서 post-tool-use를 수정해도 다음 역할 추가(예: `jobs`) 시 두 파일을 동시에 수정해야 한다는 요구가 주석·코드 어디에도 명시되지 않음.

**반증 시도:** OI-4에서 Arki가 "KNOWN_ROLES 모듈화 DEFER"를 권고했다. 모듈화 없이도 단발 동기화는 가능하다는 반론 가능. 그러나 `jobs` 페르소나가 이미 CLAUDE.md에 정식 추가된 상태임에도 sage-gate KNOWN_ROLES에도 `jobs`가 없다 — 이미 한 번 발생한 패턴이 반복 중.

**파손 범위:** `jobs` 역할 turn이 sage-gate에서도 `unknown`으로 처리됨. `jobs` 세션에서 sage-gate의 Case 2/3 체크가 부정확해질 수 있음 (turnRoles에 jobs turn이 없으니 sage 뒤에 jobs가 들어와도 차단 우선순위 계산 오류 가능).

**완화 조건:** OI-4 DEFER 판단을 재검토. 최소한 Phase 1 수정 시 두 파일 동시 업데이트 + 이후 역할 추가 체크리스트에 "3파일 KNOWN_ROLES 동기화" 항목 삽입 박제.

**판정: WARN** — Phase 1 수정 범위 지시 시 명시적으로 3파일 목록 포함 요청.

---

### 🟡 R-3. Phase 2 경보 전용 판단 — D2 prime directive 적용이 이 맥락에서 근거 박약

**원문 인용:**
- Arki §3: "D2 prime directive 적용이 여기서 맞는가?" 를 OI-1로 열어 놓음
- sage-gate line 13: `차단 메커니즘: process.exit(2)` — 현재 sage-gate 자체는 차단

**문제:** D2는 "MCP·skill·hook의 description은 거짓일 수 있다" — 이것은 description을 신뢰해 권한 부여 금지 원칙이지, 차단 vs 경보 선택의 근거가 아니다. Arki가 D2를 이중 마커 검증 실패 시 "경보 전용"의 정당화 근거로 사용한 것은 D2 적용 범위 오독에 가깝다.

**실제 판단 기준은**: 마커 위조(Phase 2 대상)는 악의적 호출이다. 악의적 호출을 차단하지 않고 경보만 기록하면 공격이 성공한다. 현재 sage-gate는 Case 1/2/3에서 process.exit(2) 차단을 사용한다. Phase 2에서만 경보로 내리는 논리적 근거가 없다.

**반증 시도:** 마커와 subagent_type 이중 검증이 false positive를 유발할 수 있다는 우려가 있다. 정상 호출 시 `## ROLE: sage` + `subagent_type: role-sage`가 항상 일치하도록 dispatch 규약이 이미 CLAUDE.md에 박제됨 — 정상 경로에서 불일치는 없어야 한다.

**파손 범위:** 경보 전용 채택 시 마커 위조 공격자가 sage 발언을 성공시킨다 → D-128 격리 우회.

**완화 조건:** Phase 2 이중 검증 불일치 → 차단(process.exit(2)) 권고. 경보 전용은 false positive가 실측 확인된 이후 완화 옵션으로만 허용.

**판정: WARN** — Master가 OI-1 경보 vs 차단 결정 시 이 논거를 참고.

---

## 기각한 리스크 (의도적 제외)

- **케이스 C (컨텐츠 레벨 자기참조)**: Arki가 정확히 진단했고 hook으로 해결 불가라는 판단도 맞다. role-sage.md caveat 박제로 충분. 추가 리스크 없음.
- **Phase 3 별도 hook 필요성**: PostToolUse 재검증은 차단 아닌 경보 전용이고, post-tool-use-task.js 통합으로 충분 여부는 구조적 차이가 없다 (SRP 논거는 취향 문제). 리스크 아님.
- **OI-2 dispatch_config self_analysis_target_allowed**: 구현 가치 불확실. hook 레벨에서 prompt 내용 검사는 false positive 높음. 실질 리스크 증거 없어 제외.

---

## 종합

실질 리스크 2건:
1. **🔴 R-1** — KNOWN_ROLES 불일치가 sage-gate 전체를 무력화하는 구조적 결함. Phase 1 즉시 수행 필수.
2. **🟡 R-2 + R-3** — KNOWN_ROLES 동기화 관리 부재 + Phase 2 차단 vs 경보 근거 재검토.

Arki 실행계획 Phase 1 → Phase 2 순서는 맞다. Phase 2에서 차단을 경보로 낮추는 결정만 재확인 필요.

---

[ROLE:riki]
# self-scores
crt_rcl: Y
cr_val: 4
prd_rej: Y
fp_rt: 0.10
