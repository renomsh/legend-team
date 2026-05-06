---
topicId: topic_174
role: riki
rev: 1
turnId: 1
invocationMode: subagent
createdAt: 2026-05-06
title: "Vera Claude Design Growth 개편 계획 — 리스크 감사"
---

# Riki — 리스크 감사

## 감사 전제

Arki rev1 전문 정독 완료. growth.html 직접 확인 완료. tokens.css 토큰 체계 확인 완료. 3대 필터(실재성·확신·기여도) 엄격 적용.

---

## 리스크 항목

### 🔴 R-1. Arki 개편 방향의 미존재 토큰 참조

**원문 인용:** Arki rev1 §2 Role Cards 개편 방향:
> "카드 hover 색을 `rgba(var(--c-ace-rgb), var(--alpha-3))` 패턴으로 토큰화"

**실제 확인:** `app/css/tokens.css` 전체 검색 결과 — `--c-ace-rgb` 토큰 존재하지 않음. 현재 토큰은 `--c-ace: #8B5CF6` (hex 단값)과 `--alpha-3: 0.25`만 존재. RGB 분리 토큰 패턴 (`--c-ace-rgb: 139,92,246`) 미선언.

**실패 시 파손 범위:** Vera가 이 지시를 그대로 따르면 `rgba(var(--c-ace-rgb), var(--alpha-3))` CSS는 브라우저에서 무효값이 된다. role-card hover border가 투명해지고, 기존 하드코딩된 `rgba(139,92,246,.35)` 제거 후에는 hover 효과 자체가 소실된다. Vera 시안과 실제 구현 간 육안 차이가 발생해 Phase 1 리뷰에서 검출이 어렵다(시안은 static mockup이므로 CSS 에러가 숨겨짐).

**완화 조건:** Arki 개편 방향 수정 2가지 선택지:
- A) `--c-ace-rgb: 139,92,246` 토큰을 tokens.css에 추가 후 패턴 사용 (토큰 추가 = tokens.css 변경 → lint-inline-root-color 범위 밖이므로 별도 검증 필요)
- B) CSS custom property alpha 변환 없이 `--c-ace-fallback: #9F75F8` 사용 + 고정 alpha (hover accent 전용이므로 fallback이 margin 1.47로 더 안전)

**fallback:** Phase 0-B에서 hover color 토큰화 시 선택지 B로 구현. 구현 전 Vera에게 boundary condition 재전달 필수.

---

### 🔴 R-2. lint 게이트가 빌드 체인에 없다

**원문 인용:** Arki rev1 §4 검증 게이트:
> "G0: lint-inline-root-color.ts 통과, G1: lint-contrast.ts 통과"

**실제 확인:** `scripts/build.js` 및 `scripts/auto-push.js` — lint 스크립트 호출 없음. `SessionEnd` 훅 체인: `session-end-tokens.js → session-end-finalize.js → compute-dashboard.ts → build.js`. lint-contrast.ts, lint-inline-root-color.ts는 **수동 실행 전용**. 자동 게이트가 아니다.

**실패 시 파손 범위:** Vera 시안 → Dev 구현 → 세션 종료 흐름에서 lint를 수동으로 실행하지 않으면 WCAG 위반 색이 배포된다. `--c-ace` ALARM 상태(4.64:1, margin 0.14)에서 Vera가 새 색 조합을 추가할 경우, 검증 없이 Cloudflare Pages에 그대로 올라간다. Arki 문서에 "자동 발동"이라고 표현되어 있어 실제로 자동이라는 가정 하에 진행할 위험이 있다.

**완화 조건:** Phase 2 구현 완료 후 `npx ts-node scripts/lint-contrast.ts && npx ts-node scripts/lint-inline-root-color.ts` 명시적 수동 실행을 게이트 조건으로 체크리스트에 박제. 또는 auto-push.js 훅 체인에 lint 추가(이번 scope 외이므로 수동 실행이 현실적).

**fallback:** Phase 2-A 완료 시점에 Edi spec에 "수동 lint 실행 확인" 항목을 필수 체크리스트로 명시.

---

### 🟡 R-3. PD-029 resolveCondition의 "실사례 3건" 계수 기준 미정의

**원문 인용:** PD-029 resolveCondition (system_state.json):
> "Vera 또는 Arki의 Claude Design 호출 실사례 3건 이상 누적 + Master 리뷰 요청"

**실제 확인:** topic_091(D-064) → topic_101(Vera signature review — Claude Design 호출 여부 불명확) → topic_174(본 토픽). "실사례 3건"의 계수 기준이 불분명하다:
- Claude Design UI를 열어서 시안을 생성하면 1건인가?
- Vera가 시안 작성 후 Claude Code로 handoff bundle을 넘기면 1건인가?
- Growth 개편의 경우 Vera(시각 spec) + Arki(토폴로지)가 각각 호출하면 2건인가 1건인가?

**실패 시 파손 범위:** topic_174 완료 후 Nexus 또는 Master가 PD-029를 resolved 처리하려 할 때 "이미 달성"(3건 충족)과 "미달성"(1건으로 카운트) 중 어느 판정을 내릴지 불명확. 토픽 174가 PD-029의 마지막 토픽인지 아닌지 결정 불가.

**완화 조건:** Master에게 계수 기준 1줄 확인: "토픽 단위로 카운트(토픽당 1건) vs Claude Design 실행 횟수 카운트". 이번 Phase 1 리뷰 이전에 확인하면 충분.

**fallback:** 불명확 시 보수적 계수(토픽당 1건)로 운영. topic_091(1건) + topic_174(1건) = 2건 → 1건 부족.

---

### 🟡 R-4. Phase 0-A/0-B 병렬 충돌 — `const ROLE_COLOR` 제거 타이밍

**원문 인용:** Arki rev1 §4 Phase 분해:
> "0-B. Dev → ROLE_COLOR 이중 정의 제거 + hover color 토큰화 (선제 정리로 Vera 시안과 충돌 방지)"

**실제 확인:** growth.html L174의 `const ROLE_COLOR`는 JS 렌더링 함수(renderRoles)가 직접 참조하는 변수다. 0-B에서 이를 제거하고 role-colors.js `ROLE_COLORS`로 단일화할 때, role-colors.js는 `document.documentElement` 스타일에서 런타임에 tokens.css 값을 읽는 Proxy다. 페이지 로드 전에 `getComputedStyle`이 실행되면 `rgb(0,0,0)` fallback이 반환될 수 있다.

구체적으로: role-colors.js의 Proxy getter가 `window.getComputedStyle(document.documentElement).getPropertyValue('--c-{role}')` 패턴이라면, DOMContentLoaded 이전 호출 시 빈 문자열 반환 → `#000000` fallback → 모든 role-card 검정색 점.

**실패 시 파손 범위:** Growth 페이지 role card 색상 전체 소실. 시각적으로 즉시 확인 가능하므로 배포 전 발견 가능성 높음. 단, Vera 시안 생성(0-A)이 병렬 진행 중이면 시안 기반 판단과 실제 렌더 간 불일치가 발생한다.

**완화 조건:** 0-B 구현 후 브라우저 로컬 확인(G4 조건) 선 통과 후 0-A Vera 시안과 통합 리뷰. 또는 role-colors.js 호출 타이밍을 `DOMContentLoaded` 이후로 고정 확인.

**fallback:** 0-B 결과 role card 색 소실 확인 시 growth.html에 인라인 fallback 임시 유지하고 Phase 2에서 정리.

---

## 의도적 제외 (기각한 가정)

- **"Claude Design 시안이 P3 hidden policy를 위반할 것"**: Vera는 이미 growth.html 구조를 알고 있고, Arki가 §3-A-3에서 명시 전달한다. 위반 가능성은 있으나 확신이 없어 제외. Arki가 이미 중단 조건으로 처리.
- **"fetch 경로 4개가 개편 중 변경될 것"**: Vera는 CSS/HTML 레이어 작업이고 JS fetch 로직은 변경 범위 밖. 실재 리스크 없음.
- **"components.css 공유 클래스 오염"**: Arki가 C-2에서 "공유 클래스 변경 금지" 명시. Vera 작업 범위는 page-local CSS. 중복 지적 무효.
- **"metrics-utils.js renderTier3() 깨짐"**: 이번 개편의 §4 Raw Aggregates 섹션은 "개편 범위 최소"(Arki). renderTier3() 변경 없음. 리스크 없음.

---

[ROLE:riki]
# self-scores
crt_rcl: 0.80
cr_val: Y
prd_rej: Y
fp_rt: 0.00
