---
role: arki
phase: framing
topic: topic_190
topicSlug: skill-hook-auto-trigger
session: session_227
turnId: 0
invocationMode: subagent
date: 2026-05-09
grade: A
---

Arki입니다. topic_190 phase2 실행계획 — Master 결정 옵션 A(임계 0.2~0.25 하향) + 옵션 B(분모 캡 `min(tokens, 5)`) 결합 + Gate G2 + Phase 3 hook 통합 구조 분석·계획.

## §1 구조 분석

### 1.1 현 skill-matcher.ts 구조 (실측, 184 라인)

| 영역 | 라인 | 현재 동작 |
|---|---|---|
| `STOPWORDS` Set | 33–46 | 한·영 stopword 인라인 상수 |
| `tokenize(s)` | 52–64 | lowercase → split punct → len≥2 + non-stopword 필터 |
| `scoreSkill(promptTokens, skill)` | 66–96 | name=3·ns=2·desc=1 가중치 max, raw 합산. **분모 = `3 * promptTokens.length`** (96 line: `raw / (3 * promptTokens.length)`) |
| `matchSkills(prompt, index, opts)` | 104–126 | tokenize → scoreSkill 루프 → threshold 필터 → desc sort → topN 슬라이스. **threshold 기본값 = 0.5** (110 line) |
| `loadIndex` | 128–132 | `memory/shared/plugin_skill_index.json` 읽기 |
| CLI | 134–183 | `--threshold` `--top` 인자 + 표 출력 |

### 1.2 A+B 변경점 식별 (구조적 최소 침습)

**옵션 A — 임계 하향**:
- 변경 지점 1곳: `matchSkills` 110 line `threshold = opts.threshold ?? 0.5` → `?? 0.22` (0.2~0.25 중앙값).
- CLI 137 line `let threshold = 0.5` → `let threshold = 0.22` (CLI default 동기화).
- **상수화 권고**: 파일 상단에 `const DEFAULT_THRESHOLD = 0.22` `const DEFAULT_TOP_N = 3` `const TOKEN_DENOM_CAP = 5` 박제 → 매직넘버 산재 방지(자기감사 §extensibility).

**옵션 B — 분모 캡**:
- 변경 지점 1곳: `scoreSkill` 94 line `raw / (3 * promptTokens.length)` → `raw / (3 * Math.min(promptTokens.length, TOKEN_DENOM_CAP))`.
- 의미: prompt 토큰 6+ 일 때 분모를 5로 고정 → 긴 prompt(불필요 단어 다수)에서 점수 0으로 짓눌리는 현상 완화. data:analyze 케이스(0.24 → 추정 0.4+ 구간 진입)가 직접 수혜.
- **단방향 전제**: `min(tokens, 5)`는 prompt 토큰 ≥5에서만 효과. ≤4 토큰 prompt 행동 변화 없음(분모 동일).

### 1.3 plugin_skill_index.json 스키마 의존 영향

실측 스키마 (line 1–18):
```
{ version, lastSync, totalCount, bySource{marketplace,cowork}, skills[ {name, namespace, description, descriptionHash, tags, trustLevel, source, sourcePath} ] }
```

A+B 변경은 **스키마 무영향**. matcher가 사용하는 필드 = `name`·`namespace`·`description`·`trustLevel` (line 72–74, 118)만. descriptionHash는 안정성 모니터 용도 — Phase 3 hook은 변경 감지 시만 재계산 트리거 (Phase B/C 무관).

### 1.4 Phase 3 hook ↔ matcher 인터페이스

**현재 hook 디렉토리** (실측):
```
.claude/hooks/
  post-tool-use-task.js
  post-tool-use-verification.js
  pre-tool-use-skill-jobs-framing.js
  pre-tool-use-task-master-first.js
  pre-tool-use-task-sage-gate.js
  pre-tool-use-task.js
  session-end-finalize.js
  session-end-tokens.js
  spike-k6-pretool-task-mutation.js
  user-prompt-submit-master-first.js
```

UserPromptSubmit hook 선례 = `user-prompt-submit-master-first.js` 1건. Phase 3 신규 hook은 **동종 위치·명명 규약** 따름 → `.claude/hooks/user-prompt-submit-skill-recommend.js`.

**인터페이스 설계 옵션** (3개, 자기감사 §structuration):

| 옵션 | 방식 | 장 | 단 |
|---|---|---|---|
| O1 | hook이 `skill-matcher.ts`를 ts-node로 spawn | 구현 단순 | spawn 비용·startup latency·UserPromptSubmit critical path 부하 |
| O2 | matcher를 .js 빌드 산출물로 컴파일 후 hook이 require | 빠름 | 빌드 단계 추가, watch 필요 |
| **O3 (권고)** | matcher 핵심 함수를 순수 JS로 인라인 포팅 (`scripts/lib/skill-matcher-runtime.js`), .ts는 빌더·dry-run 전용 유지 | 빠름·의존 0·유지보수 명확 | 토큰화 로직 2곳 동기화 책임 (테스트로 강제) |

→ **권고: O3**. 이유: hook은 매 prompt 실행 → ts-node spawn 100~300ms는 UX 저해. 인라인 포팅 + dry-run 동치성 테스트(Phase A 게이트)로 동기화 보장.

**RECOMMEND 출력 형식** (D-176 BLOCK→RECOMMEND):
```
[skill-recommend] top-3 skills for this prompt:
  1. {namespace}:{name}  (score 0.42)  matched: [tok1, tok2]
  2. ...
(use /<namespace>:<name> to invoke; or ignore — purely advisory)
```

UserPromptSubmit hook은 **stdout으로만 출력**, exit 0. block 신호 절대 발생 금지(D-176).

## §2 의존 그래프 — Phase 분해

```
Phase A (matcher A+B + 상수화)
   │  입력: skill-matcher.ts 현재본
   │  출력: skill-matcher.ts (DEFAULT_THRESHOLD=0.22, TOKEN_DENOM_CAP=5)
   │       + skill-matcher-runtime.js (Phase C 대비 인라인 포팅)
   │  Gate G_A: dry-run 4건 재실행 → 4/4 임계 통과(0.22 기준)
   ▼
Phase B (Gate G2 — 20 prompt 표본)
   │  입력: Phase A matcher
   │  출력: tests/skill-matcher-eval.json (20 prompt × expected skill × 실제 top-3 × 적합 판정)
   │  Gate G2: 적합도 ≥ 70% (14/20)
   ▼
Phase C (Phase 3 hook — UserPromptSubmit)
   │  입력: Phase A runtime + Gate G2 PASS
   │  출력: .claude/hooks/user-prompt-submit-skill-recommend.js
   │       + settings.json hook 등록
   │  Gate G_C: hook trigger 시 RECOMMEND stdout 출력 + exit 0 + block 신호 0
   ▼
Phase D (통합 검증 + Master 직접 사용 G3)
   │  입력: Phase A+B+C 전부
   │  Gate G3: Master 실사용 N prompt에서 RECOMMEND 적합도·시그널/노이즈비 Master 만족
```

각 Phase 입출력·게이트는 §3 상세화.

## §3 검증 게이트·롤백·중단

### Phase A (matcher A+B)
- **PASS 조건**:
  - dry-run 4건(data:analyze, engineering:code-review, data:write-query, daloopa:build-model) top-1 정확도 4/4 유지.
  - **0.22 임계 통과 ≥ 3/4** (직전 0.5 기준 1/4 → 명확 개선 신호).
  - skill-matcher-runtime.js 와 .ts 의 같은 4 prompt 동일 결과(±0.001 score 허용).
- **FAIL 롤백**: 변경 3곳(상수 2개 + 분모 캡 1개) git revert. 옵션 C(TF-IDF·embedding) 토픽 분기.
- **중단 조건**: dry-run에서 top-1이 2건 이상 변경(정확도 후퇴) → 즉시 중단·Master 보고.

### Phase B (Gate G2)
- **PASS 조건**: 20 prompt 표본 적합도 ≥ 70% (14/20).
  - 표본 구성: data 5 / engineering 5 / finance·sales·design·daloopa·기타 10. Master 일상 prompt 분포 반영.
  - 적합 판정: top-3 안에 expected skill 포함 = 적합. expected가 모호한 prompt는 표본에서 제외.
- **FAIL 롤백 1단계**: 임계 0.22 → 0.20 미세조정 + 재측정. 그래도 <70% → 옵션 C 토픽.
- **중단 조건**: 20건 표본 작성 자체가 expected 합의 곤란 → Master 표본 검토 요청.

### Phase C (Phase 3 hook)
- **PASS 조건**:
  - hook 등록 후 임의 prompt에서 RECOMMEND stdout 출력.
  - exit code = 0 항상 (block 신호 0건, D-176).
  - hook latency < 200ms (인라인 runtime → fs read + tokenize + 160 skill scoring).
  - settings.json에 등록된 hook 경로가 다른 hook과 충돌 없음.
- **FAIL 롤백**: settings.json hook 등록 제거 + .js 파일 삭제. Phase B 산출물 유지.
- **중단 조건**: latency ≥ 500ms → 인덱스 read 캐싱(프로세스 메모리) 추가 후 재측정. 그래도 미달 → hook 비활성화·토픽 보고.

### Phase D (Master G3)
- **PASS 조건**: Master 직접 사용 후 "유용함" 또는 "노이즈 허용 범위" 판정.
- **FAIL 롤백**: Phase C hook 비활성화(settings.json 비활성), runtime·matcher는 dry-run 도구로 유지.
- **중단 조건**: Master 노이즈 압도 판정 → topic_190 종결·옵션 C 별도 토픽.

## §4 전제·리스크 (mitigation+fallback 병기)

### 4.1 전제

| 전제 | 검증 방식 |
|---|---|
| descriptionHash 안정성 (재빌드 changed=0) | session_226 verify 로그로 입증됨 — Phase A 시작 전 1회 재실행 |
| plugin_skill_index.json 사용 가능 (160 skill) | session_226 PASS — Phase A에서 loadIndex 1회 sanity check |
| UserPromptSubmit hook 표준 위치(.claude/hooks/, settings.json hooks 키) | user-prompt-submit-master-first.js 선례 존재 — Phase C에서 동 위치·동 등록 방식 |
| Master prompt 분포가 dry-run 4건과 유사 | **검증 안됨** — Phase B 20 표본이 곧 이 검증 |

### 4.2 리스크

| # | 리스크 | mitigation | fallback |
|---|---|---|---|
| R1 | 임계 0.22가 Master 실사용 prompt 분포에 과민(false-positive 폭증) | Phase B 20 표본으로 사전 측정. top-3 제한이 노이즈 자연 절단 | 임계 0.25로 상향 + topN 2로 축소 |
| R2 | 분모 캡 5가 짧은 prompt(≤4 토큰)에 영향 0이라 효과 비대칭 | 의도된 동작 — 짧은 prompt는 원래 점수 산출에 문제 없음 | 캡 4로 하향(짧은 prompt까지 영향) — Phase B 결과에 따라 결정 |
| R3 | runtime.js ↔ matcher.ts 동기화 실패 (이중 구현 drift) | Phase A Gate에 동치성 테스트(같은 4 prompt 동일 score) 박제 | matcher.ts 폐기 → runtime.js 단일화. dry-run CLI를 .js로 이전 |
| R4 | UserPromptSubmit hook latency가 critical path 부담 | 인덱스 read 캐싱(프로세스 lifetime), tokenize 단순 유지 | hook을 비동기 stdout(post-prompt) 패턴으로 전환 — 단 D-177은 pre-prompt 명세이므로 Master 결정 필요 |
| R5 | Phase 3 hook이 RECOMMEND 출력 시 prompt 컨텍스트 오염 (LLM이 추천 텍스트를 명령으로 해석) | RECOMMEND 출력에 명시 문구 "advisory only" 박제 + Prime Directive D1(적대적 컨텍스트 전제) 적용 | hook 출력을 별도 채널(파일·터미널 stderr)로 분리 |
| R6 | settings.json hook 등록이 다른 UserPromptSubmit hook(master-first)과 순서 충돌 | settings.json 등록 시 명시 순서 + 두 hook 모두 exit 0·non-blocking이므로 순서 무관 검증 | master-first hook 이후에 등록 |
| R7 | 20 prompt 표본의 expected skill을 Master/Arki가 자의적 라벨 → Gate G2 신뢰도 저하 | 표본 라벨링 시 Master 1차 검토 + 모호 케이스 제외 | Gate G2를 advisory로 격하, Gate G3(Master 직접 사용)을 정식 게이트로 |

### 4.3 Schedule-on-Demand 준수 (D-017)
본 계획에는 시간·인력·공수 표현 없음. Phase 간 의존은 `Phase A 완료 → Phase B`, `Gate G2 PASS 후 Phase C` 형식으로만 표현.

### 4.4 자기감사 1회

| 축 | 발견 |
|---|---|
| structuration | matcher.ts ↔ runtime.js 이중 구현 — Gate G_A 동치성 테스트로 강제 (R3 ROI: MUST_NOW) |
| hardcoding | 임계·topN·분모캡 매직넘버 — `DEFAULT_THRESHOLD`/`DEFAULT_TOP_N`/`TOKEN_DENOM_CAP` 상수화 (ROI: MUST_NOW) |
| efficiency | 매 prompt마다 plugin_skill_index.json read — 프로세스 lifetime 캐싱 (R4 ROI: MUST_BY_N=10) |
| extensibility | 점수 식이 가중치(3/2/1) 하드코딩 — Phase C 이후 토큰가중치 외부 config 분리 (ROI: DEFER, 옵션 C 분기로 처리) |

ARKI_WRITE_DONE: reports/2026-05-09_skill-hook-auto-trigger/arki_phase2_plan.md

[ROLE:arki]
# self-scores
str_cmp: 0.85
risk_cnt: 7
ref_cnt: 4
plan_phase: 4
