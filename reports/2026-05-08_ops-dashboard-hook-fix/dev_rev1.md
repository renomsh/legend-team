---
role: dev
session: session_210
topic: topic_177
grade: C
turnIdx: 0
---

# Dev — ops 대시보드 hook 0% 오류 수정

## 원인 분석

**증상:** `app/dashboard-ops.html` Hook Success 카드가 0% 표시.

**데이터 흐름:**
1. `dashboard-ops.html:140` — `DataLoader.fetchMD('logs/hook-diagnostics.log')` 요청
2. `data-loader.js:10` — `DATA_BASE = './data'` → 실제 URL: `./data/logs/hook-diagnostics.log`
3. `build.js:29` — `{ src: 'logs', dest: 'data/logs' }` — worktree `logs/` 복사
4. **문제:** worktree의 `logs/hook-diagnostics.log`가 존재하지 않음

**근본 원인:**
- `session-end-tokens.js`의 `logDiag(cwd, ...)` 함수는 `input.cwd`를 사용
- Claude Code가 SessionEnd hook payload에 `cwd = C:\Projects\legend-team` (main project)를 전달
- 따라서 파일은 `C:\Projects\legend-team\logs\hook-diagnostics.log`에 씀 (✓ 파일 존재, 807줄)
- `build.js`는 worktree(`ROOT = nostalgic-khayyam-6125a7`)의 `logs/`를 복사
- worktree `logs/`에 `hook-diagnostics.log` 없음 → `dist/data/logs/`에 미포함
- `hookLog = null` → `hookRate = recent10.length ? ... : 0` → **0%**

## 수정 내용

**파일:** `scripts/auto-push.js`

**변경:**
1. `syncHookDiagnosticsFromMain(mainRoot)` 함수 추가
   - worktree 세션일 때 main project의 `logs/hook-diagnostics.log`를 worktree의 `logs/`로 복사
   - build.js 실행 직전에 호출

2. `runHookChain(mainRoot)` 파라미터 추가
   - preSteps (build.js 제외) + sync + build.js 순서로 분리

3. `autoPush()`에서 `mainRoot = getMainRepoRoot()` 선행 계산
   - 기존 if-block 내부의 `const mainRoot = getMainRepoRoot()` 중복 선언 제거

## 검증

- `syncHookDiagnosticsFromMain` 수동 실행: src=✓, copy=✓, dst 807줄 생성
- `node scripts/build.js`: `dist/data/logs/hook-diagnostics.log` 포함 (9 files in logs/)
- 최근 10 terminal events: 전부 OK → hookRate = **100%**
