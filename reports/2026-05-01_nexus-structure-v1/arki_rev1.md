---
role: arki
session: session_155
topic: topic_137
topicSlug: nexus-structure-v1
date: 2026-05-01
turnId: 1
rev: 1
invocationMode: subagent
---

# Arki — G-1 Hook 강제 구현 설계

---

## 1. 현황 분석

### 1-A. versionBump 처리 흐름 (있는 그대로)

```
session-end-finalize.js 실행 순서 (관련 함수만):

detectVersionBump(sess)         [line 1368]
  ↓ git status --porcelain 실행
  ↓ 파일 카테고리 분류 (structural/capacity/bugfix)
  ↓ sess.versionBumpSuggested = { value, type, reason, confirmedBy: null }
  ↓ writeJson(CURRENT_SESSION_PATH, sess)  ← 박제 완료

applyVersionBump(sess)          [line 1369]
  ↓ sess.versionBump 존재 여부 확인
  ↓ confirmedBy === 'edi' AND confirmedAt 존재 검사  [line 1173]
  ↓ 조건 미충족 시: gaps 'version-bump-unverified' 박제 후 return
  ↓ 조건 충족 시: project_charter.json version 갱신
```

### 1-B. versionBumpSuggested vs versionBump 구분

| 필드 | 설정 주체 | 설정 시점 | 의미 |
|---|---|---|---|
| `versionBumpSuggested` | hook (detectVersionBump) | 세션 종료 자동 | Nexus 감지 제안값. confirmedBy: null |
| `versionBump` | **Edi (LLM)** — 미구현 | Edi 발언 중 수동 | 확정값. confirmedBy: 'edi', confirmedAt 필수 |

### 1-C. G-1 갭의 정확한 위치

`applyVersionBump`는 `sess.versionBump.confirmedBy !== 'edi'` 시 **gaps 박제 후 return**한다.
그러나 이 gaps는 시각적 경고에 불과 — **Edi가 `versionBump` 필드를 아예 쓰지 않아도 세션은 정상 종료**된다.

결함 체인:
```
versionBumpSuggested 존재
  → Edi LLM이 발언하지 않거나 versionBump 미기록
  → applyVersionBump: "versionBump 없음 — skip" (warn 없음, [line 1169])
  → project_charter.json 미갱신
  → 갭 기록 없음 (침묵 실패)
```

---

## 2. 구현 옵션

### Option A — session-end-finalize.js 내부 검사 추가

**변경 파일:** `.claude/hooks/session-end-finalize.js`

**로직 요약:**
`applyVersionBump` 직후에 새 함수 `checkVersionBumpConfirmation(sess)` 추가.
조건: `sess.versionBumpSuggested` 존재 AND `sess.versionBump` 미존재 (또는 confirmedBy !== 'edi') → gaps 박제 + system_state.openMasterAlerts prepend.

```
detectVersionBump(sess)           → versionBumpSuggested 박제
applyVersionBump(sess)            → versionBump 없으면 skip (기존)
checkVersionBumpConfirmation(sess) [신규] → G-1 검사
  if versionBumpSuggested && !versionBump.confirmedBy('edi')
    → gaps 'version-bump-edi-unconfirmed' 박제
    → openMasterAlerts prepend
    → log warn
```

**trade-off:**
- 장: 단일 파일 변경. 기존 패턴(auditEdiLlmInvocation, checklistDeltaCheck)과 동일 구조.
- 단: 세션 종료 후 사후 탐지 — Edi 발언 중 실시간 강제 불가.

---

### Option B — role-edi.md 정책 + hook 이중 레이어

**변경 파일:** `memory/roles/policies/role-edi.md` + `session-end-finalize.js`

**로직 요약:**
role-edi.md에 "versionBumpSuggested 존재 시 versionBump 확정 의무" 조항 추가 (정책 레이어).
hook에서 Option A 동일 검사 (enforcement 레이어).

**trade-off:**
- 장: 정책+코드 이중 방어. CLAUDE.md D-130 정책 명문화와 정합.
- 단: 파일 2개 변경. LLM 정책 레이어는 D4 원칙상 신뢰 불가 → hook 없이 정책만으론 무의미. 실질 강제는 hook이 전담.

---

## 3. 권고안 — Option A (단일 hook 함수 추가)

D4 원칙: "enforcement는 코드(hook)에 박제, 모델 자율 판단에 의존하지 않는다."
정책 레이어 추가는 부수적. hook이 단일 강제 수단.

### 추가 함수: `checkVersionBumpConfirmation(sess)`

**trigger 조건:**
```
sess.versionBumpSuggested 존재
AND (
  sess.versionBump 없음
  OR sess.versionBump.confirmedBy !== 'edi'
  OR !sess.versionBump.confirmedAt
)
```

**출력 형태:**

| 신호 | 출력 | 이유 |
|---|---|---|
| gaps 박제 | `type: 'version-bump-edi-unconfirmed'` | checklist delta-check와 동일 패턴 |
| openMasterAlerts prepend | `severity: 'warn'` | `edi-llm-skipped`는 high, 이건 warn (미확정이지 오류 아님) |
| log warn | `⚠ versionBumpSuggested 미확정` | dashboard 카운터 소스 |
| block 없음 | — | 세션 종료 차단은 과잉. warn-only가 저마찰 원칙에 부합 |

**호출 위치:**
```javascript
applyVersionBump(sess);
checkVersionBumpConfirmation(sess);  // [신규 — 바로 다음]
escalateAceAcksWithTTL(sess);
```

### Edi 확정 프로토콜 (정책 명시 대상)

Edi가 versionBump 확정 시 current_session.json에 기록해야 할 구조:
```json
{
  "versionBump": {
    "value": 0.01,
    "from": "1.05",
    "to": "1.06",
    "reason": "G-1 hook 추가 — capacity 레이어 확장",
    "confirmedBy": "edi",
    "confirmedAt": "2026-05-01T...",
    "overrideReason": null
  }
}
```

---

## 4. Phase 분해

```
Phase 1 ──→ Phase 2 ──→ Phase 3
  코드 구현      검증        정책 박제
```

### Phase 1: `checkVersionBumpConfirmation` 함수 구현

**무엇을:** `session-end-finalize.js`에 신규 함수 추가 + 호출 위치 삽입

**완료 기준:**
- 함수 존재 (`checkVersionBumpConfirmation` 이름 확인)
- `versionBumpSuggested` 있고 `versionBump` 없는 테스트 sess 객체로 함수 직접 호출 → gaps + openMasterAlerts 박제 확인
- `versionBump.confirmedBy = 'edi'` 케이스에서 경고 미발동 확인

**검증 방법:**
```bash
node -e "
const fs = require('fs');
const sess = {
  sessionId: 'test_sess',
  versionBumpSuggested: { value: 0.01, type: 'capacity', reason: 'test' },
  gaps: []
};
// checkVersionBumpConfirmation(sess) 직접 호출 후 sess.gaps 확인
"
```

### Phase 2: 정상 케이스 검증

**의존:** Phase 1 완료

**완료 기준:**
- `versionBump.confirmedBy === 'edi'` + `confirmedAt` 있는 sess → 경고 0건
- 기존 `applyVersionBump` 동작 (project_charter 갱신) 영향 없음

**검증 방법:** node 인라인 단위 테스트 (파일 의존 없이)

### Phase 3: role-edi.md 정책 박제

**의존:** Phase 1 완료 (정책은 hook 구현 후 명문화)

**완료 기준:**
- `role-edi.md` §6.4 (또는 신규 섹션)에 versionBump 확정 의무 + 필드 구조 명시
- CLAUDE.md D-130 조항과 용어 일치 확인

**검증 방법:** 텍스트 diff 검토

---

### 경계 조건 (설계가 깨지는 조건)

| 조건 | 위험 | 대응 |
|---|---|---|
| Edi LLM이 `versionBump` 박제했으나 `confirmedAt` 누락 | applyVersionBump가 skip하고 checkVersionBumpConfirmation도 warn 발동 | Edi 박제 구조에 `confirmedAt` 필수 명시 |
| `versionBumpSuggested.value === 0` (bump 없음) | checkVersionBumpConfirmation skip 대상 | trigger 조건에 `value > 0` 가드 추가 |
| legacy 세션 (`sess.legacy === true`) | detectVersionBump가 실행됨 (기존 코드에 legacy 가드 없음) | checkVersionBumpConfirmation에 legacy guard 추가 |
| git status 실패로 versionBumpSuggested 미박제 | 정상 — 경고 미발동 | 의도된 동작 |

---

### 자기감사 (1차)

**structuration:** checkVersionBumpConfirmation은 기존 함수들(auditEdiLlmInvocation 등)과 동일 패턴 — 분리 명확.
**hardcoding:** severity 'warn' 하드코딩. dispatch_config.json 외부화는 NICE 수준 (현재 다른 함수들도 동일 방식).
**efficiency:** git status는 detectVersionBump에서 이미 실행됨. 중복 호출 없음.
**extensibility:** 향후 override 허용 시 `checkVersionBumpConfirmation` 내부에 override_reason 검사 추가 지점 명확.

ROI 라벨: 함수 추가 = `MUST_NOW`. role-edi.md 정책 박제 = `MUST_BY_N=10`. dispatch_config 외부화 = `DEFER`.

발견 2개: legacy guard 누락 (MUST_NOW 포함), confirmedAt 필수 명시 (MUST_BY_N=10).

---

ARKI_WRITE_DONE: reports/2026-05-01_nexus-structure-v1/arki_rev1.md
