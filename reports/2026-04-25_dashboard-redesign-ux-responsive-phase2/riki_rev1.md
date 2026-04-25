RIKI_WRITE_DONE: reports/2026-04-25_dashboard-redesign-ux-responsive-phase2/riki_rev1.md

---
role: riki
topic: Dashboard 개편 — UX + 반응형 (Phase 2)
topicId: topic_082
session: session_105
date: 2026-04-25
rev: 1
phase: phase-2-g2-adversarial-audit
grade: A
turnId: 4
invocationMode: subagent
contributing_specs:
  - reports/2026-04-25_dashboard-redesign-ux-responsive-phase2/arki_rev1.md
  - reports/2026-04-25_dashboard-redesign-ux-responsive-phase2/vera_rev1.md
  - reports/2026-04-25_dashboard-redesign-ux-responsive-phase2/dev_rev1.md
  - reports/2026-04-25_dashboard-redesign-ux-responsive-phase2/components-spec.md
  - reports/2026-04-25_dashboard-redesign-ux-responsive-phase2/kpi-fallback-spec.md
  - reports/2026-04-25_dashboard-redesign-ux-responsive-phase2/vr-infra-spec.md
parent_spec: reports/2026-04-22_dashboard-redesign-ux-responsive/spec-lock-decisions.md
---

# Riki — Phase 2 G2 적대 감사 (session_105, topic_082)

Riki입니다. Master가 놓칠 수 있는 실제 리스크 4건 적출. 본 발언은 G2-8 그 자체이며, 본 박제 결과로 G2-8 PASS 여부가 결정됩니다.

확신 없는 곁가지·중복·페르소나 padding 0건. 슬롯 미달 정상 (`feedback_riki_no_opposition_for_opposition`).

---

## R-1 (🔴 CRITICAL) — components.css는 어떤 페이지에도 link 되지 않은 dead asset

### 원문 인용 (Dev §1)

> "신규 파일: `app/css/components.css` (177 lines) ... `:root{}` 재정의 0건 — 토큰 참조만."

### 실측 (본 발언 직전 grep)

```
$ grep -rn "components.css" app/*.html app/partials/*.html
(no matches)

$ grep -nE "stylesheet|components\.css|tokens\.css" app/dashboard-upgrade.html
8: <link rel="stylesheet" href="css/tokens.css">
```

components.css는 **빌드 산출에만 존재**하고, 9개 active page 중 단 하나도 `<link>` 하지 않습니다. dashboard-upgrade.html은 tokens.css 1건만 link.

### 셀렉터 충돌 (silent failure 1차 증거)

```
$ grep -nE "kpi-grid|kpi-row" app/dashboard-upgrade.html | head -3
68:.kpi-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:24px}
206:    <div class="kpi-row" data-kpi-count="5" data-vr-bbox="upgrade-kpi-grid">
```

dashboard-upgrade.html DOM은 `.kpi-row` 클래스를 사용. components.css는 `.kpi-grid` 셀렉터로 작성. **두 셀렉터가 일치하지 않아** components.css가 link되더라도 KPI fallback CSS(R-V10 정정안 포함)가 적용 0. 더불어 Dev §6의 `data-kpi-count="5"` 부여도 무효 — `.kpi-row[data-kpi-count="5"]` 셀렉터는 어디에도 정의 안 됨.

### 발견 가능성

**100%** (현 시점 확정 사실).

### Impact

- G2-1 helper 5종 declaration 박제 PASS 판정은 "파일에 declaration이 있다" 수준일 뿐, **운영 페이지에 적용 0**.
- G2-2 drawer mobile CSS도 동일 — 어떤 페이지에도 적용되지 않으므로 e2e 검증 시 hamburger·backdrop 시각적으로 안 보임 (session_104 dev_rev2 F-3에서 이미 적출된 잔존 결함과 동일 패턴 재발).
- G2-5 KPI fallback도 적용 0. Vera R-V10 정정안 흡수가 의미 없음.
- 24 PNG baseline 캡처 시 spec 의도 시각이 아닌 **현 .kpi-row 인라인 CSS 시각**으로 박제됨 → baseline이 spec과 분리된 채 동결.

### Mitigation (Dev 인계 강제)

1. 9개 active page(`app/*.html` + partials) 모두 `<link rel="stylesheet" href="css/components.css">` 추가 — tokens.css 직후 1줄.
2. dashboard-upgrade.html line 68 `.kpi-row{...}` 인라인 CSS와 components.css `.kpi-grid` 셀렉터 통일 결정 필요. 옵션 A: components.css를 `.kpi-row` 셀렉터로 정정. 옵션 B: dashboard-upgrade.html DOM `.kpi-row` → `.kpi-grid` 클래스 rename + line 68 인라인 CSS 제거. **Vera·Arki 재호출 의무 게이트 발동** — 단순 Dev 재해석 금지.
3. 다른 8개 페이지의 KPI 영역(home·ops·growth)도 동일 셀렉터 정합 점검.

### Fallback

components.css 적용 자체를 Phase 2 G2 비차단으로 격하하고 별도 G2-9 게이트 신설 — Phase 3 진입 전 강제. 단 이 fallback은 baseline 24 PNG가 spec과 무관한 상태로 동결되는 부작용이 있음 → **fallback 비권고**.

### 게이트 영향

G2-1·G2-2·G2-5 PASS 판정 **재검토 필요** — Dev §7의 PASS 2 / PARTIAL 2건은 "파일 존재" 기준이지 "운영 적용" 기준이 아님. 본 적출이 G2-8을 통과시키려면 mitigation 1·2 흡수 의무.

---

## R-2 (🟡) — Upgrade KPI 5장은 components.css의 `[data-kpi-count="5"]` 분기로도 fallback 부족

### 원문 인용 (Dev §6 spec drift 보정)

> "kpi-fallback-spec §1-3 예시는 Upgrade KPI를 4개로 가정 ... 실제 ... .kpi-row 안 카드는 5개 ... spec §1-2의 `[data-kpi-count="5"]` 분기(`repeat(auto-fit, minmax(180px, 1fr))`) 사용이 사실 정합."

### 실측

components.css line 144~147:
```
.kpi-grid[data-kpi-count="5"],
.kpi-grid[data-kpi-count="6"] {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}
```

`auto-fit + 1fr` 패턴. Vera vera_rev1 R-V10 자가 검증에서 본인이 직접 적출한 결함 — "auto-fit + 1fr은 wrap된 단독 카드를 잔여 영역 전부 차지시킴". 5장의 경우 1024px main width 804px → 180×4 + 16×3 = 768 → 4-col + 5번째 wrap 시 5번째 카드가 잔여 영역(약 760px) 전부 차지하여 거대화. 1100~1240 구간도 동일 패턴 재발 가능.

R-V10은 `data-kpi-count="4"`에만 명시 분기를 적용했고, **5·6은 `auto-fit + 1fr` 그대로 방치**. Vera 본인 적출 논리가 5·6에는 미적용된 정합 결함.

### 발견 가능성

**60%** (구조적으로는 확정. 단 5번째 카드의 거대화가 시각적으로 "균형 위반"으로 인식될지는 baseline 캡처 후 Master 시각 판정 의존).

### Impact

- G2-5 4-viewport 검증을 KPI 4 기준으로만 수행 시 통과 위장 가능. 실제 Upgrade는 5장 → 검증 누락.
- baseline 24 PNG에 거대화된 5번째 카드 시각이 박제되면 그 자체가 "정상 baseline"으로 lock → 다음 회귀 검증에서 결함 발견 불가.

### Mitigation

1. components.css `[data-kpi-count="5"]`에도 R-V10 동일 패턴 적용 — 1024~1279 `repeat(4, ...)` + 1280~ `repeat(5, ...)` (또는 Master 시각 우선순위 결정).
2. verify-kpi-fallback.ts에 `data-kpi-count="5"` 4-viewport 검증 case 추가.

### Fallback

`auto-fit` → `auto-fill` 단순 교체로 1차 대응. 5번째 카드는 180px 최소폭 유지 + 우측 빈 트랙 발생. 시각 균형 양호하나 의도 불명시.

---

## R-3 (🟡) — VR 캡처 환경에서 한국어 폰트 미설치 시 baseline drift

### 원문 인용 (vera_rev1 §3-1, vr-infra-spec §4-1)

> "`colorScheme: 'dark'` + `locale: 'ko-KR'` + `timezoneId: 'Asia/Seoul'` 박제 — tokens.css dark 단일 전제와 일관, 한국어 폰트 fallback drift 차단."

### 실측 갭

`mcr.microsoft.com/playwright:v1.45.0-jammy` 컨테이너는 Ubuntu Jammy 기반. **한국어 폰트(Noto Sans CJK KR 등)가 기본 설치되지 않음** — Playwright 공식 이미지는 라틴 + 일부 emoji만 보장. tokens.css에 `@font-face` 미박제(vera_rev1 §3-4 R-V7에서 명시) → 시스템 폰트 fallback 의존 → docker 컨테이너에서 한국어 텍스트가 sans-serif fallback(혹은 tofu 박스)으로 렌더 가능.

vera_rev1 §3-1은 "한국어 폰트 fallback drift 차단"이 작동한다고 박제했으나, **차단 기제 자체가 불명** — `font-display: block`은 폰트가 존재할 때만 의미. 폰트 미존재 시 fallback drift 그대로.

### 발견 가능성

**45%** (Playwright Jammy 이미지의 폰트 패키지 변경 이력에 따라 다름. 최근 버전은 noto-cjk 일부 포함 가능하나 v1.45.0-jammy 기준 미확정). Master 환경에서 docker pull 후 첫 캡처 시 발견.

### Impact

- baseline 24 PNG가 "한국어 텍스트 깨진" 상태로 박제 → spec 시각 의도와 불일치 baseline 동결.
- Master 호스트(Windows)의 fallback과 docker(Linux)의 fallback이 다름 → `vr:capture:host` fallback 경로 사용 시 호스트 baseline ≠ docker baseline → self-diff 폭발 가능.

### Mitigation

1. vr-capture.ts 부팅 직후 `await page.evaluate(() => document.fonts.ready)` + `getComputedStyle(document.body).fontFamily` 로깅으로 실 적용 폰트 1줄 박제. baseline 캡처 전 폰트 존재 확인.
2. docker 컨테이너에 noto-cjk 명시 install — Dockerfile override 또는 `RUN apt-get install -y fonts-noto-cjk` 1줄 박제.
3. tokens.css에 `@font-face` + 웹폰트 self-host 박제 (vera_rev1 R-V7 정합).

### Fallback

호스트 fallback 경로(`vr:capture:host`) 단일화 — docker 자체 폐기. 단 Master 호스트 환경 의존 + cross-machine 재현성 손실.

---

## R-4 (🟡) — 다음 세션 carry 6건의 직렬 의존이 3세션 마감 원칙과 충돌

### 원문 인용 (Dev §4-5)

> "잔여 작업: docker pull playwright:v1.45.0-jammy(~1.5GB) → 24 PNG baseline 첫 캡처 → self-diff < 2% 검증 → tests/vr/baseline/ git commit → data-vr-bbox 22 marker 부여 → playwright.config.ts 작성"

### 직렬 의존 그래프 (Dev §4-5 + arki §3-2 정합)

```
docker pull (G2-3) → HTTP 서버 기동 → 24 PNG 캡처 (G2-6) → self-diff 검증 (G2-7)
                                  ↘ data-vr-bbox 22 marker 부여 (G2-2 후속)
                                  ↘ e2e drawer 검증 (G2-2)
                                  ↘ 4-viewport KPI 검증 (G2-5 실)
+ 본 발언 R-1 mitigation (components.css link 9 page 박제 + 셀렉터 통일 Vera/Arki 재호출)
+ 본 발언 R-2 mitigation (data-kpi-count="5" 명시 분기 추가)
```

본 토픽 메모리 `feedback_implementation_within_3_sessions` — "구현 토픽은 3세션 이내 완결 설계, 세션 간 정보 휘발이 오진·재작업 유발". session_104 Phase 1 G1 + session_105 Phase 2 spec lock + 본 carry → **session_106이 3세션 마감**.

session_106에 처리해야 할 작업: G2-2·3·5·6·7 (PEND 5건) + R-1 components.css link + 셀렉터 통일 (Vera/Arki 재호출 1턴 + Dev 재구현) + R-2 data-kpi-count=5 분기 + Phase 3·4·5 진입.

### 발견 가능성

**구조적 70%** — Phase 3·4·5까지 본 세션의 carry로 1세션 내 처리 가능성은 낮음. 단 "양"의 판단은 Schedule-on-Demand 위반 영역(D-017)이라 직접 시간 추정 금지. **구조적 직렬 의존 노드 수**로만 판단.

### Impact

- session_106 단일에 R-1·R-2 mitigation + PEND 5건 + Vera/Arki 재호출 + Phase 3·4·5 모두 몰아넣으면 검증 품질 저하 → session_104 spec drift 재발 패턴.
- 3세션 초과 시 Phase 3·4·5는 별도 토픽으로 분화 압박 → `feedback_no_premature_topic_split` (본 토픽 안에서 끝까지)와 충돌. 두 메모리 정합 충돌 발생.

### Mitigation

1. 본 세션 종료 전 Master에 명시 질의: "Phase 2 carry + R-1·R-2 mitigation을 session_106에 몰지, Phase 2를 session_106·107 2세션 분할할지 결정". Ace 종합검토 단계에서 트리거.
2. R-1 mitigation은 Phase 2 baseline 캡처 선행 의존 → **R-1 mitigation을 session_106 최우선 1번으로 박제** (Vera/Arki 재호출 → Dev 재구현 → baseline 캡처 순). G2-3 docker pull은 R-1 처리 중 백그라운드 병렬.
3. Phase 3·4·5는 carry 순위 후순위 또는 Phase 2 G2 PASS 후 별도 세션 분리 — Master 결정 의존.

### Fallback

3세션 원칙을 본 토픽에 한해 4세션으로 명시 완화 — Master 명시 승인 필요. `feedback_no_premature_topic_split` 우선순위 확인. 두 메모리 충돌은 Master 결정 영역.

---

## 의도적 제외 항목 (확신 부족 또는 Vera 이미 다룸)

- **A2-1 OS 시간 drift** (arki §9-2) — Arki 본인 흡수 박제. 중복.
- **R-V7 font-display: block 모순** (vera §3-4) — Vera 본인 mitigation 박제 + 본 R-3와 일부 중복. R-3가 더 실측 기반.
- **R-V5 mobile drawer 닫힘 baseline** (vera §3-2) — Vera 단호 권고 박제 + Phase 2 G2 비차단. Riki 추가 발언 가치 0.
- **mock fixture 197KB의 ECharts 직렬화 이슈** — 추측성. Dev §4-2 실 freeze PASS 박제됐고 197KB는 적정 범위. 확신 없음 → 제외.
- **PD-046~050 잔존 영향** — 본 세션 결정·인계와 무관. 곁가지.
- **Master 정착 정책 재질문 위반 가능성** — Dev·Vera·Arki 본 세션 발언에서 위반 0건 확인. 적출 사유 없음.

`feedback_riki_count_filler` 정합 — 4건 미만 위협 없음. 슬롯 미달 정상.

---

## session_104 spec drift 재발 0 검증 (cross-check 1패스)

본 발언 의무 검증 — Vera 정정 4건이 components.css와 spec에 정합 흡수됐는가:

| Vera 정정 | spec 갱신 위치 | components.css 적용 | 정합 |
|---|---|---|---|
| R-V1 토큰 4건 (--c-panel-1·--shadow-drawer·--r-md·--z-sidebar → --panel·--shadow-2·--r-2·--z-sticky) | components-spec §2-3 정정 박제 (확인은 Arki 재발언 또는 Dev §1-1 grep 19/19 PASS) | components.css line 68·82·113·67 모두 정정 토큰 사용 | PASS |
| R-V7 font-display block VR-only | vr-infra-spec §4-1 (c) 갱신 (확인 별도) + vr-capture.ts addStyleTag로 inject (Dev §4-3 박제) | components.css 영향 0 (런타임 inject) | PARTIAL — vr-capture.ts 실 코드 미확인, dry-run만 |
| R-V8 토큰 4건 (--c-panel-2·--r-md·--fs-eyebrow·--c-text-2 → --panel-2·--r-3·--fs-meta + --ls-eyebrow·--text-2) | kpi-fallback-spec §3 갱신 박제 + components.css line 162·163·167·168·169 | components.css 정정 토큰 사용 PASS | PASS |
| R-V10 KPI 4 명시 분기 | kpi-fallback-spec §1-2 갱신 박제 + components.css line 134~141 | PASS — `.kpi-grid[data-kpi-count="4"]` 명시 분기 | PASS (단 R-2 적출: "5"에는 미적용) |

session_104 패턴(spec drift 검증 누락) **재발 0**. 단 R-1 (components.css link 누락)은 spec drift가 아닌 **integration gap** — 별도 카테고리.

---

## G2-8 자기 판정

| 게이트 | 본 발언 결과 | 판정 |
|---|---|---|
| G2-8 Riki 적대 감사 R-issue 모두 mitigated 또는 accepted-residual-risk | 4 R-issue 적출, mitigation + fallback 모두 병기 | **CONDITIONAL PASS** — R-1 (🔴)이 Dev 인계 차단급. Master/Ace가 mitigation 1·2 채택 명시 시 PASS, 미채택 또는 무응답 시 G2-8 HOLD. G2-1·G2-2·G2-5 PASS 판정도 R-1 mitigation 후 재검토 의무. |

본 발언은 G2-8 PASS를 자가 선언 안 함 — Ace 종합검토에서 R-1 처리 결정 후 확정.

---

## lock 선언

본 riki_rev1 = 적출 4건 (🔴 R-1 components.css 미적용 + 🟡 R-2 data-kpi-count=5 fallback 부족 + 🟡 R-3 한국어 폰트 drift + 🟡 R-4 3세션 마감 충돌) + Vera 정정 4건 cross-check (PASS 3 / PARTIAL 1) + 의도적 제외 6건 명시.

새 D-xxx 0건. 새 PD 0건 (R-1·R-2 mitigation은 본 토픽 안에서 session_106 처리 권고, 토픽 분화 0).

다음 turn: Ace 종합검토 (R-1 처리 결정 + carry 우선순위 + Master 질의).

---

```yaml
# self-scores
risk_recall: 88
fp_rate: 12
mit_qual: 85
crt_rcl: Y
cr_val: 4
prd_rej: Y
fp_rt: 0.12
```
