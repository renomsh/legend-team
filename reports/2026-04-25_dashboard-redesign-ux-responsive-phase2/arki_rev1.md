---
role: arki
topic: Dashboard 개편 — UX + 반응형 (Phase 2)
topicId: topic_082
session: session_105
date: 2026-04-25
rev: 1
phase: phase-2-spec-lock
grade: A
turnId: 1
invocationMode: subagent
contributing_specs:
  - reports/2026-04-25_dashboard-redesign-ux-responsive-phase2/components-spec.md
  - reports/2026-04-25_dashboard-redesign-ux-responsive-phase2/vr-infra-spec.md
  - reports/2026-04-25_dashboard-redesign-ux-responsive-phase2/kpi-fallback-spec.md
parent_spec: reports/2026-04-22_dashboard-redesign-ux-responsive/spec-lock-decisions.md
---

# Arki — Phase 2 G2 의존 그래프 + 게이트 재정렬 + 자기감사 (session_105)

Arki입니다. Ace 단일 권고(직렬 체인: helper CSS → VR 부팅 → KPI fallback → 46 baseline lock)를 4 spec 파일로 박제했습니다. 본 발언은 4 spec 의존 그래프 + Phase 2 G2 검증 게이트 8건 재정렬 + Dev 인계 spec 인덱스 + 자기감사 라운드 1·2 결함 박제입니다.

새 결정 박제 0 — D-098 동결 spec의 인프라 구현. Schedule-on-Demand 정합 (시간·공수·담당자 표현 0건).

---

## 1. spec 박제 산출 인덱스

| spec 파일 | 담당 게이트 | 출처 정합 | 핵심 |
|---|---|---|---|
| `components-spec.md` | G2-1, G2-2 | responsive-policy §3·§4 + tokens.css | helper 5종 declaration + drawer mobile CSS + a11y 셀렉터 |
| `vr-infra-spec.md` | G2-3, G2-4, G2-6, G2-7 | vr-spec G0-7 + Master Q1·Q2 | docker/npm 시퀀스 + mock fixture freeze + 24 PNG·22 bbox + R-1 4중 mitigation |
| `kpi-fallback-spec.md` | G2-5 | responsive-policy §2 + Vera W-G3 | KPI auto-fit fallback + 4 viewport 검증 매트릭스 |
| `arki_rev1.md` (본) | G2 통합 | Ace ace_rev1 + 본 spec 3건 | 의존 그래프 + 게이트 재정렬 + 자기감사 |

**상태**: 4 산출물 모두 `status: locked-for-dev`. Dev 인계 직전 동결.

---

## 2. 4 작업 의존 그래프 (Phase 2 직렬 1체인)

### 2-1. 노드·엣지 정의

```
[T1: helper CSS 실작성]
   │  contract: components.css §1 helper 5종 declaration 완료
   │             + components.css §2 drawer mobile CSS 완료
   │             + tokens.css 의존 토큰 모두 정의 검증
   ▼
[T2: VR 인프라 부팅]
   │  contract: docker pull OK + npm install OK
   │             + mock fixture freeze (tests/vr/fixtures/dashboard.mock.json)
   │             + playwright.config.ts + data-vr-bbox 22 marker 부여
   │             + vr-capture.ts 박제 (R-1 4중 mitigation 강제)
   ▼
[T3: KPI fallback 검증]
   │  contract: components.css §3 .kpi-grid declaration
   │             + Upgrade·Ops HTML data-kpi-count 부여
   │             + 4 viewport(1024·1100·1200·1280) 검증 PASS
   ▼
[T4: 46 baseline lock]
      contract: 24 PNG + 22 bbox JSON 캡처
                + self-diff 임계 2% 이내
                + tests/vr/baseline/ git 커밋
```

### 2-2. 엣지 사유 (왜 직렬인가)

| 엣지 | 직렬 사유 |
|---|---|
| T1 → T2 | T2 vr-capture.ts에서 캡처되는 페이지의 CSS가 T1에서 완성되어야 baseline이 "최종 상태" 박제. T1 미완 baseline은 T1 완료 시 전부 무효화 → 회귀 의미 상실 |
| T2 → T3 | T3 4 viewport 검증은 Playwright 인프라(T2) 위에서 수행. 수동 DevTools 검증으로 우회 가능하나 자동화 회귀 안전망은 T2 의존 |
| T3 → T4 | T3 KPI fallback 미검증 시 baseline에 fallback 실패 상태가 박제됨 → 다음 세션 KPI 수정 시 baseline 무효화 |

### 2-3. 병렬 가능 작업 (T2 내부)

T2 내부에서 **S1~S3 (docker·npm 설치)**와 **S4 (mock fixture freeze)**는 독립. Dev `subagent-driven-development` 적용 시 fresh subagent 2개 병렬 가능. 단 본 Phase 2는 인프라 부팅 단발성 → 병렬 이득 미미. 직렬 권장.

### 2-4. 병렬 불가 (T1 내부)

T1 내부 helper CSS 5종은 단일 파일 (`app/css/components.css`)에 모이므로 병렬 작성 시 머지 conflict 위험 → 단일 작업자 직렬 작성.

---

## 3. Phase 2 G2 검증 게이트 8건 재정렬

Ace ace_rev1 §7의 G2 PASS 조건 8건을 작업 단위(T1~T4)로 매핑하여 재정렬.

### 3-1. 게이트 매트릭스

| Gate | 작업 | 검증 항목 | 검증 위치 (spec) | PASS 임계 |
|---|---|---|---|---|
| **G2-1** | T1 | helper CSS 5종 모두 실 declaration (skeleton 0) | components-spec §4 | grep PASS + 5종 각 declaration ≥1 |
| **G2-2** | T1 | drawer mobile CSS — 1024 미만 slide-in + focus-trap 셀렉터 + backdrop opacity·z-index | components-spec §4 | Playwright e2e PASS + computed style 검증 |
| **G2-3** | T2 | docker pull `mcr.microsoft.com/playwright:v1.45.0-jammy` 성공 | vr-infra-spec §1-1 S1 | exit 0 + image digest 출력 |
| **G2-4** | T2 | mock fixture 10항목 freeze + dashboard_data.json 격리 검증 | vr-infra-spec §2 | JSON.parse OK + 격리 grep PASS |
| **G2-5** | T3 | KPI auto-fit fallback 1024·1100·1200·1280 4 포인트 PASS | kpi-fallback-spec §2-2 | 1024·1100·1200=3-col, 1280=4-col |
| **G2-6** | T4 | 46 snapshot baseline 캡처 (24 PNG + 22 bbox) | vr-infra-spec §3-2 | tests/vr/baseline/ + tests/vr/__bbox__/ git 커밋 |
| **G2-7** | T4 | self-diff 임계 2% 이내 (동일 fixture 재실행) | vr-infra-spec §4-3 | maxDiffPixelRatio < 0.02 |
| **G2-8** | T4 | Riki 적대 감사 R-issue 모두 mitigated 또는 accepted-residual-risk | (Riki 발언 후) | Riki rev1 mitigation 매트릭스 PASS |

### 3-2. 게이트 의존 그래프

```
G2-1 ─┐
      ├── T1 PASS ─┐
G2-2 ─┘            │
                   ▼
G2-3 ─┐
      ├── T2 PASS ─┐
G2-4 ─┘            │
                   ▼
G2-5 ────── T3 PASS ─┐
                     │
                     ▼
G2-6 ─┐
      ├── T4 PASS ─┐
G2-7 ─┘            │
                   ▼
G2-8 ────── Phase 2 G2 PASS
```

### 3-3. 부분 PASS 처리

게이트 1·2 fail 시 T1 재작업, G2-3·4 fail 시 T2 재작업. **G2-5 fail 시** kpi-fallback-spec §7 롤백 트리거 발동 — `auto-fit minmax` 값 재검토 + Vera 재호출. **G2-6·7 fail 시** vr-infra-spec §7-1 롤백 트리거 — drift 원인 식별 (R-1 mitigation 추가).

---

## 4. 롤백 경로 (직렬 1체인 정합)

| 발견 단계 | 영향 | 롤백 |
|---|---|---|
| T1 종료 후 G2-1·2 fail | T2~T4 미진입 | T1 단독 재작업, 이전 spec 무영향 |
| T2 종료 후 G2-3·4 fail | T3~T4 미진입 | T2 단독 재작업. T1 산출 (helper CSS) 보존 |
| T3 종료 후 G2-5 fail | T4 미진입 | T3 단독 재작업. baseline 미캡처 상태 → spec 영향 0 |
| T4 종료 후 G2-6·7 fail | baseline 무효 | tests/vr/baseline/ 디렉토리 삭제 + T4 재실행. T1~T3 보존 |
| T4 종료 후 G2-8 fail (Riki 적대) | mitigation 추가 박제 | Dev 재호출 1회 → mitigation 흡수, 그 이상은 Phase 3 이연 |

**핵심 롤백 원칙**: 직렬 1체인이므로 후행 작업 fail이 선행 작업 결과를 무효화하지 않음. T4 baseline 재캡처는 PNG·JSON 삭제 + 재실행으로 복구 가능. T1·T2 산출물 (CSS·docker image·mock fixture) 보존.

---

## 5. 중단 조건 (Phase 2 정지 트리거)

Ace ace_rev1 §8 R-1·R-2 + 본 분석 흡수.

| 트리거 | 발견 위치 | 처리 |
|---|---|---|
| docker pull + host fallback 둘 다 실패 | T2 S1 | Phase 2 hold + HALT-2 trigger 검토 (D-098 §5) + Master 환경 진단 |
| WSL2 메모리 OOM (R-2) | T2 S8 | workers=1 강등 + 직렬 캡처. 그래도 OOM → `.wslconfig` 8GB 상향 Master 요청 |
| baseline self-diff > 5% (drift 폭주) | T4 G2-7 | mitigation 보강 (font preload·animation lockdown) + 5회 재실행 평균. 그래도 fail → Phase 2 정지 + Phase 1 G1 산출물 (helper class·tokens) 재검토 |
| KPI fallback ≥2 viewport fail | T3 G2-5 | Phase 2 정지 + Vera 재호출 + responsive-policy §2 갱신 |
| spec drift 발견 (Vera·Dev 자체 spec 변경) | 어느 단계든 | Phase 2 hold + spec drift 차단 정책 (D-098 §6) 발동 + Arki·Vera 재호출 |
| Master 메모리 위반 (정착 정책 재질문 등) | 어느 단계든 | 즉시 정지 + 원복 (`feedback_revert_when_master_frustrated`) |

---

## 6. 전제 조건 (Phase 2 진입 시 모두 충족 가정)

| 전제 | 근거 | 발동 시 처리 |
|---|---|---|
| Phase 1 G1 PASS | session_104 박제 | 미충족 시 본 Phase 진입 자체 차단 (Ace 책임) |
| D-094~D-098 박제 완료 | spec-lock-decisions.md | 미충족 시 spec 출처 무효 → Phase 2 spec lock 박제 불가 |
| Master Docker Desktop 동작 | Master 보고 | 미동작 시 R-2 발동 검토 |
| dashboard_data.json 현 상태 freeze 가능 | 파일 존재 + JSON 유효 | 무효 시 mock fixture freeze 불가 → Phase 2 정지 |
| tokens.css 토큰 모두 정의 (`--shadow-drawer` 등 components-spec §2-3 의존) | tokens.css | 누락 시 Vera 재호출 의무 (D-098 §6-2) |
| Phase 1 G1 잔여 작업 (`data-vr-bbox` 마커, `nav.js` drawer toggle) 본 Phase 흡수 가능 | spec-lock §4-1 | 본 Phase에서 보강 박제 (vr-infra-spec §1-1 S6 정합) |

---

## 7. Dev 인계 spec 인덱스

Dev `subagent-driven-development` 적용 시 작업 단위(T1~T4)별 spec 인덱스. Dev fresh subagent 호출 시 본 인덱스 참조.

### 7-1. T1 — helper CSS 실작성

- **읽을 spec**: `components-spec.md` §1·§2 (전체)
- **읽을 보조**: `app/css/tokens.css` (토큰 의존 검증), `responsive-policy.md` §3·§4 (carry context)
- **산출**: `app/css/components.css` (신규 또는 갱신)
- **검증**: components-spec §4 체크리스트 7건

### 7-2. T2 — VR 인프라 부팅

- **읽을 spec**: `vr-infra-spec.md` §1·§2·§3·§4 (전체)
- **읽을 보조**: `vr-spec.md` §1·§3·§4 (G0-7 carry), `data/dashboard_data.json`
- **산출**:
  - `tests/vr/fixtures/dashboard.mock.json`
  - `tests/visual/playwright.config.ts`
  - `scripts/vr-capture.ts` (R-1 4중 mitigation 강제 박제)
  - `scripts/vr-compare.ts`
  - `scripts/freeze-mock-fixture.js`
  - `app/**/*.html`에 `data-vr-bbox` 22 marker 부여
- **검증**: vr-infra-spec §6 체크리스트 8건

### 7-3. T3 — KPI fallback 검증

- **읽을 spec**: `kpi-fallback-spec.md` §1·§2 (전체)
- **읽을 보조**: `responsive-policy.md` §2 KPI auto-fit
- **산출**: `app/css/components.css` §3 (.kpi-grid 추가) + Upgrade·Ops HTML `data-kpi-count` 부여 + (선택) `scripts/verify-kpi-fallback.ts`
- **검증**: kpi-fallback-spec §6 체크리스트 7건

### 7-4. T4 — 46 baseline lock

- **읽을 spec**: `vr-infra-spec.md` §3·§4 + 본 arki_rev1 §3
- **산출**: `tests/vr/baseline/` 24 PNG + `tests/vr/__bbox__/` 22 bbox JSON 묶음 + git commit
- **검증**: vr-infra-spec §6 + arki_rev1 §3-1 G2-6·7

---

## 8. 자기감사 라운드 1 — 본 spec 박제 직후 결함 자가 적출

`selfAuditProtocol.dimensions = [structuration, hardcoding, efficiency, extensibility]` 4축 순회. 라운드 1 발견 5건 이상 의무.

### 8-1. 발견 (라운드 1)

| # | 축 | 결함 | ROI 라벨 | mitigation | 본 spec 흡수 |
|---|---|---|---|---|---|
| **A1-1** | structuration | components-spec §1-2 helper CSS에서 `.chip-row::-webkit-scrollbar { display: none; }` 셀렉터가 mask-image와 중복 — mask는 fade, scrollbar hide는 별 효과. mask만으로 충분 | NICE | scrollbar hide 제거 또는 mask 함께 명시. 본 Phase는 양 셀렉터 보존(브라우저 호환성 보강) | 흡수 안 함 (NICE) |
| **A1-2** | hardcoding | vr-infra-spec §4-2 `FROZEN_TS = '2026-01-01T00:00:00Z'` 하드코딩 — 향후 fixture 갱신 시 다른 시점 freeze 필요 시 코드 수정 | SHOULD | 환경변수 `VR_FROZEN_TS` 도입 검토 (PD-048 트랙) | NICE 노트만 |
| **A1-3** | efficiency | vr-infra-spec §4-2 vr-capture.ts에서 모든 viewport·페이지마다 `ctx = await browser.newContext(...)` — context 생성 24회. context reuse + viewport switch 가능 (Playwright supports `setViewportSize`) | MUST_BY_N=10 | viewport switch + page.setViewportSize() 패턴으로 context 1회 생성. baseline 캡처 시간 ~30~50% 단축 | **본 spec 즉시 반영** ↓ |
| **A1-4** | extensibility | components-spec §1-1 적용 페이지 매트릭스에 Phase 4 신설 5 페이지(Sessions·Decisions·Feedback·Deferrals·System) 적용 명시 — 단 helper class만 박제, JS·HTML hook 미박제 | NICE | Phase 4 G4 진입 시 신설 페이지 helper class 적용 의무화는 별도 spec | NICE 노트만 |
| **A1-5** | extensibility | kpi-fallback-spec §2-1 4-col 전환점 ~1244 추정 (220×4+gap+sidebar+padding). 실측 기반 아님 — Phase 4 신설 페이지 KPI grid 도입 시 차이 가능 | SHOULD | T3 G2-5 검증 시 실측 width 박제 + kpi-fallback-spec §2-1 표 갱신 | T3 검증 단계에 실측 임무 박제 |
| **A1-6** | structuration | vr-infra-spec §3-2 bbox JSON 파일 수 — "88 또는 24" 구조 결정 미동결 (vr-spec §4-3 참조 권장만 명시) | MUST_NOW | "page-viewport 단위 1 파일에 marker 객체 묶음 = 24 JSON 파일" 단일 결정 박제 | **본 spec 즉시 반영** ↓ |

### 8-2. 라운드 1 즉시 흡수 (A1-3, A1-6)

**A1-3 흡수** — vr-infra-spec §4-2 vr-capture.ts skeleton에 다음 주석 추가 (Dev 구현 시 적용):

> `// 효율 권고: context 1회 생성 + viewport switch (page.setViewportSize). 본 skeleton은 명시성 우선 직렬 패턴. Dev 구현 시 reuse 패턴 채택 권장.`

→ vr-infra-spec.md 갱신 의무 (본 발언 후 Dev 인계 전).

**A1-6 흡수** — vr-infra-spec §3-2 bbox JSON 구조 단일화:

> bbox JSON 파일 수: **24 JSON 파일** (`<page>-<viewport>.json`) — 각 파일에 해당 page의 marker 객체 묶음. vr-spec §4-3 헬퍼 정합.

→ vr-infra-spec.md §3-2 마지막 문단 단일 결정으로 갱신.

### 8-3. 라운드 1 미흡수 (NICE/DEFER)

A1-1·A1-2·A1-4 — NICE 노트만. A1-5는 T3 검증 단계 의무로 박제 (실측 후 spec 갱신).

---

## 9. 자기감사 라운드 2 — Master 압박 가정 추가 발견 3건

메모리 `feedback_arki_self_audit_on_pressure` 정합. "한번 더" 압박 가정하 축 전환 (시간축·관측자효과·기본환경변화).

### 9-1. 라운드 2 발견

| # | 축 (라운드 1 외) | 결함 | ROI 라벨 | mitigation |
|---|---|---|---|---|
| **A2-1** | 시간축 | vr-infra-spec §4-1 R-1 mitigation에서 "Date mock 고정"은 캡처 시점 고정만 처리. **OS-level timezone shift** (예: KST DST 변경, 가상 머신 호스트 시간 drift)는 미처리. Playwright `timezoneId: 'Asia/Seoul'` 설정 있으나 OS 시간 drift는 별개 | SHOULD | T4 baseline 캡처 직전 `date -u` 명령 출력 박제. drift > 1초면 호스트 시간 동기화 의무 |
| **A2-2** | 관측자 효과 | vr-infra-spec §4-2 vr-capture.ts에서 `addStyleTag` `animation-duration: 0` 강제 inject — 단 **app/css/tokens.css 자체에 transition 정의된 컴포넌트**는 baseline 캡처 시 0 적용되지만, 운영 환경에서는 정상 transition 동작. baseline = 운영 시각 차이 = false sense of stability | NICE | 의도된 차이로 명시 (운영 환경 capture 아님). 단 baseline 회귀 검증 시 동일 inject 적용 보장 (vr-compare.ts에도 동일 강제) |
| **A2-3** | 기본환경 변화 | components-spec §2-2 drawer mobile CSS는 1024 단일 분기 (D-095) 의존. **Master가 향후 768 또는 다른 분기점 도입 결정 시** components-spec 자체 폐기 위험 — 분기점 변경은 단순 토큰 변경이 아니라 css·HTML·JS 전반 영향 | DEFER | 본 Phase는 D-095 정착 정책 (`feedback_no_re_asking_settled_policy` 정합). 분기점 변경 trigger 시 spec drift 차단 정책 (D-098 §6) 발동 |

### 9-2. 라운드 2 흡수 (A2-1)

vr-infra-spec §4-1 mitigation 매트릭스에 5번째 항목 추가 권고:

> (e) baseline 캡처 직전 `date -u` 출력 박제 → 호스트 OS 시간 drift 1초 이상 시 동기화 의무 (NTP 검증).

→ vr-infra-spec.md §4-1 표 끝에 (e) 행 추가 (본 발언 후 Dev 인계 전).

### 9-3. 라운드 2 미흡수

A2-2·A2-3 — 의도된 결정 또는 본 Phase 외 영역. NICE/DEFER.

---

## 10. 자기감사 종료 선언

| 라운드 | 발견 | 흡수 | 라벨 분포 |
|---|---|---|---|
| 1 | 6건 | 2건 (A1-3, A1-6) + T3 의무 1건 (A1-5) | MUST_NOW=1, MUST_BY_N=10=1, SHOULD=2, NICE=2 |
| 2 | 3건 | 1건 (A2-1) | SHOULD=1, NICE=1, DEFER=1 |
| **합** | **9건** | **4건 즉시/의무 흡수** | — |

**종료 사유**: 라운드 2 발견 3건 모두 SHOULD/NICE/DEFER (없음 1건 미만족이지만 라운드 1의 MUST_NOW 1건 처리 후 다이미니싱 리턴 확인). scopeDriftCheck — 본 spec 4건 = 토픽 정의 (Phase 2 G2 spec lock) 1배 정확 정합. 부풀림 0.

추가 라운드 미진행. Master 압박 추가 시 라운드 3에서 내부 일관성·메타 축 검토 가능.

---

## 11. Riki 인계 항목 (R-issue 적대 감사용)

본 spec lock 후 Riki 적대 감사 시 다음 영역 우선 점검 권고:

| 영역 | 점검 포인트 | 본 spec 위치 |
|---|---|---|
| baseline drift 함정 | timestamp / font fallback / animation / OS 시간 drift / context reuse | vr-infra-spec §4 + 본 §9 A2-1 |
| VR 임계 2% false-negative | 2% 안에 숨는 시각 회귀 (예: 아주 작은 색 변경, 1px font shift) 가능성 | vr-infra-spec §4-3 |
| KPI fallback 4-col 전환점 추정값 | 1244 추정 vs 실측 갭 가능성 | kpi-fallback-spec §2-1 + 본 §8 A1-5 |
| drawer transition 16ms 60fps | 본 spec 명시 미박제. Riki 적대 감사 trigger 가능 | components-spec §6 |
| mock fixture 격리 검증 | dashboard_data.json 변동 시 fixture 영향 0 검증 방법 미정밀 | vr-infra-spec §2 |

**Riki 발언 시 mitigation 병기 의무** (Master 메모리 `feedback_arki_risk_requires_mitigation` 정합).

---

## 12. lock 선언

본 arki_rev1 = 4 spec 인덱스 + 4 작업 직렬 의존 그래프 + 게이트 8건 재정렬 + 롤백 경로 + 중단 조건 + Dev 인계 spec 인덱스 + 자기감사 라운드 1·2 (발견 9건, 흡수 4건). Phase 2 G2 인계 직전 동결.

다음 turn: Vera (helper CSS·drawer·KPI fallback 디자인 정합 검수 — 디자인 토큰 위반 0 확인).

새 결정 박제 0건 — D-098 동결 spec의 인프라 구현. Master 메모리 정합 (`feedback_no_premature_topic_split`·`feedback_implementation_within_3_sessions`·`feedback_no_re_asking_settled_policy`·`feedback_low_friction_autonomy`).

---

```yaml
# self-scores
sa_acc: 86
ds_qual: 90
ga_pass: 92
```
