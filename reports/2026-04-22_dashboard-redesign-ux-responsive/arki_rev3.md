ARKI_WRITE_DONE: reports/2026-04-22_dashboard-redesign-ux-responsive/arki_rev3.md

---
role: arki
topic: Dashboard 개편 — 인터페이스 UX + 반응형 프레임 (전면 IA 개편)
topicId: topic_082
session: session_104
date: 2026-04-25
rev: 3
phase: phase-0-execution
grade: S
turnId: 10
invocationMode: subagent
recallReason: phase-0-execution
splitReason: post-dev-recall
status: g0-1-2-3-locked
artifacts_produced:
  - reports/2026-04-22_dashboard-redesign-ux-responsive/inventory.md (G0-1)
  - reports/2026-04-22_dashboard-redesign-ux-responsive/legacy-decision.md (G0-2)
  - reports/2026-04-22_dashboard-redesign-ux-responsive/ia-spec.md (G0-3)
---

# Arki Phase 0 G0-1·G0-2·G0-3 박제 + Dev rev1 양방향 협의 재합의

Arki입니다. ace rev3(turnId 8) spec lock 선언 + Dev rev1(turnId 9) 실측·양방향 협의 응답 흡수해 G0-1·G0-2·G0-3 3 산출물을 동결 박제했습니다. PD-045 deprecated 반영. Dev 인수 5건 그대로, 협의 2건(D-feedback-6·-7) Arki 답, 보류 1건(D-feedback-4) 처리 방향 박제. 새 옵션 탐색 0건.

---

## 1. 산출물 박제 위치

| # | 산출물 | 경로 | 상태 |
|---|---|---|---|
| G0-1 | inventory | `reports/2026-04-22_dashboard-redesign-ux-responsive/inventory.md` | locked-for-dev |
| G0-2 | legacy-decision | `reports/2026-04-22_dashboard-redesign-ux-responsive/legacy-decision.md` | locked-for-dev |
| G0-3 | ia-spec | `reports/2026-04-22_dashboard-redesign-ux-responsive/ia-spec.md` | locked-for-dev |

3 산출물 모두 frontmatter `status: locked-for-dev`. ace rev3 §3-1 G0 owner 표 정합 (Arki 단독 owner). 다음 Vera turn(turnId 12)이 G0-4·-6·-7·-9 박제, Ace(turnId 13)가 G0-8 박제 후 G0 PASS 선언.

---

## 2. PD-045 deprecate + PD-046~PD-050 정리 흡수

Dev §A-3 실측 결과(active 페이지 색 토큰 인라인 1건만, 레이아웃 토큰 인라인 0건)에 따라 PD-045 ("13 페이지 인라인 색·레이아웃 토큰 산재 정리") deprecated 박제. inventory §8에 정리표 동결.

| PD | 처리 | 위치 |
|---|---|---|
| PD-045 | **deprecated** — 명분 소멸 (Phase 1 G1이 1건 + base 산재 7건을 한 트랙에서 흡수) | inventory §8 |
| PD-046 | 신설 — dashboard-ops 컴포넌트 흡수 (D-090 부수) | inventory §8 / §7-2 |
| PD-047 | 신설 — semantic state 토큰(`--ok`·`--warn`·`--bad`) tokens.css 흡수 결정 | inventory §8 |
| PD-048 | 신설 — mock fixture·docker image 갱신 주기 (D-089 운영 PD) | inventory §8 |
| PD-049 | 신설 (조건부) — dpr 2 baseline 확장 | inventory §8 |
| PD-050 | 신설 (조건부) — accent-only lint 동적 JS 색 주입 검출 (B2 발동 시) | inventory §8 |

본 토픽 inventory에서 "13 페이지 산재 가정"은 폐기. Dev 실측이 단일 fact base.

---

## 3. Dev rev1 양방향 협의 8건 재합의

### 3-1. 인수 5건 (Arki 그대로 채택)

| D-fb | Dev 응답 요지 | Arki 재합의 | spec 반영 위치 |
|---|---|---|---|
| **1** ECharts resize observer | 단일 ResizeObserver broadcast 패턴 | **인수**. Phase 2 G2 진입 시 구현. arki rev2 §2-2 "ECharts wrapper 함수: viewport resize observer + chart.resize()"와 정합 | arki rev2 §2-2 그대로 |
| **2** nav.js active state | `data-active="true"` 채택, CSS 셀렉터 `[data-active="true"]` | **인수**. ia-spec.md §2-2에 박제 완료. CSS specificity 안정 + nav.js 단일 setter export 정합 | ia-spec §2-2 |
| **3** Playwright 외 도구 | docker pin으로 종결, HALT-2 발동 0 가정 | **인수**. arki rev2 §2-2 HALT-2 trigger만 보유. Master #17(D-089) 박힘 | arki rev2 §2-2 |
| **5** G1 lint 구현 패턴 | 3 스크립트 분리 + skeleton 박제 | **인수**. inventory §6에 4 scripts 박제. `lint-inline-root-color.ts` callable 재사용 ~30 LOC. 단일 스크립트 reject 사유 4건 정합 | inventory §6 |
| **8** hidden state | nav.js `data-state="pending"` + click disable + tooltip + `aria-disabled="true"` + `tabindex="-1"` | **인수**. Dev a11y 보강(`aria-disabled`·`tabindex="-1"`)이 WCAG AA 정합 강화 → 그대로 흡수. ia-spec §6-2에 박제 | ia-spec §6-2 |

### 3-2. 협의 2건 — Arki 단일 답

#### D-feedback-6: contrast 13조합 자동 계산 — `design:accessibility-review` skill vs 자체 구현

**Dev 권고**: 자체 구현 (`lint-contrast.ts` ~50 LOC, CI 안정성·offline 가능). skill은 신규 페이지 1회 audit용으로만.

**Arki 답**: **자체 구현 채택**. 사유 3건:

1. **빌드 결정성 우선** — `build.js` 진입 시점에서 deterministic하게 PASS/FAIL 판정해야 G1·G3 게이트가 작동. skill 호출은 외부 의존 + invocation latency + 비결정성(skill 응답 텍스트 파싱) 문제. CF Pages 빌드는 비대화형이므로 skill 호출 부적합.
2. **WCAG ratio 공식 단순** — sRGB linearization + relative luminance + (L1+0.05)/(L2+0.05) — 표준 공식 ~50 LOC 구현 가능. 정확도 검증은 known-good 1쌍(`#FFFFFF on #000000 = 21:1`) unit test로 충분 (Dev §F-5 정합).
3. **신규 페이지 audit은 별도 skill 호출 유지** — Phase 4 진입 시 `design:accessibility-review` skill을 growth·people·deferrals 3 페이지 1회 audit용으로 manual 호출. 빌드 lint와 분리 운영 → 책임 명확.

**spec 반영**: inventory §6 `lint-contrast.ts` 자체 구현 + Phase 4 진입 시 신규 페이지 manual skill audit 1줄 박제. Vera G0-9 contrast-lint.config.md에 동일 정합.

#### D-feedback-7: D3 dependsOn 그래프 layout — force-directed (N=35) vs tree (N=50+)

**Dev 권고**: force-directed + N=50 이상 자동 tree fallback.

**Arki 답**: **force-directed 기본 + N≥50 자동 tree fallback 채택**. 사유 3건:

1. **dependsOn 관계의 본질이 그래프** — PD 간 의존은 DAG 가정이 깨질 수 있음(상호 참조 가능). force-directed가 cyclic·multi-parent 모두 자연 시각화. tree는 단일 parent 가정이 깨지면 시각 왜곡.
2. **N=35 현재 시점 force-directed 충분** — Riki §6 의도적 제외 + Fin §2-3 누적성 약-중. force-directed 노드 35개는 폭발 위험 낮음.
3. **N=50 임계 자동 fallback** — 노드 수 50 이상 시 force-directed 시뮬레이션 비용·시각 폭발 → tree layout(parent 우선 단순화) 자동 전환. 임계는 1줄 spec으로 박제, Phase 4 진입 시 Dev 구현.

**spec 반영**: ia-spec §4 4 entity 매트릭스의 PD `dependsOn 그래프 노드 클릭` 라우팅 정합. Phase 4 G4 산출물에 "force-directed (N<50) / tree (N≥50)" 1줄 박제 권고. arki rev2 §2-4 컴포넌트 catalog "pd-card+dependsOn-graph(D3)"에 layout spec 추가.

### 3-3. 보류 1건 — D-feedback-4: growth.html 외부 차트 lib

**Dev 응답**: 보류. Phase 4 진입 시 D-060 metrics_registry 데이터 형태 본 후 결정.

**Arki 처리 방향**: **현 시점 ECharts·D3 단일 채택, B3 trigger 발동 시에만 외부 lib 도입 검토**. 사유:

- Hard breaker B3(D-060 metrics_registry 스키마 변경)이 발동하면 child 토픽 분기 허용되며, 그 시점에 외부 lib 필요성 함께 검토.
- B3 발동 0이면 ECharts(시계열·KPI grid·signature panel) + D3(dependsOn 그래프) 2 라이브러리만으로 본 토픽 5 페이지(Dashboard×2·Growth·Records/Sessions Turn Flow·Records/Deferrals) 모두 처리.
- Phase 4 진입 시점에 D-060 ledger read → metrics_registry shape 확인 → ECharts 표현 가능 여부 판정 → 불가 시 PD 신설 후 B3 발동 검토. 현재는 PD 0으로 격리.

**spec 반영**: inventory §3-1 Growth 페이지 spec "D-060 안 β + 3축 헤더 + 4×2 panel"는 ECharts 단일 가정. arki rev2 §2-4 G4 검증 게이트 "growth.html이 D-060 metrics_registry 소비 성공 (스키마 변경 0)" 정합.

---

## 4. arki_rev2 §7 자기감사 라운드 2 추가 발견 (라운드 3, sa_rnd 가산)

본 turn에서 G0-1·-2·-3 박제하며 추가 결함 자가 적출. 라운드 3.

| # | 발견 | 영역 | ROI | 대응 |
|---|---|---|---|---|
| #11 | inventory §3-1 Records 5 sub `records.html` 단일 vs 5 파일 분리 결정이 arki rev2에서 명시되지 않았었음 | structuration | MUST_NOW | inventory §3-1에 "5 파일 분리 채택" + 단일 추천 사유 박제 완료 |
| #12 | ia-spec §2-3 second-nav 위치(사이드바 expand vs 페이지 내부 탭) 결정이 arki rev2 §1-3에 명시되지 않았었음 (Vera rev1·rev2 §7-2 wireframe만 페이지 내부 탭 가정) | structuration | MUST_NOW | ia-spec §2-3에 "페이지 내부 second-nav-tab 채택" + 옵션 비교 박제 완료 |
| #13 | inventory §1 active 9 페이지에 `system.html` 미포함이지만 §3-1 to_create N9에 system.html 신설 명시 — arki rev2 §1-1 `to_create` 3건(growth·people·deferrals)에서는 system.html 누락 | structuration | MUST_NOW | inventory §3-1에 N9 `system.html` 신설 명시 + ia-spec §1 사이드바 트리 6번째에 System 박제 완료 |
| #14 | legacy-decision §3-1 build.js patch가 `app/legacy/` prefix exclude 단일 패턴 — 향후 다른 legacy 카테고리(예: deprecated component) 발생 시 prefix 추가만으로 확장 가능. 우려 0 | extensibility | NICE | NICE 유지 — 현재 v3-variants 단일 카테고리 |
| #15 | ia-spec §4 4 entity 매트릭스에서 Decision → PD `resolveCondition target PD` 링크는 새로 추가된 D-057 PD 자동 전이 시스템 정합. 단 read-only 표시이므로 단방향 링크만 박제 | structuration | NICE | NICE 유지 — Phase 4 진입 시 deferrals.html 구현 시 검증 |

라운드 3 발견 = 5건. MUST_NOW 3건은 모두 G0-1·G0-3에 흡수 박제 완료. NICE 2건은 명시 보류.

**자발적 라운드 종료 사유**: 라운드 3에서 발견된 MUST_NOW 3건이 모두 산출물에 흡수되었고, NICE 2건은 Phase 4 진입 시 자연 검증. Master/Ace 추가 압박 시 라운드 4 가능. 본 turn은 G0-1·-2·-3 동결 완료 상태로 충분.

**scopeDriftCheck**: rev2 → rev3 변경량 = 약 1.05배 (G0-1·-2·-3 산출물 위치만 외부 파일로 분리, 실내용은 arki rev2 §1-1·§1-2·§1-3 + Vera rev2 §7 흡수 + Dev rev1 §A-D 흡수). 원 spec 1배 내(Master 결정 흡수). PD 분할 제안 0.

---

## 5. Master/Dev 보고용 요약

### 5-1. 본 turn 처리 항목 (3 deliverables + 1 report)

1. **G0-1 inventory.md** 박제 (active 9 + legacy 4 + 신규 7 + partial 3 + css 1 + scripts 4 + dashboard-upgrade vs ops 정리 계획 + PD 정리)
2. **G0-2 legacy-decision.md** 박제 (4 변종 archive 경로 `app/legacy/archive/v3-variants/` + 시점 Phase 0 G0 직후 + build.js patch + 회수 트리거 명시)
3. **G0-3 ia-spec.md** 박제 (사이드바 6 메뉴 + Records 5 sub + Dashboard 2 sub + Sessions 3탭 + 4 entity 매트릭스 + Home 5 카드 진입점 + 부분 출시 게이트 + B1·B2·B3)
4. **arki_rev3.md** 본 보고 (PD-045 deprecate + Dev D-feedback 8건 재합의 + 자기감사 라운드 3 5건)

### 5-2. Dev 양방향 협의 8건 응답 요약

- 인수 5건 (D-fb 1·2·3·5·8) — Dev 응답 그대로 채택, spec 반영 위치 명시
- 협의 2건 (D-fb 6·7) — Arki 단일 답: contrast 자체 구현 채택 / D3 force-directed + N≥50 tree fallback 채택
- 보류 1건 (D-fb 4) — B3 trigger 발동 시에만 외부 lib 검토, 현 시점 ECharts·D3 단일 채택

### 5-3. 다음 호출 권고 (ace rev3 §5-3 호출 사이클 정합)

| turnId | Owner | 산출 |
|---|---|---|
| 11 (현재 = 본 turn) | Arki | G0-1·-2·-3 박제 + Dev 협의 재합의 → **DONE** |
| 12 | Vera | G0-4 token-axes-spec.md + G0-6 wireframe 4종 + G0-7 vr-mock-fixture·bbox-regions + G0-9 contrast-lint.config |
| 13 | Ace | G0-8 spec-lock-decisions.md + G0 PASS 선언 |
| 14 | Dev | Phase 1 G1 진입 — tokens.css·nav.js·partial 디렉토리·lint-inline-root-color.ts |

본 세션(session_104) turnId 13까지 G0 PASS 가능. 다음 세션 진입 시 Read만으로 컨텍스트 복원선 = G0-1·-2·-3 + dev_rev1 + ace_rev3.

### 5-4. Master 확인 필요 항목

| # | 항목 | 답 형식 |
|---|---|---|
| 1 | Records 5 sub = 5 파일 분리 (`/topic.html`·`/session.html`·`/decisions.html`·`/feedback.html`·`/deferrals.html`) 채택 승인 | ✅ / 수정 |
| 2 | second-nav 위치 = 페이지 내부 second-nav-tab 채택 (사이드바 expand 아님) 승인 | ✅ / 수정 |
| 3 | `system.html` 신설 (System 카테고리) 채택 승인 | ✅ / 수정 |
| 4 | archive 경로 `app/legacy/archive/v3-variants/` + 이동 시점 Phase 0 G0 박제 직후 승인 | ✅ / 수정 |
| 5 | D-feedback-6·7·4 Arki 답(자체 구현 / force-directed + N≥50 tree / 보류) 승인 | ✅ / 수정 |

답 후 Vera turnId 12 dispatch. orchestrationMode auto면 자동 진행.

---

## 6. 자기 점검

| 점검 축 | 결과 |
|---|---|
| 자기소개 "Arki입니다"만 (F-013) | ✓ |
| 금지어 v0(절대 시간·인력 배정·공수 단위) | ✓ Phase·게이트·turnId만 |
| frontmatter turnId 10 / invocationMode subagent / recallReason "phase-0-execution" | ✓ |
| 3 산출물 별도 write + arki_rev3 본 보고 = 4 file | ✓ |
| Dev 양방향 협의 8건 모두 응답 (인수 5·협의 2·보류 1) | ✓ §3 |
| PD-045 deprecate + PD-046~PD-050 박제 | ✓ §2 + inventory §8 |
| 자기감사 라운드 +1 | ✓ 라운드 3 (§4, 5건 발견) |
| spec drift 0 (lock 26항 변경 0) | ✓ |
| self-scores YAML 4 지표 | ✓ 아래 |

---

```yaml
# self-scores
aud_rcl: Y
str_fd: 5
spc_lck: Y
sa_rnd: 3
```

(주: `aud_rcl`=Y — Riki 5 리스크 + ace rev3 §1-3 미해결 점검 + Dev 양방향 협의 8건 모두 흡수, 누락 0건. `str_fd`=5 — 라운드 3 발견 #11(records 5 파일 분리 결정 누락) + #12(second-nav 위치 결정 누락) + #13(system.html 누락) + arki rev2 라운드 2 흡수 + Dev §F-1 결함(brace-balance 단순) 인지 = 5건. `spc_lck`=Y — G0-1·-2·-3 모두 frontmatter `status: locked-for-dev` 박제. `sa_rnd`=3 — 라운드 1(rev1) + 라운드 2(rev2) + 라운드 3(본 rev3 §4). Master 압박 시 라운드 4 가산 가능.)
