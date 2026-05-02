---
role: riki
session: session_173
topic: topic_150
topicId: topic_150
turnId: 1
phase: adversarial-audit
rev: 1
---

# Riki — Zero 정리 후보 적대적 감사

Riki입니다. Arki 보고서(arki_rev1.md) 정독 후 다축 실측. Master 의사결정에 영향 있는 항목만 박제. 슬롯 채우지 않음.

---

## 1. 단언 적출 (인용 + 반박)

### 🔴 R-1. Arki C4 "role_registry/palette 결손 → viewer 무색 출력 위험" — **영향 평가 오류**

**Arki 인용 (§2.9):**
> "role_palette.json: 동일 8개만(Zero/Sage/Jobs 누락). 영향: 대시보드·viewer 색상 매핑·applicableTopicTypes 매핑이 Zero에 없음. 시각화에서 Zero 발언이 무색·미분류로 출력될 위험."

**실측 반박:**
- `app/js/role-colors.js` L23-34: ROLE_COLORS 객체에 `zero: '#64748B'` 박제. jobs/sage/zero 12 역할 모두 hardcode.
- `app/css/tokens.css` L50: `--c-zero: #64748B; /* 6.10:1 on --panel — 정제 페르소나 */` 박제.
- `app/js/role-colors.js` L41: `getComputedStyle(...).getPropertyValue('--c-' + prop)` — viewer는 tokens.css를 read하지 role_palette.json을 read하지 **않음**.
- `app/js/role-colors.js` L1 주석: `"Single source of truth: tokens.css --c-* variables"` — viewer는 tokens.css를 SOT로 선언.

**파손 범위:**
- Arki는 "무색 출력 위험"을 단언했으나, viewer 측 실제 SOT(tokens.css)에는 zero가 박제됨. **viewer는 정상 작동.**
- 진짜 문제는 **SOT 분열**: role_palette.json(8역할) vs tokens.css(12역할). 어느 쪽이 canonical인지 합의 부재.
- role_registry.json(8역할)도 마찬가지. session_index turns에서 `role: "zero"`가 들어와도 registry에 없으므로 `tier`/`applicableTopicTypes` 매칭 0건.

**완화 조건:**
- C4를 "viewer 결손 위험"이 아닌 "**SOT 분열 — role_palette/registry vs tokens.css/role-colors.js**"로 재라벨.
- 우선순위: 본 토픽 범위 밖(Sage/Jobs 공통 이슈)이라는 Arki 권고는 유지. 단, 영향 평가 정정 필요.

**검증 경로:** 대시보드 빌드 후 zero 발언 turn 색상 출력 확인 → 이미 정상 출력될 것. 빌드 회귀 X.

---

### 🟡 R-2. Arki C1 "excludedAssets phantom 정합 → 폐기 일관됨" — **폐기 시 회귀 비용 미평가**

**Arki 인용 (§2.4 + C1 mitigation):**
> "보호 대상 파일·디렉터리 부재. NCL 전면 폐기. (a) 폐기안: D-133이 NCL 전면 폐기 → 보호 대상 부재 → 폐기가 일관됨"

**실측 부분 확인:**
- `excludedAssets` 키워드 grep: 정책 문서 4건 + reports 17건. **코드(.js/.ts) 0건** 확인됨. ✅
- `memory/shared/violations/`, `memory/shared/ncl_violations.jsonl` 둘 다 ls 실패 — 부재 확인됨. ✅

**반박 (놓친 축):**
- D-110 → D-119 → D-127 supersede chain에서 `excludedAssets` 정책은 **NCL 폐기 전(D-119, 2026-04-29)에 박제됨**. 즉 NCL 폐기와 무관하게 "Zero가 자기 자신을 점검 대상으로 삼아 무한 재귀에 빠지지 않도록 하는 self-exclusion 메커니즘"이라는 일반 원칙으로도 해석 가능.
- 폐기 시: 향후 NCL 또는 유사 메타-자산(예: Sage self-scores log, audit trail)이 재도입되면 Zero가 그것을 정제 대상으로 삼아 삭제할 위험. **재작성 비용 = 작은 정책 1건 + Zero 호출 사고 1건.**

**완화 조건:**
- 폐기 시: 박제 사유를 "NCL 폐기로 보호 대상 부재"로 명문화 (D-134 정신: 박제는 신성하지 않다).
- 유지 시: 적어도 dispatch_config.rules.zero에 SOT 통합하여 4중 박제 → 1중 박제. enforce hook은 신설하지 않아도 됨(보호 대상 부재 시 0-cost).
- **권고: 유지(통합) 우선.** Zero 호출 사고의 회피 가치 > 정책 4중 박제 비용.

---

### 🟢 R-3. Arki C5 "rules.zero에 trigger·ownership 보강" — **하지 마라**

**Arki 인용 (§2.6 + C5):**
> "Edi rule처럼 hook이 read하지 않는 정책 일관성 박제용도 가능."

**반박:**
- Edi rule은 enforcement_note에 "**hook이 read하지 않음 — Opt-α**"를 명문화. 즉 정책 일관성 박제용도. 이는 **D-138 영구 감시 회피(Riki R-1, topic_142)**의 결과 — 코드 enforce는 finalize.js 인라인 유지하고 config는 박제만 함.
- Zero rule에 동일 패턴 박제하면 **dispatch_config가 점점 비대해지고 read되지 않는 정책 박제 ratio 증가** → "config 비대화" anti-pattern.
- Master 피드백 정합: "정착된 정책 재질문 금지" — 비대칭 보강 자체가 ROI 0 자동 감시 욕구의 변형.

**권고: PASS.** Zero rule sparse 유지가 정상. 비대칭은 Edi rule이 이상치고 Zero rule이 정상.

---

## 2. 놓친 축 (실측)

### A1. viewer/dashboard 측 12역할 hardcode (Arki 자기감사 ⚠ 항목 #1)

- `app/index.html`, `app/dashboard-upgrade.html`, `app/session.html` 3 파일에 zero 언급. (실제 hardcode 위치는 role-colors.js·tokens.css 중심)
- Arki는 "viewer 컴포넌트 스캔 미실행"으로 자인했으나, 실측 시 이미 정합. **C4 우선순위 라벨 🔴 → 🟢 강등.**

### A2. .claude/skills에 zero 직접 참조 0건 ✅

- by-design 정합. 추가 발견 없음.

### A3. AGENTS.md / CONTEXT.md zero 언급 0건

- 실측 결과 0건. 두 문서가 8역할 시점 잔재 가능성 있으나 본 토픽 범위 밖. (3 페르소나 공통 이슈 — 별도 토픽)

### A4. scripts/ 3 파일 false positive 재확인 ✅

- `seed-signature-metrics.ts`(dev.regression_zero), `derived-metric-compute.ts`(zero-fill), `signature-metrics-types.ts`(nullPolicy "zero-fill") — 모두 Zero 페르소나 무관. Arki "0건" 단언 정합.

### A5. role_palette vs tokens.css 색상 충돌 검증

- role_palette.json: `dev: #6B7280` (slate)
- tokens.css L50 + role-colors.js L34: `zero: #64748B` (slate)
- **거의 동일 슬레이트 색상 — Zero 추가 시 Dev와 시각적 구분 약함.** 별도 색상 분기 권고는 본 토픽 밖.

### A6. KNOWN_ROLES 배열 순서 차이 (post-tool-use vs sage-gate)

- post-tool-use-task.js L36: `[..., 'edi', 'designer', 'sage', 'zero', 'vera', 'jobs']`
- pre-tool-use-task-sage-gate.js L35: `[..., 'edi', 'designer', 'vera', 'sage', 'zero', 'jobs']`
- vera 위치만 다름. 두 hook이 순서 의존 로직 사용 안 한다면 무해. **Arki C6 권고(공통 모듈 추출) 정합 — 단 ROI 낮아 DEFER.**

---

## 3. 전제 결함

### F1. "보호 대상 파일 부재 = 정책 무효" (Arki C1 폐기안 전제)

- 부분 결함. R-2 참조. NCL 폐기와 self-exclusion 일반 원칙은 별개 의미층.
- 단 폐기 시 위해는 작음(재작성 비용 low). 결정 권고는 **유지+통합** 우선이지만 폐기도 수용 가능.

### F2. "scope_areas 4중 박제 = 비효율" (Arki C3 전제)

- 부분 결함. **persona/policy/memory 3중 박제는 hook v3 컨텍스트 prepend 패턴의 자연스러운 결과** (페르소나는 정체성 표현, 정책은 발언 구조 강제, memory는 self-state).
- 진짜 문제는 dispatch_config(SOT 후보)도 4번째로 박제하면서 어느 쪽이 canonical인지 합의 부재.
- C3 권고("dispatch_config SOT, 나머지 prose 참조형으로 단축") 자체는 합리적이나, **읽는 주체(hook v3)가 dispatch_config를 read하지 않으므로 SOT 통합의 운영 효익 낮음**.
- **권고: 🟢 DEFER.** 가독성 손실 없이 단축 가능하다면 진행, 아니면 보류.

### F3. "dispatch_config가 SOT여야 한다" (암묵적 전제)

- **결함 확인.** 실제 SOT는 hook이 read하는 곳 = persona+policy(hook v3 prepend) + finalize.js 인라인.
- dispatch_config는 **session_isolation·auto_hook 2개 키만 sage-gate hook이 read** (코드 검증 필요하나 D-128 명문). 나머지는 정책 박제용.
- **이 전제 결함이 R-3 "하지 마라"의 근거.** dispatch_config를 SOT로 격상하려는 욕구가 비대화를 낳음.

---

## 4. 우선순위 재라벨 권고

| Arki 라벨 | 후보 | Riki 재라벨 | 사유 |
|---|---|---|---|
| 🔴 즉시 | C1 (excludedAssets 4중 박제) | **🟡 검토** | 폐기/유지 둘 다 회귀 비용 작음. Master 결정 필요하나 긴급성 낮음. |
| 🔴 즉시 | C4 (role_registry/palette 결손) | **🟢 DEFER** | viewer 측 hardcode로 운영 영향 0. SOT 분열은 별도 토픽(Sage/Jobs 공통). |
| 🟡 검토 | C2 (D-125 NCL 명문 잔존) | 🟡 유지 | 정합 — D-125에 supersededBy/amendedBy 추가 (저비용). |
| 🟡 검토 | C3 (scope_areas 4중) | **🟢 DEFER** | 운영 효익 낮음(F2). |
| 🟡 검토 | C5 (rules.zero 비대칭) | **❌ 거부** | R-3 — 보강 자체가 anti-pattern. |
| 🟡 검토 | C8 (3 영역 경계 모호) | 🟡 유지 | 정량 기준 박제는 호출 사례 누적 후. 후속 토픽. |
| 🟡 검토 | C9 (manifest zero 미등록) | 🟡 유지 | 키워드 추가 1건 — 저비용. |
| 🟢 DEFER | C6, C7, decision chain 모호 | 🟢 DEFER | 정합. |

**Riki 종합 권고 영향 있는 항목 4건:**
1. C1 — 폐기 또는 통합 (🟡 Master 결정)
2. C2 — D-125 statusNote 갱신 (🟡 저비용)
3. C9 — manifest 키워드 추가 (🟡 저비용)
4. C8 — 3 영역 경계 정량화 (🟡 호출 사례 누적 후 후속 토픽)

**거부:** C5 (R-3)
**강등:** C4 → DEFER (운영 영향 0)
**유지:** C3·C6·C7 → DEFER

---

## 5. Master 의사결정 시 주의점

### M1. Arki C4 영향 평가 정정 필수

- "viewer 무색 위험"은 거짓. 실제로는 SOT 분열. 이 토픽에서 결정하지 말고, Sage/Jobs/Zero 3 페르소나 공통 SOT 통합 토픽으로 분리 권고.

### M2. C1 폐기 결정 시 회귀 비용 명문화

- `excludedAssets` 폐기 시 ledger에 "NCL 폐기로 보호 대상 부재 — 향후 메타-자산 재도입 시 self-exclusion 재박제 의무" 박제. 미래 사고 회피.

### M3. dispatch_config 비대화 anti-pattern 인지

- C5 거부 권고는 **"정책 일관성"이라는 명목으로 read되지 않는 정책을 누적하는 패턴**에 대한 경고. Edi rule의 Opt-α 패턴은 D-138 영구 감시 회피라는 특수 맥락의 산물이지, 일반화할 패턴 아님.

### M4. 본 토픽은 식별 단계만 — 제거 실행은 후속 토픽

- Arki scope drift 체크 정합. Master scope 준수 확인.

### M5. 본 적대적 감사에서 발견 못한 영역 (자인)

- finalize.js·session-end-finalize.js 내부 zero 분기 행위 검증 미실시 (Arki도 미검증).
- token_log.json·dashboard_data.json 집계 분기 미점검 (Arki 자인).
- 본 토픽 결정 직전 Master가 추가 검증 요청 시 Dev 호출 가능.

---

## 6. 종합

- **Arki 단언 12건 중 영향 평가 오류 1건(C4), 부분 결함 2건(C1·C3), 거부 1건(C5).** 나머지 8건 정합.
- **Master 의사결정 필요 항목: C1 폐기/유지 1건만.** C2·C9는 저비용 진행, C8은 후속 토픽.
- **본 토픽 ROI 결정점**: viewer SOT 분열은 다른 토픽으로, NCL 잔재 정리는 본 토픽으로.

**확인된 추가 리스크 없음 외 영역에 대해 패스.**

---

RIKI_WRITE_DONE: C:/Projects/legend-team/reports/2026-05-02_zero-logic-inefficiency-audit/riki_rev1.md

[ROLE:riki]
# self-scores
crt_rcl: Y
cr_val: 4
prd_rej: Y
fp_rt: 0.10
