---
role: dev
session: session_167
topic: topic_144
topicSlug: dashboard-upgrade-v2-legend-nexus
turnId: 6
invocationMode: subagent
phase: implementation-phase1-4
rev: 1
date: 2026-05-02
scope: Phase 1·2·3·4 구현 — 코드/data 변경 + Riki R-1·R-2·R-3 mitigation 박제 + Phase 4 spec 박제
accessed_assets:
  - file: reports/2026-05-02_dashboard-upgrade-v2-legend-nexus/arki_rev1.md
    scope: design_spec + Dev 인계 spec + forbid 3항목
  - file: reports/2026-05-02_dashboard-upgrade-v2-legend-nexus/riki_rev1.md
    scope: 🔴 R-1·R-2·R-3 mitigation
  - file: reports/2026-05-02_dashboard-upgrade-v2-legend-nexus/dev_g0_rev1.md
    scope: G-0 18 file swap 분류 + ackedButUnresolved schema 권고
  - file: memory/shared/project_charter.json
    scope: write (v0.00 + era_history + skip flag)
  - file: memory/shared/system_state.json
    scope: write (currentVersion v0.00)
  - file: .claude/hooks/session-end-finalize.js
    scope: write (R-1 mitigation 1회용 가드 추가)
  - file: scripts/compute-dashboard.ts
    scope: write (D enum 5 sites)
  - file: app/dashboard-upgrade.html
    scope: write (GRADE_COLORS.D + gradeDist + mismatch 비교)
  - file: app/dashboard-ops.html
    scope: write (suspended topic card grade badge)
---

# Dev — Dashboard Upgrade ver2 / Legend Nexus 진입 (Phase 1·2·3·4 구현)

존댓말, 단계별 ✅/⚠️/❌ 표, 실행 명령 → 실제 출력 형식 증거. 본 보고서는 4 Phase 작업의 실측·결과 박제입니다.

---

## Phase 1 — 버전 patch + Riki R-1·R-2·R-3 mitigation

### 1.1 R-1 mitigation: versionBump hook 1회용 skip 가드

**구현 파일:** `.claude/hooks/session-end-finalize.js`

**추가된 함수 2개:**

| 함수 | 역할 |
|---|---|
| `isVersionBumpHookSkipped(sess)` | `project_charter.charter.versionBumpHookSkipNextSession === sess.sessionId`이면 true 반환 |
| `consumeVersionBumpHookSkipFlag(sess)` | hook 실행 후 1회용 flag 자동 제거 (다음 세션부터 정상 동작) |

**삽입 지점 3곳:**
- `detectVersionBump(sess)` 본문 첫 줄 — `if (isVersionBumpHookSkipped(sess)) return;`
- `applyVersionBump(sess)` 본문 첫 줄 — 동일
- `checkVersionBumpConfirmation(sess)` 본문 첫 줄 — 동일

**main 흐름 호출 추가:**
- 라인 1562 직후 `consumeVersionBumpHookSkipFlag(sess);`

**G-1 검증 (구문):**
```
$ node --check .claude/hooks/session-end-finalize.js
G-1 hook syntax OK
```

✅ Pass.

### 1.2 R-3 mitigation: era_history 필드명 `transitionedAt` 사용

**구현 파일:** `memory/shared/project_charter.json`

**추가 키:** `charter.era_history` (배열, 2 entry).

| era | versionStart | versionEnd | transitionedAt | summary |
|---|---|---|---|---|
| Legend Team | v0.1.0 | v2.201 | 2026-05-02 | 표기 종료 — 디렉토리/data SOT unified, 표기만 전환 (D=b 정합) |
| Legend Nexus | v0.00 | null | 2026-05-02 | 진입 — versionAtSession 과거 entry 불변 (E=a), 현 세션부터 baseline |

`endedAt` 필드는 사용하지 않음 (Riki R-3 정합).

### 1.3 currentVersion 2필드 v0.00 리셋 (E=a 정합)

| File | 변경 전 | 변경 후 |
|---|---|---|
| `memory/shared/project_charter.json` `charter.version` | v2.201 | v0.00 |
| `memory/shared/project_charter.json` `charter.name` | legend-team | legend-nexus |
| `memory/shared/system_state.json` `currentVersion` | v2.201 | v0.00 |
| `project_charter.history[]` 28 entry `version` 필드 | (불변) | (불변) ✅ |

`charter.versionBumpHookSkipNextSession: "session_167"` 1회용 flag 박제 (Phase 5 Edi 종료 후 자동 제거).

### 1.4 R-2 mitigation: commit 순서 강제

본 호출 범위에서는 commit 자동 수행 안 함 (Master 명시 없음). 순서 권고는 Edi 단계 책임으로 위임:
1. charter v0.00 + system_state v0.00 + era_history (Phase 1)
2. brand swap 18 file (Phase 2)
3. compute-dashboard.ts + dashboard panels (Phase 3)
4. docs/dashboard-upgrade-v2-spec.md (Phase 4 spec)
5. **D-NNN ledger entry는 마지막** (Edi 박제 시점에 currentVersion이 이미 v0.00 → versionAtSession 자동 v0.00)

### G-2 검증 (JSON 유효성)

```
$ node -e "JSON.parse(require('fs').readFileSync('memory/shared/project_charter.json','utf8'))"
charter OK
$ node -e "JSON.parse(require('fs').readFileSync('memory/shared/system_state.json','utf8'))"
system_state OK
```

✅ Pass.

---

## Phase 2 — Brand swap (Legend Team → Legend Nexus, active 한정)

### 2.1 18 file swap 결과

Dev G-0 분류표 그대로 적용. 카테고리별 결과:

| 카테고리 | 건수 | 결과 |
|---|---|---|
| A. Active code (`scripts/build.js`, `auto-push.js`, `app/_redirects`, `app/js/*.js` 3건) | 6 | ✅ 모두 swap |
| B. Active policy/doc (`app/css/tokens.css`) | 1 | ✅ swap |
| C. Active UI text (HTML title·heading·JS textContent) | 11 | ✅ swap |
| **합계 swap** | **18** | ✅ |

**라인별 변경 요약:**

| File | 라인(전) | 변경 |
|---|---|---|
| app/css/tokens.css | 2 | comment header |
| app/dashboard-ops.html | 6 | `<title>` |
| app/dashboard-upgrade.html | 6, 119, 388 | `<title>`, hero-label, JS textContent |
| app/decisions.html | 6 | `<title>` |
| app/deferrals.html | 6 | `<title>` |
| app/feedback.html | 6 | `<title>` |
| app/growth.html | 6 | `<title>` |
| app/index.html | 6, 20, 31 | `<title>`, h1, hero-label |
| app/people.html | 5 | `<title>` |
| app/session.html | 6, 292 | `<title>`, JS textContent |
| app/topic.html | 6, 213 | `<title>`, JS textContent |
| app/partials/sidebar.html | 54 | sidebar version label |
| app/_redirects | 1 | header comment |
| app/js/data-loader.js | 3 | header comment |
| app/js/md-renderer.js | 3 | header comment |
| app/js/nav.js | 3 | header comment |
| scripts/build.js | 2 | header comment |
| scripts/auto-push.js | 2 | header comment |

### 2.2 Master review 1건 — `docs/publish-contract.md`

**조치:** Dev G-0 권고 (b) 채택 — v0.4.0 (Legend Nexus) 신설 + v0.3.0 (Legend Team) 보존.

```
- # Publish Contract — Legend Team v0.3.0
+ # Publish Contract — Legend Nexus v0.4.0 (formerly Legend Team v0.3.0)
+
+ > **Era transition note (D-NNN / topic_144 / session_167, 2026-05-02):** 시스템명이 Legend Team → Legend Nexus로 표기 전환되었습니다. v0.3.0 시점 contract는 본 문서 내에 그대로 보존되며, v0.4.0 era는 Legend Nexus 표기 baseline + 향후 schema 확장 진입점입니다. 표기 외 contract 본문은 변경 없음.
```

본문 다른 부분은 변경 없음 (contract 의미 보존).

### 2.3 Forbid 3항목 준수 검증

| Forbid 항목 | 실측 | 결과 |
|---|---|---|
| history 소급 금지 (memory/sessions/, dashboard_data, topic_index, reports/, session_contributions, mock fixture) | 11 file 모두 미접촉 (G-3 grep 검증) | ✅ |
| historical text 금지 | active 영역 한정 swap, historical 텍스트 변경 0건 | ✅ |
| `package.json` `name` 필드 변경 금지 | 미접촉 | ✅ |

### G-3 검증 (active 영역 잔존 0)

```
$ grep -rn "Legend Team" /c/Projects/legend-team/app /c/Projects/legend-team/scripts/build.js /c/Projects/legend-team/scripts/auto-push.js /c/Projects/legend-team/docs

docs/publish-contract.md:1:# Publish Contract — Legend Nexus v0.4.0 (formerly Legend Team v0.3.0)
docs/publish-contract.md:3:> **Era transition note...** 시스템명이 Legend Team → Legend Nexus로 표기 전환되었습니다...
```

active 영역 잔존 0건. publish-contract.md의 2건은 의도적 historical reference (Dev G-0 권고 b 채택). ✅ Pass.

---

## Phase 3 — Grade D enum + dashboard 표시 + 토픽 카드 grade 뱃지

### 3.1 `scripts/compute-dashboard.ts` 5 site D enum 추가

| Line | 변경 전 | 변경 후 |
|---|---|---|
| 51 | `gradeDeclared?: 'S' \| 'A' \| 'B' \| 'C';` | `... \| 'D';` |
| 52 | `gradeActual?: 'S' \| 'A' \| 'B' \| 'C';` | `... \| 'D';` |
| 124 | `gradeDeclared: 'S' \| 'A' \| 'B' \| 'C';` | `... \| 'D';` |
| 125 | `gradeActual: 'S' \| 'A' \| 'B' \| 'C';` | `... \| 'D';` |
| 266 | `as 'S' \| 'A' \| 'B' \| 'C'` | `as 'S' \| 'A' \| 'B' \| 'C' \| 'D'` |
| 323 | `{ S: 0, A: 0, B: 0, C: 0 }` | `{ S: 0, A: 0, B: 0, C: 0, D: 0 }` |

**`sizeToGrade()` 미변경** — Master 결정 C=a "임계 재설계 안 함, D 누락만 patch" 정합. D는 `gradeDeclared`로만 진입, sizeToGrade는 C가 fallback.

### 3.2 `app/dashboard-upgrade.html` 4 site 갱신

| Line | 변경 |
|---|---|
| 724 | `GRADE_COLORS` 객체에 `D:'#94A3B8'` 추가 |
| 725 | `GRADE_LABELS`에 `D:'Lv. D — 명백 단순 (bug/fix/patch)'` 추가 |
| 731 | `count = {S:0,A:0,B:0,C:0}` → `{S:0,A:0,B:0,C:0,D:0}` |
| 734 | `['S','A','B','C']` → `['S','A','B','C','D']` (gradeDist 렌더 배열) |
| 764, 774 | mismatch 비교 배열에 D 포함 |

### 3.3 토픽 카드 grade 뱃지 신설

**위치:** `app/dashboard-ops.html` `renderSuspended()` 함수 (suspended topic card 렌더 — 토픽 카드 canonical 위치).

**구현:** `topic.grade` 필드 read하여 색상 뱃지 prepend. tokens.css 추후 정합 시 인라인 색은 fallback.

```js
const GRADE_BADGE = { S:'#8B5CF6', A:'#06B6D4', B:'#F59E0B', C:'#6E6E78', D:'#94A3B8' };
const gradeBadge = t.grade
  ? `<span class="topic-grade-badge" style="...background:${GRADE_BADGE[t.grade]}...">${t.grade}</span>`
  : '';
```

### G-1 검증 (TS type check)

```
$ npx tsc --noEmit  | grep "compute-dashboard"
(0 results — compute-dashboard.ts 타입 에러 0건)
```

✅ Pass. 다른 파일 pre-existing 에러는 본 patch 범위 외.

### G-4 검증 (compute-dashboard 실행 + D 카운트)

```
$ npx ts-node scripts/compute-dashboard.ts
📊 compute-dashboard.ts 시작...
✅ dashboard_data.json 생성 완료
   세션: 164개 | 경보: 3개 | 피드백 재발: 68개

$ node -e "...dashboard_data.json...gradeDistribution..."
gradeDistribution= {"S":75,"A":33,"B":42,"C":14,"D":0}
```

✅ Pass. D=0 정상 (현재 D 선언 세션 0건, 신규 D 세션부터 카운트).

### G-5 검증 (build)

```
$ node scripts/build.js
[build] Starting...
[build] ...
[build] Generated data/published/topics_manifest.json (140 topics)
[build] Generated data/published/decisions_summary.json (144 decisions)
[build] Done. dist/ ready with 587 data files + published/ artifacts.
```

✅ Pass. dist 빌드 통과 (기존 WARN 2건은 pre-existing topic_013 누락, 본 patch 범위 외).

---

## Phase 4 — ackedButUnresolved schema 박제 (Riki R-6 mitigation 정합)

### 4.1 Spec 문서 신설 (코드 수정 0)

**File:** `docs/dashboard-upgrade-v2-spec.md` (신규)

박제 항목:
1. **SOT 확정** — `decisions.caveats` 단일 출처 (open_issues deprecated 권고)
2. **caveats 형식 통일** — `string | string[]` → `string[]` 단일 (entry 단위 `caveatsMeta` 메타 추가)
3. **메타 필드** — `{acked, ackedAt, ackedBySession, resolvedAt}` 4개
4. **패널 조건** — `acked === true && resolvedAt === null && (currentSession - ackedBySession) >= 2`
5. **기존 5건 (D-130/132/133/141/143) 분류 = Master 1회 결정 항목** (자동 분류 금지, [no_retro_without_value] 정합)
6. **본체 구현 = child 토픽 분화 권고** ([implementation_within_3_sessions] 정합)

### 4.2 PD 등록 권고 (Edi 단계 위임)

- 제목: "ackedButUnresolved 본체 구현 — caveatsMeta schema + dashboard 패널 신설"
- resolveCondition: schema 마이그레이션 + 패널 표시 + 5건 분류 결정 박제 완료
- dependsOn: topic_144 closed

본 호출 범위에서는 PD entry write 안 함 (Edi 영역).

---

## 종합 검증 표

| Gate | 통과 기준 | 결과 |
|---|---|---|
| G-1 (hook 구문) | `node --check session-end-finalize.js` | ✅ |
| G-1 (TS type) | `npx tsc --noEmit` compute-dashboard 에러 0 | ✅ |
| G-2 (JSON 유효성) | charter + system_state JSON parse | ✅ |
| G-3 (active 영역 잔존 0) | grep "Legend Team" active 영역 | ✅ (publish-contract.md 의도적 historical 2건 제외) |
| G-4 (compute-dashboard) | D 카운트 포함 dashboard_data.json 생성 | ✅ (gradeDistribution.D = 0) |
| G-5 (build) | `node scripts/build.js` 통과 | ✅ |

---

## 본 호출 준수 사항

| 금지 항목 | 실측 |
|---|---|
| 일정·공수·담당 추정 | ✅ 0건 |
| `decision_ledger.json` 직접 Edit | ✅ 0건 (Edi 영역) |
| forbid 3항목 위반 | ✅ 0건 |
| 자동 commit | ✅ 0건 (Master 명시 없음) |
| session-end hook 자체 변경 (1회용 가드 외) | ✅ 가드 추가만 (R-1 mitigation 명시 범위) |

---

## 메모리 정합

- ✅ [dev_verify_and_callable] — config 원천 JSON에서 read (project_charter, system_state, dashboard_data 모두 JSON SOT 기반). 하드코딩 0.
- ✅ [implementation_within_3_sessions] — 본 토픽 첫 세션, child 분화 명시 (Phase 4 본체).
- ✅ [no_retro_without_value] — historical 영역 미접촉. era_history는 신설 키, 소급 단언 형식 회피 (`transitionedAt`).
- ✅ [arki_full_system_view] — 다축 검증 (TS·hook·JSON·HTML·build 5축 cross-check).

---

## Edi 인계 사항

다음 Phase 5에서 Edi가 처리:
1. **D-NNN 박제** — Legend Nexus era 진입 + 5축 결정 + Riki R-1·R-2·R-3 mitigation. versionAtSession은 system_state 현재값 read 시 v0.00 자동 박제됨.
2. **versionBumpSuggested 처리** — 본 세션 hook이 자동 감지 시도하나 `versionBumpHookSkipNextSession === session_167`로 skip됨. Edi가 명시적으로 `versionBump` 박제 안 해도 charter 본문은 이미 v0.00 박제 완료.
3. **PD 등록** — ackedButUnresolved 본체 구현 (Phase 4 본체) child 토픽 후보.
4. **commit 순서** — R-2 mitigation: charter+system_state → brand → compute-dashboard → docs spec → ledger entry 순.

---

DEV_WRITE_DONE: reports/2026-05-02_dashboard-upgrade-v2-legend-nexus/dev_rev1.md

[ROLE:dev]
# self-scores
rt_cov: 1.00
gt_pas: 1.00
hc_rt: 0.00
spc_drf: 0
