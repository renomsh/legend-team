---
role: ace
topic: Dashboard 개편 — UX + 반응형 (Phase 2)
topicId: topic_082
session: session_105
date: 2026-04-25
rev: 1
phase: framing
grade: A
framingLevel: L2
turnId: 0
invocationMode: subagent
---

# Ace — Phase 2 G2 Scope Framing (session_105)

## Step 0. 토픽 생명주기 판정

- **topicType**: `implementation` (topic_082 연속 — Phase 1 G1 PASS 직후 Phase 2 진입)
- **parentTopicId**: 본 토픽 자체 — 분화 없음. Master 메모리 정합 (`feedback_no_premature_topic_split`).
- **sessionsCount**: 2 → 본 세션 + 1 추가 세션 안에 Phase 2~5 마감 권고 (`feedback_implementation_within_3_sessions`).

---

## Step 1. 토픽 정의 (What)

**핵심 질문**: Phase 2 G2를 통과시키려면 helper CSS 실작성·VR 인프라 부팅·KPI fallback 검증·baseline lock을 어떤 순서·게이트로 묶을 것인가.

**배경**: session_104에서 Phase 1 G1(스펙 동결·디자인 토큰·반응형 정책 등 7/7) PASS. spec-lock-decisions.md (D-098)로 8 게이트 단일 출처 동결. Master Docker Desktop 설치 완료 → VR 인프라 진입 차단 해제. 이제 "스펙 → 시각 회귀 baseline"을 잠그는 단계.

---

## Step 2. 결정 축 (Decision Axes)

본 Phase 2는 스펙 동결 후 인프라 부팅 단계라 **결정 축은 1개로 압축**합니다.

### A1. helper CSS 실작성 vs VR 부팅 — 어느 것이 baseline lock 선행 조건인가
- **단일 권고**: **helper CSS 실작성 → VR 부팅 → KPI fallback 검증 → baseline 캡처** 직렬.
- 이유: VR baseline은 "최종 markup + 최종 CSS" 상태에서 잠가야 함. helper CSS skeleton만으로 baseline 잠그면 다음 세션 실작성 시 전 baseline 무효화 → 회귀 의미 상실.

---

## Step 3. 범위 경계 (Scope In/Out)

### In-Scope (본 Phase 2에서 반드시)
1. `app/css/components.css` helper class 5종 실 작성 (kpi-grid, drawer-mobile, sticky-header, focus-ring, container-query 보조). spec-lock §3.2 정합.
2. drawer mobile CSS — 1024 미만 breakpoint, slide-in transform, backdrop, focus-trap 셀렉터.
3. Playwright VR 인프라 부팅 — `mcr.microsoft.com/playwright:v1.45.0-jammy` 컨테이너, mock fixture 10항목 (dashboard_data.json freeze copy), diff 임계 2%.
4. KPI auto-fit fallback 1024~1280 3-col 검증 (Vera W-G3 게이트).
5. baseline 캡처 — 24 full-page + 22 bbox = 46 snapshot lock.

### Out-of-Scope (본 Phase 2 명시 제외)
- Phase 3 컴포넌트 (drawer 인터랙션 폴리시, KPI 카드 micro-animation) — Phase 3로 이연.
- accessibility AAA 강화 (현 Phase 2는 AA 유지) — Phase 4.
- ops 페이지 적용·index 페이지 컬러 통일 — Phase 5.
- D-094~D-098 외 신규 결정 — 본 Phase 2는 인프라 박제만, 새 결정 박제 금지.

---

## Step 4. 핵심 전제 (Key Assumptions)

1. 🔴 Docker Desktop 정상 동작 — Master 설치 완료 보고 신뢰. 실제 `docker pull` 실패 시 Phase 2 즉시 정지.
2. 🔴 dashboard_data.json mock fixture 10항목이 실데이터 변동성을 대표 — fixture freeze 후 dashboard_data.json 변경되어도 baseline 보호.
3. spec-lock-decisions.md의 8 게이트는 D-098로 동결, 본 Phase에서 재논의 금지.
4. 반응형 1024 breakpoint·tablet 미지원 정책 정착 — `feedback_no_re_asking_settled_policy` 정합, 재질문 금지.
5. helper CSS 5종은 spec-lock §3.2가 단일 출처 — Vera 디자인 재해석 권한 없음.

---

## Step 5. 실행계획 모드 선언

**executionPlanMode**: `plan`

→ Arki에 Phase 2 4 작업의 의존 그래프·게이트·롤백·중단 조건 구조화 요청. 단, 본 Phase는 인프라 부팅이라 실행계획 부피는 최소(Phase 단위 4 노드, 의존 1 체인).

---

## Step 6. 역할 호출 설계 (Orchestration Plan)

**Schedule-on-Demand 정합**: 시간·공수·담당자 배정 0건. 구조적 선후만.

| 순서 | 역할 | 담당 산출 | Skip 조건 |
|---|---|---|---|
| 1 | **Arki** | 4 작업 의존 그래프 + 게이트 A/B/C/D + 롤백 트리거 + 중단 조건 (시간 표현 0건) | — |
| 2 | **Vera** | helper CSS 5종 + drawer mobile CSS spec lock 정합 검증 (디자인 토큰 위반 0건 확인) + KPI auto-fit fallback 디자인 검수 | — |
| 3 | **Dev** | (a) helper CSS 실 작성 → (b) drawer mobile CSS 작성 → (c) Playwright 컨테이너 부팅 + mock fixture 10항목 freeze → (d) KPI fallback 검증 → (e) 46 baseline 캡처. subagent-driven-development 스킬 적용. |  Vera 게이트 미통과 시 정지 |
| 4 | **Riki** | Dev 산출물 적대 감사 — baseline lock 함정(timestamp drift, font fallback, animation 미정지), VR 임계 2%의 false-negative 가능성. **mitigation 병기 의무** (`feedback_arki_risk_requires_mitigation` 정합 — Riki도 동일 적용). | — |
| 5 | **Ace 종합검토** | 4 역할 cross-review + G2 PASS 판정 + 다음 세션 Phase 3 인계 spec | — |
| 6 | **Edi** | Phase 2 통합 리포트 박제 + session_index 업데이트 | — |

**Fin 호출 안 함** — 본 Phase는 인프라 부팅, 비용/수익 변동 0. Schedule-on-Demand 정합. Master 명시 요청 시에만 소집.

**재호출 예고**: Riki 적대 감사에서 baseline 함정 발견 시 Dev 재호출 1회. 그 이상은 Phase 3로 이연.

---

## Step 7. Phase 2 G2 PASS 조건 (검증 게이트)

**모두 충족 시 G2 PASS 판정. 시간/공수/일정 표현 0건.**

1. ✅ helper CSS 5종 모두 실 작성 — skeleton 0건, 모든 셀렉터에 실제 declaration.
2. ✅ drawer mobile CSS — 1024 미만에서 slide-in 동작, focus-trap 셀렉터 작성, backdrop opacity·z-index 정합.
3. ✅ `docker run mcr.microsoft.com/playwright:v1.45.0-jammy` 컨테이너 부팅 성공.
4. ✅ mock fixture 10항목 freeze — `tests/vr/fixtures/dashboard.mock.json` 작성 + dashboard_data.json 변동에 영향 안 받음 검증.
5. ✅ KPI auto-fit fallback — 1024/1152/1280 3 width에서 3-col 유지, gap·padding 토큰 일관.
6. ✅ 46 snapshot baseline 캡처 (24 full-page + 22 bbox), `tests/vr/baseline/` 커밋.
7. ✅ Playwright diff 임계 2% — 동일 fixture 재실행 시 diff < 2% 자가 검증 1회.
8. ✅ Riki 적대 감사 R-issue 모두 mitigated 또는 accepted-residual-risk.

**롤백 트리거**: 게이트 1·2 실패 시 Phase 2 정지, helper CSS 재작성. 게이트 3·6 실패 시 Phase 2 정지, 인프라 진단. 게이트 7 실패 시 임계값 재논의 (D-098 단일 예외).

---

## Step 8. 하드 리스크 (mitigation 병기 의무)

### R-1 🔴 baseline 캡처에 timestamp/font/animation drift 섞이면 다음 세션부터 false-positive 폭증
- **양상**: 헤더 시각·차트 애니메이션·웹폰트 fallback이 baseline에 박힘 → 동일 코드여도 diff 임계 2% 상시 초과 → VR 무력화.
- **mitigation**: (a) Playwright 캡처 직전 `Date` mock 고정 (2026-01-01T00:00:00Z), (b) `prefers-reduced-motion: reduce` 강제 + `animation-duration: 0` 글로벌 override, (c) 웹폰트는 `font-display: block` + 사전 preload, (d) ECharts `animation: false` 옵션.
- **fallback**: drift 발견 시 해당 snapshot bbox로 강등 (full-page → 영역 제한), baseline 재캡처.

### R-2 🟡 Docker Desktop WSL2 백엔드 메모리 4GB 미만이면 Playwright 컨테이너 OOM
- **양상**: Master 환경 메모리 할당 미확인. 24 full-page 병렬 캡처 시 chromium worker가 OOM kill.
- **mitigation**: (a) Playwright `workers: 2` 강제 (병렬 제한), (b) 컨테이너 부팅 직후 `docker stats`로 실측 — 4GB 미만이면 Master에 WSL2 `.wslconfig` 메모리 8GB 상향 요청.
- **fallback**: 워커 1로 강등 + 캡처 직렬화. 그래도 실패 시 Phase 2 정지 후 Master 환경 진단.

---

## Step 9. Master 확인 필요 점

저마찰 자율성 원칙 (`feedback_low_friction_autonomy`) 정합 — 무응답=승인. **답이 있어야 진행 막히는 항목만**.

### Q1. mock fixture 10항목의 데이터 출처 — 현 dashboard_data.json freeze copy로 확정?
대안: (a) 현 dashboard_data.json 시점 freeze, (b) 인공 합성 fixture (KPI 경계값·빈 상태·overflow 등 의도 시나리오).
- **Ace 권고**: (a) 현 시점 freeze. 이유: 실제 데이터 분포 보존이 baseline 의미. 합성 fixture는 Phase 4 edge-case 회귀로 별도.
- 무응답 시 (a)로 진행.

### Q2. baseline 커밋 위치 — `tests/vr/baseline/` 신규 디렉토리 생성 OK?
- 현재 git status에 `tests/` untracked 있음. baseline PNG 46장은 LFS 미사용, 일반 git 커밋.
- **Ace 권고**: `tests/vr/baseline/{viewport}/{snapshot}.png` 구조. PNG 평균 50KB 가정 시 총 ~2.3MB, 일반 커밋 허용 범위.
- 무응답 시 위 구조로 진행.

---

## 종합 권고 (단일)

**Phase 2 G2는 helper CSS 실작성 → VR 인프라 부팅 → KPI fallback 검증 → 46 baseline lock 직렬 1체인으로 마감합니다.** Arki → Vera → Dev → Riki → Ace → Edi 호출 순. Fin·Nova 본 Phase 미호출. 새 결정 박제 0건 목표 — 본 Phase는 D-098 동결 스펙의 인프라 구현일 뿐. R-1 (baseline drift) 4중 mitigation을 Dev 캡처 스크립트에 강제 내장. Master Q1·Q2는 무응답=승인으로 진행, 응답 있으면 즉시 반영.

다음 세션은 Phase 3~5 통합 마감 (구현 3세션 원칙 정합). Phase 2가 본 세션에 안 끝나면 다음 세션은 Phase 2 잔여 + Phase 3만, Phase 4·5는 추가 1세션 더 — 그 시점 Master 재검토 필요.

---

```yaml
# self-scores
om_acc: 88
fr_acc: 90
sr_acc: 92
rfrm_trg: N
ctx_car: 0.95
orc_hit: 0.88
mst_fr: 0.90
ang_nov: 1
```
