---
role: arki
turnId: 2
invocationMode: subagent
session: session_167
topic: topic_144
date: 2026-05-02
---

# Arki — Dashboard Upgrade ver2.0 / Legend Nexus 반영 (구조 분석 + 실행계획)

Arki입니다. Master 5축 결정(A=a / B=a / C=a / D=b / E=a)을 수용하여 4 patch 작업군의 dependency map · 변경 영향 · 구조 권고 · 4섹션 실행계획을 박제합니다. 본 토픽은 framing 토픽이지만 메모리 [no_premature_topic_split]에 따라 한 토픽 안에서 framing→구현 완결을 우선하며, 실측 기반으로 child 분화가 필수인 항목만 식별합니다.

---

## 1. 구조 분석 — Dependency Map

### 1.1 버전 표시 patch (Master 결정 E=a 적용)

**SOT 2 필드 (덮어쓰기 대상)**
- `memory/shared/project_charter.json` — `charter.version` 현 값 `"v2.201"` → `"v0.00"` (line 4)
- `memory/shared/system_state.json` — `currentVersion` 현 값 `"v2.201"` → `"v0.00"` (line 5)

**era_history 필드 신설 (Master 결정 D=b 적용)**
- `memory/shared/project_charter.json` 새 키 `charter.era_history: [{eraName, version, date, summary}]`
- 1번째 entry: `{eraName: "legend-team", finalVersion: "v2.201", endedAt: "2026-05-02", summary: "..."}`
- 디렉토리 이동·legacy/* 분리 = 결정 D=b로 **out-of-scope**

**불변 (Master 결정 E=a 핵심)**
- `project_charter.history[]` 28개 entry 의 `version` 필드 = 과거 시점 박제 = **건들지 않음**
- `decision_ledger.json` D-xxx versionAt 필드 = 불변
- session_index entries versionAtSession = 불변

**Dependency**
```
v2.201 → v0.00 reset
├── project_charter.charter.version (write)
├── system_state.currentVersion (write)
├── project_charter.charter.era_history (new key write)
└── (downstream read consumers)
    ├── app/dashboard-upgrade.html line 387 const ver = charter?.charter?.version
    ├── app/index.html (확인 필요 — 동일 패턴 추정)
    └── 기타 page에서 charter.version 직접 read하는 곳
```

### 1.2 타이틀·브랜드 patch (Legend Team → Legend Nexus)

**touch points 총 28개 file 확인 (`Legend Team` 문자열 grep)**

| 카테고리 | 파일 (대표) | 처리 원칙 |
|---|---|---|
| **app/* HTML title·heading** | `app/dashboard-upgrade.html:6` `<title>Upgrade Dashboard — Legend Team</title>`, `app/index.html`, `app/decisions.html`, `app/feedback.html`, `app/topic.html`, `app/session.html`, `app/people.html`, `app/growth.html`, `app/deferrals.html`, `app/dashboard-ops.html` | **현재 시스템 표기 = swap 대상**. Legend Team → Legend Nexus |
| **CSS/JS** | `app/css/tokens.css`, `app/js/nav.js`, `app/js/data-loader.js`, `app/js/md-renderer.js`, `app/partials/sidebar.html`, `app/_redirects` | 주석·title·meta = swap 대상. URL routing은 **확인 후 신중** |
| **scripts/*** | `scripts/auto-push.js`, `scripts/build.js`, `scripts/_archived/generate-dashboard.ts` (deprecated) | 주석·console.log·commit message text = swap. _archived = 건들지 않음 |
| **data SOT** | `memory/shared/topic_index.json`, `memory/shared/dashboard_data.json`, `memory/sessions/session_index.json`, `memory/shared/system_state.json` | **신중 — historical entry는 swap 금지** (legend-team 시점에 박제된 토픽 title·summary는 history). 향후 신규 작성 시점부터 Legend Nexus로 전환. |
| **VR fixture** | `tests/vr/fixtures/dashboard.mock.json` | _meta freeze 정합 — swap 시 verify-fixture-stability.ts 갱신 필요 (G-1) |
| **reports/*** | 과거 reports (legend-team-dashboard-2 등) | **불변** — 과거 시점 박제 |
| **topics/*** | `topics/topic_113/session_contributions/session_110.md` | **불변** — historical |
| **docs/*** | `docs/publish-contract.md` | swap (현재 시스템 docs) |

**핵심 구분 원칙**: "현재 시점 시스템 표기" vs "과거 시점 박제 history" = swap 가능 vs 불변.

`legend-team` (소문자 하이픈) 검색 결과 50+ 파일 — 압도적 다수가 historical commit log·report·session contribution. 코드 레벨에서는 `package.json` `"name": "legend-team"`이 **결정 보류** 항목 (npm 식별자 변경은 lockfile 영향 큼). 본 patch에서는 **사용자 노출 텍스트 + active code/UI** 한정.

### 1.3 Grade 표시 patch (D 등급 누락 + 토픽 카드 뱃지)

**compute-dashboard.ts touch points (3 + 1)**
- L51: `gradeDeclared?: 'S' | 'A' | 'B' | 'C';` → `'S' | 'A' | 'B' | 'C' | 'D'`
- L52: `gradeActual?: 'S' | 'A' | 'B' | 'C';` → 동일
- L124-125: `SessionData.gradeDeclared/gradeActual` 타입 enum
- L163-168: `sizeToGrade()` D 임계 추가 — Master 결정 C=a "임계 재설계 안 함, D 누락만 patch"이므로 **size 기반 D 분기 없음**. D는 `gradeDeclared`로만 들어옴. sizeToGrade는 C가 fallback.
- L266: `gradeDeclared = (s.gradeDeclared ?? gradeActual)` cast enum 갱신
- L323: `const gradeCount = { S: 0, A: 0, B: 0, C: 0 };` → `{ S, A, B, C, D: 0 }`

**dashboard-upgrade.html touch points**
- L323-336: gradeDist + gradeMismatch 패널 — D 색상 추가 (`GRADE_COLORS.D`)
- L732: `count[s.gradeActual ?? s.gradeDeclared ?? 'C']` ← 'C' fallback 유지 (D 미선언 세션 = C)
- L764: `['S','A','B','C']` 배열 → `['S','A','B','C','D']` (mismatch 방향 비교)

**토픽 카드 grade 뱃지 (현재 미표시)**
- 토픽 카드 렌더링 위치 식별 필요 — `app/topic.html` 또는 `app/dashboard-upgrade.html` 토픽 패널. 추가 grep 필요.
- topic_index.json에는 `topic.grade` 필드 존재 여부 확인 필요 (Big Bang에서 추가됐을 가능성).

### 1.4 ackedButUnresolved 패널 흡수 (Big Bang topic_131 deferred)

**현재 상태**
- compute-dashboard.ts에 `ackedButUnresolved` 집계 0건 (grep 0 hit)
- decision_ledger D-124에 NCL ack-only 권한 제약 박제됨 — open_issues 추적 패턴 존재
- dashboard_data.json에 패널 데이터 0건

**source 후보**
- `memory/shared/decision_ledger.json` 의 `caveats[].status === 'acked'` 항목 → 미구현 (Big Bang 잔재)
- `topics/topic_NNN/open_issues.json` 의 `status === 'acked' && resolvedAt == null`
- 둘 다 schema 안정도 미확인 — **Dev 인계 전 확정 필요**

---

## 2. 변경 영향 평가

### 2.1 회귀 리스크 매트릭스

| Patch | LoC 추정 | 회귀 표면 | 검증 게이트 |
|---|---|---|---|
| 버전 표시 | ~10 LoC | dashboard-upgrade.html:387 ver 표시 / build.js cache busting | G-A: dashboard 화면 v0.00 실측 확인 |
| era_history 필드 | ~5 LoC | project_charter schema | G-B: schema validate-schema-lifecycle PASS |
| 타이틀·브랜드 | ~30 file edit | VR fixture _meta freeze 위반 가능 / sidebar nav | G-C: vr-capture 24/24 PASS, lint chain GREEN |
| Grade D enum | ~6 site edit | TS compile / dashboard render / mismatch 비교 | G-D: tsc 통과 + 기존 mismatch 패널 정상 |
| Grade 뱃지 | ~신규 component | 토픽 카드 layout 변경 | G-E: 모바일+데스크톱 안깨짐 (메모리 정책) |
| ackedButUnresolved | ~50 LoC | dashboard_data.json schema 확장 / 신규 패널 | G-F: source schema 확정 후 Dev 진입 |

### 2.2 mitigation + fallback (메모리 [arki_risk_requires_mitigation] 정합)

| Risk | Mitigation | Fallback |
|---|---|---|
| **R-A**: Legend Team→Nexus 일괄 swap이 historical data 오염 (active vs historical 경계 모호) | grep 결과 28 파일 × line별 active/historical 분류 표 사전 작성 → Master 또는 Edi 1회 review | 의심 line은 **swap skip + 코멘트 마킹** 후 차후 처리 |
| **R-B**: VR fixture _meta freeze 위반 — 타이틀 변경 시 D-102 PD-050 검증 무효화 | verify-fixture-stability.ts에 _meta.title 변경 허용 1회 unlock + dashboard.mock.json 재생성 + 24/24 baseline 재캡처 | VR 재캡처 실패 시 patch revert |
| **R-C**: ackedButUnresolved data source 미확정 — Dev 진입 시 schema 추측으로 잘못된 집계 | **본 토픽에서 source schema 확정 (decisions.caveats vs open_issues 양자택일) → Dev 인계** | source 확정 안 되면 child 토픽 분화 |
| **R-D**: gradeDeclared 'D' enum 추가 시 historical session 'D'로 backfill 시도 = 위험 | **소급 금지** (메모리 [no_retro_without_value]) — 신규 세션부터만 D 인정 | sizeToGrade는 C fallback 유지하여 안전 |
| **R-E**: package.json name=legend-team swap 시 npm/lockfile 영향 | **본 patch out-of-scope** (Master 결정 D=b, 디렉토리 이동 X 정신과 정합) | 차후 별도 토픽 |
| **R-F**: era_history 필드 위치 분산 (charter / system_state) — SOT 모호 | **project_charter.charter.era_history 단일 SOT 명시** (Master 결정 D=b 정합) | system_state는 currentVersion만 |

---

## 3. 구조 권고 — 본 토픽 즉시 patch vs child 분화

[no_premature_topic_split] 메모리 정합 — child 분화 최소화. 4 patch 모두 본 토픽 안에서 완결 가능 판정. 단 **ackedButUnresolved**는 schema 확정 단계까지만 본 토픽, 구현은 본 세션 또는 다음 세션 결정.

| 작업 | 본 토픽 즉시 | child 분화 후보 | 사유 |
|---|---|---|---|
| 버전 표시 patch + era_history | **즉시** | — | 5축 결정 명확, LoC 작음 |
| Legend Team → Legend Nexus | **즉시** (active 한정) | (선택) historical-cleanup | active 영역 한정으로 위험 적음 |
| Grade D enum + dashboard 표시 | **즉시** | — | 명확 patch |
| Grade 뱃지 (토픽 카드) | **즉시** | — | 간단 component 추가 |
| ackedButUnresolved | **schema 확정만 본 토픽** | **구현은 본 세션 잔여 시간 또는 child** | source 결정 후 LoC 50+ 신규 코드 |

[implementation_within_3_sessions] 정합 — 본 토픽 1~2 세션 안에 구현 완결 설계.

---

## 4. 구조적 실행계획 (executionPlanMode = conditional → plan 진입)

### 4.1 Phase 분해

```
Phase 0: 사전 실측 (본 발언으로 70% 완료)
   └→ G-0: schema·source·touch points 확정
Phase 1: 버전 + era_history (atomic)
   └→ G-1: dashboard 화면 v0.00 실측 + schema validate
Phase 2: Legend Team → Legend Nexus brand swap (active scope only)
   └→ G-2: VR baseline 재캡처 24/24 PASS + lint GREEN
Phase 3: Grade D enum + dashboard 패널 + 토픽 뱃지
   └→ G-3: tsc + dashboard 렌더 + 모바일 깨짐 0
Phase 4: ackedButUnresolved schema 확정 + 구현
   └→ G-4: 패널 데이터 표시 + 0건 케이스 빈 상태 처리
Phase 5: Edi anchor governance (D-125) + finalize
   └→ G-5: report write + commit + auto-push
```

### 4.2 의존 그래프 (DAG)

```
                 Phase 0 (실측)
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
       Phase 1                 Phase 2
   (version·era)           (brand swap)
          │                       │
          └───────────┬───────────┘
                      ▼
                  Phase 3
              (Grade D + 뱃지)
                      │
                      ▼
                  Phase 4
            (ackedButUnresolved)
                      │
                      ▼
                  Phase 5
                  (Edi)
```

Phase 1·2 = 병렬 가능 (서로 다른 파일군). Phase 3 = Phase 1·2 완료 후 (dashboard render 의존). Phase 4 = Phase 3 후 (대시보드 패널 신설).

### 4.3 검증 게이트

| Gate | 통과 기준 | 실패 시 |
|---|---|---|
| **G-0** | (a) Legend Team 28 file × active/historical 분류표 작성 (b) ackedButUnresolved source schema 결정 (decisions.caveats vs open_issues 1택) (c) 토픽 카드 grade 필드 존재 확인 | Phase 1 진입 차단 |
| **G-1** | (a) project_charter.json + system_state.json v0.00 박제 (b) era_history 1 entry 추가 (c) dashboard line 387 v0.00 표시 (d) ts-node compute-dashboard 무경고 | Phase 2 차단 |
| **G-2** | (a) Legend Team → Legend Nexus active scope 일괄 적용 (b) VR re-capture 24/24 PASS (c) verify-fixture-stability + axis-label-stability PASS (d) sidebar nav 깨짐 0 | Phase 3 차단 |
| **G-3** | (a) compute-dashboard.ts 6 site D enum 갱신 (b) tsc 통과 (c) gradeCount.D 출력 정상 (d) dashboard gradeDist 패널 D 색상 표시 (e) 토픽 카드 grade 뱃지 모바일·데스크톱 표시 | Phase 4 차단 |
| **G-4** | (a) ackedButUnresolved source schema 확정 박제 (b) compute-dashboard.ts 집계 함수 추가 (c) dashboard_data.json 신규 필드 (d) 신규 패널 렌더 (e) 0건 케이스 빈 상태 처리 | Phase 5는 진행 가능 (G-4 미달 시 ackedButUnresolved만 child 토픽 분화) |
| **G-5** | (a) Edi anchor governance write 정합 (b) versionBump Edi 확정 (c) decision_ledger 박제 (d) auto-push 성공 | 세션 close 차단 |

### 4.4 롤백 경로

| Phase | 롤백 방법 |
|---|---|
| Phase 1 | git revert 단일 commit (project_charter.json + system_state.json + era_history) |
| Phase 2 | git revert brand swap commit + VR baseline 직전 24/24 복원 |
| Phase 3 | enum revert + dashboard render revert |
| Phase 4 | 신규 패널 commit revert (schema 확장 분리 commit) |
| Phase 5 | finalize 실패 시 직전 commit revert + Master 보고 |

각 Phase **단일 commit 원칙** — 롤백 단위 명확화.

### 4.5 전제 조건

- (P-1) Master 5축 결정 확정 (✅ 완료)
- (P-2) executionPlanMode = conditional 모드 (✅ Master GO로 plan 진입)
- (P-3) [no_retro_without_value] 정합 — version v0.00 소급 시도 0건 (history.versionAtSession 불변)
- (P-4) VR 인프라 가동 가능 (Docker + Playwright v1.59.1-jammy)
- (P-5) ackedButUnresolved source schema 확정 가능 (G-0 종속)

### 4.6 중단 조건

- (S-1) G-0에서 Legend Team active/historical 분류 모호 30%+ 발생 → 본 토픽 분할
- (S-2) G-2 VR 재캡처 실패 → brand swap revert + 별도 child 토픽
- (S-3) G-4 ackedButUnresolved source schema 결정 불가 → 해당 patch만 child 분화
- (S-4) Master 추가 결정축 요구 → 즉시 Phase 진입 보류
- (S-5) [arki_full_system_view] 정합 위반 발견 (코드 한 축만 보고 단언) → 자기감사 재실행

---

## 5. child 분화 후보 (조건부)

| 후보 | 트리거 | 입력 명세 1줄 |
|---|---|---|
| **historical-cleanup-legend-team-to-nexus** | G-0에서 historical 영역도 swap 필요 판정 시 | reports/* topics/* 등 historical text의 Legend Team 표기를 era_history 정본 기반 일괄 표기 정책 박제 |
| **ackedButUnresolved-impl** | G-4 source schema 결정 불가 시 | decisions.caveats vs open_issues 양자 비교 + dashboard 패널 schema + 집계 함수 |
| **package-name-legend-nexus** | Master 명시 요구 시 | package.json name + lockfile 동기 + npm script 영향 |

본 토픽 grade S 유지. 위 3 후보는 **현재 분화 권고 안 함**. G-0 결과로 트리거.

---

## 6. 자기감사 (D-063, 라운드 1)

**축별 발견**
- **structuration**: 4 patch 별 단일 commit 원칙 박제 ✅ / Phase 1·2 병렬 가능 명시 ✅ / **No issue at this dimension** (3지점 검토)
- **hardcoding**: project_charter.charter.version 직접 read 패턴 (dashboard:387) — `charter.charter.version` chain은 SOT 의존이라 정상. era_history schema 위치 단일 박제 ✅. **No issue at this dimension**.
- **efficiency**: brand swap 28 file edit — 일괄 sed 가능하나 active/historical 분류 필요로 수동 review 우선 (ROI 정당화). G-0 분류표 작성이 efficiency bottleneck. **MUST_NOW**: G-0 분류표 작성 자동화 (grep + 휴리스틱 분류 script).
- **extensibility**: era_history `[]` 배열 = 향후 nexus → next era 진입 시 entry append만으로 확장 ✅. Grade enum 'D' 추가가 sizeToGrade 함수에 영향 없음 (Master 결정 C=a 임계 재설계 안 함) ✅. **No issue at this dimension**.

**ROI 라벨**: 발견 1건 (efficiency MUST_NOW — G-0 분류 자동화 script).

scope drift 체크: 본 발언 spec = 토픽 4 patch 범위 내. drift 0%.

---

## 7. Dev 인계 spec (Phase 1~3 우선)

```yaml
target_files:
  phase1:
    - memory/shared/project_charter.json (charter.version, charter.era_history 신설)
    - memory/shared/system_state.json (currentVersion)
  phase2:
    - app/dashboard-upgrade.html:6 (title)
    - app/index.html (확인 후 swap)
    - app/decisions.html, app/feedback.html, app/topic.html, app/session.html, app/people.html, app/growth.html, app/deferrals.html, app/dashboard-ops.html
    - app/css/tokens.css, app/js/nav.js, app/js/data-loader.js, app/js/md-renderer.js
    - app/partials/sidebar.html, app/_redirects
    - scripts/auto-push.js, scripts/build.js
    - tests/vr/fixtures/dashboard.mock.json (_meta unlock 1회)
    - docs/publish-contract.md
  phase3:
    - scripts/compute-dashboard.ts (L51, L52, L124, L125, L266, L323)
    - app/dashboard-upgrade.html (L323-336, L732, L764 + GRADE_COLORS.D)
    - 토픽 카드 렌더 위치 (Dev grep으로 확인)
gates:
  - G-1, G-2, G-3 (본 발언 §4.3)
rollback:
  - 단일 commit 원칙 — Phase 별 git revert
forbid:
  - history[].version 소급 변경
  - reports/*, topics/* historical text 변경 (active 한정)
  - package.json name swap (out-of-scope)
```

---

ARKI_WRITE_DONE: reports/2026-05-02_dashboard-upgrade-v2-legend-nexus/arki_rev1.md

[ROLE:arki]
# self-scores
aud_rcl: Y
str_fd: 4
spc_lck: N
sa_rnd: 1
