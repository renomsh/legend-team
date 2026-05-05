---
role: dev
topic: close-g3-g4-impl
date: 2026-05-05
turnId: 2
invocationMode: subagent
accessed_assets:
  - file: .claude/commands/close.md
    scope: G3/G4 step text
  - file: memory/roles/*_memory.json
    scope: lessonLog structure audit
---

# Dev 구현 보고 — close.md G3/G4 박제

## 무엇을 만들었는가

### Step 1 — G4 사전 작업: lessonLog 초기화

**대상 파일 11개** 전수 검사 결과:

| 파일 | 처리 |
|---|---|
| ace_memory.json | `lessonLog: []` 추가 (roleRedefinition 뒤) |
| fin_memory.json | `lessonLog: []` 추가 (sessionLearnings 뒤) |
| riki_memory.json | `lessonLog: []` 추가 (sessionLearnings 뒤) |
| sage_memory.json | `lessonLog: []` 추가 (selfScoreShortKeys 뒤) |
| vera_memory.json | `lessonLog: []` 추가 (applicableTopicTypes 뒤) |
| zero_memory.json | `lessonLog: []` 추가 (learnings 뒤) |
| arki_memory.json | 이미 존재 — 스킵 |
| dev_memory.json | 이미 존재 + 비표준 키 정규화 |
| edi_memory.json | 이미 존재 — 스킵 |
| jobs_memory.json | 이미 존재 — 스킵 |
| nova_memory.json | 이미 존재 — 스킵 |

**dev_memory.json 비표준 구조 정규화:**
- `lessonLog_session032` (DEV-LL-003, DEV-LL-004) → 메인 `lessonLog[]` 병합 후 분리 키 제거
- `lessonLog_session046` (DEV-LL-005) → 메인 `lessonLog[]` 병합 후 분리 키 제거

vera_memory.json에는 `lessonLog_sessionNNN` 분리 키가 없었음 — `sessionLearnings` 키(별도 구조)만 존재, 정규화 불필요.

### Step 2 — close.md G3 박제 (Step 6 수정)

`apply-feedback.ts` CLI 위임 지시로 교체:
- topicId 첫 인수 명시 강제
- exit code 0 확인 요구
- escape hatch 조항 포함 (비 0 시 전문 Read 허용)

### Step 3 — close.md G4 박제 (Step 7 수정)

`lessonLog[]` append-only Edit 원칙으로 교체:
- 전문 Read 금지
- 배열 끝 `]` 직전 삽입 형태 명시
- escape hatch 조항 포함 (위치 불명확 시 전문 Read 허용)
- 학습사항 없는 역할 스킵

## 어떻게 실행하는가

검증 명령:
```
grep -n "G3" .claude/commands/close.md
grep -n "G4" .claude/commands/close.md
```

## 실제 출력 증거

### 검증 1 — G3 존재 확인
```
33: - **[G3 — 전문 읽기 금지]** `master_feedback_log.json` 전문(~19K tokens) Read 금지. CLI 위임:
```
결과: PASS

### 검증 2 — G4 존재 확인
```
41: - **[G4 — 전문 읽기 금지]** 역할 파일 전문 Read 금지. append-only Edit 원칙:
```
결과: PASS

### 검증 3 — memory/roles/ 전체 lessonLog 존재 확인

| 파일 | 결과 |
|---|---|
| ace_memory.json | PASS |
| arki_memory.json | PASS |
| dev_memory.json | PASS |
| edi_memory.json | PASS |
| fin_memory.json | PASS |
| jobs_memory.json | PASS |
| nova_memory.json | PASS |
| riki_memory.json | PASS |
| sage_memory.json | PASS |
| vera_memory.json | PASS |
| zero_memory.json | PASS |

11/11 PASS

### 검증 4 — lessonLog_session* 분리 키 잔존 여부

dev_memory.json: 0건 (정규화 완료)
전체 roles/*.json: 0건

**종합: 4/4 PASS**

## 변경된 파일

- `C:\Projects\legend-team\.claude\commands\close.md` — Step 6/7 G3/G4 박제
- `C:\Projects\legend-team\memory\roles\ace_memory.json` — lessonLog[] 추가
- `C:\Projects\legend-team\memory\roles\fin_memory.json` — lessonLog[] 추가
- `C:\Projects\legend-team\memory\roles\riki_memory.json` — lessonLog[] 추가
- `C:\Projects\legend-team\memory\roles\sage_memory.json` — lessonLog[] 추가
- `C:\Projects\legend-team\memory\roles\vera_memory.json` — lessonLog[] 추가
- `C:\Projects\legend-team\memory\roles\zero_memory.json` — lessonLog[] 추가
- `C:\Projects\legend-team\memory\roles\dev_memory.json` — lessonLog_session032/046 정규화
