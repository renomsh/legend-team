---
role: riki
session: session_198
topic: topic_171
topicSlug: nexus-pc-hardware-upgrade
date: 2026-05-05
turnId: 2
rev: 1
invocationMode: subagent
---

# Riki — macOS 전환 시 hook 시스템 리스크 감사

## 감사 방법론

실제 파일 정독 기반. 추측 배제. 감사 대상:
- `.claude/hooks/session-end-finalize.js` (1,671줄)
- `.claude/hooks/session-end-tokens.js`
- `.claude/hooks/pre-tool-use-task.js` (632줄)
- `.claude/settings.json`
- `scripts/auto-push.js`

---

### 🟡 R-1. `cwdToProjectDirName()` — Windows 경로 인코딩 로직이 macOS Claude 디렉토리 구조와 불일치

**원문 인용 (session-end-tokens.js L32-36):**
```
function cwdToProjectDirName(cwd) {
  // Claude Code encodes cwd as folder name by replacing ':', '\', '/', '.'
  // all with '-'. E.g. 'C:\Projects\legend-team\...' becomes
  // 'C--Projects-legend-team--claude-worktrees-foo'.
  return cwd.replace(/[\\/:.]/g, '-');
}
```

**실패 시나리오:**
macOS에서 cwd는 `/Users/username/Projects/legend-team` 형태다. 드라이브 문자 `C:` 없음. Claude Code가 macOS에서 프로젝트 디렉토리를 인코딩하는 방식 (`-Users-username-Projects-legend-team`)은 현재 함수 출력과 다를 수 있다. Tier 1·2·3 fallback 모두 이 인코딩 기반으로 매칭을 시도하므로, 인코딩 불일치 시 transcript `.jsonl` 파일을 찾지 못한다.

**파손 범위:** `session-end-tokens.js` 가 transcript를 역탐색 실패 → 세션 토큰 집계 0 → `token_log.json` 누락 → 대시보드 tokenUsage 공란. 데이터 손실(기록 오염은 아님, 단순 누락).

**완화 조건:** macOS Claude Code가 실제로 생성하는 프로젝트 디렉토리 명명 규칙 확인 필수. macOS에서 1회 실제 테스트 후 함수 조정.

---

### 🔴 R-2. `shell: isWin` 패턴 — macOS에서 `shell: false` → `npx ts-node` 비정상 종료 위험

**원문 인용 (session-end-finalize.js L183-188, 동일 패턴 7회 반복):**
```js
const isWin = process.platform === 'win32';
const cmd = isWin ? 'npx.cmd' : 'npx';
const result = spawnSync(cmd, ['ts-node', scriptPath, ...], {
  cwd: CWD,
  encoding: 'utf8',
  shell: isWin,   // macOS: shell: false
});
```

**실패 시나리오:**
macOS에서 `isWin = false` → `cmd = 'npx'`, `shell: false`. 문제는 `npx`가 PATH 탐색 방식이 쉘 의존적인 경우 (`nvm`, `volta`, `fnm` 등 버전 매니저 환경). `shell: false` + 버전 매니저 환경에서는 `npx`가 PATH에 없거나 `ts-node`를 찾지 못해 `status: -2 (ENOENT)` 반환 가능.

현재 Windows에서는 `shell: true`로 실행되어 cmd.exe가 PATH를 확장하므로 문제 없지만, macOS shell: false는 환경 변수를 상속하지 않을 수 있다.

**파손 범위:** `runL2Writer`, `runL3Regenerator`, `runCheckPendingDeferrals`, `updateClosedInSession`, `runAutoCloseDryRun`, `runResolvePDDryRun`, `runSyncSystemState` 7개 함수 동시 실패. 모두 `process.exit(0)` (hook chain 계속)이므로 **무음 실패**. 세션이 정상 종료처럼 보이지만 session_contributions 복사·topic_index 갱신·PD 전이 등이 모두 스킵된다.

**완화 조건:** macOS 전환 시 `shell: true`로 통일하거나, `npx` 대신 절대 경로(`node_modules/.bin/ts-node`) 사용. 또는 `shell: process.platform !== 'win32' ? true : false` 명시 전환.

---

### 🔴 R-3. 무음 실패 전파 — hook 실패가 `process.exit(0)`로 은폐됨

**원문 인용 (session-end-finalize.js L190-193):**
```js
if (result.status !== 0) {
  log(`L2-writer 실패 (code ${result.status}): ${result.stderr || result.stdout || ''}`);
} else {
  log(`L2-writer 완료 — ${topicId}/${sessionId}`);
}
```

로그는 `console.error`로만 출력. hook chain은 `process.exit(0)` 계속 진행.

**실패 시나리오:**
macOS 전환 직후, R-2의 `npx`/`ts-node` 실패가 `log()` (stderr)에만 기록된다. Claude Code UI에는 표시되지 않는다. Master가 세션 종료 후 "정상 종료" 메시지를 보지만 실제로는:
- `session_contributions` 복사 실패 → 다음 세션 pre-tool-use-task.js가 이전 Edi 요약 inject 불가
- `topic_index.json` closedInSession 갱신 실패 → 토픽 상태 SOT 오염
- versionBump detectVersionBump는 `git status --porcelain`을 직접 호출하므로 상대적으로 안전하지만, applyVersionBump에서 `project_charter.json` 갱신도 동반 실패

**파손 범위:** 2~3 세션 후 session_contributions 누락이 누적되면 다음 세션 context inject 품질 저하. 역할들이 이전 세션 결정을 "처음 보는 것처럼" 분석하는 맹점 발생.

**완화 조건:** 각 spawnSync 실패 시 `sess.gaps`에 박제하는 로직을 추가(현재 `updateClosedInSession`만 gaps 박제, 나머지 6개 함수는 log만). 또는 SessionEnd hook에 진단 요약 stdout 출력.

---

### 🟡 R-4. `__dirname` 기반 상대경로 — macOS 경로 구조 변경 시 취약점

**원문 인용 (session-end-finalize.js L561):**
```js
const regPath = path.join(__dirname, '../../memory/growth/metrics_registry.json');
```

`__dirname`은 `.claude/hooks/`이므로 `../../memory/`는 프로젝트 루트의 `memory/`를 가리킨다. 이 로직 자체는 macOS에서도 동작한다.

**단, 위험 조건:** macOS 전환 시 저장소 clone 위치가 다르거나, symlink 구조가 다를 경우. 특히 `pre-tool-use-task.js`가 `require('../../scripts/lib/zero-condense-marker.js')`를 호출하는데(L222), 이 경로도 `__dirname` 기반 상대 경로다. 파일이 없으면 `catch`로 처리되어 무음 실패 후 Edi 게이트가 `BLOCK`을 반환하지 않게 된다.

**파손 범위:** Zero Condense 게이트가 무력화되어 Edi가 Zero 검토 없이 호출될 수 있음. 단, 이는 기존 정책 우회이지 데이터 오염은 아님.

**완화 조건:** `CWD` 기반으로 통일 (이미 `session-end-finalize.js`는 대부분 `path.join(CWD, ...)` 패턴 사용). `__dirname` 잔존 인스턴스 제거.

---

### 🟢 R-5. PowerShell 의존성 — 없음 (확인됨)

hook 코드 전체 감사 결과, `PowerShell`, `pwsh`, `cmd.exe` 직접 호출 없음. 모두 `Node.js` + `npx ts-node` 패턴. PowerShell 툴은 Claude Code 자체 도구이며 hook JS 파일에는 없음. **이 축은 리스크 없음.**

---

### 🟢 R-6. WSL 의존성 — 없음 (확인됨)

hook 코드에서 `wsl`, `linux`, `darwin` 등 플랫폼 특화 분기 없음. `isWin` 단일 분기만 존재. WSL2 특화 동작 없음. **이 축은 리스크 없음.**

---

## 요약

| # | 등급 | 리스크 | 파손 대상 |
|---|---|---|---|
| R-1 | 🟡 | cwdToProjectDirName 인코딩 불일치 | 토큰 집계 누락 |
| R-2 | 🔴 | shell:false + npx PATH 실패 | 7개 스크립트 무음 실패 |
| R-3 | 🔴 | 무음 실패 → 세션 기록 오염 누적 | session_contributions·topic_index |
| R-4 | 🟡 | __dirname 잔존 상대경로 | Zero Condense 게이트 무력화 |
| R-5 | 🟢 | PowerShell 의존성 | 없음 |
| R-6 | 🟢 | WSL 의존성 | 없음 |

**핵심 판정:** 하드코딩 절대경로(`C:\`)는 hook 파일 내부에 없다. 리스크의 본질은 `shell: isWin` 패턴과 무음 실패 설계다. macOS 전환 시 이 두 가지가 누적되면 세션 기록이 조용히 비어간다.
