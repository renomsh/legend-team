---
role: arki
topic: topic_110
session: session_107
phase: execution-plan
rev: 1
---

# Arki — G0.5 spec 정합 게이트 설계 (topic_110)

## 1. 결함 구조 진단

### 사슬 절단

- **절단점 α**: spec(D-094 / ia-spec / Vera wireframe / D-097) → 구현(HTML) 매핑 부재. 어느 페이지가 어느 spec 조항을 만족해야 하는지 파일 단위로 lock된 적 없음.
- **절단점 β**: G1~G5 surface가 코드 형식 + 런타임 동작에만 닿음. spec 정합은 어떤 게이트도 안 봄.

### 기존 게이트 surface

| 게이트 | 보는 것 | 못 보는 것 |
|---|---|---|
| G1 lint | --c-* 토큰, 색 하드코딩 부재 | 페이지에 어떤 섹션이 있어야 하는가 |
| G2 responsive | 320/768/1280 깨짐 여부 | 깨지지 않는 화면이 spec 화면인지 |
| G3 VR diff | baseline 픽셀 일치 | **baseline 자체가 spec인지 검증 안 함** — 잘못된 baseline lock 시 영구 통과 |
| G4 a11y | contrast / aria | spec 구조의 의미적 충족 |
| G5 release | 5페이지 200 OK | 배포된 5페이지가 spec 5페이지와 동일 정의인지 |

모든 게이트가 "있는 것의 형식"만 검증, "있어야 할 것의 존재"를 검증하지 않음. 양성 검증 부재 vs 음성 검증 편향이 핵심 결함.

### 사각지대

1. 파일 존재 자체 — `people.html` 부재가 G5에서 안 잡힘
2. 구조적 충족 — Home spec(Hero+5+Recent) 대신 AGENTS 8+TOPICS가 통과
3. canonical 전파 — D-097 dashboard-upgrade 외 0건인데도 통과
4. baseline 신뢰 — G3 baseline이 spec 화면 기준 검증 없이 lock

### 다시 안 끊어지려면

- 존재 검증 (existence): spec이 요구하는 파일/라우트/메뉴 항목이 실제로 있는가
- 구조 검증 (structure): 페이지 안에 spec 섹션·컴포넌트가 DOM/클래스 단위로 있는가
- 출처 일관성 검증 (source coherence): D-NNN ledger / ia-spec / Vera wireframe / D-097 canonical 간 drift 없는가

이 셋이 G1보다 앞 또는 G3 baseline 생성 전에 박혀야 baseline 무결성 확보.

## 2. G0.5 신규 게이트 설계

### 검증 대상

```
정본 (canonical):     memory/specs/ia-spec.md
                  +  app/dashboard-upgrade.html
                  +  memory/specs/page-checklist/<page>.md
파생 (derived):       D-094, D-097, Vera wireframe → 정본 reference 형태로 retrofit
```

### 검증 시점

**G1 앞 (G0.5)**. 근거: (i) G3 baseline 무결성 (G0.5 통과 후만 baseline lock 허용), (ii) lint 통과해도 spec 미충족이면 의미 없음, (iii) fail-fast 비용 절감. 추가로 G5 직전 G0.5 재확인 1회.

### 검증 방법

| 항목 | 자동 | 수동 |
|---|---|---|
| 사이드바 메뉴 ↔ 파일 매핑 | ✓ | — |
| 필수 DOM 셀렉터 존재 | ✓ | — |
| canonical 클래스 사용률 | ✓ | — |
| 필수 텍스트 키워드 매칭 | ✓ | — |
| 정본↔파생 cross-link 일관성 | ✓ | — |
| 시각적 의미 충족 | — | ✓ Vera review 1회/Phase |
| 카피 톤 일관성 | — | ✓ Vera review |

### PASS/FAIL 판정

- 메뉴↔파일 매핑: 100%
- DOM 셀렉터 충족률: 100%
- canonical 사용률: 5페이지 평균 ≥ 80%, 페이지별 ≥ 60% (※ Q3=b로 Phase C 직전 실측 lock)
- 키워드 매칭률: 100%
- cross-link 일관성: 100% (drift 0)
- Vera review sign-off: Phase당 1회

FAIL 시 G1 진입 차단. baseline 재lock 금지.

### fixture 박제 형식

YAML frontmatter + Markdown. selector·min_count·max_count·required_keywords·canonical_class_min_usage·sidebar_entry. 자세한 schema는 Dev 산출물 page-checklist/*.md 직접 참조.

## 3. Phase 분해 (분화 금지 — 본 토픽 안)

### Phase A — 정본 + checklist 박제

- 산출: `memory/specs/ia-spec.md` 정본화 / page-checklist 6 / `g0_5-spec-check.mjs` 초안 / D-094/D-097 STATUS / D-100 / 4-way diff
- 게이트: ia-spec ↔ D-094 ↔ D-097 ↔ Vera 4-way diff drift 0, runner self-check on canonical PASS
- 중단 조건: 4-way diff에서 정본 결정 불가능한 의미적 충돌 → Master 결정 요청

### Phase B — 6페이지 cross-check (report mode)

- 산출: 6페이지 G0.5 실측 리포트 / People 정책 ledger / 임계 후보 (i)(ii) 박제
- 게이트: 6 리포트 산출 + gap 정량화 + 임계 후보 박제 + Master Q-A 1회
- 중단 조건: 페이지 1개의 100% PASS가 canonical 재설계까지 요구 → Phase B hold + Master 문의
- fallback: 2세션 hard cap, 미달 시 (ii) 단일값 lock

### Phase C — G0.5 + G1~G5 통합 + baseline 재lock

- 산출: 페이지 갱신 / G0.5 PASS → G1~G5 재PASS → VR baseline 재생성 / 이전 baseline invalidate ledger
- 게이트: G0.5 100% + G1~G5 재PASS + VR baseline 신규 lock + Vera sign-off
- 중단 조건: baseline 재lock 시 Vera sign-off 미박제 → lock 보류

## 4. 리스크 R1~R5

### R1. spec source inconsistency

- fail: 4-way diff에서 카드 수·sub 명칭·canonical 클래스 미세 차이. G0.5가 어느 source 기준 PASS인지 모호 → Goodhart화
- mit: Phase A 진입 즉시 4-way diff. 정본 통합 재박제, 파생 retrofit
- fb: 정본 결정 불가 의미 충돌 시 Master 결정 요청, 해당 항목 G0.5 임시 제외 + ledger flag

### R2. 자동 검증 Goodhart 표면화

- fail: 셀렉터·클래스·키워드만 보면 빈 div로 통과 가능
- mit: Phase당 Vera 수동 sign-off 1회 의무화. 자동=필요조건, Vera=충분조건
- fb: Vera review 부재 시 "G0.5 잠정 통과(provisional)" + G3 baseline lock 보류

### R3. G0.5 paralysis (현재 PASS 0/5)

- fail: G0.5 강제 시 모든 페이지 fail → 작업 차단
- mit: report mode + enforce mode 2단. Phase B는 report only. Phase C 페이지 단위 점진 enforce
- fb: enforce 전환에서도 paralysis면 canonical 1개만 enforce, 나머지 report 유지. 부분 출시 escape

### R4. Vera↔Dev↔Arki 책임 경계

- fail: page-checklist·G0.5 runner·gap 해소 owner 미명시 → 누락
- mit: Phase A 시작 시 RACI 박제 (D-NNN ledger). page-checklist=Vera(R)+Arki(A), runner=Dev(R)+Arki(A), 의미 review=Vera(R,A), gap 해소=Dev(R)+Arki(A), 정본 정합=Arki(R,A)
- fb: boundary dispute 시 Master escalate. Arki는 "spec↔게이트" 무결성만 책임, 의미 review vote권 없음 명시

### R5. 정본 변경 시 회귀 폭증

- fail: ia-spec 변경 시 page-checklist·VR baseline·D-NNN 동시 invalidate 필요인데 누락
- mit: ia-spec 변경은 D-NNN ledger entry + 영향 page-checklist `spec_version` 자동 invalidate flag. runner는 spec_version mismatch 시 자동 fail
- fb: spec_version 시스템 장애 시 모든 페이지 G0.5 강제 재실행 + Vera 수동 review 재수행 (보수적 over-validation)

---

자가검토: 2.4의 "canonical 사용률 ≥ 80%" 임계가 가장 unsure — Phase B 실측 분포 본 뒤 lock하는 편이 안전 (Master Q3=b 채택으로 해소).
