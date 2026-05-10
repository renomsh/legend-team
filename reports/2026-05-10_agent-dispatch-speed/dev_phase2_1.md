---
role: dev
turnId: 7
sessionId: session_233
topicId: topic_196
invocationMode: subagent
---

# Dev Phase 2.1 — Zero rev1 즉시 수정 5건 mechanical fix

Master, Dev입니다. Zero rev1 §즉시 수정 권고 5건을 적용하고 4 audit 스크립트 회귀 0 확인.

**파일은 git untracked 상태(Phase 1 신설, 아직 미커밋) → `git diff` 표시 0. 대신 적용 전후 코드 인용으로 증거 박제.**

---

## Fix 1 — A-1: 빈 SKILL_WHITELIST + dead branch 제거

**파일**: `scripts/audit-broken-references.ts` L52-55, L84

**Before**
```ts
const SKILL_WHITELIST = new Set<string>([
  // ace-framing 유지 (D-130 명시) — D-130는 폐기 명시지만 디렉터리 자체는 유지일 수 있음
  // 실재 확인은 디렉터리 검사로 자동 결정 → 화이트리스트 사용 최소화
]);
...
if (!exists && !SKILL_WHITELIST.has(ref)) {
```

**After** (Set 전체 삭제, scanFile 함수 직접 시작)
```ts
function scanFile(file: string, projectRoot: string): BrokenRef[] {
...
if (!exists) {
```

---

## Fix 2 — A-3: `||` 양쪽 동일 표현, 우항 제거

**파일**: `scripts/audit-broken-references.ts` L80-82

**Before**
```ts
const refPath = path.join(projectRoot, ref.replace(/\/$/, ''));
const exists = fs.existsSync(refPath) ||
  (ref.endsWith('/') && fs.existsSync(refPath));
```

**After**
```ts
const refPath = path.join(projectRoot, ref.replace(/\/$/, ''));
const exists = fs.existsSync(refPath);
```

`refPath`는 이미 trailing slash 제거된 동일 값 → 우항은 좌항과 동치, 안전 제거.

---

## Fix 3 — A-4: KW_RE의 `|supersedes` 중복 제거

**파일**: `scripts/audit-decision-ledger-status.ts` L33

**Before**
```ts
const KW_RE = /(supersede[ds]?|supersedes|폐기|deprecat(ed|ion|es)?)/i;
```

**After**
```ts
const KW_RE = /(supersede[ds]?|폐기|deprecat(ed|ion|es)?)/i;
```

`supersede[ds]?`가 이미 `supersede`/`supersedes`/`superseded` 모두 커버.

---

## Fix 4 — B-4: row.error 누락 박제

**파일**: `scripts/validate-role-memory-json.ts` L78-91

**Before** — `errors[]`에만 push, `rows[].error` 미반영. 보고서 표 error 칼럼 빈 채로 남음.

**After**
```ts
const missingKeys = !hasLessonLog && !hasMetrics;
const missingKeysMsg = 'missing both lessonLog and metrics keys';

rows.push({
  file: f,
  parseOk: true,
  hasLessonLog,
  hasMetrics,
  size: stat.size,
  // B-4 fix: row.error에도 동일 메시지 박제 (보고서 표 error 칼럼 노출)
  error: missingKeys ? missingKeysMsg : undefined,
});

if (missingKeys) {
  errors.push({ file: f, msg: missingKeysMsg });
}
```

---

## Fix 5 — B-5: referent 행에 self의 status 표시 의미 혼선 정리

**파일**: `scripts/audit-decision-ledger-status.ts` L106-117 (referent-undeclared 분기)

**Before**
```ts
mismatches.push({
  id: d.id,
  type: 'referent-undeclared',
  selfStatus: selfStatusRaw,  // ← self의 status가 referent 행에 표시됨 (혼선)
  referent: ref,
  referentStatus: (refEntry.status as string) || 'active',
  textSnippet: snippet(body, kwMatch),
});
```

**After**
```ts
mismatches.push({
  id: d.id,
  type: 'referent-undeclared',
  // B-5 fix: referent 행에서는 self의 status 표시 회피 (의미 혼선 방지)
  // 핵심 정보는 referentStatus — 본 행 주체는 referent
  selfStatus: '',
  referent: ref,
  referentStatus: (refEntry.status as string) || 'active',
  textSnippet: snippet(body, kwMatch),
});
```

---

## 회귀 검증 — 4 audit dry-run

| 스크립트 | Phase 1 baseline | Phase 2.1 after | 회귀 |
|---|---|---|---|
| audit-broken-references | scanned=38, broken=0 | scanned=38, broken=0 | 없음 |
| audit-decision-ledger-status | total=180, self=33, referent=27 | total=180, self=33, referent=27 | 없음 |
| validate-role-memory-json | files=11, errors=0 | files=11, errors=0 | 없음 |
| audit-memory-feedback-coverage | index=25, files=26, miss=1, archive=25 | index=25, files=26, miss=1, archive=25 | 없음 |

### Fix 4 의도 동작 검증 — 합성 테스트

ad-hoc 테스트 디렉터리 (`%TEMP%/role-mem-test/test_memory.json` = `{"foo":"bar"}`)로 `validateRoleMemoryJson()` 직접 호출:

```
"rows": [
  {
    "file": "test_memory.json",
    "parseOk": true,
    "hasLessonLog": false,
    "hasMetrics": false,
    "size": 14,
    "error": "missing both lessonLog and metrics keys"   ← B-4 fix 동작 확인
  }
],
"errors": [
  { "file": "test_memory.json", "msg": "missing both lessonLog and metrics keys" }
],
"summary": "files=1, errors=1"
```

→ **이전엔 `error` 필드 자체 없음**(undefined). Fix 후 동일 메시지가 row.error에 박제됨.

### Fix 5 의도 동작 검증 — 실데이터 grep

`reports/2026-05-10_ledger-status-audit.md` 표 sampling:

```
| D-163 | referent-undeclared |  | D-160 | active | ...   ← selfStatus 칸 빈값 (B-5 fix 동작)
| D-162 | referent-undeclared |  | D-130 | active | ...
| D-143 | referent-undeclared |  | D-138 | active | ...

| D-163 | self-undeclared | active |  |  | ...            ← self 행은 'active' 유지
| D-162 | self-undeclared | active |  |  | ...
```

→ referent 행 selfStatus 칼럼 비움 / self 행은 기존대로 'active' 표시 — 의미 혼선 해소.

---

## 게이트 G2.1 통과

- [x] 5건 모두 적용
- [x] 4 audit 스크립트 회귀 0 (summary 동일)
- [x] Fix 4 효과 ad-hoc 합성 검증 완료
- [x] Fix 5 효과 실데이터 보고서 표에서 직접 확인
- [x] callable export 시그니처 변경 0 (`auditBrokenReferences`·`auditDecisionLedgerStatus`·`validateRoleMemoryJson` 모두 동일)
- [x] scope drift 0 (Phase 3 후보 A-2/A-5/A-6/A-7/A-8/A-9/B-1/B-2/B-3/C-5 미터치)

## 비고

- **build-scripts hook 실패 5회**: PostToolUse(Edit) hook이 `npm run build:scripts`를 시도하나 `package.json`에 해당 script 미존재 → 매 Edit마다 `npm error Missing script: "build:scripts"` 출력. **본 작업 변경 사항 아님 (선행 누락)**. 본 토픽 scope 외 — 별 토픽 또는 PD 후보로 보고. 본 fix들은 ts-node 직접 실행으로 런타임 검증 완료.
- 신설 3 audit 파일 모두 git untracked 상태. 본 fix는 untracked file in-place 수정 — 다음 commit에 통합 박제 예상.

---

[ROLE:dev]
# self-scores
rt_cov: 1.0
gt_pas: 1.0
hc_rt: 0.0
spc_drf: 0
