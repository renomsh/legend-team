---
turnId: 1
invocationMode: subagent
role: arki
topic: topic_127
session: session_129
grade: S
phase: structural-design
date: 2026-04-28
executionPlanMode: plan
---

# Arki 구조 진단 — 페르소나/role 분리 + hook compose

Arki입니다. Ace 프레이밍 결정축(SOT=`memory/roles/personas/` 단일, 경계=정체성 vs 정책, 목적=오염방지+경량화)과 Master 종착점("가능한 영역까지, 구현까지")을 받아, 본 토픽이 hook 동적 compose 노선이 사실상 유일한 경로라는 전제 위에서 옵션·실행계획을 제시합니다.

---

## 1. 기술적 성립 여부

핵심 전제 3건을 즉시 검증합니다.

### 1.1 hook prompt mutation 가능성
- `pre-tool-use-task.js` v2가 이미 `hookSpecificOutput.updatedInput.prompt`로 prompt 변형 수행 중 (라인 319~329). 본 발언 dispatch-context도 그 결과물.
- 페르소나 prepend는 **이미 작동하는 것의 단순 확장** — 새 메커니즘 도입 아님. **성립 ✓**.

### 1.2 role 식별 가능성
- v2의 `extractRole()` 3-priority(`## ROLE:` 마커 → subagent_type → description 첫 단어)가 D-103/PD-033으로 박제. session_125 dry-run 위반 0건.
- 페르소나 inject 시점에서 role을 모를 위험 = 0. **성립 ✓**.

### 1.3 metrics 분리 SOT 정합
- D-092가 이미 `metrics_registry.json` 단일 출처를 박제. 페르소나·role 파일이 메트릭 본문 보유 시 D-092 위반 (현재 8개 파일 모두 위반 중 — `## Self-Score YAML 출력 계약` 섹션 + `### 본 역할 지표` 섹션이 중복).
- 본 토픽으로 메트릭 본문 제거 + registry 참조만 남기면 D-092 정합 회복. **성립 ✓**.

### 1.4 잠재 결함 1건 (str_fd)
- **hook 실패 시 페르소나 silent miss**: 현 v2는 catch 블록에서 `silent pass — 원본 호출 보호` (라인 345~348). 페르소나가 없는 채 서브가 발언하면 "정체성 없는 응답"이 산출되지만 메인은 모름. → **fallback 메커니즘 필요**: hook이 페르소나 inject 실패 시 prompt에 명시적 경고 마커 prepend("⚠ PERSONA_INJECT_FAILED: role={role}"), 서브가 본 마커 감지 시 자기소개 후 발언 거부 → 메인이 재호출 결정. 본 결함은 옵션 권고 시 모든 옵션의 공통 제약으로 처리.

---

## 2. 프로토콜 호환성

| 기존 시스템 | 충돌 여부 | 처리 |
|---|---|---|
| **D-092** (메트릭 SOT registry) | 현 페르소나 파일이 위반 중 | 본 토픽이 정합 회복 |
| **D-103** (`## ROLE:` 마커) | 정합 | 그대로 활용 |
| **PD-033** (extractRole 3-priority) | 정합 | 그대로 활용 |
| **D-067** (Frontmatter turnId/invocationMode) | role 정책 영역 | role 파일에 보존 |
| **F-013** (자기소개 제약) | 페르소나 영역 | persona 파일에 보존 |
| **PD-044** ("정책=persona" 박제 노선) | **정반대** | 본 토픽이 흡수·재정의 (Section 6) |
| **session_128 [A] 실패지점** | "페르소나 inject 누락" | 본 토픽이 hook 확장으로 해결 |
| **CLAUDE.md 본문 정책** | 정합 (별도 SOT) | role 파일은 CLAUDE.md 미박제 정책만 흡수, 박제 정책은 참조만 |

---

## 3. 설계 옵션 (3개)

각 옵션은 (a) 파일 구조 (b) 페르소나 형식 (c) role 형식 (d) 정책 SOT (e) hook compose 흐름 (f) 장단 (g) 예상 라인수 순.

### 옵션 1 — 2층 정적 분리 (단순 concat)

- **(a)**: `memory/roles/personas/role-{role}.md` (페르소나) + `memory/roles/policies/role-{role}.md` (정책). `.claude/agents/`는 비움 유지.
- **(b)**: 정체성·페르소나 모델·스타일·절대금지·자기소개제약·원칙 6섹션. **목표 ~30~40줄**.
- **(c)**: 발언구조·컨텍스트활용·Write계약·Frontmatter의무·Self-Score YAML형식(메트릭은 registry 참조)·역할 지표 정의. **~50~60줄**.
- **(d)**: 정책 = role 파일 자체. metrics = `metrics_registry.json` (D-092). 공통 정책(Frontmatter, Self-Score 형식, Write 계약 패턴)은 각 role 파일에 중복.
- **(e)**: hook이 `personas/role-{r}.md` + `policies/role-{r}.md` 단순 concat → prompt 최상단에 prepend.
- **(f)**: 장 = 단순·디버깅 쉬움·휴먼 편집 직관. 단 = 공통 정책 8역할 중복 (Frontmatter·Write 패턴·Self-Score 골격).
- **(g)**: 페르소나 ~35줄 × 8 + 정책 ~55줄 × 8 ≈ 720줄.

### 옵션 2 — 3층 + 공통 정책 (권고)

- **(a)**: `memory/roles/personas/role-{r}.md` + `memory/roles/policies/role-{r}.md` + `memory/roles/policies/_common.md` (공통 정책).
- **(b)**: 옵션 1과 동일. **~30~40줄**.
- **(c)**: 역할별 고유 정책만 — 발언구조·역할 지표 키 목록·역할 특이 컨텍스트 지시. **~25~35줄로 축소**.
- **(d)**: `_common.md`에 Frontmatter 의무·Self-Score YAML 골격·Write 계약 공통 패턴(`{ROLE}_WRITE_DONE` 형식)·금지어 v0 등 8역할 공통분 박제. metrics_registry 참조 규칙도 여기.
- **(e)**: hook이 `_common.md` + `policies/role-{r}.md` + `personas/role-{r}.md` 3개 파일 concat (순서: 공통 → 역할정책 → 페르소나). 페르소나가 마지막에 와야 정체성 톤이 뇌리에 남음.
- **(f)**: 장 = 중복 제거·정책 변경 시 1곳만 수정·D-092 정합·페르소나 가벼움 극대화. 단 = 파일 3개 의존, hook 실패 표면적 1.5배.
- **(g)**: 페르소나 ~35줄 × 8 + 역할정책 ~30줄 × 8 + 공통 ~60줄 ≈ 580줄. 옵션1 대비 약 19% 감축.

### 옵션 3 — 페르소나만 파일, 정책은 hook 코드

- **(a)**: `memory/roles/personas/role-{r}.md` (페르소나만). 정책은 `.claude/hooks/lib/role-policies.js` 모듈에 JS 객체로.
- **(b)**: 옵션 1과 동일.
- **(c)**: 없음. 모든 정책 = JS 객체.
- **(d)**: `role-policies.js`에 역할별 정책 + `_common` 정책 박제. metrics_registry는 hook이 빌드 시 읽어서 정책에 합성.
- **(e)**: hook이 정책 객체 → 마크다운 직렬화 → 페르소나 concat → prepend.
- **(f)**: 장 = 페르소나 가장 가벼움(~35줄)·프로그램 가능·검증 쉬움(JS 단위 테스트). 단 = 휴먼 편집성 손실·정책 변경이 코드 변경=배포·롤백 가시성 낮음.
- **(g)**: 페르소나 ~35줄 × 8 + JS 모듈 ~250줄 ≈ 530줄.

### 권고: **옵션 2**

근거 3가지:
1. **D-092 정합 회복 비용 동일** (옵션 1·2·3 공통). 옵션 2는 추가로 공통 정책 중복 제거로 향후 변경 비용 절감.
2. **페르소나 가벼움 목표 충족**: 옵션 2의 페르소나 35줄 ≈ 옵션 3과 동일. 옵션 1과도 동일. 즉 가벼움은 동률.
3. **Master 휴먼 편집성** vs 옵션 3 프로그램 가능성: Master가 정책을 직접 읽고 수정하는 빈도가 hook 코드를 수정하는 빈도보다 압도적으로 높음(메모리 기록상 7회 vs 0회). 휴먼 편집성 우선이 Master 작업 흐름에 정합.

옵션 1 대비 옵션 2 추가 비용 = `_common.md` 1파일 추가 + hook concat 순서 1라인 추가. 미미.

---

## 4. 경계 조건 (설계가 깨지는 조건)

| 조건 | 깨짐 양상 | 대응 |
|---|---|---|
| **hook 실패** | 페르소나 silent miss → 정체성 없는 발언 | 1.4 fallback 마커 + 메인 재호출 |
| **신규 역할 추가** | 3개 파일 동시 생성 누락 위험 | `scripts/scaffold-role.ts` 신규 (P3에서) — 1커맨드로 3파일 생성 |
| **Master persona 직접 수정** | 정체성 손상 위험 | 페르소나 파일 변경은 git diff로 가시화. 정책 vs 페르소나 경계 한 페이지 가이드 박제 (CLAUDE.md 1단락 추가). |
| **Main이 Agent 미경유 호출** | hook 미발동 → 페르소나 0 inject | C/D grade는 메인 인라인 (이미 정책상 페르소나 불필요). A/S에서 미경유 호출 시 = 정책 위반 → SessionEnd hook이 gap 박제로 검출 |
| **token cap 초과** | hook v2의 단계적 절삭이 페르소나/정책까지 잘라낼 위험 | 페르소나는 절삭 금지 영역으로 지정 (옵션 2 hook 확장 시 우선순위 명시). 세션 turn 보고서가 먼저 절삭. |
| **role-vera 누락** | 현 KNOWN_ROLES에 `designer`만 있고 `vera`는 미등록 | hook KNOWN_ROLES 갱신 필요 (P2에서) |

---

## 5. 실행계획 (executionPlanMode=plan)

### Phase 분해

**Phase 1 — 분리 형식 확정 + 1역할 시범**
- 옵션 2 형식 확정. 가장 분리 명확한 1역할(권고: arki — 페르소나 명확·금지어 정책 명시)로 시범.
- 산출물: `personas/role-arki.md` (분리 후 ~35줄), `policies/role-arki.md` (~30줄), `policies/_common.md` (~60줄, 8역할 공통분 흡수).
- 메트릭 본문 제거 + `metrics_registry.json` 참조로 대체.
- 기존 `role-arki.md`는 `agents-arki.md.old` 백업 후 분리.

**Phase 2 — hook compose 확장 (v3)**
- `pre-tool-use-task.js`에 `buildPersonaLayer(cwd, role)` 함수 추가. `_common.md` + `policies/role-{r}.md` + `personas/role-{r}.md` 3파일 concat → prompt 최상단 prepend.
- 순서: persona-layer → topic-layer → session-layer → 원본 prompt.
- KNOWN_ROLES에 `vera` 추가.
- fallback 마커 구현 (1.4): 페르소나 파일 부재 시 `⚠ PERSONA_INJECT_FAILED: role={role}` prepend.
- 절삭 우선순위: persona-layer 절삭 금지, session-layer 먼저 잘림.

**Phase 3 — 8역할 일괄 마이그레이션**
- 8역할 모두 옵션 2 형식으로 분리. ace/arki/fin/riki/dev/edi/nova/vera.
- 기존 파일 모두 `agents-{role}.md.old`로 백업.
- `scripts/scaffold-role.ts` 신규 — 신규 역할 추가 시 3파일 생성 자동화 (G3 통과 후 작성).
- CLAUDE.md에 "페르소나 vs 정책 경계 가이드" 1단락 추가 (D-092·F-013 인접).

**Phase 4 — 검증 + PD-044 재정의 박제**
- 1세션 dry-run: A/S grade 토픽 1건 호출 → 페르소나 inject 100%·role 식별 100%·금지어 위반 0 확인.
- D-092 정합 회복 확인: 페르소나·role 파일 grep "self-scores" → 메트릭 본문 0건.
- PD-044 재정의 박제 (Section 6).
- session_128 [A] 실패지점 해결 확인 (새 토픽 1건 dry-run).

### 의존 그래프
```
P1 (시범) ─┐
           ├─→ G1 통과 → P2 (hook v3) ─→ G2 통과 → P3 (8역할) ─→ G3 통과 → P4 (검증·박제) ─→ G4
           │
           └─ P1 실패 시 → 옵션 1 fallback 검토
```
P1·P2·P3·P4는 **순차 (병렬 불가)**. P1이 옵션 2의 분리 형식이 실제 작동하는지 입증해야 P2가 의미를 가짐.

### 검증 게이트 (Gn 통과 기준)
- **G1**: arki 시범 호출 1회 → `logs/pre-tool-use-task.log` `injectionLen` 값에 페르소나(~1KB) + 정책(~1KB) + 공통(~2KB) 포함 확인. 서브 발언이 페르소나 어조(Rich Hickey 사고 모델·금지어 준수) 유지.
- **G2**: hook v3 코드 단위 테스트 — (1) 정상 inject (2) 페르소나 파일 부재 fallback 마커 (3) token cap 초과 시 persona-layer 보존·session 절삭. 3건 모두 PASS.
- **G3**: 8역할 일괄 호출 dry-run → 모든 역할에서 inject 성공·자기소개 제약(F-013) 위반 0·금지어(D-017) 위반 0.
- **G4**: A grade 신규 토픽 1건에서 1차 발언 정상 + session_128 실패지점 재현 안 됨. PD-044 재정의 박제 완료.

### 롤백 경로
- **P1 실패** → 시범 분리 산출물 폐기 + 옵션 1로 우회.
- **P2 실패** → hook을 v2로 복원 (`.claude/hooks/pre-tool-use-task.js` git revert) + P1 산출물은 보존(읽혀지지만 inject 안됨 → 무해).
- **P3 부분 실패** (특정 역할 분리 어려움) → 해당 역할만 단일 파일 유지 + hook이 fallback 처리.
- **P4 실패** → PD-044 박제 보류 + Master 재상의.

### 중단 조건
- G1에서 hook prepend 시 prompt 깨짐(이스케이프·인코딩 충돌) 발견.
- 페르소나 + 정책 + 공통 token 폭증 시 (TOTAL_CAP_CHARS 80000 대비 25% 초과 = 20000자 이상). 현 추정: 8역할 모두 inject되는 세션 없음, 1역할당 ~3KB → 위험 낮음.
- Master가 P1 시범 결과를 보고 "분리 자체가 무의미" 판정 시.

### 금지어 v0 준수 확인
본 실행계획에 절대 시간(`D+N일`·`MM/DD`)·인력 배정(`담당자:`)·공수 단위(`N시간`·`N일`) **0건**. 구조적 선후(`P1 → P2`·`G1 통과 후`)만 사용. ✓

---

## 6. PD-044 재정의 박제 권고

PD-044 원안: "역할 정책=페르소나에 박제"는 본 토픽 결정과 정반대 노선입니다. session_128 [A] 실패지점이 PD-044 노선의 한계(페르소나 비대화 → 호출 시 일부 누락 → 정체성 손상)를 실증했습니다.

**재정의 권고 (Master 결재 영역)**:

> **PD-044 → 본 토픽으로 흡수·재정의.** Canonical 분리 원칙: **persona = 정체성·톤·금지·원칙(가벼움) / role = 정책·계약·발언구조(분리) / metrics = registry SOT(D-092)**. 호출 시 hook 동적 compose로 3층 합성. PD-044의 "분리하지 않음" 부분은 폐기, "정책의 명시적 출처화" 부분만 흡수.

박제 권고:
- `pendingDeferrals`에서 PD-044 → resolved (resolveCondition: "topic_127 closed").
- `decision_ledger.json`에 신규 D-{nnn} 박제: 본 분리 원칙 + hook v3 + 8역할 마이그레이션.
- `session-end-finalize.js`가 자동 전이 dry-run에서 PD-044를 본 토픽 자식으로 매칭하도록 `topic_127.resolveCondition` 작성.

---

## 7. 다음 단계 권고

Ace 종합검토 직전 단계입니다. 본 발언 후 권고 흐름:

1. **Riki 호출** — 옵션 2의 함정·우회로 식별 (특히 hook 실패 silent pass·token cap 절삭 우선순위·8역할 마이그레이션 회귀 위험). 발언 직전 spec 동결 권고.
2. **Riki 후 Ace 종합검토** — 옵션 2 확정 + PD-044 재정의 결재.
3. **Dev 인계** (Master 종착점 = 구현까지) — Phase 1 시범부터 착수. writing-plans 스킬 발동 가능.

**spec 동결 (spc_lck=Y)**: Riki 인계 직전 본 발언의 옵션 2 형식·Phase 분해·G1~G4 게이트 기준을 동결합니다. Riki가 함정 발견 시 spec 수정은 Ace 종합검토에서 결재.

---

```yaml
# self-scores
aud_rcl: N
str_fd: 1
spc_lck: Y
sa_rnd: 0
```

- `aud_rcl: N` — Master "한번 더" 압박 없음, 1회 발언 (해당 없음).
- `str_fd: 1` — 1.4 hook silent pass fallback 결함 1건 발견. Section 4 경계조건도 추가 검출(token cap 절삭 우선순위·vera 미등록·신규 역할 scaffold 부재)이지만 단일 결함군으로 묶음.
- `spc_lck: Y` — Riki 인계 직전 spec 동결 명시 선언 (Section 7).
- `sa_rnd: 0` — 자발적 재검토 0회 (본 발언 1차).

ARKI_WRITE_DONE: reports/2026-04-28_persona-structure-redesign/arki_rev1.md
