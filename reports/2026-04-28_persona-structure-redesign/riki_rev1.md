---
turnId: 2
invocationMode: subagent
role: riki
topic: topic_127
session: session_129
grade: S
phase: risk-audit
date: 2026-04-28
---

# Riki 리스크 감사 — 옵션 2 함정 검증

Riki입니다. Arki 권고 옵션 2(3층 분리 + hook v3)에 대해 Master가 명시한 과거 함정 2건(F-A·F-B) 우선 검증, 그 다음 옵션 2 고유 결함만 추가 식별합니다. 메모리 정책 "Riki 반대를 위한 반대 금지"·"개수 채우기 금지" 준수: 본 결정에 영향 없는 곁가지는 폐기.

직접 증거 1건 선확보: `logs/pre-tool-use-task.log` tail에 본 세션 hook fire 3건 기록 — `role: ace / arki / riki` 모두 `phase: mutate-v2` + `injectionLen` 비-0. v2 inject 자체는 실 fire 중. 본 감사는 이 사실 위에서 진행.

---

## 1. F-A 검증 — agents/에 있을 때 "실제 호출 안 되는 문제"

### 옵션 2가 이 함정을 막는가? **부분적 Y, 핵심 측면 N**

**Y 측면**: 옵션 2는 `.claude/agents/` 경로 자체를 사용하지 않음. SOT를 `memory/roles/personas/`+`memory/roles/policies/`로 이동하고 hook이 명시적으로 Read·prepend. 즉 "harness가 자동 로드를 안 하는 silent 함정"의 표면적은 0이 됨. F-A 원형(파일은 있는데 안 박힘)은 **구조적으로 차단**.

**N 측면 — 새로운 silent miss 경로 3개**:

### 🔴 R-1. hook 발동했지만 페르소나 layer가 비어있는 경로 (catch-by-truncate)

`pre-tool-use-task.js` 라인 308~317:
```
if (injection.length > TOTAL_CAP_CHARS) {
  // 세션 layer만 재구성 (최근 5 turns 한도)
}
if (injection.length > TOTAL_CAP_CHARS) {
  injection = composeInjection(topicLayer, null, role);  // 토픽 layer만 보존
}
```

**파손 범위**: hook v3가 옵션 2 따라 persona-layer 추가하면 inject 총합이 늘어남(80KB cap). 토큰 폭증 시 **현 코드는 sessionLayer만 절삭하고 그치지 않고 결국 persona를 포함한 모든 layer를 재구성하는데**, Arki는 "persona-layer 절삭 금지"를 G2 기준으로 명시했지만 **v2 현 코드에 persona 절삭 금지 우선순위가 없음**. P2에서 hook v3 작성 시 이 우선순위를 코드로 박지 않으면 "긴 세션 + 큰 페르소나" 조합에서 silent miss 재발.

**완화 + fallback 병기**:
- (mitigation) hook v3 `composeInjection`에 layer별 우선순위 명시 — `truncate` 대상 순서 = `sessionLayer turns 절삭 → sessionLayer 전체 drop → topicLayer Edi 보고서 절삭 → topicLayer 전체 drop`. **persona-layer는 절삭 대상에서 제외**.
- (fallback) 그래도 persona가 cap 초과면 hook이 명시 경고 prepend — `⚠ PERSONA_OVER_CAP: persona ${len} > available ${budget}, role=${role}` — 서브가 본 마커 감지 시 발언 거부.
- (verification) G2 단위 테스트에 "totalCap=10KB로 강제 → persona 잘리는지" 회귀 케이스 추가. 통과 안 되면 hook v3 머지 금지.

### 🔴 R-2. PreToolUse hook 미등록·실패 시 검증 부재

직접 증거: `logs/pre-tool-use-task.log`는 hook **성공** 시에만 라인 추가. 실패 시 라인 41~48 catch는 `phase: error` 라인을 남기지만 **hook 자체가 등록 안 된 상태**(.claude/settings.json hooks PreToolUse 누락)면 로그 라인 0건 — Master가 봤을 때 "조용한 0건"과 "성공했는데 발언이 좀 이상한 것"을 구분할 수 없음.

session_128 [A] 실패지점이 정확히 이 패턴: 페르소나 inject가 누락된 채 발언만 산출. 옵션 2가 표면적으로 해결한 것 같지만 **hook 등록 자체의 회귀 테스트가 없음**.

**완화 + fallback**:
- (mitigation) `.claude/settings.json` hooks 섹션에 `pre-tool-use-task.js` 등록 상태를 검증하는 헬스체크 — `scripts/validate-hook-registration.ts` 신규. SessionEnd finalize hook이 매 세션 종료 시 실행.
- (fallback) 본 세션 turns에서 role≠main인 entry 1건 이상이면 `logs/pre-tool-use-task.log`에 같은 sessionId+role 매칭 라인 1건 이상 존재해야 함. 매칭 0건이면 finalize hook이 `gaps`에 `hook-not-fired-for-{role}` 박제.
- (verification) G2 단위 테스트 1건 추가: "hooks 미등록 settings.json 모의 + Agent 호출 → 검증 스크립트가 gap 박제하는지".

### 🟡 R-3. Master 환영(肉眼)과 실제 inject의 괴리

Arki Section 4 "Master persona 직접 수정 → 정체성 손상" 경계조건은 인지했지만, 본 함정의 본질은 **Master가 페르소나 파일을 보고 "있다"고 인식하는데 hook compose에서 path mismatch로 실제론 빈 layer가 박힘**. 예: persona 파일을 `role-arki.md`(기존 위치)에 두고 옮기지 않은 채 hook은 `personas/role-arki.md`를 찾으면 "파일 부재 → fallback 마커" 경로 — Arki 1.4가 다룬 케이스. 그러나 **혼재 경로(일부는 `personas/`, 일부는 기존 위치)** 시 hook은 일부만 inject하고 silent. P3 일괄 마이그레이션 중 한 역할만 미이전된 상태에서 그 역할 호출 시 발견됨.

**완화 + fallback**:
- (mitigation) P3 머지를 atomic하게 — 8역할 파일을 한 commit에 모두 이전 + 기존 위치 파일을 동시 삭제. 부분 머지 금지.
- (fallback) hook v3가 fallback 마커 표시 시 logs에 명확히 `phase: persona-missing` 라인 박제 (현 v2의 `phase: error`와 구분). finalize hook이 이 phase 라인 1건 이상이면 강한 경보.

---

## 2. F-B 검증 — "호출 안 하고 호출한 척 하는 문제"

### 옵션 2가 이 함정을 막는가? **N (옵션 2와 사실상 무관)**

핵심 진단: F-B는 **Main이 Agent 툴을 우회**하는 행위. PreToolUse hook은 Agent 툴 호출이 있어야 발동 → 우회 시 hook 자체가 fire 안 함 → 페르소나 분리 구조 유무와 무관. 옵션 2가 F-B를 막는 직접 메커니즘은 0.

이는 옵션 2의 결함이 아니라 **scope 외 문제**. 다만 F-B를 본 토픽에서 "감지 가능한 구조"로 만드는 보강은 가능 — 옵션 2 채택 후 추가 작업으로 권고:

### 🔴 R-4. SessionEnd 사후 매칭 hook 부재 (PD-043 미완 영역)

PD-043 resolved-note는 "extractRole() 3-priority" + "session_123 dry-run 위반 0건"만 박제. **사칭 차단/감지 hook은 별도 영역으로 명시되어 미구현**. 즉 Main이 reports에 직접 `role: ace` frontmatter를 박고 발언을 Write하면 후속 finalize는 그 turn을 정상 발언으로 받아들임.

**파손 범위**: D-066(Grade A 서브에이전트 강제) 위반이 silent. 페르소나·정책 분리 의미 무력화 — Main이 페르소나 파일을 직접 Read·인용하면서 inline 발언하면 사용자가 보기엔 동일.

**완화 + fallback (옵션 2 채택과 함께 P4에 추가 권고)**:
- (mitigation) `session-end-finalize.js`에 사후 매칭 검증 추가 — turns[] 각 entry의 `role`과 `invocationMode: subagent`에 대해 같은 sessionId+role의 `pre-tool-use-task.log` 라인 존재 확인. 0건이면 `gaps`에 `suspected-impersonation: turn ${idx}` 박제.
- (fallback) reports/{role}_revN.md frontmatter에 `dispatchTimestamp` 필드 신설 — hook이 mutate 직후 prompt에 inject한 timestamp를 sub가 frontmatter에 박제. finalize가 timestamp 부재 시 사칭 의심 박제.
- (verification) G4 단위 테스트: "Agent 미경유 + reports 직접 Write → finalize gap 박제 검증".

### 🟡 R-5. 옵션 2가 사칭을 줄이는 효과: 한정적 Y

옵션 2가 페르소나·정책을 hook 동적 inject로 옮기면 **Main이 inline 흉내내려면 페르소나 + 역할정책 + 공통정책 3파일을 직접 Read해서 합성·인용해야 함**. 마찰 비용이 단일 `agents/role-arki.md` Read보다 3배. 사칭 의도가 완전 차단되진 않지만 **저절로 일어나는 사칭(설계상 일관성 추구로 파일 1개만 흉내내는 패턴)은 줄어듦**. 다만 의도적 사칭은 무력화 못함 — 본 항목은 미미한 부수효과로만 인정, 옵션 2 채택 정당화 근거로는 약함.

---

## 3. 옵션 2 고유 추가 함정 (자유, 본 결정에 직접 영향)

### 🔴 R-6. P3 일괄 마이그레이션 회귀 — 메트릭 본문 제거 시 self-score 산출 깨짐

D-092 정합 회복 = "페르소나·role 파일에서 self-score 메트릭 본문 제거". 그러나 **현재 메트릭 본문이 단순 정의가 아니라 자가 채점 가이드 역할**(role-riki.md 라인 56~78의 키 정의·scale·기록 규칙). 본문 제거 후 `metrics_registry.json`만 참조하면 sub가 자가 채점 시 키만 알고 가중치·scale·기록 규칙을 모르는 상태에서 발언 종료 → finalize 산출 시 누락·잘못된 형식.

`session-end-finalize.js`가 self-scores 추출하는 로직(메모리에 PostToolUse hook self-scores 자동 추출 b45b144 commit)이 메트릭 키 매칭만 하면 본 함정은 작동 — 하지만 **scale 검증 누락 시 N 대신 0 같은 잘못된 값이 박제**되어 누적 평균이 왜곡.

**완화 + fallback**:
- (mitigation) `_common.md`(공통 정책)에 self-score YAML 골격 + scale 규칙(0-5 정수 / Y·N / ratio 0~1 소수2자리) 명시. registry는 키·가중치·정의만, scale·기록 규칙은 공통 정책 파일에. 즉 메트릭 본문 일부는 `_common.md`로 이전, 일부만 registry 참조.
- (fallback) finalize self-score 추출 로직에 scale validator 추가 — scale 위반 시 해당 turn의 selfScores를 `null`로 박제하고 gap에 `selfScore-scale-violation: turn ${idx}` 기록. 0 무성행 박제 금지.
- (verification) G3 단위 테스트: "scale 위반 selfScores 입력 → finalize가 null 박제 + gap 기록".

### 🟡 R-7. `_common.md`이 무한히 비대해지는 함정 (옵션 2 고유)

옵션 2 핵심 가치는 "공통 정책 중복 제거". 그러나 미래 새 정책(예: 신규 hook 계약·신규 frontmatter 필드)이 추가될 때마다 `_common.md`에 누적되면 **8역할 모두에게 매번 inject되는 비용 증가**. token cap에 점근하면 R-1 silent miss 재발.

**완화**:
- (mitigation) `_common.md` 라인 수 cap 100줄 박제 (CLAUDE.md 1단락에 박제 — Section 4 Master 가이드와 함께).
- (fallback) 100줄 초과 시 P5(미래 토픽)로 "공통 정책 분할" 별도 토픽 오픈 강제. session-end finalize가 라인 수 검증.

### 🟡 R-8. P1 시범 역할 선택의 편향 — arki 1건만으로 G1 통과 판정 위험

Arki는 P1 시범 역할로 자기 자신(arki)을 권고. 그러나 arki 페르소나는 **Rich Hickey 사고 모델·금지어 명시 등 분리가 가장 쉬운 역할**. 분리가 어려운 역할(예: 페르소나·정책 경계가 모호한 ace, 또는 가장 짧은 dev)에서 발견될 함정이 G1을 통과해버림.

**완화 + fallback**:
- (mitigation) P1 시범을 1역할이 아닌 **3역할** — 분리 쉬움(arki) + 분리 모호(ace) + 분리 짧음(dev) — 으로 확장. 작업량 증가 미미(파일 9개 vs 3개), 함정 발견 망 3배.
- (fallback) P1에서 ace 분리 어렵다고 판명되면 **옵션 1(2층 정적 분리)로 부분 fallback** — ace만 단일 파일 유지하고 나머지 7개만 옵션 2 적용. P3 머지 시 atomic 원칙은 "옵션 2 적용 7역할 한 commit"으로 재정의.

---

## 4. Arki 가정 감사 (검증 안 된 가정 식별)

본 항목은 메모리 정책 "Arki 자기감사 — Master 압박 수용"의 적용. Master 압박 없이도 1차 자발 감사:

### 가정 A1: "hook v2가 이미 prompt mutation 작동 중 → 페르소나 prepend는 단순 확장"
**검증**: ✓ 직접 증거 (logs/pre-tool-use-task.log에 mutate-v2 라인 3건). **이 가정은 검증됨**.

### 가정 A2: "1역할당 ~3KB → token 폭증 위험 낮음"
**미검증**. 현 메모리 자가평가 단순화(D-092)에도 불구하고 페르소나 35줄 ~1KB·정책 30줄 ~1KB·공통 60줄 ~2KB 추정은 **줄당 평균 ~33바이트 가정**. 한국어 UTF-8은 **줄당 평균 ~80~120바이트** (조사·동사·전문용어). 실제론 **3KB가 아닌 7~10KB**일 가능성. 8역할 동시 호출은 없지만 **단일 호출도 토픽+세션 layer와 합치면 80KB cap 60% 점유 가능**. R-1·R-7 재확인 근거.

### 가정 A3: "session_125 dry-run 위반 0건 → 페르소나 inject 시점 role-unknown 위험 0"
**부분 검증**. session_125 dry-run은 v2(persona inject 없음)에서의 role 식별 검증. **v3에서 persona inject 추가 후 같은 검증 미실시**. KNOWN_ROLES에 vera 미등록 (Section 4 경계조건 인지) + designer 호환 등 변경점 후 회귀 검증 필요. P2 G2 단위 테스트에 "role=unknown 시 fallback 동작" 케이스 명시 필요.

### 가정 A4: "Master 휴먼 편집성 7회 vs hook 코드 0회 → 옵션 3 기각"
**미검증 — 표본 편향 가능성**. "Master가 페르소나·정책을 직접 수정한 7회"와 "hook 코드를 수정 안 한 0회"는 다른 측정. 옵션 3(JS 객체) 도입 후엔 정책 수정 자체가 코드 수정과 동일해지므로 **빈도 비교 자체가 의미 없음**. 옵션 3 기각 근거는 "휴먼 편집성 가치"로 명시하고 빈도 비교는 보조 근거로만. Arki 권고의 본질적 정당성은 유지되지만 근거 강도는 1단계 약화. 옵션 2 채택은 동의.

---

## 5. spec 동결 가능 여부

**조건부 Y — Arki 권고 옵션 2 + Section 1·3·4 mitigation 6건 추가 시 spec 동결 가능**.

추가해야 할 항목:
- (R-1) hook v3 layer 절삭 우선순위 명시 + persona 절삭 금지
- (R-2) hook 등록 헬스체크 + finalize 사후 매칭
- (R-3) P3 atomic 머지 + persona-missing phase 라인
- (R-4) PD-043 미완 사후 매칭 추가 작업 P4에 명시
- (R-6) `_common.md`에 self-score scale 규칙 이전 + finalize scale validator
- (R-8) P1 시범 1역할→3역할 확대

**spec 동결 미충족 시 옵션 보강 필요 영역**: 옵션 2 골격은 유지, 위 6건 mitigation을 Arki 실행계획 P1·P2·P3·P4에 명시 분배.

다른 옵션 재고 필요성: **없음**. 옵션 1·3은 위 함정 중 R-2·R-4(F-A·F-B 신경로)는 동일하게 가지고 R-1·R-7(token·_common)만 옵션 2 고유. 옵션 변경으로 함정 회피 안됨.

---

## 6. 종합 — Master 인계 권고

본 발언으로 옵션 2 + mitigation 6건이 spec 동결 가능 상태. Ace 종합검토에서 결재할 항목:
1. 옵션 2 + 본 mitigation 6건 통합 spec 채택
2. PD-044 재정의 박제 (Arki Section 6 권고 그대로)
3. PD-043 미완 영역(F-B 사후 차단)을 본 토픽 P4에 흡수할 것인가 또는 별도 토픽으로 분리할 것인가 — Master 결재 필요. Riki 권고: P4 흡수 (분리 시 정보 휘발).

폐기한 곁가지(메모리 정책 준수):
- ~hook 코드 가독성·주석 품질 의견~ — 본 결정 무관
- ~`_common.md` 파일명 컨벤션 의견~ — 본 결정 무관
- ~vera 페르소나 신규 작성 권고~ — Ace Out scope에 이미 포함
- ~옵션 3 재논쟁~ — Section 4 가정 감사로 충분, 결론 동일

---

```yaml
# self-scores
crt_rcl: Y
cr_val: 4
prd_rej: Y
fp_rt: 0.10
```

- `crt_rcl: Y` — 🔴 4건(R-1·R-2·R-4·R-6) 모두 Master 미인지 가능성 있는 silent miss·정책 위반 경로. 특히 R-2(hook 등록 회귀 부재)는 session_128 [A] 실패지점 직접 후속.
- `cr_val: 4` — 모든 🔴 리스크에 mitigation + fallback + verification(G 게이트 단위 테스트) 3중 병기. R-7만 verification 없음(미래 비대화 검증 자체가 추적적이라 본 토픽 G 게이트 외).
- `prd_rej: Y` — 4개 곁가지 명시 폐기 선언 (Section 6 마지막). 페르소나 톤·문체 의견·코드 가독성 등.
- `fp_rt: 0.10` — 직전 3세션(session_127·128·129) Riki 제기 리스크 중 1건(session_127 가벼운 typo 리스크 추정)만 발현 안 됨, 나머지 다수 발현. 추정치.

RIKI_WRITE_DONE: reports/2026-04-28_persona-structure-redesign/riki_rev1.md
