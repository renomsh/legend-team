---
role: edi
session: session_239
topic: topic_203
topicSlug: worktree-b-close-merge-conflict
date: 2026-05-12
rev: 1
format: lite
turnId: 9
invocationMode: subagent
---

## 작업 내용
- **진단**: main 워킹디렉토리 직접 작업 패턴 누적이 진짜 원인 (eb3aaa9 sync .claude / 0b14144 dashboard+dist rebuild / b4ec123 session end auto / 8e496d8 follow-up hotfix). PD-073 in-process require 통합은 무죄 확정 (3개 스크립트 모두 __dirname 기준 ROOT 사용 — Riki 검증 4회).
- **채택안 A+B**:
  - A: `.githooks/pre-commit` — branch==main 시 commit 차단, `ALLOW_MAIN_COMMIT=1` 환경변수 우회 게이트
  - B: `.gitattributes` — `merge=ours` driver 등록, 보호 9종 (dist/** · .claude/settings.local.json · memory/shared/topic_index.json · memory/shared/decision_ledger.json · memory/shared/master_first_state.json · memory/shared/dashboard_data.json · memory/sessions/current_session.json · memory/sessions/token_log.json · memory/growth/self_scores.jsonl)
- **Arki Phase 6단계 분해**: hook 작성 → gitattributes → install-git-hooks.sh → 문서 박제 → setup 1회 실행(별도 PD) → 실증 검증
- **②경로 분리**: hook의 main 워킹디렉토리 직접 write 경로(syncClaudeDir·syncHookDiagnosticsFromMain·session-end-tokens.js)는 commit 아니므로 A 통과 — PD-086으로 분리

## 결정 이유
- Master "여러 단계 합치면서" anchor가 D-185 위반 사례로 작동 — Riki R-1·검증 4회 후에야 PD-073 무죄 확정 (T3/A2/O4)
- A는 commit *시도* 차단, B는 충돌 *발생 후* 자동 해결 — 두 표면 동시 cover (T3/A2/O3)
- merge=ours driver는 git built-in 아님 → setup 스크립트로 `git config merge.ours.driver true` 1회 등록 필요

## PD 변동
- **PD-086 신규**: Hook의 main 워킹디렉토리 직접 write 경로 차단 (②경로 분리)
- **PD-073 무죄 확정**: in-process require 통합은 충돌 원인 아님 (3개 스크립트 __dirname ROOT 검증 완료)

## versionBump 확정
- 자동 감지 입력: `current_session.json.versionBumpSuggested` 확인 후 처리
- 본 세션 변경: decision_ledger.json (D-187 신규) + reports/ 신규 2종 (condensed.md · edi_rev1.md). 페르소나/정책/skill SKILL.md/CLAUDE.md/role memory 변경 0건.
- **Edi 판단**: capacity(+0.01) — decision_ledger 신규 항목 박제 (D-130 자동 감지 룰 매핑)
- **확정값**: +0.01
- **사유**: D-187 신규 박제 + PD-086 신규 등록 (capacity 확장)
- override 여부: suggested와 비교는 작성 후 hook 박제값 확인 필요 — 다르면 `overrideReason` 별도 박제

## 미해결 이슈·Gap
- setup 스크립트 1회 실행(merge.ours.driver 등록)은 별도 PD로 분리됨 — 미실행 시 .gitattributes 무력
- 실증 검증(Phase 6)은 다음 머지 사이클에서 확인

## 인계 메모
- 다음 세션 시작점: PD-086(②경로 차단) 처리 + setup 실행 PD 식별
- 본 토픽(topic_203) 종결 후보 — Master 승인 시 status=completed

[ROLE:edi]
# self-scores
scc: Y
cs_cnt: 4
art_cmp: 1
gap_fc: 0
