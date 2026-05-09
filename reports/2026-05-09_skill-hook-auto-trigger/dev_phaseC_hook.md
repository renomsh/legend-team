---
role: dev
phase: framing
topic: topic_190
topicSlug: skill-hook-auto-trigger
session: session_227
turnId: 3
invocationMode: subagent
date: 2026-05-09
grade: A
---

Dev입니다. topic_190 phase2 Phase C — UserPromptSubmit hook 작성·검증 완료. RECOMMEND advisory only, exit 0 항상, fail-safe 4축 검증, 평균 hook 내부 elapsed 28ms (cap 50ms 미만).

## §1 hook 구조

**경로:** `.claude/hooks/user-prompt-submit-skill-recommend.js` (CommonJS)

| 항목 | 사양 |
|---|---|
| 입력 | stdin JSON `{prompt, session_id}` (UserPromptSubmit 표준 페이로드) |
| 출력 | stdout — `💡 관련 skill 발견 (advisory ...)` 다음 top-N (threshold 0.22 통과) |
| exit code | **항상 0** (D-176 BLOCK 폐기, advisory only) |
| topN | 3 |
| latency cap | 50ms (matcher 내부 elapsed 기준 — 초과 시 결과 폐기·silent) |
| 로그 | `logs/skill-recommend.jsonl` (best-effort append, JSONL) |
| 의존 | `scripts/lib/skill-matcher.js` (Phase A·B 산출물) |

**처리 분기:**
1. stdin parse 실패 / prompt 부재 → exit 0 silent
2. 인덱스 파일 부재 → log `no-index` + exit 0 silent
3. matcher require throw → log + exit 0 silent
4. matcher 호출 throw → stderr 1줄 + log + exit 0 (Claude 차단 금지)
5. elapsedMs > 50 → log `latency-exceeded` + 결과 폐기 + exit 0
6. 매치 0건 → log `no-match` + exit 0 silent (출력 없음)
7. 매치 1건+ → stdout RECOMMEND + log + exit 0

**RECOMMEND 형식 (실제 출력):**
```
💡 관련 skill 발견 (advisory — Master 명시 호출 시만 발동):
- engineering:code-review (score 0.78) — Review code changes for security, performance, and correctness. Trigger with a P…
- design:accessibility-review (score 0.33) — Run a WCAG 2.1 AA accessibility audit on a design or page. Trigger with "audit a…
- human-resources:performance-review (score 0.33) — Structure a performance review with self-assessment, manager template, and calib…
```

`advisory` 단어 명시 + Master 명시 호출 안내 → D1(적대적 컨텍스트 전제) 대응. LLM이 추천 텍스트를 명령으로 해석할 위험 완화.

## §2 검증 결과

### 2.1 3-prompt 동작 검증 (실측)

| Prompt | 출력 | top1 | score | exit | 평가 |
|---|---|---|---|---|---|
| `review the security of this code` | RECOMMEND 3건 | engineering:code-review | 0.78 | 0 | ✅ 기대 일치 |
| `안녕` | silent (출력 0) | — | — | 0 | ✅ no-match silent |
| `create a financial model for revenue forecast` | RECOMMEND 1건 | daloopa:build-model | 0.27 | 0 | ✅ 기대 일치 |

(실측 명령: `echo '{"prompt":"...","session_id":"session_227"}' \| node .claude/hooks/user-prompt-submit-skill-recommend.js`)

### 2.2 Latency 측정

**Hook 내부 elapsedMs** (matcher 호출 + index read + tokenize + 160 skill 스코어링):
- 5회 측정 (security prompt): 22, 27, 29, 31, 32 ms
- **평균 28.2ms** — 50ms cap의 56% 수준. 여유 충분.

**순수 matcher 함수 호출** (10회 평균, index 미리 로드 후):
- security prompt: 1.20ms
- financial-model prompt: 0.90ms
- data-analyze prompt: 1.10ms
- → 인덱스 read·tokenize 포함 28ms 중 매칭 자체는 ~1ms. 나머지는 fs read + JSON.parse (Phase A R4 식별 그대로).

**Node spawn 포함 wall-clock** (자식 프로세스 외부 측정): 252~327ms. spawn cost 자체는 hook 통제 밖이며 UserPromptSubmit 시점은 LLM 응답 전 1회만이라 사용자 영향 미미.

### 2.3 Fail-safe 4축 (§4 상세)

| 축 | 시나리오 | 결과 | exit |
|---|---|---|---|
| F1 | 인덱스 파일 missing (rename 후 실행) | silent, log `no-index` | 0 |
| F2 | matcher throw (Module mock injection) | silent (stdout 출력 0) | 0 |
| F3 | prompt 부재 | silent | 0 |
| F4 | latency cap | 코드상 분기 존재 (실측 cap 미도달이라 직접 발동은 미관측. 분기 로직 검토 완료) | 0 |

## §3 settings.json 변경 diff

```diff
     "UserPromptSubmit": [
       {
         "hooks": [
           {
             "type": "command",
             "command": "node .claude/hooks/user-prompt-submit-master-first.js"
+          },
+          {
+            "type": "command",
+            "command": "node .claude/hooks/user-prompt-submit-skill-recommend.js"
           }
         ]
       }
     ],
```

- `master-first` hook **이후** 등록 (R6 — 두 hook 모두 exit 0·non-blocking이므로 순서 무관, 다만 master-first 우선 명시).
- JSON syntax 검증: `node -e "JSON.parse(...)"` PASS.
- 다른 hook 손상 없음 (PreToolUse·SessionEnd·PostToolUse 미변경).

## §4 fail-safe 동작 검증

### F1. 인덱스 missing
```
mv memory/shared/plugin_skill_index.json memory/shared/plugin_skill_index.json.bak
echo '{"prompt":"review the security","session_id":"s"}' | node .claude/hooks/user-prompt-submit-skill-recommend.js
EXIT=0
```
stdout 출력 0. log: `{"phase":"no-index","skipped":true}`.

### F2. matcher throw
Module.prototype.require 패치로 matchSkills를 throw 함수로 교체 후 hook 실행.
```
EXIT=0
```
stdout 출력 0. (stderr 1줄 — Claude는 stderr 무차단)

### F3. prompt 부재
빈 stdin 또는 `{}` 입력 시 prompt 검증 분기에서 즉시 exit 0.

### F4. Latency cap
실측 elapsedMs 22~32ms로 cap 50ms 도달 안 함. 코드 분기 (`elapsedMs > LATENCY_CAP_MS`)는 results 폐기 후 silent exit. 확인 완료.

**핵심 보장:** 어떤 실패 경로에서도 exit 1 / non-zero 반환 없음 → Claude 응답 차단 0건.

## §5 Phase D 진입 readiness

| 체크 | 상태 |
|---|---|
| Phase A matcher (threshold 0.22, 분모 캡 5) | ✅ 완료 |
| Phase B Gate G2 (20 prompt 70% 적합도) | (별도 검증 산출물 — Phase B 보고 참조) |
| Phase C hook 작성·검증 | ✅ 본 보고 |
| settings.json 등록 | ✅ |
| Fail-safe 4축 | ✅ |
| Latency < 50ms cap | ✅ 28ms 평균 |
| RECOMMEND advisory 명시 (D1 대응) | ✅ |
| exit 0 항상 (D-176) | ✅ |

**Phase D 진입 판정: READY.** Master 직접 사용으로 Gate G3 (시그널/노이즈비, 적합도 만족) 검증 단계로 이동 가능. 노이즈 압도 시 롤백 경로: `settings.json`에서 hook 라인 1개 제거 → 기능 비활성화 (matcher·인덱스는 dry-run 도구로 잔존).

DEV_WRITE_DONE: reports/2026-05-09_skill-hook-auto-trigger/dev_phaseC_hook.md

[ROLE:dev]
# self-scores
hk_work: 1
lat_ms: 28
fail_safe: 1
files_chg: 2
hc_found: 0
