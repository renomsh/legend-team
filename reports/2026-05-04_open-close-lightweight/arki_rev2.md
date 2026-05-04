---
role: arki
session: session_182
topic: topic_157
topicSlug: open-close-lightweight
turnId: 0
invocationMode: subagent
date: 2026-05-04
rev: 2
---

ARKI_WRITE_DONE: reports/2026-05-04_open-close-lightweight/arki_rev2.md

# Arki — `/open` LLM 분류 결정 매핑 테이블 설계

---

## TL;DR

**권고: 3단계 키 (grade × topicType × isNew)를 매핑 테이블로 고정하되, 실질적으로 LLM 판단이 필요한 결정은 단 2개 (Grade 추론, topicType 판정)다. 이 2개도 Nexus 질문으로 확정 가능하므로 deterministic 실행이 가능하다. 매핑 테이블은 `memory/shared/open_routing_config.json` (JSON)으로 저장, `open.md` 체크리스트는 key 확정 후 config lookup으로 대체한다.**

---

## 1. 현황 분석: `/open`에서 LLM이 하는 분류 결정 목록

`open.md` 체크리스트 + `pre-tool-use-task.js` 흐름을 기준으로 열거.

| # | 결정 항목 | 현재 방식 | (a) 규칙 치환 가능? | (b) LLM 판단 필요? |
|---|---|---|---|---|
| D-1 | **Grade 판정** (S/A/B/C/D) | 키워드 매칭 → LLM 추론 | 부분 — D 키워드 목록·C 키워드 목록은 규칙. 나머지 A/S 경계는 문맥 의존 | LLM 필요 (A vs S 경계, 애매한 키워드) |
| D-2 | **topicType 판정** (framing/implementation/standalone) | D-145 알고리즘: parentTopicId 명시 → implementation; 키워드(framing/전략/설계) + null → framing; 나머지 → standalone | 거의 규칙화 됨 — CLAUDE.md 알고리즘 결정적 | LLM 불필요 (알고리즘 충분) |
| D-3 | **isNew 판단** (신규 vs 기존 토픽 재사용) | `/open topic_NNN` 패턴 유무 | 규칙 — 패턴 매칭 결정적 | LLM 불필요 |
| D-4 | **첫 주자 결정** (Arki/Dev/Master) | Grade 테이블 lookup | 규칙 — Grade → 첫 주자 표 완전 결정적 | LLM 불필요 |
| D-5 | **orchestrationMode 결정** (manual/auto) | `/auto` 명시 유무 | 규칙 — 키워드 트리거 | LLM 불필요 |
| D-6 | **역할 순서 초기화** | Grade 테이블 → 기본 역할 구성 | 규칙 — 표 lookup | LLM 불필요 |
| D-7 | **로드할 파일 목록** | LLM 자율 판단 (CLAUDE.md 지침 해석) | **규칙화 미완성** — 현재 LLM이 topic_load_manifest 읽고 판단 | LLM 필요 (role memory 선택 로직) |
| D-8 | **context_brief 로드 여부** | hold=null openTopics 필터 | 규칙 — 조건 명확 | LLM 불필요 |
| D-9 | **이전 Edi 보고서 브리핑 여부** | 분기 A(기존 토픽)면 로드 | 규칙 — isNew로 결정 | LLM 불필요 |
| D-10 | **pendingDeferrals 브리핑** | system_state 읽고 status=pending 필터 | 규칙 (session_181에서 filter 구현 완료) | LLM 불필요 |

**요약:**
- **규칙 치환 가능 (a)**: D-2~D-6, D-8~D-10 (8건)
- **LLM 판단 여전히 필요 (b)**: D-1 (Grade A/S 경계), D-7 (role memory 파일 선택)
- D-1은 Nexus 질문 1개로 LLM 부담 제거 가능 (아래 Q&A 섹션 참조)
- D-7은 매핑 테이블에서 "역할 × Grade → 파일 목록" 완전 정의 시 치환 가능

---

## 2. 매핑 테이블 설계

### 2-1. 매핑 키 차원

```
Key = { grade, topicType, isNew }
```

| 차원 | 값 | 결정 방식 |
|---|---|---|
| `grade` | S / A / B / C / D | D-1: 키워드 규칙 우선 → 불명확 시 Nexus 1개 질문 |
| `topicType` | framing / implementation / standalone | D-2: D-145 알고리즘 자동 (질문 불필요) |
| `isNew` | true / false | D-3: `/open topic_NNN` 패턴 유무 |

**총 조합: 5 × 3 × 2 = 30** — 실제 사용 조합은 ~12 (S+implementation 비현실적 조합 제외).

### 2-2. 조합별 매핑 내용 (핵심 조합만 명세)

```json
{
  "A_framing_new": {
    "loadFiles": [
      "memory/shared/system_state.json",
      "memory/shared/decision_ledger.json#last20",
      "memory/roles/arki_memory.json",
      "memory/roles/jobs_memory.json"
    ],
    "scripts": [
      "scripts/load-context-briefs.ts",
      "scripts/auto-close-topics.ts --dry-run",
      "scripts/resolve-pending-deferrals.ts --dry-run"
    ],
    "roleSequence": ["jobs(optional)", "arki", "fin", "riki", "ace(opt)", "edi"],
    "firstSpeaker": "arki",
    "transitionGate": true
  },
  "A_standalone_new": {
    "loadFiles": [
      "memory/shared/system_state.json",
      "memory/roles/arki_memory.json"
    ],
    "scripts": [
      "scripts/load-context-briefs.ts",
      "scripts/auto-close-topics.ts --dry-run"
    ],
    "roleSequence": ["arki", "fin", "riki", "edi"],
    "firstSpeaker": "arki",
    "transitionGate": true
  },
  "B_standalone_existing": {
    "loadFiles": [
      "memory/shared/system_state.json",
      "topics/{topicId}/context_brief.md",
      "topics/{topicId}/session_contributions/*_edi_report.md#latest"
    ],
    "scripts": [],
    "roleSequence": ["arki", "riki", "edi"],
    "firstSpeaker": "arki",
    "transitionGate": true
  },
  "C_standalone_new": {
    "loadFiles": [
      "memory/shared/system_state.json"
    ],
    "scripts": [],
    "roleSequence": ["dev", "edi(optional)"],
    "firstSpeaker": "dev",
    "transitionGate": false
  },
  "D_standalone_new": {
    "loadFiles": [],
    "scripts": [],
    "roleSequence": ["dev"],
    "firstSpeaker": "dev",
    "transitionGate": false
  }
}
```

### 2-3. Nexus가 질문해야 할 최소 Q&A

A/S 경계만 1개 질문:

| 상황 | Nexus 질문 | 응답 → 확정 |
|---|---|---|
| 키워드가 "전략/설계/개편" 포함하나 S/A 불명확 | "S(오픈 탐색형, Master 선언 전용)로 할까요, A(닫힌 실행형)로 할까요?" | Master 응답 → grade 확정 |
| `/open topic_NNN` 없고 topicType framing인데 parentTopicId 지정 안 함 | (질문 불필요 — D-145 알고리즘이 standalone으로 자동 분기) | — |
| isNew=true + grade 키워드 없음 | "Grade는 A로 자동 추론했습니다. 맞나요?" (저마찰 — 무응답=승인) | 무응답 2분 → A 확정 |

**최소 질문 수: 0~1개** (대부분 질문 없이 자동 확정 가능).

### 2-4. 저장 포맷 및 위치

**권고: JSON, `memory/shared/open_routing_config.json`**

이유:
- `dispatch_config.json`과 동일 패턴 — hook이 `readJsonFile()` 패턴으로 이미 처리
- YAML은 주석 가독성 좋으나 현재 시스템이 JSON 단일 파싱 경로 (tsconfig, hook 모두 JSON 의존)
- 역할 memory json들과 동일 디렉토리 → `readJsonFile(path.join(cwd, 'memory/shared/open_routing_config.json'))` 1줄

**스키마 구조:**
```json
{
  "$schema": "internal://open-routing-config-v0.1",
  "version": "0.1.0",
  "keyDimensions": ["grade", "topicType", "isNew"],
  "gradeKeywords": {
    "D": ["bug", "fix", "patch", "log", "오타", "수정", "deploy", "rollback"],
    "C": ["ops", "운영", "점검", "확인", "로그"],
    "S": ["전면 재설계", "핵심 결정", "역할 도입", "시스템 개편"]
  },
  "defaultGrade": "A",
  "routes": {
    "A_framing_true": { ... },
    "A_standalone_true": { ... },
    ...
  }
}
```

---

## 3. 자기감사 (1차)

### 1차 감사 — 발견 3개 / 각 축 최소 3지점 검사 / ROI 라벨 의무

**structuration:**
- [MUST_NOW] `keyDimensions` 3개(grade/topicType/isNew) 중 topicType 판정 알고리즘이 open_routing_config.json 밖 (CLAUDE.md)에 분산 → config로 단일화 필요
- [SHOULD] `gradeKeywords` 와 `open.md` § Grade 판정 규칙 §2 테이블이 중복 소스 → open.md는 human-readable 설명 유지, config가 기계 실행 SOT
- [NICE] `routes` key format (`A_framing_true`)이 boolean "true/false" 문자열 — `isNew: boolean`과 타입 불일치 발생 가능 → `A_framing_new` / `A_framing_existing` 표현 권고

**hardcoding:**
- [MUST_BY_N=10] `open.md` 체크리스트 3.5-b ~ 3.6에 스크립트 경로가 하드코딩 (`npx ts-node scripts/auto-close-topics.ts`) → `routes[key].scripts[]`로 이전
- [SHOULD] `load-context-briefs.ts` 실행 여부가 isNew=true/false로 분기 가능한데 현재 항상 실행 → `routes.loadContextBriefs: boolean` 필드 추가
- [NICE] `#last20` / `#latest` suffix가 파일 경로 표현에 들어가 있는 설계 — 파싱 규칙 별도 명세 필요

**efficiency:**
- [MUST_NOW] 현재 `/open`에서 LLM이 `topic_load_manifest.json` 전체 읽고 role 선택 — 매핑 테이블 `loadFiles[]` 완전 정의 시 `topic_load_manifest.json` 읽기 자체 불필요 (파일 1개 read 절감)
- [SHOULD] `routes[key].roleSequence`에 optional 표시(`jobs(optional)`)가 자유 텍스트 — `{role, required: boolean}` 구조화 권고
- [NICE] 30조합 중 ~18개는 현실에서 발생하지 않음 → sparse routes 허용 + unknown key fallback 규칙 명세

**extensibility:**
- [MUST_BY_N=10] `roleSequence`가 현재 string[] — `MAX_CHARS_BY_ROLE` (G-2 미해결) 연동 시 객체 배열로 확장 필요
- [SHOULD] Grade E 또는 신규 topicType 추가 시 config 1줄 추가만으로 반영 가능 구조 — 현재 설계에서 이미 충족
- [SHOULD] `transitionGate` 외에 `masterFirstGate` (D-129) 연동 여부도 route별 flag 추가 검토

**종료 기준 미충족 — 2차 감사 진행.**

---

### 2차 감사 — 발견 2개 / 1차 MUST_NOW 재검증 포함

**structuration:**
- [MUST_NOW] `topicType 판정 알고리즘` (D-145): CLAUDE.md에 문자열로 박제 + `open.md` 체크리스트 둘 다 읽어야 하는 현황 → `open_routing_config.json`에 `topicTypeRules: {pattern, result}[]` 추가 시 hook/script가 단일 파일 read로 처리 가능. 단, CLAUDE.md 상의 서술은 human reference로 유지 (중복 허용, SOT만 분리).
- [NICE] `routes` key 충돌 가능성 — `S_implementation_new` 조합은 정책상 불가(S = Master 선언 전용, implementation은 parentTopicId 필요) → `forbidden` 필드로 명시 차단 권고

**hardcoding:**
- [SHOULD] `gradeKeywords.D` 목록이 CLAUDE.md + open.md + config 3곳에 존재하게 됨 → CLAUDE.md는 설명, open.md는 참조 링크, config가 기계 실행 SOT 명시 필요
- No additional issue at this dimension.

**efficiency:**
- [MUST_BY_N=10] `scripts` 배열 실행 순서가 config에서만 정의될 경우, 세션마다 다른 스크립트가 필요한 케이스(isNew + pending deferral 있는 경우만 resolve-pending 실행)를 조건부로 표현할 수단 없음 → `{script, condition}` 구조 or 별도 `conditionalScripts` 필드 추가 필요
- No additional issue at this dimension.

**extensibility:**
- No additional issue.

**2차 종료 기준 평가:** 2차 발견 2개, 1개 MUST. MUST_NOW 잔존 → 3차 미니 감사.

---

### 3차 감사 (종료 여부 판단)

**MUST_NOW 재확인:**
- 1차 MUST_NOW-1 (`topicType 알고리즘 분산`): 2차에서 해법 정의 완료 (`topicTypeRules[]` 추가). 설계 대안으로 충분히 완화됨.
- 1차 MUST_NOW-2 (`topic_load_manifest 불필요화`): `loadFiles[]` 완전 정의 시 자동 해소 — 구현 전제 명시로 충분.
- 2차 MUST_BY_N=10 (`conditionalScripts`): 설계 권고 수준 — 구현 시 반영.

**3차 발견:** 0개.

**종료 기준 충족 (3차 발견 1개 이하 + 잔존 항목 모두 MUST_BY_N=10 이하 + MUST_NOW 0건).** 감사 종료.

---

## 4. 경계 조건 (설계가 깨지는 시나리오)

| 조건 | 결과 | 대응 |
|---|---|---|
| Master가 `/open` 없이 토픽을 시작하는 경우 | 매핑 키 결정 시점 없음 → Nexus 질문 트리거 불가 | fallback: CLAUDE.md 현행 방식 유지 (매핑 미적용) |
| Grade 키워드가 여러 grade에 교차 매칭 | 우선순위 충돌 (D → C → A/B → S 순서) | config `gradeKeywords` 우선순위 명시 필수 |
| `routes[key]` 없는 조합 발생 (`S_implementation_existing`) | key miss → LLM fallback 또는 오류 | `defaultRoute` 또는 `forbidden` 필드 필수 |
| `loadFiles[]`에 명시된 파일이 존재하지 않음 | silent skip (현행 hook 동작) — silent 오류 발생 가능 | 파일 miss 경보 추가 필요 (D-3 저장소 오염 전제) |
| 신규 역할 추가 시 roleSequence 갱신 누락 | 역할 호출 안 됨 | `dispatch_config.json`과 config 동기화 의무화 |

---

## 5. 미결 전제

- **전제 P-1**: `open_routing_config.json` 도입은 현행 `open.md` 체크리스트를 전면 교체하지 않음 — 초기에는 병행 운용 (config lookup 실패 시 open.md fallback).
- **전제 P-2**: Nexus(= Main Claude Code 본체)가 config read + key 확정 로직을 인라인 처리한다. 별도 hook 신설 불필요.
- **전제 P-3**: `gradeKeywords` SOT를 open_routing_config.json으로 이전 시 `open.md` §2 표는 human-readable 설명으로 유지 (삭제 금지 — D-3 오염 전제 방어).
- **미결**: `conditionalScripts` 설계의 구체 포맷은 구현 세션에서 Dev와 협의 후 확정. 지금은 필드 추가 필요성만 명세.

---

[ROLE:arki]
# self-scores
aud_rcl: Y
str_fd: 3
spc_lck: N
sa_rnd: 3
