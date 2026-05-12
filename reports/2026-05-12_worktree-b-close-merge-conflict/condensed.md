---
role: zero
session: session_239
topic: topic_203
topicSlug: worktree-b-close-merge-conflict
date: 2026-05-12
format: condensed
turnId: 7
invocationMode: subagent
---

# Condensed — topic_203 워크트리 B 클로즈 머지 충돌 원인 분석

**진짜 원인**: main 워킹디렉토리 직접 작업 패턴 누적(eb3aaa9·0b14144·b4ec123·8e496d8) → 워크트리 B 클로즈 시 9종 공유 자산 양방향 변경 충돌.

**PD-073 무죄 확정**: in-process 통합(`runCloseInProcess`)은 본 충돌과 무관. Master 정정으로 확립.

**채택 결정 (A+B)**:
- **A**: pre-commit hook on main, `ALLOW_MAIN_COMMIT=1` 환경변수 우회. 일상적 main 직커밋 차단.
- **B**: `.gitattributes` `merge=ours` 9종 적용(dist·settings.local·topic_index·decision_ledger·master_first_state·dashboard_data·current_session·token_log·self_scores).

**Phase 분해(Arki)**: 1) hook 스크립트 + ENV gate → 2) .gitattributes 9종 박제 → 3) ours driver 등록 → 4) 검증(dry-run 머지) → 5) 문서 박제 → 6) PD-086 분리 처리.

**PD-086 분리**: hook의 main write 경로(②) 별도 토픽으로 격리. 본 세션 범위 외.

## 3 영역 정제

본 세션 산출물은 PD 등록·보고서 박제 중심(코드 변경 0건). tech-debt / security-review / simplify 해당 없음 — **DEFER**.

[ROLE:zero]
# self-scores
ref_cnt: 0
hc_found: 0
cln_rt: 1.0
