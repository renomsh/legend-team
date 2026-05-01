---
role: riki
session: session_155
topic: topic_137
topicSlug: nexus-structure-v1
date: 2026-05-01
turnId: 2
rev: 1
invocationMode: subagent
---

# Riki — G-1 구현 리스크 감사

Arki 권고안(checkVersionBumpConfirmation 신규 함수 추가)에 대한 실측 기반 리스크 점검.
실측 파일: `.claude/hooks/session-end-finalize.js` — `detectVersionBump`, `applyVersionBump`, `auditEdiLlmInvocation` 패턴 직접 확인.

---

### 🟡 R-1. `detectVersionBump` 분류 로직 오분류로 G-1 검사가 유령 경고 발동

**실측 근거:**
`detectVersionBump` (line 1100–1128)는 세 카테고리 분류 중 `.claude/hooks/`로 시작하는 파일을 `capacity`(+0.01)로 처리한다.
`session-end-finalize.js`에 `checkVersionBumpConfirmation` 함수를 추가하면, 해당 세션 자체의 git status에 `.claude/hooks/session-end-finalize.js`가 포함되어 `versionBumpSuggested.value = 0.01`이 박제된다.

그러면 신규 함수가 추가된 첫 세션에서 `checkVersionBumpConfirmation`이 호출되어 "Edi 미확정" 경고를 발동한다.
이 경고는 구현 세션에서 Edi가 반드시 versionBump를 확정해야 한다는 뜻이지만, **구현 세션 Edi가 실제로 확정 기록을 남겼는지 여부와 무관하게 hook 실행 시점에 선후 관계가 보장되지 않는다.**

구체적 실패 시나리오:
- Edi LLM이 `versionBump` 확정을 `current_session.json`에 기록
- `session-end-finalize.js` 실행 시 `sess`를 파일에서 읽어오는 구조라면 반영됨 → 정상
- 그러나 Edi LLM이 세션 종료 hook 실행 이전에 `versionBump`를 기록하지 못한 경우(예: hook이 Edi 발언 완료 전에 트리거), 기술적으로 정상 세션에서도 G-1 경고가 발동된다.

**실제 파손 범위:** openMasterAlerts에 false positive 경고 누적 → Master가 G-1 경고 신호를 무시하는 습관 형성(경보 피로).

**완화 조건:** Arki 설계의 warn-only는 적절. 추가로 `checkVersionBumpConfirmation` 내에 "현재 세션 Grade A/B/S AND hook 변경 파일이 session-end-finalize.js 단독" 조건에서 severity를 'info'로 낮추거나 suppress하는 guard 추가 검토.

---

### 🔴 R-2. `applyVersionBump` 와 `checkVersionBumpConfirmation` 간 이중 gaps 박제 — 동일 세션에 두 종류 gap이 공존

**실측 근거:**
`applyVersionBump` (line 1173–1183): `versionBump` 존재하나 `confirmedBy !== 'edi'` → `'version-bump-unverified'` gap 박제.
Arki 제안의 `checkVersionBumpConfirmation`: `versionBump` 미존재 OR `confirmedBy !== 'edi'` → `'version-bump-edi-unconfirmed'` gap 박제.

**시나리오:** Edi가 `versionBump` 필드를 박제했으나 `confirmedBy`를 `'edi'`가 아닌 다른 값으로 설정한 경우:
1. `applyVersionBump` → `'version-bump-unverified'` gap 박제 (기존 코드)
2. `checkVersionBumpConfirmation` → `'version-bump-edi-unconfirmed'` gap 박제 (신규)

두 gap이 동일 세션 배열에 공존. dashboard나 finalize 집계 로직이 두 타입을 독립적으로 카운트하면 같은 사건이 2배로 계상되어 severity 에스컬레이션 조건이 조기 트리거될 수 있다.

**실제 파손 범위:** 지표 왜곡. `edi-llm-skipped` (severity='high') 패턴처럼 openMasterAlerts 중복 주입 방지 로직이 `auditEdiLlmInvocation`에는 존재(line 911: `dup` 체크)하지만, 두 다른 type의 gap에 대한 cross-dedup 로직은 없다.

**완화 조건:** `checkVersionBumpConfirmation` 내부에서 기존 gaps에 `'version-bump-unverified'`가 이미 박제되어 있으면 추가 박제를 skip하는 early return 추가. OR 두 타입을 `'version-bump-unconfirmed'`로 통합하고 `applyVersionBump`의 기존 gap 타입을 동일 타입으로 변경.

---

### 기각 리스크

- **"Edi가 versionBump를 항상 누락할 것"**: 추측성. Arki가 Edi 확정 프로토콜 구조를 명시하므로 정책 이행 가능성 존재.
- **"git status 실패 위험"**: Arki 기 식별. 의도된 동작(suggested 미박제 = 경고 없음)이므로 추가 리스크 없음.
- **"세션 종료 차단 필요"**: warn-only 설계가 저마찰 원칙에 부합. block 추가는 ROI 불명확.

---

[ROLE:riki]
# self-scores
crt_rcl: Y
cr_val: 4
prd_rej: Y
fp_rt: 0.10
