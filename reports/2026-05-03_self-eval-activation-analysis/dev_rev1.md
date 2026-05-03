---
role: dev
session: session_179
topic: topic_155
topicSlug: self-eval-activation-analysis
turnId: 2
invocationMode: subagent
date: 2026-05-03
rev: 1
accessed_assets:
  - file: .claude/hooks/post-tool-use-task.js
    scope: extractSelfScores function (line 155-161)
---

DEV_WRITE_DONE: reports/2026-05-03_self-eval-activation-analysis/dev_rev1.md

# Dev — extractSelfScores Array 처리 수정

## 수정 위치

파일: `.claude/hooks/post-tool-use-task.js`
함수: `extractSelfScores()` line 155–167 (수정 후)

## 변경 내용

### Before (line 158-161)
```js
if (typeof toolResponse === 'string') text = toolResponse;
else if (typeof toolResponse === 'object') {
  text = toolResponse.content || toolResponse.result || toolResponse.text || JSON.stringify(toolResponse);
}
```

### After
```js
if (Array.isArray(toolResponse)) {
  // content block array 형식: [{"type":"text","text":"..."}]
  // JSON.stringify fallback 시 \\n 이스케이프로 split 불발 — D-155 fix (session_179)
  text = toolResponse
    .filter(item => item && item.type === 'text')
    .map(item => item.text || '')
    .join('\n');
} else if (typeof toolResponse === 'string') {
  text = toolResponse;
} else if (typeof toolResponse === 'object') {
  text = toolResponse.content || toolResponse.result || toolResponse.text || JSON.stringify(toolResponse);
}
```

**변경 규모:** Array 분기 6줄 추가. 기존 string/object 경로 무변경.

**버그 원인 요약:**
- `toolResponse`가 `[{"type":"text","text":"...[ROLE:riki]\n# self-scores\n..."}]` 형식으로 도달
- 기존 코드: `Array.isArray` 분기 없음 → `typeof === 'object'` 분기로 진입 → `.content/.result/.text` 모두 undefined → `JSON.stringify()` fallback
- `JSON.stringify` 결과에서 `\n`이 `\\n`으로 이스케이프 → `split(/\r?\n/)` 불발 → 한 줄로 처리 → key:value 파서 0건 → `null` 반환
- 영향: session_130~178 (49세션) selfScores 적재 완전 누락

## 단위 검증 결과

```
TC1 (array input): {"crt_rcl":"Y","cr_val":4,"prd_rej":"Y","fp_rt":0}
TC1 PASS: true

TC2 (string input): {"rt_cov":0.9,"gt_pas":0.85}
TC2 PASS: true

TC3 (mixed array — type 필터): {"key1":3}
TC3 PASS: true

TC4 (no scores block → null): null
TC4 PASS: true

=== RESULT: ALL PASS
```

- TC1: 실제 hook 수신 형식 재현 → array 분기 작동 확인 (**핵심**)
- TC2: 기존 string 경로 보존 확인
- TC3: `type !== 'text'` 항목 필터 확인
- TC4: `# self-scores` 블록 없으면 null 반환 확인

## 완료 여부

**완료.** 수정 1건, 단위 검증 4/4 PASS.

다음 세션부터 서브에이전트 selfScores가 `self_scores.jsonl`에 적재된다.
49세션치 소급 복구는 옵션 B(transcript 스캔) — Arki 판단에 따라 별도 구현 가능.

[ROLE:dev]
# self-scores
rt_cov: 1.00
gt_pas: 1.00
hc_rt: 0.00
spc_drf: 0
