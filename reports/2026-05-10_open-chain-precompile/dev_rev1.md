---
turnId: 4
invocationMode: subagent
role: dev
date: 2026-05-10
topic: open-chain-precompile
accessed_assets:
  - file: .claude/commands/open.md
    scope: ts-node invocations to replace
  - file: tsconfig.json
    scope: root compiler options
  - file: package.json
    scope: scripts
  - file: memory/shared/system_state.json
    scope: nextSessionId field
---

# Dev 보고 — /open 체인 최적화 (임무 1+2)

## 임무 1: TypeScript pre-compiled JS 전환

### 만든 것

**`scripts/tsconfig.scripts.json`** (신규)
- extends 루트 tsconfig.json
- module: commonjs (ts-node 오버라이드와 동일 — `__dirname` 호환)
- rootDir: `..` (scripts/가 ../src/types/ import하므로)
- outDir: `dist`
- noEmitOnError: false (레거시 스크립트 에러로 dist 생성 차단 방지)
- verify-growth-phase0/phase1 exclude (./compute-growth 미존재 레거시)

**`package.json`** — `"build:scripts": "tsc -p scripts/tsconfig.scripts.json"` 추가

**`scripts/log-evidence.ts`** — `VALID_AGENTS` 배열에서 `'edi'` → `'editor'` 수정 (RoleId 타입 정합)

### 실행 증거

```
$ npm run build:scripts
> tsc -p scripts/tsconfig.scripts.json
(출력 없음, exit 0)

$ node scripts/dist/load-context-briefs.js
[context_brief 로드] 활성 토픽 없음 (또는 context_brief 미생성).
EXIT: 0

$ node scripts/dist/create-topic.js
Usage: ts-node scripts/create-topic.ts "<topic title>" [slug] [grade:S|A|B|C] ...
EXIT: 1 (인수 없음 — 정상)
```

### `.claude/commands/open.md` 수정
- step 3-a: `npx ts-node scripts/load-context-briefs.ts` → `node scripts/dist/load-context-briefs.js`
- 분기 B: `npx ts-node scripts/create-topic.ts` → `node scripts/dist/create-topic.js`

---

## 임무 2: session_index.json Read 제거

### 확인 내용
- `system_state.json`에 `nextSessionId: "session_232"` 필드 존재 확인
- `sync-system-state.ts`가 close 체인에서 session_index.json 기반으로 nextSessionId 계산 → system_state.json에 박제 (scripts/sync-system-state.ts:113, 171)
- open.md step 2에서 system_state.json을 이미 로드 → step 4에서 재독 불필요

### open.md step 4 수정
- 변경 전: `memory/sessions/session_index.json` — 다음 sessionId
- 변경 후: 다음 sessionId = `system_state.json.nextSessionId` (step 2에서 이미 로드됨 — session_index.json Read 불필요)

---

## 기대 효과

| 항목 | 변경 전 | 변경 후 |
|---|---|---|
| load-context-briefs | npx ts-node cold-start 3~4s | node dist/ 즉시 실행 |
| create-topic | npx ts-node cold-start 3.4s | node dist/ 즉시 실행 |
| nextSessionId 취득 | session_index.json (378KB) Read | system_state.json (fast-path) 재사용 |

## 주의사항
- `scripts/dist/`는 `.gitignore`의 `dist/` 패턴으로 커버됨 → 커밋 제외
- `npm run build:scripts`는 코드 변경 시 수동 실행 필요 (auto-build hook 없음)
