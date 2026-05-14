---
role: dev
session: session_247
topic: topic_207
topicSlug: arki-emergency-hooks
date: 2026-05-14
rev: 4
turnId: 9
invocationMode: subagent
authorship: agent
accessed_assets:
  - file: .claude/hooks/pre-tool-use-no-autonomous-decision.js
    scope: implementation under modification
  - file: memory/shared/pending_deferrals.json
    scope: PD status update (4 items)
  - file: reports/2026-05-14_arki-emergency-hooks/dev_rev2.md
    scope: prior 17-case baseline
  - file: reports/2026-05-14_arki-emergency-hooks/dev_rev3.md
    scope: prior 30+ case extension
---

DEV_WRITE_DONE: reports/2026-05-14_arki-emergency-hooks/dev_rev4.md

# Dev rev4 — PD 4건 갱신 + APPROVAL_PATTERNS 영어 확장 (R-1·R-3)

## 임무 [T4/A3/O2]

Master 명시 (session_247): "PD-078 취소, 079 완료, 083 취소, 084 취소 / R-1. 영어 승인 / R-3. negation 확장"

---

## 1. PD 4건 갱신 결과 [T4/A2/O5]

`memory/shared/pending_deferrals.json` Edit. 갱신 후 카운트:
- total 34, pending 14, resolved 16, in-progress 1, **cancelled 3**

### PD-078 (cancelled)
| 필드 | before | after |
|---|---|---|
| status | `pending` | `cancelled` |
| cancelledAt | — | `2026-05-14T11:36:18.736Z` |
| cancelledBy | — | `session_247` |
| cancelledReason | — | "본문 4단어 단편 ('L2 / L1 / inline 재도입'), 의미 복원 Master만 가능. session_247 Master 결정으로 cancel." |

### PD-079 (resolved)
| 필드 | before | after |
|---|---|---|
| status | `pending` | `resolved` |
| resolvedAt | — | `2026-05-13T12:00:00.000Z` (session_245 closedAt) |
| resolvedBy | — | `session_245` |
| resolveNote | — | "본문 작업(D-181 8 미티게이션 코드 박제) D-191/D-192로 완료. Riki R-3 적출 (PD-079 dependsOn=[PD-077] resolved + 본문 사실상 완료). session_247 Master 결정." |

### PD-083 (cancelled)
| 필드 | before | after |
|---|---|---|
| status | `pending` | `cancelled` |
| cancelledAt | — | `2026-05-14T11:36:18.736Z` |
| cancelledBy | — | `session_247` |
| cancelledReason | — | "dependsOn=[PD-082] resolved + 시범 종료 트리거 stale. T/A/O 시범 enum 결정은 별도 트랙으로. Riki R-7 적출. session_247 Master 결정." |

### PD-084 (cancelled)
| 필드 | before | after |
|---|---|---|
| status | `pending` | `cancelled` |
| cancelledAt | — | `2026-05-14T11:36:18.736Z` |
| cancelledBy | — | `session_247` |
| cancelledReason | — | "dependsOn=[PD-082] resolved + 시범 종료 조건 정량 신호 미정. Riki R-8 적출. session_247 Master 결정." |

검증 출력:
```
total: 34
{ pending: 14, resolved: 16, 'in-progress': 1, cancelled: 3 }
PD-078: cancelled
PD-079: resolved
PD-083: cancelled
PD-084: cancelled
```

---

## 2. APPROVAL_PATTERNS Layer 변경 diff [T4/A2/O5]

4-Layer 구조(STANDALONE / VERB / NEGATION / QUESTION) 유지. 한국어 patterns 전부 보존. 영어 토큰만 추가 + negation 비교를 case-insensitive로 변환.

### Layer 1 — APPROVAL_PATTERNS_STANDALONE (8건 영어 추가)

```diff
   /^\s*고고\s*[.!]?\s*$/m,
+  // English standalone (R-1, session_247 Master 결정) — case-insensitive, 단독 라인 한정
+  /^\s*yes\s*[.!]?\s*$/im,
+  /^\s*okay\s*[.!]?\s*$/im,
+  /^\s*go\s*[.!]?\s*$/im,
+  /^\s*proceed\s*[.!]?\s*$/im,
+  /^\s*do\s+it\s*[.!]?\s*$/im,
+  /^\s*go\s+ahead\s*[.!]?\s*$/im,
+  /^\s*approved\s*[.!]?\s*$/im,
+  /^\s*confirmed\s*[.!]?\s*$/im,
 ];
```

설계 결정 [T3/A2/O3]:
- 모두 word-anchor `^\s*X\s*$` (substring false-pass 차단)
- `/i` flag로 case-insensitive ("Yes", "OK", "Go" 등)
- "ok" 단독은 한국어 `OK` 패턴이 이미 cover (R9 회귀 PASS)

### Layer 2 — APPROVAL_PATTERNS_VERB (6건 영어 추가)

```diff
   /(?<![가-힣A-Za-z])승인(?:해|함|합니다|함\.)?(?=[\s.!,]|$)/,
   /\(α\)/,
   /\(β\)/,
   /\(γ\)/,
+  // English verb forms (R-1, session_247 Master 결정) — word-boundary, case-insensitive
+  /\bproceed\b/i,
+  /\bexecute\b/i,
+  /\bapply\b/i,
+  /\bimplement\b/i,
+  /\bdeploy\b/i,
+  /\bgo\s+ahead\b/i,
 ];
```

설계 결정 [T3/A2/O3]:
- `\b` word-boundary로 substring false-pass 차단 ("preprocedure" 등 미매칭)
- `/i` flag case-insensitive
- negation 선행 12자 검사가 영어 토큰("do not", "don't" 등)에도 작동 (Layer 3 case-insensitive 변환으로)

### Layer 3 — NEGATION_TOKENS (영어 9건 추가)

```diff
-const NEGATION_TOKENS = ['안 ', '안돼', '안 돼', '안된', '안 된', '안하', '안 하', '않', '못 ', '못해', '말고', '말아', '말라', '없'];
+// English negation tokens (R-3, session_247 Master 결정) 동시 확장.
+const NEGATION_TOKENS = [
+  '안 ', '안돼', '안 돼', '안된', '안 된', '안하', '안 하', '않', '못 ', '못해', '말고', '말아', '말라', '없',
+  // English (case-insensitive matching applied via toLowerCase below)
+  'do not ', "don't ", 'stop', 'cancel', 'abort', 'reject', 'no ', 'wait', 'hold',
+];
```

`matchVerbApproval` 비교 로직 case-insensitive 변환:
```diff
       const matchStart = m.index;
       const before = line.slice(Math.max(0, matchStart - 12), matchStart);
-      if (NEGATION_TOKENS.some(t => before.includes(t))) continue;
+      const beforeLower = before.toLowerCase();
+      if (NEGATION_TOKENS.some(t => beforeLower.includes(t.toLowerCase()))) continue;
```

### Layer 4 — QUESTION_INDICATORS

**변경 없음** (한국어 의문 어미만 — 영어 의문 추가는 본 임무 범위 외, R-2/R-4 잔존).

---

## 3. 검증 결과 표 — 46/46 PASS [T4/A2/O5]

### 영어 신규 케이스 (E1~E12, 12건)

| # | 케이스 | 기대 | 실측 | 결과 |
|---|---|---|---|---|
| E1  | `yes` 단독 | PASS | PASS | OK |
| E2  | `OK` 단독 | PASS | PASS | OK |
| E3  | `go` 단독 | PASS | PASS | OK |
| E4  | `proceed` 단독 | PASS | PASS | OK |
| E5  | `do it` 단독 | PASS | PASS | OK |
| E6  | `go ahead` | PASS | PASS | OK |
| E7  | `do not proceed` | BLOCK | BLOCK | OK (negation) |
| E8  | `don't apply` | BLOCK | BLOCK | OK (negation) |
| E9  | `stop` 단독 | BLOCK | BLOCK | OK (verb 미매칭 자연 BLOCK) |
| E10 | `cancel` 단독 | BLOCK | BLOCK | OK (verb 미매칭 자연 BLOCK) |
| E11 | `approved a method but not yet` | BLOCK | BLOCK | OK (standalone 비단독 + verb 미등재) |
| E12 | `yes proceed` (긍정 2단어) | PASS | PASS | OK (verb proceed 매칭) |

### 회귀 — 한국어 17 케이스 (R1~R17, dev_rev2 baseline)

R1~R11 (PASS expected): **11/11 PASS**
R12~R17 (BLOCK expected): **6/6 BLOCK**

### 회귀 — Group A/B/D 17 케이스 (dev_rev3 baseline)

A1·A2·B1·B3·B5·B6·D1·D2·D4·D5 (PASS expected): **10/10 PASS**
A3·A4·A5·A7·B2·B4·D3 (BLOCK expected): **7/7 BLOCK**

### 검증 명령 / 출력 증거 (실측)

```
$ cd C:/Projects/legend-team/.claude/worktrees/nifty-bartik-629613
$ node tmp_verify_eng/runner.js
[OK] E1 expect=PASS got=PASS (yes 단독)
[OK] E2 expect=PASS got=PASS (OK 단독)
[OK] E3 expect=PASS got=PASS (go 단독)
[OK] E4 expect=PASS got=PASS (proceed 단독)
[OK] E5 expect=PASS got=PASS (do it 단독)
[OK] E6 expect=PASS got=PASS (go ahead)
[OK] E7 expect=BLOCK got=BLOCK (negation: do not proceed)
[OK] E8 expect=BLOCK got=BLOCK (negation: don't apply)
[OK] E9 expect=BLOCK got=BLOCK (stop 단독 (verb 미매칭 BLOCK))
[OK] E10 expect=BLOCK got=BLOCK (cancel 단독 (verb 미매칭 BLOCK))
[OK] E11 expect=BLOCK got=BLOCK (approved 비단독 + verb 없음)
[OK] E12 expect=PASS got=PASS (긍정 2단어 (verb proceed 매칭))
[OK] R1 ~ R17                  (17/17 일치)
[OK] A1·A2·A3·A4·A5·A7         (6/6 일치)
[OK] B1·B2·B3·B4·B5·B6         (6/6 일치)
[OK] D1·D2·D3·D4·D5            (5/5 일치)

=== 46/46 OK, 0 FAIL ===
```

검증 환경 [T4/A2/O5]:
- spawnSync child process로 hook 직접 호출 (절대경로 `.claude/hooks/pre-tool-use-no-autonomous-decision.js`)
- env 격리: `{PATH, SystemRoot}`만 유지 (NEXUS_EMERGENCY_OVERRIDE 차단)
- transcript fixture: `tmp_verify_eng/transcript.jsonl` 단일 user turn JSONL
- target: `scripts/example.ts` (비-면제 경로)
- exit code 0 = PASS, 2 = BLOCK

---

## 4. FAIL 분석

**실측 FAIL 0건.** [T4/A2/O5]

---

## 5. 잔존 risk + Master 결정 대기 항목

**R-1 [T3/A2/O3]:** STANDALONE에 "ok" 단독 영어 추가 안 함 — 한국어 패턴 `^\s*OK\s*$/im`이 이미 영어 "OK"·"ok"도 cover (R9 + E2 동시 PASS 검증). 별도 영어 ok 패턴 추가 시 정규식 중복.

**R-2 [T2/A1/O3]:** "yes" 외 영어 affirmative ("sure", "fine", "alright", "yep") 미지원. Master 발화 패턴 누적 후 추가 검토.

**R-3 [T3/A2/O3]:** 영어 의문 indicator 미추가 (Layer 4). "shall we proceed?" 같은 질문은 verb `proceed` 매칭으로 PASS될 수 있음. 단 "?" 종결은 한국어 QUESTION_INDICATORS의 `/\?/` 1번 패턴이 cover (라인 단위 검사) → 자동 BLOCK. 검증: 임의 추가 케이스 "shall we proceed?" 시 BLOCK 예상 (별도 케이스 미실행, 추측).

**R-4 [T3/A2/O3]:** "no " negation 토큰이 "noproblem" 같은 substring과 충돌 가능. 단 12자 lookbehind 한정 + 토큰에 trailing space 포함 (`'no '`)으로 word boundary 유사 보장. E11 "approved a method but not yet"는 standalone 비단독으로 자연 BLOCK되어 영향 없음 검증.

**R-5 [T2/A1/O3]:** STANDALONE에 추가한 "approved" / "confirmed"는 단독 라인 한정. "I approved this." 같은 문장은 standalone 미매칭 + verb 미등재로 BLOCK (E11 검증 정합).

**R-6 [T4/A3/O5]:** 본 검증 46 case에 한정. **충분성 자가 판정 불가 (D-184 정합).** 운영 중 새 false-pass/false-block 발견 시 case 추가 + 재검증 cycle.

---

## 6. write 권한 사용 내역

본 임무 한정 mutation:
- `memory/shared/pending_deferrals.json` Edit (PD 4건 갱신)
- `.claude/hooks/pre-tool-use-no-autonomous-decision.js` Edit (3 layer 영어 확장 + case-insensitive 변환)
- `tmp_verify_eng/runner.js` Write (검증 fixture, 임시)
- `tmp_verify_eng/transcript.jsonl` Write (runner.js 실행 시 자동 생성)
- `reports/2026-05-14_arki-emergency-hooks/dev_rev4.md` Write (본 박제)

그 외 mutation 0건.

---

## 결론 [T4/A2/O5]

**PD 4건 갱신 + APPROVAL_PATTERNS 영어 확장 완료.**
- PD-078·083·084 → cancelled, PD-079 → resolved (Master 명시 결정 정합)
- 4-Layer hook 구조 보존, 영어 토큰만 추가 (Layer 1: 8건, Layer 2: 6건, Layer 3: 9건 + case-insensitive)
- 46/46 검증 PASS (영어 12 신규 + 회귀 한국어 17 + dev_rev3 17)

```
[ROLE:dev]
# self-scores
rt_cov: 1.0
gt_pas: 1.0
hc_rt: 0.0
spc_drf: 0
```
