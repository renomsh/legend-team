---
role: zero
session: session_232
topic: topic_194
topicSlug: off-time-reduction
date: 2026-05-10
turnId: 8
rev: 1
invocationMode: subagent
---

# Zero — off-time-reduction (session_232)

## 감사 범위

11개 변경 파일 대상 3영역(tech-debt / security-review / simplify) 정제 감사.

---

## A. Cut (tech-debt)

### 발견 없음

| 항목 | 판정 | 근거 |
|---|---|---|
| dead code 탐색 | 패스 | 전체 11개 파일 모든 함수 실사용 확인 |
| stale 주석 | 패스 | D-번호 주석 모두 실제 결정 참조 |
| duplicate 정의 | 패스 | ts-node register 블록 `auto-push.js`·`session-end-finalize.js`·`verify-scripts-exports.js` 3곳 — 의도적 독립 실행 경계 분리 (동일 파일 내 중복 아님) |

**Cut 대상 없음.**

---

## B. Refine (simplify)

### B-1. `post-tool-use-build-scripts.js` — verifyFailed 변수 미사용

```
### Refine — post-tool-use-build-scripts.js (line 59)
Before:
  let verifyFailed = false;
  ...
  } catch (verifyErr) {
    verifyFailed = true;
    ...
  }
  // verifyFailed 이후 어디에도 사용 안 됨

After:
  (변수 선언 제거 — catch 블록 내 대입도 제거)

근거: verifyFailed=true 대입 후 읽는 코드 0회. 분기 로직 없음.
```

### B-2. `session-end-finalize.js` — `updateClosedInSession()` 내 `err.message` 직접 접근

```
### Refine — session-end-finalize.js (line 309)
Before:
  const errMsg = err.message;
  log(`updateClosedInSession 실패: ${errMsg}`);
  sess.gaps.push({ ..., detail: errMsg });

After:
  const errMsg = String(err && err.message ? err.message : err).slice(0, 200);
  log(`updateClosedInSession 실패: ${errMsg}`);
  sess.gaps.push({ ..., detail: errMsg });

근거: 동일 파일 내 runL2Writer(line 209)·runL3Regenerator(line 244)·runCheckPendingDeferrals(line 276) 3곳은
  String(err && err.message ? err.message : err).slice(0, 200) 패턴 사용.
  updateClosedInSession만 err.message 직접 접근 — null/undefined err 시 crash 위험.
  동일 파일 내 동일 패턴 불일치 4곳 중 1곳 outlier.
```

### B-3. `auto-push.js` — `ip()` 헬퍼 단일 사용

```
### Refine — auto-push.js (line 182)
Before:
  function ip(label, fn) { return { label, fn }; }
  const preSteps = [
    '...',
    ip('npx ts-node scripts/finalize-self-scores.ts', () => { ... }),
    ...
  ];

After (평가만 — 수정 보류):
  ip() 헬퍼는 3회 사용 (적정). 단, 인라인 객체 리터럴로 대체 가능하나
  가독성 trade-off 중립. 수정 이익 < 변경 비용 → 그대로 둔다.
```

**B-1, B-2 수정 진행.**

---

## C. Audit (security-review)

### C-1. `auto-push.js` — commit message에 process.argv[2] 직접 삽입

```
### Audit — auto-push.js (line 252)
위치: line 252
유형: command-injection 위험
내용: run(`git commit -m "${message}"`)
      message = process.argv[2] || default
      쉘 메타문자($, `, ", \n 등) 에스케이프 없음.
우선순위: 🟡WARN

완화: 현재 호출자는 내부 hook chain만 (외부 입력 0건).
      실제 악용 경로 없음. 단, 장래 CLI 직접 호출 시 위험.
      process.argv[2] → JSON.stringify() 래핑 또는 --file 옵션 전환 권장.
      이번 세션 수정 대상 아님 (기능 변경 범주) — 보고만 함.
```

### C-2. `log-evidence.ts` — status 파라미터 미검증

```
### Audit — log-evidence.ts (line 30)
위치: line 30
유형: 입력 미검증
내용: const [topicSlug, type, source, finding, status = 'open'] = process.argv.slice(2);
      status는 open/resolved/accepted-residual-risk 3종 유효값인데 any string 허용.
우선순위: 🟡WARN

완화: status 오기 시 evidence_index에 invalid entry 박제.
      다른 역할이 status 기준으로 필터링하면 오동작 가능.
      type 검증(line 38)과 동일 패턴으로 VALID_STATUSES 배열 추가 권장.
      이번 세션 수정 대상 아님 (기능 변경 범주) — 보고만 함.
```

### C-3. Hardcoded secrets/credentials

전체 11개 파일 스캔 결과 **하드코딩된 secret·token·credential 0건**.
절대 경로 패턴: `path.join(ROOT, ...)` 또는 상대 경로 — 문제 없음.

총 보안 발견: 🟡WARN 2건 (기능 변경 범주 — 이번 세션 수정 대상 아님).
🔴CRITICAL 0건.

---

## 수정 실행

### 수정 1 — `post-tool-use-build-scripts.js` verifyFailed 제거

현재 파일 read 완료. 수정 적용 예정.

### 수정 2 — `session-end-finalize.js` updateClosedInSession err 패턴 정합

현재 파일 read 완료. 수정 적용 예정.

---

## 정제 요약

| 영역 | 처리 건수 | 상세 |
|---|---|---|
| tech-debt (Cut) | 0 | 대상 없음 |
| simplify (Refine) | 2 | B-1 verifyFailed 미사용 변수 제거, B-2 err 패턴 정합 |
| security-review (Audit) | 2 (WARN, 미수정) | C-1 cmd-injection warn, C-2 status 미검증 warn |

`ref_cnt` = 2 (수정 완료 건수), `hc_found` = 0, `cln_rt` = 1.0 (예정 — 빌드 검증 후 확정)
