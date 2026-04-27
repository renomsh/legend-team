---
session: session_032
topic: agentsCompleted Hook 자동화
date: 2026-04-17
role: editor
rev: 1
---

# session_032 — agentsCompleted Hook 자동화 · 세션 종료 자동화 종합 점검

## 범위 확장 배경
Master가 dashboard 6개 이슈 제시 후 "다 확장해"로 세션 종료 자동화 종합 점검으로 확대.

## 구현 산출물

### 신규 파일
| 파일 | 역할 |
|---|---|
| `scripts/sync-system-state.ts` | session_index·topic_index·decision_ledger → system_state.json 자동 재계산 |
| `.claude/hooks/session-end-finalize.js` | current_session(closed) → session_index 자동 append |

### 수정 파일
| 파일 | 변경 내용 |
|---|---|
| `.claude/settings.json` | Hook 체인: tokens→finalize→compute-dashboard→build |
| `.claude/hooks/session-end-tokens.js` | 진단 로그(hook-diagnostics.log) 추가, 덮어쓰기→누산 변경 |
| `scripts/compute-dashboard.ts` | sessionDecisionIds Map 추가, total_billable=0 방어 |
| `app/dashboard-upgrade.html` | Cache Hit null 수정, Tokens KPI 카드 추가, 슬라이더 동적화, 하드코딩 제거, avg/세션 표기 |
| `.claude/commands/close.md` | 자동 단계 8~12 반영 |

## 결정사항
- D-029: SessionEnd Hook 체인 완성
- D-030: token_log 덮어쓰기 → 누산 정책 변경

## 검증 결과
- Cache Hit: 94.5% ✓
- Tokens KPI: 8.9M (1/31 세션) + avg 8.9M/세션 ✓
- 슬라이더: 1–31 dynamic ✓
- Deferrals: 6개 항목 ✓

## 이연
- PD-009: 이번 세션 종료 시 hook 발동 여부 + transcript_path 형식 검증 → `logs/hook-diagnostics.log`
