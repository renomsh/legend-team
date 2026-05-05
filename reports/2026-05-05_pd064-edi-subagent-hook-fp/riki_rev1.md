---
role: riki
turnId: 1
sessionId: session_194
topicId: topic_167
grade: B
invocationMode: subagent
accessed_assets:
  - reports/2026-05-05_pd064-edi-subagent-hook-fp/arki_rev1.md
  - .claude/hooks/pre-tool-use-task.js
  - .claude/hooks/session-end-finalize.js
  - reports/2026-05-05_self-score-table-format-unify/_zero_condense.json
  - reports/2026-05-05_pd062-selfscore-weight-sot/_zero_condense.json
  - memory/roles/policies/role-riki.md
---

RIKI_WRITE_DONE: reports/2026-05-05_pd064-edi-subagent-hook-fp/riki_rev1.md

# Riki 점검 — PD-064 Arki 진단

Riki입니다. 행위 기반 검증.

---

## 사실 검증

### 결함 #1: ✅ (사실 확인, 단 라인 번호는 미세 어긋남)
- `pre-tool-use-task.js` L214 `evaluateZeroCondenseGate` 함수 존재. 결정 라인 L221–L222 `marker.sessionId === sess.sessionId` 정확.
- 마커 키 드리프트 사실 확정:
  - session_191 마커: `"session": "session_191"`, `"topic": "topic_164"` — `sessionId` 키 **부재**.
  - session_193 마커: `"sessionId": "session_193"`, `"topicId": "topic_166"` — canonical.
- L226 `try {} catch {}` 빈 핸들러 silent BLOCK 사실. fs.existsSync 분기 안에서만 try로 감싸는 비대칭(존재 체크는 외부, 파싱은 내부)이라 진단 어려움 가중.
- **반박 1건**: Arki는 게이트 함수 범위를 "L214–L252"라고 했는데 실측 L214–L252 일치. 라인 fidelity OK.

### 결함 #2: ✅ (사실), 그러나 결정 라인 분석에 부정확 1건
- L429 `validateInlineRoleHeaders` 사실. L476 `if (turnId < turns.length) { const turnRole = turns[turnId] && ... }` 사실 — array index 직접 접근 확정.
- KNOWN 리스트 L493: `['ace', 'arki', 'fin', 'riki', 'nova', 'dev', 'edi', 'designer']` — `jobs`, `zero`, `sage`, `vera` **부재** 사실.
- **부정확**: Arki는 "정상 H1을 unknown 처리(silent skip)하거나 잘못된 mismatch 보고"라 했는데, 코드 L494 `if (KNOWN.includes(h1Role) && h1Role !== role)` 로직상 KNOWN 미포함 H1은 **silent skip만** 발생, "잘못된 mismatch 보고" 분기는 발생 불가. 즉 결함 영향은 **silent skip 단일 경로**. mismatch 오발은 frontmatter role과 H1이 둘 다 KNOWN일 때만.

### 결함 #3: ✅ (사실)
- `detectVersionBump` L1165, `applyVersionBump` L1278, `checkVersionBumpConfirmation` L1363 위치 정확.
- L1167 `if (sess.versionBump && (sess.versionBump.value || sess.versionBump.to))` skip — Edi 우선 흐름 사실.
- L1286 `if (bump.confirmedBy !== 'edi' || !bump.confirmedAt)` 강제 사실.
- **충돌 판정 로직 0건** — 코드 grep상 hook suggested vs Edi confirmed value/type 비교 분기 부재 확인.

---

## 가정 감사

### A1. "role-zero schema 명문화 부재" — 검증 불가, 그러나 행동상 사실
- session_191 마커가 옛 키로 박제됐다는 행위 자체가 schema 단일 출처 부재 증거. role-zero.md 직접 read 안 했지만, **실제 키 드리프트 발생** = 강제 메커니즘 부재 = 사실상 명문화 부재. Arki 추정 인정.

### A2. "turnIdx 정책 미정" — 부분 검증, **반례 가능**
- session_193 session_index에서 arr_idx == turnIdx 일치는 우연이 아닐 수 있음. 만약 `append-session.ts`가 turnIdx를 array push 시 length로 자동 부여한다면 **항상 일치**. Arki는 D-048 "분리/병합으로 skip 가능"이라 추정했지만, **실제로 turnIdx skip 발생한 세션이 있는지 증거 미제시**. 추정 단계.
- 그러나 코드 강건성 관점에서 array index 직접 접근은 여전히 fragile. turnIdx와 array position의 의미 분리는 옳음. 결함 자체는 인정.

### A3. "session_191 confirmedBy:null이 zero-condense gate FP cascade" — 검증 안 됨
- Arki는 결함 #1과 #3을 cascade로 묶었으나, session_191 마커가 옛 키로 작성됐다는 사실만으로 Edi가 BLOCK 당했는지는 별개. 마커가 옛 키라도 fs.existsSync는 통과 → readJsonFile은 객체 반환 → `marker.sessionId === sess.sessionId`는 `undefined === 'session_191'` → false → BLOCK. 즉 cascade 흐름 자체는 논리적으로 성립. 다만 **session_191 실제 turn 로그**(Edi BLOCK 발생 여부)는 미확인. 추정-기반-인과 단계.

---

## 실패모드 (Arki 수정안 적용 시)

### F1. legacy 마커 normalize 마이그레이션 — closed 토픽 마커 변조 위험 🔴
- session_191은 이미 **closed**. 마이그레이션 스크립트가 옛 키 → canonical 키로 변환하면 **사후 박제** 발생 = 감사 추적 무결성 훼손. D-028 "session_index.json은 append-session.ts로만 수정"의 정신과 충돌(직접 문서 변조).
- 더 나쁜 시나리오: 마이그레이션이 옛 키를 **삭제**하면, 추후 재현 시 옛 시점 행위 재구성 불가. **결함 #1의 mitigation을 결함 #3 root cause(history 변조)로 만든다**.

### F2. findTurnById helper — 기존 session_index 호환성 OK, 그러나 한 케이스 우려 🟡
- 기존 박제 turn 배열이 turnIdx 필드를 누락한 legacy turn이 섞여 있으면 lookup miss → "turn-not-found" gap 박제 → 새로운 노이즈. Arki R3가 이것을 일부 다뤘으나 "severity 'info' 강등"으로는 부족. **legacy turn은 검증 자체를 skip해야 안전**.

### F3. reconcileVersionBump — D-130 위반 가능성 🟡
- Arki는 "reconcile은 검증만, confirmedAt 박제는 Edi turn"이라 했으나, 룰 (a) "Edi value > suggested → Edi 인정" 자체가 **자동 판정**. 자동 판정 = hook의 의미 부여 = D-130 "Edi 단일 책임" 잠식. Arki 본인 R2와 같은 우려를 적었으나 mitigation이 같은 함수 안에서 자기 회피 — 구조적 모순.
- 더 안전: reconcile은 **차이 감지 + 경고 박제만**, confirm/reject 결정은 Edi turn에서 명시적 처리. Arki 룰 (a)(b)(c)는 hook이 결정하는 모양새라 위험.

---

## 모순·간과

### G1. 결함 #2 KNOWN 리스트 보강 — `_common.md` H1 충돌 🟡
- `# self-scores` 같이 self-score 블록이 `# 자기소개` 같은 H1으로 시작한 보고서가 있으면, 신규 KNOWN에 `jobs/zero/sage` 추가 시 우연히 매칭. 신규 mismatch 발생 가능. Arki R3 "1세션 dry-run"은 약함, 실제 reports/ 전체 H1 패턴 grep 선행 필요.

### G2. 결함 #3 — Edi 자체가 호출 안 된 세션의 처리 부재
- session_191처럼 #1 cascade로 Edi turn 자체가 발생 안 한 경우, `bump.confirmedBy === null` 강제 때문에 `applyVersionBump`는 skip되고 `checkVersionBumpConfirmation`이 high gap 박제. 그러나 **Edi가 호출조차 안 됐는데 "Edi 미확정" gap을 박제하는 것이 옳은가**? 진짜 root는 "Edi dispatch 자체 실패"인데 gap type은 "version-bump-edi-unconfirmed"로 misclassify.
- 4번째 결함 후보: **gap type misclassification**. Edi 호출 부재 시 `version-bump-edi-not-dispatched` 별도 type 필요.

### G3. zero-condense 마커 — `completedAt` 필드도 드리프트 🟡
- session_191: `executedAt`. session_193: `completedAt`. Arki는 sessionId/topicId 키만 다뤘는데 timestamp 키도 드리프트. canonical schema 정의 시 `completedAt`로 통일해야 미래 호환 결정 필요.

---

## 거부 로직

### Arki "단일 최적해" 단언 검증

**결함 #1 단일 최적해 = "헬퍼 + Zero 명문화 + 마이그레이션"** — **과대**.
- 더 작은 fix: **legacy 마커 호환 read만 추가**(F1 위험 회피). 게이트가 `marker.sessionId || marker.session` 둘 다 read하면 session_191 케이스도 통과. 마이그레이션 스크립트 자체 불필요. 신규 마커는 헬퍼로 canonical만 강제.
- Arki R2 fallback이 이미 "legacy 키 read"를 언급했는데 main 안으로 승격하면 됨. 마이그레이션 자체를 핵심 path에서 **제외 권고**.

**결함 #2 단일 최적해 = "findTurnById + KNOWN 보강 + 주석"** — 적절.
- 다만 "O(n) → Map 캐시" 최적화는 premature. 세션당 turn 수가 두 자리인 현 시점 ROI 0. Arki R1은 over-engineering.

**결함 #3 단일 최적해 = "reconcile 함수"** — **과대**.
- 더 작은 fix: 충돌 감지 시 **gap 박제만** ("version-bump-suggested-vs-confirmed-diff"). Edi가 다음 turn에서 보고 수동 해소. 자동 룰 (a)(b)(c)는 D-130 위반 그레이존, 도입 자체를 보류 권고.

---

## 종합 판정

**Arki 진단: 채택 가능, 단 수정 필요 3건.**

1. **#1**: 마이그레이션 스크립트 path 제거 → 게이트 호환 read로 축소.
2. **#2**: 채택. dry-run 전 reports/ H1 grep 선행 명시 추가.
3. **#3**: reconcile 자동 룰 도입 보류 → 차이 감지 + gap 박제만. Edi가 수동 해소.

추가 조치:
- **G2 4번째 결함 등록 권고** — Edi dispatch 부재 시 gap type 분리. (PD-064 scope 확장 또는 별도 PD)
- **G3** — schema canonical 정의 시 timestamp 키도 SOT 박제.

종합: Arki 구조 진단의 **결함 식별은 유효**, **수정 방향은 일부 over-reach**. legacy 변조·자동 판정 hook 두 영역에서 더 작은 fix가 충분.

---

## SelfScores

[ROLE:riki]
# self-scores
crt_rcl: 0.5
cr_val: Y
prd_rej: Y
fp_rt: 0
