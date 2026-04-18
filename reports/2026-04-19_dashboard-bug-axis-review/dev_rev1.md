---
session: session_040
topic: 대시보드 버그 — 설계축 재검토 여부 판단
role: dev
rev: 1
date: 2026-04-19
grade: B
---

# Dev 진단 — 대시보드 Cache 공백 버그 (session_040)

## 증상
dashboard-upgrade.html "효율성 추이 · Size vs Cache" 차트 부제에
"캐시 데이터 30/38세션" 표시 — session_036~039 캐시 데이터 누락.

## 근원 원인
`session-end-tokens.js` hook이 session_035 이후 worktree 환경에서
`transcript_path=MISSING, cliSession=null`으로 ABORT.

원인:
- Claude Code가 worktree에서 세션 종료 시 hook payload에 transcript_path·session_id를 미전달
- 기존 fallback(UUID 탐색)은 cliSessionId가 null이면 동작 불가
- 두 번째 fallback(cwd 기반)은 cwdToProjectDirName 인코딩 버그로 directory 미매칭
  (`:` `\` `\` `.` 처리 불일치 — 실제 Claude Code는 `:`·`\`·`/`·`.` 모두 `-` 치환)

## 설계축 판정
**설계축은 이상 없음.** Size 공식(D-027)·Grade 체계·학습 인과체인은 유효.
버그는 hook 레이어 문제.

## 수정 내역

### 1. session-end-tokens.js — 3단 fallback 계층화
- Tier 1: transcript_path 직접 사용 (기존)
- Tier 2: cliSessionId UUID로 ~/.claude/projects/*/ 탐색 (기존)
- Tier 3 신규: session_index.json[*].cwd 조회 → 해당 projects dir 탐색
- 인코딩 버그 수정: `cwdToProjectDirName`을 `replace(/[\\/:.]/g, '-')` 로 통일

### 2. session-end-finalize.js — cwd 필드 자동 기록
- session_index entry 생성 시 `cwd: CWD` 추가
- 이후 모든 세션은 session_index.json이 세션↔워크트리 매핑 테이블 역할

### 3. session_index.json — cwd 소급 백필 (session_005~038, 32개)
- 소스: token_log.json의 transcriptPath (확정 매핑, 휴리스틱 아님)
- backfill-session-cwd.js로 실행

### 4. token_log.json — session_036~039 소급 복구 (30→34개)
- append-missing-tokens.ts 신규 작성 (1회성 복구)
- hook-diagnostics.log → worktree 매핑 → .jsonl aggregate

## Master 피드백 반영
"하드코딩 최소화, 데이터를 호출하는 형태로" → session_index.cwd 테이블 채택.
append-missing-tokens.ts는 복구 완료 후 재사용 불필요 (근원 대책이 cover).
