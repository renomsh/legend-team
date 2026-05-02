---
role: dev
session: session_167
topic: topic_144
topicSlug: dashboard-upgrade-v2-legend-nexus
turnId: 5
invocationMode: subagent
phase: G-0-measurement
rev: 1
date: 2026-05-02
scope: G-0 실측만 (코드 수정 0건, 측정·grep·read만)
accessed_assets:
  - file: memory/shared/decision_ledger.json
    scope: D-124 entry + caveats grep
  - file: topics/topic_131/open_issues.json
    scope: schema 형식 확인
  - file: topics/topic_141/open_issues.json
    scope: schema 형식 확인
  - file: app/, scripts/, docs/, memory/, reports/, tests/, topics/
    scope: "Legend Team" grep 전수
---

# Dev G-0 실측 보고 — rev1

존댓말 / 표 위주 / 측정·분류만 / 코드 수정 0건.

---

## G-0-1. ackedButUnresolved schema 실측

### D-124 원문 (decision_ledger.json line 2007~2019, 발췌)

| 필드 | 값 |
|---|---|
| id | D-124 |
| date | 2026-04-29 |
| session | session_141 |
| topic | topic_131 |
| axis | 판정 주체(D-120 미결) + Ace ack 누수 차단 |
| supersedes | D-120 |

**핵심 본문 (decision 필드 발췌):**
- ack TTL = 2 세션, 미resolve 시 severity 무관 `openMasterAlerts` 강제 prepend
- 주간 dashboard `ackedButUnresolved` 패널 별도
- 기록 위치: "별도 인프라 (NCL 폐기 후 재정의 필요) + memory/master/master_feedback_log.json (가시 요약)"

**중요**: D-124 본문은 ackedButUnresolved의 **저장 위치를 명시하지 않음**("재정의 필요" 명문화). 즉 schema는 D-124 시점 미확정 상태로 남겨졌고, NCL이 D-133에서 폐기된 이후로도 후속 결정 박제 없음.

### 후보 source 3종 분석표

| Source | 위치 | 활성 entry 수 | 형식·예시 | ackedButUnresolved 적합성 |
|---|---|---|---|---|
| **A. decisions.caveats** | `memory/shared/decision_ledger.json` 각 entry의 `caveats` 필드 | **5건** (grep 결과) | 문자열 또는 문자열 배열. 예: D-141 "Riki R-1: recallReason 추출 로직 …", D-143 "rules.edi가 hook에 의해 read되지 않으므로 …" | **△ 부분 적합** — 결정 박제 시 미해소 이슈 자연 박제 위치. 단 status 필드 없음, ackedReason·ackTTL 미존재 |
| **B. open_issues** | `topics/{topicId}/open_issues.json` | **0건** (전수 확인 — topic_001/055/064~144 모두 `"issues": []`) | `{topicId, issues: []}` 빈 스키마만 존재 | **× 미사용** — 인프라만 있고 실제 entry 0건. 운영 흔적 없음 |
| **C. 별도 필드 (ackedReason / acknowledgedBy / ackedButUnresolved)** | grep 결과 | **0건** (코드/데이터에 정의 없음. 매칭 16건 전부 docs·reports·hook 주석·master_first_state) | — | **× 미존재** — 신설 필요 |

(grep 보강:
- `"caveats"` 매칭 5건 — D-130(`caveat`), D-132, D-133, D-141(`caveats[]`), D-143(`caveats`)
- `ackedButUnresolved` 등 키워드는 hooks/finalize.js, riki/arki 본 세션 보고서, master_first_state, decision_ledger에 텍스트로만 존재 — 실제 데이터 필드로 박제된 적 없음)

### 권고 (single SOT)

> **`decisions.caveats`를 SOT로 활용 + 정형화 보강**

근거 3축:
1. **운영 흔적 존재** — caveats 5건 실제 사용 중. open_issues 0건은 dead schema.
2. **D-124 정합** — D-124 본문이 "기록 위치 재정의 필요"라 했는데, NCL 폐기(D-133) 이후 caveats가 사실상 그 자리를 메우고 있음 (D-141·D-143 caveats 모두 미해소 항목 포함).
3. **dashboard 노출 자연성** — decision_ledger는 이미 dashboard_data.json 파이프라인에 포함되어 있어 패널 신설 시 데이터 추가 추출 비용 0.

**보강 spec 제안 (Phase 4 child 토픽에서 결정 박제할 항목):**
- caveats 형식을 `string | string[]`에서 `string[]` 단일 형식으로 통일
- 각 caveat entry에 추가 메타 필드: `acked: boolean`, `ackedAt: ISO8601`, `ackedBySession: sessionId`, `resolvedAt: ISO8601 | null`
- 신규 caveat 박제 시 default `{acked: false}`. dashboard ackedButUnresolved 패널 = `acked === true && resolvedAt === null && (currentSession - ackedBySession) >= 2`
- migration: 기존 5건 caveats는 일괄 `{acked: false}` 부여 후 Master 1회 ack 트리거

**리스크 1건 (Master 1회 review 필요):**
- 기존 caveat 5건 중 D-141 `caveats[0]` "Riki R-1: recallReason …"은 **이미 본 세션 외에서 미해소 상태로 운영 중**. SOT 전환 시 이 항목들의 acked/resolved 분류를 Master가 1회 결정해야 함. 자동 분류 금지(memory [no_retro_without_value] 위반).

---

## G-0-2. Brand swap "Legend Team" active/historical 분류

### grep 실행

```
grep -rl "Legend Team" . --exclude-dir={node_modules,.git,dist,build,tmp,worktrees}
```
worktrees는 별도 grep 라인에서 추가 후처리(grep -v)로 제외 (git 작업 디렉토리만 분석 대상).

**총 매칭 file 수: 30건**

### 분류표

| # | File | 카테고리 | swap 대상 | 근거 |
|---|---|---|---|---|
| 1 | `app/css/tokens.css` (line 2) | B. Active policy/doc | ✅ swap | 디자인 토큰 헤더 주석 — 운영 코드 |
| 2 | `app/dashboard-ops.html` (line 6) | C. Active UI text | ✅ swap | `<title>` 표시 문구 |
| 3 | `app/dashboard-upgrade.html` (3 lines: 6, 119, 388) | C. Active UI text | ✅ swap | `<title>`, hero-label, JS 동적 textContent |
| 4 | `app/decisions.html` (line 6) | C. Active UI text | ✅ swap | `<title>` |
| 5 | `app/deferrals.html` (line 6) | C. Active UI text | ✅ swap | `<title>` |
| 6 | `app/feedback.html` (line 6) | C. Active UI text | ✅ swap | `<title>` |
| 7 | `app/growth.html` (line 6) | C. Active UI text | ✅ swap | `<title>` |
| 8 | `app/index.html` (3 lines: 6, 20, 31) | C. Active UI text | ✅ swap | `<title>`, h1, hero-label |
| 9 | `app/people.html` (line 5) | C. Active UI text | ✅ swap | `<title>` |
| 10 | `app/session.html` (lines 6, 292) | C. Active UI text | ✅ swap | `<title>`, JS 동적 |
| 11 | `app/topic.html` (lines 6, 213) | C. Active UI text | ✅ swap | `<title>`, JS 동적 |
| 12 | `app/partials/sidebar.html` (line 54) | C. Active UI text | ✅ swap | sidebar version label |
| 13 | `app/_redirects` (line 1) | A. Active code | ✅ swap | CF Pages 설정 헤더 주석 |
| 14 | `app/js/data-loader.js` (line 3) | A. Active code | ✅ swap | 파일 헤더 주석 |
| 15 | `app/js/md-renderer.js` (line 3) | A. Active code | ✅ swap | 파일 헤더 주석 |
| 16 | `app/js/nav.js` (line 3) | A. Active code | ✅ swap | 파일 헤더 주석 |
| 17 | `scripts/build.js` (line 2) | A. Active code | ✅ swap | 파일 헤더 주석 |
| 18 | `scripts/auto-push.js` (line 2) | A. Active code | ✅ swap | 파일 헤더 주석 |
| 19 | `docs/publish-contract.md` (line 1) | B. Active policy/doc | ⚠️ Master review | publish contract 문서 제목. v0.3.0 명시 — 신중 |
| 20 | `tests/vr/fixtures/dashboard.mock.json` (line 945) | D. Historical | ❌ DO NOT TOUCH | mock fixture, 과거 토픽 제목 "Legend Team Dashboard #2" 참조 |
| 21 | `scripts/_archived/generate-dashboard.ts` (lines 274, 600) | D. Historical | ❌ DO NOT TOUCH | `_archived/` 경로 — deprecated 스크립트 (CLAUDE.md Script Status에 Deprecated 명시) |
| 22 | `memory/sessions/session_index.json` (lines 496, 4662) | D. Historical | ❌ DO NOT TOUCH | 과거 세션 토픽명 + note 텍스트. 닫힌 session 박제물 |
| 23 | `memory/shared/dashboard_data.json` (line 939) | D. Historical | ❌ DO NOT TOUCH | 과거 토픽 카드 데이터 — 빌드 산출물이므로 source 수정 시 자동 회귀 |
| 24 | `memory/shared/topic_index.json` (line 2172) | D. Historical | ❌ DO NOT TOUCH | 과거 토픽 entry title 필드 — D-F SOT 정책상 외부 직접 수정 금지 |
| 25 | `reports/2026-04-08_upgrade-delta-pack/data-loader.js` | D. Historical | ❌ DO NOT TOUCH | reports/ 박제물 |
| 26 | `reports/2026-04-17_legend-team-dashboard-2/edi_rev1.md` | D. Historical | ❌ DO NOT TOUCH | 폴더명·내용 모두 historical |
| 27 | `reports/2026-04-26_dashboard-maintenance-home-growth-system/edi_rev1.md` | D. Historical | ❌ DO NOT TOUCH | reports/ 박제물 |
| 28 | `reports/2026-05-02_dashboard-upgrade-v2-legend-nexus/arki_rev1.md` | D. Historical | ❌ DO NOT TOUCH | 본 세션 Arki 보고서 (text 인용) |
| 29 | `reports/2026-05-02_dashboard-upgrade-v2-legend-nexus/riki_rev1.md` | D. Historical | ❌ DO NOT TOUCH | 본 세션 Riki 보고서 (text 인용) |
| 30 | `topics/topic_113/session_contributions/session_110.md` | D. Historical | ❌ DO NOT TOUCH | session_contributions 박제물 |

### 카테고리 합계

| 카테고리 | 건수 | swap 대상 |
|---|---|---|
| A. Active code | 6 | ✅ |
| B. Active policy/doc | 2 (tokens.css 명백 + publish-contract.md 모호) | ✅ 1건 + ⚠️ 1건 review |
| C. Active UI text | 11 | ✅ |
| D. Historical (보존) | 11 | ❌ |
| **합계** | **30 file** | **swap 대상 18건 + Master review 1건 + 비대상 11건** |

### Riki R-4(🟡) 답변 — Master 1회 review 필요한 모호 항목

**1건만 모호:**

- **`docs/publish-contract.md`** (line 1: `# Publish Contract — Legend Team v0.3.0`)
  - 모호 사유: 과거 v0.3.0 시점 contract 명세. brand 변경 시 (a) 제목만 swap → versioned doc 정합 깨짐 우려, (b) v0.4.0+ 신규 contract 별도 신설 후 v0.3.0 보존 → 권장 경로
  - 권고: **Master 1회 review로 (b) 채택 결정 필요**. 본 세션 차단점 아님 (Phase 1 진입 가능).

기타 29 file은 분류 명확. 모호 0건 (publish-contract 1건만 신중 review).

---

## 차단점 해소 GO/HOLD 의견

| 항목 | 상태 | 차단 여부 |
|---|---|---|
| G-0-1 ackedButUnresolved schema | 권고 1개 박제 (`decisions.caveats` SOT + 정형화 보강 spec) | **해소** — Phase 4 child 토픽에서 박제 결정 가능 |
| G-0-2 brand swap 분류 | 30 file 분류 완료. swap 18 / review 1 / 비대상 11 | **해소** — Phase 1에서 18 file 일괄 swap 진행 가능 |
| 모호 항목 | publish-contract.md 1건 | **비차단** — Master 1회 review로 진행 중 결정 가능 |

### 최종 박제 사항

- **G-0-1 권고 schema**: `decisions.caveats` 단일 SOT (open_issues 폐기 권고, 별도 신설 비추천)
- **G-0-2 swap 대상 file 수**: **18건** (active code 6 + active policy/doc 1 명백 + active UI 11) + Master review 1건
- **G-0-2 비대상 file 수**: **11건** (historical 보존)
- **Phase 1 진입 의견**: **GO** — 차단점 모두 해소. Master review 1건은 Phase 1 작업 중 inline 확인 가능.

### 본 호출 준수 사항 점검

- ✅ 코드 수정 0건 (Edit/Write to source 금지)
- ✅ 일정·공수 추정 0건
- ✅ decision_ledger 수정 0건
- ✅ 측정·grep·read만 수행

---

DEV_WRITE_DONE: reports/2026-05-02_dashboard-upgrade-v2-legend-nexus/dev_g0_rev1.md

[ROLE:dev]
# self-scores
rt_cov: 1.00
gt_pas: 1.00
hc_rt: 0.00
spc_drf: 0
