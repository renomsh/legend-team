---
role: arki
topic: Dashboard 개편 — 인터페이스 UX + 반응형 프레임 (전면 IA 개편)
topicId: topic_082
session: session_104
date: 2026-04-25
artifact: G0-2 legacy-decision
turnId: 10
invocationMode: subagent
recallReason: phase-0-execution
status: locked-for-dev
sources:
  - reports/2026-04-22_dashboard-redesign-ux-responsive/inline-root-dump.json
  - reports/2026-04-22_dashboard-redesign-ux-responsive/inventory.md §2
  - Master 박제 #14 (legacy archive)
---

# G0-2 Legacy Decision — v3 변종 4 archive 처리

Arki입니다. 본 문서는 Phase 0 G0-2 산출물. dashboard v3 계열 4 변종의 archive 이동·빌드 제외·복원 트리거를 단일 추천으로 동결합니다.

---

## 1. 대상 4 파일

| 파일 | 라인 | inline `--c-*` | inline layout | inline base | other tokens | 비고 |
|---|---:|---:|---:|---:|---:|---|
| `app/dashboard-v3-test.html` | 1004 | 0 | 4 | 4 | 20 (`--surface-*`·`--cyan-*` 등) | v3 1차 — surface 시스템 실험 |
| `app/dashboard-v3b-test.html` | 820 | 0 | 0 | 4 | 24 (`--r-*` 시리즈 등) | v3b — radius 시스템 실험 |
| `app/dashboard-v3c-test.html` | 775 | 0 | 0 | 5 | 19 (`--card-*`·`--grad-purple` 등) | v3c — gradient 실험 |
| `app/dashboard-v3d-test.html` | 576 | **8** (`--c-ace`·…·`--c-vera`) | 0 | 13 | 0 | v3d — 현재 dashboard-upgrade canonical 직접 파생본 |

**총 라인 합 = 3175**. 모두 `*-test.html` 명명으로 production 진입선 외 (현재도 사이드바 미노출 추정).

---

## 2. 처리 방향 단일 추천

### 2-1. archive 이동 (Master 박제 #14)

| 결정 항목 | 단일 추천 |
|---|---|
| **이동 경로** | `app/legacy/archive/v3-variants/` |
| **이동 방식** | `git mv` (history 보존) |
| **이동 시점** | **Phase 0 G0 박제 직후, Phase 1 진입 전** (Dev turnId 14 직전). 사유: Phase 1 G1 lint 작동 시점에 active set이 깨끗해야 false-positive 0. archive 이동을 Phase 4까지 미루면 G1 lint가 v3d-test.html 색 토큰 8개를 매번 무시 처리해야 함 |
| **사이드바 노출** | 미노출 유지 (현재도 미노출 추정 — 본 archive 결정으로 영구 미노출 박제) |
| **frontmatter 추가** | 4 파일 각 `<!-- archived: 2026-04-25, sessionId: session_104, originalPath: app/dashboard-v3*-test.html -->` 주석 line 1 삽입 |

### 2-2. archive 경로 후보 비교 (참고용)

| 후보 | 장점 | 단점 | 판정 |
|---|---|---|---|
| **`app/legacy/archive/v3-variants/`** (추천) | `app/` 안에 격리 → 빌드 디렉토리 일관, 검색 시 같은 트리, IDE 폴더 트리 청결 | `app/` scope에 legacy 디렉토리 추가 | **채택** |
| `archive/legacy-dashboards/` | repo root 격리, viewer scope 완전 분리 | build.js scan 로직이 `app/` 만 보던 가정 깨짐 — patch 추가 필요 | reject (build.js 변경 비용) |
| `app/templates/legacy/` | "templates" semantics — 재참조 의도 명시 | 본 4 파일은 재참조 안 함 (D-090에 의해 dashboard-upgrade가 canonical) — semantic 부적합 | reject |

채택 사유: `app/legacy/archive/v3-variants/`가 build.js와 scan-inline-root.ts 양쪽에서 `app/legacy/` 단일 prefix 제외 패턴으로 처리 가능. 향후 다른 legacy 카테고리 발생 시 `app/legacy/archive/<category>/` 동일 패턴 확장.

---

## 3. archive 후 처리 (4 항목)

### 3-1. 빌드 대상 제외 — `scripts/build.js` patch

```js
// scripts/build.js — Phase 0 archive 직후 patch
const LEGACY_PREFIXES = ['app/legacy/'];

function isLegacyPath(relPath) {
  const norm = relPath.replace(/\\/g, '/');
  return LEGACY_PREFIXES.some(p => norm.startsWith(p));
}

// dist 복사 단계에서 isLegacyPath() true인 경로 skip
// 결과: dist/app/legacy/ 디렉토리 미생성 → CF Pages 배포 0
```

검증: `node scripts/build.js` 실행 후 `dist/app/legacy/` 디렉토리 부재 확인. Phase 1 G1 진입 전 sanity check.

### 3-2. lint 대상 자동 제외

`scan-inline-root.ts`(Dev DONE)는 v3 변종 4건을 `active: false` 플래그로 분리. `lint-inline-root-color.ts`(Phase 1 G1)는 `if (!dump.active) continue;` 루프로 자동 제외 (Dev §B-3 skeleton 박제). archive 이동 후에는 스캔 자체에 잡히지 않음 → 이중 방어.

### 3-3. 사이드바 미노출

nav.js가 Phase 1 G1에서 6 카테고리 + Records 5sub + Dashboard 2sub만 mount. legacy 4 파일은 nav 항목 0건 — 자동 미노출.

### 3-4. git history 보존

`git mv app/dashboard-v3-test.html app/legacy/archive/v3-variants/dashboard-v3-test.html` 4회 실행. 4 파일 각 history 보존 → 향후 회수 트리거 발동 시 추적 가능.

---

## 4. 회수 트리거 (archive 복원 조건)

archive에서 다시 `app/` production 트리로 꺼낼 조건. **현재 시점 발동 0**.

| 트리거 | 정의 | 처리 |
|---|---|---|
| **Hard breaker B1 발동** | Cloudflare Pages 정적 정책 변경 → SSR/edge function 도입 결정 | 본 토픽 spec 무효 → archive 4건 검토 가능 (단 v3 계열은 정적 dark 디자인 실험본이므로 SSR 도입 시점에서도 회수 명분 약함) |
| **D-090 canonical 폐기** | dashboard-upgrade canonical 폐기 결정 + v3 계열 일부 컴포넌트 재채택 | 매우 낮음. Master 명시 결정 시에만 |
| **참조 필요 (디자인 reference 채광)** | 신규 페이지 디자인 시 v3 변종 컴포넌트 1~2건 참조 필요 | archive **이동 없이 read만**. partial로 일부 마크업 추출 가능 (단 본 토픽 scope 외 — PD) |

**회수 시점 기본값 = 발동 없음**. archive는 단방향 이동을 전제. 양방향 가정 시 복잡도 증가 → 현재 단방향 동결.

---

## 5. 통과 조건 (G0-2 PASS 체크)

| 통과 기준 | 결과 |
|---|---|
| 4 파일 명시 + 라인 수 | PASS — §1 표 |
| archive 경로 단일 추천 | PASS — `app/legacy/archive/v3-variants/` (§2-1) |
| 이동 시점 단일 추천 | PASS — Phase 0 G0 박제 직후, Phase 1 진입 전 (§2-1) |
| build.js dist 제외 patch | PASS — §3-1 skeleton |
| lint 대상 자동 제외 | PASS — §3-2 (Dev §B-3 정합) |
| 사이드바 미노출 | PASS — §3-3 (nav.js mount 0) |
| git history 보존 | PASS — §3-4 (`git mv` 사용) |
| 회수 트리거 명시 | PASS — §4 (B1 / canonical 폐기 / 참조 read) |

**G0-2 동결**. archive 이동 owner = Dev (Phase 0 G0 박제 직후 turn). build.js patch owner = Dev (Phase 1 G1 동시).
