---
role: riki
turnId: 3
invocationMode: subagent
session: session_167
topic: topic_144
date: 2026-05-02
---

# Riki — Dashboard Upgrade ver2.0 / Legend Nexus 반영 (적대적 audit)

Riki입니다. Master 5축 결정 + Arki 4 patch 실행계획을 적대적 시각으로 audit합니다. 확신 있는 리스크만 제기하고, 곁가지·중복·약한 항목은 의도적 제외합니다 ([riki_no_opposition_for_opposition], [riki_count_filler] 정합).

---

## 1. R-N 카드 (위험도 + mitigation + fallback)

### 🔴 R-1. versionBump hook이 v2.x 스케일을 가정하고 있음 — v0.00 리셋 시 정합 깨짐

**원문 근거** (CLAUDE.md 본문):
> "session-end-finalize.js hook이 변경 종류(페르소나/정책 신규=+0.1, decision_ledger 신규=+0.01, Grade C+버그=+0.001) 자동 감지 → versionBumpSuggested current_session 박제 → Edi 세션 종료 시 확정 → project_charter.json 자동 전파"
> "세션당 최대 +0.1 캡"

**파손 범위**: 본 세션은 Grade S + 새 페르소나 0건 + decision_ledger D-144(가칭) 신규 = +0.01 후보. 그러나 charter.version은 v0.00으로 강제 리셋됨. hook이 "직전값(v2.201) → 자동 +0.01" 로직으로 동작하면 v2.211 박제 시도 + Master 결정 v0.00 충돌. 또는 v0.00 + 0.01 = v0.01 자동 박제로 본 세션 결정(v0.00) 즉시 침식.

**mitigation**:
- (a) Phase 1 commit 시 `session-end-finalize.js`의 versionBump 자동 감지를 **본 세션 1회 skip**하는 가드 추가. 또는 `versionBumpSuggested.skip: true` 박제로 hook 우회.
- (b) era_history entry 추가가 versionBump 트리거 조건에서 제외되는지 코드 레벨 확인 (Arki §1.1 era_history 신설을 hook이 "decision_ledger 신규" 패턴으로 오인할 가능성).

**fallback**: hook 우회 불가 시 본 세션 versionBump skip을 Edi가 수동 override (D-130 "Edi가 versionBumpSuggested 검증·override·확정" 권한 활용).

---

### 🔴 R-2. decision_ledger 신규 entry의 versionAtSession 필드 — v0.00 박제 시점 모호

**파손 범위**: 본 세션에서 D-144(v0.00 era 진입) 박제 시 entry의 `versionAtSession`은 무엇? Arki §1.1 "history[] 28개 entry version 필드 = 불변"은 합의되었으나 **본 세션에서 새로 박제하는 entry**는 history[]에 추가됨 → 이 신규 entry의 version은 v2.201(직전) vs v0.00(본 세션 결정 후) 어느 쪽?

**원문 근거** (Arki §1.1):
> "decision_ledger.json D-xxx versionAt 필드 = 불변" — 그러나 이는 **기존** entry. 신규 entry 박제 규칙은 명시 없음.

**mitigation**:
- (a) D-144 박제 시점을 Phase 1 **이후**로 강제 (charter.version v0.00 박제 → 그 다음 commit에서 D-144 entry write). versionAtSession이 system_state.currentVersion read 패턴이면 자동으로 v0.00 박제됨.
- (b) 박제 순서: ① project_charter v0.00 + system_state v0.00 commit → ② D-144 ledger commit (이때 versionAtSession 자동 v0.00) → ③ era_history entry (legend-team era 종료 closing entry).

**fallback**: 순서 보장 실패 시 D-144 entry의 versionAtSession을 Edi가 수동 v0.00 정정.

---

### 🔴 R-3. era_history `endedAt` 필드 — legend-team era는 본 세션 시점에 정말 "종료"되었는가

**원문 근거** (Arki §1.1):
> "1번째 entry: {eraName: 'legend-team', finalVersion: 'v2.201', endedAt: '2026-05-02', summary: '...'}"

**파손 범위**: 본 세션은 Master 결정 D=b "era_history 필드만, 디렉토리 이동 X". 즉 **물리적 분리 없음 + 표기만 전환**. era_history에 `endedAt: 2026-05-02`로 박제 시:
- (a) 향후 누군가 era_history를 read해 "legend-team era는 2026-05-02에 종료" 단언 → 사실 그날 패치만 적용된 상태와 정합 안 맞음.
- (b) [no_retro_without_value] 정합 — endedAt은 소급 단언 형식. 실제로는 "현 세션부터 표기 전환" 만 박제 적정.

**mitigation**:
- (a) 필드명을 `endedAt` 대신 `transitionedAt` 또는 `notationSwitchedAt`으로 명시. 의미: "표기 전환 시점", "물리적 종료 아님".
- (b) era_history entry summary에 "표기만 전환, 디렉토리/data SOT는 unified" 명문화.

**fallback**: 명명 합의 안 되면 era_history 박제를 Phase 1에서 분리, 다음 세션으로 이연 (Phase 1 = version 2 필드 reset만).

---

### 🟡 R-4. Brand swap 28 file active/historical 분류 — Arki "active" 정의 모호

**원문 근거** (Arki §1.2):
> "현재 시점 시스템 표기 vs 과거 시점 박제 history = swap 가능 vs 불변"
> "data SOT — 신중. legend-team 시점에 박제된 토픽 title·summary는 history. 향후 신규 작성 시점부터 Legend Nexus로 전환."

**파손 범위**:
- (a) `app/dashboard-upgrade.html:6` `<title>` = 현재 노출 = swap 명확.
- (b) `app/index.html` 내 footer `© Legend Team 2026` 같은 텍스트 = 현재 노출이지만 박제 의미 = ambiguous.
- (c) `tests/vr/fixtures/dashboard.mock.json` _meta freeze (D-102 PD-050) = swap 시 verify-fixture-stability 무효화 (Arki R-B 인지).
- (d) `scripts/auto-push.js` 의 commit message template = 미래 commit에 영향 = swap 적정. 그러나 **과거 commit history**에 "Legend Team" 잔재 → git log는 영구 history → 정합 모호.
- (e) `package.json` name 필드 = Arki out-of-scope 선언했으나 npm 의존 깨짐 mitigation 없음 — 이 항목은 swap 안 하면 정합 100% 안 됨.

**mitigation**:
- (a) G-0 게이트에서 Arki가 28 file × line 단위 분류표 작성 (Arki §6 self-audit "MUST_NOW: G-0 분류 자동화 script"와 정합) → Master 1회 review 필수.
- (b) ambiguous line은 swap skip + 코멘트 마킹 (Arki R-A fallback과 동일 — 동의).

**fallback**: 분류 모호 30%+ 발생 시 Arki S-1 중단 조건 발동 → 본 토픽 분할 (active 한정만 본 세션, historical은 child 토픽).

---

### 🟡 R-5. VR fixture _meta freeze unlock — 1회 unlock 후 재freeze 시 baseline drift 위험

**원문 근거** (Arki §2.2 R-B):
> "verify-fixture-stability.ts에 _meta.title 변경 허용 1회 unlock + dashboard.mock.json 재생성 + 24/24 baseline 재캡처"

**파손 범위**: D-102 PD-050이 _meta freeze로 fixture 변조 차단을 박제했음. 1회 unlock 시:
- (a) unlock window 동안 _meta.title 외 다른 필드도 변경 가능 (예: timestamp, sessionCount) → baseline drift.
- (b) unlock script가 atomic하지 않으면 unlock → swap → 재freeze 사이 race condition.
- (c) 24/24 baseline 재캡처 시 brand 외 변경(예: 폰트 렌더 미세 차이)도 baseline에 박제 → 향후 회귀 검사가 약화.

**mitigation**:
- (a) unlock script를 _meta.title field만 화이트리스트 변경 허용으로 좁힘 (다른 필드 변경 시 reject).
- (b) 재캡처 baseline diff를 Master/Edi가 1회 review (24장 전체 visual diff).

**fallback**: 재캡처 결과 brand 외 변경 5%+ 검출 시 swap revert + child 토픽 분화 (Arki S-2 정합).

---

### 🟡 R-6. ackedButUnresolved schema 미확정 — Phase 4 진입 시 throwaway 코드 위험

**원문 근거** (Arki §1.4 + §3 G-4):
> "decisions.caveats[].status === 'acked' 항목 → 미구현 (Big Bang 잔재)"
> "topics/topic_NNN/open_issues.json 의 status === 'acked' && resolvedAt == null"
> "둘 다 schema 안정도 미확인 — Dev 인계 전 확정 필요"

**파손 범위**: Phase 4 = "schema 확정만 본 토픽 + 구현은 본 세션 잔여 시간 또는 child" (Arki §3). 본 세션 시간 분포 미확정 상태에서:
- (a) source 양자택일이 실제로 mutually exclusive 인가? `decisions.caveats`와 `open_issues.json`이 **둘 다** acked 상태 추적 가능 → 어느 쪽이 canonical?
- (b) `decisions.caveats[]` 패턴이 D-124에 박제됐다고 명기되어 있음. 그러나 caveats 필드가 모든 D-xxx entry에 존재 보장? 일부 entry만 있다면 집계 분모 모호.
- (c) topic_NNN/open_issues.json은 **토픽별 분산** schema. 집계 시 모든 토픽 폴더 walk 필요 → I/O 비용.

**mitigation**:
- (a) **Phase 4 schema 확정만 본 세션, 구현은 child 토픽**으로 강제. 무리하게 본 세션에서 끝내지 말 것 ([implementation_within_3_sessions] = 3세션 이내, 본 세션 1세션째).
- (b) schema 결정 시 양자택일 명문화: "decisions.caveats가 canonical, open_issues.json은 deprecated 또는 mirror" 또는 역.

**fallback**: schema 결정 불가 시 Arki S-3 발동 → child 토픽 분화 (G-4 미달 허용 = Phase 5 진행 가능 명시 — 동의).

---

### 🟡 R-7. Grade D 추가 시 sizeToGrade fallback 'C' — 기존 D 후보 세션 retroactive C로 박제됨

**원문 근거** (Arki §1.3):
> "Master 결정 C=a '임계 재설계 안 함, D 누락만 patch'이므로 size 기반 D 분기 없음. D는 gradeDeclared로만 들어옴. sizeToGrade는 C가 fallback."

**파손 범위**: 기존 세션 중 size ≤5 + D 키워드(`bug`, `fix`, `patch`, `오타`) 매칭 case = CLAUDE.md "C/D 자동 분기" 규칙상 D였어야 함. 그러나 본 patch는 sizeToGrade에 D 분기 없음 → 이런 세션들은 영구 'C'로 박제됨 = 정합 위반.

**mitigation**:
- (a) [no_retro_without_value] 정합 — 신규 세션부터 D 인정. 기존 세션 retroactive 갱신 안 함 (Arki R-D 정합 — 동의).
- (b) 그러나 **CLAUDE.md "C/D 자동 분기" 규칙 자체와 Arki 결정 충돌**. 둘 중 하나 정정 필요:
   - 옵션 1: CLAUDE.md 규칙 갱신 — "D는 Master 명시 선언 + dev 페르소나 자동 매칭만, sizeToGrade는 C fallback".
   - 옵션 2: sizeToGrade에 D 분기 추가 (Master 결정 C=a와 충돌).

**fallback**: 옵션 1 채택 권고. CLAUDE.md "C/D 자동 분기" 규칙을 D-144 박제와 함께 갱신.

---

### 🟢 R-8. Phase 1·2 병렬 가능 단언 — 단일 commit 원칙과 충돌 가능

**원문 근거** (Arki §4.2 + §4.5):
> "Phase 1·2 = 병렬 가능 (서로 다른 파일군)"
> "각 Phase 단일 commit 원칙 — 롤백 단위 명확화"

**파손 범위**: 병렬 진행 시:
- (a) Phase 1 commit + Phase 2 commit 직렬화 가능 = 문제 없음.
- (b) **그러나 동시 작업 중 한쪽 실패 시** Phase 1만 commit + Phase 2 미commit 상태에서 dashboard 화면 = v0.00 표기 + Legend Team 텍스트 혼재 = 일관성 깨짐.

**mitigation**: 병렬 작업 허용하되 **commit은 직렬 강제**: Phase 1 commit → Phase 2 commit. 중간 push 금지.

**fallback**: 병렬 어려우면 직렬 진행 (Phase 1 → Phase 2). 본 세션 시간 여유 시 직렬이 안전.

---

## 2. 숨은 전제 점검 (Jobs K1~K4 외)

Jobs framing 파일 부재로 K1~K4 직접 인용 불가. dispatch context Master 5축 + Arki 발언 기반 추정 전제 적출:

**K-숨은-1**: "v0.00 리셋이 시스템 정합성에 무해" — versionBump hook 영향(R-1) + decision_ledger versionAtSession(R-2) 점검 안 됨. 전제 검증 필요.

**K-숨은-2**: "era_history 필드 추가가 schema breaking change 아님" — `validate-schema-lifecycle.ts`가 charter.json schema에 era_history 필드 신설을 허용? Arki §4.3 G-1에 "schema validate" 게이트 박제됐으나 실패 시 대응 명시 없음.

**K-숨은-3**: "Brand swap이 SEO/외부 링크에 무영향" — `app/_redirects` (Arki §1.2 touch points) 변경 시 Cloudflare Pages routing 영향. 외부에서 `/legend-team/...` URL로 들어오는 traffic 0건 가정?

**K-숨은-4**: "Master가 다음 세션에서 v0.00 → v0.01 자동 진행 수용" — 본 세션 v0.00 박제 후 다음 세션 자동 +0.001/+0.01 어떻게 박제할지 미합의. v2.x era 룰 그대로 vs nexus era 새 룰?

---

## 3. 실행 왜곡 적출 (Arki Phase 분해 자체 왜곡)

**왜곡-1: Phase 0 "사전 실측 70% 완료" 자평** (Arki §4.1)
Arki 본인이 70% 완료라 단언했으나 G-0 통과 기준(28 file 분류표 + ackedButUnresolved schema 결정 + 토픽 카드 grade 필드 확인) 3건 모두 미완료 상태. 70%는 과대평가.
→ **시정**: G-0를 Phase 0가 아닌 Phase 1 진입 차단 게이트로만 운영. "70% 완료" 표현 폐기.

**왜곡-2: Dev 인계 spec phase1·2·3 순서 명시 + Phase 4 누락** (Arki §7)
Phase 4 (ackedButUnresolved)가 Dev 인계 spec에서 빠짐. Arki §3에서 "schema 확정만 본 토픽 + 구현은 child"로 명시했으니 의도적 누락이지만, **Master에게 명시 confirm 안 됨**. Master 5축에 ackedButUnresolved 결정 항목 부재 = 본 세션 진행 여부 자체 모호.
→ **시정**: ackedButUnresolved를 본 세션 처리할지 Master에게 1회 확인 (작업군 4개 중 가장 LoC 큼).

**왜곡-3: forbid 항목 "history[].version 소급 변경" (Arki §7) — 그러나 era_history는 history[]가 아님**
era_history는 charter.era_history 신설 키 vs project_charter.history[] 28개 entry는 별개. forbid 표현이 모호 → 작업자가 era_history를 history[]와 혼동 가능.
→ **시정**: forbid 명시화 — "project_charter.history[] 28 entry version 필드 불변. era_history는 신설 키 = append-only."

---

## 4. 회귀 리스크 (regression vector)

본 patch가 깨뜨릴 수 있는 기존 기능:

| Vector | 회귀 표면 | 검증 방법 |
|---|---|---|
| **V-1**: dashboard 화면 versionAtSession 분포 차트 | v2.201 entry 28개 + v0.00 신규 1개 = bimodal 분포. 기존 차트가 unimodal 가정이면 깨짐 | Phase 1 commit 후 dashboard 화면 visual check |
| **V-2**: `app/_redirects` Brand 변경 시 외부 deeplink 깨짐 | `_redirects` 내 `/legend-team/*` rule 존재 가능 | Phase 2 진입 전 `_redirects` grep + Master 확인 |
| **V-3**: Grade D 추가 시 dashboard gradeDist 분모 | gradeCount 합계가 sessionCount와 일치하지 않으면 집계 버그 (D=0이지만 정합 깨질 가능성) | Phase 3 후 `gradeCount.S+A+B+C+D === sessions.length` assert |
| **V-4**: era_history JSON schema breaking change | 다른 script가 charter.json read 시 unknown key reject | Phase 1 후 `validate-schema-lifecycle.ts --all` 실행 |
| **V-5**: VR baseline 재캡처 brand 외 drift | unlock window 동안 timestamp/sessionCount 같이 변경 | Phase 2 후 baseline diff 24장 visual review |
| **V-6**: versionBump hook 자동 +0.01 (R-1 정합) | 본 세션 v0.00 결정 자체 침식 | Phase 1 commit 후 system_state.currentVersion read 재확인 |

---

## 5. 단일 결론

**조건부 GO** — Master 5축 결정과 Arki 실행계획은 구조적으로 정합. 단 Phase 1 진입 전 다음 3건 차단 게이트 추가 필수:

1. **R-1 mitigation 박제** — versionBump hook 본 세션 1회 skip 가드 합의 + 구현 (또는 hook 코드 검토 후 자동 동작 검증).
2. **R-3 era_history 필드명 정정** — `endedAt` → `transitionedAt` 또는 동의어 명문화.
3. **R-7 CLAUDE.md "C/D 자동 분기" 규칙 정합화** — 옵션 1(규칙 갱신) vs 옵션 2(sizeToGrade D 분기) Master 결정.

위 3건은 Phase 1 진입 전 1~2 turn 안에 처리 가능. 처리 후 Arki 실행계획 그대로 GO. 처리 전 Phase 1 진입 = HOLD.

ackedButUnresolved (Phase 4) = **본 세션 schema 확정만, 구현은 child 토픽 권고** ([implementation_within_3_sessions] + 본 세션 LoC budget 정합).

확인된 추가 곁가지 리스크: 없음. ([riki_no_opposition_for_opposition] 정합 — 슬롯 미달 정상).

---

RIKI_WRITE_DONE: reports/2026-05-02_dashboard-upgrade-v2-legend-nexus/riki_rev1.md

[ROLE:riki]
# self-scores
risk_recall_3sigma: 5
falsification_used: Y
mitigation_paired: 1.0
contrarian_courage: 5
crt_rcl: Y
cr_val: 5
prd_rej: Y
fp_rt: 0.10
