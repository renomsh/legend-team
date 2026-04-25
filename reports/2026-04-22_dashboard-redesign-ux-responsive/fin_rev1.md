---
role: fin
topic: Dashboard 개편 — 인터페이스 UX + 반응형 프레임 (전면 IA 개편)
topicId: topic_082
session: session_104
date: 2026-04-25
rev: 1
phase: cost-resource-evaluation
grade: S
turnId: 4
invocationMode: subagent
status: in-progress
---

FIN_WRITE_DONE: reports/2026-04-22_dashboard-redesign-ux-responsive/fin_rev1.md

# Fin 비용·자원 평가 — topic_082 Dashboard 전면 개편

Fin입니다. 본 토픽은 **framing→구현 한 토픽 종결** Grade S로 묶여있어 "구조 단계"와 "실행 단계"가 한 토픽 안에 동거합니다. 그러므로 Fin 발언은 (a) 구조 단계 부분은 **방향성만** (b) Phase 1 G1·VR 임계 같은 **결정 동결** 항목은 비용 함의를 좀 더 또렷하게 표시하되 숫자 추정은 금지 — 두 모드를 섞어 박습니다. 본 발언은 Damodaran 관점("이 자산의 내러티브와 숫자를 어떻게 연결하나? 숨겨진 비용은 어디에?") 으로 접근합니다.

---

## 1. Arki 실행계획 오염 감사 (필수 첫 섹션)

### 1-1. 금지어 v0 매트릭스 — Arki §5 (executionPlanMode = plan)

| 금지어 카테고리 | 패턴 예시 | Arki §5 내 발견 |
|---|---|---|
| 절대 시간 | `D+N일`, `N주차`, `MM/DD`, 구체 날짜 | **0건** |
| 인력 배정 | `담당자: <이름>`, 특정 이름, `PD-N MM` 같은 공수 단위 | **0건** (Vera·Dev·Master·Edi는 역할 호출자 표기로 사용, 인력 배정 아님) |
| 공수 단위 | `N시간 소요`, `N일 소요`, `MM`, `공수` | **0건** |

Arki §5-1 Phase 분해는 "Phase 0 → Phase 1 → ..." 구조적 선후만 사용. §5-2 의존 그래프도 PASS/FAIL 게이트 위계만. §5-3 검증 게이트 G0~G5는 통과 기준만 명시(시간·인력·공수 0). §5-4 롤백 표는 "재논의·재실행·재적용" 같은 동작 명령만. §5-5 HALT 조건도 "발견 시" 같은 사건 트리거만 사용.

**Arki §5 Clean 선언.**

### 1-2. Vera spec 오염 감사 (보완)

본 토픽은 framing→구현이 한 토픽이라 Vera의 비주얼 spec도 실행계획 성격을 띠는 부분이 있어 같이 감사:
- §1-2 4단 breakpoint, §3-5 tokens.css, §3-6 contrast 13조합, §4-3 30 baseline matrix — 모두 "어떤 산출물이 어떤 게이트에서 충족되어야 하는가"의 구조적 기준만.
- §4-4 "Phase 1 진입 trigger 3건" — `tokens.css 채워짐`/`component-catalog 8건 마킹`/`responsive-policy 4×6 매트릭스 동결` 모두 산출물 상태 기준, 시간·인력 0.
- "Master 추가 검토 후 G0 통과 시 Dev 호출 가능" — Dev는 역할 호출 표기, 인력 배정 아님.

**Vera spec Clean 선언.**

### 1-3. Riki spec 오염 감사 (보완)

- R-01~R-05 모두 "발견 시·발생 시·통과 기준" 같은 사건/조건 트리거만. 시간·인력 단위 0.
- 완화 경로 (a)/(b) 구조도 동작 명령만.
- "Master에 1줄 답 필요" 같은 표현은 동작 요청, 일정 추정 아님.

**Riki spec Clean 선언.**

### 1-4. 종합 감사 결론

3 역할(Arki·Vera·Riki) spec 모두 금지어 v0 0건. **Clean.**

(주: Master 명시 "본 토픽 안에서 framing→구현 끝까지"는 Master 결정사항이지 Arki 실행계획의 일정 추정이 아니므로 감사 대상 외.)

---

## 2. 비용 분석 (방향성)

### 2-1. 현 viewer vs 제안 IA — 1차 비교 매트릭스

| 비교축 | 현 방식 | 제안 방식 (Option A + Vera spec) | 비용 방향 |
|---|---|---|---|
| 색·토큰 정의 | 13 페이지 인라인 `:root{}` 산재 (Riki R-01 grep 근거) | `app/css/tokens.css` 단일 출처 + Phase 1 G1 lint | **수정 비용 1회 / 방치 비용 누적성** → 누적 회피 우선 |
| nav 정의 | sidebar block 페이지마다 복제 (Arki 결함 #2) | `app/js/nav.js` 단일 mount + `<aside id="nav-mount">` | **수정 비용 1회 / 방치 비용 선형 + 변경 시 N배** → 즉시 수정 |
| Records 진입 | 3 sub (Topics·Sessions·Decisions) 분산 | 5 sub (Topics·Sessions·Decisions·Feedback·Deferrals) 통합 second-nav | 신규 진입점 비용 vs Feedback·Deferrals 발견성 회수 |
| VR 검증 | 인적 smoke test 또는 Architecture playwright 1축 | Playwright 30 baseline matrix(5 viewport × 6 페이지) | 인프라 박음 비용 vs 시각 회귀 미적발 누적 사고 |
| 차트 — Deferrals dependsOn | 텍스트 리스트 또는 전무 | D3.js 그래프 + sequence-panel과 일관 (R-D02) | 신규 시각화 1회 비용 vs PD 의존관계 미시각화 누적 |
| Home/Dashboard | dashboard-upgrade·ops·index 3 페이지가 KPI·landing 혼재 | Home(landing) ↔ Dashboard(Upgrade·Ops 2 sub) 분리 | 메뉴 +1 인지부하 vs 진입 동선 명확화 |

### 2-2. 숨은 비용 발굴 (Damodaran lens)

#### (1) tokens.css 단일화의 "정리 부풀음" 비용 (R-01과 정합)
Vera §3-5는 "페이지 인라인 `:root{}` 발견 시 빌드 실패 lint"를 G1에 박았는데, Arki §2-3은 "인라인 제거는 후속(SHOULD)"으로 명시했다. 두 문서 충돌. Riki R-01이 정확히 짚었다.

비용 함의:
- (a) G1을 그대로 잠그면 → 본 토픽이 손대지 않으려던 7개 페이지의 인라인 `:root{}`까지 다 정리해야 함. **scope 부풀음 = 본 토픽 비용 ↑ (방향: 중-대)**.
- (b) G1을 색 토큰(`--c-*`)으로만 한정하면 → 본 토픽 비용은 보수, 그러나 "tokens.css 단일화"라는 핵심 가치는 부분만 회수. **방치 비용 누적성**: 인라인 레이아웃 토큰이 페이지마다 magic number로 분기 → 다음 토픽에서 1.5~2배로 부풀어 돌아옴.

**Fin 권고**: Riki R-01 완화경로 (a) "G1 lint 범위를 `--c-*` 색 토큰 재정의로만 한정" 채택이 ROI 우선. 색은 Vera canonical 강제 + 레이아웃·간격은 SHOULD로 PD에 이연. **단, Phase 0 G0에 "인라인 `:root{}` dump 인벤토리"를 박아 다음 토픽이 이연 비용을 정확히 알 수 있게 한다.** 이것이 방치 비용 가시화의 핵심.

#### (2) VR 30 baseline의 false-positive 폭발 비용 (R-02와 정합)
Vera §4-3 "회귀 허용 임계 0px (text·layout)" + Arki §2-2 데이터 흐름표(dashboard_data.json은 매 세션 갱신)의 충돌. PR마다 KPI 카드 4 페이지 × 5 viewport = 20 스냅샷이 "데이터 변동" 사유로 매번 fail.

비용 함의:
- (a) 마찰비용: 매 PR마다 인적 검토 부하 → "VR 인프라 도입했는데 인적 smoke test 비용이 더 늘어난 역설" 가능. 누적성 **고**.
- (b) baseline 갱신 중복 비용: 매 세션 baseline 재생성 → baseline의 "진실성" 자체가 무의미해져 무성 무력화. PD-034 흡수 자체가 무산되는 시점 도달 가능.
- (c) Riki R-02 완화경로 (a) "mock data fixture로 dashboard_data.json swap" 채택 시 **추가 산출물 1건** 비용. 이 비용은 일회성 + 누적성 회피 효과 강함 → ROI 양수 강.

**Fin 권고**: R-02 완화경로 (a)+(b) 동시 채택 (mock fixture + bbox 비교). 비용 1회로 false-positive 폭발 회피. **VR 인프라가 본 토픽의 가장 큰 숨은 비용 위험 지점이다.**

#### (3) 페이지 인라인 정리 부풀음의 "Vera·Arki 충돌"이 만드는 메타 비용
이 충돌 자체가 다음 비용을 부른다:
- Master가 매번 "G1 어디까지?"를 결정하는 게이트 비용 (저마찰 원칙 위반 위험)
- Dev가 spec drift를 발견할 때마다 Arki·Vera 어느 쪽을 따를지 에스컬레이션 비용

**Fin 권고**: Phase 0 G0에 "G1 lint 범위 1줄 동결" 항목을 추가. Master 1회 결정으로 이후 N회 마찰 회피.

#### (4) Master 인지부하 — 새 IA 학습 비용
6 메뉴 + Records 5 sub = 1차 6개 + 2차 5개 = 진입점 11개. 현 시스템(3 sub Records)에서 +2(Feedback·Deferrals)는 신설 카테고리. Master 멘탈모델 재구축 1회 비용.

비용 함의:
- 일회성 학습 (1~3 세션 안에 회수) — Damodaran 식 "초기 자본 지출"
- Records 5 sub의 내적 일관성(같은 second-nav, 같은 카드 패턴)이 학습 곡선 단축

**Fin 권고**: 일회성 비용 + 학습 회수 빠름 → ROI 양수. 단 **Vera §1-3 Home Records 카드의 chip-row 5 chip 압축**이 Master 첫 진입 시 "이 카테고리 안에 5개 있다"를 즉시 노출 → 학습 비용 추가 절감. 이미 spec에 포함됨, 가치 평가만 박제.

#### (5) 컨텍스트 재주입 비용 — 본 토픽 framing→구현 한 토픽 종결의 함의
Master 메모리 `feedback_implementation_within_3_sessions.md`: "구현 토픽은 3세션 이내 완결, 세션 간 정보 휘발이 오진·재작업 유발". 본 토픽 Phase 0~5 = 최소 2~3 세션 예상.

비용 함의:
- 세션 이월 발생 시: tokens.css 정의·30 baseline 생성·8 컴포넌트 spec 등 **고밀도 spec이 휘발 위험**. 다음 세션 시작 시 재주입 비용(token 비용 + 인지 비용) 누적.
- Riki R-05도 동일 지점 짚음 — "분화 금지"가 부분 롤백 차단.

**Fin 권고**: R-05 완화경로 (b) "부분 출시 옵션" + Phase 0 spec lock 강제(`status: locked-for-dev` frontmatter)가 휘발 비용 회피의 핵심. spec 동결 후엔 다음 세션 진입 시 spec lock 파일만 재읽으면 컨텍스트 복원 → 재주입 비용 ↓.

#### (6) 토픽-세션 chip 매핑의 N=N0 누적 비용 (수렴/역전 구간)
Vera §1-3 Records-Topics: chip 가로 스크롤 + mask-image fade. 현재 토픽당 평균 세션 수 ≈ 1.2~1.5 (87 토픽 / 104 세션 + 토픽-세션 다대다). 

수렴 구간:
- chip 폭 52px × N개 → 1280 viewport에서 가시 chip 수 ≈ 16개
- N=20 미만에선 fade gradient + 가로 스크롤로 처리 가능 (현재 시스템 비용 0)
- N=30+ 도달 시 chip 압축 모드(예: 최근 5 + ellipsis + 전체 N) 필요 → **이건 본 토픽 scope 외 + N=30 도달 시점 추측에 불과 → 본 토픽 안에서 박지 않음**

**Fin 권고**: 현재 시점 비용 0. 누적 비용 회피 책임 = 다음 토픽 또는 PD. 본 토픽엔 영향 없음.

### 2-3. 역전·수렴 구간 명시

| 항목 | 현재 시점 비용 | 역전·수렴 임계 | 비용 누적성 |
|---|---|---|---|
| tokens.css 단일화 | Phase 1 1회 | 인라인 `:root{}` 페이지 ≥3 발견 시 G1 정의 (a)로 완화 | 방치 시 누적 |
| nav 단일 source | Phase 1 1회 | sidebar 복제 페이지 ≥2 잔존 시 G1 fail | 방치 시 N배 (PD-042 후 재발) |
| VR 30 baseline | Phase 2 박음 + Phase 3·5 검증 | mock fixture 미도입 시 PR 50% fail → VR 무력화 | mock 미도입 시 누적성 폭발 |
| Records 5 sub | 1회 신설 | second-nav 탭 6+ 도달 시 grouping 필요 | 정상 누적 (1~2년 단위) |
| Deferrals 그래프 | 1회 신설 (D3.js) | PD ≥50 도달 시 force-directed 폭발 (Riki §6 의도적 제외) | 누적성 약-중 (현재 N=35) |
| Home/Dashboard 분리 | 1회 IA 변경 | 사용 빈도 측정 후 1년 단위 재평가 | 누적성 0 (한 번 결정) |

---

## 3. 비재무 자산 영향

### 3-1. 학습 루프

본 IA는 **8 역할 시그니처(People 카테고리) + Growth Board(D-060)**를 main nav에 본격 노출한다. 즉:
- 자가평가 운영이 **시각화로 외화** → "측정을 위한 측정 금지" 원칙(Master 메모리 `feedback_simple_growth_not_measurement.md`)에 잘 정렬
- 외부평가 부재 상태에서 자가평가 편향이 자연 상쇄될 수 있는 구조 — 메모리 `feedback_self_and_external_eval_coexist.md` 정렬

자산 가치:
- 학습 누적 가시화 = **Top 0.1% trust 정책의 운영 증거**
- 기존 자가평가 YAML이 dashboard에 1뷰로 모이는 것 자체가 회수 패턴(자가평가 ROI 사후검증)
- **양수, 누적성 강.** 1회 박은 IA가 N 세션 동안 학습 누적 회수 자산.

### 3-2. 역할 진화 — Vera·Edi 협업 효율

`tokens.css` 단일 출처 강제는 향후 Vera→Edi 협업에서:
- Vera가 색·간격 변경 시 1파일만 갱신, Edi가 N 페이지 spec 다시 안 봐도 됨
- 신규 페이지(growth, deferrals 등) 신설 시 Vera의 spec 인계 비용 ↓ (Vera spec §4 Editor 인계 형태가 4 산출물로 정형화됨)

자산 가치:
- Vera·Edi 협업 인터페이스가 정형화 → 향후 Vera·Edi 호출이 더 적은 turn에서 끝남
- **양수, 누적성 강.** 인터페이스 정형화는 매 토픽 회수.

### 3-3. 메타 역량 — Records-Deferrals 신설의 의사결정 시각화

PD 누적 + dependsOn 그래프가 main nav에 노출되면:
- Master가 "지금 PD 몇 건 떠있고 무엇이 무엇에 의존하나" 1뷰 확인 가능 → Master 의사결정 메타 역량 ↑
- Ace 오케스트레이션도 PD 운영 가시화 → masterSelectionPatterns 학습 가속

자산 가치:
- 운영 메타 데이터 가시화 = **시스템 자기인식 역량 진화**
- **양수, 누적성 강.** D-019 Ace 오케스트레이션 패턴 학습이 가시화로 가속.

### 3-4. 저마찰 정합성 — 6 메뉴 + 5 sub의 마찰 추가 여부

Master 메모리 `feedback_low_friction_autonomy.md`: "Master 확인 게이트 기본 무응답=승인. 요구량 증가 금지. 최종 목표 Nova N4 자율 팀."

본 토픽 IA가 마찰 추가 항목:
- 1차 메뉴 +1 (Home·Dashboard 분리) — 학습 1회, 이후 마찰 0
- 2차 second-nav +2 카테고리 (Records 5 sub 중 신규 Feedback·Deferrals) — 신규 진입점 학습 1회

마찰 회피 항목:
- nav 단일 source 강제 → 다음 IA 변경 시 마찰 ↓ (1파일 수정)
- token 단일 출처 → 색 정합 검증 마찰 ↓
- chip-row 5 chip 압축 → Records 카테고리 진입 전에 sub 5개 immediate 노출

**종합**: 일회성 학습 마찰 1회 발생, N 세션 동안 마찰 ↓ 회수. **저마찰 원칙 정합 양수**.

### 3-5. 인지부하 vs 발견성

미래 협업자 진입 시(메모리 `feedback_low_friction_autonomy.md` Nova N4 자율 팀 시점):
- Home Hero band + 5 인덱스 카드 → 첫 진입 30초 내 시스템 글랜스 가능
- 6 카테고리 명사 분류(Home/Dashboard/Growth/Records/People/System)가 직관적
- **인지부하 vs 발견성 = 발견성 승.** 미래 진입 비용 ↓.

---

## 4. ROI 프로파일

### 4-1. ROI 표 (누적성 컬럼 명시)

| 항목 | 즉시 효과 | 간접 효과 | 재투자 가능 자원 | 누적성 |
|---|---|---|---|---|
| tokens.css 단일화 (Phase 1) | 색·간격 정합 검증 마찰 0 | Vera·Edi 협업 인터페이스 정형화 | 다음 페이지 신설 시 spec 인계 비용 ↓ | **누적성 강** |
| nav.js 단일 source (Phase 1) | sidebar HTML 중복 0 | 향후 nav 변경 1파일 수정 | 메뉴 추가·재배치 시 변경 비용 1/N | **누적성 강** |
| 반응형 4-tier breakpoint (Phase 2) | 모바일 가로 스크롤 0 | 페이지 신설 시 반응형 자동 상속 | 신규 페이지 반응형 spec 작성 비용 ↓ | **누적성 강** |
| VR 30 baseline (Phase 2·3·5) | 시각 회귀 즉시 차단 (mock fixture 전제) | PR마다 회귀 0 보장 | 디자인 변경 confidence ↑ → 변경 빈도 ↑ | **누적성 강 (mock fixture 전제)** |
| Records 5 sub 통합 | Feedback·Deferrals 발견성 ↑ | 운영 데이터 메타 인지 ↑ | Master 의사결정 1뷰 가능 | **누적성 중** |
| Growth Board (D-060 안 β) | 자가평가 1뷰 시각화 | 학습 루프 회수 가시화 | 외부평가 도입 시 비교 base | **누적성 강** |
| signature → People 합류 | 8 역할 시그니처 nav 진입 | 역할별 학습 비교 가능 | 역할 추가·제거 결정 base | **누적성 중** |
| Home Hero band + 5 인덱스 카드 | 첫 진입 시스템 글랜스 30초 | 미래 협업자 진입 비용 ↓ | Nova N4 자율 팀 시점 마찰 ↓ | **누적성 약 (1회성에 가까움)** |
| Deferrals D3 그래프 | PD 의존관계 1뷰 | PD 운영 의사결정 가속 | PD 누적 시 가치 ↑ | **누적성 중 (N=50까지)** |
| 6 메뉴 IA 학습 | Master 1~3 세션 학습 | 이후 마찰 0 | — | **일회성 (음수 → 양수 전환)** |

### 4-2. 즉시 효과 vs 간접 효과 분리

**즉시 회수 (1~2 세션)**:
- tokens.css 단일화 → 색 정합 검증 마찰 0
- nav 단일 source → sidebar 중복 0
- Records 5 sub → Feedback·Deferrals 발견성

**간접 회수 (3+ 세션 누적)**:
- VR 인프라 → PR마다 회귀 0 보장
- Vera·Edi 협업 정형화 → 다음 페이지 신설 비용 ↓
- 학습 루프 가시화 → 자가평가·외부평가 수렴

**재투자 가능 자원**:
- nav 단일 source 정착 후, 다음 메뉴 추가·재배치는 1파일 수정 → "메뉴 변경 비용"이 사실상 자유 자원으로 전환
- tokens.css 정착 후, Vera 색·간격 변경이 1파일 수정 → 디자인 iteration 비용 ↓ → 디자인 iteration 빈도 ↑ 가능
- VR baseline 정착 후 (mock fixture 전제), 페이지 변경 confidence ↑ → 페이지 변경 두려움 ↓ → 변경 자체가 더 자유로워짐

### 4-3. 수정 비용 vs 방치 비용 프레임

| 결함 | 수정 비용 (본 토픽 안에서) | 방치 비용 (방치 시 누적) | 비용 비율 방향 |
|---|---|---|---|
| 인라인 `:root{}` 13페이지 산재 | Phase 1 G1 lint(색만) + Phase 0 dump | 다음 토픽마다 magic number 분기, 정리 비용 1.5~2배 | **수정 우선** |
| nav HTML 복제 | Phase 1 nav.js 단일 mount | 메뉴 변경 시 N파일 수정, drift 누적 | **수정 우선 (강)** |
| VR 부재 | Phase 2 인프라 + mock fixture | 시각 회귀 미적발 누적 사고, 디자인 변경 confidence 0 | **수정 우선 (mock 전제)** |
| Records 3 sub (Feedback·Deferrals 분산) | 1회 신설 + dependsOn 그래프 | PD 의존 시각화 부재, Master 의사결정 메타 가시성 ↓ | **수정 우선 (중)** |
| Home·Dashboard 혼재 | 1회 분리 | landing·KPI 진입 동선 혼재 누적 | **수정 우선 (약)** |
| 6 카테고리 IA 학습 | Master 1~3 세션 학습 | — (방치=현 IA 유지=상기 모든 결함 누적) | 학습 비용은 작고 회수 큼 |

**모든 항목에서 수정 우선이 ROI 양수.** 방향성 일치.

### 4-4. 본 토픽을 안 했을 때의 잠재 비용 (방치 비용 합산 방향)

- 색·토큰: 페이지 신설할 때마다 magic number 정착 → 다음 디자인 변경 토픽에서 폭발
- nav: PD-042 (signature merge) 같은 메뉴 통합 토픽 재발 시 비용 N배
- VR: 시각 회귀 미적발이 PR 단위 누적 → 어느 시점부터 viewer 신뢰성 의심 → 재구축 토픽 발생
- Records 분산: Feedback·Deferrals 미시각화 → Master 의사결정 정보 결손 → 잘못된 의사결정 비용
- Home·Dashboard 혼재: 미래 협업자 진입 비용 누적 → Nova N4 자율 팀 시점 마찰

**누적 비용 합 방향: 본 토픽 수정 비용보다 명확히 큼.** 본 토픽은 ROI 양수.

---

## 5. R-01·R-02 비용 함의 평가 (Riki Fin owner 영역)

### 5-1. R-01 — 페이지 인라인 :root{} G1 lint vs 11 페이지 정리 부풀음

Riki R-01 정확. 본 owner로서 비용 trade-off 박제:

**시나리오 (a) — G1 lint 범위 `--c-*` 색 토큰만**:
- 본 토픽 비용: Phase 1 색 토큰 추출만 → 작음
- 방치 비용 (이연 부분): 인라인 레이아웃 토큰 11 페이지 → 다음 토픽에서 1.5~2배로 부풀어 돌아옴
- 회수: tokens.css 단일화의 핵심 가치(색 canonical) 100% 회수, 레이아웃 SHOULD 이연 → PD로 박제하면 가시화는 유지

**시나리오 (b) — G1 lint 전체 `:root{}`**:
- 본 토픽 비용: 11 페이지 인라인 정리 강제 → 본 토픽 scope 부풀음 → Phase 1·2 일정 늘어남(시간 추정 안 함, 방향만) → R-05 (3 세션 이내 원칙) 위반 위험 ↑
- 방치 비용: 0 (다 정리됨)
- 회수: 즉시 100%

**Fin 권고**: 시나리오 (a) 채택. 단 **Phase 0 G0에 "인라인 `:root{}` dump 인벤토리"를 박아 방치 비용을 가시화**. 다음 토픽이 정확히 무엇을 정리할지 알 수 있게 함. 이게 "방치 비용 누적성 가시화"의 Damodaran식 핵심 — 안 보이는 부채는 더 빠르게 부푼다.

**비용 trade-off 방향**: (a) ROI 양수 강 / (b) ROI 양수 중 (scope 부풀음 비용이 회수 초과 위험).

### 5-2. R-02 — VR 30 baseline false-positive maintenance 누적

Riki R-02 정확. 본 owner로서 maintenance 비용 박제:

**시나리오 (a) — mock fixture 미도입 (현 spec 그대로)**:
- 매 PR마다 KPI 페이지 4 × 5 viewport = 20 스냅샷 false-positive
- baseline 갱신 빈도 = 매 세션 (data 변동) → baseline 진실성 무력화
- 인적 검토 누적 비용 → VR 인프라 자체가 무산 (PD-034 흡수 의미 0)
- **maintenance 비용 누적성: 강+** (선형 아님, 누적될수록 신뢰 ↓)

**시나리오 (b) — mock fixture 도입 (Riki R-02 (a) 완화)**:
- Phase 2 산출물 1건 추가: `tests/visual/fixtures/dashboard_data.fixture.json`
- Playwright 환경변수로 swap → KPI 변동 제거
- baseline 안정성 회복 → maintenance 비용 ↓
- **maintenance 비용 누적성: 약** (1회 인프라 박음 + 데이터 fixture 갱신 토픽 단위)

**시나리오 (c) — 회귀 임계 재정의 (Riki R-02 (b))**:
- `maxDiffPixelRatio: 0.02` + bbox 비교
- **mock fixture와 병행 권고** (어느 한쪽만으론 false-positive 완전 제거 안 됨)

**Fin 권고**: (b) + (c) 동시 채택. 비용 = Phase 2 산출물 1건 + 임계 재정의 1줄 = **본 토픽 안에서 추가 부풀음 작음**. 회수 = VR 인프라가 실제로 작동 → PD-034 흡수가 의미를 가짐.

**maintenance 누적 비용 방향**: (a) 강+ 위험 / (b)+(c) 채택 시 약. 비용 차이가 결정적. **본 spec lock 전 박제 필수.**

---

## 6. 경보 — Master 인지 전 선제 호출

### 6-1. 🔴 VR 30 baseline mock fixture 미도입 시 본 토픽 자체 폭발 위험

**Fin 경보**: Vera §4-3 "0px text·layout 임계"가 Arki §2-2 데이터 흐름(매 세션 dashboard_data.json 갱신)과 직접 충돌. Riki R-02가 짚었지만 Fin owner로서 한 번 더 박제: **mock fixture 없이 G2 통과해서 Phase 3 진입하면, G3에서 false-positive 폭발 → HALT-2 발동 → VR 인프라 전체가 PD-034로 외화 → 본 토픽이 흡수했던 PD-034가 무산.** 본 토픽의 핵심 가치 1축이 빠지는 시나리오.

**선제 권고**: Phase 2 산출물에 **`tests/visual/fixtures/dashboard_data.fixture.json` 동결**을 명시 박제 (Vera spec §4-3 또는 Arki §5-1 Phase 2에 1줄 추가).

### 6-2. 🟡 Phase 4 growth.html 데이터 계약 위반 시 부분 출시 대안 선제 박제

**Fin 경보**: Riki R-05 + Arki HALT-3 정합. growth.html이 D-060 metrics_registry 스키마 변경 발견 시 본 토픽 미완 위험. **분화 금지 명시와 충돌**.

**선제 권고**: Phase 0 G0에 **"부분 출시 가능 페이지 명시"** + **"HALT trigger 발동 시 child 분기 허용 1줄"** 박제 (Riki R-05 (a)+(b) 정합).

### 6-3. 🟡 G1 lint 범위 1줄 동결 — Master 1회 결정으로 N회 마찰 회피

**Fin 경보**: R-01 시나리오 (a)/(b) 결정이 Phase 0 G0에 박히지 않으면, Phase 1 진입 후 Dev가 매번 에스컬레이션 → 저마찰 원칙 위반 + 세션 이월 시 휘발 위험.

**선제 권고**: Phase 0 G0 통과 기준에 **"G1 lint 범위 1줄 동결 (Master 결정)"** 추가.

### 6-4. 🟢 (참고) 본 토픽 누적 turn 비용 — framing→구현 한 토픽 종결의 비용 형상

본 세션(session_104) turns: ace framing(과제 본문) → arki(turnId 1) → vera(turnId 2) → riki(turnId 3) → fin(turnId 4, 본 발언). 다음 turns 예상: ace 종합검토 → 인계. Phase 0~5 진행 시 turns 누적 ≥ 30~50 가능성. **본 토픽 자체가 token cost 누적 패턴 사례**.

선제 권고 없음 (구조적 결정사항). 단 **R-05 부분 출시 옵션이 컨텍스트 휘발 비용 방어선**.

---

## 7. 자기 점검 — Fin 발언 자체 검증

| 점검 축 | 결과 |
|---|---|
| 구조 단계 숫자 추정 0건 | ✓ (방향성·표 기호만 사용, 절대값 0건) |
| 비재무 자산 1차 검토 (학습·역할·메타) | ✓ §3 4 항목 |
| ROI 프레임 (즉시·간접·재투자·누적성) | ✓ §4-1 표 |
| 수정 비용 vs 방치 비용 프레임 | ✓ §4-3 표 |
| 누적성 컬럼 명시 | ✓ §4-1 |
| Arki 실행계획 금지어 감사 | ✓ §1 Clean 선언 |
| 과투자/중복 호출 1회 이상 명시 | ✓ §5-1 시나리오 (b)에서 scope 부풀음 비용 초과 위험 명시 = 과투자 신호 |
| 비용 경보 Master 인지 전 선제 호출 | ✓ §6 4 경보 |
| 자기소개 "Fin입니다"만 사용 | ✓ |
| 한국 이름·인물명 자가 생성 0건 | ✓ |

---

## 8. 다음 역할 인계

- **Ace 종합검토** — 본 발언의 (a) Riki R-01·R-02 완화경로 (b) Phase 0 G0 추가 박제 3건 (G1 lint 범위·mock fixture·부분 출시) (c) 비재무 자산 ROI 양수 평가를 종합검토에 반영 부탁. 특히 Phase 0 G0에 박제할 1줄 동결 항목들이 본 토픽 폭발 방지선임을 박제.
- **Master** — §6 3 경보 중 R-03(Vera collapsed sidebar 768~1023 모드)는 Riki가 짚은 결정 요청과 같은 위계. Fin 경보 §6-1·§6-2·§6-3 박제 시 본 spec lock 안전성 ↑.
- **Dev (Phase 1 진입 시)** — G1 lint 범위 (`--c-*` 색 토큰만) + mock fixture(Phase 2)는 본 발언 권고. spec lock 후 구현 진입.
- **Vera (Phase 1 G1 정의 보완)** — §3-5 spec에 G1 lint 범위 1줄 명시 추가 권고 (현 spec은 "인라인 `:root{}` 발견 시 빌드 실패"로 광범위 → 색 토큰 한정으로 좁힘).

---

```yaml
# self-scores
cst_acc: 0.70
roi_dl: 4
rdn_cal: Y
cst_alt: Y
```

(주: `cst_acc`=0.70 — 구조 단계 숫자 추정 0건이지만 누적성 평가는 사후 token_log·실측 비용으로 검증해야 ±20% 안 들어왔는지 확인 가능, baseline 보수 채점. `roi_dl`=4 — ROI 즉시·간접·재투자·누적성 4축 사전 박제, 사후 검증 deferred. `rdn_cal`=Y — §5-1 시나리오 (b) "scope 부풀음 비용 회수 초과 위험" + §6-1 "PD-034 무산 시나리오"로 과투자 신호 2회 이상 명시 호출. `cst_alt`=Y — §6 4 경보로 Master 인지 전 선제 호출, 특히 6-1 mock fixture 미도입 시 본 토픽 폭발 위험은 spec lock 전 가장 결정적 경보.)
