DEV_WRITE_DONE: reports/2026-05-03_pd055-turnid-mismatch-fix/dev_rev1.md

---
role: dev
session: session_178
topic: topic_154
date: 2026-05-03
turnId: 2
rev: 1
invocationMode: subagent
accessed_assets:
  - file: .claude/hooks/post-tool-use-task.js
    scope: implementation target
  - file: .claude/hooks/session-end-finalize.js
    scope: downstream consumer (lines 469-476)
  - file: memory/sessions/current_session.json
    scope: turns[] state confirmation
---

# Dev — PD-055 frontmatter turnId 자동 패치 구현

## 무엇을 만들었는가

`C:\Projects\legend-team\.claude\hooks\post-tool-use-task.js`에 두 가지를 추가:

1. **`patchFrontmatterTurnId(filePath, correctTurnIdx)` 함수** (line 204~229)
   - 보고서 파일 frontmatter `turnId: N` 줄을 hook이 보유한 정확한 `correctTurnIdx`로 교체
   - 이미 맞으면 no-op (true 반환)
   - 파일 없거나 frontmatter 없으면 false 반환 (no throw)
   - 순수 파일 I/O만, 외부 의존 없음

2. **호출 위치 추가** — `extractReportsPath()` 결과가 있을 때 패치 실행 (Asset #3 블록 내)
   - 패치 성공 → `log()` 기록
   - 패치 실패(파일 없음·frontmatter 없음) → `current_session.json.gaps`에 `type: 'frontmatter-patch-failed'` 기록
   - turns[] push와 독립 실행 — 패치 실패가 turn 박제를 막지 않음

## 어떻게 실행하는가

hook은 Claude Code PostToolUse(Task) 이벤트에서 자동 발동. 수동 테스트:

```bash
echo '{"tool_name":"Task","tool_input":{"prompt":"## ROLE: dev\n..."},"tool_response":"DEV_WRITE_DONE: reports/path/dev_rev1.md\n..."}' | node .claude/hooks/post-tool-use-task.js
```

## 실제 출력 증거

### 구문 검사
```
실행: node --check .claude/hooks/post-tool-use-task.js
출력: SYNTAX_OK
```

### 단위 테스트 (4건 전부 PASS)
```
TEST1 (patch 99→2): PASS | returned: true | new turnId: 2
TEST2 (no frontmatter): PASS | returned: false
TEST3 (no-op correct val): PASS | returned: true | unchanged: true
TEST4 (file not found): PASS | returned: false
```

### Riki revi1.md 확인
- `reports/2026-05-03_pd055-turnid-mismatch-fix/` 디렉토리 미존재 확인
- Riki/Jobs 보고서 미작성 상태 — 패치 대상 없음. 정상.

## 구현 메모

- `path.isAbsolute()` 분기로 상대경로/절대경로 모두 처리
- 중복 gap 기록 방지 로직 포함 (기존 missing-report 패턴 동일 적용)
- `session-end-finalize.js:476` `turns[turnId]` 직접 인덱스 사용 — hook 패치로 mismatch gap 발생 원천 차단

---

[ROLE:dev]
# self-scores
rt_cov: 1.00
gt_pas: 1.00
hc_rt: 0.00
spc_drf: 0
