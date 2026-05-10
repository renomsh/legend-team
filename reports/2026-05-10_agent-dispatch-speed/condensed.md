# Session 233 / Topic 196 — Condensed

토픽: "Agent 호출 시간 단축 + 시스템 정제" (Grade B, execution → close)
세션 보고서 7건 압축. cross-role 핵심 결론·결정·미해결만.

---

## Turn 0 — Arki rev1 (dispatch 단축 옵션 6종)

병목 분해 (1회 호출 단위, 추정):
- A Nexus prompt (3~7%) / B PreToolUse hook chain 3개 직렬 (15~25%, Node cold-start ×3 200~600ms) / C Task RPC + 서브 부트스트랩 (40~60%, 단일 최대) / D 모델 첫 토큰 (20~35%) / G PostToolUse (3~5%).
- 누적 inject: 페르소나 7KB + 토픽 Edi 누적 8KB + 세션 turns 증가 → mutatedPrompt 후반 15KB+.

옵션:
- **Opt-1** PreToolUse hook 3→1 통합. 절감 100~300ms. 즉시 적용 권고.
- **Opt-2** persona layer 캐시. 절감 ~30ms/호출, 누적 가치. 검증 후.
- **Opt-3** session/topic payload 절삭 강화 (cap 80→40KB). D 30~40% 절감. 단순 cap만 즉시.
- **Opt-4** 모델 다운그레이드 (edi 등 sonnet). 15~25% 절감. 검증 후 (pilot).
- **Opt-5** PostToolUse 비동기. **기각** (race 위험 > G 절감 3~5%).
- **Opt-6** 병렬 dispatch. 검증 후.

자기감사: 단계 % 합계 110% 직렬/병렬 미명시. `MAX_CHARS_PER_REPORT`/`TOTAL_CAP_CHARS` 외부화 권고.

---

## Turn 1 — Riki rev1 (적대적 감사)

종합 3줄:
1. **Opt-1**: Sage gate `process.exit(2)` hard block과 try/catch 격리 충돌 — D-128 silent 무력화 시나리오. master-first warn-only가 BLOCK 격상 회귀 위험. **검증 후로 강등** 권고.
2. **Opt-5**: D-169 nexus 모드 `pending_turns_{sid}.jsonl` 시퀀스 파괴. 즉시 기각 동의.
3. **공통 결정 차단**: pre-hook 실측 부재. SPIKE_R6_LOG는 post-hook만. **결정 전 1주 데이터 수집 필수**.

옵션별:
- Opt-1 R-1 sage exclusive 무력화 / R-2 master-first 격상 → 즉시 → 검증 후 강등. 조건: pre-hook instrumentation + sage-gate try/catch 밖 분리.
- Opt-2 R-3 `_common.md` race → mtime fallback inline 재합성 박제 조건. 일평균 호출수 < 100이면 무용.
- Opt-3 R-4 cap 감축 시 서브 Read 보충으로 E 증가 / R-5 Edi 8KB 예외 필수. 본질은 selection (직전 N=3 turns).
- Opt-5 R-6 nexus 모드 turn 박제 race — 결정적 기각.
- 공통: prefix cache 가설이 옳다면 prompt 절삭 효과 ~0 가능성.

---

## Turn 2 — Arki rev2 (정제 대상 진단, dispatch out-of-scope 후)

토픽 본질 재정의: "inject 컨텍스트의 의미밀도(signal/noise) 회복".

실측 인벤토리:
- CLAUDE.md 276L, 결정 인용 ~43건. **🔴 broken: `agents/role-sage.md`(L21)·`agents/role-zero.md`(L22)** — `agents/` 디렉터리 부재.
- decision_ledger 180건 (D-002~D-177). **🔴 undeclared deprecation 30건** (본문에 supersede/폐기 명시인데 status 미갱신). 빈 summary 8건.
- MEMORY.md 38 인덱스, 디렉터리 41 파일.
- 역할 메모리 11종 중 **🔴 dev_memory.json SYNTAX ERROR (L78 col 5)** — 콤마 누락, require throw, D-092 dev 통계 silent drop 위험.
- **🔴 `agents/` 디렉터리 부재** — 3층 정의는 사실상 2층(personas + policies). CLAUDE.md만 3층 표기.
- signature_metrics 명칭 잔재 (D-065 이후 base로 흡수, 파일명 prefix 잔존).

정제 분류:
- A. Superseded 박제 정상 11건 — 정제 불요.
- B. Duplicate 5건 (B-1·B-3 stale, B-2·B-4·B-5 유지).
- C. Stale (정착 reminder 가치 약화) — MEMORY 13건 archive 후보.
- D. undeclared deprecation 30건 → backfill 후보.
- E. broken link 3건 → 정정.

---

## Turn 3 — Riki rev2 (timeout, 보고서 미생성 — gap)

리스크 보강 의도였으나 timeout. 박제 누락 — Edi gap 항목.

---

## Turn 4 — Dev Phase 1 (audit 자동화 토대)

신설 5 파일 (817L total):
- `scripts/audit-decision-ledger-status.ts` (159L)
- `scripts/audit-broken-references.ts` (170L)
- `scripts/audit-memory-feedback-coverage.ts` (247L)
- `scripts/validate-role-memory-json.ts` (139L)
- `scripts/lib/audit-helpers.ts` (102L)

dry-run 결과:
- #1: total=180, self-undeclared=33, referent-undeclared=27 (Arki 30건 vs 실측 110%, ✅)
- #2: scanned=38, broken=3 (CLAUDE.md L21·L22·L263, ✅ 100%)
- #3: index=38, files=39, missing=1, archive-candidates=36 (⚠️ 임계 보수 필요, Phase 2 튜닝)
- #4: files=11, errors=1 (dev_memory.json L78 col 5, ✅ 100%)

G1 게이트 4/4 통과 (#3 부분). 4 callable export 통합 호출 검증 완료. 하드코딩 0 (모두 `process.cwd()` + override).

---

## Turn 5 — Dev Phase 2 (mechanical 정제 4 작업)

| 작업 | 결과 |
|---|---|
| 1. MEMORY 13건 archive | ✅ `~/.claude/projects/.../memory/archive/feedback/`로 이동, 인덱스 38→25, 본문 보존 |
| 2. dev_memory.json fix | ✅ 콤마 1개 추가 (워크트리+메인 동기), validator errors=0 |
| 3. CLAUDE.md broken link 3건 | ✅ Sage/Zero → `memory/roles/personas\|policies/role-{r}.md`, close → `.claude/commands/close.md`. audit broken 3→0 |
| 4. ledger 30건 backfill | **0건 변경** — 33건 self-undeclared 모두 정밀 분석 결과 referent 의미 (`{this.id}을(를) supersede` 외부 증거 0건). spec "판정 모호 시 보류" 준수 |

발견: audit `self-undeclared` 키워드 매칭이 100% false positive. 정밀화 옵션 (외부 증거 cross-check / referent-undeclared 통합)은 별 토픽.

검증 게이트 10/10 통과.

---

## Turn 6 — Zero rev1 (정제 검사 21건)

본 세션 신설 5 audit + audit-helpers + Phase 2 수정 한정. 기존 lib 중복 0.

| 영역 | 발견 | 즉시 | Phase 3 | 별 토픽 |
|---|---|---|---|---|
| A. tech-debt | 9 | 3 | 6 | 0 |
| B. simplify | 6 | 2 | 3 | 1 |
| C. security-review | 6 (hardcoded secret 0건) | 0 | 1 | 1 |
| **합계** | **21** | **5** | **10** | **2** |

즉시 5건:
- A-1 audit-broken-references SKILL_WHITELIST 빈 Set + dead branch
- A-3 audit-broken-references `||` 우항 동치
- A-4 audit-decision-ledger-status `\|supersedes` 정규식 중복
- B-4 validate-role-memory-json row.error 누락
- B-5 audit-decision-ledger-status referent 행 selfStatus 의미 혼선

별 토픽 후보: B-6 CLI runner 추상화 / C-4 archive 자동화 시 dest 화이트리스트.

---

## Turn 7 — Dev Phase 2.1 (Zero 즉시 5건 fix)

5 fix 모두 적용. before/after 코드 인용 박제. 4 audit 회귀 0 (Phase 1 baseline 동일).

- Fix 1 (A-1): Set + dead branch 삭제, `if (!exists)` 단순화.
- Fix 2 (A-3): `const exists = fs.existsSync(refPath);` 단일.
- Fix 3 (A-4): `/(supersede[ds]?|폐기|deprecat(ed|ion|es)?)/i`.
- Fix 4 (B-4): row.error에 `'missing both lessonLog and metrics keys'` 박제. ad-hoc 합성 테스트로 동작 확인.
- Fix 5 (B-5): referent 행 selfStatus='' (실데이터 보고서 sampling 확인).

callable export 시그니처 변경 0. scope drift 0 (Phase 3 후보 미터치). G2.1 통과.

비고: PostToolUse(Edit) hook이 `npm run build:scripts` 시도하나 package.json 해당 script 부재 — 매 Edit마다 `Missing script` 출력. 본 작업 무관, 별 토픽/PD 후보.

---

## Master 결정 박제 (세션 중)

- dispatch 인프라 변경(hook 통합·캐시·cap 절삭·모델 다운·병렬·비동기) **out-of-scope** 확정 → "시스템 정제"로 토픽 본질 전환 (Turn 1·2 사이).
- Phase 1 audit 자동화 토대 → Phase 2 mechanical 정제 4작업 → Zero 검사 → Phase 2.1 즉시 5건 fix 순차 진행 승인.
- 작업 4 ledger backfill **0건 변경** 결정: spec "판정 모호 시 보류" 준수.

---

## 미해결 / Gap / PD 후보

1. **Riki rev2 timeout** — 박제 누락. Edi gap 항목 박제.
2. **dispatch 단축 옵션 검증 보류** — Opt-1·Opt-2·Opt-3·Opt-4·Opt-6 모두 pre-hook 실측 인프라 부재로 보류. 별 토픽 후보.
3. **audit `self-undeclared` 분류 로직 정밀화** — 33건 100% false positive 판명. 외부 증거 cross-check / referent-undeclared 통합 별 토픽.
4. **메인 CWD에서 audit 재검증** — 본 세션은 워크트리에서 수행. 메인 broken-ref 재검증 권고.
5. **Zero Phase 3 후보 10건** — A-2/A-5/A-6/A-7/A-8/A-9/B-1/B-2/B-3/C-5. 차후 정제 라운드.
6. **Zero 별 토픽 후보 2건** — B-6 4 audit CLI runner 공통 추상화 / C-4 archive 자동화 dest 화이트리스트.
7. **`Missing script: build:scripts`** PostToolUse hook 회귀 — package.json 정비 별 토픽/PD 후보.
8. **reports historic `agents/role-` 인용 잔존** — audit reports 디렉터리 제외 누락 시 향후 false positive 가능. 별 토픽.

---

## 산출물 합계

- 신설 스크립트: 5 (817L)
- 신설 audit 보고서: 4 (`reports/2026-05-10_*-audit.md` 외 1)
- 정제 적용: MEMORY -13 archive / dev_memory.json fix / CLAUDE.md broken link 3건
- Zero 즉시 fix: 5건 (Phase 2.1)
- 변경 보류: ledger 30건 backfill (false positive 판명)
