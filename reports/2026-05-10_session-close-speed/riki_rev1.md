---
role: riki
turnId: 2
invocationMode: subagent
date: 2026-05-10
topic: topic_194
session: session_232
slug: session-close-speed
---

# Riki — 리스크 감사 (session_232, topic_194)

코드 실측 기반 감사. 3대 필터(실재성·확신·기여도) 적용.

---

## 🔴 R-1. 옵션 B — `main()` export 없는 스크립트를 in-process require로 호출 불가

**실재성 근거 (코드 직접 확인):**

현재 `runL2Writer`, `runL3Regenerator`, `runCheckPendingDeferrals`가 spawnSync로 호출하는 3개 스크립트의 구조:

- `write-session-contribution.ts`: `writeSessionContribution()` export만 있음. `main()` export 없음. CLI entry는 `if (require.main === module)` 블록 내부에만 존재.
- `regenerate-context-brief.ts`: `regenerateContextBrief(topicId)` export만 있음. `main()` export 없음.
- `check-pending-deferrals.ts`: `checkPendingDeferrals()` export만 있음. `main()` export 없음.

반면 auto-push.js 선례(`finalize-self-scores.ts`, `compute-signature-metrics.ts`, `compute-dashboard.ts`)는 전부 `export function main()`을 명시적으로 export하고 있음(auto-push.js line 174-179 확인).

**실패 모드:**
`const { main } = require(scriptPath)` → `main` = undefined → `main()` 호출 시 `TypeError: main is not a function`. 단순히 느린 게 아니라 L2/L3 writer가 완전히 실행 불능이 된다.

현재 spawnSync 방식에서 L2/L3가 TS5011 에러로 실패하는 것과는 성격이 다름 — TS5011은 결과가 gaps에 기록되고 체인은 계속됨. in-process 전환 후 TypeError는 동일하게 catch되어 gaps에 기록되지만, 진단 정보가 "main is not a function"으로 오염되어 TS5011 에러와 혼동됨.

**완화 조건:**
3개 스크립트에 `export function main(args?: string[]): void` 진입점을 추가한 후에만 in-process 전환 가능. CLI entry block의 `process.argv` 파싱 로직을 `main()` 내부로 이동. `process.exit(1)` 호출은 in-process 컨텍스트에서 전체 hook 체인을 즉사시키므로 반드시 `throw new Error()`로 대체 필요.

**Fallback:** `main()` export 미완성 상태에서는 spawnSync 유지. 전환 전 `export function main()` 추가 → 스크립트 단독 실행으로 검증 → 그 후 in-process 전환 순서 강제.

---

## 🔴 R-2. 옵션 B — `process.exit(1)` in-process 호출 시 hook 체인 전체 즉사

**실재성 근거:**

`write-session-contribution.ts` line 238, 251에 `process.exit(1)` 존재. `regenerate-context-brief.ts` line 262, 268도 동일.

현재 spawnSync 방식에서는 자식 프로세스가 exit code 1로 종료해도 `result.status !== 0` 체크로 처리되고 부모 hook은 계속 실행됨. in-process 전환 후 이 `process.exit(1)`은 session-end-finalize.js 프로세스 자체를 종료시킨다. `try/catch`로 잡히지 않음 — `process.exit()`는 예외가 아니라 OS 레벨 프로세스 종료.

결과: topicId/sessionId 없는 경우나 파싱 실패 시 — 현재는 gaps 기록 후 계속 — 전환 후에는 그 이후 모든 단계(`updateClosedInSession`, `runAutoCloseDryRun`, `detectVersionBump`, `applyVersionBump`, `sess.finalizedAt 박제`) 전부 미실행.

**완화 조건:** R-1과 연동. `process.exit(1)`을 `throw new Error(message)`로 전환해야 하며, 호출부(`runL2Writer` 등)의 `try/catch`가 이를 잡아야 함. 이 구조 변경 없이 in-process 전환은 채택 불가.

**채택 불가 조건:** `process.exit()` 코드가 스크립트 내에 하나라도 남아있으면 in-process 전환 차단.

---

## 🟡 R-3. 옵션 A — `topics_manifest.json`과 `decisions_summary.json`은 증분 대상 불가

**실재성 근거 (build.js 직접 확인):**

`buildTopicsManifest()`는 `topic_index.json` 전체를 읽어 재생성. `buildDecisionsSummary()`는 `decision_ledger.json` 전체를 읽어 재생성. 이 두 파일은 항상 `generatedAt` 필드를 현재 시각으로 박음 — 소스 파일 변경 없어도 매 빌드마다 내용이 달라짐.

증분 빌드에서 이 두 파일을 git diff 기반으로 skip하면 뷰어가 stale 토픽 목록과 stale 결정 목록을 보여줌. 특히 `published: true` 토픽의 누락 여부 검사(`publishedMissing` 블록, build.js line 165-170)도 건너뛰게 되어 빌드 안전망이 무력화됨.

**완화 조건:** 증분 빌드 구현 시 `dist/data/published/` 하위는 항상 전체 재생성. git diff 증분은 `app/`, `memory/`, `reports/`, `logs/` 복사에만 적용. 별도 "항상 재생성" 파일 목록을 명시적으로 관리.

**Fallback:** `data/` 디렉토리는 전체 삭제 후 재복사, `app/` 정적 파일만 증분 적용 — 이 방식이 더 안전하고 실측 절감도 유사.

---

## 🟡 R-4. 실측치 부재 — 추정 기반 우선순위 오판 위험

**실재성 근거:**

`logs/close-timing.log` 파일이 존재하지 않음. `auto-push.js`에 `timed()` wrapper와 `flushTimings()` 구현이 완료되어 있음에도(line 20-51) 실제 타이밍 데이터가 쌓이지 않았음. 즉 "옵션 B 15~30초 절감" / "옵션 A 10~20초 절감" 추정의 실측 근거가 없음.

**완화 조건:** 옵션 B 구현 전에 `timed()` wrapper를 `session-end-finalize.js` 내부 단계에도 적용하거나, `auto-push.js`의 `flushTimings()`가 실제로 동작하는지 확인 후 실측 1회 실행. 실측 없이 구현 순서를 결정하면 B를 완성한 뒤 A가 더 효과적이었다는 역전이 발생 가능.

**Fallback:** 옵션 A(build.js 증분)는 R-3 완화 조건 준수 시 독립 구현 가능 — B의 복잡한 스크립트 리팩터링 없이 먼저 시도 가능.

---

## 기각 선언 (의도적 제외)

- **메모리 격리 약화**: `session-end-finalize.js` 자체가 이미 `auto-close-topics.ts`, `resolve-pending-deferrals.ts`, `set-closed-in-session.ts`, `sync-system-state.ts`를 in-process require로 실행 중(line 296, 320, 335, 1805). 이미 수용된 전제. 신규 리스크 아님. 제외.

- **TS5011 에러의 in-process 전환 후 악화**: `--transpileOnly` 설정 시 TS5011 발생하지 않음(`auto-push.js` line 14: `TS_NODE_TRANSPILE_ONLY=1`). ts-node register도 `transpileOnly: true` 설정됨. 별도 에러 경로 아님. 제외.

---

## 총평

옵션 B의 실질 차단 조건 2개(R-1, R-2)는 스크립트 리팩터링 선행 없이는 구현 불가. 현재 코드 상태에서 단순히 `spawnSync → require()`만 바꾸면 L2/L3 writer가 silently broken되는 상태가 됨. 구현 전 export 추가 + process.exit 제거가 전제 조건.

옵션 A는 R-3 완화(published/ 항상 전체 재생성) 조건 하에 선행 구현 가능.

실측 로그 부재(R-4) 해소가 두 옵션의 실제 효과 검증의 전제.
