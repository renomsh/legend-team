---
sessionId: session_234
topicId: topic_197
grade: S
operationType: structured
date: 2026-05-10
refinedBy: zero
domains: [simplify]
---

# PD-069 병행세션·병행토픽 시스템 — Condensed (Zero Phase A)

## TL;DR
- **m\* prefix 별도 넘버링** (mtopic / msession / mD / mPD)으로 공식 SOT와 의도적 분리
- **msession ID = git worktree 이름**, 파일 분리(`m_decision_ledger_{worktreeId}.json` 등)
- **mtopic /close = "closed" 마킹만**, 같은 토픽 동시 오픈 금지 + lock check
- **자동 마이그레이션 옵션 A'**: 매 `/open` 시 closed msession 승격, non-blocking
- **migration.lock 폐기** — Master 시간차 운영으로 race 회피 (`/open` < 2초)

## 결정 흐름
| # | 결정 | 근거 |
|---|---|---|
| 1 | m\* prefix 별도 넘버링 | 공식 SOT 오염 방지 |
| 2 | msession = worktree 이름 | 식별자 충돌 0건 |
| 3 | mtopic 동시 오픈 금지 + lock | 충돌 회피 (Riki R-1 단순화) |
| 4 | 옵션 A' (자동 승격) | ROI 양수, Master 인지 부담 최소 |
| 5 | D-NNN 재발급 포기 | Fin: 30~40% 비용 절감 |

## 8 미티게이션
| # | 항목 | 처리 |
|---|---|---|
| 1 | 실패 모드 | non-blocking |
| 2 | 미리보기 | cosine ≥ 30% Master 확인, 미달 자동 통과 |
| 3 | 커밋 분리 | `migrate:` prefix |
| 4 | staging | 공유 경로 |
| 5 | schema 위반 | validate + `m_quarantine/` 격리 |
| 6 | cross-check | mD↔D 만 (mD↔mD 불요) |
| 7 | atomicity | 2-phase commit (.staging → fsync → rename) |
| 8 | 명령어 | `/open mtopic A "<title>"` 신규, `/open mtopic_XXXXX A` 재오픈 |

## 미해소·후속
- R-2(cosine 30% 임계) — 실측 후 조정 여지
- R-3(schema drift) — 격리 후 수동 검토 절차 미정
- R-4(mD↔D cross-check 빈도) — 운영 후 결정

## 정직 보고 (Agent 외 작성분)
Nexus 직접 작성: Jobs framing · Nova 투기 · Fin · Ace 종합 · Arki 1차 · Riki 1차.
Agent dispatch: **Arki 재검증**(옵션 A' 권고, MUST_NOW 4건) · **Riki 재검증**(R-1·R-5·R-6 폐기/단순화, R-2/R-3/R-4 잔존).

## versionBump
Nexus 자동 감지 → Edi 확정 (D-130 / D-143).
