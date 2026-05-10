---
role: zero
turnId: 6
sessionId: session_233
topicId: topic_196
invocationMode: subagent
---

# Zero rev1 — 본 세션 신설·수정 산출물 정제 진단

Master, Zero입니다. session_233 / topic_196 Phase 1·2에서 신설된 5 audit 스크립트 + audit-helpers + Phase 2 수정 파일 한정 정제. 3 영역(tech-debt / simplify / security-review) 발견 + 권고 분류.

**검사 대상 (실측):**
- 신설 5: `scripts/audit-decision-ledger-status.ts` (159L), `scripts/audit-broken-references.ts` (170L), `scripts/audit-memory-feedback-coverage.ts` (247L), `scripts/validate-role-memory-json.ts` (139L), `scripts/lib/audit-helpers.ts` (102L)
- 수정 3: 메인+워크트리 `CLAUDE.md`, `dev_memory.json`, 글로벌 `MEMORY.md`
- audit 산출물 4 reports (read-only md, 정제 대상 약함)

**기존 lib 중복 검사:** `scripts/lib/utils.ts`(readJson/writeJson/appendLog/nextId)와 `audit-helpers.ts`(todayYMD/writeReport/mdTable/safeParseJson/walk) 함수 시그니처 직교 — **중복 0**. 다른 lib 파일 11종도 audit 함수 미보유 (Grep 확인). `audit-helpers.ts` 신설은 정당.

---

## A. tech-debt

| # | 위치 | 진단 | 권고 |
|---|---|---|---|
| A-1 | `audit-broken-references.ts` L52-55 | `SKILL_WHITELIST = new Set<string>([])` 빈 Set + 주석만. L84 `!SKILL_WHITELIST.has(ref)` 분기는 dead branch (항상 true). | **즉시 수정** — 빈 Set + 분기 제거 or TODO 주석 명시 |
| A-2 | `audit-broken-references.ts` L41-50 `REF_PATTERNS` | 정규식 4종 매 줄·매 패턴 `new RegExp(pat.source, 'g')` 재컴파일 (L72) — 원본도 이미 `g` 플래그. 모듈 상수로 빼면 충분. | **Phase 3** (성능 영향 micro, 구조만) |
| A-3 | `audit-broken-references.ts` L80-82 | `const exists = fs.existsSync(refPath) || (ref.endsWith('/') && fs.existsSync(refPath));` — `||` 양쪽 동일 표현. 우항 dead. | **즉시 수정** — 우항 제거 or 디렉터리 분기 의도 복원 |
| A-4 | `audit-decision-ledger-status.ts` L33 `KW_RE` | `(supersede[ds]?\|supersedes\|...)` — `[ds]?`가 이미 `supersedes`까지 커버. `\|supersedes` 중복. | **즉시 수정** (정규식 정리) |
| A-5 | `audit-decision-ledger-status.ts` L35 | `ACTIVE_STATUSES = new Set([...undefined, '', null...])` — Set에 undefined·null 넣지만 L54-57 `isActive`에서 별도 분기로 처리. Set의 undefined/null 항목 dead. | **Phase 3** — Set은 ['active'] 단순화 |
| A-6 | `audit-decision-ledger-status.ts` L34 `ID_RE` | 모듈 상수에 `g` 플래그 — L98 `new RegExp(ID_RE.source, 'g')` 매 호출 재컴파일. lastIndex 공유 회피 의도면 OK이나 주석 부재. | **Phase 3** — 의도 주석 추가 |
| A-7 | `audit-memory-feedback-coverage.ts` L41-47 | `DEFAULT_MEMORY_DIR` 글로벌 상수 — Windows 한정 경로(`C--Projects-legend-team`). cross-platform fallback 부재. | **Phase 3** — `process.env` override 옵션 또는 함수 인자만 사용 |
| A-8 | `audit-memory-feedback-coverage.ts` L107-118 / L119-129 | policiesDir·personasDir 동일 패턴 반복 (readdirSync + push). 함수화 가능. | **Phase 3** (3줄 이상 반복 1회 — 즉시 함수화 임계 미달, 차후 1회 더 발생 시) |
| A-9 | `audit-helpers.ts` L80 `walk()` | export됐으나 신설 4 audit 스크립트 어디서도 import 안 함 (Grep 확인). 사전 일반화. | **Phase 3** — 사용처 발생 전 제거 검토 (PD 후보) |

**소계: 9건 (즉시 3, Phase 3 6, 별 토픽 0)**

---

## B. simplify

| # | 위치 | 진단 | 권고 |
|---|---|---|---|
| B-1 | `audit-memory-feedback-coverage.ts` 전체 247L | 파일 길이 자체는 룰 위반 아니나 `auditMemoryFeedbackCoverage()` 단일 함수 L85-210 (≈125L). depth 4 중첩 (for→for→if→for) L156-163. | **Phase 3** — `loadAbsorptionSources()`·`classifyItem()` 분리 |
| B-2 | `audit-memory-feedback-coverage.ts` L147-179 | 동일 grep 패턴 4회 반복 (ledger / policies / project / global) — `for k of kws` 루프 중복. | **Phase 3** — `countKwHits(text, kws)` 헬퍼 추출 |
| B-3 | `audit-broken-references.ts` L100-134 `targets` 빌드 블록 | 5개 디렉터리 등록 시 if-exists + readdirSync 패턴 중복 3회. | **Phase 3** — `addMdFiles(targets, dir)` 헬퍼 |
| B-4 | `validate-role-memory-json.ts` L86-91 | "missing both lessonLog and metrics" 에러 push가 `errors[]`에만 가고 `rows[].error`에는 미반영 — 보고서 표 `error` 칼럼 빈 채로 남음. | **즉시 수정** — row.error에도 동일 메시지 박제 |
| B-5 | `audit-decision-ledger-status.ts` L83 vs L110 | `selfStatusRaw`를 `(d.status as string \| undefined) \|\| 'active'`로 캐스팅하나 referent 분기에서도 동일 변수 재사용 — 의미 혼선(self의 status가 referent 행에 표시됨). | **즉시 수정** — referent-undeclared 행에서는 selfStatusRaw 비우거나 명칭 분리 |
| B-6 | 4 audit 스크립트 공통 | CLI 진입부 `if (require.main === module)` + `console.log` + `writeReport` 3박자 동일 — 헬퍼화 가능 (단 Node `require.main` 의미상 각 파일 잔존 필요). | **별 토픽** — runner 추상화는 정제 범위 초과 |

**소계: 6건 (즉시 2, Phase 3 3, 별 토픽 1)**

---

## C. security-review

| # | 위치 | 진단 | 권고 |
|---|---|---|---|
| C-1 | 신설 5 파일 전체 | hardcoded secret·token·credential **0건** (Grep `secret\|token\|password\|api[_-]?key` no hit). | — |
| C-2 | 4 audit 스크립트 CLI | 외부 입력 (process.argv) 미사용 — sanitize 불요. ledgerPath/rolesDir 등 함수 인자만 export, CLI는 인자 없이 default 사용. | — |
| C-3 | `audit-helpers.ts` `writeReport` L25-28 | `path.dirname(reportPath)` 기준 `mkdirSync({recursive: true})` — 호출자(4 audit 스크립트)가 모두 `path.join(process.cwd(), 'reports', ...)` 으로 정적 경로 사용. CLI 인자 traversal 표면 0. | — |
| C-4 | Phase 2 archive 작업 (`fs.renameSync`) | **본 산출물 코드에는 archive 로직 미존재** — 별 스크립트(혹은 수동)로 수행됐을 가능성. `scripts/` 신설 5 파일 어디에도 `renameSync` 호출 없음 (Grep 확인). | **별 토픽** — archive 자동화 스크립트화 시 dest 화이트리스트 필수 (선제 권고) |
| C-5 | `audit-memory-feedback-coverage.ts` L41-47 절대 경로 상수 | `os.homedir() + '.claude/projects/C--Projects-legend-team/memory'` 하드코딩. 보안 위협 아니나 환경 결합도 高. | **Phase 3** — A-7과 동일 (환경 변수화) |
| C-6 | `audit-broken-references.ts` L106 | `os.homedir() + '.claude/CLAUDE.md'` — 의도된 글로벌 read. read-only, traversal 0. | — |

**소계: 6건 (즉시 0, Phase 3 1, 별 토픽 1, OK 4)**

---

## 종합

| 영역 | 발견 | 즉시 | Phase 3 | 별 토픽 |
|---|---|---|---|---|
| A. tech-debt | 9 | 3 | 6 | 0 |
| B. simplify | 6 | 2 | 3 | 1 |
| C. security-review | 6 | 0 | 1 | 1 |
| **합계** | **21** | **5** | **10** | **2** |

### 즉시 수정 권고 (Phase 2 직전 또는 직후 패치 1회)
1. **A-1** `audit-broken-references.ts` L52-55, L84 — 빈 SKILL_WHITELIST + dead branch 제거
2. **A-3** `audit-broken-references.ts` L80-82 — 동일 표현 OR 우항 제거
3. **A-4** `audit-decision-ledger-status.ts` L33 — `\|supersedes` 중복 제거
4. **B-4** `validate-role-memory-json.ts` L86-91 — row.error 누락 박제
5. **B-5** `audit-decision-ledger-status.ts` L110 — referent 행의 selfStatus 의미 혼선 정리

### Phase 3 (다음 정제 라운드)
A-2, A-5, A-6, A-7, A-8, A-9, B-1, B-2, B-3, C-5 — 10건. 구조 개선·헬퍼 추출·환경 결합도 완화. ROI 평가 후 일괄 처리.

### 별 토픽 분리
- **B-6**: 4 audit 스크립트 CLI runner 공통 추상화 (정제 범위 초과, 신설 스크립트 문화 결정 필요)
- **C-4**: archive 자동화 스크립트화 시 dest 화이트리스트 (현재 archive 자동화 코드 미존재 — 선제 권고만)

### Self-exclusion 준수 확인
본 정제 대상에 메타-자산(violation flag, audit trail meta, self-scores log) 없음. audit 스크립트는 자산 read-only 분석 결과물(reports md)을 생산할 뿐 메타-자산 자체가 아님 — 침범 0.

### Phase 2 수정 파일 정제
- `CLAUDE.md` broken link 정정 3건: 정정 방향 검증 OK (`agents/role-*.md` → `memory/roles/personas/role-*.md` 상정). 추가 정제 0건.
- `dev_memory.json` line 77 콤마 fix: JSON 파싱 OK (`validate-role-memory-json.ts` 결과 dev=parseOk:Y로 후속 검증 가능). 추가 정제 0건.
- 글로벌 `MEMORY.md` 인덱스 13건 제거: 본 워크트리 read 권한 외, 정제 대상 회피 (Master 스코프).

---

**검증 상태:** 본 보고서 발견은 코드 read 기반 정적 진단. `즉시 수정` 5건은 패치 후 4 audit 스크립트 재실행으로 출력 동일성 확인 가능 (B-4·B-5는 보고서 칼럼 변경 의도이므로 출력 비교 권장).

[ROLE:zero]
# self-scores
ref_cnt: 21
hc_found: 0
cln_rt: 0.76
