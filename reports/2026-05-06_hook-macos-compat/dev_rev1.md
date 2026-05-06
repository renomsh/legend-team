---
role: dev
session: session_199
topic: topic_172
topicSlug: hook-macos-compat
date: 2026-05-06
rev: 1
---

# hook 패치 — macOS 전환 대비 절대경로 제거 (session_199)

## 패치 대상: `.claude/hooks/session-end-finalize.js`

### R-2 — `shell: isWin` → `shell: true` (7곳)

| 함수 | 변경 전 | 변경 후 |
|---|---|---|
| `runL2Writer` | `const isWin = ...; cmd = isWin ? 'npx.cmd' : 'npx'; shell: isWin` | `cmd = 'npx'; shell: true` |
| `runL3Regenerator` | 동일 패턴 | 동일 변경 |
| `runCheckPendingDeferrals` | 동일 패턴 | 동일 변경 |
| `updateClosedInSession` | 동일 패턴 | 동일 변경 |
| `runAutoCloseDryRun` | 동일 패턴 | 동일 변경 |
| `runResolvePDDryRun` | 동일 패턴 | 동일 변경 |
| `runSyncSystemState` | 동일 패턴 | 동일 변경 |

**Windows 영향 없음:** `shell: true`로 cmd.exe가 `npx` → `npx.cmd` 자동 해석.  
**macOS 동작:** `/bin/sh`가 `npx` 실행.

### R-3 — spawnSync 실패 시 gaps 박제

`runL2Writer`, `runL3Regenerator`에 `result.error` 분기 추가:

```js
if (result.error || result.status !== 0) {
  const detail = result.error ? result.error.message : (result.stderr || result.stdout || '');
  sess.gaps.push({ type: 'spawn-failed', fn: 'runL2Writer', topicId, sessionId, detail: ... });
  writeJson(CURRENT_SESSION_PATH, sess);
}
```

무음 실패 → gaps 박제로 전환.

### R-4 — `__dirname` → CWD 기반

```js
// 변경 전
const regPath = path.join(__dirname, '../../memory/growth/metrics_registry.json');
// 변경 후
const regPath = path.join(CWD, 'memory', 'growth', 'metrics_registry.json');
```

`CWD = process.env.FINALIZE_CWD || process.cwd()` — 프로젝트 루트 기준. 크로스플랫폼 동일.

## 검증

- `node --check .claude/hooks/session-end-finalize.js` → exit 0
- 모든 hook 파일 문법 검사 통과
- `isWin`, `__dirname` 잔존 없음 확인
