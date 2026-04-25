---
role: riki
topic: Dashboard 개편 — 인터페이스 UX + 반응형 프레임 (전면 IA 개편)
topicId: topic_082
session: session_104
date: 2026-04-25
rev: 1
phase: risk-audit
grade: S
turnId: 3
invocationMode: subagent
status: in-progress
---

RIKI_WRITE_DONE: reports/2026-04-22_dashboard-redesign-ux-responsive/riki_rev1.md

# Riki 리스크 감사 — topic_082 Dashboard 전면 개편

Riki입니다. Arki Option A + Vera 단호한 spec(220px sidebar / 4 breakpoint / tokens.css Phase 1 G1 / 30 baseline)을 원문 정독 후, **Master가 모를 수 있는 실제 리스크만** 추렸습니다. Fin이 다룰 비용 항목·Ace 명시 전제·"~할 수도 있다" 추측은 §6 의도적 제외에 명시했습니다.

확신 있는 리스크 5건. 등급은 본 토픽 scope 내 구조적 파손 가능성 기준.

---

## 🔴 R-01. tokens.css Phase 1 G1 lint가 미touch 페이지의 누적 인라인 정의를 자살시킨다

**원문 인용**:
- Vera spec §3-5: "페이지 인라인 `<style>` 안에서 `:root{ --c-*:...}` 재정의 발견 시 **빌드 실패** (lint 추가) — Phase 1 G1 게이트"
- Arki §2-1 결함 #2 + §2-3 충돌 표: "인라인 `<style>` 페이지마다 산재 ... CSS 변수 토큰만 `style.css`로 추출, 페이지별 인라인은 한 라운드로는 제거 못함(범위 외)"

**구체 지점**: grep 결과 viewer 13개 active 페이지 전수가 인라인 `:root{}` 보유(`signature.html`·`session.html`·`feedback.html`·`decisions.html`·`topic.html`·`dashboard-ops.html` 포함, legacy v3 4종은 별개). `--c-*` 역할 토큰을 직접 정의하는 페이지는 `dashboard-upgrade.html`·`dashboard-v3d-test.html` 2건뿐 — 즉 나머지 11개 페이지는 `:root{}`에 *다른 토큰*(레이아웃·간격·자체 색)을 정의 중.

**실패 시 파손 범위**: G1 통과 기준이 "인라인 `:root{}` 0건"으로 박히면, 본 토픽이 직접 손대지 않기로 한 7개 페이지(decisions·feedback·topic·session·signature·dashboard-ops·기타)의 빌드가 일제히 실패. Arki §2-3에서 "인라인 제거는 후속(SHOULD)"라고 명시했는데 Vera spec은 G1을 빌드 실패로 잠금 → **Arki·Vera spec 간 직접 충돌**. G1을 그대로 잠그면 본 토픽 scope를 11페이지 인라인 전수 정리로 부풀리거나 G1을 풀어 token 단일화가 무력화되거나 둘 중 하나.

**완화 경로** (택1):
- (a) **G1 lint 범위를 `--c-*` 색 토큰 재정의로만 한정**. 페이지별 레이아웃 인라인 `:root{}`는 허용. 이후 점진 제거를 PD로 이연.
- (b) Phase 0 인벤토리에서 11페이지 인라인 `:root{}` 내용을 전수 dump → 충돌 토큰만 색·간격으로 분류 → 색만 강제, 나머지는 Phase 5+ 로 외화.
- **검증 경로**: Phase 0 G0 통과 조건에 "lint 적용 시 fail 페이지 수 ≤2" 추가. 3건 이상이면 G1 정의 자체를 (a)로 완화.

---

## 🔴 R-02. VR 30 baseline의 `회귀 허용 임계 0px (text·layout)`이 false-positive 폭발을 보장한다

**원문 인용**:
- Vera §4-3: "총 30 baseline. **회귀 허용 임계 0px (text·layout)** / ±2% (anti-alias·subpixel rendering)."
- Arki §5-3 G3: "diff = baseline 또는 의도된 변경만"
- Arki §5-5 HALT-2 단서: "VR 인프라가 Playwright 외 SaaS 의존 발생 ... 본 토픽은 VR 없이 G3을 manual smoke test로 대체"

**구체 지점**: 0px text/layout 허용은 (i) 데이터 변화로 인한 dashboard 숫자 변동(본 시스템은 매 세션 dashboard_data.json이 갱신됨 — Arki §2-2 데이터 흐름 표) (ii) 시스템 폰트 hinting OS 차이 (iii) 스크롤바 너비 OS별 변동 셋 모두를 회귀로 잡는다. 본 viewer는 dashboard_data.json을 Playwright 시점에 fetch → KPI 숫자가 매 빌드 다름 → diff 0px 절대 불가.

**실패 시 파손 범위**: PR마다 30 스냅샷 중 KPI 카드 포함 페이지(index·dashboard-upgrade·dashboard-ops·growth = 4페이지 × 5 viewport = 20 스냅샷)가 매번 fail. baseline 갱신이 매 세션 강제 → baseline의 진실성(누구의 어느 시점 렌더 결과인가) 자체가 무의미. Arki HALT-2 fallback("manual smoke test")으로 강제 전이되면서 본 토픽이 흡수했던 PD-034가 사실상 무산.

**완화 경로**:
- (a) baseline을 **mock data 모드**로 고정. Playwright 실행 시 환경변수로 `dashboard_data.json`을 동결된 fixture로 swap → KPI 변동 제거. 별도 Phase 2 산출물 1건 추가 필요.
- (b) 회귀 임계 재정의: text 영역 픽셀 무관 + layout bbox(요소 위치·크기) 단위 비교로 전환. Playwright `toHaveScreenshot({ maxDiffPixelRatio: 0.02, threshold: 0.2 })` + 보조로 `getBoundingClientRect()` 비교.
- **검증 경로**: G2(VR 베이스라인 생성) 직후 mock fixture 없이 1회 baseline 만든 뒤 24h 후 재실행해서 diff 비율 측정 → 5% 초과 시 (a) 강제 채택.

---

## 🟡 R-03. "데스크톱 기준 + 모바일 안 깨짐" 정책에 Vera가 추가한 768/1024 분기점은 Master 의도의 scope creep

**원문 인용**:
- Master 박제(과제 본문): "반응형: 데스크톱 기준 + 모바일 안 깨짐 (가로 스크롤·텍스트 잘림 0)"
- Vera §1-2: "4단 매트릭스. 더 잘게 쪼개지 않습니다 ... `--bp-sm 640` `--bp-md 768` `--bp-lg 1024` `--bp-xl 1440`"
- Vera §1-2 반응형 정책 표: 768 미만 사이드바 → drawer overlay, 768~1023 → 64px collapsed, 1024+ → 220px expanded

**구체 지점**: Master 의도는 "데스크톱+모바일 2축, 모바일은 안 깨지면 충분". Vera는 4축으로 확장하면서 768~1023 구간에 "사이드바 64px collapsed" 신규 모드를 추가했다. Arki §1-2도 "ECharts 고정픽셀 ... 컨테이너 fluid로 감싸는 패턴"만 언급했지 collapsed sidebar 신규 모드는 없다.

**실패 시 파손 범위**: 64px icon-only sidebar는 Vera nav-item spec(§2-2)에서 `gap: 10px (icon→label)`로 label 의존 — **icon-only 모드 별도 spec 누락**. tooltip·active state·dropdown 처리 미정. iPad 가로 1024 진입과 collapsed 768~1023 사이 1px 단위에서 사이드바가 점프(64→220) → "안 깨짐" 정책 위반. 신규 컴포넌트 4개 제한(Vera §1-4)에도 collapsed nav-item이 사실상 5번째.

**완화 경로**:
- (a) **collapsed 모드 폐기**. 768 미만 = drawer, 768+ = 220px expanded. Master 원 의도 2축에 가깝고 spec 결함 회피.
- (b) collapsed 모드 유지하려면 nav-item icon-only variant spec을 §2-2에 추가(label hidden·tooltip·width 64) + 768→1024 전이 시 사이드바 폭 transition `width 0.2s ease`로 점프 완화.
- **검증 경로**: Phase 0 종료 전 Master에 직접 확인 — "768~1023 구간에서 사이드바를 collapsed(64px)로 보일까, drawer로 숨길까?" 1줄 결정.

---

## 🟡 R-04. WCAG 4.7~4.8:1 간당값 자기 강제 정책은 다음 색 미세 조정에서 무성 위반

**원문 인용**:
- Vera §3-6: "`--c-dev (#3B82F6)` on `--panel` 4.7:1 **AA ✓ (간당)**, `--c-ace (#8B5CF6)` on `--panel` 4.8:1 **AA ✓ (간당)**"
- Vera §3-6 경계 처리: "본문 텍스트 색으로는 사용 권고 안 함. **accent·border·icon용으로만**"
- Vera §3-1 canonical: 8 ROLE_COLORS는 "이 표가 진실. 다른 페이지는 추출만."

**구체 지점**: WCAG AA 4.5:1을 0.2~0.3 차이로 통과. accent-only 정책은 **자기 규율**이지 lint 강제 없음. dev=#3B82F6은 본 시스템 `feedback_role_color_palette.md`에서 "blue cool 의도 유지" 박제된 색 — 향후 명도 ±2 조정만으로 4.5:1 미달 가능. 본 토픽 §3-6은 검증 13조합 캡처는 했으나 **재검증 트리거** 미정의.

**실패 시 파손 범위**: 누군가(Vera 본인 포함) `--c-dev`·`--c-ace` 명도 미세 조정 시 정적 검증 부재로 4.5:1 미달이 무성 통과. 본문 텍스트로 잘못 사용된 1군데(R-D02 사용처 변경, 향후 brand 그라데이션 변형 등)에서 4.5:1 미달 → 접근성 위반이 회귀 검출 안 됨.

**완화 경로**:
- (a) Phase 3 G3 게이트에 **자동 contrast check 스크립트** 박음. `app/css/tokens.css` 수정 발생 시 build.js 단계에서 13 조합 4.5:1 재계산 → fail 시 빌드 중단. 이미 §3-6 마지막에 "design:accessibility-review skill 호출"이 있는데 실제 파이프라인 진입은 미정 — Phase 3 명시 박제 필요.
- (b) `--c-dev`·`--c-ace`는 accent-only를 **CSS 사용처 lint**로 강제. 텍스트 속성(color·fill on text)에서 두 변수 사용 시 빌드 실패.
- **검증 경로**: G3 통과 기준에 "tokens.css diff 발생 시 contrast 13조합 재계산 PASS" 1줄 추가.

---

## 🟡 R-05. "본 토픽 안에서 framing→구현 끝까지" 명시와 Phase 0~5 누적이 부분 롤백 경로를 차단한다

**원문 인용**:
- Master 박제(과제 본문): "본 토픽 안에서 framing→구현 끝까지 (분화 금지)"
- Arki §5-4 롤백 표: G3 실패 시 "Phase 1 토큰 axes 재논의", G4 실패 시 "데이터 빌드 재실행만 허용"
- 메모리 `feedback_implementation_within_3_sessions.md`: "구현 토픽은 3세션 이내 완결 설계, 세션 간 정보 휘발이 오진·재작업 유발"

**구체 지점**: Phase 0(인벤토리·spec lock) → Phase 1(tokens.css·nav 단일화) → Phase 2(반응형·VR) → Phase 3(G3 게이트) → Phase 4(growth.html·signature 통합) → Phase 5(Edi). 6 페이지 신규/개편 + nav 통합 + VR 인프라 + token 단일화 + 8 컴포넌트 spec + 30 baseline이 **한 토픽**에 묶임. 3세션 이내 원칙(메모리)과 충돌 가능성 → Phase 4·5가 다음 세션 이월 시 G3 baseline·tokens.css 정의가 휘발 위험.

**실패 시 파손 범위**: Phase 4(growth.html 신설)에서 D-060 metrics_registry 데이터 계약 불일치 발견(HALT-3) → Arki §5-4는 "스키마 변경 금지(범위 외) — 데이터 빌드 재실행만 허용"으로 롤백 경로 차단 → 본 토픽 hold 또는 미완 종료. Phase 4 신규 페이지 2건이 미완이면 nav 6 카테고리 중 Growth·People 빈 진입점 → IA 자체가 깨짐. "분화 금지" 명시로 child 토픽 분기도 봉쇄.

**완화 경로**:
- (a) "분화 금지"의 예외 trigger를 Phase 0 spec lock에 박제: HALT-1~4 중 어느 하나 발생 시 child 토픽 분기 허용. Master 원 의도("끝까지")와 모순 아님 — 끝까지 가려고 시도하다 hard breaker 만나면 외화.
- (b) Phase 3 G3 통과 시점에 **부분 출시 옵션** 박제: Home·Dashboard·Records-Topics 3페이지만 token+반응형 적용 상태로 publish 가능. growth·people·deferrals는 Phase 4 미완 시 nav에서 hidden state로 보류.
- **검증 경로**: Phase 0 G0 통과 기준에 "HALT trigger 발동 시 child 분기 허용 1줄 + 부분 출시 가능 페이지 명시" 추가 동결.

---

## 6. 의도적 제외 (확신 없는 곁가지·중복·약한 항목)

다음 항목은 본 세션에서 **확신 부족 또는 다른 역할 owner** 사유로 제외:

- **6 메뉴 1차 + Records 5 sub의 인지부하**: Master 단일 사용자 가정에서 "처음 진입한 미래 협업자"는 본 시스템 currentstate에서 가정적. Master가 협업자 추가 결정 시 별도 토픽.
- **토픽-세션 chip 매핑이 N=10+ 시 깨짐**: Vera §1-3 Records-Topics에서 `overflow-x:auto` + mask-image fade로 가로 스크롤 처리 명시. 깨짐 아님 — 스크롤 동작은 의도된 패턴. 확신 부족.
- **Deferrals dependsOn 그래프가 PD 50+ 시 시각화 폭발**: 현재 PD 누적 ≈ 35건(PD-001~PD-042 일부 resolved). 50+ 도달 시점은 추측. 확신 부족.
- **Home 가벼운 랜딩 vs Dashboard 풀 KPI 분리의 동선 중복**: Vera §1-3 Home은 Hero KPI 3개 + 5 인덱스 카드 + Recent 2 band. Dashboard는 풀 KPI 보드. 분리 명확 — 회피 행동 추측에 불과. 의도적 제외.
- **Playwright SaaS 의존**: Arki §1-3 "Percy/Chromatic 등 외부 SaaS 도입은 기각" 명시. 본 토픽 scope 내 위험 0. 메모리 `feedback_external_plugin_absorption.md` 충돌 없음.
- **자가감사 결함 #1 v3 변종 4개 처리**: Arki §5-1 Phase 0에서 `topics/topic_082/legacy-decision.md`로 Master 합의 게이트 박음. 누락 아님.
- **비용 리스크 (VR 운영비·30 baseline 갱신 마찰비)**: Fin owner. 다음 호출에서 다룸.
- **Fin이 다룰 Arki 실행계획 금지어 감사**: Fin 단독 owner. 본 발언에서 중복 제외.

---

## 7. 정리

5건 모두 본 토픽 scope 안에서 발견된 구조적 파손 경로. 🔴 2건은 Phase 1 G1 정의·VR 임계값 재정의가 박지 않으면 본 토픽 자체가 폭발한다. 🟡 3건은 Phase 0~3 게이트에 1줄씩 박으면 해소된다.

Master에 **결정 요청** 1건: R-03(768~1023 collapsed sidebar 모드 유지/폐기) — Vera spec 동결 전에 1줄 답 필요.

---

```yaml
# self-scores
crt_rcl: Y
cr_val: 4
prd_rej: Y
fp_rt: 0.20
```

(주: `crt_rcl`=Y — Master가 명시 안 한 G1 lint·VR 0px 임계 충돌 2건이 🔴. `cr_val`=4 — 5건 모두 mitigation 2~3안 + 검증 경로 병기, 1점 감점은 R-04 contrast lint 구현 난이도 미정량. `prd_rej`=Y — 의도적 제외 6건 §6에 명시. `fp_rt`=0.20 — 직전 3세션 critical risk 5건 중 1건이 사후 무영향 판정(`feedback_arki_risk_requires_mitigation` 적용 후 false-positive 1).)
